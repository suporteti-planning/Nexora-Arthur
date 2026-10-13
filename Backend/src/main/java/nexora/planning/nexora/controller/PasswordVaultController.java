package nexora.planning.nexora.controller;

import lombok.RequiredArgsConstructor;
import nexora.planning.nexora.dto.PasswordVaultEntryDetails;
import nexora.planning.nexora.dto.PasswordVaultEntryRequest;
import nexora.planning.nexora.dto.PasswordVaultEntrySummary;
import nexora.planning.nexora.dto.PasswordVaultSecret;
import nexora.planning.nexora.dto.PasswordVaultUserOption;
import nexora.planning.nexora.service.PasswordVaultService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.RequestParam;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/password-vault")
@RequiredArgsConstructor
public class PasswordVaultController {
    private final PasswordVaultService passwordVaultService;

    @GetMapping
    public List<PasswordVaultEntrySummary> list() {
        return passwordVaultService.list();
    }

    @GetMapping("/users")
    public List<PasswordVaultUserOption> users(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) List<String> selected
    ) {
        return passwordVaultService.users(search, selected);
    }

    @PostMapping
    public ResponseEntity<PasswordVaultEntrySummary> create(@Valid @RequestBody PasswordVaultEntryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(passwordVaultService.create(request));
    }

    @GetMapping("/{id}")
    public PasswordVaultEntryDetails get(@PathVariable Long id) {
        return passwordVaultService.get(id);
    }

    @GetMapping("/{id}/secret")
    public PasswordVaultSecret getSecret(@PathVariable Long id) {
        return passwordVaultService.getSecret(id);
    }

    @PutMapping("/{id}")
    public PasswordVaultEntrySummary update(
        @PathVariable Long id,
        @Valid @RequestBody PasswordVaultEntryRequest request
    ) {
        return passwordVaultService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        passwordVaultService.delete(id);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> forbidden(AccessDeniedException exception) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", exception.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> badRequest(IllegalArgumentException exception) {
        return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> vaultUnavailable(IllegalStateException exception) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("message", exception.getMessage()));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> statusError(ResponseStatusException exception) {
        return ResponseEntity.status(exception.getStatusCode()).body(Map.of("message", exception.getReason() == null ? "Erro no cofre." : exception.getReason()));
    }
}