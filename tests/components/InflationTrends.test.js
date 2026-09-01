import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InflationTrends } from '../../src/components/InflationTrends.js';
import { trendService } from '../../src/core/analytics/TrendService.js';

describe('InflationTrends Component', () => {
  let mockChartRenderer;
  let activeCharts;

  beforeEach(() => {
    mockChartRenderer = {
      createLineChart: vi.fn().mockResolvedValue({ destroy: vi.fn() }),
      destroyChart: vi.fn(),
    };
    activeCharts = new Map();
  });

  it('renders card with title and zero toggles', () => {
    const data = {
      transactions: [],
    };

    const component = InflationTrends(data, mockChartRenderer, activeCharts);

    expect(component.element).toBeDefined();
    expect(component.element.classList.contains('inflation-trends')).toBe(true);

    const title = component.element.querySelector('.inflation-title');
    expect(title).not.toBeNull();
    expect(title.textContent).toBe('Personal Inflation Trends');

    // Asserts zero toggles are rendered
    expect(component.element.querySelector('.inflation-controls')).toBeNull();
    expect(component.element.querySelector('.chart-type-selector')).toBeNull();
    expect(component.element.querySelector('.calc-method-selector')).toBeNull();
    expect(component.element.querySelector('.period-selector')).toBeNull();

    component.cleanup();
  });

  it('renders line chart using 6-month median data when sufficient transactions exist', async () => {
    const categoryInflationSpy = vi.spyOn(
      trendService,
      'calculateCategoryInflation'
    );
    // NOTE: The UI-level personal inflation summary that called
    // trendService.calculatePersonalInflation was removed in the "ui fixes"
    // cleanup. Personal inflation is now computed per-category inside
    // prepareChartData (via calculateCategoryInflation) and shown in the
    // dataset labels as "X% personal inflation", so there is no
    // calculatePersonalInflation collaborator to assert here.

    const transactions = [];
    const now = new Date();

    for (let month = 0; month < 6; month++) {
      const date = new Date(now.getFullYear(), now.getMonth() - 6 + month, 1);
      for (let i = 0; i < 6; i++) {
        transactions.push({
          id: `tx-${month}-${i}`,
          amount: 50 + month * 5,
          category: 'Groceries',
          type: 'expense',
          timestamp: date.toISOString(),
        });
      }
    }

    const data = { transactions };
    const component = InflationTrends(data, mockChartRenderer, activeCharts);

    await component.render();

    expect(mockChartRenderer.createLineChart).toHaveBeenCalled();
    const [, chartData] = mockChartRenderer.createLineChart.mock.calls[0];

    // Assert final renderer input uses fill: false
    expect(chartData.datasets[0].fill).toBe(false);

    // Assert collaborator was called requesting 6-month period and median calculation method
    expect(categoryInflationSpy).toHaveBeenCalledWith(
      expect.anything(),
      'Groceries',
      6,
      'median',
      expect.any(Date)
    );

    // Assert 6 months of data labels are present
    expect(chartData.labels).toHaveLength(6);

    component.cleanup();
  });
});
