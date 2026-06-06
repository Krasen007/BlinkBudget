import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DashboardView } from '../../src/views/DashboardView.js';

let transactionListProps = null;
const mockTransactions = [
  {
    id: '1',
    amount: 10,
    category: 'Food',
    tags: ['Work'],
    timestamp: '2026-06-07T00:00:00.000Z',
  },
  {
    id: '2',
    amount: 20,
    category: 'Leisure',
    tags: ['Personal'],
    timestamp: '2026-06-07T00:00:00.000Z',
  },
  {
    id: '3',
    amount: 30,
    category: 'Bill',
    timestamp: '2026-06-07T00:00:00.000Z',
  },
];

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

vi.mock('../../src/components/TransactionList.js', () => ({
  TransactionList: props => {
    transactionListProps = props;
    return document.createElement('div');
  },
}));

vi.mock('../../src/core/Account/account-service.js', () => ({
  AccountService: {
    getAccounts: () => [],
    getDefaultAccount: () => ({ id: 'main', name: 'Main Account' }),
  },
}));

vi.mock('../../src/core/transaction-service.js', () => ({
  TransactionService: {
    getAll: () => mockTransactions,
  },
}));

vi.mock('../../src/core/custom-category-service.js', () => ({
  CustomCategoryService: {
    getCheckboxCategories: () => [
      { name: 'Work', color: '#123456' },
      { name: 'Personal', color: '#654321' },
    ],
  },
}));

vi.mock('../../src/core/auth-service.js', () => ({
  AuthService: {
    user: null,
    getUserId: () => 'user-1',
  },
}));

vi.mock('../../src/core/router.js', () => ({
  Router: {
    navigate: vi.fn(),
  },
}));

vi.mock('../../src/core/navigation-state.js', () => ({
  NavigationState: {
    restoreDashboardFilter: () => null,
    restoreDashboardTypeFilter: () => null,
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

vi.stubGlobal('dispatchEvent', vi.fn());

describe('DashboardView Tag Filtering 3-state logic', () => {
  beforeEach(() => {
    const store = {};
    const mockSessionStorage = {
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
    global.sessionStorage = mockSessionStorage;

    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };

    transactionListProps = null;
    vi.clearAllMocks();
  });

  it('toggles tag filter states on click: none -> include -> exclude -> none', () => {
    // 1. Initial render, no tag filter
    DashboardView();
    expect(transactionListProps.currentTagFilter).toBeNull();
    expect(transactionListProps.transactions).toHaveLength(3);

    // 2. First click on 'Work': should include 'Work'
    transactionListProps.onTagClick('Work');
    expect(transactionListProps.currentTagFilter).toBe('Work');
    expect(transactionListProps.transactions).toHaveLength(1);
    expect(transactionListProps.transactions[0].id).toBe('1');

    // 3. Second click on 'Work': should exclude 'Work'
    transactionListProps.onTagClick('Work');
    expect(transactionListProps.currentTagFilter).toBe('exclude:Work');
    // Transactions 2 and 3 do not have the 'Work' tag, so they should remain
    expect(transactionListProps.transactions).toHaveLength(2);
    expect(transactionListProps.transactions.map(t => t.id)).toEqual([
      '2',
      '3',
    ]);

    // 4. Third click on 'Work': should clear filter
    transactionListProps.onTagClick('Work');
    expect(transactionListProps.currentTagFilter).toBeNull();
    expect(transactionListProps.transactions).toHaveLength(3);
  });
});
