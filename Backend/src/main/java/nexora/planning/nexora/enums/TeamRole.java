package nexora.planning.nexora.enums;

/**
 * Papéis de equipe/departamento utilizados no RBAC da intranet.
 * Mapeados na coluna users.team_role.
 */
public enum TeamRole {

    // ── Nível de acesso global ───────────────────────────────────────────────
    ROLE_ADMIN("Administrador"),
    ROLE_TI("TI — Tecnologia da Informação"),

    // ── Equipes departamentais ────────────────────────────────────────────────
    ROLE_DOC("Documentação"),
    ROLE_RH("Recursos Humanos / Gestão de Gente"),
    ROLE_DP("Departamento Pessoal"),
    ROLE_FINANCEIRO("Financeiro / Compras"),
    ROLE_RISCO("Gestão de Risco"),
    ROLE_FISCAL("Fiscal"),
    ROLE_CONTABIL("Contábil"),
    ROLE_DEV("Desenvolvimento / Automação"),

    // ── Colaborador sem equipe específica ────────────────────────────────────
    ROLE_COLABORADOR("Colaborador");

    private final String displayName;

    TeamRole(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() { return displayName; }

    /** Retorna o valor simples sem prefixo ROLE_ para uso em JWT claims. */
    public String shortName() {
        return this.name().replace("ROLE_", "");
    }

    /** Converte string (com ou sem ROLE_) para enum, retorna ROLE_COLABORADOR como fallback. */
    public static TeamRole fromString(String value) {
        if (value == null) return ROLE_COLABORADOR;
        String upper = value.toUpperCase().trim();
        if (!upper.startsWith("ROLE_")) upper = "ROLE_" + upper;
        try {
            return TeamRole.valueOf(upper);
        } catch (IllegalArgumentException e) {
            return ROLE_COLABORADOR;
        }
    }
}
