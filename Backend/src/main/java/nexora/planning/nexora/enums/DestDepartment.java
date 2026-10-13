package nexora.planning.nexora.enums;

/**
 * Departamentos elegíveis como destinatários de chamados.
 * Fiscal, Contábil e Desenvolvimento são excluídos conforme regra de negócio.
 */
public enum DestDepartment {
    TI("TI — Tecnologia da Informação"),
    DOC("Documentação"),
    RH("Recursos Humanos / GG"),
    DP("Departamento Pessoal"),
    FINANCEIRO("Financeiro / Compras"),
    RISCO("Gestão de Risco");

    private final String displayName;
    DestDepartment(String d) { this.displayName = d; }
    public String getDisplayName() { return displayName; }
}
