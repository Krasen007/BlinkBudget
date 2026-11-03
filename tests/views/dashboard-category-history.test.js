// tests/views/dashboard-category-history.test.js
// Drilling into a category from Reports → Explore Categories opens the
// dashboard filtered to that category. The dashboard must show how that
// category moved over recent months, directly above the transaction list, and
// a month tap must re-filter the list to that month.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DashboardView } from '../../src/views/DashboardView.js';

const mockTransactions = [
  {
    id: 'mar',
    amount: 10,
    category: 'Coffee',
    type: 'expense',
    accountId: 'acc-1',
    timestamp: '2026-03-10T09:00:00.000Z',
  },
  {
    id: 'may',
    amount: 20,
    category: 'Coffee',
    type: 'expense',
    accountId: 'acc-1',
    timestamp: '2026-05-10T09:00:00.000Z',
  },
  {
    id: 'jun',
    amount: 30,
    category: 'Coffee',
    type: 'expense',
    accountId: 'acc-1',
    timestamp: '2026-06-10T09:00:00.000Z',
  },
  {
    id: 'food',
    amount: 15,
    category: 'Food',
    type: 'expense',
    accountId: 'acc-1',
    timestamp: '2026-06-11T09:00:00.000Z',
  },
];

const accounts = [
  { id: 'acc-1', name: 'Main Checking', type: 'checking', isDefault: true },
];

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
  DashboardStatsCard: () => document.createElement('div'),
}));

vi.mock('../../src/core/Account/account-service.js', () => ({
  AccountService: {
    getAccounts: () => accounts,
    getDefaultAccount: () => accounts[0],
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

describe('DashboardView category history', () => {
  let container;

  beforeEach(() => {
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
    container = null;
    vi.clearAllMocks();
  });

  const drillInto = category => {
    dashboardFilter = {
      category,
      source: 'reports',
      timePeriod: {
        type: 'monthly',
        startDate: '2026-06-01T00:00:00.000Z',
        endDate: '2026-06-30T23:59:59.999Z',
        label: 'June 2026',
      },
    };
    container = DashboardView();
    document.body.appendChild(container);
  };

  const card = () => container.querySelector('.category-history-card');
  const list = () => container.querySelector('.dashboard-transactions-list');

  it('renders the category history directly above the transaction list', () => {
    drillInto('Coffee');

    expect(card()).not.toBeNull();
    expect(card().nextElementSibling.contains(list())).toBe(true);
  });

  it('shows a bar per month of that category, ending on the viewed month', () => {
    drillInto('Coffee');

    const bars = [...card().querySelectorAll('.category-history-bar')];
    expect(bars.map(bar => bar.dataset.month)).toEqual([
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
    ]);
    // The viewed month (June) is the active filter
    expect(
      card()
        .querySelector('[data-month="2026-06"]')
        .getAttribute('aria-pressed')
    ).toBe('true');
  });

  it('re-filters the list to the tapped month', () => {
    drillInto('Coffee');

    card().querySelector('[data-month="2026-05"]').click();

    expect(sessionStorage.getItem('dashboard_month_filter')).toBe(
      '2026-05-01T00:00:00.000Z'
    );
    const rows = container.querySelectorAll('.dashboard-transactions-list li');
    expect(rows).toHaveLength(1);
    expect(
      card()
        .querySelector('[data-month="2026-05"]')
        .getAttribute('aria-pressed')
    ).toBe('true');
  });

  it('does not render the strip without a category drill', () => {
    container = DashboardView();
    document.body.appendChild(container);

    expect(card()).toBeNull();
  });

  it('does not render the strip for a category with no history', () => {
    drillInto('Travel');

    expect(card()).toBeNull();
  });
});
