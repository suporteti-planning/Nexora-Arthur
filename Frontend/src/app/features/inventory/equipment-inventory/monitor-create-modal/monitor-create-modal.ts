import { ChangeDetectorRef, Component, DestroyRef, EventEmitter, HostListener, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HardwareEmployeeOption, Monitor, MonitorService } from '../../../../core/models/monitor';

@Component({
  selector: 'app-monitor-create-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './monitor-create-modal.html',
  styleUrl: '../notebook-create-modal/notebook-create-modal.css'
})
export class MonitorCreateModal implements OnInit, OnDestroy {
  @Output() closeModal = new EventEmitter<void>();
  @Output() monitorCreated = new EventEmitter<Monitor>();

  isSubmitting = false;
  errorMessage = '';
  employeeSearch = '';
  employees: HardwareEmployeeOption[] = [];
  employeeSearchError = '';
  searchingEmployees = false;
  private readonly employeeSearchChanges = new Subject<string>();
  readonly costCenters = [
    ['MAROX', 'Marox'], ['PAC', 'PAC'], ['PAC_SUDESTE', 'PAC Sudeste'],
    ['PATOS_DE_MINAS', 'Patos de Minas'], ['INNOVA', 'Innova']
  ];

  formData: Monitor = {
    name: '', brand: '', model: '', serialNumber: '', price: undefined, observations: '',
    status: 'ACTIVE', costCenter: ''
  };

  constructor(
    private readonly monitorService: MonitorService,
    private readonly cdr: ChangeDetectorRef,
    private readonly destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.employeeSearchChanges.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(query => {
        this.searchingEmployees = query.trim().length >= 2;
        this.employeeSearchError = '';
        if (query.trim().length < 2) {
          this.searchingEmployees = false;
          return of([]);
        }
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
  }

  isFormValid(): boolean {
    return !!this.formData.name.trim() && !!this.formData.brand.trim() &&
      !!this.formData.model.trim() && !!this.formData.serialNumber.trim() &&
      !!this.formData.status && !!this.formData.costCenter;
  }

  onEmployeeSearch(value: string): void {
    this.employeeSearch = value;
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

  createMonitor(): void {
    if (!this.isFormValid() || this.isSubmitting) return;
    this.isSubmitting = true;
    this.errorMessage = '';
    this.monitorService.createMonitor(this.formData).subscribe({
      next: monitor => {
        this.isSubmitting = false;
        this.monitorCreated.emit(monitor);
        this.close();
        this.cdr.markForCheck();
      },
      error: err => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Não foi possível cadastrar o monitor.';
        this.cdr.markForCheck();
      }
    });
  }

  close(): void {
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
