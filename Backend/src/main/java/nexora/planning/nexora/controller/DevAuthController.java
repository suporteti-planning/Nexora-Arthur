package nexora.planning.nexora.controller;

import jakarta.validation.Valid;
import nexora.planning.nexora.dto.AuthRequest;
import nexora.planning.nexora.dto.AuthResponse;
import nexora.planning.nexora.dto.UserRequestDTO;
import nexora.planning.nexora.dto.UserResponseDTO;
import nexora.planning.nexora.service.AuthenticationService;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@Profile("dev")
public class DevAuthController {

    private final AuthenticationService authService;

    public DevAuthController(AuthenticationService authService) {
        this.authService = authService;
    }

    @PostMapping("/dev-login")
    public ResponseEntity<AuthResponse> devLogin(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.authenticateLocal(request));
    }

    @PostMapping("/dev-register")
    public ResponseEntity<UserResponseDTO> devRegister(@Valid @RequestBody UserRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registerLocal(request));
    }
}
