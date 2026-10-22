package nexora.planning.nexora.model;

import jakarta.persistence.*;
import nexora.planning.nexora.enums.TeamRole;
import nexora.planning.nexora.enums.UserRole;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "users")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;  // Pode ser nulo para usuários da Microsoft

    private String email;

    private String fullName;

    private String role = "VISITOR";

    // Campos para autenticação Microsoft
    private String microsoftId;  // ID único do usuário no Azure
    private String authProvider;  // "LOCAL" ou "MICROSOFT"

    // ── Campos de equipe / departamento ──────────────────────────────────
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_team_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "team_role")
    @Enumerated(EnumType.STRING)
    private Set<TeamRole> teamRoles = new HashSet<>();

    @Column(name = "department")
    private String department;

    @Column(name = "is_team_member")
    private Boolean isTeamMember;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    private Boolean active = true;

    // Construtores
    public User() {}

    public User(String username, String password, String email, String fullName) {
        this.username = username;
        this.password = password;
        this.email = email;
        this.fullName = fullName;
        this.authProvider = "LOCAL";
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getRole() { return UserRole.fromStoredValue(role).getValue(); }
    public void setRole(String role) { this.role = UserRole.fromValue(role).getValue(); }

    public String getMicrosoftId() { return microsoftId; }
    public void setMicrosoftId(String microsoftId) { this.microsoftId = microsoftId; }

    public String getAuthProvider() { return authProvider; }
    public void setAuthProvider(String authProvider) { this.authProvider = authProvider; }

    // ── Getters/Setters de equipe / departamento ─────────────────────────
    public Set<TeamRole> getTeamRoles() { return teamRoles; }
    public void setTeamRoles(Set<TeamRole> teamRoles) { this.teamRoles = teamRoles; }

    public String getDepartment() {
        if (teamRoles == null || teamRoles.isEmpty()) return department;   // fallback campo manual
        for (TeamRole r : teamRoles) {
            String n = r.name();
            if (n.startsWith("ROLE_ADMIN_")) return n.substring("ROLE_ADMIN_".length());
            if (n.startsWith("ROLE_") && !List.of("ROLE_ADMIN","ROLE_TI","ROLE_COLABORADOR").contains(n)) {
                return n.substring(5);
            }
        }
        return department;
    }
    public void setDepartment(String department) { this.department = department; }

    public Boolean getIsTeamMember() { return isTeamMember; }
    public void setIsTeamMember(Boolean isTeamMember) { this.isTeamMember = isTeamMember; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }

    // UserDetails methods
    @Override
        public Collection<? extends GrantedAuthority> getAuthorities() {
        List<GrantedAuthority> auths = new ArrayList<>();
        auths.add(new SimpleGrantedAuthority(UserRole.fromStoredValue(role).getAuthority()));
        if (teamRoles != null) {
            teamRoles.forEach(tr -> auths.add(new SimpleGrantedAuthority(tr.name())));
        }
        return auths;
    }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return Boolean.TRUE.equals(active); }
}