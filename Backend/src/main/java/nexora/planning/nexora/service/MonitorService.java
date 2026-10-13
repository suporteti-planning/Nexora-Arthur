package nexora.planning.nexora.service;

import nexora.planning.nexora.dto.MonitorRequestDTO;
import nexora.planning.nexora.dto.MonitorResponseDTO;
import nexora.planning.nexora.dto.EmployeeBasicDTO;
import nexora.planning.nexora.enums.HardwareStatus;
import nexora.planning.nexora.model.Monitor;
import nexora.planning.nexora.model.Employee;
import nexora.planning.nexora.repository.HardwareRepository;
import nexora.planning.nexora.repository.MonitorRepository;
import nexora.planning.nexora.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.lang.NonNull;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MonitorService {
    private final MonitorRepository monitorRepository;
    private final HardwareRepository hardwareRepository;
    private final EmployeeRepository employeeRepository;

    @Transactional(readOnly = true)
    public List<MonitorResponseDTO> findAll() {
        return monitorRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional
    public MonitorResponseDTO create(MonitorRequestDTO request) {
        String serialNumber = request.getSerialNumber().trim();
        if (hardwareRepository.existsBySerialNumber(serialNumber)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe um equipamento com este número de série");
        }
        Monitor monitor = new Monitor();
        mapRequest(request, monitor);
        assignEmployee(request.getEmployeeId(), monitor);
        return toResponse(monitorRepository.save(monitor));
    }

    @Transactional
    public MonitorResponseDTO update(@NonNull Long id, MonitorRequestDTO request) {
        Monitor monitor = monitorRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Monitor não encontrado"));
        String serialNumber = request.getSerialNumber().trim();
        if (!monitor.getSerialNumber().equals(serialNumber)
                && hardwareRepository.existsBySerialNumber(serialNumber)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Já existe um equipamento com este número de série");
        }
        mapRequest(request, monitor);
        assignEmployee(request.getEmployeeId(), monitor);
        return toResponse(monitorRepository.save(monitor));
    }

    @Transactional
    public void delete(@NonNull Long id) {
        if (!monitorRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Monitor não encontrado");
        }
        monitorRepository.deleteById(id);
    }

    private void mapRequest(MonitorRequestDTO request, Monitor monitor) {
        monitor.setName(request.getName().trim());
        monitor.setBrand(request.getBrand().trim());
        monitor.setModel(request.getModel().trim());
        monitor.setSerialNumber(request.getSerialNumber().trim());
        monitor.setObservations(request.getObservations());
        monitor.setPrice(request.getPrice());
        monitor.setCostCenter(request.getCostCenter());
        monitor.setStatus(HardwareStatus.valueOf(request.getStatus().name()));
    }

    private void assignEmployee(Long employeeId, Monitor monitor) {
        if (employeeId == null) {
            monitor.setEmployee(null);
            return;
        }
        Employee employee = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Colaborador não encontrado"));
        if (employee.getStatus() != nexora.planning.nexora.enums.EmployeeStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Não é possível vincular um colaborador inativo");
        }
        monitor.setEmployee(employee);
    }

    private MonitorResponseDTO toResponse(Monitor monitor) {
        MonitorResponseDTO response = new MonitorResponseDTO();
        response.setId(monitor.getId());
        response.setName(monitor.getName());
        response.setBrand(monitor.getBrand());
        response.setModel(monitor.getModel());
        response.setSerialNumber(monitor.getSerialNumber());
        response.setObservations(monitor.getObservations());
        response.setPrice(monitor.getPrice());
        response.setCostCenter(monitor.getCostCenter());
        response.setStatus(nexora.planning.nexora.enums.MonitorStatus.valueOf(monitor.getStatus().name()));
        if (monitor.getEmployee() != null) {
            EmployeeBasicDTO employee = new EmployeeBasicDTO();
            employee.setId(monitor.getEmployee().getId());
            employee.setName(monitor.getEmployee().getName());
            employee.setEmail(monitor.getEmployee().getEmail());
            employee.setPosition(monitor.getEmployee().getPosition());
            employee.setDepartment(monitor.getEmployee().getDepartment());
            response.setEmployee(employee);
        }
        return response;
    }
}
