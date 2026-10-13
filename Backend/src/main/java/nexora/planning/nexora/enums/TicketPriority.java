package nexora.planning.nexora.enums;

public enum TicketPriority {
    BAIXA("Baixa"),
    MEDIA("Média"),
    ALTA("Alta"),
    URGENTE("Urgente");

    private final String displayName;
    TicketPriority(String d) { this.displayName = d; }
    public String getDisplayName() { return displayName; }
}
