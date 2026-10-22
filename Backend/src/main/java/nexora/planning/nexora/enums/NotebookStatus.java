package nexora.planning.nexora.enums;

import lombok.Getter;

@Getter
public enum NotebookStatus {
    ACTIVE("Ativo"),
    INACTIVE("Inativo"),
    MAINTENANCE("Em Manutenção"),
    BACKUP("Backup"),
    REVERSE("Em coleta");

    private final String displayName;

    NotebookStatus(String displayName) {
        this.displayName = displayName;
    }

    public static NotebookStatus fromDisplayName(String displayName) {
        for (NotebookStatus status : NotebookStatus.values()) {
            if (status.getDisplayName().equalsIgnoreCase(displayName)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Status inválido: " + displayName);
    }
}
