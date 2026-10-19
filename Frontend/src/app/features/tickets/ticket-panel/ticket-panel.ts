/**
 * TicketPanel — Componente base reutilizável de acompanhamento de chamados.
 *
 * Modos: 'mine' | 'dept'
 * Variantes: 'default' | 'sla' | 'financeiro'
 *
 * Quando dept='TI', exibe bloco de ações TI (Capturar / Finalizar / Pausar).
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

interface StatusFilter { value: TicketStatus | ''; label: string; }

@Component({
  selector: 'app-ticket-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, OpenTicketModal],
  templateUrl: './ticket-panel.html',
  styleUrl:    './ticket-panel.css',
})
export class TicketPanel implements OnInit, OnChanges {
  @Input() mode: PanelMode = 'mine';
  @Input() variant: PanelVariant = 'default';
  @Input() dept?: DestDepartment;
  @Input() accentColor = '#0ae18c';
  @Input() panelTitle  = 'Chamados';
  @Input() panelSub    = '';
  @Output() ticketCreatedEvt = new EventEmitter<string>();

  readonly ticketSvc = inject(TicketService);
  private readonly auth      = inject(AuthService);
  private readonly cdr       = inject(ChangeDetectorRef);

  readonly user = this.auth.sessionUser;

  /** true quando este painel é do departamento TI */
  get isTiPanel(): boolean { return this.dept === 'TI'; }

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

  showNewModal  = signal(false);
  createdNumber = signal<string | null>(null);

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
    const urgent  = all.filter(t => t.priority === 'URGENTE' && t.status !== 'RESOLVIDO').length;
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
      const n = new Set(s); n.has(v) ? n.delete(v) : n.add(v); return n;
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

  // ── Botões rápidos de status ──────────────────────────────────────────────
  quickStatus(status: TicketStatus): void {
    const t = this.detailTicket();
    if (!t || t.status === status) return;
    this._doUpdate(t, { status }, `Status alterado para ${this.statusLabels[status]}.`);
  }

  // ── Botões TI ─────────────────────────────────────────────────────────────
  tiCapturar(): void {
    const t = this.detailTicket();
    if (!t) return;
    const me = this.user()?.displayName;
    this._doUpdate(t, { status: 'EM_ANDAMENTO' }, me ? `Capturado por ${me}.` : 'Chamado capturado.');
  }

  tiFinalizar(): void {
    const t = this.detailTicket();
    if (!t) return;
    const me = this.user()?.displayName;
    this._doUpdate(t, { status: 'RESOLVIDO' }, me ? `Finalizado por ${me}.` : 'Chamado finalizado.');
  }

  tiPausar(): void {
    const t = this.detailTicket();
    if (!t) return;
    const me = this.user()?.displayName;
    this._doUpdate(t, { status: 'AGUARDANDO' }, me ? `Pausado por ${me}.` : 'Chamado pausado.');
  }

  // ── saveUpdate (formulário manual) ────────────────────────────────────────
  saveUpdate(): void {
    const t = this.detailTicket();
    if (!t) return;
    if (!this.newComment.trim() && (!this.newStatus || this.newStatus === t.status)) {
      this.updateError = 'Informe um comentário ou altere o status.'; return;
    }
    const req: TicketUpdateRequest = {
      status: (this.newStatus && this.newStatus !== t.status) ? this.newStatus as TicketStatus : undefined,
      note:   this.newComment.trim() || undefined,
    };
    this._doUpdate(t, req, undefined, true);
  }

  private _doUpdate(
    t: TicketResponse,
    req: TicketUpdateRequest,
    fallbackNote?: string,
    fromForm = false,
  ): void {
    if (this.savingUpdate) return;
    this.savingUpdate = true;
    this.updateError  = '';
    const payload: TicketUpdateRequest = {
      ...req,
      note: req.note ?? fallbackNote,
    };
    this.ticketSvc.update(t.id, payload).subscribe({
      next: updated => {
        this.savingUpdate = false;
        if (updated) {
          this.detailTicket.set(updated);
          this.allTickets.update(all => all.map(x => x.id === updated.id ? updated : x));
          if (fromForm) {
            this.newComment = '';
            this.newStatus  = updated.status;
          }
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.savingUpdate = false;
        this.updateError  = 'Erro ao salvar. Tente novamente.';
        this.cdr.markForCheck();
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  isImage(ct?: string):    boolean { return !!ct && ct.startsWith('image/'); }
  isPdf(ct?: string):      boolean { return ct === 'application/pdf'; }
  isViewable(ct?: string): boolean { return this.isImage(ct) || this.isPdf(ct); }

  /** URL absoluta para download — prefixada com apiUrl */
  attachmentUrl(relUrl: string): string {
    return this.ticketSvc.attachmentDownloadUrl(relUrl);
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024)       return `${bytes} B`;
    if (bytes < 1048576)    return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

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
    if (diff < 0)            return 'sla-overdue';
    if (diff < 86400000)     return 'sla-critical';
    if (diff < 86400000 * 3) return 'sla-warning';
    return 'sla-ok';
  }
  slaLabel(t: TicketResponse): string {
    if (!t.meta?.slaDeadline) return '—';
    return new Date(t.meta.slaDeadline).toLocaleDateString('pt-BR');
  }
  trackById(_: number, t: TicketResponse): number { return t.id; }
}
