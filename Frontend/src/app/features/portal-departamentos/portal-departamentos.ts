import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OpenTicketModal } from '../tickets/open-ticket-modal/open-ticket-modal';
import { DestDepartment } from '../../core/services/ticket.service';

interface DepartmentCard {
  id: DestDepartment;
  name: string;
  description: string;
  instructions: string[];
  icon: string;
}

@Component({
  selector: 'app-portal-departamentos',
  standalone: true,
  imports: [CommonModule, OpenTicketModal],
  template: `
<div class="portal-page">
  <div class="portal-header">
    <h1 class="portal-title">Departamentos</h1>
    <p class="portal-sub">Selecione um departamento para abrir um chamado</p>
  </div>

  @if (!selectedDept()) {
    <div class="dept-grid">
      @for (dept of departments; track dept.id) {
        <div class="dept-card" (click)="selectDept(dept)">
          <div class="dept-icon" [innerHTML]="dept.icon"></div>
          <h3 class="dept-name">{{ dept.name }}</h3>
          <p class="dept-desc">{{ dept.description }}</p>
        </div>
      }
    </div>
  } @else {
    <div class="dept-detail">
      <button class="btn-back" (click)="selectedDept.set(null)">
        ← Voltar para departamentos
      </button>

      <div class="detail-layout">
        <div class="detail-main">
          <div class="detail-header">
            <div class="detail-icon" [innerHTML]="selectedDept()!.icon"></div>
            <div>
              <h2 class="detail-title">{{ selectedDept()!.name }}</h2>
              <p class="detail-subtitle">{{ selectedDept()!.description }}</p>
            </div>
          </div>

          <div class="instructions-box">
            <h3 class="instructions-title">Informações e Instruções</h3>
            <ul class="instructions-list">
              @for (instruction of selectedDept()!.instructions; track $index) {
                <li>{{ instruction }}</li>
              }
            </ul>
          </div>
        </div>

        <div class="detail-sidebar">
          <div class="action-card">
            <h4 class="action-title">Precisa de ajuda?</h4>
            <p class="action-desc">Abra um chamado para este departamento</p>
            <button class="btn-open-ticket" (click)="showModal.set(true)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Abrir Chamado
            </button>
          </div>
        </div>
      </div>
    </div>
  }
</div>

@if (showModal()) {
  <app-open-ticket-modal
    [initialDept]="selectedDept()!.id"
    [lockDept]="true"
    (closed)="showModal.set(false)"
    (created)="onTicketCreated($event)">
  </app-open-ticket-modal>
}
  `,
  styles: [`
.portal-page { padding: 2rem; max-width: 1400px; margin: 0 auto; }
.portal-header { margin-bottom: 2.5rem; }
.portal-title { font-size: 1.75rem; font-weight: 800; color: #fff; margin: 0 0 .3rem; letter-spacing: -.025em; }
.portal-sub { font-size: .9rem; color: rgba(255,255,255,.4); margin: 0; }

.dept-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; }
.dept-card { padding: 1.5rem; border: 1px solid #282a2d; border-radius: 8px; background: #111413; cursor: pointer; transition: all .18s; }
.dept-card:hover { border-color: rgba(10,225,140,.4); background: #16171a; transform: translateY(-2px); }
.dept-icon { width: 48px; height: 48px; margin-bottom: 1rem; color: #0ae18c; }
.dept-name { font-size: 1.1rem; font-weight: 700; color: #e8f5ec; margin: 0 0 .5rem; }
.dept-desc { font-size: .85rem; color: #a5ada8; margin: 0; line-height: 1.5; }

.dept-detail { }
.btn-back { display: inline-flex; align-items: center; gap: .5rem; padding: .5rem .75rem; border: 1px solid #282a2d; border-radius: 5px; background: transparent; color: #b7c3bc; font-size: .85rem; cursor: pointer; transition: all .15s; margin-bottom: 1.5rem; }
.btn-back:hover { border-color: rgba(10,225,140,.4); color: #0ae18c; }

.detail-layout { display: grid; grid-template-columns: 1fr 320px; gap: 2rem; }
.detail-main { }
.detail-header { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 2rem; }
.detail-icon { width: 64px; height: 64px; color: #0ae18c; flex-shrink: 0; }
.detail-title { font-size: 1.5rem; font-weight: 700; color: #fff; margin: 0 0 .3rem; }
.detail-subtitle { font-size: .9rem; color: #a5ada8; margin: 0; }

.instructions-box { padding: 1.5rem; border: 1px solid #282a2d; border-radius: 8px; background: #111413; }
.instructions-title { font-size: 1.05rem; font-weight: 600; color: #e8f5ec; margin: 0 0 1rem; }
.instructions-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: .75rem; }
.instructions-list li { padding-left: 1.5rem; position: relative; font-size: .875rem; color: #b7c3bc; line-height: 1.6; }
.instructions-list li:before { content: '→'; position: absolute; left: 0; color: #0ae18c; font-weight: 700; }

.detail-sidebar { position: sticky; top: 2rem; }
.action-card { padding: 1.5rem; border: 1px solid rgba(10,225,140,.25); border-radius: 8px; background: rgba(10,225,140,.05); }
.action-title { font-size: 1.05rem; font-weight: 600; color: #e8f5ec; margin: 0 0 .5rem; }
.action-desc { font-size: .85rem; color: #a5ada8; margin: 0 0 1.25rem; }
.btn-open-ticket { width: 100%; display: flex; align-items: center; justify-content: center; gap: .6rem; padding: .75rem 1rem; border: 0; border-radius: 6px; background: #0ae18c; color: #0B0F0D; font-size: .9rem; font-weight: 600; cursor: pointer; transition: all .15s; }
.btn-open-ticket:hover { background: #09c57a; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(10,225,140,.25); }
.btn-open-ticket svg { width: 18px; height: 18px; }

@media (max-width: 968px) {
  .detail-layout { grid-template-columns: 1fr; }
  .detail-sidebar { position: static; }
}
  `]
})
export class PortalDepartamentosPage {
  private readonly router = inject(Router);

  selectedDept = signal<DepartmentCard | null>(null);
  showModal = signal(false);

  departments: DepartmentCard[] = [
    {
      id: 'DOC',
      name: 'DOC — Documentação',
      description: 'Processos societários, certidões e documentação empresarial',
      instructions: [
        'Tenha em mãos o CNPJ e razão social da empresa',
        'Informe qual processo documental você precisa',
        'Anexe documentos relevantes quando disponíveis',
        'Aguarde confirmação da equipe DOC em até 24h'
      ],
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'
    },
    {
      id: 'RH',
      name: 'Gente e Gestão',
      description: 'Recursos humanos, treinamentos e desenvolvimento',
      instructions: [
        'Descreva claramente sua dúvida ou solicitação',
        'Para questões sobre treinamentos, informe área de interesse',
        'Inclua prazos se houver urgência',
        'Respostas em até 48h úteis'
      ],
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
    },
    {
      id: 'DP',
      name: 'Departamento Pessoal Interno',
      description: 'Folha de pagamento, férias e rotinas trabalhistas',
      instructions: [
        'Informe seu CPF ou matrícula para identificação',
        'Para dúvidas sobre folha, anexe contracheque se necessário',
        'Solicitações de férias devem ser feitas com 30 dias de antecedência',
        'Prazo de resposta: 2-3 dias úteis'
      ],
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
    },
    {
      id: 'FINANCEIRO',
      name: 'Financeiro',
      description: 'Compras, pagamentos e reembolsos',
      instructions: [
        'Para reembolsos, anexe nota fiscal e comprovante',
        'Informar centro de custo quando aplicável',
        'Pagamentos são processados às quintas-feiras',
        'Dúvidas gerais respondidas em 24-48h'
      ],
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>'
    },
    {
      id: 'RISCO',
      name: 'Gestão de Risco',
      description: 'Compliance, auditoria e controles internos',
      instructions: [
        'Descreva a situação ou dúvida de compliance',
        'Anexe documentos relevantes para análise',
        'Para questões urgentes, marque como prioridade alta',
        'Retorno em até 72h úteis'
      ],
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'
    },
    {
      id: 'TI',
      name: 'TI — Infraestrutura',
      description: 'Suporte técnico, acessos e equipamentos',
      instructions: [
        'Descreva o problema técnico com detalhes',
        'Informe sistema operacional e versão se relevante',
        'Para problemas urgentes, ligue: (11) 9999-9999',
        'Atendimento remoto disponível 8h-18h'
      ],
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>'
    }
  ];

  selectDept(dept: DepartmentCard): void {
    this.selectedDept.set(dept);
  }

  onTicketCreated(ticketNumber: string): void {
    this.showModal.set(false);
    this.router.navigate(['/acompanhamento']);
  }
}
