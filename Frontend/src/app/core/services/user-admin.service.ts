import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type TeamRoles =
  | 'ROLE_ADMIN' | 'ROLE_TI' | 'ROLE_COLABORADOR'
  | 'ROLE_DOC'          | 'ROLE_ADMIN_DOC'
  | 'ROLE_RH'           | 'ROLE_ADMIN_RH'
  | 'ROLE_DP'           | 'ROLE_ADMIN_DP'
  | 'ROLE_FINANCEIRO'   | 'ROLE_ADMIN_FINANCEIRO'
  | 'ROLE_RISCO'        | 'ROLE_ADMIN_RISCO'
  | 'ROLE_FISCAL'       | 'ROLE_ADMIN_FISCAL'
  | 'ROLE_CONTABIL'     | 'ROLE_ADMIN_CONTABIL'
  | 'ROLE_DEV'          | 'ROLE_ADMIN_DEV';

export const TEAM_ROLE_LABELS: Record<TeamRoles, string> = {
  ROLE_ADMIN:            'Administrador',
  ROLE_TI:               'TI — Infraestrutura',
  ROLE_COLABORADOR:      'Colaborador',
  ROLE_DOC:              'Documentação',
  ROLE_ADMIN_DOC:        'Admin — DOC',
  ROLE_RH:               'Recursos Humanos / GG',
  ROLE_ADMIN_RH:         'Admin — RH',
  ROLE_DP:               'Departamento Pessoal',
  ROLE_ADMIN_DP:         'Admin — DP',
  ROLE_FINANCEIRO:       'Financeiro / Compras',
  ROLE_ADMIN_FINANCEIRO: 'Admin — Financeiro',
  ROLE_RISCO:            'Gestão de Risco',
  ROLE_ADMIN_RISCO:      'Admin — Gestão de Risco',
  ROLE_FISCAL:           'Fiscal',
  ROLE_ADMIN_FISCAL:     'Admin — Fiscal',
  ROLE_CONTABIL:         'Contábil',
  ROLE_ADMIN_CONTABIL:   'Admin — Contábil',
  ROLE_DEV:              'Desenvolvimento / Automação',
  ROLE_ADMIN_DEV:        'Admin — Desenvolvimento',
};
export interface UserAdminResponse {
  id:             number;
  username:       string;
  email:          string;
  fullName:       string;
  teamRoles:      TeamRoles[];
  teamRolesDisplay:string;
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
  teamRoles:     TeamRoles[];
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
