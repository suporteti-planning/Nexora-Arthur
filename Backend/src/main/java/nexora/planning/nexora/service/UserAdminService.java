package nexora.planning.nexora.service;

import nexora.planning.nexora.dto.UserAdminDTO;
import nexora.planning.nexora.enums.TeamRole;
import nexora.planning.nexora.model.User;
import nexora.planning.nexora.repository.UserRepository;
import nexora.planning.nexora.security.DepartmentAccessEvaluator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserAdminService {

    private final UserRepository  userRepo;
    private final PasswordEncoder encoder;
    private final DepartmentAccessEvaluator dept;

    // ── Listagem ──────────────────────────────────────────────────────────────

    private Set<TeamRole> deptRolesOf(Set<String> depts) {
        Set<TeamRole> roles = new HashSet<>();
        for (String d : depts) {
            roles.add(TeamRole.fromString("ROLE_" + d));
            roles.add(TeamRole.fromString("ROLE_ADMIN_" + d));
        }
        return roles;
    }

    @Transactional(readOnly = true)
    public Page<UserAdminDTO.Response> list(User actor, Pageable pageable) {
        if (dept.isGlobal()) {
            return userRepo.findAll(pageable).map(UserAdminDTO.Response::from);
        }
        // Admin de depto: só vê usuários do(s) seu(s) depto(s)
        Set<TeamRole> visibleRoles = deptRolesOf(dept.departmentsOf(actor));
        return userRepo.findByAnyTeamRole(visibleRoles, pageable)
            .map(UserAdminDTO.Response::from);
    }

    // ── Criação ───────────────────────────────────────────────────────────────

    @Transactional
    public UserAdminDTO.Response create(User actor, UserAdminDTO dto) {
        Set<TeamRole> roles = sanitizeRoles(dto.resolvedTeamRoles());
        dept.assertCanAssignRoles(actor, roles);
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

        applyTeamRoles(u, roles);   // ← Set

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
    public UserAdminDTO.Response update(User actor,Long id, UserAdminDTO dto) {
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

        applyTeamRoles(u, dto.resolvedTeamRoles());   // ← Set

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

    /**
     * Aplica o conjunto de roles na entidade gerenciada.
     * - Remove ROLE_COLABORADOR (é o "sem equipe" implícito)
     * - Copia para HashSet mutável (Set.of() quebra no Hibernate flush)
     * - Usa clear()+addAll() para preservar a instância rastreada pelo Hibernate
     *   (evita "collection with cascade=all-delete-orphan was no longer referenced")
     */
    private void applyTeamRoles(User u, Set<TeamRole> roles) {
        Set<TeamRole> sanitized = sanitizeRoles(roles);
        if (roles != null) {
            for (TeamRole r : roles) {
                if (r != null && r != TeamRole.ROLE_COLABORADOR) {
                    sanitized.add(r);
                }
            }
        }

        if (u.getTeamRoles() == null) {
            u.setTeamRoles(sanitized);
        } else {
            u.getTeamRoles().clear();
            u.getTeamRoles().addAll(sanitized);
        }
    }

    private String departmentOf(TeamRole r) {
       String n = r.name();
       if (n.equals("ROLE_ADMIN") || n.equals("ROLE_TI") || n.equals("ROLE_COLABORADOR")) return null;
       if (n.startsWith("ROLE_ADMIN_")) return n.substring("ROLE_ADMIN_".length());
       if (n.startsWith("ROLE_")) return n.substring(5);
       return null;
    }

    private Set<TeamRole> sanitizeRoles(Set<TeamRole> raw) {
        if (raw == null || raw.isEmpty()) return new HashSet<>();

        Set<TeamRole> result = new HashSet<>();
        Set<String> departments = new HashSet<>();
        boolean hasColaborador = false;

        for (TeamRole r : raw) {
            if (r == null) continue;
            if (r == TeamRole.ROLE_COLABORADOR) {
                hasColaborador = true;
                continue;
            }
            String dept = departmentOf(r);
            if (dept != null) {
                if (!departments.add(dept)) {
                    throw new IllegalArgumentException(
                        "Usuário não pode ter mais de uma role do departamento " + dept);
                }
            }
            result.add(r);
        }

        if (hasColaborador && !result.isEmpty()) {
            throw new IllegalArgumentException(
                "ROLE_COLABORADOR não pode coexistir com roles de departamento");
        }
        if (hasColaborador) result.add(TeamRole.ROLE_COLABORADOR);

        return result;
    }
}