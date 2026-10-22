package nexora.planning.nexora.enums;

import lombok.Getter;

@Getter
public enum EmployeeStatus {
    ACTIVE("Ativo"),
    INACTIVE("Inativo");

    private final String displayName;

    EmployeeStatus(String displayName) {
        this.displayName = displayName;
    }

    public static EmployeeStatus fromDisplayName(String displayName) {
        for (EmployeeStatus status : EmployeeStatus.values()) {
            if (status.getDisplayName().equalsIgnoreCase(displayName)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Status inválido: " + displayName);
    }
}