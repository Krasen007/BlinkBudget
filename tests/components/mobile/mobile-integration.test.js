import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  MobileNavigation,
  updateMobileNavigation,
} from '../../../src/components/MobileNavigation.js';
import { Router } from '../../../src/core/router.js';

// Mock Router
vi.mock('../../../src/core/router.js', () => ({
  Router: {
    navigate: vi.fn(),
  },
}));

// Mock mobile utils
global.window.mobileUtils = {
  supportsHaptic: () => true,
  hapticFeedback: vi.fn(),
  isMobile: () => true,
};

describe('Mobile Navigation Integration', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('should navigate when navigation items are clicked', () => {
    const nav = MobileNavigation({ currentRoute: 'reports' });
    document.body.appendChild(nav);

    const addItem = nav.querySelector('[data-route="add-expense"]');

    // Simulate click
    addItem.click();

    expect(Router.navigate).toHaveBeenCalledWith('add-expense');
  });

  it('should update active states when navigation occurs', () => {
    const nav = MobileNavigation({ currentRoute: 'reports' }); // Start with reports active
    document.body.appendChild(nav);

    const reportsItem = nav.querySelector('[data-route="reports"]');
    const dashboardItem = nav.querySelector('[data-route="dashboard"]');

    // Initially reports should be active
    expect(reportsItem.classList.contains('active')).toBe(true);
    expect(dashboardItem.classList.contains('active')).toBe(false);

    // Click dashboard
    dashboardItem.click();

    // Should update active states
    expect(reportsItem.classList.contains('active')).toBe(false);
    expect(dashboardItem.classList.contains('active')).toBe(true);

    expect(Router.navigate).toHaveBeenCalledWith('dashboard');
  });

  it('should provide proper accessibility attributes', () => {
    const nav = MobileNavigation({ currentRoute: 'reports' });
    document.body.appendChild(nav);

    expect(nav.getAttribute('role')).toBe('navigation');
    expect(nav.getAttribute('aria-label')).toBe('Main navigation');

    const navItems = nav.querySelectorAll('.mobile-nav-item');
    navItems.forEach(item => {
      expect(item.getAttribute('aria-label')).toBeTruthy();
      expect(item.getAttribute('data-route')).toBeTruthy();
    });
  });

  it('should handle dashboard route correctly', () => {
    const nav = MobileNavigation({ currentRoute: 'reports' });
    document.body.appendChild(nav);

    // Test updateMobileNavigation function with dashboard route
    updateMobileNavigation('dashboard');

    const dashboardItem = nav.querySelector('[data-route="dashboard"]');

    // Dashboard route should highlight dashboard button
    expect(dashboardItem.classList.contains('active')).toBe(true);
  });
});
