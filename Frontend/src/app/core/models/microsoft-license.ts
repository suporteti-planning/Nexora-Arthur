export interface MicrosoftLicenseOption {
  value: string;
  label: string;
}

export const MICROSOFT_LICENSES: MicrosoftLicenseOption[] = [
  { value: 'NONE', label: 'Nenhuma' },
  { value: 'M365_BUSINESS_BASIC', label: 'Microsoft 365 Business Basic' },
  { value: 'M365_BUSINESS_BASIC_NO_TEAMS', label: 'Microsoft 365 Business Basic (no Teams)' },
  { value: 'M365_BUSINESS_STANDARD', label: 'Microsoft 365 Business Standard' },
  { value: 'M365_F1', label: 'Microsoft 365 F1' },
  { value: 'FABRIC_FREE', label: 'Microsoft Fabric (Free)' },
  { value: 'OFFICE_365_E1', label: 'Office 365 E1' },
  { value: 'OFFICE_365_E3', label: 'Office 365 E3' },
  { value: 'OFFICE_365_F3', label: 'Office 365 F3' },
  { value: 'POWERBI_PREMIUM_PER_USER', label: 'Power BI Premium Per User' },
  { value: 'POWERBI_PRO', label: 'Power BI Pro' }
];
