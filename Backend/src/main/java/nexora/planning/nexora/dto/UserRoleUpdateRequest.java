package nexora.planning.nexora.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UserRoleUpdateRequest(
    @NotBlank(message = "Papel é obrigatório")
    @Pattern(regexp = "TI-ADMIN|TI-USER|VISITOR", message = "Papel inválido")
    String role
) {}
