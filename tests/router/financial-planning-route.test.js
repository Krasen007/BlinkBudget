import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  currentView: null,
  setView: vi.fn(),
  setLastActiveView: vi.fn(),
  updateMobileNavigation: vi.fn(),
  getCachedView: vi.fn(),
}));

vi.mock('../../src/core/view-manager.js', () => ({
  ViewManager: {
    getCurrentView: () => mocks.currentView,
    setView: mocks.setView,
  },
}));

vi.mock('../../src/core/navigation-state.js', () => ({
  NavigationState: {
    setLastActiveView: mocks.setLastActiveView,
  },
}));

vi.mock('../../src/components/MobileNavigation.js', () => ({
  updateMobileNavigation: mocks.updateMobileNavigation,
}));

vi.mock('../../src/core/view-preloader.js', () => ({
  ViewPreloader: {
    getCachedView: mocks.getCachedView,
  },
}));

vi.mock('../../src/views/DashboardView.js', () => ({
  DashboardView: vi.fn(),
}));

vi.mock('../../src/views/AddView.js', () => ({
  AddView: vi.fn(),
}));

vi.mock('../../src/views/EditView.js', () => ({
  EditView: vi.fn(),
}));

vi.mock('../../src/views/ReportsView.js', () => ({
  ReportsView: vi.fn(),
}));

import { routes } from '../../src/router/routes.js';

describe('Financial Planning route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.currentView = null;
  });

  it('switches sections on the existing view instead of remounting it', async () => {
    const setSection = vi.fn();
    mocks.currentView = document.createElement('div');
    mocks.currentView.className = 'view-financial-planning';
    mocks.currentView.setSection = setSection;

    await routes['financial-planning']({ section: 'goals' });

    expect(setSection).toHaveBeenCalledWith('goals');
    expect(mocks.setView).not.toHaveBeenCalled();
    expect(mocks.getCachedView).not.toHaveBeenCalled();
    expect(mocks.updateMobileNavigation).toHaveBeenCalledWith(
      'financial-planning'
    );
  });
});
