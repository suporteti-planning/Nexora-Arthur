import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';

export interface DocStepDTO {
  id:               number;
  code:             string;
  name:             string;
  informText?:      string;
  requiresCompany:  boolean;
  requiresDocuments:boolean;
  requiresEmailAddress: boolean;
  sortOrder:        number;
}

export interface DocProcessDTO {
  id:          number;
  code:        string;
  name:        string;
  description?:string;
  sortOrder:   number;
  steps:       DocStepDTO[];
}

@Injectable({ providedIn: 'root' })
export class DocCatalogService {
  private readonly api = 'http://localhost:8080/api/doc/catalog';

  // Cache dos processos completos (para o formulário)
  private catalogCache$: Observable<DocProcessDTO[]> | null = null;

  constructor(private http: HttpClient) {}

  getCatalog(): Observable<DocProcessDTO[]> {
    if (!this.catalogCache$) {
      this.catalogCache$ = this.http
        .get<DocProcessDTO[]>(`${this.api}/processes`)
        .pipe(shareReplay({ bufferSize: 1, refCount: true }));
    }
    return this.catalogCache$;
  }

  getSummaries(): Observable<DocProcessDTO[]> {
    return this.http.get<DocProcessDTO[]>(`${this.api}/processes/summary`);
  }

  getProcess(id: number): Observable<DocProcessDTO> {
    return this.http.get<DocProcessDTO>(`${this.api}/processes/${id}`);
  }

  getSteps(processId: number): Observable<DocStepDTO[]> {
    return this.http.get<DocStepDTO[]>(`${this.api}/processes/${processId}/steps`);
  }

  clearCache(): void { this.catalogCache$ = null; }
}
