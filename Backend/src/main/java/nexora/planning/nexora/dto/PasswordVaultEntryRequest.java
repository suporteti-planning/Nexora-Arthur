package nexora.planning.nexora.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import nexora.planning.nexora.enums.VaultVisibility;

import java.util.Set;

public record PasswordVaultEntryRequest(
    @NotBlank @Size(max = 80) String title,
    @NotBlank @Size(max = 160) String username,
    @NotBlank @Size(max = 128) String password,
    @Size(max = 240) String url,
    @NotBlank @Size(max = 32) String category,
    @Size(max = 240) String description,
    @NotNull VaultVisibility visibility,
    Set<String> sharedWith
) {}