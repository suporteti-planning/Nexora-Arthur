package nexora.planning.nexora.enums;

public enum TicketStatus {
    NOVO("Novo"),
    EM_ANDAMENTO("Em andamento"),
    AGUARDANDO("Aguardando informações"),
    RESOLVIDO("Resolvido"),
    CANCELADO("Cancelado");

    private final String displayName;
    TicketStatus(String d) { this.displayName = d; }
    public String getDisplayName() { return displayName; }
}
