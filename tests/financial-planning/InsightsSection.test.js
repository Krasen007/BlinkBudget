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
  createNetBalanceChart: vi.fn(async () => ({
    element: document.createElement('div'),
    cleanup: vi.fn(),
  })),
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

  it('renders the chart cards and month drill-down cards without the duplicate summary bar', () => {
    const { element, cleanup } = InsightsSection(
      { transactions: buildTransactions() },
      createChartRenderer(),
      new Map()
    );

    expect(element.querySelector('.insights-summary-grid')).toBeNull();
    expect(element.querySelectorAll('.insights-stat-card').length).toBe(0);
    expect(element.querySelector('.expense-donut-card')).toBeNull();
    expect(
      element.querySelector('.trend-bar-card .insights-chart-area')
    ).not.toBeNull();
    expect(
      element.querySelector('.timeline-yoy-card .timeline-subtitle')
    ).not.toBeNull();
    expect(element.querySelector('.insights-top-movers')).not.toBeNull();
    expect(element.querySelector('.insights-takeaways')).not.toBeNull();
    expect(element.querySelector('.insights-recurring')).not.toBeNull();
    expect(
      element.querySelectorAll('.insights-takeaways-list .insight-card').length
    ).toBeGreaterThan(0);
    expect(
      element.querySelectorAll('.insights-takeaways-list .insight-card').length
    ).toBeLessThanOrEqual(3);

    cleanup();
  });

  it('defaults every period control to the current month', () => {
    const { element, cleanup } = InsightsSection(
      { transactions: buildTransactions() },
      createChartRenderer(),
      new Map()
    );

    expect(
      element.querySelector('.trend-bar-card .insights-select').value
    ).toBe('month');
    expect(
      element.querySelector('.timeline-yoy-card .insights-select').value
    ).toBe('month');

    cleanup();
  });

  it('syncs the month-based charts when navigating months', () => {
    const { element, cleanup } = InsightsSection(
      { transactions: buildTransactions() },
      createChartRenderer(),
      new Map()
    );

    const prevBtn = element.querySelector(
      '.timeline-yoy-card .insights-nav-btn'
    );
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

  it('logs a rejected NetBalanceChart loading failure without crashing the section', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const createNetBalanceChartMock = vi.mocked(
      (await import('../../src/components/NetBalanceChart.js'))
        .createNetBalanceChart
    );
    createNetBalanceChartMock.mockRejectedValueOnce(
      new Error('chart exploded')
    );

    const { cleanup } = InsightsSection(
      { transactions: buildTransactions() },
      createChartRenderer(),
      new Map()
    );

    await vi.waitFor(() => {
      expect(log).toHaveBeenCalledWith(
        '[InsightsSection] Net Balance chart failed to load:',
        expect.any(Error)
      );
    });

    cleanup();
  });
});
