package nexora.planning.nexora.dto;

import nexora.planning.nexora.enums.TeamRole;
import nexora.planning.nexora.model.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Set;

/** Usado pelo painel admin TI para criar/editar/listar usuários. */
@Data
public class UserAdminDTO {

    // ── Request fields ────────────────────────────────────────────────────────
    @NotBlank @Size(min = 3, max = 50)
    private String username;

    @NotBlank @Email
    private String email;

    @NotBlank
    private String fullName;

    /** Senha — obrigatória só na criação. */
    @Size(min = 6)
    private String password;

    /**
     * Role principal (compat com form atual que usa <select> único).
     * Pode ficar null — significa "sem equipe" (ROLE_COLABORADOR).
     */
    private TeamRole teamRole;

    /**
     * Conjunto completo — usado quando o front evoluir para checkboxes.
     * Se vier preenchido, tem prioridade sobre `teamRole` (via resolvedTeamRoles()).
     */
    private Set<TeamRole> teamRoles;

    private String  department;
    private boolean isTeamMember;
    private Boolean active;

    /** Regra única de resolução: teamRoles > teamRole > vazio. */
    public Set<TeamRole> resolvedTeamRoles() {
        if (teamRoles != null && !teamRoles.isEmpty()) return teamRoles;
        if (teamRole == null || teamRole == TeamRole.ROLE_COLABORADOR) return Collections.emptySet();
        return Set.of(teamRole);
    }

    // ── Response DTO ──────────────────────────────────────────────────────────
    @Data @Builder
    public static class Response {
        private Long          id;
        private String        username;
        private String        email;
        private String        fullName;

        /** Role principal — mantém compat com user-management.html:68-69. */
        private TeamRole      teamRole;
        private String        teamRoleDisplay;

        /** Conjunto completo — para uso futuro (badges múltiplos, filtros). */
        private Set<TeamRole> teamRoles;

        private String        department;
        private boolean       isTeamMember;
        private boolean       active;
        private String        authProvider;
        private LocalDateTime createdAt;

        public static Response from(User u) {
            Set<TeamRole> roles = u.getTeamRoles() == null
                ? Collections.emptySet()
                : u.getTeamRoles();
            TeamRole primary = pickPrimary(roles);
                
            return Response.builder()
                .id(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .fullName(u.getFullName())
                .teamRole(primary)
                .teamRoleDisplay(primary != null ? primary.getDisplayName() : null)
                .teamRoles(roles)
                .department(u.getDepartment())
                .isTeamMember(Boolean.TRUE.equals(u.getIsTeamMember()))
                .active(Boolean.TRUE.equals(u.getActive()))
                .authProvider(u.getAuthProvider())
                .createdAt(u.getCreatedAt())
                .build();
        }

    private static TeamRole pickPrimary(Set<TeamRole> roles) {
        if (roles == null || roles.isEmpty()) return null;
            return roles.stream().filter(r -> r == TeamRole.ROLE_ADMIN).findFirst()
                .or(() -> roles.stream().filter(r -> r == TeamRole.ROLE_TI).findFirst())
                .or(() -> roles.stream().filter(r -> r.name().startsWith("ROLE_ADMIN_")).findFirst())
                .orElseGet(() -> roles.iterator().next());
        }
    }
}