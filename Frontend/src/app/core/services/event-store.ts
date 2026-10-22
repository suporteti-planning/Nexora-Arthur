import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EventStoreEvent {
  id?: number;
  eventId?: string;
  eventType?: string;
  aggregateType?: string;
  aggregateId?: number;
  eventData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  createdBy?: string;
  displayText?: string;
}

@Injectable({ providedIn: 'root' })
export class EventStoreService {
  private readonly apiUrl = `${environment.apiUrl}/api/events`;

  constructor(private http: HttpClient) {}

  getNotebookTimeline(notebookId: number): Observable<EventStoreEvent[]> {
    return this.http.get<EventStoreEvent[]>(`${this.apiUrl}/notebooks/${notebookId}`);
  }
}
