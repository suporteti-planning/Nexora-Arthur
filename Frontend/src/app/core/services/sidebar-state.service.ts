import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarStateService {
  readonly sidebarCollapsed = signal(false);

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  collapse(): void {
    this.sidebarCollapsed.set(true);
  }

  expand(): void {
    this.sidebarCollapsed.set(false);
  }
}
