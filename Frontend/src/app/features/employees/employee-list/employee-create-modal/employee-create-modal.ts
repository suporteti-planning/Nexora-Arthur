import { ChangeDetectorRef, Component, Output, EventEmitter, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Employee, EmployeeService } from '../../../../core/models/employee';
import { NotebookService } from '../../../../core/services/notebook';
import { Notebook } from '../../../../core/models/notebook';
import { EmployeeCreate } from '../../../../core/models/employee-create';
import { MICROSOFT_LICENSES, MicrosoftLicenseOption } from '../../../../core/models/microsoft-license';
import { MicrosoftLicenseApi } from '../../../../core/services/microsoft-license-api';

type AvailableLicenseOption = MicrosoftLicenseOption & {
  disabled: boolean;
  available: number;
};

interface CostCenterOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-employee-create-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-create-modal.html',  
  styleUrl: './employee-create-modal.css'       
})
export class EmployeeCreateModal implements OnInit, OnDestroy {
  @Output() closeModal = new EventEmitter<void>();
  @Output() employeeCreated = new EventEmitter<Employee>();

  step: number = 1;
  loading: boolean = true;
  isSubmitting: boolean = false;
  showPassword: boolean = false;
  notebookSearch: string = '';
  errorMessage = '';
  
  availableNotebooks: Notebook[] = [];
  filteredNotebooks: Notebook[] = [];
  selectedNotebook: Notebook | null = null;
  isExternalUser = false;
  selectedLicenses: string[] = [];
  emailAvailability: 'unchecked' | 'checking' | 'available' | 'taken' | 'invalid' = 'unchecked';
  emailAvailabilityMessage = '';
  private emailCheckSequence = 0;

  availableLicenses: AvailableLicenseOption[] = MICROSOFT_LICENSES.filter(license => license.value !== 'NONE').map(license => ({
    ...license,
    disabled: false,
    available: 0
  }));

  availableCostCenters: CostCenterOption[] = [
    { value: 'MAROX', label: 'Marox' },
    { value: 'PAC', label: 'PAC' },
    { value: 'PAC_SUDESTE', label: 'PAC Sudeste' },
    { value: 'PATOS_DE_MINAS', label: 'Patos de Minas' },
    { value: 'INNOVA', label: 'Innova' }
  ];

  formData: any = {
    name: '',
    lastName: '',
    displayName: '',
    email: '',
    password: '',
    position: '',
    department: '',
    state: '',
    office: '',
    costCenter: null,
    cpf: '',
    leader: ''
  };

  constructor(
    private notebookService: NotebookService,
    private employeeService: EmployeeService,
    private microsoftLicenseApi: MicrosoftLicenseApi,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAvailableNotebooks();
    this.loadAvailableLicenses();
  }

  ngOnDestroy(): void {
    this.isSubmitting = false;
    this.errorMessage = '';
  }

  loadAvailableLicenses(): void {
    this.microsoftLicenseApi.getInventory().subscribe({
      next: (inventory) => {
        const byValue = new Map(inventory.licenses.map(license => [license.licenseCode, license.available]));

        this.availableLicenses = MICROSOFT_LICENSES.filter(license => license.value !== 'NONE').map((license) => {
          const availableCount = byValue.get(license.value) ?? 0;
          return {
            ...license,
            disabled: availableCount <= 0,
            available: availableCount
          };
        });

        this.selectedLicenses = this.selectedLicenses.filter(value =>
          this.availableLicenses.some(license => license.value === value && !license.disabled)
        );

        this.cdr.detectChanges();
      },
      error: () => {
        this.availableLicenses = MICROSOFT_LICENSES.filter(license => license.value !== 'NONE').map(license => ({
          ...license,
          disabled: false,
          available: 0
        }));
        this.cdr.detectChanges();
      }
    });
  }

  loadAvailableNotebooks(): void {
    this.loading = true;
    this.notebookService.getAvailableNotebooks().subscribe({
      next: (data) => {
        this.availableNotebooks = data;
        this.filteredNotebooks = data.slice(0, 5);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar notebooks:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  filterNotebooks(): void {
    const search = this.notebookSearch.toLowerCase();
    this.filteredNotebooks = this.availableNotebooks.filter(nb =>
      nb.name?.toLowerCase().includes(search) ||
      nb.model?.toLowerCase().includes(search) ||
      nb.serialNumber?.toLowerCase().includes(search) ||
      nb.brand?.toLowerCase().includes(search)
    ).slice(0, 5);
  }

  selectNotebook(notebook: Notebook): void {
    this.selectedNotebook = this.selectedNotebook?.id === notebook.id ? null : notebook;
    this.cdr.detectChanges();
  }

  goToStep(step: number): void {
    if (step === 1) {
      this.step = 1;
      this.isExternalUser = false;
    } else if (step === 2 && (this.selectedNotebook || this.isExternalUser)) {
      // Preencher automaticamente o nome de exibição
      if (!this.formData.displayName) {
        this.formData.displayName = `${this.formData.name || ''} ${this.formData.lastName || ''}`.trim();
      }
      this.step = 2;
      this.cdr.detectChanges();
    }
  }

  continueAsExternalUser(): void {
    this.isExternalUser = true;
    this.selectedNotebook = null;
    this.goToStep(2);
  }

  toggleLicense(licenseValue: string): void {
    const license = this.availableLicenses.find(item => item.value === licenseValue);
    if (!license || license.disabled) {
      return;
    }

    this.cdr.detectChanges();

    const index = this.selectedLicenses.indexOf(licenseValue);
    if (index === -1) {
      this.selectedLicenses.push(licenseValue);
    } else {
      this.selectedLicenses.splice(index, 1);
    }
  }

  isLicenseSelected(licenseValue: string): boolean {
    return this.selectedLicenses.includes(licenseValue);
  }

  isLicenseDisabled(licenseValue: string): boolean {
    return this.availableLicenses.some(license => license.value === licenseValue && license.disabled);
  }

  checkEmailAvailability(): void {
    const sequence = ++this.emailCheckSequence;
    const email = (this.formData.email || '').trim();

    if (!email) {
      this.emailAvailability = 'unchecked';
      this.emailAvailabilityMessage = '';
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      this.emailAvailability = 'invalid';
      this.emailAvailabilityMessage = 'Informe um e-mail válido.';
      return;
    }

    this.emailAvailability = 'checking';
    this.emailAvailabilityMessage = 'Verificando disponibilidade do e-mail...';

    this.employeeService.checkEmailAvailability(email).subscribe({
      next: ({ available }) => {
        if (sequence !== this.emailCheckSequence) return;
        this.emailAvailability = available ? 'available' : 'taken';
        this.emailAvailabilityMessage = available
          ? 'E-mail disponível.'
          : 'Este e-mail já está em uso no sistema ou no Microsoft.';
        this.cdr.detectChanges();
      },
      error: () => {
        if (sequence !== this.emailCheckSequence) return;
        this.emailAvailability = 'unchecked';
        this.emailAvailabilityMessage = 'Não foi possível validar o e-mail neste momento.';
        this.cdr.detectChanges();
      }
    });
  }

  formatMicrosoftDepartment(): string {
    const department = (this.formData.department || '').trim();
    const leader = (this.formData.leader || '').trim();

    if (!department && !leader) {
      return '';
    }

    if (!department) {
      return leader;
    }

    if (!leader) {
      return department;
    }

    return `${department} | ${leader}`;
  }

  isFormValid(): boolean {
    return !!(
      this.formData.name &&
      this.formData.lastName &&
      this.formData.displayName &&
      this.formData.email &&
      this.formData.password &&
      this.formData.position &&
      this.formData.department &&
      this.formData.costCenter &&
      this.formData.cpf &&
      this.formData.leader &&
      this.selectedLicenses.length > 0 &&
      this.emailAvailability === 'available'
    );
  }

  createEmployee(): void {
    if (!this.isFormValid() || (!this.selectedNotebook && !this.isExternalUser) || this.isSubmitting) return;

    this.isSubmitting = true;

    const payload: EmployeeCreate = {
      name: this.formData.name + ' ' + this.formData.lastName,
      email: this.formData.email,
      cpf: this.formData.cpf || '000.000.000-00',
      position: this.formData.position,
      department: this.formData.department,
      microsoftDepartment: this.formatMicrosoftDepartment(),
      state: this.formData.costCenter,
      leader: this.formData.leader,
      costCenter: this.formData.costCenter,
      status: 'ACTIVE',
      admissionDate: new Date().toISOString().split('T')[0],
      microsoftLicenses: this.selectedLicenses,
      ...(this.selectedNotebook ? { notebookId: this.selectedNotebook.id } : {}),
      firstName: this.formData.name,
      lastName: this.formData.lastName,
      displayName: this.formData.displayName,
      password: this.formData.password,
      office: this.formData.office
    };

    this.employeeService.createEmployee(payload).subscribe({
      next: (result) => {
        this.isSubmitting = false;
        this.employeeCreated.emit(result);
        this.close();
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Erro ao criar colaborador:', err);
        alert('Erro ao criar colaborador: ' + (err.error?.message || 'Tente novamente.'));
      }
    });
  }

  close(): void {
    this.closeModal.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.close();
  }
}