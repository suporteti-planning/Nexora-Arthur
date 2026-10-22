import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { NotebookImportResult } from '../models/notebook-import-result'
import { Notebook } from '../models/notebook';

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

  getAvailableNotebooks(): Observable<Notebook[]> {
    return this.http.get<Notebook[]>(`${this.apiUrl}/available`);
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

  importNotebooks(file: File): Observable<NotebookImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<NotebookImportResult>(
      `${this.apiUrl}/import`,
      formData
    );
  }

  downloadImportTemplate(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/import/template`, {
      responseType: 'blob'
    });
  }
}