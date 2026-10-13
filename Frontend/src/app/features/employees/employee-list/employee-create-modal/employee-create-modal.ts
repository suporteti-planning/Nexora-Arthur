import { ChangeDetectorRef, Component, Output, EventEmitter, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Employee, EmployeeService } from '../../../../core/models/employee';
import { NotebookService } from '../../../../core/services/notebook';
import { Notebook } from '../../../../core/models/notebook';
import { EmployeeCreate } from '../../../../core/models/employee-create';
import { MICROSOFT_LICENSES, MicrosoftLicenseOption } from '../../../../core/models/microsoft-license';

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
export class EmployeeCreateModal implements OnInit {
  @Output() closeModal = new EventEmitter<void>();
  @Output() employeeCreated = new EventEmitter<Employee>();

  step: number = 1;
  loading: boolean = true;
  isSubmitting: boolean = false;
  showPassword: boolean = false;
  notebookSearch: string = '';
  
  availableNotebooks: Notebook[] = [];
  filteredNotebooks: Notebook[] = [];
  selectedNotebook: Notebook | null = null;
  isExternalUser = false;
  selectedLicenses: string[] = [];

  availableLicenses: MicrosoftLicenseOption[] = MICROSOFT_LICENSES.filter(license => license.value !== 'NONE');

  availableCostCenters: CostCenterOption[] = [
    { value: 'MAROX', label: 'Marox' },
    { value: 'PAC', label: 'PAC' },
    { value: 'PAC_SUDESTE', label: 'PAC Sudeste' },
    { value: 'BELEM', label: 'Belém' },
    { value: 'SAO_LUIS', label: 'São Luís' },
    { value: 'PATOS_DE_MINAS', label: 'Patos de Minas' },
    { value: 'CAMPO_NOVO', label: 'Campo Novo' },
    { value: 'MACEIO', label: 'Maceió' },
    { value: 'FORTALEZA', label: 'Fortaleza' },
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
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAvailableNotebooks();
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
    }
  }

  continueAsExternalUser(): void {
    this.isExternalUser = true;
    this.selectedNotebook = null;
    this.goToStep(2);
  }

  toggleLicense(licenseValue: string): void {
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
      this.selectedLicenses.length > 0
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

    this.employeeService.createEmployee(payload as any).subscribe({
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