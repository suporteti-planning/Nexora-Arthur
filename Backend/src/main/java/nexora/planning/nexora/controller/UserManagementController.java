package nexora.planning.nexora.controller;

import jakarta.validation.Valid;
import nexora.planning.nexora.dto.UserResponseDTO;
import nexora.planning.nexora.dto.UserRoleUpdateRequest;
import nexora.planning.nexora.service.UserManagementService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin-dev/users")
public class UserManagementController {
    private final UserManagementService userManagementService;

    public UserManagementController(UserManagementService userManagementService) {
        this.userManagementService = userManagementService;
    }

    @GetMapping
    public List<UserResponseDTO> listUsers() {
        return userManagementService.listUsers();
    }

    @PatchMapping("/{id}/role")
    public UserResponseDTO updateRole(
            @PathVariable Long id,
            @Valid @RequestBody UserRoleUpdateRequest request
    ) {
        return userManagementService.updateRole(id, request.role());
    }
}
