package nexora.planning.nexora.model;

import nexora.planning.nexora.enums.TeamRole;

import jakarta.persistence.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    private String email;

    private String fullName;

    /** Role Spring Security — ex: ROLE_ADMIN, ROLE_TI, ROLE_DOC … */
    private String role = "ROLE_COLABORADOR";

    // ── Campos RBAC por equipe (V2 migration) ─────────────────────────────────
    /** Papel de equipe/departamento (espelho do role para tipagem segura). */
    @Enumerated(EnumType.STRING)
    @Column(name = "team_role", length = 50)
    private TeamRole teamRole = TeamRole.ROLE_COLABORADOR;

    /** Departamento informado no cadastro (texto livre ou código). */
    @Column(name = "department", length = 100)
    private String department;

    /** Indica se o usuário é membro de uma equipe interna (vs. colaborador externo). */
    @Column(name = "is_team_member", nullable = false)
    private boolean isTeamMember = false;

    // ── Campos Microsoft ──────────────────────────────────────────────────────
    private String microsoftId;
    private String authProvider;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    private Boolean active = true;

    // ── Construtores ──────────────────────────────────────────────────────────
    public User() {}

    public User(String username, String password, String email, String fullName) {
        this.username    = username;
        this.password    = password;
        this.email       = email;
        this.fullName    = fullName;
        this.authProvider = "LOCAL";
        this.createdAt   = LocalDateTime.now();
        this.updatedAt   = LocalDateTime.now();
    }

    // ── Getters / Setters ─────────────────────────────────────────────────────
    public Long getId()                     { return id; }
    public void setId(Long id)              { this.id = id; }

    public String getUsername()             { return username; }
    public void setUsername(String v)       { this.username = v; }

    public String getPassword()             { return password; }
    public void setPassword(String v)       { this.password = v; }

    public String getEmail()                { return email; }
    public void setEmail(String v)          { this.email = v; }

    public String getFullName()             { return fullName; }
    public void setFullName(String v)       { this.fullName = v; }

    public String getRole()                 { return role; }
    public void setRole(String v)           { this.role = v; }

    public TeamRole getTeamRole()           { return teamRole; }
    public void setTeamRole(TeamRole v) {
        this.teamRole = v;
        // sincroniza o campo role para o Spring Security
        if (v != null) this.role = v.name();
    }

    public String getDepartment()           { return department; }
    public void setDepartment(String v)     { this.department = v; }

    public boolean getIsTeamMember()        { return isTeamMember; }
    public void setIsTeamMember(boolean v)  { this.isTeamMember = v; }

    public String getMicrosoftId()          { return microsoftId; }
    public void setMicrosoftId(String v)    { this.microsoftId = v; }

    public String getAuthProvider()         { return authProvider; }
    public void setAuthProvider(String v)   { this.authProvider = v; }

    public LocalDateTime getCreatedAt()     { return createdAt; }
    public void setCreatedAt(LocalDateTime v) { this.createdAt = v; }

    public LocalDateTime getUpdatedAt()     { return updatedAt; }
    public void setUpdatedAt(LocalDateTime v) { this.updatedAt = v; }

    public Boolean getActive()              { return active; }
    public void setActive(Boolean v)        { this.active = v; }

    // ── UserDetails ───────────────────────────────────────────────────────────
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(role != null ? role : "ROLE_COLABORADOR"));
    }

    @Override public boolean isAccountNonExpired()    { return true; }
    @Override public boolean isAccountNonLocked()     { return true; }
    @Override public boolean isCredentialsNonExpired(){ return true; }
    @Override public boolean isEnabled()              { return Boolean.TRUE.equals(active); }
}
