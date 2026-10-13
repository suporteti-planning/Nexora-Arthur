import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Notebook, NotebookService } from '../../../core/models/notebook';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-dashboard.html',
  styleUrl: './user-dashboard.css',
})
export class UserDashboard implements OnInit {
  notebooks: Notebook[] = [];
  loading = true;
  errorMessage = '';
  readonly today = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  constructor(
    private readonly notebookService: NotebookService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadOverview();
  }

  loadOverview(): void {
    this.loading = true;
    this.errorMessage = '';
    this.notebookService.getNotebooks().subscribe({
      next: notebooks => {
        this.notebooks = notebooks;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => this.handleLoadError()
    });
  }

  private handleLoadError(): void {
    this.loading = false;
    this.errorMessage = 'Não foi possível carregar o resumo operacional.';
    this.cdr.markForCheck();
  }

  get attentionNotebooks(): Notebook[] {
    return this.notebooks.filter(notebook =>
      notebook.status === 'MAINTENANCE' ||
      notebook.status === 'REVERSE' ||
      (notebook.status === 'ACTIVE' && !notebook.employee?.id)
    );
  }

  countByStatus(status: Notebook['status']): number {
    return this.notebooks.filter(notebook => notebook.status === status).length;
  }

  getStatusLabel(notebook: Notebook): string {
    if (notebook.status === 'MAINTENANCE') return 'Em manutenção';
    if (notebook.status === 'REVERSE') return 'Em coleta';
    return 'Sem responsável';
  }

  getStatusClass(notebook: Notebook): string {
    if (notebook.status === 'MAINTENANCE') return 'maintenance';
    if (notebook.status === 'REVERSE') return 'reverse';
    return 'unassigned';
  }

  getNotebookDescription(notebook: Notebook): string {
    const model = [notebook.brand, notebook.model].filter(Boolean).join(' ');
    return model || notebook.serialNumber || 'Modelo não informado';
  }
}
