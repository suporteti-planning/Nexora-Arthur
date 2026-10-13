package nexora.planning.nexora.controller;

import nexora.planning.nexora.dto.UserAdminDTO;
import nexora.planning.nexora.service.UserAdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Painel administrativo de usuários — exclusivo de TI e Admin.
 */
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TI','ADMIN')")
public class UserAdminController {

    private final UserAdminService service;

    @GetMapping
    public ResponseEntity<Page<UserAdminDTO.Response>> list(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "30") int size) {
        return ResponseEntity.ok(service.list(
            PageRequest.of(page, size, Sort.by("fullName").ascending())));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserAdminDTO.Response> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    public ResponseEntity<UserAdminDTO.Response> create(@Valid @RequestBody UserAdminDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserAdminDTO.Response> update(
            @PathVariable Long id,
            @Valid @RequestBody UserAdminDTO dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<UserAdminDTO.Response> activate(@PathVariable Long id) {
        return ResponseEntity.ok(service.setActive(id, true));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<UserAdminDTO.Response> deactivate(@PathVariable Long id) {
        return ResponseEntity.ok(service.setActive(id, false));
    }
}
