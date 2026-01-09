/**
 * Route Guard
 * Handles authentication checks before route changes.
 */

import { AuthService } from '../core/auth-service.js';
import { Router } from '../core/router.js';

export const routeGuard = route => {
  // Landing page - redirect to dashboard if authenticated
  if (route === 'landing') {
    if (AuthService.isAuthenticated()) {
      Router.navigate('dashboard');
      return false;
    }
    return true;
  }

  // Login page - redirect to dashboard if authenticated
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
    'financial-planning',
  ];
  if (protectedRoutes.includes(route)) {
    if (!AuthService.isAuthenticated() && !AuthService.hasAuthHint()) {
      Router.navigate('landing');
      return false;
    }
  }

  return true;
};
