import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Employee, EmployeeService } from '../../../core/models/employee';
import { MICROSOFT_LICENSES, MicrosoftLicenseOption } from '../../../core/models/microsoft-license';

type LicenseAction = 'assign' | 'revoke' | 'list';

@Component({
  selector: 'app-microsoft-license-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './microsoft-license-management.html',
  styleUrl: './microsoft-license-management.css'
})
export class MicrosoftLicenseManagement implements OnInit {
  private readonly capacityStorageKey = 'nexora.microsoft-license-capacities';
  readonly licenses = MICROSOFT_LICENSES.filter(license => license.value !== 'NONE');

  employees: Employee[] = [];
  capacities: Record<string, number> = {};
  searchTerm = '';
  loading = true;
  errorMessage = '';
  selectedLicense: MicrosoftLicenseOption | null = null;
  action: LicenseAction = 'assign';
  employeeSearch = '';
  selectedEmployeeIds: number[] = [];
  saving = false;
  modalError = '';

  constructor(
    private employeeService: EmployeeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCapacities();
    this.loadEmployees();
  }

  private loadCapacities(): void {
    try {
      const stored = localStorage.getItem(this.capacityStorageKey);
      this.capacities = stored ? JSON.parse(stored) as Record<string, number> : {};
    } catch {
      this.capacities = {};
    }
  }

  loadEmployees(): void {
    this.loading = true;
    this.errorMessage = '';
    this.employeeService.getEmployees().subscribe({
      next: employees => {
        this.employees = employees;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Não foi possível carregar os colaboradores. Tente novamente.';
        this.cdr.markForCheck();
      }
    });
  }

  get filteredLicenses(): MicrosoftLicenseOption[] {
    const search = this.searchTerm.trim().toLocaleLowerCase('pt-BR');
    return this.licenses.filter(license => license.label.toLocaleLowerCase('pt-BR').includes(search));
  }

  get totalUsed(): number {
    return this.licenses.reduce((total, license) => total + this.usedCount(license), 0);
  }

  get totalAvailable(): number {
    return this.licenses.reduce((total, license) => total + this.availableCount(license), 0);
  }

  usedCount(license: MicrosoftLicenseOption): number {
    return this.employees.filter(employee => employee.microsoftLicenses?.includes(license.value)).length;
  }

  capacity(license: MicrosoftLicenseOption): number {
    return this.capacities[license.value] ?? this.usedCount(license);
  }

  availableCount(license: MicrosoftLicenseOption): number {
    return Math.max(0, this.capacity(license) - this.usedCount(license));
  }

  updateCapacity(license: MicrosoftLicenseOption, value: number | string): void {
    const parsed = Math.max(this.usedCount(license), Math.floor(Number(value) || 0));
    this.capacities = { ...this.capacities, [license.value]: parsed };
    try {
      localStorage.setItem(this.capacityStorageKey, JSON.stringify(this.capacities));
    } catch {
      this.errorMessage = 'Não foi possível salvar as quantidades neste navegador.';
    }
  }

  openLicenseUsers(license: MicrosoftLicenseOption, action: LicenseAction): void {
    this.selectedLicense = license;
    this.action = action;
    this.employeeSearch = '';
    this.selectedEmployeeIds = [];
    this.modalError = '';
  }

  closeLicenseUsers(): void {
    if (this.saving) return;
    this.selectedLicense = null;
    this.selectedEmployeeIds = [];
    this.modalError = '';
  }

  get eligibleEmployees(): Employee[] {
    if (!this.selectedLicense) return [];
    const search = this.employeeSearch.trim().toLocaleLowerCase('pt-BR');
    return this.employees.filter(employee => {
      const hasLicense = employee.microsoftLicenses?.includes(this.selectedLicense!.value) ?? false;
      const eligible = this.action === 'assign'
        ? !hasLicense && employee.status === 'ACTIVE'
        : hasLicense;
      const matchesSearch = [employee.name, employee.email, employee.department]
        .some(value => value?.toLocaleLowerCase('pt-BR').includes(search));
      return eligible && matchesSearch;
    }).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }

  toggleEmployee(employee: Employee): void {
    if (!employee.id) return;
    this.selectedEmployeeIds = this.selectedEmployeeIds.includes(employee.id)
      ? this.selectedEmployeeIds.filter(id => id !== employee.id)
      : [...this.selectedEmployeeIds, employee.id];
  }

  isSelected(employee: Employee): boolean {
    return employee.id !== undefined && this.selectedEmployeeIds.includes(employee.id);
  }

  saveLicenseChanges(): void {
    if (!this.selectedLicense || this.selectedEmployeeIds.length === 0 || this.saving) return;

    const changes = this.employees
      .filter(employee => employee.id && this.selectedEmployeeIds.includes(employee.id))
      .map(employee => {
        const licenses = employee.microsoftLicenses ?? [];
        const updatedLicenses = this.action === 'assign'
          ? [...new Set([...licenses.filter(value => value !== 'NONE'), this.selectedLicense!.value])]
          : licenses.filter(value => value !== this.selectedLicense!.value && value !== 'NONE');
        return { employee, licenses: updatedLicenses };
      });

    if (this.action === 'assign') {
      const available = this.availableCount(this.selectedLicense);
      if (changes.length > available) {
        this.modalError = `Há somente ${available} licença(s) disponível(is). Ajuste a quantidade contratada ou selecione menos colaboradores.`;
        return;
      }
    }

    this.saving = true;
    this.modalError = '';
    forkJoin(changes.map(change => this.employeeService.patchEmployee(change.employee.id!, {
      microsoftLicenses: change.licenses
    }))).subscribe({
      next: updatedEmployees => {
        for (const updated of updatedEmployees) {
          const index = this.employees.findIndex(employee => employee.id === updated.id);
          if (index >= 0) this.employees[index] = { ...this.employees[index], ...updated };
        }
        this.employees = [...this.employees];
        this.saving = false;
        this.selectedLicense = null;
        this.selectedEmployeeIds = [];
        this.employeeService.clearCache();
        this.cdr.markForCheck();
      },
      error: () => {
        this.saving = false;
        this.modalError = 'Não foi possível atualizar todas as atribuições. Recarregue os dados e tente novamente.';
        this.employeeService.clearCache();
        this.cdr.markForCheck();
      }
    });
  }

  get assignedEmployeeCount(): number {
    return this.selectedLicense ? this.usedCount(this.selectedLicense) : 0;
  }
}
