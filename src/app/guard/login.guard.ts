import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const loginGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  // Verifica si hay token o sesión
  const isAuthenticated = !!localStorage.getItem('token');

  if (isAuthenticated) {
    return true;
  }

  router.navigate(['/registrar'], {
    queryParams: { returnUrl: state.url } // Para volver después del login
  });

  return false;
};
