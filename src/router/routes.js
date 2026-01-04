/**
 * Route Definitions
 * Defines all application routes and their respective view loaders.
 */

import { ViewManager } from '../core/view-manager.js';
import { NavigationState } from '../core/navigation-state.js';
import { updateMobileNavigation } from '../components/MobileNavigation.js';

export const routes = {
  dashboard: async () => {
    const { DashboardView } = await import('../views/DashboardView.js');
    NavigationState.setLastActiveView('dashboard');
    ViewManager.setView(DashboardView());
    updateMobileNavigation('dashboard');
  },
  'add-expense': async params => {
    const { AddView } = await import('../views/AddView.js');
    NavigationState.setLastActiveView('add-expense');
    ViewManager.setView(AddView(params));
    updateMobileNavigation('add-expense');
  },
  'edit-expense': async params => {
    const { EditView } = await import('../views/EditView.js');
    NavigationState.setLastActiveView('edit-expense');
    ViewManager.setView(EditView(params));
    updateMobileNavigation('dashboard');
  },
  settings: async () => {
    const { SettingsView } = await import('../views/SettingsView.js');
    NavigationState.setLastActiveView('settings');
    ViewManager.setView(SettingsView());
    updateMobileNavigation('settings');
  },
  reports: async () => {
    const { ReportsView } = await import('../views/ReportsView.js');
    NavigationState.setLastActiveView('reports');
    ViewManager.setView(ReportsView());
    updateMobileNavigation('reports');
  },
  'financial-planning': async () => {
    const { FinancialPlanningView } = await import('../views/FinancialPlanningView.js');
    NavigationState.setLastActiveView('financial-planning');
    ViewManager.setView(FinancialPlanningView());
    updateMobileNavigation('financial-planning');
  },
  login: async () => {
    const { LoginView } = await import('../views/LoginView.js');
    NavigationState.setLastActiveView('login');
    ViewManager.setView(LoginView());
    updateMobileNavigation('login');
  },
};
