import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';

export type MonitorStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'REVERSE';

export interface HardwareEmployeeOption {
  id: number;
  name: string;
  email: string;
  position?: string;
  department?: string;
}

export interface Monitor {
  id?: number;
  name: string;
  brand: string;
  model: string;
  serialNumber: string;
  observations?: string;
  price?: number;
  costCenter: string;
  status: MonitorStatus;
  employeeId?: number;
  employee?: {
    id?: number;
    name?: string;
    email?: string;
    position?: string;
    department?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class MonitorService {
  private readonly apiUrl = `${environment.apiUrl}/api/monitors`;
  private monitorsCache$: Observable<Monitor[]> | null = null;

  constructor(private readonly http: HttpClient) {}

  getMonitors(): Observable<Monitor[]> {
    if (!this.monitorsCache$) {
      this.monitorsCache$ = this.http.get<Monitor[]>(this.apiUrl).pipe(
        shareReplay({ bufferSize: 1, refCount: true })
      );
    }
    return this.monitorsCache$;
  }

  searchEmployees(query: string): Observable<HardwareEmployeeOption[]> {
    return this.http.get<HardwareEmployeeOption[]>(`${environment.apiUrl}/api/employees/search`, {
      params: { query }
    });
  }

  createMonitor(monitor: Monitor): Observable<Monitor> {
    return this.http.post<Monitor>(this.apiUrl, monitor);
  }

  updateMonitor(id: number, monitor: Monitor): Observable<Monitor> {
    return this.http.put<Monitor>(`${this.apiUrl}/${id}`, monitor);
  }

  clearCache(): void {
    this.monitorsCache$ = null;
  }
}
