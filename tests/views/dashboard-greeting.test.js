import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DashboardView } from '../../src/views/DashboardView.js';
import { TransactionService } from '../../src/core/transaction-service.js';
import { AuthService } from '../../src/core/auth-service.js';
import { analyticsCache } from '../../src/core/analytics/AnalyticsCache.js';
import {
  EMPTY_STATE_SCENARIOS,
  createEnhancedEmptyState,
} from '../../src/utils/enhanced-empty-states.js';

vi.mock('../../src/components/QuickAmountPresets.js', () => ({
  createQuickAmountPresets: vi.fn(() => ({
    container: document.createElement('div'),
    destroy: vi.fn(),
  })),
}));

vi.mock('../../src/components/Button.js', () => ({
  ButtonComponent: () => document.createElement('button'),
}));

vi.mock('../../src/components/DashboardStatsCard.js', () => ({
  DashboardStatsCard: () => document.createElement('div'),
}));

// Regression tests for the auth-switch cache invalidation in handleAuthChange.
// Planning data is user-specific, so a stale 'financial_planning_preload' entry
// surviving an auth change is a cross-user data bleed on a shared device.
//
// The fix invalidates synchronously (invalidateSync) before renderDashboard(),
// and hands the async invalidate() the keys captured beforehand — otherwise it
// re-derives them from the already-emptied in-memory map and would silently skip
// the persistent layer.
//
// The global `localStorage` from tests/setup.js is a spy stub: setItem records
// the call but stores nothing, and getItem always returns undefined. These
// assertions read the persistent layer back, so they need a real store — the
// same LocalStorageMock the other storage-reading suites install.
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  clear() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] ?? null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }

  get length() {
    return Object.keys(this.store).length;
  }

  key(index) {
    return Object.keys(this.store)[index] ?? null;
  }
}

describe('DashboardView auth-switch cache invalidation', () => {
  const CACHE_KEY = 'financial_planning_preload';
  const PERSISTENT_KEY = 'blinkbudget_analytics_analytics_cache';

  const dispatchAuthChange = user => {
    window.dispatchEvent(
      new CustomEvent('auth-state-changed', { detail: { user } })
    );
  };

  // Read the persistent layer straight off disk, deliberately: this asserts on
  // the bytes that survive an auth switch, not on an in-memory structure.
  // AnalyticsCache._setInStorage wraps everything in a
  // { data, timestamp, version, ttl } envelope, so the per-key map lives at
  // `.data` — asserting on the top level would pass/fail for reasons that have
  // nothing to do with invalidation.
  const readPersistedKeys = () => {
    const raw = localStorage.getItem(PERSISTENT_KEY);
    return raw ? JSON.parse(raw).data : null;
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('localStorage', new LocalStorageMock());
    localStorage.clear();
    analyticsCache.clearAll();
    vi.spyOn(TransactionService, 'getAll').mockReturnValue([]);
    AuthService.user = { displayName: 'Alex' };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('clears the in-memory planning cache synchronously, before render completes', () => {
    analyticsCache.set(CACHE_KEY, { goals: ['user-A-private-goal'] }, 60000);
    expect(analyticsCache.get(CACHE_KEY)).not.toBeNull();

    const el = DashboardView();

    // The auth change must have taken effect by the time the handler returns —
    // i.e. the async invalidate() microtask must not be the only thing standing
    // between a user switch and the previous user's data.
    dispatchAuthChange({ displayName: 'Sam' });

    expect(analyticsCache.get(CACHE_KEY)).toBeNull();
    if (el.cleanup) el.cleanup();
  });

  it('passes pre-captured keys to the async invalidate so the persistent layer is cleared', async () => {
    const invalidateSpy = vi.spyOn(analyticsCache, 'invalidate');
    analyticsCache.set(CACHE_KEY, { goals: ['user-A-private-goal'] }, 60000);

    const el = DashboardView();

    await vi.waitFor(() => {
      expect(readPersistedKeys()?.[CACHE_KEY]).toBeDefined();
    });

    dispatchAuthChange({ displayName: 'Sam' });

    expect(invalidateSpy).toHaveBeenCalledWith(CACHE_KEY, [CACHE_KEY]);

    await vi.waitFor(() => {
      expect(readPersistedKeys()?.[CACHE_KEY]).toBeUndefined();
    });

    if (el.cleanup) el.cleanup();
  });

  it('does not surface an unhandled rejection when cache invalidation fails', async () => {
    const rejections = [];
    const onRejection = reason => rejections.push(reason);
    window.addEventListener('unhandledrejection', onRejection);

    vi.spyOn(analyticsCache, 'invalidate').mockRejectedValue(
      new Error('simulated cache failure')
    );

    const el = DashboardView();
    dispatchAuthChange({ displayName: 'Sam' });

    // Give the rejected promise a chance to surface as an unhandled rejection.
    await new Promise(resolve => setTimeout(resolve, 0));
    window.removeEventListener('unhandledrejection', onRejection);

    expect(rejections).toEqual([]);
    // The view must still have rendered rather than thrown out of the handler.
    expect(el.querySelector('.view-title')).toBeTruthy();
    if (el.cleanup) el.cleanup();
  });
});

describe('DashboardView First-Run Greeting and Empty State', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('renders "Welcome to BlinkBudget!" for first-run users without displayName', () => {
    vi.spyOn(TransactionService, 'getAll').mockReturnValue([]);
    AuthService.user = null;

    const el = DashboardView();
    const title = el.querySelector('.view-title');

    expect(title.textContent).toMatch(/^Welcome to BlinkBudget!/);
    if (el.cleanup) el.cleanup();
  });

  it('renders "Welcome to BlinkBudget, [name]!" for first-run users with displayName', () => {
    vi.spyOn(TransactionService, 'getAll').mockReturnValue([]);
    AuthService.user = { displayName: 'Alex' };

    const el = DashboardView();
    const title = el.querySelector('.view-title');

    expect(title.textContent).toMatch(/^Welcome to BlinkBudget, Alex!/);
    if (el.cleanup) el.cleanup();
  });

  it('renders "Hi, [name]!" for returning users with transactions and displayName', () => {
    vi.spyOn(TransactionService, 'getAll').mockReturnValue([
      {
        id: 'tx-1',
        amount: 10,
        category: 'Food',
        type: 'expense',
        timestamp: '2026-08-01T12:00:00.000Z',
      },
    ]);
    AuthService.user = { displayName: 'Alex' };

    const el = DashboardView();
    const title = el.querySelector('.view-title');

    expect(title.textContent).toMatch(/^Hi, Alex!/);
    if (el.cleanup) el.cleanup();
  });

  it('renders "Welcome back!" for returning users with transactions and no displayName', () => {
    vi.spyOn(TransactionService, 'getAll').mockReturnValue([
      {
        id: 'tx-1',
        amount: 10,
        category: 'Food',
        type: 'expense',
        timestamp: '2026-08-01T12:00:00.000Z',
      },
    ]);
    AuthService.user = null;

    const el = DashboardView();
    const title = el.querySelector('.view-title');

    expect(title.textContent).toMatch(/^Welcome back!/);
    if (el.cleanup) el.cleanup();
  });

  it('updates title when auth state changes', () => {
    vi.spyOn(TransactionService, 'getAll').mockReturnValue([]);
    AuthService.user = null;

    const el = DashboardView();
    const title = el.querySelector('.view-title');
    expect(title.textContent).toMatch(/^Welcome to BlinkBudget!/);

    window.dispatchEvent(
      new CustomEvent('auth-state-changed', {
        detail: { user: { displayName: 'Jordan' } },
      })
    );

    expect(title.textContent).toMatch(/^Welcome to BlinkBudget, Jordan!/);
    if (el.cleanup) el.cleanup();
  });

  it('creates NO_TRANSACTIONS empty state with updated icon and text', () => {
    const emptyState = createEnhancedEmptyState(
      EMPTY_STATE_SCENARIOS.NO_TRANSACTIONS
    );
    const icon = emptyState.querySelector('.empty-state__icon');
    const heading = emptyState.querySelector('.empty-state__title');
    const msg = emptyState.querySelector('.empty-state__message');

    expect(icon.textContent).toBe('💰');
    expect(heading.textContent).toBe('Start Tracking Your Spending');
    expect(msg.textContent).toBe(
      'Add your first transaction to see your money story unfold. It only takes 3 clicks.'
    );
  });
});
