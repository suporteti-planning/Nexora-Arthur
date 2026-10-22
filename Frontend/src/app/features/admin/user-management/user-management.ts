import {
  Component, OnInit, signal, computed, inject, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  UserAdminService, UserAdminResponse, UserAdminRequest,
  TeamRoles, TEAM_ROLE_LABELS,
} from '../../../core/services/user-admin.service';
import { AuthService } from '../../../core/services/auth.service';

type ModalMode = 'create' | 'edit';

interface RoleGroup {
  department: string;
  admin: TeamRoles;
  member: TeamRoles;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.html',
  styleUrl:    './user-management.css',
})
export class UserManagementPage implements OnInit {
  private readonly svc  = inject(UserAdminService);
  private readonly cdr  = inject(ChangeDetectorRef);
  private readonly auth = inject(AuthService);

  // ── Lista ─────────────────────────────────────────────────────────────────
  users    = signal<UserAdminResponse[]>([]);
  loading  = signal(true);
  error    = signal('');
  total    = signal(0);
  page     = signal(0);
  pageSize = 30;
  search   = '';

  // ── Modal ─────────────────────────────────────────────────────────────────
  showModal    = signal(false);
  modalMode    = signal<ModalMode>('create');
  editingId    = signal<number | null>(null);
  modalError   = signal('');
  modalLoading = signal(false);

  // ── Grupos de roles ───────────────────────────────────────────────────────
  readonly roleGroups: RoleGroup[] = [
    { department: 'DOC',        admin: 'ROLE_ADMIN_DOC',        member: 'ROLE_DOC' },
    { department: 'RH',         admin: 'ROLE_ADMIN_RH',         member: 'ROLE_RH' },
    { department: 'DP',         admin: 'ROLE_ADMIN_DP',         member: 'ROLE_DP' },
    { department: 'FINANCEIRO', admin: 'ROLE_ADMIN_FINANCEIRO', member: 'ROLE_FINANCEIRO' },
    { department: 'RISCO',      admin: 'ROLE_ADMIN_RISCO',      member: 'ROLE_RISCO' },
    { department: 'FISCAL',     admin: 'ROLE_ADMIN_FISCAL',     member: 'ROLE_FISCAL' },
    { department: 'CONTABIL',   admin: 'ROLE_ADMIN_CONTABIL',   member: 'ROLE_CONTABIL' },
    { department: 'DEV',        admin: 'ROLE_ADMIN_DEV',        member: 'ROLE_DEV' },
  ];

  readonly departmentOptions = [
    { value: '', label: '— Sem departamento —' },
    ...this.roleGroups.map(g => ({ value: g.department, label: g.department })),
    { value: 'TI', label: 'TI — Infraestrutura' },
  ];

  readonly derivedDepartment = computed(() => {
    const roles = this.form.teamRoles ?? [];
    for (const r of roles) {
      const stripped = r.replace(/^ROLE_ADMIN_/, '').replace(/^ROLE_/, '');
      if (['ADMIN', 'TI', 'COLABORADOR'].includes(stripped)) continue;
      return stripped;
    }
    return '';
  });

  // ── Escopo do ator logado ─────────────────────────────────────────────────
  private readonly actorRoles = computed<string[]>(
    () => this.auth.sessionUser()?.teamRoles ?? []
  );

  readonly isSuperAdmin = computed(() => this.actorRoles().includes('ROLE_ADMIN'));
  readonly isTI         = computed(() => this.actorRoles().includes('ROLE_TI'));
  readonly isGlobal     = computed(() => this.isSuperAdmin() || this.isTI());

  readonly visibleGroups = computed<RoleGroup[]>(() => {
    if (this.isGlobal()) return this.roleGroups;
    const actorDepts = this.actorRoles()
      .map(r => r.replace(/^ROLE_ADMIN_/, '').replace(/^ROLE_/, ''))
      .filter(r => !['ADMIN', 'TI', 'COLABORADOR'].includes(r));
    return this.roleGroups.filter(g => actorDepts.includes(g.department));
  });

  readonly canAssignGlobalRoles = computed(() => this.isGlobal());
  readonly canAssignSuperAdmin  = computed(() => this.isSuperAdmin());

  // ── Form (declarado DEPOIS de isGlobal — a ordem importa) ─────────────────
  form: UserAdminRequest = {
  username: '', email: '', fullName: '', password: '',
  teamRoles: [], department: '', isTeamMember: false, active: true,
};

  ngOnInit(): void {
    this.form = this.emptyForm();
    this.load();
    this.cdr.detectChanges();
  }

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
      teamRoles:    [...(u.teamRoles ?? [])],
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
    if (!this.form.username?.trim()) { this.modalError.set('Username obrigatório.'); return; }
    if (!this.form.email?.trim())    { this.modalError.set('E-mail obrigatório.'); return; }
    if (!this.form.fullName?.trim()) { this.modalError.set('Nome completo obrigatório.'); return; }
    if (this.modalMode() === 'create' && !this.form.password?.trim()) {
      this.modalError.set('Senha obrigatória na criação.'); return;
    }

    // Espelha a validação do backend (evita request que vai dar 400)
    if ((this.form.teamRoles ?? []).length === 0) {
      this.modalError.set('Selecione ao menos uma equipe/perfil.'); return;
    }
    if (this.form.teamRoles.includes('ROLE_COLABORADOR') && this.form.teamRoles.length > 1) {
      this.modalError.set('Colaborador não pode coexistir com outras roles.'); return;
    }
    const seen = new Set<string>();
    for (const r of this.form.teamRoles) {
      const g = this.roleGroups.find(x => x.admin === r || x.member === r);
      if (!g) continue;
      if (seen.has(g.department)) {
        this.modalError.set(`Selecione apenas uma role do departamento ${g.department}.`);
        return;
      }
      seen.add(g.department);
    }

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

  // ── Roles (checkbox handlers) ─────────────────────────────────────────────
  toggleRole(role: TeamRoles, checked: boolean): void {
    const set = new Set<TeamRoles>(this.form.teamRoles ?? []);

    if (role === 'ROLE_COLABORADOR') {
      this.form.teamRoles = checked ? ['ROLE_COLABORADOR'] : [];
      return;
    }

    if (checked) {
      set.add(role);
      const group = this.roleGroups.find(g => g.admin === role || g.member === role);
      if (group) {
        const other = group.admin === role ? group.member : group.admin;
        set.delete(other);
      }
      set.delete('ROLE_COLABORADOR');   // colaborador é exclusivo
    } else {
      set.delete(role);
    }

    this.form.teamRoles = Array.from(set);
  }

  hasRole(role: TeamRoles): boolean {
    return (this.form.teamRoles ?? []).includes(role);
  }

  roleLabel(r: TeamRoles): string { return TEAM_ROLE_LABELS[r] ?? r; }

  // ── Form default ──────────────────────────────────────────────────────────
  private emptyForm(): UserAdminRequest {
    return {
      username: '', email: '', fullName: '', password: '',
      teamRoles: [],
      department: '', isTeamMember: false, active: true,
    };
  }
}