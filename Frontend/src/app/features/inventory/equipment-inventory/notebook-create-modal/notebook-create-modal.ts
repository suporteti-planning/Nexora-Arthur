import { Component, EventEmitter, HostListener, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Notebook, NotebookService } from '../../../../core/models/notebook';

@Component({
  selector: 'app-notebook-create-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notebook-create-modal.html',
  styleUrl: './notebook-create-modal.css'
})
export class NotebookCreateModal {
  @Output() closeModal = new EventEmitter<void>();
  @Output() notebookCreated = new EventEmitter<Notebook>();

  isSubmitting = false;
  errorMessage = '';
  readonly costCenters = [
    ['MAROX', 'Marox'], ['PAC', 'PAC'], ['PAC_SUDESTE', 'PAC Sudeste'],
    ['BELEM', 'Belém'], ['SAO_LUIS', 'São Luís'], ['PATOS_DE_MINAS', 'Patos de Minas'],
    ['CAMPO_NOVO', 'Campo Novo'], ['MACEIO', 'Maceió'], ['FORTALEZA', 'Fortaleza'], ['INNOVA', 'Innova']
  ];

  formData: Notebook = {
    name: '', brand: '', model: '', serialNumber: '', processor: '', ram: '', storage: '',
    price: undefined, operatingSystem: '', observations: '', status: 'ACTIVE', costCenter: ''
  };

  constructor(private notebookService: NotebookService) {}

  isFormValid(): boolean {
    return !!this.formData.name && !!this.formData.brand && !!this.formData.model &&
      !!this.formData.serialNumber && !!this.formData.processor && !!this.formData.ram &&
      !!this.formData.storage && this.formData.price !== undefined && this.formData.price >= 0 &&
      !!this.formData.status && !!this.formData.costCenter;
  }

  createNotebook(): void {
    if (!this.isFormValid() || this.isSubmitting) return;
    this.isSubmitting = true;
    this.errorMessage = '';
    this.notebookService.createNotebook(this.formData).subscribe({
      next: notebook => {
        this.isSubmitting = false;
        this.notebookCreated.emit(notebook);
        this.close();
      },
      error: err => {
        this.isSubmitting = false;
        this.errorMessage = err.error?.message || 'Não foi possível criar o notebook.';
      }
    });
  }

  close(): void { this.closeModal.emit(); }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { this.close(); }
}
