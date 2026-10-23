import { Component, OnInit, signal, computed, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TicketService, TicketResponse } from '../../../core/services/ticket.service';
import { DocCatalogService, DocProcessResponse, DocStepResponse } from '../../../core/services/doc-catalog.service';

@Component({
  selector: 'app-doc-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doc-home.html',
  styleUrl: './doc-home.css',
})
export class DocHomePage implements OnInit {
  private readonly ticketSvc = inject(TicketService);
  private readonly docCatalogSvc = inject(DocCatalogService);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  // ── Tickets
  tickets = signal<TicketResponse[]>([]);
  loading = signal(true);
  selectedTicket = signal<TicketResponse | null>(null);

  // ── Processos de Documentação
  processes = signal<DocProcessResponse[]>([]);
  processesLoading = signal(true);
  stepsForProcess = signal<DocStepResponse[]>([]);
  stepsStatus = signal<Record<number, 'pending' | 'in_progress' | 'completed'>>({});

  ngOnInit(): void {
    this.loadTickets();
    this.loadProcesses();
  }

  /**
   * Carrega lista de tickets do departamento DOC
   */
  loadTickets(): void {
    this.loading.set(true);
    this.ticketSvc.listByDepartment('DOC').subscribe({
      next: (tickets) => {
        this.tickets.set(tickets);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erro ao carregar tickets:', err);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  /**
   * Carrega todos os processos de documentação disponíveis
   */
  loadProcesses(): void {
    this.processesLoading.set(true);
    this.docCatalogSvc.getProcesses().subscribe({
      next: (processes) => {
        this.processes.set(processes);
        this.processesLoading.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erro ao carregar processos:', err);
        this.processesLoading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  /**
   * Seleciona um ticket e carrega suas etapas
   */
  selectTicket(ticket: TicketResponse): void {
    this.selectedTicket.set(ticket);

    // Busca as etapas do processo associado ao ticket
    const processCode = ticket.extraData?.['_processCode'];
    
    if (processCode) {
      const process = this.processes().find(p => p.code === processCode);
      
      if (process) {
        this.stepsForProcess.set(process.steps);
        
        // Inicializa status de todas as etapas como 'pending'
        const initialStatus: Record<number, 'pending' | 'in_progress' | 'completed'> = {};
        process.steps.forEach(step => {
          initialStatus[step.id] = 'pending';
        });
        this.stepsStatus.set(initialStatus);
      }
    }
  }

  /**
   * Altera status de uma etapa
   */
  toggleStepStatus(stepId: number, status: 'pending' | 'in_progress' | 'completed'): void {
    this.stepsStatus.update(current => ({
      ...current,
      [stepId]: status,
    }));
  }

  /**
   * Salva progresso das etapas
   */
  saveProgress(): void {
    const ticket = this.selectedTicket();
    if (!ticket) return;

    const progressData = {
      ticketId: ticket.id,
      stepsStatus: this.stepsStatus(),
    };

    // TODO: Implementar endpoint no backend para salvar progresso
    // this.ticketSvc.saveDocProgress(progressData).subscribe(...)
    
    console.log('Progresso salvo:', progressData);
  }

  /**
   * Retorna classe CSS baseada no status da etapa
   */
  getStepStatusClass(stepId: number): string {
    const status = this.stepsStatus()[stepId];
    return {
      'pending': 'step-pending',
      'in_progress': 'step-in-progress',
      'completed': 'step-completed',
    }[status] || 'step-pending';
  }

  /**
   * Verifica se todas as etapas foram completadas
   */
  isProcessComplete(): boolean {
    const status = this.stepsStatus();
    const steps = this.stepsForProcess();
    return steps.length > 0 && steps.every(step => status[step.id] === 'completed');
  }
}
