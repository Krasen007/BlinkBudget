import { afterEach, describe, expect, it, vi } from 'vitest';
import { InflationTrends } from '../../src/components/InflationTrends.js';

vi.mock('../../src/core/analytics/TrendService.js', () => ({
  trendService: {
    calculateCategoryInflation: vi.fn(() => ({
      slope: 0,
      months: ['2026-01', '2026-02'],
      medians: [100, 100],
    })),
  },
}));

vi.mock('../../src/core/insights-generator.js', () => ({
  InsightsGenerator: {
    topMovers: vi.fn(() => [{ category: 'Groceries', total: 250 }]),
  },
}));

describe('InflationTrends chart construction failure (C05)', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('shows its visible error UI when chart construction rejects', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const data = { transactions: [] };
    const component = InflationTrends(
      data,
      { createLineChart: vi.fn().mockRejectedValue(new Error('boom')) },
      new Map()
    );
    document.body.append(component.element);

    await component.render();

    expect(
      component.element.querySelector('.inflation-message-error')
    ).not.toBeNull();
    expect(component.element.textContent).toContain(
      'Failed to load inflation data'
    );
  });
});
