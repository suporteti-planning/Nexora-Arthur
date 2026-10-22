package nexora.planning.nexora.enums;

/**
 * Papéis de equipe/departamento utilizados no RBAC da intranet.
 * Mapeados na coluna users.team_role.
 */
public enum TeamRole {

    // ── Nível de acesso global ───────────────────────────────────────────────
    ROLE_ADMIN("Administrador"),
    ROLE_TI("TI — Infraestrutura"),

    // ── Equipes departamentais ────────────────────────────────────────────────
    ROLE_ADMIN_DOC("Administração do DOC"),
    ROLE_DOC("Documentação"),

    ROLE_ADMIN_RH("Administração do RH"),
    ROLE_RH("Recursos Humanos / Gestão de Gente"),

    ROLE_ADMIN_DP("Administração do DP"),
    ROLE_DP("Departamento Pessoal"),

    ROLE_ADMIN_FINANCEIRO("Administração do Financeiro"),
    ROLE_FINANCEIRO("Financeiro / Compras"),

    ROLE_ADMIN_RISCO("Administração do Gestão de Risco"),
    ROLE_RISCO("Gestão de Risco"),

    ROLE_ADMIN_FISCAL("Administração do Fiscal"),
    ROLE_FISCAL("Fiscal"),

    ROLE_ADMIN_CONTABIL("Administração do Contábil"),
    ROLE_CONTABIL("Contábil"),

    ROLE_ADMIN_DEV("Administração do Desenvolvimento / Automação"),
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
