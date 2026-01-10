import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  MobileNavigation,
  MobileBackButton,
  updateMobileNavigation,
} from '../src/components/MobileNavigation.js';

// Mock the Router
vi.mock('../src/core/router.js', () => ({
  Router: {
    navigate: vi.fn(),
  },
}));

// Mock mobile utils
global.window.mobileUtils = {
  supportsHaptic: () => true,
  hapticFeedback: vi.fn(),
};

describe('MobileNavigation', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('should create navigation with correct structure', () => {
    const nav = MobileNavigation({ currentRoute: 'reports' });

    expect(nav.tagName).toBe('NAV');
    expect(nav.className).toBe('mobile-nav');
    expect(nav.getAttribute('role')).toBe('navigation');
    expect(nav.getAttribute('aria-label')).toBe('Main navigation');

    // Should have 4 navigation items
    const _navItems = nav.querySelectorAll('.mobile-nav-item');
    expect(_navItems.length).toBe(4);

    // Check navigation item structure - first item is now Charts/Reports
    const reportsItem = nav.querySelector('[data-route="reports"]');
    expect(reportsItem.classList.contains('active')).toBe(true);
    expect(reportsItem.getAttribute('data-route')).toBe('reports');

    const icon = reportsItem.querySelector('.mobile-nav-icon');
    const label = reportsItem.querySelector('.mobile-nav-label');
    expect(icon).toBeTruthy();
    expect(label).toBeTruthy();
    expect(label.textContent).toBe('Charts');
  });

  it('should highlight correct active route', () => {
    const nav = MobileNavigation({ currentRoute: 'add-expense' });

    const reportsItem = nav.querySelector('[data-route="reports"]');
    const addItem = nav.querySelector('[data-route="add-expense"]');

    expect(reportsItem.classList.contains('active')).toBe(false);
    expect(addItem.classList.contains('active')).toBe(true);
  });

  it('should update navigation active state', () => {
    const nav = MobileNavigation({ currentRoute: 'reports' });
    document.body.appendChild(nav);

    // Update to dashboard
    updateMobileNavigation('dashboard');

    const reportsItem = nav.querySelector('[data-route="reports"]');
    const dashboardItem = nav.querySelector('[data-route="dashboard"]');

    expect(reportsItem.classList.contains('active')).toBe(false);
    expect(dashboardItem.classList.contains('active')).toBe(true);
  });
});

describe('MobileBackButton', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('should create back button with correct structure', () => {
    const onBack = vi.fn();
    const backBtn = MobileBackButton({ onBack, label: 'Cancel' });

    expect(backBtn.tagName).toBe('BUTTON');
    expect(backBtn.className).toBe('mobile-back-btn');

    const icon = backBtn.querySelector('.mobile-back-icon');
    const label = backBtn.querySelector('.mobile-back-label');

    expect(icon).toBeTruthy();
    expect(icon.textContent).toBe('←');
    expect(label).toBeTruthy();
    expect(label.textContent).toBe('Cancel');
  });

  it('should call onBack when clicked', () => {
    const onBack = vi.fn();
    const backBtn = MobileBackButton({ onBack });

    backBtn.click();

    expect(onBack).toHaveBeenCalledOnce();
  });

  it('should use default back behavior when no onBack provided', () => {
    const mockBack = vi.fn();
    global.window.history = { back: mockBack };

    const backBtn = MobileBackButton({});
    backBtn.click();

    expect(mockBack).toHaveBeenCalledOnce();
  });
});
