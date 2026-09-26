import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Regression suite for the "approximate data" banner (#4.1 in
 * todo/ai-slop-report.md).
 *
 * This lives in its own file on purpose. `tests/views/reports-view.test.js`
 * mocks `reports-utils.js` wholesale — including `createMinimalAnalyticsData`,
 * which is the exact producer under test — so a test there could never fail for
 * the right reason. Here the real `createMinimalAnalyticsData` runs and the
 * analytics engine is made to throw, which is the only path that sets
 * `isFallback`.
 *
 * Before the fix, `createMinimalAnalyticsData` set `isMinimal` while the banner
 * read `isFallback`, so this test fails with the banner absent from the DOM.
 */

const throwingEngine = {
  generateSpendingInsights: vi.fn(() => {
    throw new Error('analytics engine exploded');
  }),
  calculateCategoryBreakdown: vi.fn(() => ({ categories: [] })),
  calculateIncomeVsExpenses: vi.fn(() => ({
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0,
  })),
  calculateCostOfLiving: vi.fn(() => ({})),
  analyzeFrequencyPatterns: vi.fn(() => ({ categories: [] })),
  predictFutureSpending: vi.fn(() => ({ hasEnoughData: false })),
};

vi.mock('../../src/core/analytics/AnalyticsInstance.js', () => ({
  getAnalyticsEngine: () => throwingEngine,
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
  TimePeriodSelector: vi.fn(() => {
    const el = document.createElement('div');
    el.className = 'time-period-selector';
    el.setPeriod = vi.fn();
    el.cleanup = vi.fn();
    return el;
  }),
}));

vi.mock('../../src/core/transaction-service.js', () => ({
  TransactionService: {
    // A transaction inside the current period, so the fallback payload is
    // non-empty and the view proceeds to render rather than showing empty state.
    getAll: vi.fn(() => [
      {
        id: 'tx-1',
        amount: 25,
        type: 'expense',
        category: 'Food',
        accountId: 'acc-1',
        timestamp: new Date().toISOString(),
      },
    ]),
    get: vi.fn(),
  },
}));

vi.mock('../../src/core/Account/account-service.js', () => ({
  AccountService: { getAccounts: vi.fn(() => []) },
}));

vi.mock('../../src/core/router.js', () => ({
  Router: { navigate: vi.fn() },
}));

vi.mock('../../src/core/navigation-state.js', () => ({
  NavigationState: {
    restoreTimePeriod: vi.fn(() => null),
    restoreReportsCategoryFilter: vi.fn(() => null),
    clearReportsCategoryFilter: vi.fn(),
    saveTimePeriod: vi.fn(),
  },
}));

vi.mock('../../src/utils/touch-utils.js', () => ({ debounce: fn => fn }));

vi.mock('../../src/utils/navigation-helper.js', () => ({
  createNavigationButtons: () => document.createElement('div'),
}));

vi.mock('../../src/core/analytics/AnomalyService.js', () => ({
  AnomalyService: {
    detectUnusualTransactions: vi.fn(() => []),
    detectAnomalies: vi.fn(() => []),
  },
}));

vi.mock('../../src/components/ui/ActionCard.js', () => ({
  UnusualSpendingCard: () => document.createElement('div'),
}));

// `createMinimalAnalyticsData` is deliberately NOT mocked — it is the producer
// whose flag this suite verifies end to end.
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
  };
});

vi.mock('../../src/utils/reports-ui.js', () => ({
  createLoadingState: () => {
    const el = document.createElement('div');
    el.className = 'loading-state';
    return el;
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
  // Real values, so the banner's styling is asserted against real tokens.
  WARNING_TINT: 'color-mix(in srgb, var(--color-warning) 10%, transparent)',
  WARNING_BORDER: 'color-mix(in srgb, var(--color-warning) 30%, transparent)',
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
    getBudgetsStatus: vi.fn(() => []),
  },
}));

import { ReportsView } from '../../src/views/ReportsView.js';
import { analyticsCache } from '../../src/core/analytics/AnalyticsCache.js';

describe('ReportsView approximate-data fallback', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
    // A cached payload would short-circuit loadReportData before the fallback.
    analyticsCache.clearCache();
  });

  afterEach(() => {
    analyticsCache.clearCache();
  });

  it('warns the user when the analytics engine fails and minimal data is used', async () => {
    const view = ReportsView();
    document.body.appendChild(view);

    // Let the async load pipeline settle.
    for (let i = 0; i < 12; i++) {
      await Promise.resolve();
    }

    const warning = view.querySelector('.fallback-warning');

    expect(warning).not.toBeNull();
    expect(warning.textContent).toContain('simplified calculations');
    // The fallback path was genuinely taken, not merely rendered.
    expect(throwingEngine.generateSpendingInsights).toHaveBeenCalled();
  });

  it('does not warn when the analytics engine succeeds', async () => {
    // Both calls in the pipeline must succeed for this to be a real
    // "engine worked" case rather than a second accidental fallback.
    throwingEngine.generateSpendingInsights.mockImplementation(() => []);

    const view = ReportsView();
    document.body.appendChild(view);

    for (let i = 0; i < 12; i++) {
      await Promise.resolve();
    }

    expect(view.querySelector('.fallback-warning')).toBeNull();
  });
});
