package nexora.planning.nexora.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record MicrosoftLicenseInventoryDTO(
    LocalDateTime synchronizedAt,
    List<LicenseSku> licenses,
    List<LicensedUser> users
) {
    public record LicenseSku(
        String skuId,
        String skuPartNumber,
        String licenseCode,
        String displayName,
        String capabilityStatus,
        int purchasedEnabled,
        int consumed,
        int available
    ) {}

    public record LicensedUser(
        String id,
        String displayName,
        String email,
        boolean active,
        List<String> assignedSkuIds,
        Map<String, Assignment> assignments
    ) {}

    public record Assignment(
        boolean directlyAssigned,
        List<String> assignedByGroups,
        List<String> states,
        List<String> errors
    ) {}
}
