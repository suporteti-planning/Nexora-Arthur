package nexora.planning.nexora.enums;

import java.util.Locale;

public enum UserRole {
    TI_ADMIN("TI-ADMIN", "ROLE_TI_ADMIN"),
    TI_USER("TI-USER", "ROLE_TI_USER"),
    VISITOR("VISITOR", "ROLE_VISITOR");

    private final String value;
    private final String authority;

    UserRole(String value, String authority) {
        this.value = value;
        this.authority = authority;
    }

    public String getValue() {
        return value;
    }

    public String getAuthority() {
        return authority;
    }

    public static UserRole fromValue(String value) {
        if (value == null || value.isBlank()) {
            return VISITOR;
        }

        String normalized = value.trim().toUpperCase(Locale.ROOT).replace('-', '_');
        return switch (normalized) {
            case "TI_ADMIN", "ROLE_TI_ADMIN", "ROLE_ADMIN", "ADMIN" -> TI_ADMIN;
            case "TI_USER", "ROLE_TI_USER", "ROLE_USER", "USER" -> TI_USER;
            case "VISITOR", "ROLE_VISITOR" -> VISITOR;
            default -> throw new IllegalArgumentException("Papel inválido: " + value);
        };
    }

    public static UserRole fromStoredValue(String value) {
        try {
            return fromValue(value);
        } catch (IllegalArgumentException exception) {
            return VISITOR;
        }
    }
}
