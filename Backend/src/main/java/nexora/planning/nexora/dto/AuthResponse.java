package nexora.planning.nexora.dto;

import java.util.List;

public class AuthResponse {
    
    private String token;
    private String username;
    private String email;
    private String fullName;
    private String role;
    private Long userId;
    private String authProvider;
    private List<String> teamRoles;
    private String department;

    public AuthResponse() {}
    
    public AuthResponse(String token, String username, String email, String fullName, String role, Long userId) {
        this.token = token;
        this.username = username;
        this.email = email;
        this.fullName = fullName;
        this.role = role;
        this.userId = userId;
    }
    
    // Getters e Setters
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getAuthProvider() { return authProvider; }
    public void setAuthProvider(String authProvider) { this.authProvider = authProvider; }

    public List<String> getTeamRoles() { return teamRoles; }
    public void setTeamRoles(List<String> teamRoles) { this.teamRoles = teamRoles; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
}