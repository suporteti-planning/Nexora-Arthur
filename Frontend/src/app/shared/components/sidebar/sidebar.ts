import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
  private readonly storageKey = 'nexora.sidebar-preferences';
  readonly minWidth = 200;
  readonly maxWidth = 360;
  collapsed = false;
  sidebarWidth = 240;
  resizing = false;
  private resizeStartX = 0;
  private resizeStartWidth = 0;

  constructor() {
    try {
      const preferences = localStorage.getItem(this.storageKey);
      if (!preferences) return;
      const parsed = JSON.parse(preferences) as { collapsed?: boolean; width?: number };
      this.collapsed = parsed.collapsed ?? false;
      this.sidebarWidth = Math.max(this.minWidth, Math.min(this.maxWidth, Number(parsed.width) || this.sidebarWidth));
    } catch {
      this.collapsed = false;
    }
  }

  toggleSidebar(): void {
    this.collapsed = !this.collapsed;
    this.savePreferences();
  }

  startResize(event: PointerEvent): void {
    event.preventDefault();
    this.resizing = true;
    this.resizeStartX = event.clientX;
    this.resizeStartWidth = this.collapsed ? this.minWidth : this.sidebarWidth;
    this.collapsed = false;
    document.body.classList.add('sidebar-resizing');
  }

  @HostListener('document:pointermove', ['$event'])
  resizeSidebar(event: PointerEvent): void {
    if (!this.resizing) return;
    const nextWidth = this.resizeStartWidth + event.clientX - this.resizeStartX;
    this.sidebarWidth = Math.max(this.minWidth, Math.min(this.maxWidth, nextWidth));
  }

  @HostListener('document:pointerup')
  finishResize(): void {
    if (!this.resizing) return;
    this.resizing = false;
    document.body.classList.remove('sidebar-resizing');
    this.savePreferences();
  }

  resizeWithKeyboard(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    this.collapsed = false;
    const change = event.key === 'ArrowRight' ? 10 : -10;
    this.sidebarWidth = Math.max(this.minWidth, Math.min(this.maxWidth, this.sidebarWidth + change));
    this.savePreferences();
  }

  private savePreferences(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify({ collapsed: this.collapsed, width: this.sidebarWidth }));
    } catch {
      // The current session still uses the selected width when storage is unavailable.
    }
  }
}