export interface Notebook {
  id?: number;
  name?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  processor?: string;
  ram?: string;
  storage?: string;
  price?: number;
  operatingSystem?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'BACKUP' | 'REVERSE';
  observations?: string;
  inactivationReason?: string;
  maintenanceDefect?: string;
  maintenanceSolution?: string;
  costCenter?: string;
  employeeId?: number;
  employee?: {
    id?: number;
    name?: string;
    email?: string;
    position?: string;
    department?: string;
  };
}