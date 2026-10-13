import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';
import { Notebook } from './notebook';
import { environment } from '../../../environments/environment';

export interface Employee {
  id?: number;
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
  notebook?: Notebook;
  active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private apiUrl = `${environment.apiUrl}/api/employees`;
  private employeesCache$: Observable<Employee[]> | null = null;

  constructor(private http: HttpClient) {}

  getEmployees(): Observable<Employee[]> {
    if (!this.employeesCache$) {
      this.employeesCache$ = this.http.get<Employee[]>(this.apiUrl).pipe(
        shareReplay({ bufferSize: 1, refCount: true })
      );
    }
    return this.employeesCache$;
  }

  clearCache(): void { this.employeesCache$ = null; }

  getEmployee(id: number): Observable<Employee> {
    return this.http.get<Employee>(`${this.apiUrl}/${id}`);
  }

  createEmployee(employee: Employee): Observable<Employee> {
    return this.http.post<Employee>(this.apiUrl, employee).pipe(tap(() => this.clearCache()));
  }

  updateEmployee(id: number, employee: Employee): Observable<Employee> {
    return this.http.put<Employee>(`${this.apiUrl}/${id}`, employee).pipe(tap(() => this.clearCache()));
  }

  patchEmployee(id: number, patchData: any): Observable<Employee> {
    return this.http.patch<Employee>(`${this.apiUrl}/${id}`, patchData).pipe(tap(() => this.clearCache()));
  }

  deleteEmployee(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(tap(() => this.clearCache()));
  }
}
