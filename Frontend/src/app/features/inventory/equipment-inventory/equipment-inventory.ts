import { ChangeDetectorRef, Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Notebook } from '../../../core/models/notebook';
import { NotebookService } from '../../../core/services/notebook';
import { Monitor } from '../../../core/models/monitor';
import { MonitorService } from '../../../core/services/monitor';
import { NotebookCreateModal } from './notebook-create-modal/notebook-create-modal';
import { NotebookAboutModal } from './notebook-about-modal/notebook-about-modal';
import { MonitorCreateModal } from './monitor-create-modal/monitor-create-modal';
import { MonitorDetailsModal } from './monitor-details-modal/monitor-details-modal';
import { NotebookImportResult } from '../../../core/models/notebook-import-result';

@Component({
  selector: 'app-equipment-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, NotebookCreateModal, NotebookAboutModal, MonitorCreateModal, MonitorDetailsModal],
  templateUrl: './equipment-inventory.html',
  styleUrl: './equipment-inventory.css'
})
export class EquipmentInventory implements OnInit {
  searchTerm: string = '';
  statusFilter: string = '';
  loading = true;
  errorMessage = '';
  showCreateModal = false;
  showMonitorCreateModal = false;
  showMonitorDetailsModal = false;
  showAboutModal = false;
  selectedType: 'NOTEBOOK' | 'MONITOR' = 'NOTEBOOK';
  selectedNotebook: Notebook | null = null;
  selectedMonitor: Monitor | null = null;
  monitors: Monitor[] = [];
  monitorsLoading = true;
  monitorErrorMessage = '';

  notebooks: Notebook[] = [];

  //Importação
  showImportMenu = false;
  showImportModal = false;
  selectedImportFile: File | null = null;
  isImporting = false;
  importError = '';
  importResult: NotebookImportResult | null = null;

  constructor(
    private readonly notebookService: NotebookService,
    private readonly monitorService: MonitorService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadNotebooks();
    this.loadMonitors();
  }

  //Fecha o menu de importação ao clicar fora
  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.showImportMenu) {
      this.showImportMenu = false;
      this.cdr.detectChanges();
    }
  }

  // ==================== IMPORTAÇÃO ====================

  toggleImportMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.showImportMenu = !this.showImportMenu;
    this.cdr.detectChanges();
  }

  openImportModal(): void {
    this.showImportMenu = false;
    this.showImportModal = true;
    this.selectedImportFile = null;
    this.importError = '';
    this.importResult = null;
    this.cdr.detectChanges();
  }

  closeImportModal(): void {
    if (this.isImporting) return;
    this.showImportModal = false;
    this.selectedImportFile = null;
    this.importError = '';
    this.importResult = null;
    this.cdr.detectChanges();
  }

  onImportOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeImportModal();
    }
  }

  onImportFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    // Validação básica do tipo de arquivo
    if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
      this.importError = 'Por favor, selecione um arquivo Excel (.xlsx ou .xls).';
      this.selectedImportFile = null;
      this.cdr.detectChanges();
      return;
    }

    this.selectedImportFile = file;
    this.importError = '';
    this.importResult = null;
    this.cdr.detectChanges();
  }

  submitImport(): void {
    if (!this.selectedImportFile || this.isImporting) return;

    this.isImporting = true;
    this.importError = '';
    this.importResult = null;

    this.notebookService.importNotebooks(this.selectedImportFile).subscribe({
      next: (result) => {
        this.isImporting = false;
        this.importResult = result;
        // Recarrega a lista de notebooks para refletir a importação
        this.loadNotebooks();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isImporting = false;
        this.importError = err.error?.message || 'Não foi possível importar a planilha.';
        this.cdr.detectChanges();
      }
    });
  }

  downloadTemplate(): void {
    this.showImportMenu = false;
    this.notebookService.downloadImportTemplate().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'modelo-notebooks.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Erro ao baixar template:', err);
        alert('Não foi possível baixar o modelo da planilha.');
      }
    });
  }


  private closeAllModals(): void {
    this.showCreateModal = false;
    this.showMonitorCreateModal = false;
    this.showMonitorDetailsModal = false;
    this.showAboutModal = false;
    this.showImportModal = false;
    this.selectedNotebook = null;
    this.selectedMonitor = null;
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
    this.closeAllModals();
    this.selectedType = 'NOTEBOOK';
    this.showCreateModal = true;
    this.cdr.detectChanges();
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.cdr.detectChanges();
  }

  openMonitorCreateModal(): void {
    this.closeAllModals();
    this.selectedType = 'MONITOR';
    this.showMonitorCreateModal = true;
    this.cdr.detectChanges();
  }

  closeMonitorCreateModal(): void {
    this.showMonitorCreateModal = false;
    this.cdr.detectChanges();
  }

  openMonitorDetails(monitor: Monitor): void {
    this.closeAllModals();
    this.selectedMonitor = monitor;
    this.showMonitorDetailsModal = true;
    this.cdr.detectChanges();
  }

  closeMonitorDetails(): void {
    this.showMonitorDetailsModal = false;
    this.selectedMonitor = null;
    this.cdr.detectChanges();
  }

  openAboutModal(notebook: Notebook): void {
    this.closeAllModals();
    this.selectedNotebook = notebook;
    this.showAboutModal = true;
    this.cdr.detectChanges();
  }

  closeAboutModal(): void {
    this.showAboutModal = false;
    this.selectedNotebook = null;
    this.cdr.detectChanges();
  }

  onMonitorUpdated(monitor: Monitor): void {
    const index = this.monitors.findIndex(item => item.id === monitor.id);
    if (index !== -1) {
      this.monitors[index] = monitor;
      this.monitors = [...this.monitors];
    }
    this.monitorService.clearCache();
    this.closeMonitorDetails();
  }

  onMonitorCreated(monitor: Monitor): void {
    this.monitors = [monitor, ...this.monitors];
    this.monitorService.clearCache();
    this.closeMonitorCreateModal();
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
    this.cdr.detectChanges();
  }

  onNotebookCreated(notebook: Notebook): void {
    this.notebooks = [notebook, ...this.notebooks];
    this.notebookService.clearCache();
    this.closeCreateModal();
    this.cdr.detectChanges();
  }

  selectType(type: 'NOTEBOOK' | 'MONITOR'): void {
    this.closeAllModals();
    this.selectedType = type;
    this.searchTerm = '';
    this.statusFilter = '';
    this.cdr.detectChanges();
  }

  private loadMonitors(): void {
    this.monitorsLoading = true;
    this.monitorErrorMessage = '';
    this.monitorService.getMonitors().subscribe({
      next: monitors => {
        this.monitors = monitors;
        this.monitorsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.monitorsLoading = false;
        this.monitorErrorMessage = 'Não foi possível carregar os monitores.';
        this.cdr.detectChanges();
      }
    });
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

  get filteredMonitors(): Monitor[] {
    const search = this.searchTerm.toLocaleLowerCase('pt-BR').trim();
    return this.monitors.filter(monitor => {
      const matchesSearch = [
        monitor.name, monitor.brand, monitor.model, monitor.serialNumber,
        monitor.employee?.name, monitor.employee?.email, monitor.costCenter
      ].some(value => value?.toLocaleLowerCase('pt-BR').includes(search));
      return matchesSearch && (!this.statusFilter || monitor.status === this.statusFilter);
    });
  }

  countSelectedStatus(status: string): number {
    const assets = this.selectedType === 'NOTEBOOK' ? this.notebooks : this.monitors;
    return assets.filter(asset => asset.status === status).length;
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
      PATOS_DE_MINAS: 'Patos de Minas',
      INNOVA: 'Innova'
    };

    return costCenter ? labels[costCenter] || costCenter : '—';
  }

  onSearchChange(): void {
    this.cdr.detectChanges();
  }
}