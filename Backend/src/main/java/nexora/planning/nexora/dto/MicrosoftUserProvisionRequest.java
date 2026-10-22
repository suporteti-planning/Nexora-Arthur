package nexora.planning.nexora.dto;

import jakarta.validation.constraints.NotBlank;

public record MicrosoftUserProvisionRequest(
    @NotBlank(message = "A senha inicial é obrigatória") String password
) {
}