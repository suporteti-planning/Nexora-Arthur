import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface VaultEntry {
  id: number;
  title: string;
  username: string;
  password: string;
  url: string;
  category: string;
  description: string;
  updatedAt: Date;
}

interface PasswordForm {
  title: string;
  username: string;
  password: string;
  url: string;
  category: string;
  description: string;
}

@Component({
  selector: 'app-password-vault',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './password-vault.html',
  styleUrl: './password-vault.css'
})
export class PasswordVault {
  readonly initialCategories = ['Trabalho', 'Pessoal', 'Financeiro', 'Redes sociais', 'Outros'];
  categories = [...this.initialCategories];
  entries: VaultEntry[] = [];
  searchTerm = '';
  selectedCategory = 'Todas';
  editingEntryId: number | null = null;
  showEntryModal = false;
  showGenerator = false;
  showCategoryForm = false;
  showPassword = false;
  copiedEntryId: number | null = null;
  newCategoryName = '';
  generatorLength = 20;
  generatorError = '';
  passwordError = '';
  characterTypes = { uppercase: true, lowercase: true, numbers: true, symbols: true };
  form: PasswordForm = this.emptyForm();

  get filteredEntries(): VaultEntry[] {
    const search = this.searchTerm.trim().toLocaleLowerCase('pt-BR');
    return this.entries.filter(entry => {
      const inCategory = this.selectedCategory === 'Todas' || entry.category === this.selectedCategory;
      const matchesSearch = [entry.title, entry.username, entry.url, entry.category, entry.description]
        .some(value => value.toLocaleLowerCase('pt-BR').includes(search));
      return inCategory && matchesSearch;
    }).sort((first, second) => second.updatedAt.getTime() - first.updatedAt.getTime());
  }

  categoryCount(category: string): number {
    return category === 'Todas' ? this.entries.length : this.entries.filter(entry => entry.category === category).length;
  }

  openCreateModal(): void {
    this.editingEntryId = null;
    this.form = this.emptyForm();
    this.showPassword = false;
    this.passwordError = '';
    this.showEntryModal = true;
  }

  openEditModal(entry: VaultEntry): void {
    this.editingEntryId = entry.id;
    this.form = { ...entry };
    this.showPassword = false;
    this.passwordError = '';
    this.showEntryModal = true;
  }

  closeEntryModal(): void {
    this.showEntryModal = false;
    this.passwordError = '';
  }

  saveEntry(): void {
    if (!this.form.title.trim() || !this.form.username.trim() || !this.form.password || !this.form.category) return;

    if (this.editingEntryId === null) {
      this.entries = [{ ...this.form, id: Date.now(), updatedAt: new Date() }, ...this.entries];
    } else {
      this.entries = this.entries.map(entry => entry.id === this.editingEntryId
        ? { ...entry, ...this.form, updatedAt: new Date() }
        : entry);
    }
    this.closeEntryModal();
  }

  openGenerator(): void {
    this.generatorError = '';
    this.showGenerator = true;
  }

  closeGenerator(): void {
    this.showGenerator = false;
    this.generatorError = '';
  }

  get enabledCharacterTypes(): number {
    return Object.values(this.characterTypes).filter(Boolean).length;
  }

  generatePassword(): void {
    const groups = [
      this.characterTypes.uppercase ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : '',
      this.characterTypes.lowercase ? 'abcdefghijklmnopqrstuvwxyz' : '',
      this.characterTypes.numbers ? '0123456789' : '',
      this.characterTypes.symbols ? '!@#$%&*+-_=.?()[]{}' : ''
    ].filter(Boolean);

    if (groups.length === 0) {
      this.generatorError = 'Selecione pelo menos um tipo de caractere.';
      return;
    }

    const length = Math.max(groups.length, Math.min(128, Math.floor(Number(this.generatorLength) || groups.length)));
    this.generatorLength = length;
    try {
      const allCharacters = groups.join('');
      const generated = groups.map(group => group[this.randomIndex(group.length)]);
      while (generated.length < length) generated.push(allCharacters[this.randomIndex(allCharacters.length)]);
      for (let index = generated.length - 1; index > 0; index--) {
        const swapIndex = this.randomIndex(index + 1);
        [generated[index], generated[swapIndex]] = [generated[swapIndex], generated[index]];
      }
      this.form.password = generated.join('');
      this.showPassword = true;
      this.generatorError = '';
      this.showGenerator = false;
    } catch {
      this.generatorError = 'Este navegador não disponibiliza geração segura de senhas.';
    }
  }

  addCategory(): void {
    const category = this.newCategoryName.trim();
    if (!category || this.categories.some(existing => existing.toLocaleLowerCase('pt-BR') === category.toLocaleLowerCase('pt-BR'))) return;
    this.categories = [...this.categories, category];
    this.form.category = category;
    this.selectedCategory = category;
    this.newCategoryName = '';
    this.showCategoryForm = false;
  }

  async copyPassword(entry: VaultEntry): Promise<void> {
    try {
      await navigator.clipboard.writeText(entry.password);
      this.copiedEntryId = entry.id;
      window.setTimeout(() => {
        if (this.copiedEntryId === entry.id) this.copiedEntryId = null;
      }, 1800);
    } catch {
      this.copiedEntryId = null;
    }
  }

  private randomIndex(maximum: number): number {
    const cryptoApi = globalThis.crypto;
    if (!cryptoApi?.getRandomValues) throw new Error('Secure random source unavailable');
    const limit = Math.floor(256 / maximum) * maximum;
    const byte = new Uint8Array(1);
    do {
      cryptoApi.getRandomValues(byte);
    } while (byte[0] >= limit);
    return byte[0] % maximum;
  }

  private emptyForm(): PasswordForm {
    return { title: '', username: '', password: '', url: '', category: this.initialCategories[0], description: '' };
  }
}