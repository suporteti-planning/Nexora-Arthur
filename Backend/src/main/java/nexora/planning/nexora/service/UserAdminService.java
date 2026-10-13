package nexora.planning.nexora.service;

import nexora.planning.nexora.dto.UserAdminDTO;
import nexora.planning.nexora.enums.TeamRole;
import nexora.planning.nexora.model.User;
import nexora.planning.nexora.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserAdminService {

    private final UserRepository  userRepo;
    private final PasswordEncoder encoder;

    // ── Listagem ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<UserAdminDTO.Response> list(Pageable pageable) {
        return userRepo.findAll(pageable).map(UserAdminDTO.Response::from);
    }

    @Transactional(readOnly = true)
    public UserAdminDTO.Response getById(Long id) {
        return UserAdminDTO.Response.from(find(id));
    }

    // ── Criação ───────────────────────────────────────────────────────────────

    @Transactional
    public UserAdminDTO.Response create(UserAdminDTO dto) {
        if (userRepo.existsByUsername(dto.getUsername()))
            throw new IllegalArgumentException("Username já em uso: " + dto.getUsername());
        if (userRepo.existsByEmail(dto.getEmail()))
            throw new IllegalArgumentException("E-mail já em uso: " + dto.getEmail());

        String rawPwd = dto.getPassword();
        if (rawPwd == null || rawPwd.isBlank())
            throw new IllegalArgumentException("Senha obrigatória na criação.");

        User u = new User();
        u.setUsername(dto.getUsername());
        u.setEmail(dto.getEmail());
        u.setFullName(dto.getFullName());
        u.setPassword(encoder.encode(rawPwd));
        applyTeamRole(u, dto.getTeamRole());
        u.setDepartment(dto.getDepartment());
        u.setIsTeamMember(dto.isTeamMember());
        u.setAuthProvider("LOCAL");
        u.setActive(dto.getActive() == null ? true : dto.getActive());
        u.setCreatedAt(LocalDateTime.now());
        u.setUpdatedAt(LocalDateTime.now());

        return UserAdminDTO.Response.from(userRepo.save(u));
    }

    // ── Edição ────────────────────────────────────────────────────────────────

    @Transactional
    public UserAdminDTO.Response update(Long id, UserAdminDTO dto) {
        User u = find(id);

        if (!u.getUsername().equals(dto.getUsername()) && userRepo.existsByUsername(dto.getUsername()))
            throw new IllegalArgumentException("Username já em uso: " + dto.getUsername());
        if (!u.getEmail().equals(dto.getEmail()) && userRepo.existsByEmail(dto.getEmail()))
            throw new IllegalArgumentException("E-mail já em uso: " + dto.getEmail());

        u.setUsername(dto.getUsername());
        u.setEmail(dto.getEmail());
        u.setFullName(dto.getFullName());
        if (dto.getPassword() != null && !dto.getPassword().isBlank())
            u.setPassword(encoder.encode(dto.getPassword()));
        applyTeamRole(u, dto.getTeamRole());
        u.setDepartment(dto.getDepartment());
        u.setIsTeamMember(dto.isTeamMember());
        if (dto.getActive() != null) u.setActive(dto.getActive());
        u.setUpdatedAt(LocalDateTime.now());

        return UserAdminDTO.Response.from(userRepo.save(u));
    }

    // ── Ativação / desativação ────────────────────────────────────────────────

    @Transactional
    public UserAdminDTO.Response setActive(Long id, boolean active) {
        User u = find(id);
        u.setActive(active);
        u.setUpdatedAt(LocalDateTime.now());
        return UserAdminDTO.Response.from(userRepo.save(u));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private User find(Long id) {
        return userRepo.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + id));
    }

    private void applyTeamRole(User u, TeamRole role) {
        TeamRole tr = role != null ? role : TeamRole.ROLE_COLABORADOR;
        u.setTeamRole(tr);
        u.setRole(tr.name());
    }
}
