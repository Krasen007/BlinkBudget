import { describe, it, expect, afterEach, vi } from 'vitest';
import { DashboardView } from '../../src/views/DashboardView.js';
import { NavigationState } from '../../src/core/navigation-state.js';
import { STORAGE_KEYS } from '../../src/utils/constants.js';

/** Black-box test for the spending graph that appears when drilling into an
 *  account type from Reports -> Explore Accounts. Verified through the public
 *  interface: NavigationState.saveDashboardFilter({ accountType, source:
 *  'reports', ... }) followed by a real DashboardView render. Unlike
 *  dashboard-account-type-filter.test.js, this file seeds the real
 *  transaction/account data layer so the history strip and the list both
 *  render. */
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

const drillIntoAccountType = (transactions, accounts, accountType, period) => {
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
  global.localStorage.setItem(
    STORAGE_KEYS.TRANSACTIONS,
    JSON.stringify(transactions)
  );
  global.localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  global.localStorage.setItem('categories_initialized_user-1', 'true');

  NavigationState.saveDashboardFilter({
    accountType,
    source: 'reports',
    timePeriod: period,
  });

  const container = DashboardView();
  document.body.appendChild(container);
  return container;
};

describe('DashboardView Explore Accounts drill', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('shows the spending graph above the list when drilled into a type', () => {
    const accounts = [
      { id: 'acc-1', name: 'Main Checking', type: 'checking', isDefault: true },
      { id: 'acc-2', name: 'Narrow', type: 'checking', isDefault: false },
      { id: 'acc-3', name: 'Offshore', type: 'savings', isDefault: false },
    ];
    const transactions = [
      {
        id: 'mar-1',
        amount: 10,
        category: 'Food',
        type: 'expense',
        accountId: 'acc-1',
        timestamp: '2026-03-10T09:00:00.000Z',
      },
      {
        id: 'apr-1',
        amount: 20,
        category: 'Leisure',
        type: 'expense',
        accountId: 'acc-1',
        timestamp: '2026-04-10T09:00:00.000Z',
      },
      {
        id: 'may-1',
        amount: 30,
        category: 'Bill',
        type: 'expense',
        accountId: 'acc-2',
        timestamp: '2026-05-10T09:00:00.000Z',
      },
      {
        id: 'jun-1',
        amount: 15,
        category: 'Food',
        type: 'expense',
        accountId: 'acc-1',
        timestamp: '2026-06-10T09:00:00.000Z',
      },
      {
        id: 'jun-2',
        amount: 99,
        category: 'Food',
        type: 'expense',
        accountId: 'acc-2',
        timestamp: '2026-06-12T09:00:00.000Z',
      },
      {
        id: 'jun-3',
        amount: 50,
        category: 'Food',
        type: 'expense',
        accountId: 'acc-3',
        timestamp: '2026-06-11T09:00:00.000Z',
      },
    ];
    const period = {
      type: 'monthly',
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-30T23:59:59.999Z',
      label: 'June 2026',
    };

    const container = drillIntoAccountType(
      transactions,
      accounts,
      'checking',
      period
    );

    const card = container.querySelector('.category-history-card');
    expect(card).not.toBeNull();
    expect(card.querySelector('.category-history-title').textContent).toBe(
      'Checking Account'
    );
    const bars = [...card.querySelectorAll('.category-history-bar')];
    expect(bars.map(bar => bar.dataset.month)).toEqual([
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
    ]);
    expect(
      bars
        .find(bar => bar.dataset.month === '2026-06')
        .getAttribute('aria-pressed')
    ).toBe('true');

    // The list below covers only the active period (June) and is filtered to
    // checking accounts, so the savings transaction is excluded. Newest first.
    expect(
      Array.from(container.querySelectorAll('.transaction-list-item')).map(
        item => item.dataset.transactionId
      )
    ).toEqual(['jun-2', 'jun-1']);
  });

  it('does not render the spending graph for an unknown type', () => {
    const accounts = [
      { id: 'acc-1', name: 'Main Checking', type: 'checking', isDefault: true },
    ];
    const transactions = [
      {
        id: 'jun-1',
        amount: 15,
        category: 'Food',
        type: 'expense',
        accountId: 'acc-1',
        timestamp: '2026-06-10T09:00:00.000Z',
      },
    ];
    const period = {
      type: 'monthly',
      startDate: '2026-06-01T00:00:00.000Z',
      endDate: '2026-06-30T23:59:59.999Z',
      label: 'June 2026',
    };

    const container = drillIntoAccountType(
      transactions,
      accounts,
      'other',
      period
    );

    expect(container.querySelector('.category-history-card')).toBeNull();
  });
});
