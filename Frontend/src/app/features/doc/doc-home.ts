import { Component, OnInit, signal, computed, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TicketService, TicketResponse } from '../../core/services/ticket.service';
import { DOC_PROCESS_STEPS, DocStep } from '../../core/constants/doc-processes';

@Component({
  selector: 'app-doc-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doc-home.html',
  styleUrl: './doc-home.css',
})
export class DocHomePage implements OnInit {
  private readonly ticketSvc = inject(TicketService);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  tickets = signal<TicketResponse[]>([]);
  loading = signal(true);
  selectedTicket = signal<TicketResponse | null>(null);
  stepsForProcess = signal<DocStep[]>([]);
  stepsStatus = signal<Record<string, 'pending' | 'in_progress' | 'completed'>>({});

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.loading.set(true);
    this.ticketSvc.listByDepartment('DOC').subscribe({
      next: (tickets) => {
        this.tickets.set(tickets);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  selectTicket(ticket: TicketResponse): void {
    this.selectedTicket.set(ticket);
    
    // Busca as etapas disponíveis para o processo
    const processName = ticket.extraData?.['_processName'];
    if (processName) {
      this.stepsForProcess.set(DOC_PROCESS_STEPS[processName] ?? []);
      // Inicializa status de todas as etapas como pending
      const initialStatus: Record<string, 'pending' | 'in_progress' | 'completed'> = {};
      (DOC_PROCESS_STEPS[processName] ?? []).forEach(step => {
        initialStatus[step.id] = 'pending';
      });
      this.stepsStatus.set(initialStatus);
    }
  }

  toggleStepStatus(stepId: string, status: 'pending' | 'in_progress' | 'completed'): void {
    this.stepsStatus.update(current => ({
      ...current,
      [stepId]: status,
    }));
  }

  saveProgress(): void {
    const ticket = this.selectedTicket();
    if (!ticket) return;

    // Salva o progresso das etapas (backend pode ser implementado depois)
    const progressData = {
      ticketId: ticket.id,
      stepsStatus: this.stepsStatus(),
    };
    
    console.log('Progresso salvo:', progressData);
    // TODO: Enviar para backend quando rota estiver disponível
  }
}
