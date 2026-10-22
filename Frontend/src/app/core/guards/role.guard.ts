import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export function roleGuard(...allowedRoles: string[]): CanActivateFn {
  return () => {
    const auth   = inject(AuthService);
    const router = inject(Router);
    const user   = auth.sessionUser();
    if (!user) return router.createUrlTree(['/login']);

    const roles = user.teamRoles ?? [];
    if (roles.some(r => allowedRoles.includes(r))) return true;
    if (roles.length === 0 && allowedRoles.includes(user.role)) return true;

    return router.createUrlTree(['/dashboard']);
  };
}

export function departmentGuard(department: string): CanActivateFn {
  return () => {
    const auth   = inject(AuthService);
    const router = inject(Router);
    const user   = auth.sessionUser();
    if (!user) return router.createUrlTree(['/login']);

    const roles = user.teamRoles ?? [];
    if (roles.includes('ROLE_ADMIN') || roles.includes('ROLE_TI')) return true;
    if (roles.includes(`ROLE_${department}`) || roles.includes(`ROLE_ADMIN_${department}`)) return true;

    return router.createUrlTree(['/dashboard']);
  };
}

/** Bloqueia quem não é ADMIN global, TI ou ADMIN de algum depto. */
export function canManageUsersGuard(): CanActivateFn {
  return () => {
    const auth   = inject(AuthService);
    const router = inject(Router);
    const user   = auth.sessionUser();
    if (!user) return router.createUrlTree(['/login']);

    const roles = user.teamRoles ?? [];
    const isGlobal = roles.includes('ROLE_ADMIN') || roles.includes('ROLE_TI');
    const isDeptAdmin = roles.some(r => r.startsWith('ROLE_ADMIN_'));

    if (isGlobal || isDeptAdmin) return true;
    return router.createUrlTree(['/dashboard']);
  };
}