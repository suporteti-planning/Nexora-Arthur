import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export type VaultVisibility = 'PRIVATE' | 'PUBLIC';

export interface VaultEntrySummary {
  id: number;
  title: string;
  username: string;
  url: string | null;
  category: string;
  description: string | null;
  visibility: VaultVisibility;
  ownerUsername: string;
  sharedWith: string[];
  updatedAt: string;
  canEdit: boolean;
}

export interface VaultEntryDetails extends VaultEntrySummary {
  password: string;
}

export interface VaultEntryRequest {
  title: string;
  username: string;
  password: string;
  url: string;
  category: string;
  description: string;
  visibility: VaultVisibility;
  sharedWith: string[];
}

export interface VaultUserOption {
  username: string;
  name: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class PasswordVaultApi {
  private readonly apiUrl = `${environment.apiUrl}/api/password-vault`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<VaultEntrySummary[]> {
    return this.http.get<VaultEntrySummary[]>(this.apiUrl);
  }

  users(search: string, selectedUsernames: string[] = []): Observable<VaultUserOption[]> {
    let params = new HttpParams();
    if (search.trim()) params = params.set('search', search.trim());
    selectedUsernames.forEach(username => params = params.append('selected', username));
    return this.http.get<VaultUserOption[]>(`${this.apiUrl}/users`, { params });
  }

  get(id: number): Observable<VaultEntryDetails> {
    return this.http.get<VaultEntryDetails>(`${this.apiUrl}/${id}`);
  }

  getSecret(id: number): Observable<{ password: string }> {
    return this.http.get<{ password: string }>(`${this.apiUrl}/${id}/secret`);
  }

  create(request: VaultEntryRequest): Observable<VaultEntrySummary> {
    return this.http.post<VaultEntrySummary>(this.apiUrl, request);
  }

  update(id: number, request: VaultEntryRequest): Observable<VaultEntrySummary> {
    return this.http.put<VaultEntrySummary>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}