package nexora.planning.nexora.controller;

import nexora.planning.nexora.dto.UserResponseDTO;
import nexora.planning.nexora.service.AuthenticationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
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

    @GetMapping("/microsoft-success")
    public ResponseEntity<UserResponseDTO> microsoftSuccess(Authentication authentication) {
        return ResponseEntity.ok(authService.currentUser(authentication));
    }

    @GetMapping("/microsoft-failure")
    public ResponseEntity<Map<String, String>> microsoftFailure() {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Falha no login com Microsoft");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponseDTO> getCurrentUser(Authentication authentication) {
        return ResponseEntity.ok(authService.currentUser(authentication));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) {
        new SecurityContextLogoutHandler().logout(request, response, authentication);
        return ResponseEntity.noContent().build();
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