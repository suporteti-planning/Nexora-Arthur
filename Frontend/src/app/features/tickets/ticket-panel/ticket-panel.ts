/**
 * TicketPanel — Componente base reutilizável de acompanhamento de chamados.
 *
 * Modos de operação via @Input() mode:
 *   'mine'       → chamados abertos pelo usuário logado (acompanhamento pessoal)
 *   'dept'       → fila do departamento (gestão interna)
 *
 * Variações contextuais via @Input() variant:
 *   'default'    → padrão (DOC, TI, Risco)
 *   'sla'        → destaca Prioridade e SLA (RH/GG, DP)
 *   'financeiro' → campos Valor Estimado e NF/Pedido
 */
import {
  Component, Input, Output, EventEmitter, OnInit, OnChanges,
  signal, computed, inject, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  TicketService, TicketResponse, TicketStatus, TicketUpdateRequest,
  DestDepartment, TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS,
} from '../../../core/services/ticket.service';
import { AuthService } from '../../../core/services/auth.service';
import { OpenTicketModal } from '../open-ticket-modal/open-ticket-modal';

export type PanelMode    = 'mine' | 'dept';
export type PanelVariant = 'default' | 'sla' | 'financeiro';

interface StatusFilter {
  value: TicketStatus | '';
  label: string;
}

@Component({
  selector: 'app-ticket-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, OpenTicketModal],
  templateUrl: './ticket-panel.html',
  styleUrl:    './ticket-panel.css',
})
export class TicketPanel implements OnInit, OnChanges {
  /** 'mine' = meus chamados | 'dept' = fila do departamento */
  @Input() mode: PanelMode = 'mine';
  /** Variante visual e funcional */
  @Input() variant: PanelVariant = 'default';
  /** Departamento destino (obrigatório quando mode='dept') */
  @Input() dept?: DestDepartment;
  /** Cor de destaque do departamento (CSS color string) */
  @Input() accentColor = '#00FF66';
  /** Título exibido no cabeçalho do painel */
  @Input() panelTitle = 'Chamados';
  /** Subtítulo */
  @Input() panelSub   = '';
  /** Emite quando um chamado é criado (número) */
  @Output() ticketCreatedEvt = new EventEmitter<string>();

  private readonly ticketSvc = inject(TicketService);
  private readonly auth      = inject(AuthService);
  private readonly cdr       = inject(ChangeDetectorRef);

  readonly user = this.auth.sessionUser;

  // ── State ─────────────────────────────────────────────────────────────────
  allTickets  = signal<TicketResponse[]>([]);
  loading     = signal(true);
  loadError   = signal(false);
  searchQuery = '';

  readonly ALL_FILTERS: StatusFilter[] = [
    { value: 'NOVO',         label: 'Novos'        },
    { value: 'EM_ANDAMENTO', label: 'Em andamento' },
    { value: 'RESOLVIDO',    label: 'Resolvidos'   },
    { value: 'AGUARDANDO',   label: 'Aguardando'   },
  ];
  activeFilters = signal<Set<TicketStatus | ''>>(new Set(['NOVO', 'EM_ANDAMENTO']));

  // ── Modal abertura ────────────────────────────────────────────────────────
  showNewModal  = signal(false);
  createdNumber = signal<string | null>(null);

  // ── Modal detalhe ─────────────────────────────────────────────────────────
  detailTicket  = signal<TicketResponse | null>(null);
  newComment    = '';
  newStatus: TicketStatus | '' = '';
  savingUpdate  = false;
  updateError   = '';

  // ── Computed ──────────────────────────────────────────────────────────────
  readonly filteredTickets = computed(() => {
    const q   = this.searchQuery.trim().toLowerCase();
    const sts = this.activeFilters();
    return this.allTickets().filter(t => {
      const matchSt = sts.size === 0 || sts.has(t.status);
      const matchQ  = !q ||
        t.title.toLowerCase().includes(q) ||
        t.number.toLowerCase().includes(q) ||
        (t.requester?.fullName ?? '').toLowerCase().includes(q);
      return matchSt && matchQ;
    });
  });

  readonly countByStatus = computed(() => {
    const c: Record<string, number> = {};
    for (const t of this.allTickets()) c[t.status] = (c[t.status] ?? 0) + 1;
    return c;
  });

  readonly kpis = computed(() => {
    const all  = this.allTickets();
    const open = all.filter(t => t.status === 'NOVO' || t.status === 'EM_ANDAMENTO').length;
    const done = all.filter(t => t.status === 'RESOLVIDO').length;
    const wait = all.filter(t => t.status === 'AGUARDANDO').length;
    const urgent = all.filter(t => t.priority === 'URGENTE' && t.status !== 'RESOLVIDO').length;

    // SLA vencidos (modo SLA)
    const overdue = all.filter(t => {
      if (!t.meta?.slaDeadline) return false;
      return new Date(t.meta.slaDeadline) < new Date() && t.status !== 'RESOLVIDO';
    }).length;

    return { open, done, wait, urgent, overdue, total: all.length };
  });

  readonly statusLabels   = TICKET_STATUS_LABELS;
  readonly priorityLabels = TICKET_PRIORITY_LABELS;
  readonly allStatuses: TicketStatus[] = ['NOVO','EM_ANDAMENTO','AGUARDANDO','RESOLVIDO','CANCELADO'];

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit():    void { this.loadData(); }
  ngOnChanges(): void { this.loadData(); }

  loadData(): void {
    this.loading.set(true);
    this.loadError.set(false);
    const obs = this.mode === 'mine'
      ? this.ticketSvc.getMine(0, 200)
      : this.ticketSvc.getByDept(this.dept!, 0, 200);

    obs.subscribe({
      next:  pg => { this.allTickets.set(pg.content); this.loading.set(false); this.cdr.markForCheck(); },
      error: ()  => { this.loading.set(false); this.loadError.set(true); this.cdr.markForCheck(); },
    });
  }

  // ── Filters ───────────────────────────────────────────────────────────────
  toggleFilter(v: TicketStatus | ''): void {
    this.activeFilters.update(s => {
      const n = new Set(s);
      n.has(v) ? n.delete(v) : n.add(v);
      return n;
    });
  }
  isFilterActive(v: TicketStatus | ''): boolean { return this.activeFilters().has(v); }

  // ── Modal abertura ────────────────────────────────────────────────────────
  openNew():  void { this.createdNumber.set(null); this.showNewModal.set(true); }
  closeNew(): void { this.showNewModal.set(false); }
  onCreated(num: string): void {
    this.createdNumber.set(num);
    this.showNewModal.set(false);
    this.ticketCreatedEvt.emit(num);
    this.loadData();
  }

  // ── Modal detalhe ─────────────────────────────────────────────────────────
  openDetail(t: TicketResponse): void {
    this.detailTicket.set(t);
    this.newStatus   = t.status;
    this.newComment  = '';
    this.updateError = '';
    this.ticketSvc.getById(t.id).subscribe({
      next: full => { if (full) this.detailTicket.set(full); this.cdr.markForCheck(); },
    });
  }
  closeDetail(): void { this.detailTicket.set(null); }

  saveUpdate(): void {
    const t = this.detailTicket();
    if (!t) return;
    if (!this.newComment.trim() && (!this.newStatus || this.newStatus === t.status)) {
      this.updateError = 'Informe um comentário ou altere o status.'; return;
    }
    this.savingUpdate = true;
    this.updateError  = '';
    const req: TicketUpdateRequest = {
      status: (this.newStatus && this.newStatus !== t.status) ? this.newStatus as TicketStatus : undefined,
      note:   this.newComment.trim() || undefined,
    };
    this.ticketSvc.update(t.id, req).subscribe({
      next: updated => {
        this.savingUpdate = false;
        if (updated) {
          this.detailTicket.set(updated);
          this.allTickets.update(all => all.map(x => x.id === updated.id ? updated : x));
        }
        this.newComment  = '';
        this.newStatus   = updated?.status ?? t.status;
        this.cdr.markForCheck();
      },
      error: () => { this.savingUpdate = false; this.updateError = 'Erro ao salvar.'; this.cdr.markForCheck(); },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  getStatusClass(s: TicketStatus): string {
    return ({ NOVO:'tp-novo', EM_ANDAMENTO:'tp-andamento', AGUARDANDO:'tp-aguardando',
              RESOLVIDO:'tp-resolvido', CANCELADO:'tp-cancelado' })[s] ?? '';
  }
  getPriorClass(p: string): string {
    return ({ BAIXA:'tpr-baixa', MEDIA:'tpr-media', ALTA:'tpr-alta', URGENTE:'tpr-urgente' })[p] ?? '';
  }
  getStatusLabel(v: string | undefined): string {
    return this.statusLabels[v as TicketStatus] ?? v ?? '—';
  }
  formatDate(iso: string): string {
    if (!iso) return '—';
    return new Intl.DateTimeFormat('pt-BR', {
      day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit',
    }).format(new Date(iso));
  }
  formatCurrency(v?: number): string {
    if (v == null) return '—';
    return new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(v);
  }
  slaStatusClass(t: TicketResponse): string {
    if (!t.meta?.slaDeadline || t.status === 'RESOLVIDO') return '';
    const diff = new Date(t.meta.slaDeadline).getTime() - Date.now();
    if (diff < 0)              return 'sla-overdue';
    if (diff < 86400000)       return 'sla-critical'; // < 1 dia
    if (diff < 86400000 * 3)   return 'sla-warning';  // < 3 dias
    return 'sla-ok';
  }
  slaLabel(t: TicketResponse): string {
    if (!t.meta?.slaDeadline) return '—';
    const d = new Date(t.meta.slaDeadline);
    return d.toLocaleDateString('pt-BR');
  }
  trackById(_: number, t: TicketResponse): number { return t.id; }
}
