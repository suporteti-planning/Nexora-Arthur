package nexora.planning.nexora.controller;

import nexora.planning.nexora.dto.AuthRequest;
import nexora.planning.nexora.dto.AuthResponse;
import nexora.planning.nexora.dto.UserRequestDTO;
import nexora.planning.nexora.dto.UserResponseDTO;
import nexora.planning.nexora.service.AuthenticationService;
import jakarta.validation.Valid;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationService authService;

    @Value("${app.environment:dev}")
    private String environment;

    public AuthController(AuthenticationService authService) {
        this.authService = authService;
    }

    @PostMapping("/dev-login")
    @Profile("dev")
    public ResponseEntity<AuthResponse> devLogin(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.authenticateLocal(request));
    }

    @PostMapping("/dev-register")
    @Profile("dev")
    public ResponseEntity<UserResponseDTO> devRegister(@Valid @RequestBody UserRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(authService.registerLocal(request));
    }

    @GetMapping("/microsoft-success")
    public ResponseEntity<AuthResponse> microsoftSuccess() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null && authentication.getPrincipal() instanceof OidcUser) {
            OidcUser oidcUser = (OidcUser) authentication.getPrincipal();
            
            String email = oidcUser.getEmail();
            String name = oidcUser.getFullName();
            String microsoftId = oidcUser.getSubject();
            
            // Usa o método que já existe no seu AuthenticationService
            AuthResponse response = authService.authenticateMicrosoft(microsoftId, email, name);
            return ResponseEntity.ok(response);
        }
        
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    @GetMapping("/microsoft-failure")
    public ResponseEntity<Map<String, String>> microsoftFailure() {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Falha no login com Microsoft");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponseDTO> getCurrentUser() {
        // TODO: Implementar lógica para pegar usuário do contexto de segurança
        return ResponseEntity.ok(null);
    }

    // Endpoint para verificar ambiente

    @GetMapping("/environment")
    public ResponseEntity<Map<String, String>> getEnvironment() {
        Map<String, String> response = new HashMap<>();
        response.put("environment", environment);
        response.put("devLoginEnabled", String.valueOf("dev".equals(environment)));
        return ResponseEntity.ok(response);
    }
}