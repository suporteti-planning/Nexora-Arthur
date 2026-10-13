package nexora.planning.nexora.enums;

import lombok.Getter;

@Getter
public enum MicrosoftLicense {
    NONE("Nenhuma"),
    
    // Microsoft 365 Business
    FABRIC("Licença de Fábrica"),
    M365_BUSINESS_BASIC("Microsoft 365 Business Basic"),
    M365_BUSINESS_BASIC_NO_TEAMS("Microsoft 365 Business Basic (sem Teams)"),
    M365_BUSINESS_STANDARD("Microsoft 365 Business Standard"),
    M365_BUSINESS_STANDARD_NO_TEAMS("Microsoft 365 Business Standard (sem Teams)"),
    M365_BUSINESS_PREMIUM("Microsoft 365 Business Premium"),
    
    // Office 365 Enterprise
    E1("Office 365 E1"),
    E3("Office 365 E3"),
    E5("Office 365 E5"),
    F1("Office 365 F1"),
    F3("Office 365 F3"),
    
    // Microsoft 365 Enterprise
    M365_E3("Microsoft 365 E3"),
    M365_E5("Microsoft 365 E5"),
    M365_F3("Microsoft 365 F3"),
    
    // Exchange Online
    EXCHANGE_ONLINE_PLAN_1("Exchange Online Plan 1"),
    EXCHANGE_ONLINE_PLAN_2("Exchange Online Plan 2"),
    EXCHANGE_ONLINE_KIOSK("Exchange Online Kiosk"),
    
    // SharePoint
    SHAREPOINT_ONLINE_PLAN_1("SharePoint Online Plan 1"),
    SHAREPOINT_ONLINE_PLAN_2("SharePoint Online Plan 2"),
    
    // Teams
    MICROSOFT_TEAMS("Microsoft Teams"),
    TEAMS_EXPLORATORY("Teams Exploratory"),
    
    // Power Platform
    POWERBI_PRO("Power BI Pro"),
    POWERBI_PREMIUM_PER_USER("Power BI Premium Per User"),
    POWER_AUTOMATE_FREE("Power Automate Free"),
    POWER_APPS_PER_USER("Power Apps Per User"),
    
    // Project
    PROJECT_ONLINE_PLAN_1("Project Online Plan 1"),
    PROJECT_ONLINE_PLAN_3("Project Online Plan 3"),
    PROJECT_ONLINE_PLAN_5("Project Online Plan 5"),
    
    // Visio
    VISIO_ONLINE_PLAN_1("Visio Online Plan 1"),
    VISIO_ONLINE_PLAN_2("Visio Online Plan 2"),
    
    // Dynamics
    DYNAMICS_365_SALES("Dynamics 365 Sales"),
    DYNAMICS_365_CUSTOMER_SERVICE("Dynamics 365 Customer Service"),
    DYNAMICS_365_FIELD_SERVICE("Dynamics 365 Field Service"),
    
    // Azure AD
    AZURE_AD_PREMIUM_P1("Azure AD Premium P1"),
    AZURE_AD_PREMIUM_P2("Azure AD Premium P2"),
    
    // Outras
    MICROSOFT_DEFENDER_FOR_OFFICE_365("Microsoft Defender for Office 365"),
    MICROSOFT_PURVIEW("Microsoft Purview"),
    ENTERPRISE_MOBILITY_SECURITY_E3("Enterprise Mobility + Security E3"),
    ENTERPRISE_MOBILITY_SECURITY_E5("Enterprise Mobility + Security E5"),
    WINDOWS_10_ENTERPRISE_E3("Windows 10/11 Enterprise E3"),
    WINDOWS_10_ENTERPRISE_E5("Windows 10/11 Enterprise E5");

    private final String displayName;

    MicrosoftLicense(String displayName) {
        this.displayName = displayName;
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