package nexora.planning.nexora.enums;

import lombok.Getter;

import java.util.EnumSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Getter
public enum MicrosoftLicense {
    NONE("Nenhuma"),

    // Catálogo gerenciado pelo Nexora. SKU part numbers são os identificadores
    // retornados pelo Microsoft Graph; aliases cobrem nomes históricos do tenant.
    M365_BUSINESS_BASIC("Microsoft 365 Business Basic"),
    M365_BUSINESS_BASIC_NO_TEAMS("Microsoft 365 Business Basic (no Teams)"),
    M365_BUSINESS_STANDARD("Microsoft 365 Business Standard"),
    M365_F1("Microsoft 365 F1"),
    COPILOT_STUDIO_VIRAL_TRIAL("Microsoft Copilot Studio Viral Trial"),
    FABRIC_FREE("Microsoft Fabric (Free)"),
    POWER_APPS_DEVELOPER("Microsoft Power Apps for Developer"),
    POWER_AUTOMATE_FREE("Microsoft Power Automate Free"),
    OFFICE_365_E1("Office 365 E1"),
    OFFICE_365_E3("Office 365 E3"),
    OFFICE_365_F3("Office 365 F3"),
    POWERBI_PREMIUM_PER_USER("Power BI Premium Per User"),
    POWERBI_PRO("Power BI Pro"),
    DYNAMICS_365_SALES_PREMIUM_VIRAL_TRIAL("Teste Viral do Dynamics 365 Sales Premium"),
    
    // Microsoft 365 Business
    FABRIC("Licença de Fábrica"),
    M365_BUSINESS_STANDARD_NO_TEAMS("Microsoft 365 Business Standard (sem Teams)"),
    M365_BUSINESS_PREMIUM("Microsoft 365 Business Premium"),
    
    // Office 365 Enterprise
    M365_E1("Microsoft 365 E1"),
    M365_E3("Microsoft 365 E3"),
    M365_E5("Microsoft 365 E5"),
    M365_F3("Microsoft 365 F3"),

    EXCHANGE_ONLINE_KIOSK("Exchange Online Kiosk"),
    
    // Teams
    MICROSOFT_TEAMS("Microsoft Teams"),
    
    // Power Platform
    POWER_APPS_PER_USER("Power Apps Per User"),
    

    WINDOWS_10_ENTERPRISE_E5("Windows 10/11 Enterprise E5");

    private static final Set<MicrosoftLicense> MANAGED = Set.of(
        M365_BUSINESS_BASIC,
        M365_BUSINESS_BASIC_NO_TEAMS,
        M365_BUSINESS_STANDARD,
        M365_F1,
        FABRIC_FREE,
        OFFICE_365_E1,
        OFFICE_365_E3,
        OFFICE_365_F3,
        POWERBI_PREMIUM_PER_USER,
        POWERBI_PRO
    );

    private static final Map<String, MicrosoftLicense> SKU_PART_NUMBERS = Map.ofEntries(
        Map.entry("O365_BUSINESS_ESSENTIALS", M365_BUSINESS_BASIC),
        Map.entry("O365_BUSINESS_ESSENTIALS_EXCHANGE_S_STANDARD", M365_BUSINESS_BASIC_NO_TEAMS),
        Map.entry("O365_BUSINESS_ESSENTIALS_EXCHANGE_S_STANDARD_NO_TEAMS", M365_BUSINESS_BASIC_NO_TEAMS),
        Map.entry("O365_BUSINESS_ESSENTIALS_EXCHANGE_S_STANDARD_NO_TEAMS_E3", M365_BUSINESS_BASIC_NO_TEAMS),
        Map.entry("MICROSOFT365BUSINESSBASICNOTEAMS", M365_BUSINESS_BASIC_NO_TEAMS),
        Map.entry("MICROSOFT365BUSINESSBASICNO_TEAMS", M365_BUSINESS_BASIC_NO_TEAMS),
        Map.entry("O365_BUSINESS_PREMIUM", M365_BUSINESS_STANDARD),
        Map.entry("SMB_BUSINESS_PREMIUM", M365_BUSINESS_STANDARD),
        Map.entry("M365_F1", M365_F1),
        Map.entry("M365F1", M365_F1),
        Map.entry("MICROSOFT365F1", M365_F1),
        Map.entry("CCIBOTS_PRIVPREV_VIRAL", COPILOT_STUDIO_VIRAL_TRIAL),
        Map.entry("POWER_BI_STANDARD", FABRIC_FREE),
        Map.entry("POWERBISTANDARD", FABRIC_FREE),
        Map.entry("POWERAPPS_DEV", POWER_APPS_DEVELOPER),
        Map.entry("FLOW_FREE", POWER_AUTOMATE_FREE),
        Map.entry("STANDARDPACK", OFFICE_365_E1),
        Map.entry("ENTERPRISEPACK", OFFICE_365_E3),
        Map.entry("DESKLESSPACK", OFFICE_365_F3),
        Map.entry("DESKLESS", OFFICE_365_F3),
        Map.entry("POWER_BI_PPU", POWERBI_PREMIUM_PER_USER),
        Map.entry("POWERBIPPU", POWERBI_PREMIUM_PER_USER),
        Map.entry("POWERBIPREMIUMPERUSER", POWERBI_PREMIUM_PER_USER),
        Map.entry("POWER_BI_PRO", POWERBI_PRO),
        Map.entry("POWERBIPRO", POWERBI_PRO)
    );

    private final String displayName;

    MicrosoftLicense(String displayName) {
        this.displayName = displayName;
    }

    public boolean isManaged() {
        return MANAGED.contains(this);
    }

    public static MicrosoftLicense fromSkuPartNumber(String skuPartNumber) {
        if (skuPartNumber == null) return null;

        String normalizedKey = normalizeKey(skuPartNumber);
        for (Map.Entry<String, MicrosoftLicense> entry : SKU_PART_NUMBERS.entrySet()) {
            if (normalizeKey(entry.getKey()).equals(normalizedKey)) {
                return entry.getValue();
            }
        }

        if (normalizedKey.contains("BUSINESSBASICNOTEAMS") || normalizedKey.contains("BASICNOTEAMS")) {
            return M365_BUSINESS_BASIC_NO_TEAMS;
        }

        if (normalizedKey.contains("M365F1") || normalizedKey.contains("F1")) {
            return M365_F1;
        }

        if (normalizedKey.contains("POWERBIPPU") || normalizedKey.contains("POWERBIPREMIUMPERUSER") || normalizedKey.contains("PPU")) {
            return POWERBI_PREMIUM_PER_USER;
        }

        if (normalizedKey.contains("POWERBIPRO") || normalizedKey.contains("PRO")) {
            return POWERBI_PRO;
        }

        for (MicrosoftLicense license : values()) {
            if (license == NONE) continue;
            if (normalizeKey(license.name()).equals(normalizedKey)) return license;
            if (normalizeKey(license.getDisplayName()).equals(normalizedKey)) return license;
            if (normalizeKey(license.getDisplayName().replace("Microsoft 365", "M365").replace("Office 365", "O365")).equals(normalizedKey)) {
                return license;
            }
        }

        return null;
    }

    private static String normalizeKey(String value) {
        if (value == null) return "";
        return value.trim()
            .replace("-", "")
            .replace("_", "")
            .replace(" ", "")
            .replace(".", "")
            .replace("/", "")
            .replace("(", "")
            .replace(")", "")
            .toUpperCase(Locale.ROOT);
    }

    public static Set<MicrosoftLicense> managedLicenses() {
        return MANAGED;
    }

    public static MicrosoftLicense fromDisplayName(String displayName) {
        for (MicrosoftLicense license : MicrosoftLicense.values()) {
            if (license.getDisplayName().equalsIgnoreCase(displayName)) {
                return license;
            }
        }
        // Se não encontrar, retornar NONE ao invés de lançar exceção
        return NONE;
    }
}