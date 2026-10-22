import { Component } from '@angular/core';
import { DeptShell, DeptNavItem } from '../dept-shell/dept-shell';
import { TicketPanel } from '../../tickets/ticket-panel/ticket-panel';

@Component({
  selector: 'app-dp-home',
  standalone: true,
  imports: [DeptShell, TicketPanel],
  template: `
<app-dept-shell
  accentColor="#0ae18c"
  accentRgb="10,225,140"
  deptLabel="DEPARTAMENTO PESSOAL INTERNO"
  brandIconPath="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z"
  [navItems]="navItems">

  <div class="dp-page">
    <div class="dp-header">
      <p class="dp-label">Departamento Pessoal Interno</p>
      <h1 class="dp-title">Departamento Pessoal Interno</h1>
      <p class="dp-sub">Admissões, folha, férias, rescisões, encargos, eSocial e rotinas trabalhistas.</p>
    </div>

    <section>
      <h2 class="dp-section-title">📥 Fila do Departamento</h2>
      <app-ticket-panel
        mode="dept"
        dept="DP"
        variant="sla"
        accentColor="#0ae18c"
        panelTitle="Chamados DP"
      ></app-ticket-panel>
    </section>
  </div>
</app-dept-shell>`,
  styles: [`
.dp-page { display:flex; flex-direction:column; gap:1.5rem; }
.dp-label { font-size:.7rem; font-weight:700; color:rgba(10,225,140,.6); text-transform:uppercase; letter-spacing:.12em; margin:0 0 .2rem; }
.dp-title { font-size:1.5rem; font-weight:800; color:#fff; margin:0 0 .3rem; letter-spacing:-.025em; }
.dp-sub   { font-size:.825rem; color:rgba(255,255,255,.4); margin:0; }
.dp-section-title { font-size:.75rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:rgba(10,225,140,.55); margin:0 0 .875rem; }
  `],
})
export class DpHomePage {
  readonly navItems: DeptNavItem[] = [
    { label: 'Painel Departamento Pessoal Interno', route: '/dp', exact: true,
      icon: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z' },
    { label: 'Meus Chamados', route: '/meus-chamados',
      icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2' },
  ];
}
