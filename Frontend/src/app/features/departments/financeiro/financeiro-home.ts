import { Component } from '@angular/core';
import { DeptShell, DeptNavItem } from '../dept-shell/dept-shell';
import { TicketPanel } from '../../tickets/ticket-panel/ticket-panel';

@Component({
  selector: 'app-financeiro-home',
  standalone: true,
  imports: [DeptShell, TicketPanel],
  template: `
<app-dept-shell
  accentColor="#10B981"
  accentRgb="16,185,129"
  deptLabel="FINANCEIRO / COMPRAS"
  brandIconPath="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
  [navItems]="navItems">

  <div class="fin-page">
    <div class="fin-header">
      <p class="fin-label">Financeiro</p>
      <h1 class="fin-title">Financeiro / Compras</h1>
      <p class="fin-sub">Contas a pagar e receber, despesas, fluxo de caixa, cotações, fornecedores e aquisições.</p>
    </div>

    <section>
      <h2 class="fin-section-title">📥 Fila do Departamento</h2>
      <app-ticket-panel
        mode="dept"
        dept="FINANCEIRO"
        variant="financeiro"
        accentColor="#10B981"
        panelTitle="Chamados Financeiro"
      ></app-ticket-panel>
    </section>
  </div>
</app-dept-shell>`,
  styles: [`
.fin-page { display:flex; flex-direction:column; gap:1.5rem; }
.fin-label { font-size:.7rem; font-weight:700; color:rgba(16,185,129,.6); text-transform:uppercase; letter-spacing:.12em; margin:0 0 .2rem; }
.fin-title { font-size:1.5rem; font-weight:800; color:#fff; margin:0 0 .3rem; letter-spacing:-.025em; }
.fin-sub   { font-size:.825rem; color:rgba(255,255,255,.4); margin:0; }
.fin-section-title { font-size:.75rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:rgba(16,185,129,.55); margin:0 0 .875rem; }
  `],
})
export class FinanceiroHomePage {
  readonly navItems: DeptNavItem[] = [
    { label: 'Painel Financeiro', route: '/financeiro', exact: true,
      icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
    { label: 'Meus Chamados', route: '/meus-chamados',
      icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2' },
  ];
}
