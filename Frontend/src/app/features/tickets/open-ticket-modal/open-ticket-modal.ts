import {
  Component, OnInit, Output, EventEmitter, signal, computed, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicketService, TicketRequest, TicketPriority, DestDepartment } from '../../../core/services/ticket.service';
import { DocCatalogService, DocProcessDTO, DocStepDTO } from '../../../core/services/doc-catalog.service';
import { Router } from '@angular/router';

type ModalStep = 'base' | 'doc' | 'confirm';

@Component({
  selector: 'app-open-ticket-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './open-ticket-modal.html',
  styleUrl: './open-ticket-modal.css',
})
export class OpenTicketModal implements OnInit {
  @Output() closed  = new EventEmitter<void>();
  @Output() created = new EventEmitter<string>();

  private readonly ticketSvc = inject(TicketService);
  private readonly docSvc    = inject(DocCatalogService);
  private readonly router    = inject(Router);

  // ── Listas estáticas ──────────────────────────────────────────────────────
  readonly priorities: { value: TicketPriority; label: string }[] = [
    { value: 'BAIXA',   label: 'Baixa' },
    { value: 'MEDIA',   label: 'Média' },
    { value: 'ALTA',    label: 'Alta' },
    { value: 'URGENTE', label: 'Urgente' },
  ];

  /** Destinatários elegíveis — exclui Fiscal, Contábil, Desenvolvimento */
  readonly departments: { value: DestDepartment; label: string }[] = [
    { value: 'TI',         label: 'TI — Tecnologia da Informação' },
    { value: 'DOC',        label: 'Documentação' },
    { value: 'RH',         label: 'Recursos Humanos / GG' },
    { value: 'DP',         label: 'Departamento Pessoal' },
    { value: 'FINANCEIRO', label: 'Financeiro / Compras' },
    { value: 'RISCO',      label: 'Gestão de Risco' },
  ];

  // ── Estado de navegação ───────────────────────────────────────────────────
  currentStep = signal<ModalStep>('base');

  // ── Campos base ───────────────────────────────────────────────────────────
  title        = '';
  description  = '';
  priority: TicketPriority    = 'MEDIA';
  destDept: DestDepartment | '' = '';

  // ── Campos DOC ────────────────────────────────────────────────────────────
  docProcesses:    DocProcessDTO[] = [];
  docSteps:        DocStepDTO[]    = [];
  catalogLoading   = false;
  catalogError     = false;

  selectedProcess: DocProcessDTO | null = null;
  selectedStep:    DocStepDTO    | null = null;
  informText       = '';

  // Empresa/CNPJ — visíveis em todo chamado DOC
  companyName   = '';
  companyCnpj   = '';

  // Email livre — visível apenas para etapas que exigem
  emailDestination = '';

  // Descrição adicional
  extraDesc = '';

  // ── UI state ──────────────────────────────────────────────────────────────
  loading  = false;
  errorMsg = '';

  // ── Computed ──────────────────────────────────────────────────────────────
  get isDoc(): boolean { return this.destDept === 'DOC'; }
  get needsEmail(): boolean { return !!this.selectedStep?.requiresEmailAddress; }

  ngOnInit(): void {
    this.catalogLoading = true;
    this.docSvc.getCatalog().subscribe({
      next:  (p) => { this.docProcesses = p; this.catalogLoading = false; },
      error: () => { this.catalogLoading = false; this.catalogError = true; },
    });
  }

  // ── Navegação ─────────────────────────────────────────────────────────────

  next(): void {
    this.errorMsg = '';
    if (!this.title.trim()) { this.errorMsg = 'Informe o título do chamado.'; return; }
    if (!this.destDept)      { this.errorMsg = 'Selecione o departamento destinatário.'; return; }
    this.currentStep.set(this.destDept === 'DOC' ? 'doc' : 'confirm');
  }

  nextDoc(): void {
    this.errorMsg = '';
    if (!this.selectedProcess) { this.errorMsg = 'Selecione o tipo de processo.'; return; }
    if (!this.selectedStep)    { this.errorMsg = 'Selecione a etapa do processo.'; return; }
    if (this.needsEmail) {
      if (!this.emailDestination.trim()) { this.errorMsg = 'Informe o endereço de e-mail de destino.'; return; }
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(this.emailDestination.trim())) { this.errorMsg = 'Endereço de e-mail inválido.'; return; }
    }
    this.currentStep.set('confirm');
  }

  back(): void {
    if (this.currentStep() === 'doc')     { this.currentStep.set('base'); return; }
    if (this.currentStep() === 'confirm') { this.currentStep.set(this.destDept === 'DOC' ? 'doc' : 'base'); }
  }

  // ── Catálogo DOC ──────────────────────────────────────────────────────────

  onProcessChange(id: string): void {
    this.selectedProcess = this.docProcesses.find(p => p.id === +id) ?? null;
    this.selectedStep    = null;
    this.informText      = '';
    this.emailDestination = '';
    this.docSteps        = this.selectedProcess?.steps ?? [];
  }

  onStepChange(id: string): void {
    this.selectedStep    = this.docSteps.find(s => s.id === +id) ?? null;
    this.informText      = this.selectedStep?.informText ?? '';
    this.emailDestination = ''; // limpa ao trocar de etapa
  }

  onDeptChange(): void {
    // Limpa campos DOC ao trocar de departamento
    if (this.destDept !== 'DOC') {
      this.selectedProcess = null;
      this.selectedStep    = null;
      this.informText      = '';
      this.emailDestination = '';
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  submit(): void {
    this.loading  = true;
    this.errorMsg = '';

    const req: TicketRequest = {
      title:          this.title.trim(),
      description:    this.description.trim() || undefined,
      priority:       this.priority,
      destDepartment: this.destDept as DestDepartment,
      sourceRoute:    this.router.url,
    };

    if (this.destDept === 'DOC' && this.selectedProcess && this.selectedStep) {
      req.processId        = this.selectedProcess.id;
      req.stepId           = this.selectedStep.id;
      req.companyName      = this.companyName.trim()      || undefined;
      req.companyCnpj      = this.companyCnpj.trim()      || undefined;
      req.emailDestination = this.emailDestination.trim() || undefined;
      if (this.extraDesc.trim()) req.extraData = {
        descricaoAdicional: this.extraDesc.trim(),
        // nomes para fallback local
        _processName: this.selectedProcess.name,
        _stepName:    this.selectedStep.name,
      };
      else req.extraData = {
        _processName: this.selectedProcess.name,
        _stepName:    this.selectedStep.name,
      };
    }

    this.ticketSvc.create(req).subscribe({
      next:  (t) => { this.loading = false; this.created.emit(t.number); },
      error: (err) => {
        this.loading  = false;
        this.errorMsg = err?.error?.message ?? 'Erro ao abrir o chamado. Tente novamente.';
      },
    });
  }

  close(): void { this.closed.emit(); }
}
