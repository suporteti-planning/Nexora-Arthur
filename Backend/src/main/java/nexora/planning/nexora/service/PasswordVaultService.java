package nexora.planning.nexora.service;

import lombok.RequiredArgsConstructor;
import nexora.planning.nexora.dto.PasswordVaultEntryDetails;
import nexora.planning.nexora.dto.PasswordVaultEntryRequest;
import nexora.planning.nexora.dto.PasswordVaultEntrySummary;
import nexora.planning.nexora.dto.PasswordVaultSecret;
import nexora.planning.nexora.dto.PasswordVaultUserOption;
import nexora.planning.nexora.enums.VaultVisibility;
import nexora.planning.nexora.model.PasswordVaultEntry;
import nexora.planning.nexora.model.User;
import nexora.planning.nexora.repository.PasswordVaultEntryRepository;
import nexora.planning.nexora.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.LinkedHashMap;
import org.springframework.data.domain.PageRequest;

@Service
@RequiredArgsConstructor
public class PasswordVaultService {
    private final PasswordVaultEntryRepository entryRepository;
    private final UserRepository userRepository;
    private final PasswordVaultCryptoService cryptoService;

    @Transactional(readOnly = true)
    public List<PasswordVaultEntrySummary> list() {
        String currentUser = currentUserKey();
        return entryRepository.findAllByOrderByUpdatedAtDesc().stream()
            .filter(entry -> canView(entry, currentUser))
            .map(entry -> toSummary(entry, currentUser))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<PasswordVaultUserOption> users(String search, List<String> selectedUsernames) {
        LinkedHashMap<String, User> matches = new LinkedHashMap<>();
        if (selectedUsernames != null && !selectedUsernames.isEmpty()) {
            userRepository.findByUsernameInAndActiveTrue(selectedUsernames).stream()
                .filter(this::hasEmail)
                .forEach(user -> matches.put(normalize(user.getUsername()), user));
        }

        if (search != null && search.trim().length() >= 2) {
            userRepository.searchActiveUsers(search.trim(), PageRequest.of(0, 20)).getContent().stream()
                .filter(this::hasEmail)
                .forEach(user -> matches.putIfAbsent(normalize(user.getUsername()), user));
        }

        return matches.values().stream()
            .map(user -> new PasswordVaultUserOption(
                normalize(user.getUsername()),
                user.getFullName() == null || user.getFullName().isBlank() ? user.getUsername() : user.getFullName(),
                user.getEmail()
            ))
            .sorted(Comparator.comparing(PasswordVaultUserOption::name, String.CASE_INSENSITIVE_ORDER))
            .toList();
    }

    private boolean hasEmail(User user) {
        return user.getEmail() != null && !user.getEmail().isBlank();
    }

    @Transactional(readOnly = true)
    public PasswordVaultEntryDetails get(Long id) {
        String currentUser = currentUserKey();
        PasswordVaultEntry entry = findVisibleEntry(id, currentUser);
        return toDetails(entry, currentUser);
    }

    @Transactional(readOnly = true)
    public PasswordVaultSecret getSecret(Long id) {
        String currentUser = currentUserKey();
        PasswordVaultEntry entry = findVisibleEntry(id, currentUser);
        return new PasswordVaultSecret(cryptoService.decrypt(entry.getEncryptedPassword()));
    }

    @Transactional
    public PasswordVaultEntrySummary create(PasswordVaultEntryRequest request) {
        String currentUser = currentUserKey();
        PasswordVaultEntry entry = new PasswordVaultEntry();
        entry.setOwnerUsername(currentUser);
        applyRequest(entry, request, true, currentUser);
        return toSummary(entryRepository.save(entry), currentUser);
    }

    @Transactional
    public PasswordVaultEntrySummary update(Long id, PasswordVaultEntryRequest request) {
        String currentUser = currentUserKey();
        PasswordVaultEntry entry = findVisibleEntry(id, currentUser);
        boolean owner = isOwner(entry, currentUser);
        if (!owner && entry.getVisibility() == VaultVisibility.PRIVATE) {
            throw new AccessDeniedException("Somente o criador pode editar uma senha privada.");
        }

        boolean allowAccessChange = owner;
        applyRequest(entry, request, allowAccessChange, currentUser);
        return toSummary(entryRepository.save(entry), currentUser);
    }

    @Transactional
    public void delete(Long id) {
        String currentUser = currentUserKey();
        PasswordVaultEntry entry = findVisibleEntry(id, currentUser);
        if (entry.getVisibility() == VaultVisibility.PRIVATE && !isOwner(entry, currentUser)) {
            throw new AccessDeniedException("Somente o criador pode excluir uma senha privada.");
        }
        entryRepository.delete(entry);
    }

    private void applyRequest(PasswordVaultEntry entry, PasswordVaultEntryRequest request, boolean allowAccessChange, String currentUser) {
        entry.setTitle(request.title().trim());
        entry.setUsername(request.username().trim());
        entry.setEncryptedPassword(cryptoService.encrypt(request.password()));
        entry.setUrl(cleanOptional(request.url()));
        entry.setCategory(request.category().trim());
        entry.setDescription(cleanOptional(request.description()));

        if (allowAccessChange) {
            entry.setVisibility(request.visibility());
            entry.setViewerUsernames(request.visibility() == VaultVisibility.PRIVATE
                ? validateViewers(request.sharedWith(), currentUser)
                : new HashSet<>());
        } else {
            entry.setVisibility(VaultVisibility.PUBLIC);
            entry.setViewerUsernames(new HashSet<>());
        }
    }

    private Set<String> validateViewers(Set<String> requestedViewers, String owner) {
        if (requestedViewers == null || requestedViewers.isEmpty()) return new HashSet<>();

        Set<String> viewers = new HashSet<>();
        for (String requestedViewer : requestedViewers) {
            String username = normalize(requestedViewer);
            if (username.isBlank() || username.equals(owner)) continue;
            User user = userRepository.findByUsername(username)
                .filter(candidate -> Boolean.TRUE.equals(candidate.getActive()))
                .orElseThrow(() -> new IllegalArgumentException("Um dos usuários selecionados para compartilhamento não foi encontrado."));
            viewers.add(normalize(user.getUsername()));
        }
        return viewers;
    }

    private PasswordVaultEntry findVisibleEntry(Long id, String currentUser) {
        PasswordVaultEntry entry = entryRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Credencial não encontrada."));
        if (!canView(entry, currentUser)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Credencial não encontrada.");
        }
        return entry;
    }

    private boolean canView(PasswordVaultEntry entry, String username) {
        return entry.getVisibility() == VaultVisibility.PUBLIC
            || isOwner(entry, username)
            || entry.getViewerUsernames().contains(username);
    }

    private boolean isOwner(PasswordVaultEntry entry, String username) {
        return normalize(entry.getOwnerUsername()).equals(username);
    }

    private PasswordVaultEntrySummary toSummary(PasswordVaultEntry entry, String currentUser) {
        return new PasswordVaultEntrySummary(
            entry.getId(), entry.getTitle(), entry.getUsername(), entry.getUrl(), entry.getCategory(),
            entry.getDescription(), entry.getVisibility(), entry.getOwnerUsername(),
            entry.getViewerUsernames().stream().sorted().toList(), entry.getUpdatedAt(), canEdit(entry, currentUser)
        );
    }

    private PasswordVaultEntryDetails toDetails(PasswordVaultEntry entry, String currentUser) {
        return new PasswordVaultEntryDetails(
            entry.getId(), entry.getTitle(), entry.getUsername(), cryptoService.decrypt(entry.getEncryptedPassword()),
            entry.getUrl(), entry.getCategory(), entry.getDescription(), entry.getVisibility(), entry.getOwnerUsername(),
            entry.getViewerUsernames().stream().sorted().toList(), entry.getUpdatedAt(), canEdit(entry, currentUser)
        );
    }

    private boolean canEdit(PasswordVaultEntry entry, String username) {
        return entry.getVisibility() == VaultVisibility.PUBLIC || isOwner(entry, username);
    }

    private String currentUserKey() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new AccessDeniedException("Entre no sistema para acessar o cofre de senhas.");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof OidcUser oidcUser && oidcUser.getEmail() != null) {
            String email = normalize(oidcUser.getEmail());
            return userRepository.findByEmail(email)
                .map(user -> normalize(user.getUsername()))
                .orElse(email);
        }
        return normalize(authentication.getName());
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private String cleanOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}