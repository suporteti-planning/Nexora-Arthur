/**
 * TicketLocalService — fallback offline.
 * Persiste tickets em localStorage quando o backend está indisponível.
 * Integrado ao TicketService via cadeia de fallback.
 */
import { Injectable } from '@angular/core';
import { TicketRequest, TicketResponse, TicketStatus, DestDepartment, Page } from './ticket.service';

const STORAGE_KEY = 'nexora.local-tickets';

let _seqId = Date.now();

@Injectable({ providedIn: 'root' })
export class TicketLocalService {

  private load(): TicketResponse[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    } catch { return []; }
  }

  private save(tickets: TicketResponse[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  }

  create(req: TicketRequest, userDisplayName: string, userEmail: string): TicketResponse {
    const seq = ++_seqId;
    const now = new Date().toISOString();

    // Extrai nomes do extraData (passados pelo modal para o fallback local)
    const processName = String(req.extraData?.['_processName'] ?? `Processo #${req.processId}`);
    const stepName    = String(req.extraData?.['_stepName']    ?? `Etapa #${req.stepId}`);
    // Remove campos internos do extraData antes de persistir
    const cleanExtra = req.extraData
      ? Object.fromEntries(Object.entries(req.extraData).filter(([k]) => !k.startsWith('_')))
      : undefined;

    const ticket: TicketResponse = {
      id:                  seq,
      number:              `LOCAL-${new Date().getFullYear()}-${String(seq).slice(-5)}`,
      title:               req.title,
      description:         req.description,
      priority:            req.priority,
      status:              'NOVO' as TicketStatus,
      destDepartment:      req.destDepartment,
      destDepartmentName:  req.destDepartment,
      requester: { id: 0, username: userEmail, fullName: userDisplayName, email: userEmail },
      createdAt:  now,
      updatedAt:  now,
      sourceRoute: req.sourceRoute,
      docDetail: req.processId ? {
        processId:       req.processId,
        processName,
        stepId:          req.stepId ?? 0,
        stepName,
        companyName:     req.companyName,
        companyCnpj:     req.companyCnpj,
        emailDestination: req.emailDestination,
        extraData:       cleanExtra && Object.keys(cleanExtra).length ? cleanExtra : undefined,
      } : undefined,
    };
    const all = this.load();
    all.unshift(ticket);
    this.save(all);
    return ticket;
  }

  getByDept(dept: DestDepartment, page = 0, size = 100): Page<TicketResponse> {
    const all = this.load().filter(t => t.destDepartment === dept);
    return { content: all.slice(page * size, (page + 1) * size), totalElements: all.length, totalPages: Math.ceil(all.length / size), number: page, size };
  }

  getMine(userEmail: string, page = 0, size = 100): Page<TicketResponse> {
    const all = this.load().filter(t => t.requester?.email === userEmail);
    return { content: all.slice(page * size, (page + 1) * size), totalElements: all.length, totalPages: Math.ceil(all.length / size), number: page, size };
  }

  getAll(dept?: DestDepartment, status?: TicketStatus, page = 0, size = 100): Page<TicketResponse> {
    let all = this.load();
    if (dept)   all = all.filter(t => t.destDepartment === dept);
    if (status) all = all.filter(t => t.status === status);
    return { content: all.slice(page * size, (page + 1) * size), totalElements: all.length, totalPages: Math.ceil(all.length / size), number: page, size };
  }

  count(): number { return this.load().length; }
}
