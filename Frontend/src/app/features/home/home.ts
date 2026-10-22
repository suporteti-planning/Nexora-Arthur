import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { OpenTicketModal } from '../tickets/open-ticket-modal/open-ticket-modal';
import { DestDepartment } from '../../core/services/ticket.service';

interface DeptCard {
  id: DestDepartment;
  name: string;
  desc: string;
  route: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, OpenTicketModal],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomePage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = this.auth.sessionUser;

  // Detecta usuário externo (sem perfis de time)
  readonly isExternalUser = computed(() => {
    const roles = this.user()?.teamRoles ?? [];
    // Se tem ROLE_ADMIN ou ROLE_TI, não é externo
    if (roles.includes('ROLE_ADMIN') || roles.includes('ROLE_TI')) return false;
    // Se não tem roles, ou nenhum começa com ROLE_, é externo
    if (roles.length === 0) return true;
    return !roles.some(r => r.startsWith('ROLE_'));
  });

  // Modal de chamado (para visitantes)
  showTicketModal = signal(false);
  selectedDeptForTicket = signal<DestDepartment | ''>('');

    readonly departments: DeptCard[] = [
    { 
      id: 'DOC', 
      name: 'DOC', 
      desc: 'Documentação e processos societários.', 
      route: '/doc/doc', 
      icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 2v6h6M16 13H8M16 17H8M10 9H8',
      color: '#0ae18c' 
    },
    { 
      id: 'RH', 
      name: 'Gente e Gestão', 
      desc: 'Recursos Humanos e Gestão de Gente.', 
      route: '/rh', 
      icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M8 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
      color: '#0ae18c' 
    },
    { 
      id: 'DP', 
      name: 'Departamento Pessoal Interno', 
      desc: 'Departamento Pessoal e Folha.', 
      route: '/dp', 
      icon: 'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8.5 3.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM20 8v6M23 11h-6',
      color: '#0ae18c' 
    },
    { 
      id: 'FINANCEIRO', 
      name: 'Financeiro', 
      desc: 'Compras, pagamentos e reembolsos.', 
      route: '/financeiro', 
      icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
      color: '#6ee7b7' 
    },
    { 
      id: 'RISCO', 
      name: 'Gestão de Risco', 
      desc: 'Compliance e auditoria.', 
      route: '/risco', 
      icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
      color: '#e59a91' 
    },
    { 
      id: 'TI', 
      name: 'TI', 
      desc: 'Infraestrutura, acessos e equipamentos.', 
      route: '/backoffice/dashboard', 
      icon: 'M4 4h16M4 8h16M4 12h10M4 16h10',
      color: '#00FF66' 
    },
  ];
  
  hasAccess(dept: DestDepartment): boolean {
    const roles = this.user()?.teamRoles ?? [];
    if (roles.includes('ROLE_ADMIN') || roles.includes('ROLE_TI')) return true;
    return roles.includes(`ROLE_${dept}`) || roles.includes(`ROLE_ADMIN_${dept}`);
  }

  accessDept(dept: DestDepartment, route: string): void {
    if (this.hasAccess(dept)) {
      this.router.navigate([route]);
    } else {
      this.selectedDeptForTicket.set(dept);
      this.showTicketModal.set(true);
    }
  }

  closeModal(): void {
    this.showTicketModal.set(false);
    this.selectedDeptForTicket.set('');
  }

  onTicketCreated(): void {
    this.showTicketModal.set(false);
    // Poderia redirecionar para meus-chamados ou apenas exibir um toast
    this.router.navigate(['/meus-chamados']);
  }

  goToPortal(): void {
    this.router.navigate(['/portal-departamentos']);
  }
}