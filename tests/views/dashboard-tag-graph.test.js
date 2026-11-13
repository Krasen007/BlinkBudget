import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DashboardView } from '../../src/views/DashboardView.js';
import { NavigationState } from '../../src/core/navigation-state.js';
import { STORAGE_KEYS } from '../../src/utils/constants.js';

/** Black-box tests for the dashboard spending graph that appears when a tag
 *  is drilled into from Reports -> Explore Tags. Verified through the public
 *  interface: NavigationState.saveDashboardFilter({ tag, source: 'reports', ... })
 *  followed by a real DashboardView render. */
vi.mock('../../src/core/auth-service.js', () => ({
  AuthService: { user: null, getUserId: () => 'user-1' },
}));
vi.mock('../../src/core/router.js', () => ({ Router: { navigate: vi.fn() } }));
vi.mock('../../src/core/analytics/AnalyticsInstance.js', () => ({
  getAnalyticsEngine: () => ({
    generateSpendingInsights: () => [],
    calculateCategoryBreakdown: () => ({}),
    calculateIncomeVsExpenses: () => ({}),
    calculateCostOfLiving: () => ({}),
  }),
}));

const createMemoryStorage = () => {
  const store = new Map();
  return {
    getItem: key => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: key => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
};

const getRenderedTransactionIds = container =>
  Array.from(container.querySelectorAll('.transaction-list-item')).map(
    item => item.dataset.transactionId
  );

const drillIntoTag = (transactions, tag, monthPeriod) => {
  const store = new Map();
  global.localStorage = {
    getItem: key => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: key => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
  global.sessionStorage = {
    getItem: key => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: key => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
  global.localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  global.localStorage.setItem(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify([]));
  global.localStorage.setItem('categories_initialized_user-1', 'true');

  NavigationState.saveDashboardFilter({
    tag,
    source: 'reports',
    timePeriod: monthPeriod,
  });

  const container = DashboardView();
  document.body.appendChild(container);
  return container;
};

describe('DashboardView tag -> spending graph', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('shows a spending graph above the list when drilled into a tag from Reports', () => {
    const transactions = [
      { id: 'mar-work', amount: 10, category: 'Food', type: 'expense', accountId: 'main', tags: ['Work'], timestamp: '2026-03-10T09:00:00.000Z' },
      { id: 'apr-work', amount: 20, category: 'Leisure', type: 'expense', accountId: 'main', tags: ['Work'], timestamp: '2026-04-10T09:00:00.000Z' },
      { id: 'may-work', amount: 30, category: 'Bill', type: 'expense', accountId: 'main', tags: ['Work'], timestamp: '2026-05-10T09:00:00.000Z' },
      { id: 'jun-work', amount: 15, category: 'Food', type: 'expense', accountId: 'main', tags: ['Work'], timestamp: '2026-06-10T09:00:00.000Z' },
      { id: 'jun-other', amount: 99, category: 'Food', type: 'expense', accountId: 'main', tags: ['Personal'], timestamp: '2026-06-11T09:00:00.000Z' },
    ];
    const period = {
      type: 'monthly',
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-30T23:59:59.999Z',
      label: 'June 2026',
    };

    const container = drillIntoTag(transactions, 'Work', period);

    const card = container.querySelector('.category-history-card');
    expect(card).not.toBeNull();
    expect(card.querySelector('.category-history-title').textContent).toBe('Tag: Work');
    const bars = [...card.querySelectorAll('.category-history-bar')];
    expect(bars.map(bar => bar.dataset.month)).toEqual([
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
    ]);
    expect(bars.find(bar => bar.dataset.month === '2026-06').getAttribute('aria-pressed')).toBe('true');

    // List below covers the active period (June) filtered by the tag.
    expect(getRenderedTransactionIds(container)).toEqual(['jun-work']);
  });

  it('does not show the spending graph when the tag filter is an exclude', () => {
    const transactions = [
      { id: 'jun-work', amount: 15, category: 'Food', type: 'expense', accountId: 'main', tags: ['Work'], timestamp: '2026-06-10T09:00:00.000Z' },
      { id: 'jun-other', amount: 99, category: 'Food', type: 'expense', accountId: 'main', tags: ['Personal'], timestamp: '2026-06-11T09:00:00.000Z' },
    ];
    const period = {
      type: 'monthly',
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-30T23:59:59.999Z',
      label: 'June 2026',
    };

    const container = drillIntoTag(transactions, 'exclude:Work', period);

    expect(container.querySelector('.category-history-card')).toBeNull();
    // Excluding Work leaves the non-tagged June transaction.
    expect(getRenderedTransactionIds(container)).toEqual(['jun-other']);
  });
});
