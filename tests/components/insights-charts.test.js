import { describe, it, expect, vi } from 'vitest';
import {
  calculateSummaryMetrics,
  filterTransactionsByPeriod,
  formatMetricNumber,
  InsightsSummaryBar,
} from '../../src/components/financial-planning/InsightsSummaryBar.js';
import {
  aggregateCategoryExpenses,
  ExpenseDonutCard,
} from '../../src/components/financial-planning/ExpenseDonutCard.js';
import {
  aggregateTrendData,
  TrendBarChartCard,
} from '../../src/components/financial-planning/TrendBarChartCard.js';
import {
  calculateYoYCumulative,
  calculateMonthlyComparison,
  TimelineYoYCard,
} from '../../src/components/financial-planning/TimelineYoYCard.js';
import {
  INSIGHTS_CHART_COLORS,
  createInsightsScales,
  formatChartCurrency,
} from '../../src/components/financial-planning/insights-chart-theme.js';

describe('Insights Charts Components', () => {
  const mockTransactions = [
    {
      id: 'tx-1',
      amount: 1191.13,
      category: 'Кредит',
      type: 'expense',
      timestamp: '2026-03-15T10:00:00.000Z',
    },
    {
      id: 'tx-2',
      amount: 1168.05,
      category: 'Храна',
      type: 'expense',
      timestamp: '2026-04-10T10:00:00.000Z',
    },
    {
      id: 'tx-3',
      amount: 1090.31,
      category: 'Други',
      type: 'expense',
      timestamp: '2026-05-20T10:00:00.000Z',
    },
    {
      id: 'tx-4',
      amount: 417.99,
      category: 'Подаръци',
      type: 'expense',
      timestamp: '2026-06-01T10:00:00.000Z',
    },
    {
      id: 'tx-5',
      amount: 207.23,
      category: 'Заведения',
      type: 'expense',
      timestamp: '2026-07-04T10:00:00.000Z',
    },
    {
      id: 'tx-6',
      amount: 642.16,
      category: 'Сметки',
      type: 'expense',
      timestamp: '2026-08-11T10:00:00.000Z',
    },
    {
      id: 'tx-7',
      amount: 5566.87,
      category: 'Заплата',
      type: 'income',
      timestamp: '2026-01-25T10:00:00.000Z',
    },
    {
      id: 'tx-8',
      amount: 3500.0,
      category: 'Храна',
      type: 'expense',
      timestamp: '2025-05-15T10:00:00.000Z',
    },
    {
      id: 'tx-9',
      amount: 4000.0,
      category: 'Заплата',
      type: 'income',
      timestamp: '2025-01-15T10:00:00.000Z',
    },
  ];

  describe('formatMetricNumber', () => {
    it('formats numbers with comma thousands and 2 decimal places', () => {
      expect(formatMetricNumber(1976.81)).toBe('1,976.81');
      expect(formatMetricNumber(0)).toBe('0.00');
      expect(formatMetricNumber(-4716.87)).toBe('4,716.87');
    });
  });

  describe('Summary Metrics & Filtering', () => {
    it('calculates net worth, income, and expenses accurately', () => {
      const stats = calculateSummaryMetrics(mockTransactions, 'this-year');
      expect(stats.income).toBe(5566.87);
      expect(stats.expense).toBeCloseTo(4716.87, 2);
      expect(stats.netWorth).toBeCloseTo(9566.87 - (4716.87 + 3500.0), 2);
    });

    it('filters transactions by period', () => {
      const all = filterTransactionsByPeriod(mockTransactions, 'all-time');
      expect(all.length).toBe(9);

      const lastYear = filterTransactionsByPeriod(
        mockTransactions,
        'last-year'
      );
      // If current year is 2026, last year is 2025
      expect(
        lastYear.every(
          t =>
            new Date(t.timestamp).getFullYear() === new Date().getFullYear() - 1
        )
      ).toBe(true);
    });

    it('creates InsightsSummaryBar DOM element with expected labels', () => {
      const bar = InsightsSummaryBar({ transactions: mockTransactions });
      expect(
        bar.element.querySelector('.insights-stat-label').textContent
      ).toBe('NET WORTH');
      expect(bar.element.textContent).toContain('Income');
      expect(bar.element.textContent).toContain('Expense');
      expect(bar.element.querySelectorAll('.insights-stat-card').length).toBe(
        3
      );
    });

    it('defaults the KPI bar to the current month', () => {
      const currentMonthTx = [
        {
          id: 'tx-now',
          amount: 50,
          type: 'expense',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'tx-old',
          amount: 500,
          type: 'expense',
          timestamp: '2024-01-05T10:00:00.000Z',
        },
      ];

      const bar = InsightsSummaryBar({ transactions: currentMonthTx });
      // Only the transaction from the current month is counted as an expense
      expect(bar.element.querySelector('.value-expense').textContent).toBe(
        '- 50.00'
      );
    });
  });

  describe('Insights chart theme', () => {
    it('uses canvas-safe colors (no CSS variables) and currency axis formatting', () => {
      Object.values(INSIGHTS_CHART_COLORS).forEach(color => {
        expect(color).not.toContain('var(');
      });

      expect(formatChartCurrency(1500)).toBe('€1,500');

      const scales = createInsightsScales();
      expect(scales.y.beginAtZero).toBe(true);
      expect(scales.y.ticks.maxTicksLimit).toBe(5);
      expect(scales.y.ticks.callback(1200)).toBe('€1,200');
    });
  });

  describe('Expense Donut Card', () => {
    it('aggregates expenses by category sorted descending', () => {
      const thisYearTx = mockTransactions.filter(
        t => new Date(t.timestamp).getFullYear() === 2026
      );
      const categories = aggregateCategoryExpenses(thisYearTx);

      expect(categories[0].name).toBe('Кредит');
      expect(categories[0].amount).toBe(1191.13);
      expect(categories[1].name).toBe('Храна');
      expect(categories[1].amount).toBe(1168.05);
      expect(categories[2].name).toBe('Други');
      expect(categories[2].amount).toBe(1090.31);
      expect(categories[0].color).toBeDefined();
    });

    it('renders category rows and handles SEE ALL toggle', () => {
      const mockRenderer = {
        createDoughnutChart: vi.fn().mockResolvedValue({}),
        destroyChart: vi.fn(),
      };

      const card = ExpenseDonutCard({
        transactions: mockTransactions,
        chartRenderer: mockRenderer,
        initialPeriod: 'all-time',
      });

      expect(
        card.element.querySelector('.insights-card-title').textContent
      ).toBe('EXPENSE');
      expect(card.element.querySelector('.donut-center-amount')).not.toBeNull();

      // Check rows rendered
      const rows = card.element.querySelectorAll('.expense-tag-row');
      expect(rows.length).toBe(5); // Default PAGE_SIZE is 5

      const toggleBtn = card.element.querySelector('.see-all-btn');
      expect(toggleBtn).not.toBeNull();
      expect(toggleBtn.textContent).toContain('SEE ALL');

      // Click SEE ALL
      toggleBtn.click();
      const expandedRows = card.element.querySelectorAll('.expense-tag-row');
      expect(expandedRows.length).toBeGreaterThan(5);
      expect(card.element.querySelector('.see-all-btn').textContent).toContain(
        'SHOW LESS'
      );

      card.cleanup();
    });
  });

  describe('Trend Bar Chart Card', () => {
    it('aggregates trend data by year with diverging income, expense, and net line', () => {
      const { labels, income, expense, net } = aggregateTrendData(
        mockTransactions,
        'year'
      );

      expect(labels).toContain('2025');
      expect(labels).toContain('2026');

      const idx2026 = labels.indexOf('2026');
      expect(income[idx2026]).toBe(5566.87);
      expect(expense[idx2026]).toBeCloseTo(4716.87, 2);
      expect(net[idx2026]).toBeCloseTo(5566.87 - 4716.87, 2);
    });

    it('renders TrendBarChartCard with title and grain selector', () => {
      const mockRenderer = {
        createMixedChart: vi.fn().mockResolvedValue({}),
        destroyChart: vi.fn(),
      };

      const card = TrendBarChartCard({
        transactions: mockTransactions,
        chartRenderer: mockRenderer,
      });

      expect(card.element.textContent).toContain('ТЕНДЕНЦИЯ');
      expect(card.element.textContent).toContain('Income');
      expect(card.element.textContent).toContain('Expense');
      expect(card.element.querySelector('select')).not.toBeNull();

      card.cleanup();
    });

    it('defaults the trend grain to the current month', () => {
      const mockRenderer = {
        createMixedChart: vi.fn().mockResolvedValue({}),
        destroyChart: vi.fn(),
      };

      const card = TrendBarChartCard({
        transactions: mockTransactions,
        chartRenderer: mockRenderer,
      });

      expect(card.element.querySelector('.insights-select').value).toBe(
        'month'
      );

      // Month grain keeps the x axis readable: at most 12 buckets
      const { labels } = aggregateTrendData(mockTransactions, 'month');
      expect(labels.length).toBeLessThanOrEqual(12);

      card.cleanup();
    });

    it('stacks income and expenses in the same centered column per period', () => {
      const mockRenderer = {
        createMixedChart: vi.fn().mockResolvedValue({}),
        destroyChart: vi.fn(),
      };

      const transactions = [
        {
          id: 'tx-income',
          amount: 1000,
          category: 'Заплата',
          type: 'income',
          timestamp: '2026-03-15T10:00:00.000Z',
        },
        {
          id: 'tx-expense',
          amount: 400,
          category: 'Храна',
          type: 'expense',
          timestamp: '2026-03-16T10:00:00.000Z',
        },
      ];

      const card = TrendBarChartCard({
        transactions,
        chartRenderer: mockRenderer,
      });

      const [, chartData, chartOptions] =
        mockRenderer.createMixedChart.mock.calls[0];
      const incomeDataset = chartData.datasets.find(d => d.label === 'Income');
      const expenseDataset = chartData.datasets.find(d => d.label === 'Expense');

      // Both bar datasets share one stack so Chart.js draws a single centered
      // column per period: income up from zero, expenses down from zero.
      expect(incomeDataset.stack).toBe('trend');
      expect(expenseDataset.stack).toBe('trend');
      expect(expenseDataset.data[0]).toBe(-400);
      expect(chartOptions.scales.x.stacked).toBe(true);
      expect(chartOptions.scales.y.stacked).toBe(true);

      card.cleanup();
    });
  });

  describe('Timeline YoY Card', () => {
    it('calculates cumulative month-by-month expenses comparing years', () => {
      const { targetYear, priorYear, priorCumulative, currentCumulative } =
        calculateYoYCumulative(mockTransactions, 2026);

      expect(targetYear).toBe(2026);
      expect(priorYear).toBe(2025);
      expect(priorCumulative.length).toBe(12);
      expect(currentCumulative.length).toBe(12);

      // Prior year cumulative should increase monotonically
      expect(priorCumulative[11]).toBeGreaterThanOrEqual(priorCumulative[0]);
    });

    it('calculates cumulative day-by-day expenses for a month vs the month before', () => {
      const june = new Date(2026, 5, 1); // June 2026
      const {
        labels,
        targetLabel,
        priorLabel,
        targetCumulative,
        priorCumulative,
        hasData,
      } = calculateMonthlyComparison(mockTransactions, june);

      expect(labels.length).toBe(new Date(2026, 6, 0).getDate()); // June = 30 days
      expect(targetLabel).toBe('Jun 2026');
      expect(priorLabel).toBe('May 2026');
      expect(hasData).toBe(true);

      // June's only expense lands on its own day and carries to month end
      const juneTx = mockTransactions.find(t => t.id === 'tx-4');
      const juneDay = new Date(juneTx.timestamp).getDate() - 1;
      expect(targetCumulative[juneDay]).toBe(417.99);
      expect(targetCumulative[targetCumulative.length - 1]).toBe(417.99);

      // May's expense shows up in the aligned previous-month series
      const mayTx = mockTransactions.find(t => t.id === 'tx-3');
      const mayDay = new Date(mayTx.timestamp).getDate() - 1;
      expect(priorCumulative[mayDay]).toBe(1090.31);
    });

    it('pads the previous month series when it is shorter than the target month', () => {
      const march = new Date(2026, 2, 1); // March 2026 (31 days) vs Feb (28 days)
      const { labels, priorCumulative } = calculateMonthlyComparison(
        mockTransactions,
        march
      );

      expect(labels.length).toBe(31);
      expect(priorCumulative.length).toBe(31);
      expect(priorCumulative[labels.length - 1]).toBeNull();
    });

    it('renders TimelineYoYCard on the current month with a MONTH-by-default selector', () => {
      const mockRenderer = {
        createLineChart: vi.fn().mockResolvedValue({}),
        destroyChart: vi.fn(),
      };

      const card = TimelineYoYCard({
        transactions: mockTransactions,
        chartRenderer: mockRenderer,
      });

      expect(
        card.element.querySelector('.insights-card-title').textContent
      ).toBe('TIMELINE');
      expect(card.element.querySelector('.insights-select').value).toBe(
        'month'
      );
      expect(
        card.element.querySelector('.timeline-subtitle').textContent
      ).toContain('vs');

      card.cleanup();
    });

    it('switches to the year comparison for the YEAR grain', () => {
      const mockRenderer = {
        createLineChart: vi.fn().mockResolvedValue({}),
        destroyChart: vi.fn(),
      };

      const card = TimelineYoYCard({
        transactions: mockTransactions,
        chartRenderer: mockRenderer,
      });

      const select = card.element.querySelector('.insights-select');
      select.value = 'year';
      select.dispatchEvent(new Event('change'));

      const subtitle = card.element.querySelector('.timeline-subtitle');
      const currentYear = new Date().getFullYear();
      expect(subtitle.textContent).toContain(String(currentYear));
      expect(subtitle.textContent).toContain(String(currentYear - 1));

      card.cleanup();
    });

    it('steps the shared month state backwards and never into the future', () => {
      const mockRenderer = {
        createLineChart: vi.fn().mockResolvedValue({}),
        destroyChart: vi.fn(),
      };
      const sharedMonthState = { offset: 0, onNavigate: vi.fn() };

      const card = TimelineYoYCard({
        transactions: mockTransactions,
        chartRenderer: mockRenderer,
        sharedMonthState,
      });

      const navButtons = card.element.querySelectorAll('.insights-nav-btn');
      expect(navButtons.length).toBe(2);
      const [prevBtn, nextBtn] = navButtons;

      // Next is disabled while the current month is displayed
      expect(nextBtn.disabled).toBe(true);

      prevBtn.click();
      expect(sharedMonthState.offset).toBe(-1);
      expect(sharedMonthState.onNavigate).toHaveBeenCalled();

      card.cleanup();
    });
  });
});
