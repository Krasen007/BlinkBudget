/**
 * Mobile Navigation Component
 * Provides bottom navigation bar for mobile devices following mobile UI patterns
 * Requirements: 6.1, 6.2, 6.3
 */

import { Router } from '../core/router.js';

export const MobileNavigation = ({ currentRoute = 'dashboard' }) => {
  const nav = document.createElement('nav');
  nav.className = 'mobile-nav';
  nav.setAttribute('role', 'navigation');
  nav.setAttribute('aria-label', 'Main navigation');

  // Navigation items configuration
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '🏠',
      route: 'dashboard',
      ariaLabel: 'Go to Dashboard',
    },
    {
      id: 'reports',
      label: 'Charts',
      icon: '🎯',
      route: 'reports',
      ariaLabel: 'Go to Charts and Reports',
    },
    {
      id: 'financial-planning',
      label: 'Planning',
      icon: '📊',
      route: 'financial-planning',
      ariaLabel: 'Go to Financial Planning',
    },
    {
      id: 'add-expense',
      label: 'Add',
      icon: '➕',
      route: 'add-expense',
      ariaLabel: 'Add new transaction',
    },
  ];

  // Create navigation items
  navItems.forEach(item => {
    const navItem = document.createElement('button');
    navItem.className = `mobile-nav-item ${currentRoute === item.id ? 'active' : ''}`;
    navItem.setAttribute('aria-label', item.ariaLabel);
    navItem.setAttribute('data-route', item.route);

    // Icon container
    const iconContainer = document.createElement('div');
    iconContainer.className = 'mobile-nav-icon';
    iconContainer.textContent = item.icon;

    // Label
    const label = document.createElement('span');
    label.className = 'mobile-nav-label';
    label.textContent = item.label;

    navItem.appendChild(iconContainer);
    navItem.appendChild(label);

    // Touch feedback
    navItem.addEventListener(
      'touchstart',
      _e => {
        navItem.classList.add('touch-active');
        // Haptic feedback for supported devices
        if (window.mobileUtils?.supportsHaptic()) {
          window.mobileUtils.hapticFeedback([5]);
        }
      },
      { passive: true }
    );

    navItem.addEventListener(
      'touchend',
      () => {
        navItem.classList.remove('touch-active');
      },
      { passive: true }
    );

    navItem.addEventListener(
      'touchcancel',
      () => {
        navItem.classList.remove('touch-active');
      },
      { passive: true }
    );

    // Navigation handler
    navItem.addEventListener('click', e => {
      e.preventDefault();

      // Update active state
      nav.querySelectorAll('.mobile-nav-item').forEach(btn => {
        btn.classList.remove('active');
      });
      navItem.classList.add('active');

      // Navigate to route
      Router.navigate(item.route);
    });

    nav.appendChild(navItem);
  });

  return nav;
};

/**
 * Mobile Back Button Component
 * Provides prominent back button positioned for thumb access
 * Requirements: 6.2
 */
export const MobileBackButton = ({ onBack, label = 'Back' }) => {
  const backBtn = document.createElement('button');
  backBtn.className = 'mobile-back-btn';
  backBtn.setAttribute('aria-label', `${label} - Go back to previous page`);

  // Back arrow icon
  const icon = document.createElement('span');
  icon.className = 'mobile-back-icon';
  icon.textContent = '←';

  // Label
  const labelSpan = document.createElement('span');
  labelSpan.className = 'mobile-back-label';
  labelSpan.textContent = label;

  backBtn.appendChild(icon);
  backBtn.appendChild(labelSpan);

  // Touch feedback
  backBtn.addEventListener(
    'touchstart',
    _e => {
      backBtn.classList.add('touch-active');
      if (window.mobileUtils?.supportsHaptic()) {
        window.mobileUtils.hapticFeedback([5]);
      }
    },
    { passive: true }
  );

  backBtn.addEventListener(
    'touchend',
    () => {
      backBtn.classList.remove('touch-active');
    },
    { passive: true }
  );

  backBtn.addEventListener(
    'touchcancel',
    () => {
      backBtn.classList.remove('touch-active');
    },
    { passive: true }
  );

  // Click handler
  backBtn.addEventListener('click', e => {
    e.preventDefault();
    if (onBack) {
      onBack();
    } else {
      // Default back behavior
      window.history.back();
    }
  });

  return backBtn;
};

/**
 * Update navigation active state
 * Helper function to update the active navigation item
 */
export const updateMobileNavigation = currentRoute => {
  const nav = document.querySelector('.mobile-nav');
  if (!nav) return;

  nav.querySelectorAll('.mobile-nav-item').forEach(item => {
    const route = item.getAttribute('data-route');
    if (route === currentRoute) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
};
