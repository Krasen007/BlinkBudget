import { afterEach, describe, expect, it, vi } from 'vitest';
import { createNetBalanceChart } from '../../src/components/NetBalanceChart.js';
import { InsightsSection } from '../../src/views/financial-planning/InsightsSection.js';
import { ChartRenderer } from '../../src/components/ChartRenderer.js';

vi.mock('../../src/core/insights-generator.js', () => ({
  InsightsGenerator: {
    topMovers: vi.fn(() => [{ category: 'Groceries', total: 250 }]),
  },
}));

vi.mock('../../src/core/transaction-service.js', () => ({
  TransactionService: {
    getAll: vi.fn(() => [
      {
        id: 'tx-1',
        amount: 100,
        type: 'expense',
        category: 'Groceries',
        timestamp: new Date(2026, 0, 15).toISOString(),
      },
    ]),
  },
}));

describe('Visible fallbacks when chart construction fails (C05)', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('NetBalanceChart shows a fallback instead of a blank chart area', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(ChartRenderer.prototype, 'createLineChart').mockRejectedValue(
      new Error('Constructor exploded')
    );

    const section = await createNetBalanceChart();

    expect(section.querySelector('.chart-fallback')).not.toBeNull();
    expect(section.textContent).toContain('Unable to render net balance chart');
    expect(section.querySelector('canvas')).toBeNull();
  });

  it('InsightsSection shows a fallback instead of an empty chart container', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(ChartRenderer.prototype, 'createLineChart').mockResolvedValue(
      null
    );
    vi.spyOn(ChartRenderer.prototype, 'createBarChart').mockRejectedValue(
      new Error('Constructor exploded')
    );

    const now = new Date();
    const { element, cleanup } = InsightsSection(
      {
        transactions: [
          {
            id: 'tx-1',
            amount: 250,
            category: 'Groceries',
            type: 'expense',
            timestamp: new Date(
              now.getFullYear(),
              now.getMonth() - 1,
              5
            ).toISOString(),
          },
        ],
      },
      new ChartRenderer(),
      new Map(),
      null
    );
    document.body.append(element);

    await new Promise(resolve => setTimeout(resolve, 0));

    expect(element.querySelector('.chart-fallback')).not.toBeNull();
    expect(element.querySelector('.top-movers-chart canvas')).toBeNull();
    expect(log).toHaveBeenCalled();
    cleanup();
  });
});
