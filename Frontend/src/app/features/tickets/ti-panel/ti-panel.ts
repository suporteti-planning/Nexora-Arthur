import { Component } from '@angular/core';
import { DeptShell, DeptNavItem } from '../../departments/dept-shell/dept-shell';
import { TicketPanel } from '../ticket-panel/ticket-panel';

@Component({
  selector: 'app-ti-panel',
  standalone: true,
  imports: [DeptShell, TicketPanel],
  template: `
<app-dept-shell
  accentColor="#0ae18c"
  accentRgb="10,225,140"
  deptLabel="SUPORTE TI"
  brandIconPath="M2 3h20v14H2zM8 21h8M12 17v4"
  [navItems]="navItems">

  <div class="ti-page">
    <div class="ti-header">
      <p class="ti-label">TI</p>
      <h1 class="ti-title">Painel de Chamados TI</h1>
      <p class="ti-sub">Gerencie, capture e finalize os chamados do departamento de TI.</p>
    </div>
    <app-ticket-panel
      mode="dept"
      dept="TI"
      variant="default"
      accentColor="#0ae18c"
      panelTitle="Chamados TI"
    ></app-ticket-panel>
  </div>
</app-dept-shell>`,
  styles: [`
.ti-page  { display:flex; flex-direction:column; gap:1.25rem; }
.ti-label { font-size:.7rem; font-weight:700; color:rgba(10,225,140,.6); text-transform:uppercase; letter-spacing:.12em; margin:0 0 .2rem; }
.ti-title { font-size:1.5rem; font-weight:800; color:#f0f3f1; margin:0 0 .3rem; letter-spacing:-.025em; }
.ti-sub   { font-size:.825rem; color:#858a88; margin:0; }
  `],
})
export class TiPanelPage {
  readonly navItems: DeptNavItem[] = [
    { label: 'Início',        route: '/home',          exact: true,
      icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
    { label: 'Chamados TI',   route: '/ti/chamados',   exact: true,
      icon: 'M2 3h20v14H2zM8 21h8M12 17v4' },
    { label: 'Meus Chamados', route: '/meus-chamados',
      icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2' },
  ];
}
