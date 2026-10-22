import { Injectable } from '@angular/core';
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

