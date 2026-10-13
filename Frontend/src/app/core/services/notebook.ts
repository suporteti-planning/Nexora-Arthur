import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Notebook } from '../models/notebook';

@Injectable({
  providedIn: 'root'
})
export class NotebookService {
  private apiUrl = `http://localhost:8080/api/notebooks`;

  constructor(private http: HttpClient) {}

  getAvailableNotebooks(): Observable<Notebook[]> {
    return this.http.get<Notebook[]>(`${this.apiUrl}/available`);
  }

  getNotebook(id: number): Observable<Notebook> {
    return this.http.get<Notebook>(`${this.apiUrl}/${id}`);
  }
}