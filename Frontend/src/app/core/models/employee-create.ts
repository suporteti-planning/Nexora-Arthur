export interface EmployeeCreate {
    name: string;
    email: string;
    cpf: string;
    position: string;
    department: string;
    leader: string;
    costCenter: string;
    status: 'ACTIVE' | 'INACTIVE';
    admissionDate?: string;
    terminationDate?: string;
    microsoftLicenses?: string[];
    notebookId?: number;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    password?: string;
    office?: string;
}
