package nexora.planning.nexora.enums;

import lombok.Getter;

@Getter
public enum HardwareStatus {
    ACTIVE("Ativo"),
    INACTIVE("Inativo"),
    MAINTENANCE("Em Manutenção"),
    BACKUP("Backup"),
    REVERSE("Em coleta");

    private final String displayName;

    HardwareStatus(String displayName) {
        this.displayName = displayName;
    }
}
