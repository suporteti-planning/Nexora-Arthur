import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ManagedUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  authProvider: string;
  active: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class UserManagementApi {
  private readonly apiUrl = `${environment.apiUrl}/api/admin/users`;

  constructor(private readonly http: HttpClient) {}

  list(): Observable<ManagedUser[]> {
    return this.http.get<ManagedUser[]>(this.apiUrl);
  }

  updateRole(userId: number, role: string): Observable<ManagedUser> {
    return this.http.patch<ManagedUser>(`${this.apiUrl}/${userId}/role`, { role });
  }
}
