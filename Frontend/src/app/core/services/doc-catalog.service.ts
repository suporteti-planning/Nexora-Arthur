import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, shareReplay, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DOC_CATALOG_STATIC } from '../data/doc-catalog-static';

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
  private readonly api = `${environment.apiUrl}/api/doc/catalog`;
  private catalogCache$: Observable<DocProcessDTO[]> | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Tenta buscar do backend. Se falhar (offline/erro), usa o catálogo
   * estático embutido no frontend — os 26 processos oficiais da planilha.
   */
  getCatalog(): Observable<DocProcessDTO[]> {
    if (!this.catalogCache$) {
      this.catalogCache$ = this.http
        .get<DocProcessDTO[]>(`${this.api}/processes`)
        .pipe(
          catchError(() => of(DOC_CATALOG_STATIC)),
          shareReplay({ bufferSize: 1, refCount: true }),
        );
    }
    return this.catalogCache$;
  }

  getSummaries(): Observable<DocProcessDTO[]> {
    return this.http.get<DocProcessDTO[]>(`${this.api}/processes/summary`)
      .pipe(catchError(() => of(DOC_CATALOG_STATIC)));
  }

  getProcess(id: number): Observable<DocProcessDTO> {
    return this.http.get<DocProcessDTO>(`${this.api}/processes/${id}`)
      .pipe(catchError(() => of(DOC_CATALOG_STATIC.find(p => p.id === id)!)));
  }

  getSteps(processId: number): Observable<DocStepDTO[]> {
    return this.http.get<DocStepDTO[]>(`${this.api}/processes/${processId}/steps`)
      .pipe(catchError(() => of(DOC_CATALOG_STATIC.find(p => p.id === processId)?.steps ?? [])));
  }

  clearCache(): void { this.catalogCache$ = null; }
}
