package nexora.planning.nexora.controller;

import nexora.planning.nexora.dto.NotebookRequestDTO;
import nexora.planning.nexora.dto.NotebookResponseDTO;
import nexora.planning.nexora.enums.costCenter;
import nexora.planning.nexora.enums.NotebookStatus;
import nexora.planning.nexora.service.NotebookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notebooks")
@RequiredArgsConstructor
public class NotebookController {

    private final NotebookService notebookService;

    @GetMapping
    public ResponseEntity<List<NotebookResponseDTO>> getAll() {
        return ResponseEntity.ok(notebookService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<NotebookResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(notebookService.findById(id));
    }

    @GetMapping("/cost-center/{costCenter}")
    public ResponseEntity<List<NotebookResponseDTO>> getByCostCenter(@PathVariable costCenter costCenter) {
        return ResponseEntity.ok(notebookService.findByCostCenter(costCenter));
    }

    @GetMapping("/available")
    public ResponseEntity<List<NotebookResponseDTO>> getAvailable() {
        return ResponseEntity.ok(notebookService.findAvailable());
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<NotebookResponseDTO>> getByStatus(@PathVariable NotebookStatus status) {
        return ResponseEntity.ok(notebookService.findByStatus(status));
    }

    @GetMapping("/price/{price}")
    public ResponseEntity<List<NotebookResponseDTO>> getByPrice(@PathVariable Double price) {
        return ResponseEntity.ok(notebookService.findByPrice(price));
    }

    @PostMapping
    public ResponseEntity<NotebookResponseDTO> create(@Valid @RequestBody NotebookRequestDTO requestDTO) {
        NotebookResponseDTO created = notebookService.create(requestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/{notebookId}/assign/{employeeId}")
    public ResponseEntity<NotebookResponseDTO> assignEmployee(
            @PathVariable Long notebookId, 
            @PathVariable Long employeeId) {
        NotebookResponseDTO assigned = notebookService.assignEmployee(notebookId, employeeId);
        return ResponseEntity.ok(assigned);
    }

    @PutMapping("/{id}")
    public ResponseEntity<NotebookResponseDTO> update(@PathVariable Long id, @Valid @RequestBody NotebookRequestDTO requestDTO) {
        NotebookResponseDTO updated = notebookService.update(id, requestDTO);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        notebookService.delete(id);
        return ResponseEntity.noContent().build();
    }
}