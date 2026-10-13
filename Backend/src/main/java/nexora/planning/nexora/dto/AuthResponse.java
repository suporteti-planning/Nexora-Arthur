package nexora.planning.nexora.dto;

public class AuthResponse {

    private String token;
    private String username;
    private String email;
    private String fullName;
    private String role;         // ex: ROLE_TI
    private String teamRole;     // mesmo valor — alias explícito para o frontend
    private String department;
    private Long   userId;
    private String authProvider;

    public AuthResponse() {}

    // ── Getters / Setters ─────────────────────────────────────────────────────
    public String getToken()        { return token; }
    public void setToken(String v)  { this.token = v; }

    public String getUsername()         { return username; }
    public void setUsername(String v)   { this.username = v; }

    public String getEmail()            { return email; }
    public void setEmail(String v)      { this.email = v; }

    public String getFullName()         { return fullName; }
    public void setFullName(String v)   { this.fullName = v; }

    public String getRole()             { return role; }
    public void setRole(String v)       { this.role = v; this.teamRole = v; }

    public String getTeamRole()         { return teamRole; }
    public void setTeamRole(String v)   { this.teamRole = v; }

    public String getDepartment()       { return department; }
    public void setDepartment(String v) { this.department = v; }

    public Long getUserId()             { return userId; }
    public void setUserId(Long v)       { this.userId = v; }

    public String getAuthProvider()         { return authProvider; }
    public void setAuthProvider(String v)   { this.authProvider = v; }
}
