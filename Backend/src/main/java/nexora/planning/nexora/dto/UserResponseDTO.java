package nexora.planning.nexora.dto;

import java.time.LocalDateTime;
import java.util.List;

public class UserResponseDTO {
    
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String role;
    private String authProvider;
    private LocalDateTime createdAt;
    private Boolean active;
    private List<String> teamRoles;
    private String department;
    
    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public String getAuthProvider() { return authProvider; }
    public void setAuthProvider(String authProvider) { this.authProvider = authProvider; }

    public List<String> getTeamRoles() { return teamRoles; }
    public void setTeamRoles(List<String> teamRoles) { this.teamRoles = teamRoles; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
}