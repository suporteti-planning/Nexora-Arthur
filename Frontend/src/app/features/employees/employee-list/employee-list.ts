import { Component, OnInit, ChangeDetectorRef, HostListener, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Employee, EmployeeService } from '../../../core/models/employee';
import { EmployeeAboutModal } from './employee-about-modal/employee-about-modal';
import { EmployeeCreateModal } from './employee-create-modal/employee-create-modal';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [FormsModule, CommonModule, EmployeeAboutModal, EmployeeCreateModal],
  templateUrl: './employee-list.html',
  styleUrl: './employee-list.css'
})
export class EmployeeList implements OnInit {
  
  searchTerm: string = '';
  allEmployees: Employee[] = [];
  pageSize = 10;
  
  openMenuId: string | number | null = null;
  selectedEmployee: Employee | null = null;
  showAboutModal: boolean = false;
  employeePendingInactivation: Employee | null = null;
  
  readonly INITIAL_PAGE_SIZE: number = 10;
  
  constructor(
    private employeeService: EmployeeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.details-wrapper')) {
      this.openMenuId = null;
    }
  }

  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe({
      next: (data) => {
        this.allEmployees = data;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erro ao carregar colaboradores:', err);
      }
    });
  }

  toggleDetailsMenu(employeeId: string | number, event: MouseEvent): void {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === employeeId ? null : employeeId;
  }

  toggleStatus(employee: Employee): void {
    if (!employee.id) return;
    
    const newStatus = employee.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (newStatus === 'INACTIVE') {
      this.employeePendingInactivation = employee;
      this.openMenuId = null;
      return;
    }

    this.updateEmployeeStatus(employee, newStatus);
  }

  confirmEmployeeInactivation(): void {
    if (this.employeePendingInactivation) {
      this.updateEmployeeStatus(this.employeePendingInactivation, 'INACTIVE');
    }
    this.employeePendingInactivation = null;
  }

  cancelEmployeeInactivation(): void {
    this.employeePendingInactivation = null;
  }

  private updateEmployeeStatus(employee: Employee, newStatus: Employee['status']): void {
    if (!employee.id) return;
    const patchPayload = { status: newStatus };
    
    this.employeeService.patchEmployee(employee.id, patchPayload).subscribe({
      next: (result) => {
        employee.status = result.status;
        employee.active = result.status === 'ACTIVE';
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erro ao alterar status:', err);
      }
    });
    
    this.openMenuId = null;
  }

  openAbout(employee: Employee): void {
    this.openMenuId = null;
    this.selectedEmployee = employee;
    this.showAboutModal = true;
  }

  closeAboutModal(): void {
    this.showAboutModal = false;
    this.selectedEmployee = null;
  }

  onEmployeeUpdated(updatedEmployee: Employee): void {
    const index = this.allEmployees.findIndex(e => e.id === updatedEmployee.id);
    if (index !== -1) {
      this.allEmployees[index] = updatedEmployee;
      this.cdr.markForCheck();
    }
  }

  get employees(): Employee[] {
    const search = this.normalizeSearchValue(this.searchTerm);
    return this.allEmployees
      .filter(employee => this.matchesSearch(employee, search))
      .slice(0, this.pageSize);
  }

  get totalFilteredCount(): number {
    const search = this.normalizeSearchValue(this.searchTerm);
    return this.allEmployees.filter(employee => this.matchesSearch(employee, search)).length;
  }

  private matchesSearch(employee: Employee, search: string): boolean {
    const searchableValues = [
      employee.name,
      employee.email,
      employee.cpf,
      employee.position,
      employee.department,
      employee.leader,
      employee.notebook?.name,
      employee.status === 'ACTIVE' ? 'ativo' : 'inativo'
    ];

    return searchableValues.some(value => this.normalizeSearchValue(value).includes(search));
  }

  private normalizeSearchValue(value: unknown): string {
    return String(value ?? '').toLowerCase().trim();
  }

  loadMore(amount: number): void {
    this.pageSize += amount;
  }

  showAll(): void {
    this.pageSize = this.totalFilteredCount;
  }

  reduceSize(amount: number): void {
    this.pageSize = Math.max(this.INITIAL_PAGE_SIZE, this.pageSize - amount);
  }

  resetSize(): void {
    this.pageSize = this.INITIAL_PAGE_SIZE;
  }

  showCreateModal: boolean = false;

  openCreateModal(): void {
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  onEmployeeCreated(employee: Employee): void {
    this.allEmployees.unshift(employee);
    this.cdr.markForCheck();
    this.closeCreateModal();
  }
}