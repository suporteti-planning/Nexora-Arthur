import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketService, TicketResponse } from '../../../core/services/ticket.service';
import { AuthService } from '../../../core/services/auth.service';
import { formatTicketId } from '../../../core/utils/ticket-formatter';

@Component({
  selector: 'app-acompanhamento',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="acomp-page">
  <div class="acomp-header">
    <h1 class="acomp-title">Meus Chamados</h1>
    <p class="acomp-sub">Acompanhe o status das suas solicitações</p>
  </div>

  @if (loading) {
    <div class="acomp-loading">
      <span class="spinner"></span>
      <span>Carregando seus chamados...</span>
    </div>
  } @else if (tickets.length === 0) {
    <div class="acomp-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"/>
      </svg>
      <p>Você ainda não abriu nenhum chamado</p>
    </div>
  } @else {
    <div class="acomp-list">
      @for (ticket of tickets; track ticket.id) {
        <div class="ticket-card">
          <div class="ticket-header">
            <span class="ticket-id">{{ formatId(ticket.number) }}</span>
            <span class="ticket-status" [class]="'status-' + ticket.status.toLowerCase()">
              {{ getStatusLabel(ticket.status) }}
            </span>
          </div>
          <h3 class="ticket-title">{{ ticket.title }}</h3>
          <div class="ticket-meta">
            <span class="ticket-dept">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              </svg>
              {{ ticket.destDepartment }}
            </span>
            <span class="ticket-date">
              {{ formatDate(ticket.createdAt) }}
            </span>
          </div>
        </div>
      }
    </div>
  }
</div>
  `,
  styles: [`
.acomp-page { padding: 2rem; max-width: 1200px; margin: 0 auto; }
.acomp-header { margin-bottom: 2rem; }
.acomp-title { font-size: 1.75rem; font-weight: 800; color: #fff; margin: 0 0 .3rem; letter-spacing: -.025em; }
.acomp-sub { font-size: .9rem; color: rgba(255,255,255,.4); margin: 0; }

.acomp-loading { display: flex; align-items: center; gap: .75rem; padding: 2rem; color: #858d88; font-size: .9rem; }
.spinner { width: 20px; height: 20px; border: 2px solid #282a2d; border-top-color: #0ae18c; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.acomp-empty { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 3rem; color: #858d88; }
.acomp-empty svg { width: 64px; height: 64px; opacity: .5; }
.acomp-empty p { font-size: .95rem; }

.acomp-list { display: grid; gap: 1rem; }
.ticket-card { padding: 1.25rem; border: 1px solid #282a2d; border-radius: 8px; background: #111413; transition: border-color .15s, background .15s; }
.ticket-card:hover { border-color: rgba(10,225,140,.3); background: #16171a; }

.ticket-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: .75rem; }
.ticket-id { font-size: .85rem; font-weight: 700; color: #0ae18c; }
.ticket-status { padding: .25rem .55rem; border-radius: 4px; font-size: .72rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; }
.status-novo { background: rgba(10,225,140,.08); color: #0ae18c; border: 1px solid rgba(10,225,140,.2); }
.status-em_andamento { background: rgba(131,174,229,.08); color: #83aee5; border: 1px solid rgba(131,174,229,.2); }
.status-aguardando { background: rgba(226,187,97,.08); color: #e2bb61; border: 1px solid rgba(226,187,97,.2); }
.status-resolvido { background: rgba(110,231,183,.08); color: #6ee7b7; border: 1px solid rgba(110,231,183,.2); }

.ticket-title { font-size: 1.05rem; font-weight: 600; color: #e8f5ec; margin: 0 0 .65rem; }
.ticket-meta { display: flex; align-items: center; gap: 1.25rem; font-size: .8rem; color: #858d88; }
.ticket-dept { display: flex; align-items: center; gap: .4rem; }
.ticket-dept svg { width: 14px; height: 14px; }
  `]
})
export class AcompanhamentoPage implements OnInit {
  private readonly ticketSvc = inject(TicketService);
  private readonly auth = inject(AuthService);

  tickets: TicketResponse[] = [];
  loading = true;

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.ticketSvc.getMine(0, 50).subscribe({
      next: page => {
        this.tickets = page.content;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  formatId(id: string): string {
    return formatTicketId(id);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      NOVO: 'Novo',
      EM_ANDAMENTO: 'Em andamento',
      AGUARDANDO: 'Aguardando',
      RESOLVIDO: 'Resolvido',
      CANCELADO: 'Cancelado'
    };
    return labels[status] || status;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}
