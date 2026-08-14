import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DashboardView } from '../../src/views/DashboardView.js';

const accountsBefore = [
  { id: 'acc1', name: 'по сметка', type: 'checking', isDefault: true },
  { id: 'acc2', name: 'Cash', type: 'cash', isDefault: false },
];

const accountsAfterDeletion = [
  { id: 'acc2', name: 'Cash', type: 'cash', isDefault: true },
];

// acc1 net = 1000 - 200 = 800 ; all accounts = (1000 + 500) - 200 = 1300
const mockTransactions = [
  {
    id: '1',
    amount: 1000,
    category: 'Salary',
    type: 'income',
    accountId: 'acc1',
    toAccountId: null,
    timestamp: '2026-06-07T00:00:00.000Z',
  },
  {
    id: '2',
    amount: 200,
    category: 'Food',
    type: 'expense',
    accountId: 'acc1',
    toAccountId: null,
    timestamp: '2026-06-07T00:00:00.000Z',
  },
  {
    id: '3',
    amount: 500,
    category: 'Salary',
    type: 'income',
    accountId: 'acc2',
    toAccountId: null,
    timestamp: '2026-06-07T00:00:00.000Z',
  },
];

let statCards = [];
let currentAccounts = [...accountsBefore];

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
    restoreDashboardFilter: () => null,
    restoreDashboardTypeFilter: () => null,
    restoreDashboardTimePeriod: () => null,
    clearDashboardFilter: vi.fn(),
    clearDashboardTypeFilter: vi.fn(),
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

describe('DashboardView account filter / balance sync', () => {
  let container;

  beforeEach(() => {
    currentAccounts = [...accountsBefore];
    const store = {};
    global.sessionStorage = {
      getItem: vi.fn(key => store[key] || null),
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

  const selectValue = () => {
    const sel = container.querySelectorAll('select')[0];
    return sel ? sel.value : null;
  };

  it('valid filter shows that account name and its filtered balance', () => {
    global.sessionStorage.setItem('dashboard_filter', 'acc1');
    render();

    const first = statCards.find(
      c => c.label.includes('Filtered') || c.label.includes('Available')
    );
    // Selected account "по сметка" (acc1) balance = 800, NOT the all-accounts 1300
    expect(first.label).toBe('Total Filtered');
    expect(first.value).toBe(800);
    expect(selectValue()).toBe('acc1');
  });

  it('fresh start shows All Accounts with the all-accounts balance', () => {
    render();

    const first = statCards.find(
      c => c.label.includes('Filtered') || c.label.includes('Available')
    );
    expect(first.label).toBe('Total Available');
    expect(first.value).toBe(1300);
    expect(selectValue()).toBe('all');
  });

  it('stale/invalid filter is reset to All Accounts so name and amount stay in sync', () => {
    // Persisted filter points to a deleted account that no longer exists
    global.sessionStorage.setItem('dashboard_filter', 'deleted-acc');
    render();

    const first = statCards.find(
      c => c.label.includes('Filtered') || c.label.includes('Available')
    );
    // Should have normalized back to "All Accounts" → all-accounts balance
    expect(first.label).toBe('Total Available');
    expect(first.value).toBe(1300);
    expect(selectValue()).toBe('all');
    expect(global.sessionStorage.setItem).toHaveBeenCalledWith(
      'dashboard_filter',
      'all'
    );
  });

  it('regression: account deletion resets stale filter when accounts change', () => {
    // Step 1: Initial render with both accounts, filter set to acc1
    global.sessionStorage.setItem('dashboard_filter', 'acc1');
    render();

    let selectEl = container.querySelectorAll('select')[0];
    expect(selectEl.value).toBe('acc1');

    const statsBeforeDelete = statCards.find(
      c => c.label.includes('Filtered') || c.label.includes('Available')
    );
    expect(statsBeforeDelete.label).toBe('Total Filtered');
    expect(statsBeforeDelete.value).toBe(800); // Just acc1 (1000 - 200)

    // Step 2: Simulate account deletion by changing the accounts list
    currentAccounts = [...accountsAfterDeletion];

    // Step 3: Re-render the dashboard (simulating what happens after a storage update)
    // Remove the old container to force a fresh render
    document.body.removeChild(container);
    statCards = [];

    render();

    // Step 4: Verify the filter has been normalized to 'all'
    selectEl = container.querySelectorAll('select')[0];

    // The selector should show 'all' because acc1 no longer exists
    expect(selectEl.value).toBe('all');

    // Session storage should have been updated to 'all' during initialization
    expect(global.sessionStorage.getItem('dashboard_filter')).toBe('all');

    // The balance should now show all accounts. Since mockTransactions still contains
    // all transactions (including deleted account's transactions for historical purposes),
    // the total available is still 1000 + 500 - 200 = 1300
    const statsAfterDelete = statCards.find(
      c => c.label.includes('Filtered') || c.label.includes('Available')
    );
    expect(statsAfterDelete.label).toBe('Total Available');
    expect(statsAfterDelete.value).toBe(1300);
  });
});
