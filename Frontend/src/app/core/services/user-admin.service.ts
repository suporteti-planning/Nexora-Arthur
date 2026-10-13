import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type TeamRole =
  | 'ROLE_ADMIN' | 'ROLE_TI' | 'ROLE_DOC' | 'ROLE_RH' | 'ROLE_DP'
  | 'ROLE_FINANCEIRO' | 'ROLE_RISCO' | 'ROLE_FISCAL' | 'ROLE_CONTABIL'
  | 'ROLE_DEV' | 'ROLE_COLABORADOR';

export const TEAM_ROLE_LABELS: Record<TeamRole, string> = {
  ROLE_ADMIN:       'Administrador',
  ROLE_TI:          'TI — Tecnologia da Informação',
  ROLE_DOC:         'Documentação',
  ROLE_RH:          'Recursos Humanos / GG',
  ROLE_DP:          'Departamento Pessoal',
  ROLE_FINANCEIRO:  'Financeiro / Compras',
  ROLE_RISCO:       'Gestão de Risco',
  ROLE_FISCAL:      'Fiscal',
  ROLE_CONTABIL:    'Contábil',
  ROLE_DEV:         'Desenvolvimento / Automação',
  ROLE_COLABORADOR: 'Colaborador',
};

export interface UserAdminResponse {
  id:             number;
  username:       string;
  email:          string;
  fullName:       string;
  teamRole:       TeamRole;
  teamRoleDisplay:string;
  department?:    string;
  isTeamMember:   boolean;
  active:         boolean;
  authProvider:   string;
  createdAt:      string;
}

export interface UserAdminRequest {
  username:     string;
  email:        string;
  fullName:     string;
  password?:    string;
  teamRole:     TeamRole;
  department?:  string;
  isTeamMember: boolean;
  active?:      boolean;
}

export interface PageResponse<T> {
  content:       T[];
  totalElements: number;
  totalPages:    number;
  number:        number;
  size:          number;
}

@Injectable({ providedIn: 'root' })
export class UserAdminService {
  private readonly api = `${environment.apiUrl}/api/admin/users`;

  constructor(private http: HttpClient) {}

  list(page = 0, size = 30): Observable<PageResponse<UserAdminResponse>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<UserAdminResponse>>(this.api, { params });
  }

  getById(id: number): Observable<UserAdminResponse> {
    return this.http.get<UserAdminResponse>(`${this.api}/${id}`);
  }

  create(req: UserAdminRequest): Observable<UserAdminResponse> {
    return this.http.post<UserAdminResponse>(this.api, req);
  }

  update(id: number, req: UserAdminRequest): Observable<UserAdminResponse> {
    return this.http.put<UserAdminResponse>(`${this.api}/${id}`, req);
  }

  activate(id: number): Observable<UserAdminResponse> {
    return this.http.patch<UserAdminResponse>(`${this.api}/${id}/activate`, {});
  }

  deactivate(id: number): Observable<UserAdminResponse> {
    return this.http.patch<UserAdminResponse>(`${this.api}/${id}/deactivate`, {});
  }
}
