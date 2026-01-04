/**
 * Route Guard
 * Handles authentication checks before route changes.
 */

import { AuthService } from '../core/auth-service.js';
import { Router } from '../core/router.js';

export const routeGuard = route => {
  if (route === 'login') {
    if (AuthService.isAuthenticated()) {
      Router.navigate('dashboard');
      return false;
    }
    return true;
  }

  // Protected routes
  const protectedRoutes = [
    'dashboard',
    'add-expense',
    'edit-expense',
    'settings',
    'reports',
  ];
  if (protectedRoutes.includes(route)) {
    if (!AuthService.isAuthenticated() && !AuthService.hasAuthHint()) {
      Router.navigate('login');
      return false;
    }
  }

  return true;
};
