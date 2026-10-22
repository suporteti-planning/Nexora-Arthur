package nexora.planning.nexora.security;

import nexora.planning.nexora.enums.DestDepartment;
import nexora.planning.nexora.enums.TeamRole;
import nexora.planning.nexora.model.User;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

/**
 * Avaliador de acesso por departamento.
 * Usado em @PreAuthorize("@dept.xxx()") e chamado pelo service.
 */
@Component("dept")
public class DepartmentAccessEvaluator {

    private static final Set<String> GLOBAL = Set.of("ROLE_ADMIN", "ROLE_TI", "ROLE_COLABORADOR");

    // ── Queries sobre o ator autenticado ────────────────────────────────

    public boolean isSuperAdmin() { return hasRole("ROLE_ADMIN"); }

    public boolean isTI()         { return hasRole("ROLE_TI"); }

    public boolean isGlobal()     { return isSuperAdmin() || isTI(); }

    /** true se o ator é ADMIN global, TI, ou admin de algum depto. */
    public boolean canManageUsers() {
        User u = currentUser();
        if (u == null) return false;
        if (isGlobal()) return true;
        return u.getTeamRoles().stream().anyMatch(r -> r.name().startsWith("ROLE_ADMIN_"));
    }

    // ── Regras de atribuição ────────────────────────────────────────────

    /** O ator pode atribuir esse conjunto de roles a alguém? */
    public void assertCanAssignRoles(User actor, Set<TeamRole> targetRoles) {
        if (isSuperAdmin()) return;                       // pode tudo
        if (isTI()) {
            if (targetRoles.contains(TeamRole.ROLE_ADMIN)) {
                throw new AccessDeniedException("Somente superadministrador pode criar outro superadministrador.");
            }
            return;
        }
        // Admin de depto: só pode atribuir roles do seu(s) depto(s)
        Set<String> actorDepts = departmentsOf(actor);
        if (actorDepts.isEmpty()) {
            throw new AccessDeniedException("Usuário não tem permissão para gerenciar usuários.");
        }
        for (TeamRole r : targetRoles) {
            String dept = departmentOf(r);
            if (dept != null && !actorDepts.contains(dept)) {
                throw new AccessDeniedException(
                    "Você não pode atribuir a role " + r + " (pertence ao depto " + dept + ").");
            }
            if (r == TeamRole.ROLE_ADMIN || r == TeamRole.ROLE_TI) {
                throw new AccessDeniedException("Apenas TI/superadmin pode atribuir " + r + ".");
            }
        }
    }

    // ── Helpers ─────────────────────────────────────────────────────────

    public Set<String> departmentsOf(User u) {
        Set<String> result = new HashSet<>();
        if (u.getTeamRoles() == null) return result;
        for (TeamRole r : u.getTeamRoles()) {
            String d = departmentOf(r);
            if (d != null) result.add(d);
        }
        return result;
    }

    /** ROLE_DOC → "DOC" | ROLE_ADMIN_RH → "RH" | globais → null */
    public String departmentOf(TeamRole r) {
        if (r == null) return null;
        String n = r.name();
        if (GLOBAL.contains(n)) return null;
        if (n.startsWith("ROLE_ADMIN_")) return n.substring("ROLE_ADMIN_".length());
        if (n.startsWith("ROLE_")) return n.substring(5);
        return null;
    }

    private User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof User u)) return null;
        return u;
    }

    private boolean hasRole(String role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals(role));
    }

    public boolean belongsTo(DestDepartment dept) {
        if (dept == null) return false;
        if (isGlobal()) return true;
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;

        // Converte o enum para o nome da role (ex: DOC -> ROLE_DOC e ROLE_ADMIN_DOC)
        String regularRole = "ROLE_" + dept.name();
        String adminRole   = "ROLE_ADMIN_" + dept.name();

        return auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals(regularRole) || a.getAuthority().equals(adminRole));
    }
}