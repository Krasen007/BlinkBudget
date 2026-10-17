// tests/views/dashboard-account-type-filter.test.js
// Explore Accounts in Reports hands the dashboard an account-TYPE filter
// ('type:cash'). The dashboard must show every transaction of the accounts of
// that type, keep the balance in sync, and fall back to "all" when the type no
// longer exists.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DashboardView } from '../../src/views/DashboardView.js';
import { NavigationState } from '../../src/core/navigation-state.js';

const accounts = [
  {
    id: 'acc-checking',
    name: 'Main Checking',
    type: 'checking',
    isDefault: true,
  },
  { id: 'acc-cash-1', name: 'Wallet', type: 'cash', isDefault: false },
  { id: 'acc-cash-2', name: 'Cash Jar', type: 'cash', isDefault: false },
];

// checking net = 1000 - 200 = 800 ; cash net = 500 - 100 = 400
// all accounts = 1500 - 300 = 1200
const mockTransactions = [
  {
    id: '1',
    amount: 1000,
    category: 'Salary',
    type: 'income',
    accountId: 'acc-checking',
    toAccountId: null,
    timestamp: '2026-06-07T00:00:00.000Z',
  },
  {
    id: '2',
    amount: 200,
    category: 'Food',
    type: 'expense',
    accountId: 'acc-checking',
    toAccountId: null,
    timestamp: '2026-06-07T00:00:00.000Z',
  },
  {
    id: '3',
    amount: 500,
    category: 'Salary',
    type: 'income',
    accountId: 'acc-cash-1',
    toAccountId: null,
    timestamp: '2026-06-07T00:00:00.000Z',
  },
  {
    id: '4',
    amount: 100,
    category: 'Food',
    type: 'expense',
    accountId: 'acc-cash-2',
    toAccountId: null,
    timestamp: '2026-06-07T00:00:00.000Z',
  },
];

let statCards = [];
let currentAccounts = [...accounts];
let dashboardFilter = null;

vi.mock('../../src/components/QuickAmountPresets.js', () => ({
  createQuickAmountPresets: vi.fn(() => ({
    container: document.createElement('div'),
    destroy: vi.fn(),
  })),
}));

vi.mock('../../src/components/Button.js', () => ({
  ButtonComponent: ({ text }) => {
    const btn = document.createElement('button');
    btn.textContent = text;
    return btn;
  },
}));

vi.mock('../../src/components/DashboardStatsCard.js', () => ({
  DashboardStatsCard: props => {
    statCards.push({ ...props });
    return document.createElement('div');
  },
}));

vi.mock('../../src/core/Account/account-service.js', () => ({
  AccountService: {
    getAccounts: () => currentAccounts,
    getDefaultAccount: () => currentAccounts[0],
  },
}));

vi.mock('../../src/core/transaction-service.js', () => ({
  TransactionService: { getAll: () => mockTransactions },
}));

vi.mock('../../src/core/custom-category-service.js', () => ({
  CustomCategoryService: { getCheckboxCategories: () => [] },
}));

vi.mock('../../src/core/auth-service.js', () => ({
  AuthService: { user: null, getUserId: () => 'user-1' },
}));

vi.mock('../../src/core/router.js', () => ({
  Router: { navigate: vi.fn() },
}));

vi.mock('../../src/core/navigation-state.js', () => ({
  NavigationState: {
    restoreDashboardFilter: () => dashboardFilter,
    restoreDashboardTypeFilter: () => null,
    restoreDashboardTimePeriod: () => null,
    clearDashboardFilter: vi.fn(),
    clearDashboardTypeFilter: vi.fn(),
    saveTimePeriod: vi.fn(),
    saveReportsCategoryFilter: vi.fn(),
  },
}));

vi.mock('../../src/utils/success-feedback.js', () => ({
  getTransactionToHighlight: () => [],
}));

vi.mock('../../src/utils/navigation-helper.js', () => ({
  createNavigationButtons: () => document.createElement('div'),
}));

vi.mock('../../src/core/analytics/AnalyticsInstance.js', () => ({
  getAnalyticsEngine: () => ({
    generateSpendingInsights: () => [],
    calculateCategoryBreakdown: () => ({}),
    calculateIncomeVsExpenses: () => ({}),
    calculateCostOfLiving: () => ({}),
  }),
}));

vi.mock('../../src/core/analytics/AnomalyService.js', () => ({
  AnomalyService: { detectAnomalies: () => [] },
}));

vi.mock('../../src/utils/reports-utils.js', () => ({
  getCurrentMonthPeriod: () => ({
    startDate: '2026-06-01',
    endDate: '2026-06-30',
  }),
}));

describe('DashboardView account type filter', () => {
  let container;

  beforeEach(() => {
    currentAccounts = [...accounts];
    dashboardFilter = null;
    const store = {};
    global.sessionStorage = {
      getItem: vi.fn(key => (key in store ? store[key] : null)),
      setItem: vi.fn((key, value) => {
        store[key] = String(value);
      }),
      removeItem: vi.fn(key => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      }),
    };
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    statCards = [];
    container = null;
    vi.clearAllMocks();
  });

  const render = () => {
    container = DashboardView();
    document.body.appendChild(container);
  };

  const selectEl = () => container.querySelectorAll('select')[0];
  const totalCard = () =>
    statCards.find(
      c => c.label.includes('Filtered') || c.label.includes('Available')
    );

  it('shows every transaction of the filtered account type', () => {
    dashboardFilter = { accountType: 'cash', source: 'reports' };
    render();

    expect(selectEl().value).toBe('type:cash');

    const rows = container.querySelectorAll('.dashboard-transactions-list li');
    expect(rows).toHaveLength(2);
  });

  it('keeps the displayed balance in sync with the filtered type', () => {
    dashboardFilter = { accountType: 'cash', source: 'reports' };
    render();

    // Cash only: 500 income - 100 expense
    expect(totalCard().label).toBe('Total Filtered');
    expect(totalCard().value).toBe(400);
  });

  it('labels the synthetic dropdown option with the account type', () => {
    dashboardFilter = { accountType: 'cash', source: 'reports' };
    render();

    const options = [...selectEl().options].map(o => ({
      value: o.value,
      text: o.textContent,
    }));
    expect(options).toContainEqual({
      value: 'type:cash',
      text: 'Cash — all accounts',
    });
  });

  it('explains the active account filter in the status line', () => {
    dashboardFilter = { accountType: 'cash', source: 'reports' };
    render();

    expect(container.textContent).toContain('Currently filtered by account');
    expect(container.textContent).toContain('Cash');
  });

  it('falls back to All Accounts when the type no longer has accounts', () => {
    dashboardFilter = { accountType: 'savings', source: 'reports' };
    render();

    expect(selectEl().value).toBe('all');
    expect(totalCard().label).toBe('Total Available');
    expect(totalCard().value).toBe(1200);
  });

  it('still resets the account filter for category navigations from Reports', () => {
    dashboardFilter = { category: 'Food', source: 'reports' };
    render();

    // The category filter applies, but the account dropdown stays on "all"
    expect(selectEl().value).toBe('all');
    const optionValues = [...selectEl().options].map(o => o.value);
    expect(optionValues.some(value => value.startsWith('type:'))).toBe(false);
  });

  it('keeps month arrows when drilling into a category from a monthly Reports period', () => {
    dashboardFilter = {
      category: 'Food',
      source: 'reports',
      timePeriod: {
        type: 'monthly',
        startDate: new Date('2026-06-01T00:00:00.000Z'),
        endDate: new Date('2026-06-30T23:59:59.999Z'),
        label: 'This Month',
      },
    };
    render();

    // Spent card is the second stats card and must keep month navigation
    const spentCard = statCards[1];
    expect(spentCard.showMonthNavigation).toBe(true);
    expect(spentCard.currentMonthFilter).toBeTruthy();
  });

  it('keeps Reports monthly filtering aligned west of UTC', () => {
    const originalTimeZone = process.env.TZ;
    process.env.TZ = 'America/Los_Angeles';
    try {
      dashboardFilter = {
        category: 'Food',
        source: 'reports',
        timePeriod: {
          type: 'monthly',
          startDate: new Date(2026, 5, 1),
          endDate: new Date(2026, 5, 30, 23, 59, 59, 999),
          label: 'June 2026',
        },
      };
      render();

      const rows = container.querySelectorAll(
        '.dashboard-transactions-list li'
      );
      expect(rows).toHaveLength(2);
      expect(new Date(statCards[1].currentMonthFilter).getMonth()).toBe(5);
    } finally {
      if (originalTimeZone === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = originalTimeZone;
      }
    }
  });

  it('returns to Reports with the month selected by dashboard navigation', () => {
    dashboardFilter = {
      category: 'Food',
      source: 'reports',
      timePeriod: {
        type: 'monthly',
        startDate: new Date('2026-06-01T00:00:00.000Z'),
        endDate: new Date('2026-06-30T23:59:59.999Z'),
        label: 'June 2026',
      },
    };
    render();

    statCards[statCards.length - 1].onMonthChange(
      new Date(2026, 6, 1).toISOString()
    );

    const filterStatus = container.querySelector('.reports-filter-status');
    expect(filterStatus.textContent).toContain('July 2026');
    filterStatus.dispatchEvent(new Event('click', { bubbles: true }));

    expect(NavigationState.saveTimePeriod).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'monthly',
        label: expect.stringContaining('July 2026'),
      })
    );
  });

  it('restores a plain account-id filter from the session', () => {
    global.sessionStorage.setItem('dashboard_filter', 'acc-checking');
    render();

    expect(selectEl().value).toBe('acc-checking');
    expect(totalCard().value).toBe(800);
  });
});
