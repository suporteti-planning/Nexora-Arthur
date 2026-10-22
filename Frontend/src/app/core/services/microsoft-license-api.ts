import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MicrosoftLicenseInventory {
  synchronizedAt: string;
  licenses: MicrosoftTenantLicense[];
  users: MicrosoftTenantUser[];
}

export interface MicrosoftTenantLicense {
  skuId: string;
  skuPartNumber: string;
  licenseCode: string;
  displayName: string;
  capabilityStatus: string;
  purchasedEnabled: number;
  consumed: number;
  available: number;
}

export interface MicrosoftTenantUser {
  id: string;
  displayName: string;
  email: string;
  active: boolean;
  assignedSkuIds: string[];
  assignments: Record<string, {
    directlyAssigned: boolean;
    assignedByGroups: string[];
    states: string[];
    errors: string[];
  }>;
}

@Injectable({ providedIn: 'root' })
export class MicrosoftLicenseApi {
  private readonly apiUrl = `${environment.apiUrl}/api/licenses`;

  constructor(private http: HttpClient) {}

  getInventory(): Observable<MicrosoftLicenseInventory> {
    return this.http.get<MicrosoftLicenseInventory>(this.apiUrl);
  }

  assign(userId: string, skuId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/assign`, { userId, skuId });
  }

  revoke(userId: string, skuId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/revoke`, { userId, skuId });
  }
}
