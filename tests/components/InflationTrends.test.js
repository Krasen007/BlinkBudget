import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InflationTrends } from '../../src/components/InflationTrends.js';

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
    const transactions = [];
    const now = new Date();
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const baseDate = new Date(endOfPreviousMonth);
    baseDate.setMonth(endOfPreviousMonth.getMonth() - 5);

    for (let month = 0; month < 6; month++) {
      for (let i = 0; i < 6; i++) {
        const date = new Date(baseDate);
        date.setMonth(baseDate.getMonth() + month);
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

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(mockChartRenderer.createLineChart).toHaveBeenCalled();
    component.cleanup();
  });
});
