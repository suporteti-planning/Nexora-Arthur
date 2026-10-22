import { Injectable } from '@angular/core';
import { TicketRequest, TicketResponse, TicketUpdateRequest,
         TicketStatus, DestDepartment, Page, HistoryEntry, TicketMeta } from './ticket.service';

const STORAGE_KEY = 'nexora.local-tickets';
let _seqId = Date.now();

@Injectable({ providedIn: 'root' })
export class TicketLocalService {

  // ── persistence ──────────────────────────────────────────────────────────
  private load(): TicketResponse[] {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); }
    catch { return []; }
  }
  private save(t: TicketResponse[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
  }

  // ── create ────────────────────────────────────────────────────────────────
  create(req: TicketRequest, userName: string, userEmail: string): TicketResponse {
    const seq = ++_seqId;
    const now = new Date().toISOString();
    const processName = String(req.extraData?.['_processName'] ?? `Processo #${req.processId}`);
    const stepName    = String(req.extraData?.['_stepName']    ?? `Etapa #${req.stepId}`);
    const stepsDetail = req.extraData?.['_stepsDetail'] as
      { stepName: string; emailDestination?: string; description?: string }[] | undefined;
    const cleanExtra  = req.extraData
      ? Object.fromEntries(Object.entries(req.extraData).filter(([k]) => !k.startsWith('_')))
      : undefined;

    // SLA deadline
    let slaDeadline: string | undefined;
    if (req.slaDays) {
      const d = new Date();
      d.setDate(d.getDate() + req.slaDays);
      slaDeadline = d.toISOString();
    }

    const ticket: TicketResponse = {
      id:                  seq,
      number:              `LOCAL-${new Date().getFullYear()}-${String(seq).slice(-5)}`,
      title:               req.title,
      description:         req.description,
      priority:            req.priority,
      status:              'NOVO',
      destDepartment:      req.destDepartment,
      destDepartmentName:  req.destDepartment,
      requester: { id: 0, username: userEmail, fullName: userName, email: userEmail },
      createdAt:  now,
      updatedAt:  now,
      meta: (req.slaDays || req.valorEstimado || req.nfPedido) ? {
        slaDays:       req.slaDays,
        slaDeadline,
        valorEstimado: req.valorEstimado,
        nfPedido:      req.nfPedido,
      } : undefined,
      history: [{
        id: 1,
        changedByName: userName,
        note: 'Chamado aberto.',
        changedAt: now,
      }],
      docDetail: req.processId ? {
        processId:    req.processId,
        processName,
        stepId:       req.stepId ?? 0,
        stepName,
        companyName:  req.companyName,
        companyCnpj:  req.companyCnpj,
        emailDestination: req.emailDestination,
        extraData: {
          ...(cleanExtra && Object.keys(cleanExtra).length ? cleanExtra : {}),
          ...(stepsDetail ? { stepsDetail } : {}),
        },
      } : undefined,
    };
    const all = this.load();
    all.unshift(ticket);
    this.save(all);
    return ticket;
  }

  // ── update status / comentário ────────────────────────────────────────────
  update(id: number, req: TicketUpdateRequest, userName: string): TicketResponse | null {
    const all = this.load();
    const idx = all.findIndex(t => t.id === id);
    if (idx < 0) return null;

    const t   = { ...all[idx] };
    const now = new Date().toISOString();
    const historyEntry: HistoryEntry = {
      id:           Date.now(),
      changedByName: userName,
      changedAt:    now,
    };

    if (req.status && req.status !== t.status) {
      historyEntry.fieldName = 'status';
      historyEntry.oldValue  = t.status;
      historyEntry.newValue  = req.status;
      t.status = req.status;
      if (req.status === 'RESOLVIDO' || req.status === 'CANCELADO') {
        t.closedAt = now;
      }
    }
    if (req.note) {
      historyEntry.note = req.note;
    }

    t.updatedAt = now;
    t.history   = [historyEntry, ...(t.history ?? [])];
    all[idx]    = t;
    this.save(all);
    return t;
  }

  // ── queries ───────────────────────────────────────────────────────────────
  getByDept(dept: DestDepartment, page = 0, size = 100): Page<TicketResponse> {
    const all = this.load().filter(t => t.destDepartment === dept);
    return this._page(all, page, size);
  }

  getMine(email: string, page = 0, size = 100): Page<TicketResponse> {
    const all = this.load().filter(t => t.requester?.email === email);
    return this._page(all, page, size);
  }

  getAll(dept?: DestDepartment, status?: TicketStatus, page = 0, size = 100): Page<TicketResponse> {
    let all = this.load();
    if (dept)   all = all.filter(t => t.destDepartment === dept);
    if (status) all = all.filter(t => t.status === status);
    return this._page(all, page, size);
  }

  getById(id: number): TicketResponse | null {
    return this.load().find(t => t.id === id) ?? null;
  }

  count(): number { return this.load().length; }

  private _page<T>(arr: T[], page: number, size: number): Page<T> {
    return {
      content:       arr.slice(page * size, (page + 1) * size),
      totalElements: arr.length,
      totalPages:    Math.ceil(arr.length / size),
      number:        page,
      size,
    };
  }
}
