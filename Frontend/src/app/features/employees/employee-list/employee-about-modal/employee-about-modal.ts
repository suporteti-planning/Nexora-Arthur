import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Employee, EmployeeService } from '../../../../core/models/employee';
import { MICROSOFT_LICENSES } from '../../../../core/models/microsoft-license';

@Component({
  selector: 'app-employee-about-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-about-modal.html',
  styleUrls: ['./employee-about-modal.css']
})
export class EmployeeAboutModal {
  @Input() employee: Employee | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() employeeUpdated = new EventEmitter<Employee>();

  editingField: string | null = null;
  editData: any = {};
  isSaving = false;
  saveSuccess = false;
  saveError = false;
  errorMessage: string = 'Erro ao salvar. Tente novamente.';
  statusConfirmationPending = false;
  copiedField = '';
  editingLicenses = false;
  selectedLicenses: string[] = [];
  licenseHistory: { licenses: string[]; changedAt: string }[] = [];

  readonly availableLicenses = MICROSOFT_LICENSES;

  constructor(private employeeService: EmployeeService) {}

  ngOnInit(): void {
    this.loadLicenseHistory();
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.editingField) {
      this.cancelEdit();
    } else {
      this.close();
    }
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      if (this.editingField) {
        this.cancelEdit();
      } else {
        this.close();
      }
    }
  }

  close(): void {
    if (this.editingField) {
      this.cancelEdit();
    }
    this.closeModal.emit();
  }

  startEdit(field: string): void {
    if (!this.employee || !this.employee.id) return;
    
    this.editData = {
      name: this.employee.name,
      email: this.employee.email,
      cpf: this.employee.cpf,
      status: this.employee.status,
      position: this.employee.position,
      department: this.employee.department,
      leader: this.employee.leader,
      costCenter: this.employee.costCenter,
      admissionDate: this.employee.admissionDate,
      terminationDate: this.employee.terminationDate,
      microsoftLicenses: [...(this.employee.microsoftLicenses || [])]
    };
    
    this.editingField = field;
    if (field === 'microsoftLicenses') {
      this.selectedLicenses = [...(this.employee.microsoftLicenses || [])];
      this.editingLicenses = true;
    }
    this.saveSuccess = false;
    this.saveError = false;
    this.errorMessage = 'Erro ao salvar. Tente novamente.';
  }

  saveField(field: string): void {
    if (!this.employee || !this.employee.id) {
      this.showError('Funcionário não encontrado.');
      return;
    }

    if (field === 'status' && this.employee.status !== 'INACTIVE' && this.editData.status === 'INACTIVE' && !this.statusConfirmationPending) {
      this.statusConfirmationPending = true;
      return;
    }

    this.isSaving = true;
    this.saveSuccess = false;
    this.saveError = false;

    const patchPayload = this.buildPatchPayload(field);
    
    this.employeeService.patchEmployee(this.employee.id, patchPayload).subscribe({
      next: (result) => {
        this.isSaving = false;
        this.saveSuccess = true;
        this.employee = result;
        this.employeeUpdated.emit(result);
        if (field === 'microsoftLicenses') {
          this.recordLicenseHistory(result.microsoftLicenses || []);
          this.editingLicenses = false;
        }
        this.editingField = null;
        
        setTimeout(() => {
          this.saveSuccess = false;
        }, 3000);
      },
      error: (err) => {
        this.isSaving = false;
        this.saveError = true;
        this.errorMessage = this.getErrorMessage(err);
        console.error('Error updating employee:', err);
        
        setTimeout(() => {
          this.saveError = false;
        }, 5000);
      }
    });
  }

  private buildPatchPayload(field: string): any {
    const payload: any = {};
    const fieldMap: { [key: string]: string } = {
      'name': 'name',
      'email': 'email',
      'cpf': 'cpf',
      'status': 'status',
      'position': 'position',
      'department': 'department',
      'leader': 'leader',
      'costCenter': 'costCenter',
      'admissionDate': 'admissionDate',
      'terminationDate': 'terminationDate'
    };

    if (field in fieldMap) {
      payload[fieldMap[field]] = this.editData[field];
    } else if (field === 'microsoftLicenses') {
      payload.microsoftLicenses = this.selectedLicenses;
    }
    return payload;
  }

  private getErrorMessage(err: any): string {
    if (err.error?.message) {
      return err.error.message;
    } else if (err.status === 400) {
      return 'Dados inválidos. Verifique o campo preenchido.';
    } else if (err.status === 404) {
      return 'Funcionário não encontrado.';
    } else if (err.status === 409) {
      return 'Conflito: ' + (err.error?.message || 'Já existe um registro com esses dados.');
    }
    return 'Erro ao salvar. Tente novamente.';
  }

  private showError(message: string): void {
    this.errorMessage = message;
    this.saveError = true;
    this.isSaving = false;
    setTimeout(() => {
      this.saveError = false;
    }, 5000);
  }

  cancelEdit(): void {
    this.editingField = null;
    this.editingLicenses = false;
    this.editData = {};
    this.saveError = false;
    this.isSaving = false;
  }

  confirmStatusChange(): void {
    this.statusConfirmationPending = false;
    this.saveField('status');
  }

  cancelStatusChange(): void {
    this.statusConfirmationPending = false;
    this.editData.status = this.employee?.status;
  }

  toggleLicense(license: string): void {
    this.selectedLicenses = this.selectedLicenses.includes(license)
      ? this.selectedLicenses.filter(item => item !== license)
      : [...this.selectedLicenses, license];
  }

  isLicenseSelected(license: string): boolean {
    return this.selectedLicenses.includes(license);
  }

  copyNotebookInfo(label: string, value?: string): void {
    if (!value) return;
    navigator.clipboard?.writeText(value).then(() => {
      this.copiedField = label;
      setTimeout(() => this.copiedField = '', 1500);
    });
  }

  getLicenseLabel(license: string): string {
    return this.availableLicenses.find(item => item.value === license)?.label || license;
  }

  formatLicenses(licenses: string[]): string {
    return licenses.length ? licenses.map(license => this.getLicenseLabel(license)).join(', ') : 'Nenhuma licença';
  }

  private historyKey(): string {
    return `employee-license-history-${this.employee?.id}`;
  }

  private loadLicenseHistory(): void {
    const stored = localStorage.getItem(this.historyKey());
    this.licenseHistory = stored ? JSON.parse(stored) : [];
  }

  private recordLicenseHistory(licenses: string[]): void {
    this.licenseHistory = [
      { licenses: [...licenses], changedAt: new Date().toISOString() },
      ...this.licenseHistory
    ].slice(0, 3);
    localStorage.setItem(this.historyKey(), JSON.stringify(this.licenseHistory));
  }
}