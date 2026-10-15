import { Component } from '@angular/core';
import { DeptShell, DeptNavItem } from '../../departments/dept-shell/dept-shell';
import { TicketPanel } from '../ticket-panel/ticket-panel';

@Component({
  selector: 'app-meus-chamados',
  standalone: true,
  imports: [DeptShell, TicketPanel],
  template: `
<app-dept-shell
  accentColor="#00FF66"
  accentRgb="0,255,102"
  deptLabel="ACOMPANHAMENTOS"
  brandIconPath="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
  [navItems]="navItems">

  <div class="mc-page">
    <div class="mc-header">
      <p class="mc-label">Minhas solicitações</p>
      <h1 class="mc-title">Acompanhamento de Chamados</h1>
      <p class="mc-sub">Monitore o progresso de todas as solicitações que você enviou aos departamentos.</p>
    </div>

    <app-ticket-panel
      mode="mine"
      variant="default"
      accentColor="#00FF66"
      panelTitle="Meus Chamados"
      panelSub="Todas as solicitações abertas por você"
    ></app-ticket-panel>
  </div>
</app-dept-shell>`,
  styles: [`
.mc-page { display:flex; flex-direction:column; gap:1.25rem; }
.mc-label { font-size:.7rem; font-weight:700; color:rgba(0,255,102,.6); text-transform:uppercase; letter-spacing:.12em; margin:0 0 .2rem; }
.mc-title { font-size:1.5rem; font-weight:800; color:#fff; margin:0 0 .3rem; letter-spacing:-.025em; }
.mc-sub   { font-size:.825rem; color:rgba(255,255,255,.4); margin:0; }
  `],
})
export class MeusChamadosPage {
  readonly navItems: DeptNavItem[] = [
    { label: 'Início', route: '/home',
      icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
    { label: 'Meus Chamados', route: '/meus-chamados', exact: true,
      icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2' },
    { label: 'Painel DOC', route: '/doc',
      icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' },
  ];
}
