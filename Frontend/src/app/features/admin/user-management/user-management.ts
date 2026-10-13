import {
  Component, OnInit, signal, inject, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  UserAdminService, UserAdminResponse, UserAdminRequest,
  TeamRole, TEAM_ROLE_LABELS,
} from '../../../core/services/user-admin.service';

type ModalMode = 'create' | 'edit';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.html',
  styleUrl:    './user-management.css',
})
export class UserManagementPage implements OnInit {
  private readonly svc = inject(UserAdminService);
  private readonly cdr = inject(ChangeDetectorRef);

  // ── Lista ─────────────────────────────────────────────────────────────────
  users    = signal<UserAdminResponse[]>([]);
  loading  = signal(true);
  error    = signal('');
  total    = signal(0);
  page     = signal(0);
  pageSize = 30;
  search   = '';

  // ── Roles disponíveis para o seletor ─────────────────────────────────────
  readonly roles: { value: TeamRole; label: string }[] =
    (Object.keys(TEAM_ROLE_LABELS) as TeamRole[]).map(k => ({ value: k, label: TEAM_ROLE_LABELS[k] }));

  // ── Modal ─────────────────────────────────────────────────────────────────
  showModal   = signal(false);
  modalMode   = signal<ModalMode>('create');
  editingId   = signal<number | null>(null);
  modalError  = signal('');
  modalLoading= signal(false);

  form: UserAdminRequest = this.emptyForm();

  ngOnInit(): void { this.load(); }

  // ── Carregamento ──────────────────────────────────────────────────────────
  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.svc.list(this.page(), this.pageSize).subscribe({
      next: (pg) => {
        this.users.set(pg.content);
        this.total.set(pg.totalElements);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.error.set('Não foi possível carregar os usuários.');
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  // ── Filtro local ──────────────────────────────────────────────────────────
  get filteredUsers(): UserAdminResponse[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.users();
    return this.users().filter(u =>
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q)
    );
  }

  // ── Modal ─────────────────────────────────────────────────────────────────
  openCreate(): void {
    this.form = this.emptyForm();
    this.modalMode.set('create');
    this.editingId.set(null);
    this.modalError.set('');
    this.showModal.set(true);
  }

  openEdit(u: UserAdminResponse): void {
    this.form = {
      username:     u.username,
      email:        u.email,
      fullName:     u.fullName,
      teamRole:     u.teamRole,
      department:   u.department,
      isTeamMember: u.isTeamMember,
      active:       u.active,
    };
    this.modalMode.set('edit');
    this.editingId.set(u.id);
    this.modalError.set('');
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  saveModal(): void {
    this.modalError.set('');
    if (!this.form.username?.trim())  { this.modalError.set('Username obrigatório.'); return; }
    if (!this.form.email?.trim())     { this.modalError.set('E-mail obrigatório.'); return; }
    if (!this.form.fullName?.trim())  { this.modalError.set('Nome completo obrigatório.'); return; }
    if (this.modalMode() === 'create' && !this.form.password?.trim())
                                      { this.modalError.set('Senha obrigatória na criação.'); return; }

    this.modalLoading.set(true);
    const obs = this.modalMode() === 'create'
      ? this.svc.create(this.form)
      : this.svc.update(this.editingId()!, this.form);

    obs.subscribe({
      next: () => {
        this.modalLoading.set(false);
        this.closeModal();
        this.load();
      },
      error: (err) => {
        this.modalLoading.set(false);
        this.modalError.set(err?.error?.message ?? 'Erro ao salvar.');
        this.cdr.markForCheck();
      },
    });
  }

  // ── Ativar / desativar ────────────────────────────────────────────────────
  toggleActive(u: UserAdminResponse): void {
    const obs = u.active ? this.svc.deactivate(u.id) : this.svc.activate(u.id);
    obs.subscribe({ next: () => this.load() });
  }

  // ── Paginação ─────────────────────────────────────────────────────────────
  prevPage(): void { if (this.page() > 0) { this.page.update(p => p - 1); this.load(); } }
  nextPage(): void {
    if ((this.page() + 1) * this.pageSize < this.total()) {
      this.page.update(p => p + 1); this.load();
    }
  }

  private emptyForm(): UserAdminRequest {
    return { username: '', email: '', fullName: '', password: '',
             teamRole: 'ROLE_COLABORADOR', department: '', isTeamMember: false, active: true };
  }

  roleLabel(r: TeamRole): string { return TEAM_ROLE_LABELS[r] ?? r; }
}
