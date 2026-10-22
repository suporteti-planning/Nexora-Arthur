package nexora.planning.nexora.dto;

import jakarta.validation.constraints.NotBlank;

public record MicrosoftLicenseActionDTO(
    @NotBlank String userId,
    @NotBlank String skuId
) {}
