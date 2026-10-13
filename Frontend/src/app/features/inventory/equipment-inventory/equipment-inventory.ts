import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Notebook, NotebookService } from '../../../core/models/notebook';
import { NotebookCreateModal } from './notebook-create-modal/notebook-create-modal';
import { NotebookAboutModal } from './notebook-about-modal/notebook-about-modal';

@Component({
  selector: 'app-equipment-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, NotebookCreateModal, NotebookAboutModal],
  templateUrl: './equipment-inventory.html',
  styleUrl: './equipment-inventory.css'
})
export class EquipmentInventory implements OnInit {
  searchTerm: string = '';
  statusFilter: string = '';
  loading = true;
  errorMessage = '';
  showCreateModal = false;
  showAboutModal = false;
  selectedNotebook: Notebook | null = null;

  notebooks: Notebook[] = [];

  constructor(
    private notebookService: NotebookService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadNotebooks();
  }

  loadNotebooks(): void {
    this.loading = true;
    this.errorMessage = '';
    this.notebookService.getNotebooks().subscribe({
      next: (notebooks) => {
        this.notebooks = notebooks;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Não foi possível carregar os notebooks.';
        this.cdr.detectChanges();
      }
    });
  }

  openCreateModal(): void {
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  openAboutModal(notebook: Notebook): void {
    this.selectedNotebook = notebook;
    this.showAboutModal = true;
    this.cdr.detectChanges();
  }

  closeAboutModal(): void {
    this.showAboutModal = false;
    this.selectedNotebook = null;
    this.cdr.detectChanges();
  }

  onNotebookUpdated(notebook: Notebook): void {
    const index = this.notebooks.findIndex(item => item.id === notebook.id);
    if (index !== -1) {
      this.notebooks[index] = notebook;
      this.notebooks = [...this.notebooks];
    }
    this.selectedNotebook = notebook;
    this.notebookService.clearCache();
  }

  onNotebookCreated(notebook: Notebook): void {
    this.notebooks = [notebook, ...this.notebooks];
    this.notebookService.clearCache();
    this.closeCreateModal();
  }

  get filteredNotebooks(): Notebook[] {
    const search = this.searchTerm.toLowerCase();
    return this.notebooks.filter(notebook => {
      const matchesSearch = [
        notebook.name, notebook.brand, notebook.model, notebook.serialNumber,
        notebook.employee?.name, notebook.costCenter
      ].some(value => value?.toLowerCase().includes(search));

      const matchesStatus = !this.statusFilter || notebook.status === this.statusFilter;

      return matchesSearch && matchesStatus;
    });
  }

  countByStatus(status: Notebook['status']): number {
    return this.notebooks.filter(notebook => notebook.status === status).length;
  }

  getStatusLabel(status?: Notebook['status']): string {
    switch (status) {
      case 'ACTIVE': return 'Ativo';
      case 'INACTIVE': return 'Inativo';
      case 'MAINTENANCE': return 'Em Manutenção';
      case 'BACKUP': return 'Backup';
      case 'REVERSE': return 'Em coleta';
      default: return 'Não informado';
    }
  }

  getStatusClass(status?: Notebook['status']): string {
    switch (status) {
      case 'ACTIVE': return 'in-use';
      case 'INACTIVE': return 'in-stock';
      case 'MAINTENANCE': return 'maintenance';
      case 'BACKUP': return 'backup';
      case 'REVERSE': return 'reverse';
      default: return '';
    }
  }

  getCostCenterLabel(costCenter?: string): string {
    const labels: Record<string, string> = {
      MAROX: 'Marox',
      PAC: 'PAC',
      PAC_SUDESTE: 'PAC Sudeste',
      BELEM: 'Belém',
      SAO_LUIS: 'São Luís',
      PATOS_DE_MINAS: 'Patos de Minas',
      CAMPO_NOVO: 'Campo Novo',
      MACEIO: 'Maceió',
      FORTALEZA: 'Fortaleza',
      INNOVA: 'Innova'
    };

    return costCenter ? labels[costCenter] || costCenter : '—';
  }
}