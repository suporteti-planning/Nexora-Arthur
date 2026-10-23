import { Component, OnInit, Output, EventEmitter, signal, inject, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TicketService, TicketRequest, TicketPriority, DestDepartment } from '../../../core/services/ticket.service';
import { DocCatalogService, DocProcessResponse, DocStepResponse } from '../../../core/services/doc-catalog.service';

type ModalStep = 'base' | 'doc' | 'confirm';

export interface DocStepEntry {
  step: DocStepResponse;
  description: string;
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
  @Output() closed = new EventEmitter<void>();
  @Output() created = new EventEmitter<string>();
  @Input() initialDept: DestDepartment | '' = '';
  @Input() lockDept = false; // Bloqueia o departamento (para usuário externo)

  private readonly ticketSvc = inject(TicketService);
  private readonly docSvc = inject(DocCatalogService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly priorities: { value: TicketPriority; label: string }[] = [
    { value: 'BAIXA', label: 'Baixa' },
    { value: 'MEDIA', label: 'Média' },
    { value: 'ALTA', label: 'Alta' },
    { value: 'URGENTE', label: 'Urgente' },
  ];

  readonly departments: { value: DestDepartment; label: string }[] = [
    { value: 'TI', label: 'TI — Infraestrutura' },
    { value: 'DOC', label: 'DOC' },
    { value: 'RH', label: 'Recursos Humanos / GG' },
    { value: 'DP', label: 'Departamento Pessoal' },
    { value: 'FINANCEIRO', label: 'Financeiro / Compras' },
    { value: 'RISCO', label: 'Gestão de Risco' },
  ];

  currentStep = signal<ModalStep>('base');

  // ── Form Fields
  title = '';
  description = '';
  priority: TicketPriority = 'MEDIA';
  destDept: DestDepartment | '' = '';
  attachments: File[] = [];

  // ── DOC Process Fields
  docProcesses = signal<DocProcessResponse[]>([]);
  selectedProcess = signal<DocProcessResponse | null>(null);
  selectedProcessCode = '';
  companyName = '';
  companyCnpj = '';

  // ── Step Management (para DOC)
  addedSteps = signal<DocStepEntry[]>([]);
  pendingStep = signal<DocStepResponse | null>(null);
  pendingStepDescription = '';
  pendingStepEmail = '';

  // ── UI State
  loading = signal(false);
  errorMsg = signal('');
  docProcessesLoading = signal(false);

  get isDoc(): boolean {
    return this.destDept === 'DOC';
  }

  get isDeptLocked(): boolean {
    return this.lockDept || !!this.initialDept;
  }

  ngOnInit(): void {
    // 1. Aplica o departamento inicial (se vier da HomePage)
    if (this.initialDept) {
      this.destDept = this.initialDept;
      this.onDeptChange();
    }

    // 2. Carrega processos DOC
    this.loadDocProcesses();
  }

  /**
   * Carrega lista de processos de documentação
   */
  loadDocProcesses(): void {
    this.docProcessesLoading.set(true);
    this.docSvc.getProcesses().subscribe({
      next: (processes) => {
        this.docProcesses.set(processes);
        this.docProcessesLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erro ao carregar processos:', err);
        this.docProcessesLoading.set(false);
        this.errorMsg.set('Erro ao carregar processos de documentação');
        this.cdr.markForCheck();
      },
    });
  }

  next(): void {
    this.errorMsg.set('');

    // Para DOC: valida processo, vai para doc step
    if (this.destDept === 'DOC') {
      if (!this.selectedProcess()) {
        this.errorMsg.set('Selecione o tipo de processo.');
        return;
      }
      this.currentStep.set('doc');
      return;
    }

    // Para outros departamentos: valida campos básicos
    if (!this.title.trim()) {
      this.errorMsg.set('Informe o título.');
      return;
    }
    if (!this.destDept) {
      this.errorMsg.set('Selecione o destinatário.');
      return;
    }
    this.currentStep.set('confirm');
  }

  back(): void {
    if (this.currentStep() === 'confirm') {
      this.currentStep.set(this.isDoc ? 'doc' : 'base');
    } else if (this.currentStep() === 'doc') {
      this.currentStep.set('base');
    }
  }

  /**
   * Seleciona um processo de documentação
   */
  onProcessChange(process: DocProcessResponse | null): void {
    this.selectedProcess.set(process);
    this.selectedProcessCode = process?.code ?? '';
    this.addedSteps.set([]);
    this.pendingStep.set(null);
    this.title = process ? `Processo DOC: ${process.name}` : '';
    this.errorMsg.set('');
  }

  /**
   * Seleciona uma etapa para preencher informações
   */
  selectStepToAdd(step: DocStepResponse): void {
    this.pendingStep.set(step);
    this.pendingStepDescription = '';
    this.pendingStepEmail = '';
  }

  /**
   * Adiciona etapa preenchida à lista
   */
  addStep(): void {
    const step = this.pendingStep();
    if (!step) return;

    // Validação de campos obrigatórios
    if (step.requiresDocuments && !this.pendingStepDescription.trim()) {
      this.errorMsg.set('Descreva os documentos necessários');
      return;
    }
    if (step.requiresEmailAddress && !this.pendingStepEmail.trim()) {
      this.errorMsg.set('Informe o email');
      return;
    }

    const entry: DocStepEntry = {
      step,
      description: this.pendingStepDescription,
      emailDestination: this.pendingStepEmail,
    };

    this.addedSteps.update(steps => [...steps, entry]);
    this.pendingStep.set(null);
    this.pendingStepDescription = '';
    this.pendingStepEmail = '';
    this.errorMsg.set('');
  }

  /**
   * Remove etapa da lista
   */
  removeStep(index: number): void {
    this.addedSteps.update(steps => steps.filter((_, i) => i !== index));
  }

  /**
   * Cancela seleção de etapa
   */
  cancelStepSelection(): void {
    this.pendingStep.set(null);
    this.pendingStepDescription = '';
    this.pendingStepEmail = '';
    this.errorMsg.set('');
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.attachments = [...this.attachments, ...(Array.from(files) as File[])];
    }
  }

  removeAttachment(index: number): void {
    this.attachments = this.attachments.filter((_, i) => i !== index);
  }

  onDeptChange(): void {
    if (this.destDept !== 'DOC') {
      this.selectedProcess.set(null);
      this.selectedProcessCode = '';
      this.addedSteps.set([]);
      this.pendingStep.set(null);
      this.companyName = '';
      this.companyCnpj = '';
      this.title = '';
    }
  }

  submit(): void {
    this.loading.set(true);
    this.errorMsg.set('');

    const req: TicketRequest = {
      title: this.title.trim(),
      description: this.description.trim() || undefined,
      priority: this.priority,
      destDepartment: this.destDept as DestDepartment,
      sourceRoute: this.router.url,
    };

    if (this.destDept === 'DOC' && this.selectedProcess()) {
      const process = this.selectedProcess()!;
      req.processName = process.name;
      req.companyName = this.companyName.trim() || undefined;
      req.companyCnpj = this.companyCnpj.trim() || undefined;
      req.extraData = {
        _processCode: process.code,
        _processName: process.name,
        _processId: process.id,
        _selectedSteps: this.addedSteps().map(s => ({
          stepId: s.step.id,
          stepCode: s.step.code,
          description: s.description,
          emailDestination: s.emailDestination,
        })),
      };
    }

    this.ticketSvc.create(req).subscribe({
      next: (t) => {
        this.loading.set(false);
        this.created.emit(t.number);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err?.error?.message ?? 'Erro ao abrir o chamado.');
        this.cdr.markForCheck();
      },
    });
  }

  close(): void {
    this.closed.emit();
  }
}
