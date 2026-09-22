/**
 * Insights Section Tests
 *
 * Verifies the Financial Insights section wires the chart cards together and
 * renders them with the shared BlinkBudget card styling.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { InsightsSection } from '../../src/views/financial-planning/InsightsSection.js';

// NetBalanceChart reads persisted transactions, which are not available in the
// jsdom test environment — substitute it with a stub element.
vi.mock('../../src/components/NetBalanceChart.js', () => ({
  createNetBalanceChart: vi.fn(async () => document.createElement('div')),
}));

const now = new Date();

const dateInMonth = (monthOffset, day) =>
  new Date(now.getFullYear(), now.getMonth() + monthOffset, day, 12);

/**
 * Transactions covering this month, last month and last year.
 * @returns {Array}
 */
const buildTransactions = () => [
  {
    id: 'tx-1',
    amount: 120.5,
    category: 'Храна',
    type: 'expense',
    timestamp: dateInMonth(0, 4).toISOString(),
  },
  {
    id: 'tx-2',
    amount: 40,
    category: 'Заведения',
    type: 'expense',
    timestamp: dateInMonth(0, 6).toISOString(),
  },
  {
    id: 'tx-3',
    amount: 900,
    category: 'Заплата',
    type: 'income',
    timestamp: dateInMonth(0, 2).toISOString(),
  },
  {
    id: 'tx-4',
    amount: 300,
    category: 'Кредит',
    type: 'expense',
    timestamp: dateInMonth(-1, 8).toISOString(),
  },
  {
    id: 'tx-5',
    amount: 250,
    category: 'Други',
    type: 'expense',
    timestamp: dateInMonth(-13, 3).toISOString(),
  },
];

const createChartRenderer = () => ({
  createDoughnutChart: vi.fn().mockResolvedValue({}),
  createMixedChart: vi.fn().mockResolvedValue({}),
  createLineChart: vi.fn().mockResolvedValue({}),
  createBarChart: vi.fn().mockResolvedValue({}),
  destroyChart: vi.fn(),
});

describe('InsightsSection', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the KPI bar, chart cards and month drill-down cards', () => {
    const { element, cleanup } = InsightsSection(
      { transactions: buildTransactions() },
      createChartRenderer(),
      new Map()
    );

    expect(element.querySelector('.insights-summary-grid')).not.toBeNull();
    expect(element.querySelectorAll('.insights-stat-card').length).toBe(3);
    expect(
      element.querySelector('.expense-donut-card .donut-wrapper')
    ).not.toBeNull();
    expect(
      element.querySelector('.trend-bar-card .insights-chart-area')
    ).not.toBeNull();
    expect(
      element.querySelector('.timeline-yoy-card .timeline-subtitle')
    ).not.toBeNull();
    expect(element.querySelector('.insights-top-movers')).not.toBeNull();

    cleanup();
  });

  it('defaults every period control to the current month', () => {
    const { element, cleanup } = InsightsSection(
      { transactions: buildTransactions() },
      createChartRenderer(),
      new Map()
    );

    expect(
      element.querySelector('.expense-donut-card .insights-select').value
    ).toBe('this-month');
    expect(
      element.querySelector('.trend-bar-card .insights-select').value
    ).toBe('month');
    expect(
      element.querySelector('.timeline-yoy-card .insights-select').value
    ).toBe('month');

    // KPI bar counts only the current month expenses
    expect(
      element.querySelector('.insights-stat-value.value-expense').textContent
    ).toBe('- 160.50');

    cleanup();
  });

  it('syncs the month-based charts when navigating months', () => {
    const { element, cleanup } = InsightsSection(
      { transactions: buildTransactions() },
      createChartRenderer(),
      new Map()
    );

    const prevBtn = element.querySelector('.timeline-yoy-card .insights-nav-btn');
    prevBtn.click();

    const previousMonthLabel = dateInMonth(-1, 1).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });

    expect(
      element.querySelector('.timeline-yoy-card .timeline-subtitle').textContent
    ).toContain(previousMonthLabel);

    cleanup();
  });
});
