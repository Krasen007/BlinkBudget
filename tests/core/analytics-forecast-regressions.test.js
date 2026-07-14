import { describe, expect, it, vi } from 'vitest';

import { ForecastEngine } from '../../src/core/forecast-engine.js';
import { AnomalyService } from '../../src/core/analytics/AnomalyService.js';
import { MetricsService } from '../../src/core/analytics/MetricsService.js';
import { TrendService } from '../../src/core/analytics/TrendService.js';
import { CustomCategoryService } from '../../src/core/custom-category-service.js';

describe('analytics and forecast regressions', () => {
  it('uses calendar month gaps when fitting category inflation', () => {
    const service = new TrendService();
    const transactions = [
      {
        type: 'expense',
        category: 'Groceries',
        amount: 10,
        timestamp: '2024-01-01T00:00:00.000Z',
      },
      {
        type: 'expense',
        category: 'Groceries',
        amount: 20,
        timestamp: '2024-03-01T00:00:00.000Z',
      },
      {
        type: 'expense',
        category: 'Groceries',
        amount: 30,
        timestamp: '2024-05-01T00:00:00.000Z',
      },
    ];

    const inflation = service.calculateCategoryInflation(
      transactions,
      'Groceries',
      12,
      'average',
      new Date('2024-05-15T00:00:00.000Z')
    );

    expect(inflation).toBeGreaterThan(0);
  });

  it('clamps negative-baseline trend forecasts in the downward direction', () => {
    const engine = new ForecastEngine();
    vi.spyOn(engine, '_weightedBaseline').mockReturnValue(-100);
    vi.spyOn(engine, '_calculateTrend').mockReturnValue(-1000);
    vi.spyOn(engine, 'detectSeasonalPatterns').mockReturnValue({
      expense: Array(12).fill(1),
      income: Array(12).fill(1),
    });

    const transactions = [
      { type: 'expense', amount: 90, timestamp: '2024-01-01T00:00:00.000Z' },
      { type: 'expense', amount: 100, timestamp: '2024-02-01T00:00:00.000Z' },
      { type: 'expense', amount: 110, timestamp: '2024-03-01T00:00:00.000Z' },
    ];

    const forecasts = engine.generateExpenseForecasts(transactions, 1);

    expect(forecasts[0].trend).toBeCloseTo(-10, 6);
  });

  it('ranks top categories by net spending amount instead of custom order', () => {
    vi.spyOn(CustomCategoryService, 'getAll').mockReturnValue([
      { name: 'Utilities', type: 'expense', sortOrder: 0 },
      { name: 'Groceries', type: 'expense', sortOrder: 1 },
    ]);

    const timePeriod = {
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    };

    const transactions = [
      {
        type: 'expense',
        category: 'Utilities',
        amount: 40,
        timestamp: '2024-01-10T00:00:00.000Z',
      },
      {
        type: 'expense',
        category: 'Groceries',
        amount: 80,
        timestamp: '2024-01-15T00:00:00.000Z',
      },
    ];

    const costOfLiving = MetricsService.calculateCostOfLiving(
      transactions,
      timePeriod
    );
    const topCategories = MetricsService.identifyTopCategories(
      transactions,
      timePeriod,
      2
    );

    expect(costOfLiving.topSpendingCategory?.name).toBe('Groceries');
    expect(topCategories.topCategories[0].name).toBe('Groceries');
  });

  it('uses refund-adjusted category totals for spike percentage messaging', () => {
    const expenseTransactions = [
      { type: 'expense', category: 'Food', amount: 100, timestamp: '2024-01-01T00:00:00.000Z' },
      { type: 'expense', category: 'Food', amount: 100, timestamp: '2024-01-02T00:00:00.000Z' },
      { type: 'expense', category: 'Food', amount: 100, timestamp: '2024-01-03T00:00:00.000Z' },
      { type: 'expense', category: 'Food', amount: 100, timestamp: '2024-01-04T00:00:00.000Z' },
      { type: 'expense', category: 'Food', amount: 1500, timestamp: '2024-01-05T00:00:00.000Z' },
    ];
    const allTransactions = [
      ...expenseTransactions,
      { type: 'refund', category: 'Food', amount: 500, timestamp: '2024-01-06T00:00:00.000Z' },
    ];

    const insights = AnomalyService.detectSpendingSpikes(
      expenseTransactions,
      allTransactions
    );

    expect(insights[0].message).toContain('71.4%');
  });
});
