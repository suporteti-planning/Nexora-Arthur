package nexora.planning.nexora.service;

import nexora.planning.nexora.dto.EmployeeBasicDTO;
import nexora.planning.nexora.dto.NotebookRequestDTO;
import nexora.planning.nexora.dto.NotebookResponseDTO;
import nexora.planning.nexora.enums.costCenter;
import nexora.planning.nexora.enums.HardwareStatus;
import nexora.planning.nexora.model.Employee;
import nexora.planning.nexora.model.Notebook;
import nexora.planning.nexora.repository.EmployeeRepository;
import nexora.planning.nexora.repository.NotebookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotebookService {

    private final NotebookRepository notebookRepository;
    private final EmployeeRepository employeeRepository;
    private final EventStoreService eventStoreService; // ADICIONADO

    public List<NotebookResponseDTO> findAll() {
        return notebookRepository.findAll()
            .stream()
            .map(this::toResponseDTO)
            .collect(Collectors.toList());
    }

    public NotebookResponseDTO findById(@NonNull Long id) {
        Notebook notebook = notebookRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Notebook não encontrado"));
        return toResponseDTO(notebook);
    }

    public List<NotebookResponseDTO> findByCostCenter(costCenter costCenter) {
        return notebookRepository.findByCostCenter(costCenter)
            .stream()
            .map(this::toResponseDTO)
            .collect(Collectors.toList());
    }

    public List<NotebookResponseDTO> findByStatus(HardwareStatus status) {
        return notebookRepository.findByStatus(status)
            .stream()
            .map(this::toResponseDTO)
            .collect(Collectors.toList());
    }

    public List<NotebookResponseDTO> findByPrice(Double price) {
        return notebookRepository.findByPrice(price)
            .stream()
            .map(this::toResponseDTO)
            .collect(Collectors.toList());
    }

    public List<NotebookResponseDTO> findAvailable() {
        return notebookRepository.findByEmployeeIsNull()
            .stream()
            .map(this::toResponseDTO)
            .collect(Collectors.toList());
    }

    @Transactional
    public NotebookResponseDTO create(NotebookRequestDTO requestDTO) {
        if (notebookRepository.existsBySerialNumber(requestDTO.getSerialNumber())) {
            throw new RuntimeException("Já existe um notebook com este número de série");
        }

        Notebook notebook = new Notebook();
        mapToEntity(requestDTO, notebook);

        Long requestedEmployeeId = requestDTO.getEmployeeId();
        if (requestedEmployeeId != null) {
            Employee employee = employeeRepository.findById(requestedEmployeeId)
                .orElseThrow(() -> new RuntimeException("Funcionário não encontrado"));
            
            notebook.setEmployee(employee);
            employee.setNotebook(notebook);
        }

        notebook = notebookRepository.save(notebook);

        eventStoreService.logNotebookCreated(notebook, "Sistema");

        if (requestedEmployeeId != null) {
            Employee employee = employeeRepository.findById(requestedEmployeeId)
                .orElseThrow(() -> new RuntimeException("Funcionário não encontrado"));
            eventStoreService.logNotebookAssigned(notebook, employee, "Atribuição inicial", "Sistema");
        }

        return toResponseDTO(notebook);
    }

    @Transactional
    public NotebookResponseDTO update(@NonNull Long id, NotebookRequestDTO requestDTO) {
        Notebook notebook = notebookRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Notebook não encontrado"));

        if (!notebook.getSerialNumber().equals(requestDTO.getSerialNumber()) &&
            notebookRepository.existsBySerialNumber(requestDTO.getSerialNumber())) {
            throw new RuntimeException("Já existe um notebook com este número de série");
        }

        logNotebookChanges(notebook, requestDTO);
        mapToEntity(requestDTO, notebook);
        
        Long requestedEmployeeId = requestDTO.getEmployeeId();
        if (requestedEmployeeId != null) {
            Employee employee = employeeRepository.findById(requestedEmployeeId)
                .orElseThrow(() -> new RuntimeException("Funcionário não encontrado"));
            
            // Desvincular notebook anterior se existir
            if (notebook.getEmployee() != null) {
                eventStoreService.logNotebookUnassigned(
                    notebook, 
                    notebook.getEmployee(), 
                    "Realocação de notebook", 
                    "Sistema"
                );
                notebook.getEmployee().setNotebook(null);
            }
            
            // Desvincular notebook anterior do funcionário se existir
            if (employee.getNotebook() != null) {
                employee.getNotebook().setEmployee(null);
            }
            
            notebook.setEmployee(employee);
            employee.setNotebook(notebook);
            
            eventStoreService.logNotebookAssigned(notebook, employee, "Atualização de atribuição", "Sistema");
            
        } else {
            if (notebook.getEmployee() != null) {
                eventStoreService.logNotebookUnassigned(
                    notebook, 
                    notebook.getEmployee(), 
                    "Desvinculação de notebook", 
                    "Sistema"
                );
                notebook.getEmployee().setNotebook(null);
            }
            notebook.setEmployee(null);
        }

        notebook = notebookRepository.save(notebook);
        return toResponseDTO(notebook);
    }

    private void logNotebookChanges(Notebook notebook, NotebookRequestDTO requestDTO) {
        if (!Objects.equals(notebook.getStatus(), requestDTO.getStatus())) {
            eventStoreService.logNotebookStatusChanged(
                notebook,
                notebook.getStatus().name(),
                requestDTO.getStatus().name(),
                "Sistema");

            if (requestDTO.getStatus() == HardwareStatus.MAINTENANCE) {
                eventStoreService.logNotebookMaintenanceAdded(
                    notebook,
                    "REPARO",
                    "Manutenção registrada pela alteração de status",
                    requestDTO.getMaintenanceDefect(),
                    requestDTO.getMaintenanceSolution() != null && !requestDTO.getMaintenanceSolution().isBlank()
                        ? requestDTO.getMaintenanceSolution()
                        : "Não informada",
                    "Sistema",
                    null,
                    "Sistema");
            }
        }

        logNotebookSpecChange(notebook, requestDTO, "Nome", notebook.getName(), requestDTO.getName());
        logNotebookSpecChange(notebook, requestDTO, "Marca", notebook.getBrand(), requestDTO.getBrand());
        logNotebookSpecChange(notebook, requestDTO, "Modelo", notebook.getModel(), requestDTO.getModel());
        logNotebookSpecChange(notebook, requestDTO, "Número de série", notebook.getSerialNumber(), requestDTO.getSerialNumber());
        logNotebookSpecChange(notebook, requestDTO, "Processador", notebook.getProcessor(), requestDTO.getProcessor());
        logNotebookSpecChange(notebook, requestDTO, "Memória RAM", notebook.getRam(), requestDTO.getRam());
        logNotebookSpecChange(notebook, requestDTO, "Armazenamento", notebook.getStorage(), requestDTO.getStorage());
        logNotebookSpecChange(notebook, requestDTO, "Sistema operacional", notebook.getOperatingSystem(), requestDTO.getOperatingSystem());
        logNotebookSpecChange(notebook, requestDTO, "Centro de custo", notebook.getCostCenter(), requestDTO.getCostCenter());
        logNotebookSpecChange(notebook, requestDTO, "Preço", notebook.getPrice(), requestDTO.getPrice());
    }

    private void logNotebookSpecChange(Notebook notebook, NotebookRequestDTO requestDTO,
                                       String field, Object oldValue, Object newValue) {
        if (!Objects.equals(oldValue, newValue)) {
            eventStoreService.logNotebookSpecUpdated(
                notebook,
                field,
                String.valueOf(oldValue),
                String.valueOf(newValue),
                "Atualização via formulário",
                "Sistema");
        }
    }

    @Transactional
    public NotebookResponseDTO assignEmployee(@NonNull Long notebookId, @NonNull Long employeeId) {
        Notebook notebook = notebookRepository.findById(notebookId)
            .orElseThrow(() -> new RuntimeException("Notebook não encontrado"));
        
        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new RuntimeException("Funcionário não encontrado"));
        
        if (notebook.getEmployee() != null && !notebook.getEmployee().getId().equals(employeeId)) {
            eventStoreService.logNotebookUnassigned(
                notebook, 
                notebook.getEmployee(), 
                "Realocação para " + employee.getName(), 
                "Sistema"
            );
            notebook.getEmployee().setNotebook(null);
        }

        if (employee.getNotebook() != null) {
            eventStoreService.logNotebookUnassigned(
                employee.getNotebook(), 
                employee, 
                "Substituição por novo notebook", 
                "Sistema"
            );
            employee.getNotebook().setEmployee(null);
        }
        
        notebook.setEmployee(employee);
        employee.setNotebook(notebook);
        
        notebook = notebookRepository.save(notebook);
        
        eventStoreService.logNotebookAssigned(notebook, employee, "Atribuição manual", "Sistema");
        
        return toResponseDTO(notebook);
    }

    @Transactional
    public NotebookResponseDTO assignByEmail(String notebookName, String employeeEmail) {
        Notebook notebook = notebookRepository.findByName(notebookName)
            .orElseThrow(() -> new RuntimeException("Notebook não encontrado com o nome: " + notebookName));

        Employee employee = employeeRepository.findByEmail(employeeEmail)
            .orElseThrow(() -> new RuntimeException("Funcionário não encontrado com o email: " + employeeEmail));

        return assignEmployee(notebook.getId(), employee.getId());
    }

    @Transactional
    public void delete(@NonNull Long id) {
        Notebook notebook = notebookRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Notebook não encontrado"));
        
        if (notebook.getEmployee() != null) {
            eventStoreService.logNotebookUnassigned(
                notebook, 
                notebook.getEmployee(), 
                "Notebook removido do sistema", 
                "Sistema"
            );
            notebook.getEmployee().setNotebook(null);
        }
        
        notebookRepository.delete(notebook);
    }

    // Métodos auxiliares

    private void mapToEntity(NotebookRequestDTO dto, Notebook entity) {
        entity.setName(dto.getName());
        entity.setBrand(dto.getBrand());
        entity.setModel(dto.getModel());
        entity.setSerialNumber(dto.getSerialNumber());
        entity.setProcessor(dto.getProcessor());
        entity.setRam(dto.getRam());
        entity.setStorage(dto.getStorage());
        entity.setOperatingSystem(dto.getOperatingSystem());
        entity.setObservations(dto.getObservations());
        entity.setStatus(dto.getStatus());
        entity.setCostCenter(dto.getCostCenter());
        entity.setPrice(dto.getPrice());
    }

    private NotebookResponseDTO toResponseDTO(Notebook notebook) {
        NotebookResponseDTO dto = new NotebookResponseDTO();
        dto.setId(notebook.getId());
        dto.setName(notebook.getName());
        dto.setBrand(notebook.getBrand());
        dto.setModel(notebook.getModel());
        dto.setSerialNumber(notebook.getSerialNumber());
        dto.setProcessor(notebook.getProcessor());
        dto.setRam(notebook.getRam());
        dto.setStorage(notebook.getStorage());
        dto.setOperatingSystem(notebook.getOperatingSystem());
        dto.setObservations(notebook.getObservations());
        dto.setStatus(notebook.getStatus());
        dto.setCostCenter(notebook.getCostCenter());
        dto.setPrice(notebook.getPrice());

        if (notebook.getEmployee() != null) {
            EmployeeBasicDTO empDTO = new EmployeeBasicDTO();
            empDTO.setId(notebook.getEmployee().getId());
            empDTO.setName(notebook.getEmployee().getName());
            empDTO.setEmail(notebook.getEmployee().getEmail());
            empDTO.setPosition(notebook.getEmployee().getPosition());
            empDTO.setDepartment(notebook.getEmployee().getDepartment());
            dto.setEmployee(empDTO);
        }

        return dto;
    }
}