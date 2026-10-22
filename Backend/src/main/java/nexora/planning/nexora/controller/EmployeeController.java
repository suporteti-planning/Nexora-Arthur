package nexora.planning.nexora.controller;

import nexora.planning.nexora.dto.EmployeeRequestDTO;
import nexora.planning.nexora.dto.EmployeeBasicDTO;
import nexora.planning.nexora.dto.EmployeeResponseDTO;
import nexora.planning.nexora.dto.EmployeePatchDTO;
import nexora.planning.nexora.dto.MicrosoftUserProvisionRequest;
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
import java.util.Map;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    @GetMapping
    public ResponseEntity<List<EmployeeResponseDTO>> getAll() {
        return ResponseEntity.ok(employeeService.findAll());
    }

    @GetMapping("/search")
    public ResponseEntity<List<EmployeeBasicDTO>> searchActive(@RequestParam String query) {
        return ResponseEntity.ok(employeeService.searchActiveEmployees(query));
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

    @GetMapping("/email/availability")
    public ResponseEntity<Map<String, Boolean>> isEmailAvailable(@RequestParam String email) {
        return ResponseEntity.ok(Map.of("available", employeeService.isEmailAvailable(email)));
    }

    @PostMapping
    public ResponseEntity<EmployeeResponseDTO> create(@Valid @RequestBody EmployeeRequestDTO requestDTO) {
        EmployeeResponseDTO created = employeeService.create(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> badRequest(IllegalArgumentException exception) {
        return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
    }

    @PostMapping("/{id}/microsoft-account")
    public ResponseEntity<EmployeeResponseDTO> provisionMicrosoftAccount(
        @PathVariable Long id,
        @Valid @RequestBody MicrosoftUserProvisionRequest request
    ) {
        return ResponseEntity.ok(employeeService.provisionMicrosoftAccount(id, request.password()));
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