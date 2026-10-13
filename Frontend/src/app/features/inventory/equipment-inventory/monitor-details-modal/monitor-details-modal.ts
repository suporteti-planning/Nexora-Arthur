import { ChangeDetectorRef, Component, DestroyRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { HardwareEmployeeOption, Monitor, MonitorService, MonitorStatus } from '../../../../core/models/monitor';

@Component({
  selector: 'app-monitor-details-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './monitor-details-modal.html',
  styleUrl: '../notebook-about-modal/notebook-about-modal.css'
})
export class MonitorDetailsModal implements OnInit, OnDestroy {
  @Input({ required: true }) monitor!: Monitor;
  @Output() closeModal = new EventEmitter<void>();
  @Output() monitorUpdated = new EventEmitter<Monitor>();

  formData!: Monitor;
  employeeSearch = '';
  employees: HardwareEmployeeOption[] = [];
  searchingEmployees = false;
  employeeSearchError = '';
  errorMessage = '';
  isSaving = false;
  private readonly employeeSearchChanges = new Subject<string>();
  readonly costCenters = [
    ['MAROX', 'Marox'], ['PAC', 'PAC'], ['PAC_SUDESTE', 'PAC Sudeste'],
    ['PATOS_DE_MINAS', 'Patos de Minas'], ['INNOVA', 'Innova']
  ];

  constructor(
    private readonly monitorService: MonitorService,
    private readonly cdr: ChangeDetectorRef,
    private readonly destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.formData = { ...this.monitor, employee: this.monitor.employee ? { ...this.monitor.employee } : undefined };
    this.employeeSearch = this.formData.employee?.name ?? this.formData.employee?.email ?? '';
    this.employeeSearchChanges.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(query => {
        this.employeeSearchError = '';
        if (query.trim().length < 2) {
          this.searchingEmployees = false;
          return of([]);
        }
        this.searchingEmployees = true;
        return this.monitorService.searchEmployees(query.trim()).pipe(
          catchError(() => {
            this.employeeSearchError = 'Não foi possível pesquisar colaboradores.';
            return of([]);
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(employees => {
      this.employees = employees;
      this.searchingEmployees = false;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.employeeSearchChanges.complete();
    this.employees = [];
    this.employeeSearch = '';
    this.searchingEmployees = false;
    this.employeeSearchError = '';
    this.errorMessage = '';
    this.isSaving = false;
  }

  onEmployeeSearch(value: string): void {
    this.employeeSearch = value;
    if (value !== this.formData.employee?.name && value !== this.formData.employee?.email) {
      this.formData.employeeId = undefined;
      this.formData.employee = undefined;
    }
    this.employeeSearchChanges.next(value);
  }

  selectEmployee(employee: HardwareEmployeeOption): void {
    this.formData.employeeId = employee.id;
    this.formData.employee = employee;
    this.employeeSearch = employee.name ?? employee.email ?? '';
    this.employees = [];
  }

  clearEmployee(): void {
    this.formData.employeeId = undefined;
    this.formData.employee = undefined;
    this.employeeSearch = '';
    this.employees = [];
  }

  isFormValid(): boolean {
    return !!this.formData.name.trim() && !!this.formData.brand.trim() &&
      !!this.formData.model.trim() && !!this.formData.serialNumber.trim() &&
      !!this.formData.status && !!this.formData.costCenter;
  }

  getStatusLabel(status: MonitorStatus): string {
    switch (status) {
      case 'ACTIVE': return 'Ativo';
      case 'INACTIVE': return 'Inativo';
      case 'MAINTENANCE': return 'Em Manutenção';
      case 'REVERSE': return 'Em coleta';
    }
  }

  save(): void {
    if (!this.formData.id || !this.isFormValid() || this.isSaving) return;
    this.isSaving = true;
    this.errorMessage = '';
    this.monitorService.updateMonitor(this.formData.id, this.formData).subscribe({
      next: monitor => {
        this.isSaving = false;
        this.monitorUpdated.emit(monitor);
        this.cdr.markForCheck();
      },
      error: err => {
        this.isSaving = false;
        this.errorMessage = err.error?.message || 'Não foi possível salvar as alterações do monitor.';
        this.cdr.markForCheck();
      }
    });
  }

  close(): void {
    this.employees = [];
    this.employeeSearch = '';
    this.searchingEmployees = false;
    this.employeeSearchError = '';
    this.errorMessage = '';
    this.isSaving = false;

    this.closeModal.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }
}