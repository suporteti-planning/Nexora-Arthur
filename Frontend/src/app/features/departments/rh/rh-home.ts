import { Component } from '@angular/core';
import { DeptShell, DeptNavItem } from '../dept-shell/dept-shell';
import { TicketPanel } from '../../tickets/ticket-panel/ticket-panel';

@Component({
  selector: 'app-rh-home',
  standalone: true,
  imports: [DeptShell, TicketPanel],
  template: `
<app-dept-shell
  accentColor="#10B981"
  accentRgb="16,185,129"
  deptLabel="RH / GESTÃO DE GENTE"
  brandIconPath="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
  [navItems]="navItems">

  <div class="rh-page">
    <div class="rh-header">
      <div>
        <p class="rh-label">RH / GG</p>
        <h1 class="rh-title">Recursos Humanos &amp; Gestão de Gente</h1>
        <p class="rh-sub">Recrutamento, onboarding, treinamentos, desempenho e desenvolvimento organizacional.</p>
      </div>
    </div>

    <!-- Fila do departamento RH -->
    <section class="rh-section">
      <h2 class="rh-section-title">📥 Fila do Departamento</h2>
      <app-ticket-panel
        mode="dept"
        dept="RH"
        variant="sla"
        accentColor="#10B981"
        panelTitle="Chamados RH/GG"
      ></app-ticket-panel>
    </section>
  </div>
</app-dept-shell>`,
  styles: [`
.rh-page { display:flex; flex-direction:column; gap:1.5rem; }
.rh-header { margin-bottom:.5rem; }
.rh-label { font-size:.7rem; font-weight:700; color:rgba(16,185,129,.6); text-transform:uppercase; letter-spacing:.12em; margin:0 0 .2rem; }
.rh-title { font-size:1.5rem; font-weight:800; color:#fff; margin:0 0 .3rem; letter-spacing:-.025em; }
.rh-sub   { font-size:.825rem; color:rgba(255,255,255,.4); margin:0; }
.rh-section { }
.rh-section-title { font-size:.75rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:rgba(16,185,129,.55); margin:0 0 .875rem; }
  `],
})
export class RhHomePage {
  readonly navItems: DeptNavItem[] = [
    { label: 'Painel RH', route: '/rh', exact: true,
      icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
    { label: 'Meus Chamados', route: '/meus-chamados',
      icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2' },
  ];
}
