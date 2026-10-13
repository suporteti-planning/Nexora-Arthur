package nexora.planning.nexora.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import nexora.planning.nexora.dto.MonitorRequestDTO;
import nexora.planning.nexora.dto.MonitorResponseDTO;
import nexora.planning.nexora.service.MonitorService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/monitors")
@RequiredArgsConstructor
public class MonitorController {
    private final MonitorService monitorService;

    @GetMapping
    public List<MonitorResponseDTO> list() {
        return monitorService.findAll();
    }

    @PostMapping
    public ResponseEntity<MonitorResponseDTO> create(@Valid @RequestBody MonitorRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(monitorService.create(request));
    }

    @PutMapping("/{id}")
    public MonitorResponseDTO update(@PathVariable @NonNull Long id, @Valid @RequestBody MonitorRequestDTO request) {
        return monitorService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable @NonNull Long id) {
        monitorService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
