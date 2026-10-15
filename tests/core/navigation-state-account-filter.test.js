// tests/core/navigation-state-account-filter.test.js
// Reports → Dashboard handoff must accept an account filter (Explore
// Accounts), not just a category or a tag.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NavigationState } from '../../src/core/navigation-state.js';

describe('NavigationState.saveDashboardFilter - account filters', () => {
  let store;

  beforeEach(() => {
    store = {};
    global.sessionStorage = {
      getItem: vi.fn(key => (key in store ? store[key] : null)),
      setItem: vi.fn((key, value) => {
        store[key] = String(value);
      }),
      removeItem: vi.fn(key => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
    };
  });

  it('saves and restores an account type filter', () => {
    NavigationState.saveDashboardFilter({
      accountType: 'cash',
      source: 'reports',
    });

    const restored = NavigationState.restoreDashboardFilter();
    expect(restored).toMatchObject({ accountType: 'cash', source: 'reports' });
  });

  it('saves and restores a single account filter', () => {
    NavigationState.saveDashboardFilter({
      accountId: 'acc-1',
      source: 'reports',
    });

    expect(NavigationState.restoreDashboardFilter()).toMatchObject({
      accountId: 'acc-1',
    });
  });

  it('still saves category and tag filters', () => {
    NavigationState.saveDashboardFilter({ category: 'Food' });
    expect(NavigationState.restoreDashboardFilter()).toMatchObject({
      category: 'Food',
    });

    NavigationState.saveDashboardFilter({ tag: 'Work' });
    expect(NavigationState.restoreDashboardFilter()).toMatchObject({
      tag: 'Work',
    });
  });

  it('ignores filter data without any supported field', () => {
    NavigationState.saveDashboardFilter({ source: 'reports' });

    expect(global.sessionStorage.setItem).not.toHaveBeenCalled();
    expect(NavigationState.restoreDashboardFilter()).toBeNull();
  });

  it('ignores an empty account type', () => {
    NavigationState.saveDashboardFilter({ accountType: '   ' });

    expect(global.sessionStorage.setItem).not.toHaveBeenCalled();
  });
});
