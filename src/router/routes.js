/**
 * Route Definitions
 * Defines all application routes and their respective view loaders.
 */

import { ViewManager } from '../core/view-manager.js';
import { NavigationState } from '../core/navigation-state.js';
import { updateMobileNavigation } from '../components/MobileNavigation.js';

// Statically import core views for instant loading
import { DashboardView } from '../views/DashboardView.js';
import { AddView } from '../views/AddView.js';
import { EditView } from '../views/EditView.js';
import { ReportsView } from '../views/ReportsView.js';

export const routes = {
  landing: async () => {
    const { LandingView } = await import('../views/LandingView.js');
    NavigationState.setLastActiveView('landing');
    ViewManager.setView(LandingView());
    updateMobileNavigation('landing');
  },
  dashboard: () => {
    NavigationState.setLastActiveView('dashboard');
    ViewManager.setView(DashboardView());
    updateMobileNavigation('dashboard');
  },
  'add-expense': params => {
    NavigationState.setLastActiveView('add-expense');
    ViewManager.setView(AddView(params));
    updateMobileNavigation('add-expense');
  },
  'edit-expense': params => {
    NavigationState.setLastActiveView('edit-expense');
    ViewManager.setView(EditView(params));
    updateMobileNavigation('dashboard');
  },
  'category-manager': async () => {
    const { CustomCategoryManager } =
      await import('../components/CustomCategoryManager.js');
    NavigationState.setLastActiveView('category-manager');
    ViewManager.setView(
      CustomCategoryManager({
        onCategoryChange: () => {
          // Refresh category selectors throughout app
          window.dispatchEvent(new CustomEvent('categories-updated'));
        },
      })
    );
    updateMobileNavigation('category-manager');
  },
  settings: async () => {
    const { SettingsView } = await import('../views/SettingsView.js');
    NavigationState.setLastActiveView('settings');
    ViewManager.setView(SettingsView());
    updateMobileNavigation('settings');
  },
  reports: () => {
    NavigationState.setLastActiveView('reports');
    ViewManager.setView(ReportsView());
    updateMobileNavigation('reports');
  },
  'financial-planning': async () => {
    const { FinancialPlanningView } =
      await import('../views/FinancialPlanningView.js');
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
