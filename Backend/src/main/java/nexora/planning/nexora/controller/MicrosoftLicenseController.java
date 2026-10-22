package nexora.planning.nexora.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import nexora.planning.nexora.dto.MicrosoftLicenseActionDTO;
import nexora.planning.nexora.dto.MicrosoftLicenseInventoryDTO;
import nexora.planning.nexora.service.MicrosoftLicenseService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClientResponseException;

import java.util.Map;

@RestController
@RequestMapping("/api/licenses")
@RequiredArgsConstructor
public class MicrosoftLicenseController {
    private final MicrosoftLicenseService microsoftLicenseService;

    @GetMapping
    public ResponseEntity<MicrosoftLicenseInventoryDTO> getInventory() {
        return ResponseEntity.ok(microsoftLicenseService.getInventory());
    }

    @PostMapping("/assign")
    public ResponseEntity<Void> assign(@Valid @RequestBody MicrosoftLicenseActionDTO request) {
        microsoftLicenseService.assign(request.userId(), request.skuId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/revoke")
    public ResponseEntity<Void> revoke(@Valid @RequestBody MicrosoftLicenseActionDTO request) {
        microsoftLicenseService.revoke(request.userId(), request.skuId());
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> badRequest(IllegalArgumentException exception) {
        return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> conflict(IllegalStateException exception) {
        return ResponseEntity.status(409).body(Map.of("message", exception.getMessage()));
    }

    @ExceptionHandler(RestClientResponseException.class)
    public ResponseEntity<Map<String, String>> graphError(RestClientResponseException exception) {
        String message = "Microsoft Graph retornou " + exception.getStatusCode().value() + ": " + exception.getStatusText();
        return ResponseEntity.status(exception.getStatusCode()).body(Map.of("message", message));
    }
}
