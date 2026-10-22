package nexora.planning.nexora.service;

import nexora.planning.nexora.dto.UserResponseDTO;
import nexora.planning.nexora.enums.UserRole;
import nexora.planning.nexora.model.User;
import nexora.planning.nexora.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.NOT_FOUND;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
public class UserManagementService {
    private final UserRepository userRepository;

    public UserManagementService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<UserResponseDTO> listUsers() {
        return userRepository.findAll().stream()
            .sorted(Comparator.comparing(User::getUsername, String.CASE_INSENSITIVE_ORDER))
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public UserResponseDTO updateRole(Long userId, String requestedRole) {
        User target = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Usuário não encontrado."));
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Object principal = authentication.getPrincipal();
        boolean isCurrentUser = target.getUsername().equalsIgnoreCase(authentication.getName());
        if (principal instanceof OidcUser oidcUser) {
            isCurrentUser = target.getMicrosoftId() != null
                && target.getMicrosoftId().equals(oidcUser.getSubject());
        }
        if (isCurrentUser) {
            throw new AccessDeniedException("Um TI-ADMIN só pode alterar as permissões de outros usuários.");
        }

        target.setRole(UserRole.fromValue(requestedRole).getValue());
        target.setUpdatedAt(LocalDateTime.now());
        return toResponse(userRepository.save(target));
    }

    private UserResponseDTO toResponse(User user) {
        UserResponseDTO response = new UserResponseDTO();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setFullName(user.getFullName());
        response.setRole(user.getRole());
        response.setAuthProvider(user.getAuthProvider());
        response.setCreatedAt(user.getCreatedAt());
        response.setActive(user.getActive());
        return response;
    }
}
