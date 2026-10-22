import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { HardwareEmployeeOption, Monitor } from '../models/monitor';

@Injectable({ providedIn: 'root' })
export class MonitorService {
  private readonly apiUrl = 'http://localhost:8080/api/monitors';
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
    return this.http.get<HardwareEmployeeOption[]>('http://localhost:8080/api/employees/search', {
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