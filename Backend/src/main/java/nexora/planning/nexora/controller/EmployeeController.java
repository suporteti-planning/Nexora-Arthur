package nexora.planning.nexora.controller;

import nexora.planning.nexora.dto.EmployeeRequestDTO;
import nexora.planning.nexora.dto.EmployeeResponseDTO;
import nexora.planning.nexora.dto.EmployeePatchDTO;
import nexora.planning.nexora.enums.costCenter;
import nexora.planning.nexora.enums.EmployeeStatus;
import nexora.planning.nexora.enums.MicrosoftLicense;
import nexora.planning.nexora.service.EmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    @GetMapping
    public ResponseEntity<List<EmployeeResponseDTO>> getAll() {
        return ResponseEntity.ok(employeeService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.findById(id));
    }

    @GetMapping("/cost-center/{costCenter}")
    public ResponseEntity<List<EmployeeResponseDTO>> getByCostCenter(@PathVariable costCenter costCenter) {
        return ResponseEntity.ok(employeeService.findByCostCenter(costCenter));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<EmployeeResponseDTO>> getByStatus(@PathVariable EmployeeStatus status) {
        return ResponseEntity.ok(employeeService.findByStatus(status));
    }

    @GetMapping("/license/{license}")
    public ResponseEntity<List<EmployeeResponseDTO>> getByLicense(@PathVariable MicrosoftLicense license) {
        return ResponseEntity.ok(employeeService.findByMicrosoftLicense(license));
    }

    @PostMapping
    public ResponseEntity<EmployeeResponseDTO> create(@Valid @RequestBody EmployeeRequestDTO requestDTO) {
        EmployeeResponseDTO created = employeeService.create(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmployeeResponseDTO> update(@PathVariable Long id, @Valid @RequestBody EmployeeRequestDTO requestDTO) {
        EmployeeResponseDTO updated = employeeService.update(id, requestDTO);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        employeeService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}")
    public ResponseEntity<EmployeeResponseDTO> patch(@PathVariable Long id, @Valid @RequestBody EmployeePatchDTO patchDTO) {
        EmployeeResponseDTO updated = employeeService.patch(id, patchDTO);
        return ResponseEntity.ok(updated);
    }
}