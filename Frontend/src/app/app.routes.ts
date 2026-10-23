import { Routes } from '@angular/router';
import { MainLayout } from './layouts/main-layout/main-layout';
import { NavbarLayout } from './layouts/navbar-layout/navbar-layout';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { roleGuard, departmentGuard, canManageUsersGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: 'login', canActivate: [guestGuard],
    loadComponent: () => import('./features/login/login').then(m => m.LoginPage) },

  { 
    path: 'meus-chamados', 
    component: NavbarLayout, 
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./features/tickets/meus-chamados/meus-chamados').then(m => m.MeusChamadosPage) }
    ]
  },

  { 
    path: 'portal-departamentos', 
    component: MainLayout, 
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./features/portal-departamentos/portal-departamentos').then(m => m.PortalDepartamentosPage) }
    ]
  },

  { path: 'home', component: MainLayout, canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./features/home/home').then(m => m.HomePage) }
    ]
  },

  // ── Painéis Departamentais (todos protegidos) ──
  { path: 'rh', canActivate: [authGuard, departmentGuard('RH')],
    loadComponent: () => import('./features/departments/rh/rh-home').then(m => m.RhHomePage) },

  { path: 'dp', canActivate: [authGuard, departmentGuard('DP')],
    loadComponent: () => import('./features/departments/dp/dp-home').then(m => m.DpHomePage) },

  { path: 'financeiro', canActivate: [authGuard, departmentGuard('FINANCEIRO')],
    loadComponent: () => import('./features/departments/financeiro/financeiro-home').then(m => m.FinanceiroHomePage) },

  { path: 'doc', component: NavbarLayout, canActivate: [authGuard, departmentGuard('DOC')],
    children: [
      { path: '', redirectTo: 'doc', pathMatch: 'full' },
      { path: 'doc', loadComponent: () => import('./features/doc/doc-home/doc-home').then(m => m.DocHomePage) },
    ]
  },

  // ── Backoffice (todas as rotas internas filtram quem vê) ──
  {
    path: 'backoffice',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/user-dashboard/user-dashboard').then(m => m.UserDashboard) },
      { path: 'employees', canActivate: [roleGuard('ROLE_TI', 'ROLE_ADMIN', 'ROLE_ADMIN_RH', 'ROLE_ADMIN_DP')],
        loadComponent: () => import('./features/employees/employee-list/employee-list').then(m => m.EmployeeList) },
      { path: 'equipment-inventory', canActivate: [roleGuard('ROLE_TI', 'ROLE_ADMIN')],
        loadComponent: () => import('./features/inventory/equipment-inventory/equipment-inventory').then(m => m.EquipmentInventory) },
      { path: 'licenses', canActivate: [roleGuard('ROLE_TI', 'ROLE_ADMIN')],
        loadComponent: () => import('./features/licenses/microsoft-license-management/microsoft-license-management').then(m => m.MicrosoftLicenseManagement) },
      { path: 'password-vault', canActivate: [roleGuard('ROLE_TI', 'ROLE_ADMIN')],
        loadComponent: () => import('./features/password-vault/password-vault').then(m => m.PasswordVault) },
      { path: 'users', canActivate: [canManageUsersGuard()],
        loadComponent: () => import('./features/admin/user-management/user-management').then(m => m.UserManagementPage) },
    ],
  },

  // ── Alias /admin/users (mesmo componente, mesma guard) ──
  {
    path: 'admin',
    component: MainLayout,
    canActivate: [authGuard, canManageUsersGuard()],
    children: [
      { path: '', redirectTo: 'users', pathMatch: 'full' },
      { path: 'users', loadComponent: () => import('./features/admin/user-management/user-management').then(m => m.UserManagementPage) },
    ],
  },

  // Aliases legados
  { path: 'dashboard', redirectTo: 'backoffice/dashboard', pathMatch: 'full' },
  { path: 'employees', redirectTo: 'backoffice/employees', pathMatch: 'full' },
  { path: 'equipment-inventory', redirectTo: 'backoffice/equipment-inventory', pathMatch: 'full' },
  { path: 'licenses', redirectTo: 'backoffice/licenses', pathMatch: 'full' },
  { path: 'password-vault', redirectTo: 'backoffice/password-vault', pathMatch: 'full' },

  // Fallback
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];