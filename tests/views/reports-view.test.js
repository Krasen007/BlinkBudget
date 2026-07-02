import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

const mockTransactions = [
  {
    id: 'tx-1',
    amount: 25,
    type: 'expense',
    category: 'Food',
    accountId: 'acc-1',
    timestamp: '2026-06-01T10:00:00.000Z',
    note: 'Lunch',
  },
];

const mockAnalyticsEngine = {
  generateSpendingInsights: vi.fn(() => ({})),
  calculateCategoryBreakdown: vi.fn(() => ({ categories: [] })),
  calculateIncomeVsExpenses: vi.fn(() => ({ income: 0, expenses: 0, net: 0 })),
  calculateCostOfLiving: vi.fn(() => ({})),
  analyzeFrequencyPatterns: vi.fn(() => ({ categories: [] })),
  predictFutureSpending: vi.fn(() => ({ hasEnoughData: false })),
};

vi.mock('../../src/core/analytics/AnalyticsInstance.js', () => ({
  getAnalyticsEngine: () => mockAnalyticsEngine,
}));

vi.mock('../../src/components/ChartRenderer.js', () => ({
  ChartRenderer: class ChartRendererMock {
    destroy() {}
    resize() {}
  },
}));

vi.mock('../../src/core/chart-loader.js', () => ({
  preloadChartJS: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../src/components/TimePeriodSelector.js', () => ({
  TimePeriodSelector: () => {
    const el = document.createElement('div');
    el.className = 'time-period-selector';
    el.updatePeriod = vi.fn();
    el.setPeriod = vi.fn();
    el.cleanup = vi.fn();
    return el;
  },
}));

vi.mock('../../src/core/transaction-service.js', () => ({
  TransactionService: {
    getAll: vi.fn(() => mockTransactions),
    get: vi.fn(),
  },
}));

vi.mock('../../src/core/Account/account-service.js', () => ({
  AccountService: {
    getAccounts: vi.fn(() => []),
  },
}));

vi.mock('../../src/core/router.js', () => ({
  Router: {
    navigate: vi.fn(),
  },
}));

vi.mock('../../src/core/navigation-state.js', () => ({
  NavigationState: {
    restoreTimePeriod: vi.fn(() => null),
    restoreReportsCategoryFilter: vi.fn(() => null),
    clearReportsCategoryFilter: vi.fn(),
  },
}));

vi.mock('../../src/utils/touch-utils.js', () => ({
  debounce: fn => fn,
}));

vi.mock('../../src/utils/navigation-helper.js', () => ({
  createNavigationButtons: () => document.createElement('div'),
}));

vi.mock('../../src/core/unusual-spending-detector.js', () => ({
  UnusualSpendingDetector: {
    detect: vi.fn(() => []),
  },
}));

vi.mock('../../src/components/ui/ActionCard.js', () => ({
  UnusualSpendingCard: () => document.createElement('div'),
}));

vi.mock('../../src/utils/reports-utils.js', async () => {
  const actual = await vi.importActual('../../src/utils/reports-utils.js');

  return {
    ...actual,
    checkBrowserSupport: () => ({
      isSupported: true,
      hasLimitedSupport: false,
      missingFeatures: [],
      limitedFeatures: [],
    }),
    validateAnalyticsData: () => ({ isValid: true }),
    sanitizeAnalyticsData: data => data,
    formatTimePeriod: () => 'Test Period',
    createMinimalAnalyticsData: () => ({ transactions: [], timePeriod: null }),
  };
});

vi.mock('../../src/utils/reports-ui.js', () => ({
  createLoadingState: () => {
    const el = document.createElement('div');
    el.className = 'loading-state';
    return el;
  },
  createEmptyState: () => {
    const el = document.createElement('div');
    el.className = 'empty-state';
    return el;
  },
  showEmptyState: state => {
    state.style.display = 'none';
  },
  createErrorState: () => {
    const el = document.createElement('div');
    el.className = 'error-state';
    return el;
  },
  showErrorState: state => {
    state.style.display = 'flex';
  },
  showUnsupportedBrowserError: () => {},
  showBrowserWarning: () => {},
  showPerformanceWarning: () => {},
  showChartRenderingWarning: () => {},
}));

vi.mock('../../src/utils/reports-charts.js', () => ({
  createCategoryBreakdownChart: vi.fn(async () => ({
    section: document.createElement('div'),
    chart: null,
  })),
  createIncomeExpenseChart: vi.fn(async () => ({
    section: document.createElement('div'),
    chart: null,
  })),
  getCategoryColors: vi.fn(),
}));

vi.mock('../../src/components/CategorySelector.js', () => ({
  CategorySelector: () => document.createElement('div'),
}));

vi.mock('../../src/components/BudgetInsightsSection.js', () => ({
  InsightsSection: () => document.createElement('div'),
}));

vi.mock('../../src/components/BudgetSummaryCard.js', () => ({
  BudgetSummaryCard: () => document.createElement('div'),
}));

vi.mock('../../src/core/budget-planner.js', () => ({
  BudgetPlanner: {
    getSummary: vi.fn(() => ({ totalBudgets: 0 })),
  },
}));

import { ReportsView } from '../../src/views/ReportsView.js';

describe('ReportsView skeleton loading', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
    vi.useFakeTimers();

    Object.defineProperty(window, 'requestIdleCallback', {
      writable: true,
      value: vi.fn(callback => callback()),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('replaces previous skeleton DOM during incremental refreshes', async () => {
    const view = ReportsView();
    document.body.appendChild(view);

    await Promise.resolve();
    await Promise.resolve();
    vi.advanceTimersByTime(500);
    await Promise.resolve();
    await Promise.resolve();

    const chartContainer = view.querySelector('.reports-chart-container');
    expect(chartContainer).not.toBeNull();
    expect(chartContainer.querySelectorAll('.skeleton-loader').length).toBe(5);

    view.dispatchEvent(
      new CustomEvent('storage-updated', {
        detail: { key: 'blinkbudget_transactions' },
      })
    );

    vi.advanceTimersByTime(500);
    await Promise.resolve();
    await Promise.resolve();

    expect(chartContainer.querySelectorAll('.skeleton-loader').length).toBe(5);
  });
});
