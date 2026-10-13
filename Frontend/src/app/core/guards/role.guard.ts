import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Verifica se o usuário tem um dos roles permitidos. */
export function roleGuard(...allowedRoles: string[]): CanActivateFn {
  return () => {
    const auth   = inject(AuthService);
    const router = inject(Router);
    const user   = auth.sessionUser();

    if (!user) return router.createUrlTree(['/login']);

    const userRole = user.teamRole ?? user.role;
    if (allowedRoles.some(r => userRole === r || userRole?.endsWith(r))) return true;

    // Redireciona para a home da equipe (sem acesso à rota solicitada)
    return router.createUrlTree(['/home']);
  };
}
