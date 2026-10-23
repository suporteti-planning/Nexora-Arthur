import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketPanel } from '../ticket-panel/ticket-panel';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-meus-chamados',
  standalone: true,
  imports: [CommonModule, TicketPanel],
  templateUrl: './meus-chamados.html',
  styleUrl: './meus-chamados.css',
})
export class MeusChamadosPage implements OnInit {
  private readonly auth = inject(AuthService);

  readonly user = this.auth.sessionUser;

  // Verifica se é usuário externo (sem roles de departamento/TI)
  readonly isExternalUser = computed(() => {
    const roles = this.user()?.teamRoles ?? [];
    const hasInternalRole = roles.some(r => 
      r === 'ROLE_ADMIN' || 
      r === 'ROLE_TI' || 
      r.startsWith('ROLE_ADMIN_') || 
      r.startsWith('ROLE_')
    );
    return !hasInternalRole;
  });

  ngOnInit(): void {
    // Página carrega apenas dados do usuário logado via ticket-panel mode="mine"
    // A segurança é garantida pelo backend que filtra por requester
  }
}