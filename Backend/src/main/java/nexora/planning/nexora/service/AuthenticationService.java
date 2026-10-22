package nexora.planning.nexora.service;

import nexora.planning.nexora.dto.AuthRequest;
import nexora.planning.nexora.dto.AuthResponse;
import nexora.planning.nexora.dto.UserRequestDTO;
import nexora.planning.nexora.dto.UserResponseDTO;
import nexora.planning.nexora.enums.UserRole;
import nexora.planning.nexora.model.User;
import nexora.planning.nexora.repository.UserRepository;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Locale;

@Service
public class AuthenticationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final String bootstrapAdminEmail;

    public AuthenticationService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            @Value("${app.auth.bootstrap-admin-email:gustavo.santos@planning.com.br}") String bootstrapAdminEmail
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.bootstrapAdminEmail = bootstrapAdminEmail.trim().toLowerCase(Locale.ROOT);
    }

    // Login LOCAL direto para DEV
    public AuthResponse authenticateLocal(AuthRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Senha incorreta");
        }

        if (Boolean.FALSE.equals(user.getActive())) {
            throw new RuntimeException("Usuário inativo");
        }

        String token = jwtService.generateToken(user);

        return buildAuthResponse(token, user);
    }

    // Registro LOCAL
    @Transactional
    public UserResponseDTO registerLocal(UserRequestDTO request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username já está em uso");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email já está em uso");
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setRole(request.getRole() != null ? request.getRole() : UserRole.VISITOR.getValue());
        user.setAuthProvider("LOCAL");
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        user.setActive(true);

        User savedUser = userRepository.save(user);
        return convertToResponseDTO(savedUser);
    }

    // Login/Criação para usuários da Microsoft
    @Transactional
    public AuthResponse authenticateMicrosoft(String microsoftId, String email, String name) {
        User user = authenticateMicrosoftUser(microsoftId, email, name);
        String token = jwtService.generateToken(user);
        return buildAuthResponse(token, user);
    }

    @Transactional
    public User authenticateMicrosoftUser(String microsoftId, String email, String name) {
        if (microsoftId == null || microsoftId.isBlank() || email == null || email.isBlank()) {
            throw new IllegalArgumentException("A Microsoft não forneceu um identificador e um email válidos.");
        }

        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByMicrosoftId(microsoftId)
            .orElseGet(() -> userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseGet(() -> createMicrosoftUser(microsoftId, normalizedEmail, name)));

        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new DisabledException("A conta está desativada.");
        }
        if (user.getMicrosoftId() != null && !user.getMicrosoftId().equals(microsoftId)) {
            throw new DisabledException("A conta Microsoft não corresponde à conta cadastrada.");
        }

        user.setMicrosoftId(microsoftId);
        user.setAuthProvider("MICROSOFT");
        user.setFullName(name == null || name.isBlank() ? normalizedEmail : name);
        user.setEmail(normalizedEmail);
        if (normalizedEmail.equals(bootstrapAdminEmail)) {
            user.setRole(UserRole.TI_ADMIN.getValue());
        }
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public UserResponseDTO currentUser(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        User user;
        if (principal instanceof OidcUser oidcUser) {
            user = userRepository.findByMicrosoftId(oidcUser.getSubject())
                .or(() -> oidcUser.getEmail() == null
                    ? java.util.Optional.empty()
                    : userRepository.findByEmailIgnoreCase(oidcUser.getEmail()))
                .orElseThrow(() -> new IllegalStateException("A conta Microsoft não está cadastrada."));
        } else {
            user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new IllegalStateException("A conta autenticada não está cadastrada."));
        }

        if (!Boolean.TRUE.equals(user.getActive())) {
            throw new DisabledException("A conta está desativada.");
        }
        return convertToResponseDTO(user);
    }

    private User createMicrosoftUser(String microsoftId, String email, String name) {
        User user = new User();
        user.setUsername(email);
        user.setPassword("");
        user.setEmail(email);
        user.setFullName(name == null || name.isBlank() ? email : name);
        user.setMicrosoftId(microsoftId);
        user.setAuthProvider("MICROSOFT");
        user.setRole(UserRole.VISITOR.getValue());
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        user.setActive(true);

        return userRepository.save(user);
    }

    private AuthResponse buildAuthResponse(String token, User user) {
        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setFullName(user.getFullName());
        response.setRole(user.getRole());
        response.setUserId(user.getId());
        response.setAuthProvider(user.getAuthProvider());
        response.setTeamRoles(
            user.getTeamRoles() == null ? List.of() :
            user.getTeamRoles().stream()
                .map(Enum::name)
                .collect(Collectors.toList())
        );
        response.setDepartment(user.getDepartment());
        return response;
    }

    private UserResponseDTO convertToResponseDTO(User user) {
        UserResponseDTO dto = new UserResponseDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setRole(user.getRole());
        dto.setAuthProvider(user.getAuthProvider());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setActive(user.getActive());
        dto.setTeamRoles(
            user.getTeamRoles() == null ? List.of() :
            user.getTeamRoles().stream()
                .map(Enum::name)
                .collect(Collectors.toList())
        );
        dto.setDepartment(user.getDepartment());
        return dto;
    }
}