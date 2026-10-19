import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface LoginResponse {
  token: string;
  username: string;
  role: string;
  email?: string;
  fullName?: string;
  userId?: number;
  authProvider?: string;
  teamRole?: string;
  department?: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  fullName: string;
  role?: string;
}

export interface SessionUser {
  username: string;
  displayName: string;
  email: string;
  role: string;
  teamRole: string;
  department?: string;
  initials: string;
}

const STORAGE_KEY_TOKEN = 'nexora.token';
const STORAGE_KEY_USER  = 'nexora.session-user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/api/auth`;

  /** Reactive session user — drives UI across all components */
  private readonly _sessionUser = signal<SessionUser | null>(this.loadUserFromStorage());
  readonly sessionUser = this._sessionUser.asReadonly();
  readonly isLoggedIn  = computed(() => this._sessionUser() !== null);
  /** true para qualquer sessão demo (@demo.local ou ROLE_DEMO) */
  readonly isDemo      = computed(() => {
    const u = this._sessionUser();
    return u?.email?.endsWith('@demo.local') === true || u?.role === 'ROLE_DEMO';
  });
  /** true para TI, Admin e usuários demo — acesso completo ao sistema */
  readonly isFullAccess = computed(() => {
    const u = this._sessionUser();
    if (!u) return false;
    const r = u.teamRole ?? u.role;
    return r === 'ROLE_TI' || r === 'ROLE_ADMIN' || r === 'ROLE_DEMO'
        || u.email?.endsWith('@demo.local') === true;
  });

  constructor(private readonly http: HttpClient, private readonly router: Router) {}

  // ─── Auth actions ──────────────────────────────────────────────────────────

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/dev-login`, { username, password })
      .pipe(tap(res => this.persistSession(res)));
  }

  /**
   * Demo-mode login — works without a running backend.
   * Allowed ONLY in dev mode (never ships to production).
   */
  demoLogin(username: string, _password: string): void {
    const displayName = username.trim() || 'Usuário Demo';
    const fakeResponse: LoginResponse = {
      token: `demo-token-${Date.now()}`,
      username,
      role: 'ROLE_DEMO',
      fullName: displayName,
      email: `${username.toLowerCase().replace(/\s+/g, '.')}@demo.local`,
    };
    this.persistSession(fakeResponse);
  }

  register(req: RegisterRequest): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/dev-register`, req);
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER);
    this._sessionUser.set(null);
    this.router.navigate(['/login']);
  }

  // ─── Token helpers ─────────────────────────────────────────────────────────

  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEY_TOKEN);
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private persistSession(res: LoginResponse): void {
    localStorage.setItem(STORAGE_KEY_TOKEN, res.token);
    const user: SessionUser = {
      username:    res.username,
      displayName: res.fullName?.trim() || res.username,
      email:       res.email ?? '',
      role:        res.role,
      teamRole:    res.teamRole ?? res.role,
      department:  res.department,
      initials:    this.buildInitials(res.fullName || res.username),
    };
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    this._sessionUser.set(user);
  }

  private loadUserFromStorage(): SessionUser | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_USER);
      if (!raw) return null;
      const token = localStorage.getItem(STORAGE_KEY_TOKEN);
      if (!token) return null;
      return JSON.parse(raw) as SessionUser;
    } catch {
      return null;
    }
  }

  private buildInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
