package nexora.planning.nexora.service;

import nexora.planning.nexora.dto.EmployeePatchDTO;
import nexora.planning.nexora.dto.EmployeeRequestDTO;
import nexora.planning.nexora.dto.EmployeeResponseDTO;
import nexora.planning.nexora.dto.NotebookPatchDTO;
import nexora.planning.nexora.enums.costCenter;
import nexora.planning.nexora.enums.EmployeeStatus;
import nexora.planning.nexora.enums.MicrosoftLicense;
import nexora.planning.nexora.model.Employee;
import nexora.planning.nexora.model.Notebook;
import nexora.planning.nexora.repository.EmployeeRepository;
import nexora.planning.nexora.repository.NotebookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final NotebookRepository notebookRepository;
    private final EventStoreService eventStoreService;

    public List<EmployeeResponseDTO> findAll() {
        return employeeRepository.findAll()
            .stream()
            .map(EmployeeResponseDTO::new)
            .collect(Collectors.toList());
    }

    public EmployeeResponseDTO findById(Long id) {
        Employee employee = employeeRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Funcionário não encontrado"));
        return new EmployeeResponseDTO(employee);
    }

    public List<EmployeeResponseDTO> findByCostCenter(costCenter costCenter) {
        return employeeRepository.findByCostCenter(costCenter)
            .stream()
            .map(EmployeeResponseDTO::new)
            .collect(Collectors.toList());
    }

    public List<EmployeeResponseDTO> findByStatus(EmployeeStatus status) {
        return employeeRepository.findByStatus(status)
            .stream()
            .map(EmployeeResponseDTO::new)
            .collect(Collectors.toList());
    }

    public List<EmployeeResponseDTO> findByMicrosoftLicense(MicrosoftLicense license) {
        return employeeRepository.findByMicrosoftLicense(license)
            .stream()
            .map(EmployeeResponseDTO::new)
            .collect(Collectors.toList());
    }

    @Transactional
    public EmployeeResponseDTO create(EmployeeRequestDTO requestDTO) {

        if (employeeRepository.existsByCpf(requestDTO.getCpf())) {
            throw new RuntimeException("Já existe um funcionário com este CPF");
        }

        if (employeeRepository.existsByEmail(requestDTO.getEmail())) {
            throw new RuntimeException("Já existe um funcionário com este email");
        }

        Employee employee = new Employee();
        mapToEntity(requestDTO, employee);
        
        if (requestDTO.getStatus() == EmployeeStatus.ACTIVE && requestDTO.getAdmissionDate() == null) {
            employee.setAdmissionDate(LocalDate.now());
        }
        
        if (employee.getMicrosoftLicenses() == null) {
            employee.setMicrosoftLicenses(new HashSet<>());
        }
        
        employee = employeeRepository.save(employee);
        assignNotebook(employee, requestDTO.getNotebookId());

        if (requestDTO.getMicrosoftLicenses() != null) {
            for (MicrosoftLicense license : requestDTO.getMicrosoftLicenses()) {
                eventStoreService.logLicenseAdded(
                    employee, 
                    license.getDisplayName(), 
                    "Atribuição inicial", 
                    "Sistema"
                );
            }
        }

        return new EmployeeResponseDTO(employee);
    }

    @Transactional
    public EmployeeResponseDTO update(Long id, EmployeeRequestDTO requestDTO) {
        Employee employee = employeeRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Funcionário não encontrado"));
        
        if (!employee.getEmail().equals(requestDTO.getEmail()) &&
            employeeRepository.existsByEmail(requestDTO.getEmail())) {
            throw new RuntimeException("Já existe um funcionário com este email");
        }

        if (!employee.getCpf().equals(requestDTO.getCpf()) &&
            employeeRepository.existsByCpf(requestDTO.getCpf())) {
            throw new RuntimeException("Já existe um funcionário com este CPF");
        }

        // ✅ REGISTRAR EVENTO: MUDANÇA DE CENTRO DE CUSTO
        if (requestDTO.getCostCenter() != null && 
            !employee.getCostCenter().equals(requestDTO.getCostCenter())) {
            eventStoreService.logEmployeeCostCenterChanged(
                employee,
                employee.getCostCenter().getDisplayName(),
                requestDTO.getCostCenter().getDisplayName(),
                "Atualização de centro de custo",
                "Sistema"
            );
        }

        if (requestDTO.getStatus() != null && 
            employee.getStatus() != requestDTO.getStatus()) {
            eventStoreService.logEmployeeStatusChanged(
                employee,
                employee.getStatus().getDisplayName(),
                requestDTO.getStatus().getDisplayName(),
                "Atualização de status",
                "Sistema"
            );
        }

        updateLicenses(employee, requestDTO.getMicrosoftLicenses());

        if (employee.getStatus() == EmployeeStatus.ACTIVE && 
            requestDTO.getStatus() == EmployeeStatus.INACTIVE) {
            employee.setTerminationDate(LocalDate.now());
        }

        if (employee.getStatus() == EmployeeStatus.INACTIVE && 
            requestDTO.getStatus() == EmployeeStatus.ACTIVE) {
            employee.setAdmissionDate(LocalDate.now());
            employee.setTerminationDate(null);
        }

        mapToEntity(requestDTO, employee);
        if (requestDTO.getNotebookId() != null) {
            assignNotebook(employee, requestDTO.getNotebookId());
        }
        employee = employeeRepository.save(employee);
        return new EmployeeResponseDTO(employee);
    }

    @Transactional
    public void delete(Long id) {
        Employee employee = employeeRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Funcionário não encontrado"));
        
        if (employee.getNotebook() != null) {
            eventStoreService.logNotebookUnassigned(
                employee.getNotebook(), 
                employee, 
                "Funcionário removido do sistema", 
                "Sistema"
            );
            employee.getNotebook().setEmployee(null);
        }
        
        employeeRepository.delete(employee);
    }


    @Transactional
    public EmployeeResponseDTO patch(Long id, EmployeePatchDTO patchDTO) {
        Employee employee = employeeRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Funcionário não encontrado"));

        if (patchDTO.getName() != null && !patchDTO.getName().equals(employee.getName())) {
            employee.setName(patchDTO.getName());
        }

        if (patchDTO.getEmail() != null) {
            if (!employee.getEmail().equals(patchDTO.getEmail()) &&
                employeeRepository.existsByEmail(patchDTO.getEmail())) {
                throw new RuntimeException("Já existe um funcionário com este email");
            }
            employee.setEmail(patchDTO.getEmail());
        }
        
        if (patchDTO.getCpf() != null) {
            if (!employee.getCpf().equals(patchDTO.getCpf()) &&
                employeeRepository.existsByCpf(patchDTO.getCpf())) {
                throw new RuntimeException("Já existe um funcionário com este CPF");
            }
            employee.setCpf(patchDTO.getCpf());
        }

        if (patchDTO.getPosition() != null) {
            employee.setPosition(patchDTO.getPosition());
        }

        if (patchDTO.getDepartment() != null) {
            employee.setDepartment(patchDTO.getDepartment());
        }

        if (patchDTO.getLeader() != null) {
            employee.setLeader(patchDTO.getLeader());
        }

        if (patchDTO.getCostCenter() != null && 
            !employee.getCostCenter().equals(patchDTO.getCostCenter())) {
            eventStoreService.logEmployeeCostCenterChanged(
                employee,
                employee.getCostCenter().getDisplayName(),
                patchDTO.getCostCenter().getDisplayName(),
                "Patch de centro de custo",
                "Sistema"
            );
            employee.setCostCenter(patchDTO.getCostCenter());
        }

        if (patchDTO.getStatus() != null && 
            employee.getStatus() != patchDTO.getStatus()) {
            eventStoreService.logEmployeeStatusChanged(
                employee,
                employee.getStatus().getDisplayName(),
                patchDTO.getStatus().getDisplayName(),
                "Patch de status",
                "Sistema"
            );
            
            if (employee.getStatus() == EmployeeStatus.ACTIVE && 
                patchDTO.getStatus() == EmployeeStatus.INACTIVE) {
                employee.setTerminationDate(LocalDate.now());
            }

            if (employee.getStatus() == EmployeeStatus.INACTIVE && 
                patchDTO.getStatus() == EmployeeStatus.ACTIVE) {
                employee.setAdmissionDate(LocalDate.now());
                employee.setTerminationDate(null);
            }
            employee.setStatus(patchDTO.getStatus());
        }

        if (patchDTO.getAdmissionDate() != null) {
            employee.setAdmissionDate(patchDTO.getAdmissionDate());
        }

        if (patchDTO.getTerminationDate() != null) {
            employee.setTerminationDate(patchDTO.getTerminationDate());
        }

        if (patchDTO.getMicrosoftLicenses() != null) {
            updateLicenses(employee, new HashSet<>(patchDTO.getMicrosoftLicenses()));
            employee.setMicrosoftLicenses(new HashSet<>(patchDTO.getMicrosoftLicenses()));
        }

        if (patchDTO.getNotebook() != null) {
            NotebookPatchDTO nbPatch = patchDTO.getNotebook();
            if (employee.getNotebook() == null) {
                Notebook notebook = new Notebook();
                notebook.setEmployee(employee);
                employee.setNotebook(notebook);
            }
        
            if (nbPatch.getName() != null) {
                employee.getNotebook().setName(nbPatch.getName());
            }
            if (nbPatch.getBrand() != null) {
                employee.getNotebook().setBrand(nbPatch.getBrand());
            }
            if (nbPatch.getModel() != null) {
                employee.getNotebook().setModel(nbPatch.getModel());
            }
            if (nbPatch.getSerialNumber() != null) {
                employee.getNotebook().setSerialNumber(nbPatch.getSerialNumber());
            }
            if (nbPatch.getStatus() != null) {
                employee.getNotebook().setStatus(nbPatch.getStatus());
            }
            if (nbPatch.getObservations() != null) {
                employee.getNotebook().setObservations(nbPatch.getObservations());
            }
        }

        employee = employeeRepository.save(employee);
        return new EmployeeResponseDTO(employee);
    }

    // Métodos auxiliares

    private void updateLicenses(Employee employee, java.util.Set<MicrosoftLicense> newLicenses) {
        if (newLicenses == null) {
            newLicenses = new HashSet<>();
        }
        
        java.util.Set<MicrosoftLicense> oldLicenses = employee.getMicrosoftLicenses();
        
        // Licenças removidas
        for (MicrosoftLicense license : oldLicenses) {
            if (!newLicenses.contains(license)) {
                eventStoreService.logLicenseRemoved(
                    employee, 
                    license.getDisplayName(), 
                    "Licença removida", 
                    "Sistema"
                );
            }
        }
        
        // Licenças adicionadas
        for (MicrosoftLicense license : newLicenses) {
            if (!oldLicenses.contains(license)) {
                eventStoreService.logLicenseAdded(
                    employee, 
                    license.getDisplayName(), 
                    "Licença adicionada", 
                    "Sistema"
                );
            }
        }
        
        employee.setMicrosoftLicenses(newLicenses);
    }

    private void mapToEntity(EmployeeRequestDTO dto, Employee entity) {
        entity.setName(dto.getName());
        entity.setEmail(dto.getEmail());
        entity.setCpf(dto.getCpf());
        entity.setPosition(dto.getPosition());
        entity.setDepartment(dto.getDepartment());
        entity.setLeader(dto.getLeader());
        entity.setCostCenter(dto.getCostCenter());
        entity.setMicrosoftLicenses(dto.getMicrosoftLicenses() != null ? 
            new HashSet<>(dto.getMicrosoftLicenses()) : new HashSet<>());
        entity.setStatus(dto.getStatus());
        
        if (dto.getAdmissionDate() != null) {
            entity.setAdmissionDate(dto.getAdmissionDate());
        }
        if (dto.getTerminationDate() != null) {
            entity.setTerminationDate(dto.getTerminationDate());
        }
    }

    private void assignNotebook(Employee employee, Long notebookId) {
        if (notebookId == null) {
            return;
        }

        Notebook notebook = notebookRepository.findById(notebookId)
            .orElseThrow(() -> new RuntimeException("Notebook não encontrado"));

        if (employee.getNotebook() != null && !employee.getNotebook().getId().equals(notebookId)) {
            eventStoreService.logNotebookUnassigned(
                employee.getNotebook(), 
                employee, 
                "Notebook substituído", 
                "Sistema"
            );
            employee.getNotebook().setEmployee(null);
        }

        if (notebook.getEmployee() != null && !notebook.getEmployee().getId().equals(employee.getId())) {
            eventStoreService.logNotebookUnassigned(
                notebook, 
                notebook.getEmployee(), 
                "Notebook realocado", 
                "Sistema"
            );
            notebook.getEmployee().setNotebook(null);
        }

        notebook.setEmployee(employee);
        employee.setNotebook(notebook);
        notebookRepository.save(notebook);

        eventStoreService.logNotebookAssigned(notebook, employee, "Atribuição via employee", "Sistema");
    }
}