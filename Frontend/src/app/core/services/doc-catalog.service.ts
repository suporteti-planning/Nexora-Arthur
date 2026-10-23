import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface DocStepResponse {
  id: number;
  code: string;
  name: string;
  informText?: string;
  requiresCompany: boolean;
  requiresDocuments: boolean;
  requiresEmailAddress: boolean;
  sortOrder: number;
}

export interface DocProcessResponse {
  id: number;
  code: string;
  name: string;
  description: string;
  sortOrder: number;
  steps: DocStepResponse[];
}

@Injectable({
  providedIn: 'root'
})
export class DocCatalogService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/doc/catalog';
  private processesCache$ = new BehaviorSubject<DocProcessResponse[]>([]);

  /**
   * Busca todos os processos de documentação com suas etapas
   */
  getProcesses(): Observable<DocProcessResponse[]> {
    return this.http.get<DocProcessResponse[]>(`${this.apiUrl}/processes`)
      .pipe(
        tap(processes => this.processesCache$.next(processes))
      );
  }

  /**
   * Busca processo específico por código
   */
  getProcessByCode(code: string): Observable<DocProcessResponse> {
    return this.http.get<DocProcessResponse>(`${this.apiUrl}/processes/${code}`);
  }

  /**
   * Retorna os processos em cache (sem fazer nova requisição)
   */
  getProcessesFromCache(): DocProcessResponse[] {
    return this.processesCache$.value;
  }

  /**
   * Limpa o cache
   */
  clearCache(): void {
    this.processesCache$.next([]);
  }
}
