package nexora.planning.nexora.service;

import nexora.planning.nexora.dto.AuthRequest;
import nexora.planning.nexora.dto.AuthResponse;
import nexora.planning.nexora.dto.UserRequestDTO;
import nexora.planning.nexora.dto.UserResponseDTO;
import nexora.planning.nexora.model.User;
import nexora.planning.nexora.repository.UserRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthenticationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    public AuthenticationService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            UserDetailsService userDetailsService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
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
        user.setRole(request.getRole() != null ? request.getRole() : "ROLE_USER");
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
        User user = userRepository.findByMicrosoftId(microsoftId)
                .orElseGet(() -> userRepository.findByEmail(email)
                        .orElseGet(() -> createMicrosoftUser(microsoftId, email, name)));

        user.setFullName(name);
        user.setEmail(email);
        user.setUpdatedAt(LocalDateTime.now());
        user.setActive(true);
        userRepository.save(user);

        String token = jwtService.generateToken(user);

        return buildAuthResponse(token, user);
    }

    private User createMicrosoftUser(String microsoftId, String email, String name) {
        User user = new User();
        user.setUsername(email);
        user.setPassword("");
        user.setEmail(email);
        user.setFullName(name);
        user.setMicrosoftId(microsoftId);
        user.setAuthProvider("MICROSOFT");
        user.setRole("ROLE_USER");
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
        response.setTeamRole(user.getRole());
        response.setDepartment(user.getDepartment());
        response.setUserId(user.getId());
        response.setAuthProvider(user.getAuthProvider());
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
        return dto;
    }
}