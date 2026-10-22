import { Component, OnInit, Output, EventEmitter, signal, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TicketService, TicketRequest, TicketPriority, DestDepartment } from '../../../core/services/ticket.service';
import { DocCatalogService, DocProcessDTO, DocStepDTO } from '../../../core/services/doc-catalog.service';

type ModalStep = 'base' | 'doc' | 'confirm';

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
  @Input() initialDept: DestDepartment | '' = '';
  @Input() lockDept = false; // Bloqueia o departamento (para usuário externo)

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
    { value: 'TI',         label: 'TI — Infraestrutura' },
    { value: 'DOC',        label: 'DOC' },
    { value: 'RH',         label: 'Recursos Humanos / GG' },
    { value: 'DP',         label: 'Departamento Pessoal' },
    { value: 'FINANCEIRO', label: 'Financeiro / Compras' },
    { value: 'RISCO',      label: 'Gestão de Risco' },
  ];

  currentStep = signal<ModalStep>('base');

  title       = '';
  description = '';
  priority: TicketPriority    = 'MEDIA';
  destDept: DestDepartment | '' = '';
  attachments: File[] = [];

  docProcesses    = DOC_PROCESSES;

  selectedProcessName: string | null = null;
  companyName      = '';
  companyCnpj      = '';

  loading  = false;
  errorMsg = '';

  get isDoc(): boolean { return this.destDept === 'DOC'; }
  get isDeptLocked(): boolean { return this.lockDept || !!this.initialDept; }

  ngOnInit(): void {
    // 1. Aplica o departamento inicial (se vier da HomePage)
    if (this.initialDept) {
      this.destDept = this.initialDept;
      this.onDeptChange();
    }
  }

  next(): void {
    this.errorMsg = '';
    
    // Para DOC: valida processo, pula para confirm
    if (this.destDept === 'DOC') {
      if (!this.selectedProcessName) { this.errorMsg = 'Selecione o tipo de processo.'; return; }
      this.title = `Processo DOC: ${this.selectedProcessName}`;
      this.currentStep.set('confirm');
      return;
    }
    
    // Para outros departamentos: valida campos básicos
    if (!this.title.trim()) { this.errorMsg = 'Informe o título.'; return; }
    if (!this.destDept)      { this.errorMsg = 'Selecione o destinatário.'; return; }
    this.currentStep.set('confirm');
  }

  back(): void {
    if (this.currentStep() === 'confirm') {
      this.currentStep.set('base');
    }
  }

  onProcessChange(id: string | number): void {
    this.selectedProcessName = !id ? null : (id as string);
    this.errorMsg = '';
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
      this.selectedProcess = null;
      this.addedSteps      = [];
      this.pendingStep     = null;
      this.companyName     = '';
      this.companyCnpj     = '';
    }
  }

  submit(): void {
    this.loading  = true;
    this.errorMsg = '';
    const req: TicketRequest = {
      title:         this.title.trim(),
      description:   this.description.trim() || undefined,
      priority:      this.priority,
      destDepartment: this.destDept as DestDepartment,
      sourceRoute:   this.router.url,
    };

    if (this.destDept === 'DOC' && this.selectedProcessName) {
      req.processName      = this.selectedProcessName;
      req.companyName      = this.companyName.trim()           || undefined;
      req.companyCnpj      = this.companyCnpj.trim()           || undefined;
      req.extraData = {
        _processName:  this.selectedProcessName,
        _availableSteps: DOC_PROCESS_STEPS[this.selectedProcessName] ?? [],
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