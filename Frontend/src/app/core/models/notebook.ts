import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';

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

@Injectable({ providedIn: 'root' })
export class NotebookService {
  private readonly apiUrl = 'http://localhost:8080/api/notebooks';
  private notebooksCache$: Observable<Notebook[]> | null = null;

  constructor(private http: HttpClient) {}

  getNotebooks(): Observable<Notebook[]> {
    if (!this.notebooksCache$) {
      this.notebooksCache$ = this.http.get<Notebook[]>(this.apiUrl).pipe(
        shareReplay({ bufferSize: 1, refCount: true })
      );
    }
    return this.notebooksCache$;
  }

  clearCache(): void {
    this.notebooksCache$ = null;
  }

  createNotebook(notebook: Notebook): Observable<Notebook> {
    return this.http.post<Notebook>(this.apiUrl, notebook).pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  updateNotebook(id: number, notebook: Notebook): Observable<Notebook> {
    return this.http.put<Notebook>(`${this.apiUrl}/${id}`, notebook);
  }

  assignEmployee(notebookId: number, employeeId: number): Observable<Notebook> {
    return this.http.post<Notebook>(`${this.apiUrl}/${notebookId}/assign/${employeeId}`, {});
  }

  deleteNotebook(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}