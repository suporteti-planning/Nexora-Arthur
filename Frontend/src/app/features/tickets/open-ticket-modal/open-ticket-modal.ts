import { Component, OnInit, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TicketService, TicketRequest, TicketPriority, DestDepartment } from '../../../core/services/ticket.service';
import { DocCatalogService, DocProcessDTO, DocStepDTO } from '../../../core/services/doc-catalog.service';

type ModalStep = 'base' | 'doc' | 'confirm';

/** Uma etapa adicionada pelo usuário no formulário DOC */
export interface DocStepEntry {
  step:             DocStepDTO;
  description:      string;
  emailDestination: string;
}

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

  readonly priorities: { value: TicketPriority; label: string }[] = [
    { value: 'BAIXA',   label: 'Baixa'   },
    { value: 'MEDIA',   label: 'Média'   },
    { value: 'ALTA',    label: 'Alta'    },
    { value: 'URGENTE', label: 'Urgente' },
  ];
  readonly departments: { value: DestDepartment; label: string }[] = [
    { value: 'TI',         label: 'TI — Tecnologia da Informação' },
    { value: 'DOC',        label: 'Documentação' },
    { value: 'RH',         label: 'Recursos Humanos / GG' },
    { value: 'DP',         label: 'Departamento Pessoal' },
    { value: 'FINANCEIRO', label: 'Financeiro / Compras' },
    { value: 'RISCO',      label: 'Gestão de Risco' },
  ];

  // ── Wizard ────────────────────────────────────────────────────────────────
  currentStep = signal<ModalStep>('base');

  // ── Campos base ───────────────────────────────────────────────────────────
  title       = '';
  description = '';
  priority: TicketPriority    = 'MEDIA';
  destDept: DestDepartment | '' = '';

  // ── Campos DOC ────────────────────────────────────────────────────────────
  docProcesses:    DocProcessDTO[] = [];
  docSteps:        DocStepDTO[]    = [];
  catalogLoading   = false;
  catalogError     = false;

  selectedProcess: DocProcessDTO | null = null;
  companyName      = '';
  companyCnpj      = '';

  // Lista de etapas adicionadas
  addedSteps: DocStepEntry[] = [];

  // Etapa sendo configurada agora (antes de adicionar)
  pendingStep:    DocStepDTO | null = null;
  pendingDesc     = '';
  pendingEmail    = '';
  pendingInform   = '';

  loading  = false;
  errorMsg = '';

  get isDoc(): boolean { return this.destDept === 'DOC'; }
  get pendingNeedsEmail(): boolean { return !!this.pendingStep?.requiresEmailAddress; }

  ngOnInit(): void {
    this.catalogLoading = true;
    this.docSvc.getCatalog().subscribe({
      next:  p => { this.docProcesses = p; this.catalogLoading = false; },
      error: () => { this.catalogLoading = false; this.catalogError = true; },
    });
  }

  // ── Navegação ─────────────────────────────────────────────────────────────
  next(): void {
    this.errorMsg = '';
    if (!this.title.trim()) { this.errorMsg = 'Informe o título.'; return; }
    if (!this.destDept)      { this.errorMsg = 'Selecione o destinatário.'; return; }
    this.currentStep.set(this.destDept === 'DOC' ? 'doc' : 'confirm');
  }

  nextDoc(): void {
    this.errorMsg = '';
    if (!this.selectedProcess)       { this.errorMsg = 'Selecione o tipo de processo.'; return; }
    if (this.addedSteps.length === 0) { this.errorMsg = 'Adicione pelo menos uma etapa.'; return; }
    this.currentStep.set('confirm');
  }

  back(): void {
    if (this.currentStep() === 'doc')     { this.currentStep.set('base'); return; }
    if (this.currentStep() === 'confirm') {
      this.currentStep.set(this.destDept === 'DOC' ? 'doc' : 'base');
    }
  }

  // ── Catálogo DOC ──────────────────────────────────────────────────────────
  onProcessChange(id: string): void {
    this.selectedProcess = this.docProcesses.find(p => p.id === +id) ?? null;
    this.docSteps        = this.selectedProcess?.steps ?? [];
    this.addedSteps      = [];
    this.pendingStep     = null;
    this.pendingDesc     = '';
    this.pendingEmail    = '';
    this.pendingInform   = '';
    this.errorMsg        = '';
  }

  onPendingStepChange(id: string): void {
    this.pendingStep   = this.docSteps.find(s => s.id === +id) ?? null;
    this.pendingInform = this.pendingStep?.informText ?? '';
    this.pendingEmail  = '';
    this.pendingDesc   = '';
  }

  addStep(): void {
    this.errorMsg = '';
    if (!this.pendingStep) { this.errorMsg = 'Selecione uma etapa para adicionar.'; return; }
    if (this.pendingNeedsEmail) {
      if (!this.pendingEmail.trim()) { this.errorMsg = 'Informe o e-mail para esta etapa.'; return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.pendingEmail.trim())) {
        this.errorMsg = 'E-mail inválido.'; return;
      }
    }
    this.addedSteps = [...this.addedSteps, {
      step:             this.pendingStep,
      description:      this.pendingDesc.trim(),
      emailDestination: this.pendingEmail.trim(),
    }];
    this.pendingStep   = null;
    this.pendingDesc   = '';
    this.pendingEmail  = '';
    this.pendingInform = '';
  }

  removeStep(i: number): void {
    this.addedSteps = this.addedSteps.filter((_, idx) => idx !== i);
  }

  onDeptChange(): void {
    if (this.destDept !== 'DOC') {
      this.selectedProcess = null;
      this.addedSteps      = [];
      this.pendingStep     = null;
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  submit(): void {
    this.loading  = true;
    this.errorMsg = '';

    const firstStep = this.addedSteps[0];
    const req: TicketRequest = {
      title:         this.title.trim(),
      description:   this.description.trim() || undefined,
      priority:      this.priority,
      destDepartment: this.destDept as DestDepartment,
      sourceRoute:   this.router.url,
    };

    if (this.destDept === 'DOC' && this.selectedProcess && firstStep) {
      req.processId        = this.selectedProcess.id;
      req.stepId           = firstStep.step.id;
      req.companyName      = this.companyName.trim()           || undefined;
      req.companyCnpj      = this.companyCnpj.trim()           || undefined;
      req.emailDestination = firstStep.emailDestination        || undefined;
      req.extraData = {
        _processName:  this.selectedProcess.name,
        _stepName:     firstStep.step.name,
        _stepsDetail:  this.addedSteps.map(e => ({
          stepName:         e.step.name,
          description:      e.description || undefined,
          emailDestination: e.emailDestination || undefined,
          informText:       e.step.informText || undefined,
        })),
        ...(firstStep.description ? { descricaoAdicional: firstStep.description } : {}),
      };
    }

    this.ticketSvc.create(req).subscribe({
      next:  t => { this.loading = false; this.created.emit(t.number); },
      error: err => {
        this.loading  = false;
        this.errorMsg = err?.error?.message ?? 'Erro ao abrir o chamado.';
      },
    });
  }

  close(): void { this.closed.emit(); }
}
