package nexora.planning.nexora.enums;

import lombok.Getter;

@Getter
public enum costCenter {
    MAROX("Marox"),
    PAC("PAC"),
    PAC_SUDESTE("PAC Sudeste"),
    BELEM("Belém"),
    SAO_LUIS("São Luís"),
    PATOS_DE_MINAS("Patos de Minas"),
    CAMPO_NOVO("Campo Novo"),
    MACEIO("Maceió"),
    FORTALEZA("Fortaleza"),
    INNOVA("Innova");

    private final String displayName;

    costCenter(String displayName) {
        this.displayName = displayName;
    }

    public static costCenter fromDisplayName(String displayName) {
        for (costCenter center : costCenter.values()) {
            if (center.getDisplayName().equalsIgnoreCase(displayName)) {
                return center;
            }
        }
        throw new IllegalArgumentException("Centro de custo inválido: " + displayName);
    }
}