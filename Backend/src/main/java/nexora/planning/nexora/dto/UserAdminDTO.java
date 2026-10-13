package nexora.planning.nexora.dto;

import nexora.planning.nexora.enums.TeamRole;
import nexora.planning.nexora.model.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

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

    @NotNull
    private TeamRole teamRole;

    private String  department;
    private boolean isTeamMember;
    private Boolean active;

    // ── Response DTO ──────────────────────────────────────────────────────────
    @Data @Builder
    public static class Response {
        private Long          id;
        private String        username;
        private String        email;
        private String        fullName;
        private TeamRole      teamRole;
        private String        teamRoleDisplay;
        private String        department;
        private boolean       isTeamMember;
        private boolean       active;
        private String        authProvider;
        private LocalDateTime createdAt;

        public static Response from(User u) {
            return Response.builder()
                .id(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .fullName(u.getFullName())
                .teamRole(u.getTeamRole())
                .teamRoleDisplay(u.getTeamRole() != null ? u.getTeamRole().getDisplayName() : null)
                .department(u.getDepartment())
                .isTeamMember(u.getIsTeamMember())
                .active(Boolean.TRUE.equals(u.getActive()))
                .authProvider(u.getAuthProvider())
                .createdAt(u.getCreatedAt())
                .build();
        }
    }
}
