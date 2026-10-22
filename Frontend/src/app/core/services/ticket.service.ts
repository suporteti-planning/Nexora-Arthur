import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { TicketLocalService } from './ticket-local.service';

export type TicketPriority   = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
export type TicketStatus     = 'NOVO' | 'EM_ANDAMENTO' | 'AGUARDANDO' | 'RESOLVIDO' | 'CANCELADO';
export type DestDepartment   = 'TI' | 'DOC' | 'RH' | 'DP' | 'FINANCEIRO' | 'RISCO';

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  NOVO:          'Novo',
  EM_ANDAMENTO:  'Em andamento',
  AGUARDANDO:    'Aguardando',
  RESOLVIDO:     'Resolvido',
  CANCELADO:     'Cancelado',
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  BAIXA:   'Baixa',
  MEDIA:   'Média',
  ALTA:    'Alta',
  URGENTE: 'Urgente',
};

export const DEST_DEPT_LABELS: Record<DestDepartment, string> = {
  TI:         'TI — Infraestrutura',
  DOC:        'DOC',
  RH:         'Recursos Humanos / GG',
  DP:         'Departamento Pessoal',
  FINANCEIRO: 'Financeiro / Compras',
  RISCO:      'Gestão de Risco',
};

export interface UserSummary {
  id: number;
  username: string;
  fullName: string;
  email: string;
}

export interface DocDetailResponse {
  processId:    number;
  processName:  string;
  stepId:       number;
  stepName:     string;
  informText?:  string;
  companyName?: string;
  companyCnpj?: string;
  emailDestination?: string;
  extraData?:   Record<string, unknown>;
}

export interface HistoryEntry {
  id:            number;
  changedByName: string;
  fieldName?:    string;
  oldValue?:     string;
  newValue?:     string;
  note?:         string;
  changedAt:     string;
}

export interface TicketResponse {
  id:                 number;
  number:             string;
  title:              string;
  description?:       string;
  priority:           TicketPriority;
  status:             TicketStatus;
  destDepartment:     DestDepartment;
  destDepartmentName: string;
  requester?:         UserSummary;
  assignee?:          UserSummary;
  createdAt:          string;
  updatedAt:          string;
  closedAt?:          string;
  sourceRoute?:       string;
  docDetail?:         DocDetailResponse;
  meta?:              TicketMeta;
  history?:           HistoryEntry[];
}

export interface Page<T> {
  content:       T[];
  totalElements: number;
  totalPages:    number;
  number:        number;
  size:          number;
}

export interface TicketRequest {
  title:           string;
  description?:    string;
  priority:        TicketPriority;
  destDepartment:  DestDepartment;
  sourceRoute?:    string;
  /** DOC */
  processId?:      number;
  stepId?:         number;
  companyName?:    string;
  companyCnpj?:    string;
  emailDestination?: string;
  /** RH / DP — prazo legal SLA em dias */
  slaDays?:        number;
  /** Financeiro */
  valorEstimado?:  number;
  nfPedido?:       string;
  extraData?:      Record<string, unknown>;
}

export interface TicketMeta {
  /** SLA em dias (RH/DP) */
  slaDays?:       number;
  /** Data limite calculada */
  slaDeadline?:   string;
  /** Valor estimado (Financeiro) */
  valorEstimado?: number;
  /** NF ou número do pedido (Financeiro) */
  nfPedido?:      string;
  /** Arquivos anexados */
  attachments?:   Array<{ name?: string; filename?: string; url?: string; size?: number }>;
}

export interface TicketUpdateRequest {
  status?:     TicketStatus;
  assigneeId?: number;
  note?:       string;
}

@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly api   = `${environment.apiUrl}/api/tickets`;
  private readonly auth  = inject(AuthService);
  private readonly local = inject(TicketLocalService);

  constructor(private http: HttpClient) {}

  /** Tenta criar no backend; em caso de falha persiste localmente. */
  create(req: TicketRequest): Observable<TicketResponse> {
    return this.http.post<TicketResponse>(this.api, req).pipe(
      catchError(() => {
        const u = this.auth.sessionUser();
        const t = this.local.create(req, u?.displayName ?? 'Você', u?.email ?? '');
        return of(t);
      }),
    );
  }

  getMine(page = 0, size = 20): Observable<Page<TicketResponse>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<TicketResponse>>(`${this.api}/mine`, { params }).pipe(
      catchError(() => {
        const email = this.auth.sessionUser()?.email ?? '';
        return of(this.local.getMine(email, page, size));
      }),
    );
  }

  getByDept(dept: DestDepartment, page = 0, size = 20): Observable<Page<TicketResponse>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<TicketResponse>>(`${this.api}/dept/${dept}`, { params }).pipe(
      catchError(() => of(this.local.getByDept(dept, page, size))),
    );
  }

  getAll(dept?: DestDepartment, status?: TicketStatus, page = 0, size = 30): Observable<Page<TicketResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (dept)   params = params.set('dept', dept);
    if (status) params = params.set('status', status);
    return this.http.get<Page<TicketResponse>>(this.api, { params }).pipe(
      catchError(() => of(this.local.getAll(dept, status, page, size))),
    );
  }

  getById(id: number): Observable<TicketResponse> {
    return this.http.get<TicketResponse>(`${this.api}/${id}`).pipe(
      catchError(() => {
        const t = this.local.getById(id);
        return t ? of(t) : of(null as unknown as TicketResponse);
      }),
    );
  }

  update(id: number, req: TicketUpdateRequest): Observable<TicketResponse> {
    return this.http.patch<TicketResponse>(`${this.api}/${id}`, req).pipe(
      catchError(() => {
        const u = this.auth.sessionUser();
        const t = this.local.update(id, req, u?.displayName ?? 'Usuário');
        return t ? of(t) : of(null as unknown as TicketResponse);
      }),
    );
  }
}
