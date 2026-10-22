import { ChangeDetectorRef, Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Employee, EmployeeService } from '../../../../core/models/employee';
import { Notebook } from '../../../../core/models/notebook';
import { NotebookService } from '../../../../core/services/notebook';
import { EventStoreEvent, EventStoreService } from '../../../../core/services/event-store';

@Component({
  selector: 'app-notebook-about-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notebook-about-modal.html',
  styleUrl: './notebook-about-modal.css',
})
export class NotebookAboutModal implements OnInit {
  @Input() notebook: Notebook | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() notebookUpdated = new EventEmitter<Notebook>();

  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  formData: Notebook = {};
  selectedEmployeeId: number | null = null;
  employeeSearch = '';
  showEmployeeOptions = false;
  isSaving = false;
  isLoadingEmployees = true;
  errorMessage = '';
  successMessage = '';
  statusConfirmationPending = false;
  statusChangeConfirmed = false;
  pendingStatus: Notebook['status'] | undefined;
  inactivationReason = '';
  maintenanceDefect = '';
  maintenanceSolution = '';
  statusConfirmationError = '';
  readonly costCenters = [
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

  constructor(
    private notebookService: NotebookService,
    private employeeService: EmployeeService,
    private eventStoreService: EventStoreService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.formData = { ...this.notebook };
    this.selectedEmployeeId = this.notebook?.employee?.id ?? null;
    this.loadTimeline();
    this.employeeService.getEmployees().subscribe({
      next: employees => {
        this.employees = employees;
        this.employeeSearch = this.notebook?.employee?.name || '';
        this.updateFilteredEmployees();
        this.isLoadingEmployees = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingEmployees = false;
        this.errorMessage = 'Não foi possível carregar os colaboradores.';
        this.cdr.detectChanges();
      }
    });
  }

  timeline: EventStoreEvent[] = [];
  isLoadingTimeline = false;
  timelineError = '';

  private loadTimeline(): void {
    if (!this.notebook?.id) return;

    this.isLoadingTimeline = true;
    this.timelineError = '';
    this.eventStoreService.getNotebookTimeline(this.notebook.id).subscribe({
      next: events => {
        this.timeline = events;
        this.isLoadingTimeline = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingTimeline = false;
        this.timelineError = 'Não foi possível carregar o histórico deste notebook.';
        this.cdr.detectChanges();
      }
    });
  }

  formatEventDate(date?: string): string {
    if (!date) return 'Data não informada';
    return new Date(date).toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    });
  }

  private updateFilteredEmployees(): void {
    const search = this.normalizeSearch(this.employeeSearch);
    const currentEmployeeId = this.notebook?.employee?.id;
    const availableEmployees = this.employees.filter(employee =>
      !employee.notebook || employee.id === currentEmployeeId
    );

    if (!search) {
      this.filteredEmployees = availableEmployees.slice(0, 5);
      return;
    }

    this.filteredEmployees = availableEmployees
      .filter(employee => this.employeeSearchFields(employee)
        .some(value => this.normalizeSearch(value).includes(search)))
      .slice(0, 5);
  }

  private employeeSearchFields(employee: Employee): string[] {
    return [employee.name, employee.email, employee.position, employee.department]
      .filter((value): value is string => typeof value === 'string');
  }

  private normalizeSearch(value: string | undefined): string {
    return (value || '').trim().toLocaleLowerCase('pt-BR');
  }

  selectEmployee(employee: Employee): void {
    this.selectedEmployeeId = employee.id ?? null;
    this.employeeSearch = employee.name;
    this.showEmployeeOptions = false;
  }

  clearEmployee(): void {
    this.selectedEmployeeId = null;
    this.employeeSearch = '';
    this.updateFilteredEmployees();
    this.showEmployeeOptions = false;
  }

  onEmployeeSearchChange(searchValue: string): void {
    this.employeeSearch = searchValue;
    this.updateFilteredEmployees();
    this.showEmployeeOptions = true;
    if (searchValue !== (this.notebook?.employee?.name || '')) {
      this.selectedEmployeeId = null;
    }
    this.cdr.markForCheck();
  }

  onStatusChange(): void {
    if (this.notebook?.status !== this.formData.status) {
      this.statusConfirmationPending = true;
      this.statusChangeConfirmed = false;
      this.pendingStatus = this.formData.status;
      this.statusConfirmationError = '';
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.employee-search-wrapper')) {
      this.showEmployeeOptions = false;
    }
  }

  save(): void {
    if (!this.notebook?.id || !this.isFormValid() || this.isSaving) return;

    if (this.notebook.status !== this.formData.status && !this.statusConfirmationPending && !this.statusChangeConfirmed) {
      this.statusConfirmationPending = true;
      this.pendingStatus = this.formData.status;
      this.statusConfirmationError = '';
      return;
    }

    this.statusChangeConfirmed = false;
    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.notebookService.updateNotebook(this.notebook.id, this.buildPayload()).subscribe({
      next: updated => {
        this.assignEmployeeIfNeeded(updated);
      },
      error: error => this.handleError(error)
    });
  }

  private assignEmployeeIfNeeded(updated: Notebook): void {
    if (!updated.id || this.selectedEmployeeId === this.notebook?.employee?.id) {
      this.finishSave(updated);
      return;
    }

    if (this.selectedEmployeeId === null) {
      this.finishSave(updated);
      return;
    }

    this.notebookService.assignEmployee(updated.id, this.selectedEmployeeId).subscribe({
      next: result => this.finishSave(result),
      error: error => this.handleError(error)
    });
  }

  private buildPayload(): Notebook {
    return {
      name: this.formData.name,
      brand: this.formData.brand,
      model: this.formData.model,
      serialNumber: this.formData.serialNumber,
      processor: this.formData.processor,
      ram: this.formData.ram,
      storage: this.formData.storage,
      price: this.formData.price,
      operatingSystem: this.formData.operatingSystem,
      observations: this.formData.observations,
      inactivationReason: this.inactivationReason.trim() || undefined,
      maintenanceDefect: this.maintenanceDefect.trim() || undefined,
      maintenanceSolution: this.maintenanceSolution.trim() || undefined,
      status: this.formData.status,
      costCenter: this.formData.costCenter,
      employeeId: this.selectedEmployeeId ?? undefined
    };
  }

  private finishSave(notebook: Notebook): void {
    this.isSaving = false;
    this.successMessage = 'Notebook atualizado com sucesso.';
    this.notebookUpdated.emit(notebook);
    this.closeModal.emit();
    this.notebook = notebook;
    this.formData = { ...notebook };
    this.selectedEmployeeId = notebook.employee?.id ?? null;
    this.employeeSearch = notebook.employee?.name || '';
    this.showEmployeeOptions = false;
  }

  private handleError(error: any): void {
    this.isSaving = false;
    this.errorMessage = error.error?.message || 'Não foi possível salvar o notebook.';
  }

  confirmStatusChange(): void {
    if (this.pendingStatus === 'INACTIVE' && !this.inactivationReason.trim()) {
      this.statusConfirmationError = 'Informe o motivo da inativação para continuar.';
      return;
    }

    if (this.pendingStatus === 'MAINTENANCE' && !this.maintenanceDefect.trim()) {
      this.statusConfirmationError = 'Informe o defeito para continuar.';
      return;
    }

    this.statusConfirmationPending = false;
    this.statusChangeConfirmed = true;
    this.pendingStatus = undefined;
    this.statusConfirmationError = '';
    this.save();
  }

  cancelStatusChange(): void {
    this.statusConfirmationPending = false;
    this.statusChangeConfirmed = false;
    this.pendingStatus = undefined;
    this.statusConfirmationError = '';
    this.formData.status = this.notebook?.status;
    this.inactivationReason = '';
    this.maintenanceDefect = '';
    this.maintenanceSolution = '';
  }

  isFormValid(): boolean {
    return !!this.formData.name && !!this.formData.brand && !!this.formData.model &&
      !!this.formData.serialNumber && !!this.formData.processor && !!this.formData.ram &&
      !!this.formData.storage && !!this.formData.status && !!this.formData.costCenter;
  }

  getStatusLabel(status?: Notebook['status']): string {
    switch (status) {
      case 'ACTIVE': return 'Ativo';
      case 'INACTIVE': return 'Inativo';
      case 'MAINTENANCE': return 'Em Manutenção';
      case 'BACKUP': return 'Backup';
      case 'REVERSE': return 'Em coleta';
      default: return 'Não informado';
    }
  }

  formatPrice(price?: number): string {
    if (price === undefined || price === null) return 'Não informado';
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  close(): void { this.closeModal.emit(); }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.close(); }
}
