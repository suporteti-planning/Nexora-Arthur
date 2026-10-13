package nexora.planning.nexora.dto;

import nexora.planning.nexora.enums.VaultVisibility;

import java.time.LocalDateTime;
import java.util.List;

public record PasswordVaultEntrySummary(
    Long id,
    String title,
    String username,
    String url,
    String category,
    String description,
    VaultVisibility visibility,
    String ownerUsername,
    List<String> sharedWith,
    LocalDateTime updatedAt,
    boolean canEdit
) {}