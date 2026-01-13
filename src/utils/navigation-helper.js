import { Router } from '../core/router.js';
import { SPACING, COLORS, BREAKPOINTS } from './constants.js';

/**
 * Creates navigation buttons for switching between main views
 * @param {string} currentView - The current view ('dashboard', 'reports', 'financial-planning', 'settings')
 * @returns {HTMLElement} - Container with navigation buttons
 */
export const createNavigationButtons = currentView => {
  const rightControls = document.createElement('div');
  rightControls.style.display = 'flex';
  rightControls.style.alignItems = 'center';
  rightControls.style.gap = SPACING.SM;

  // Define all views and their properties
  const views = [
    {
      key: 'dashboard',
      icon: '🏠',
      title: 'Dashboard',
      route: 'dashboard',
    },
    {
      key: 'reports',
      icon: '🎯',
      title: 'Charts and Reports',
      route: 'reports',
    },
    {
      key: 'financial-planning',
      icon: '📊',
      title: 'Financial Planning',
      route: 'financial-planning',
    },
    {
      key: 'settings',
      icon: '⚙️',
      title: 'Settings',
      route: 'settings',
    },
  ];

  // Hide navigation on mobile devices except for Settings
  const isMobile = window.innerWidth < BREAKPOINTS.MOBILE;
  if (isMobile) {
    // Only show Settings button on mobile
    const settingsView = views.find(view => view.key === 'settings');
    if (settingsView) {
      const settingsButton = document.createElement('button');
      settingsButton.innerHTML = settingsView.icon;
      settingsButton.className = 'btn btn-ghost';
      settingsButton.style.fontSize = '1.5rem';
      settingsButton.style.padding = SPACING.XS;
      settingsButton.style.border = 'none';
      settingsButton.style.marginRight = SPACING.SM;
      settingsButton.title = settingsView.title;
      settingsButton.style.transition = 'all 0.2s ease';

      // Add subtle highlight if currently on settings
      if (settingsView.key === currentView) {
        settingsButton.style.background = COLORS.SUCCESS_LIGHT;
        settingsButton.style.borderRadius = 'var(--radius-md)';
        settingsButton.style.color = COLORS.PRIMARY;
      }

      settingsButton.addEventListener('click', () =>
        Router.navigate(settingsView.route)
      );
      rightControls.appendChild(settingsButton);
    }
    return rightControls;
  }

  // Create buttons for all views
  views.forEach(view => {
    const button = document.createElement('button');
    button.innerHTML = view.icon;
    button.className = 'btn btn-ghost';
    button.style.fontSize = '1.5rem';
    button.style.padding = SPACING.XS;
    button.style.border = 'none';
    button.style.marginRight = SPACING.SM;
    button.title = view.title;
    button.style.transition = 'all 0.2s ease';

    // Add subtle highlight for current view
    if (view.key === currentView) {
      button.style.background = `${COLORS.SUCCESS_LIGHT}`; // Very subtle background
      button.style.borderRadius = 'var(--radius-md)';
      button.style.color = COLORS.PRIMARY;
    }

    button.addEventListener('click', () => Router.navigate(view.route));

    rightControls.appendChild(button);
  });

  return rightControls;
};
