import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EMPTY, Subject, debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs';
import { AuthService } from '../../core/services/login-response';
import { PasswordVaultApi, VaultEntryDetails, VaultEntryRequest, VaultEntrySummary, VaultUserOption, VaultVisibility } from '../../core/services/password-vault-api';
import { environment } from '../../../environments/environment';

type VaultEntry = VaultEntrySummary;

interface PasswordForm {
  title: string;
  username: string;
  password: string;
  url: string;
  category: string;
  description: string;
  visibility: VaultVisibility;
  sharedWith: string[];
}

@Component({
  selector: 'app-password-vault',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './password-vault.html',
  styleUrl: './password-vault.css'
})
export class PasswordVault implements OnInit {
  readonly initialCategories = ['Trabalho', 'Pessoal', 'Financeiro', 'Redes sociais', 'Outros'];
  categories = [...this.initialCategories];
  entries: VaultEntry[] = [];
  users: VaultUserOption[] = [];
  userSearch = '';
  userSearchLoading = false;
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
  generatedPassword = '';
  passwordError = '';
  loading = true;
  saving = false;
  requiresLogin = false;
  loginUsername = '';
  loginPassword = '';
  loginError = '';
  errorMessage = '';
  characterTypes = { uppercase: true, lowercase: true, numbers: true, symbols: true };
  form: PasswordForm = this.emptyForm();
  private readonly userSearchChanges = new Subject<string>();

  constructor(
    private readonly vaultApi: PasswordVaultApi,
    private readonly authService: AuthService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadEntries();
    this.userSearchChanges.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(search => this.vaultApi.users(search, this.form.sharedWith).pipe(
        catchError(error => {
          this.userSearchLoading = false;
          this.setError(error, 'Não foi possível pesquisar usuários para compartilhar.');
          this.cdr.markForCheck();
          return EMPTY;
        })
      ))
    ).subscribe({
      next: users => {
        this.users = users;
        this.userSearchLoading = false;
        this.cdr.markForCheck();
      },
      error: error => {
        this.userSearchLoading = false;
        this.setError(error, 'A pesquisa de usuários foi interrompida.');
        this.cdr.markForCheck();
      }
    });
  }

  get filteredEntries(): VaultEntry[] {
    const search = this.searchTerm.trim().toLocaleLowerCase('pt-BR');
    return this.entries.filter(entry => {
      const inCategory = this.selectedCategory === 'Todas' || entry.category === this.selectedCategory;
      const matchesSearch = [entry.title, entry.username, entry.url, entry.category, entry.description]
        .some(value => (value ?? '').toLocaleLowerCase('pt-BR').includes(search));
      return inCategory && matchesSearch;
    }).sort((first, second) => Date.parse(second.updatedAt) - Date.parse(first.updatedAt));
  }

  categoryCount(category: string): number {
    return category === 'Todas' ? this.entries.length : this.entries.filter(entry => entry.category === category).length;
  }

  openCreateModal(): void {
    this.editingEntryId = null;
    this.form = this.emptyForm();
    this.userSearch = '';
    this.users = [];
    this.showPassword = false;
    this.passwordError = '';
    this.showEntryModal = true;
    this.searchShareUsers();
  }

  openEditModal(entry: VaultEntry): void {
    if (!entry.canEdit) return;
    this.errorMessage = '';
    this.vaultApi.get(entry.id).subscribe({
      next: details => this.showEditModal(details),
      error: error => {
        this.setError(error, 'Não foi possível abrir esta credencial.');
        this.cdr.markForCheck();
      }
    });
  }

  private showEditModal(entry: VaultEntryDetails): void {
    this.editingEntryId = entry.id;
    this.form = {
      title: entry.title,
      username: entry.username,
      password: entry.password,
      url: entry.url ?? '',
      category: entry.category,
      description: entry.description ?? '',
      visibility: entry.visibility,
      sharedWith: [...entry.sharedWith]
    };
    this.userSearch = '';
    this.users = [];
    this.mergeCategory(entry.category);
    this.showPassword = false;
    this.passwordError = '';
    this.showEntryModal = true;
    this.searchShareUsers();
  }

  closeEntryModal(): void {
    this.showEntryModal = false;
    this.passwordError = '';
  }

  saveEntry(): void {
    if (!this.form.title.trim() || !this.form.username.trim() || !this.form.password || !this.form.category) return;

    this.saving = true;
    this.errorMessage = '';
    const request: VaultEntryRequest = { ...this.form };
    const operation = this.editingEntryId === null
      ? this.vaultApi.create(request)
      : this.vaultApi.update(this.editingEntryId, request);

    operation.subscribe({
      next: () => {
        this.saving = false;
        this.closeEntryModal();
        this.cdr.markForCheck();
        this.loadEntries();
      },
      error: error => {
        this.saving = false;
        this.setError(error, 'Não foi possível salvar a credencial.');
        this.cdr.markForCheck();
      }
    });
  }

  toggleViewer(username: string): void {
    this.form.sharedWith = this.form.sharedWith.includes(username)
      ? this.form.sharedWith.filter(viewer => viewer !== username)
      : [...this.form.sharedWith, username];
  }

  searchShareUsers(): void {
    if (this.form.visibility !== 'PRIVATE') return;
    this.userSearchLoading = true;
    this.userSearchChanges.next(this.userSearch);
  }

  isViewerSelected(username: string): boolean {
    return this.form.sharedWith.includes(username);
  }

  deleteEntry(entry: VaultEntry): void {
    if (!entry.canEdit || !window.confirm(`Excluir a credencial "${entry.title}"?`)) return;
    this.vaultApi.delete(entry.id).subscribe({
      next: () => {
        this.cdr.markForCheck();
        this.loadEntries();
      },
      error: error => {
        this.setError(error, 'Não foi possível excluir a credencial.');
        this.cdr.markForCheck();
      }
    });
  }

  login(): void {
    this.loginError = '';
    this.authService.login(this.loginUsername, this.loginPassword).subscribe({
      next: response => {
        this.authService.saveToken(response.token);
        this.loginPassword = '';
        this.requiresLogin = false;
        this.cdr.markForCheck();
        this.loadEntries();
      },
      error: () => {
        this.loginError = 'Não foi possível entrar. Confira usuário e senha do ambiente de desenvolvimento.';
        this.cdr.markForCheck();
      }
    });
  }

  loginWithMicrosoft(): void {
    window.location.assign(`${environment.apiUrl}/oauth2/authorization/azure`);
  }

  private loadEntries(): void {
    this.loading = true;
    this.errorMessage = '';
    this.vaultApi.list().subscribe({
      next: entries => {
        this.entries = entries;
        entries.forEach(entry => this.mergeCategory(entry.category));
        this.loading = false;
        this.requiresLogin = false;
        this.cdr.markForCheck();
      },
      error: error => {
        this.loading = false;
        if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
          this.requiresLogin = true;
          this.cdr.markForCheck();
          return;
        }
        this.setError(error, 'Não foi possível carregar o cofre de senhas.');
        this.cdr.markForCheck();
      }
    });
  }

  private mergeCategory(category: string): void {
    if (!this.categories.includes(category)) this.categories = [...this.categories, category];
  }

  private setError(error: unknown, fallback: string): void {
    this.errorMessage = error instanceof HttpErrorResponse
      ? error.error?.message ?? fallback
      : fallback;
  }

  openGenerator(): void {
    this.generatorError = '';
    this.generatedPassword = '';
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
    this.generatorError = '';
    this.generatedPassword = '';
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
      this.generatedPassword = generated.join('');
    } catch {
      this.generatorError = 'Este navegador não disponibiliza geração segura de senhas.';
    }
  }

  useGeneratedPassword(): void {
    if (!this.generatedPassword) return;
    this.form.password = this.generatedPassword;
    this.showPassword = true;
    this.closeGenerator();
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
      const secret = await new Promise<string>((resolve, reject) => {
        this.vaultApi.getSecret(entry.id).subscribe({ next: value => resolve(value.password), error: reject });
      });
      await navigator.clipboard.writeText(secret);
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
    return {
      title: '', username: '', password: '', url: '', category: this.initialCategories[0], description: '',
      visibility: 'PRIVATE', sharedWith: []
    };
  }
}