import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

/**
 * Attaches the JWT Bearer token to every outgoing request
 * that targets the backend API.
 * Works in both dev (localhost:8080) and production (any configured apiUrl).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth  = inject(AuthService);
  const token = auth.getToken();

  // Attach token to requests that target our API — skip demo tokens
  const isApiCall = req.url.startsWith(environment.apiUrl) ||
                    req.url.includes('localhost:8080');

  if (token && !token.startsWith('demo-token-') && isApiCall) {
    const cloned = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(cloned);
  }

  return next(req);
};
