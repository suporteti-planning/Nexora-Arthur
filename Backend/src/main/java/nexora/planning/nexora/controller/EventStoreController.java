package nexora.planning.nexora.controller;

import nexora.planning.nexora.dto.EventStoreDTO;
import nexora.planning.nexora.service.EventStoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventStoreController {

    private final EventStoreService eventStoreService;

    @GetMapping("/notebooks/{notebookId}")
    public ResponseEntity<List<EventStoreDTO>> getNotebookTimeline(
            @PathVariable Long notebookId) {
        return ResponseEntity.ok(eventStoreService.getNotebookTimeline(notebookId));
    }

    @GetMapping("/notebooks/{notebookId}/assignments")
    public ResponseEntity<List<EventStoreDTO>> getNotebookAssignments(
            @PathVariable Long notebookId) {
        return ResponseEntity.ok(eventStoreService.getNotebookAssignmentHistory(notebookId));
    }

    @GetMapping("/notebooks/{notebookId}/maintenances")
    public ResponseEntity<List<EventStoreDTO>> getNotebookMaintenances(
            @PathVariable Long notebookId) {
        return ResponseEntity.ok(eventStoreService.getNotebookMaintenanceHistory(notebookId));
    }

    @GetMapping("/employees/{employeeId}")
    public ResponseEntity<List<EventStoreDTO>> getEmployeeTimeline(
            @PathVariable Long employeeId) {
        return ResponseEntity.ok(eventStoreService.getEmployeeTimeline(employeeId));
    }

    @GetMapping("/employees/{employeeId}/licenses")
    public ResponseEntity<List<EventStoreDTO>> getEmployeeLicenses(
            @PathVariable Long employeeId) {
        return ResponseEntity.ok(eventStoreService.getEmployeeLicenseHistory(employeeId));
    }

    @GetMapping("/notebooks/{notebookId}/paginated")
    public ResponseEntity<Page<EventStoreDTO>> getNotebookTimelinePaginated(
            @PathVariable Long notebookId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(eventStoreService.getNotebookTimelinePaginated(notebookId, pageable));
    }
}