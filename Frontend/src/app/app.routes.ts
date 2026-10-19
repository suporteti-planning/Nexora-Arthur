import { Routes } from '@angular/router';
import { MainLayout } from './layouts/main-layout/main-layout';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [

  // ── Intro ─────────────────────────────────────────────────────────────────
  { path: 'intro', loadComponent: () => import('./features/intro/intro').then(m => m.IntroPage) },

  // ── Login ─────────────────────────────────────────────────────────────────
  { path: 'login', canActivate: [guestGuard],
    loadComponent: () => import('./features/login/login').then(m => m.LoginPage) },

  // ── Intranet Home ─────────────────────────────────────────────────────────
  { path: 'home', canActivate: [authGuard],
    loadComponent: () => import('./features/home/home').then(m => m.HomePage) },

  // ── DOC Home ─────────────────────────────────────────────────────────────
  { path: 'doc', canActivate: [authGuard],
    loadComponent: () => import('./features/doc/doc-home').then(m => m.DocHomePage) },

  // ── Meus Chamados (acompanhamento do usuário) ──────────────────────────
  { path: 'meus-chamados', canActivate: [authGuard],
    loadComponent: () => import('./features/tickets/meus-chamados/meus-chamados').then(m => m.MeusChamadosPage) },

  // ── Painéis Departamentais ────────────────────────────────────────────
  { path: 'rh', canActivate: [authGuard],
    loadComponent: () => import('./features/departments/rh/rh-home').then(m => m.RhHomePage) },
  { path: 'dp', canActivate: [authGuard],
    loadComponent: () => import('./features/departments/dp/dp-home').then(m => m.DpHomePage) },
  { path: 'financeiro', canActivate: [authGuard],
    loadComponent: () => import('./features/departments/financeiro/financeiro-home').then(m => m.FinanceiroHomePage) },
  // Painel TI de chamados (rota separada da /home)
  { path: 'ti/chamados', canActivate: [authGuard, roleGuard('ROLE_TI', 'ROLE_ADMIN')],
    loadComponent: () => import('./features/tickets/ti-panel/ti-panel').then(m => m.TiPanelPage) },

  // ── Painel Admin de Usuários (TI / Admin) ─────────────────────────────────
  {
    path: 'admin',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'users', pathMatch: 'full' },
      {
        path: 'users',
        canActivate: [roleGuard('ROLE_TI', 'ROLE_ADMIN')],
        loadComponent: () =>
          import('./features/admin/user-management/user-management').then(m => m.UserManagementPage),
      },
    ],
  },

  // ── Backoffice TI ─────────────────────────────────────────────────────────
  {
    path: 'backoffice',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/user-dashboard/user-dashboard').then(m => m.UserDashboard) },
      { path: 'employees',
        loadComponent: () =>
          import('./features/employees/employee-list/employee-list').then(m => m.EmployeeList) },
      { path: 'equipment-inventory',
        loadComponent: () =>
          import('./features/inventory/equipment-inventory/equipment-inventory').then(m => m.EquipmentInventory) },
      { path: 'licenses',
        loadComponent: () =>
          import('./features/licenses/microsoft-license-management/microsoft-license-management').then(
            m => m.MicrosoftLicenseManagement) },
      { path: 'password-vault',
        loadComponent: () =>
          import('./features/password-vault/password-vault').then(m => m.PasswordVault) },
      { path: 'monitors',
        loadComponent: () =>
          import('./features/inventory/equipment-inventory/equipment-inventory').then(m => m.EquipmentInventory) },
    ],
  },

  // ── Aliases legados ───────────────────────────────────────────────────────
  { path: 'dashboard',           redirectTo: 'backoffice/dashboard',           pathMatch: 'full' },
  { path: 'employees',           redirectTo: 'backoffice/employees',           pathMatch: 'full' },
  { path: 'equipment-inventory', redirectTo: 'backoffice/equipment-inventory', pathMatch: 'full' },
  { path: 'licenses',            redirectTo: 'backoffice/licenses',            pathMatch: 'full' },
  { path: 'password-vault',      redirectTo: 'backoffice/password-vault',      pathMatch: 'full' },

  // ── Raiz / Fallback ───────────────────────────────────────────────────────
  { path: '', redirectTo: 'intro', pathMatch: 'full' },
  { path: '**', redirectTo: 'intro' },
];
