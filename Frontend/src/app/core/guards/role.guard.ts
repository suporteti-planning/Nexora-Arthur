import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Verifica se o usuário tem um dos roles permitidos.
 *  Usuários @demo.local / ROLE_DEMO passam por qualquer roleGuard. */
export function roleGuard(...allowedRoles: string[]): CanActivateFn {
  return () => {
    const auth   = inject(AuthService);
    const router = inject(Router);
    const user   = auth.sessionUser();

    if (!user) return router.createUrlTree(['/login']);

    // Demo tem acesso completo — passa em qualquer roleGuard
    if (auth.isFullAccess()) return true;

    const userRole = user.teamRole ?? user.role;
    if (allowedRoles.some(r => userRole === r || userRole?.endsWith(r))) return true;

    return router.createUrlTree(['/home']);
  };
}
