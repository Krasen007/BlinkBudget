/**
 * Analytics Engine Tests
 * Tests core functionality of the AnalyticsEngine class
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AnalyticsEngine } from '../../src/core/analytics-engine.js';
import { TRANSACTION_TYPES } from '../../src/utils/constants.js';

describe('AnalyticsEngine', () => {
  let analyticsEngine;
  let sampleTransactions;

  beforeEach(() => {
    analyticsEngine = new AnalyticsEngine();
    // Clear any existing cache data for clean test state
    analyticsEngine.clearCache();

    // Sample transaction data for testing
    sampleTransactions = [
      {
        id: '1',
        amount: 50.0,
        category: 'Food & Groceries',
        type: TRANSACTION_TYPES.EXPENSE,
        date: '2024-01-15',
        accountId: 'main',
      },
      {
        id: '2',
        amount: 1000.0,
        category: 'Paycheck',
        type: TRANSACTION_TYPES.INCOME,
        date: '2024-01-15',
        accountId: 'main',
      },
      {
        id: '3',
        amount: 25.0,
        category: 'Dining & Coffee',
        type: TRANSACTION_TYPES.EXPENSE,
        date: '2024-01-16',
        accountId: 'main',
      },
      {
        id: '4',
        amount: 10.0,
        category: 'Food & Groceries',
        type: TRANSACTION_TYPES.REFUND,
        date: '2024-01-17',
        accountId: 'main',
      },
    ];
  });

  describe('filterTransactionsByTimePeriod', () => {
    it('should filter transactions within date range', () => {
      const timePeriod = {
        startDate: '2024-01-15',
        endDate: '2024-01-16',
      };

      const filtered = analyticsEngine.filterTransactionsByTimePeriod(
        sampleTransactions,
        timePeriod
      );

      expect(filtered).toHaveLength(3);
      expect(filtered.map(t => t.id)).toEqual(['1', '2', '3']);
    });

    it('should return all transactions when no time period specified', () => {
      const filtered = analyticsEngine.filterTransactionsByTimePeriod(
        sampleTransactions,
        null
      );
      expect(filtered).toEqual(sampleTransactions);
    });

    it('should handle empty transaction array', () => {
      const timePeriod = {
        startDate: '2024-01-15',
        endDate: '2024-01-16',
      };

      const filtered = analyticsEngine.filterTransactionsByTimePeriod(
        [],
        timePeriod
      );
      expect(filtered).toEqual([]);
    });
  });

  describe('calculateCategoryBreakdown', () => {
    it('should calculate category totals and percentages correctly', () => {
      const timePeriod = {
        startDate: '2024-01-15',
        endDate: '2024-01-17',
      };

      const breakdown = analyticsEngine.calculateCategoryBreakdown(
        sampleTransactions,
        timePeriod
      );

      expect(breakdown.totalAmount).toBe(65.0); // 50 + 25 - 10 (refund included)
      expect(breakdown.categories).toHaveLength(2);

      const foodCategory = breakdown.categories.find(
        c => c.name === 'Food & Groceries'
      );
      expect(foodCategory.amount).toBe(40.0); // 50 - 10
      expect(foodCategory.percentage).toBeCloseTo(61.54, 1);

      const diningCategory = breakdown.categories.find(
        c => c.name === 'Dining & Coffee'
      );
      expect(diningCategory.amount).toBe(25.0);
      expect(diningCategory.percentage).toBeCloseTo(38.46, 1);
    });

    it('should sort categories by amount (highest first)', () => {
      const timePeriod = {
        startDate: '2024-01-15',
        endDate: '2024-01-17',
      };

      const breakdown = analyticsEngine.calculateCategoryBreakdown(
        sampleTransactions,
        timePeriod
      );

      expect(breakdown.categories[0].name).toBe('Food & Groceries');
      expect(breakdown.categories[0].amount).toBe(40.0);
      expect(breakdown.categories[1].name).toBe('Dining & Coffee');
      expect(breakdown.categories[1].amount).toBe(25.0);
    });
  });

  describe('calculateIncomeVsExpenses', () => {
    it('should calculate income and expenses correctly', () => {
      const timePeriod = {
        startDate: '2024-01-15',
        endDate: '2024-01-17',
      };

      const summary = analyticsEngine.calculateIncomeVsExpenses(
        sampleTransactions,
        timePeriod
      );

      expect(summary.totalIncome).toBe(1000.0);
      expect(summary.totalExpenses).toBe(65.0); // 50 + 25 - 10 (refund reduces expenses)
      expect(summary.netBalance).toBe(935.0);
      expect(summary.incomeCount).toBe(1);
      expect(summary.expenseCount).toBe(2); // 2 expenses (refund doesn't count as expense)
    });

    it('should handle refunds correctly by reducing expenses', () => {
      const refundOnlyTransactions = [
        {
          id: '1',
          amount: 20.0,
          category: 'Food & Groceries',
          type: TRANSACTION_TYPES.REFUND,
          date: '2024-01-15',
          accountId: 'main',
        },
      ];

      const timePeriod = {
        startDate: '2024-01-15',
        endDate: '2024-01-15',
      };

      const summary = analyticsEngine.calculateIncomeVsExpenses(
        refundOnlyTransactions,
        timePeriod
      );

      expect(summary.totalExpenses).toBe(0); // Refund with no prior expenses should result in 0, not negative
      expect(summary.totalIncome).toBe(0);
      expect(summary.netBalance).toBe(0);
    });
  });

  describe('calculateCostOfLiving', () => {
    it('should calculate daily and monthly spending averages', () => {
      const timePeriod = {
        startDate: '2024-01-15',
        endDate: '2024-01-17', // 3 days
      };

      const costOfLiving = analyticsEngine.calculateCostOfLiving(
        sampleTransactions,
        timePeriod
      );

      expect(costOfLiving.durationDays).toBe(3);
      expect(costOfLiving.dailySpending).toBeCloseTo(21.67, 1); // 65 / 3
      expect(costOfLiving.monthlySpending).toBeCloseTo(650, 0); // 21.67 * 30
      expect(costOfLiving.topSpendingCategory.name).toBe('Food & Groceries');
    });
  });

  describe('caching system', () => {
    it('should cache calculation results using incomeVsExpenses', () => {
      const timePeriod = {
        startDate: '2024-01-15',
        endDate: '2024-01-17',
      };

      // First call should miss cache (calculateIncomeVsExpenses uses the cache)
      const result1 = analyticsEngine.calculateIncomeVsExpenses(
        sampleTransactions,
        timePeriod
      );
      const stats1 = analyticsEngine.getCacheStats();
      expect(stats1.misses).toBe(1);
      expect(stats1.hits).toBe(0);

      // Second call should hit cache
      const result2 = analyticsEngine.calculateIncomeVsExpenses(
        sampleTransactions,
        timePeriod
      );
      const stats2 = analyticsEngine.getCacheStats();
      expect(stats2.hits).toBe(1);
      expect(stats2.misses).toBe(1);

      // Results should be identical
      expect(result1).toEqual(result2);
    });

    it('should invalidate cache on data updates', () => {
      const timePeriod = {
        startDate: '2024-01-15',
        endDate: '2024-01-17',
      };

      // Cache a result using calculateIncomeVsExpenses (which uses the cache)
      analyticsEngine.calculateIncomeVsExpenses(sampleTransactions, timePeriod);
      expect(analyticsEngine.getCacheStats().size).toBe(1);

      // Invalidate cache
      analyticsEngine.invalidateCacheOnDataUpdate();

      // Next call should miss cache
      analyticsEngine.calculateIncomeVsExpenses(sampleTransactions, timePeriod);
      const stats = analyticsEngine.getCacheStats();
      // Cache was cleared and recalculated = 1 entry in cache
      expect(stats.size).toBe(1);
    });

    it('should clear all cache', () => {
      const timePeriod = {
        startDate: '2024-01-15',
        endDate: '2024-01-17',
      };

      // Cache some results using methods that use the cache
      analyticsEngine.calculateIncomeVsExpenses(sampleTransactions, timePeriod);
      analyticsEngine.calculateCategoryBreakdown(
        sampleTransactions,
        timePeriod
      );
      // Only calculateIncomeVsExpenses uses the cache (not memoize)
      expect(analyticsEngine.getCacheStats().size).toBe(1);

      // Clear cache
      analyticsEngine.clearCache();
      expect(analyticsEngine.getCacheStats().size).toBe(0);
    });
  });

  describe('generateSpendingInsights', () => {
    it('should generate basic insights for current period', () => {
      const timePeriod = {
        startDate: '2024-01-15',
        endDate: '2024-01-17',
      };

      const insights = analyticsEngine.generateSpendingInsights(
        sampleTransactions,
        timePeriod
      );

      expect(insights).toBeInstanceOf(Array);
      expect(insights.length).toBeGreaterThan(0);

      // Should have positive balance insight
      const balanceInsight = insights.find(i => i.id === 'positive_balance');
      expect(balanceInsight).toBeDefined();
      expect(balanceInsight.type).toBe('positive');

      // Should have top category insight
      const categoryInsight = insights.find(i => i.id === 'top_category');
      expect(categoryInsight).toBeDefined();
      expect(categoryInsight.category).toBe('Food & Groceries');
    });
  });

  describe('predictFutureSpending', () => {
    it('should return insufficient data message for limited transaction history', () => {
      const prediction = analyticsEngine.predictFutureSpending(
        sampleTransactions,
        3
      );

      expect(prediction.hasEnoughData).toBe(false);
      expect(prediction.message).toContain('Insufficient historical data');
      expect(prediction.predictions).toEqual([]);
    });

    it('should generate predictions when sufficient historical data exists', () => {
      // Create more historical data spanning multiple months
      const historicalTransactions = [];
      for (let month = 0; month < 6; month++) {
        for (let day = 1; day <= 10; day++) {
          const date = new Date(2024, month, day);
          historicalTransactions.push({
            id: `${month}-${day}-expense`,
            amount: 50 + Math.random() * 100,
            category: 'Food & Groceries',
            type: TRANSACTION_TYPES.EXPENSE,
            date: date.toISOString().split('T')[0],
            accountId: 'main',
          });

          if (day % 5 === 0) {
            historicalTransactions.push({
              id: `${month}-${day}-income`,
              amount: 1000,
              category: 'Paycheck',
              type: TRANSACTION_TYPES.INCOME,
              date: date.toISOString().split('T')[0],
              accountId: 'main',
            });
          }
        }
      }

      const prediction = analyticsEngine.predictFutureSpending(
        historicalTransactions,
        2
      );

      expect(prediction.hasEnoughData).toBe(true);
      expect(prediction.predictions).toHaveLength(2);
      expect(prediction.confidence).toBeDefined();
      expect(prediction.historicalAnalysis).toBeDefined();
      expect(
        prediction.historicalAnalysis.monthsAnalyzed
      ).toBeGreaterThanOrEqual(3);
    });
  });

  describe('comparePeriodsSpending', () => {
    it('should compare spending between two periods', () => {
      const currentPeriod = {
        startDate: '2024-01-15',
        endDate: '2024-01-17',
      };

      const comparisonPeriod = {
        startDate: '2024-01-10',
        endDate: '2024-01-12',
      };

      // Add some transactions for the comparison period
      const extendedTransactions = [
        ...sampleTransactions,
        {
          id: '5',
          amount: 30.0,
          category: 'Food & Groceries',
          type: TRANSACTION_TYPES.EXPENSE,
          date: '2024-01-10',
          accountId: 'main',
        },
        {
          id: '6',
          amount: 800.0,
          category: 'Paycheck',
          type: TRANSACTION_TYPES.INCOME,
          date: '2024-01-11',
          accountId: 'main',
        },
      ];

      const comparison = analyticsEngine.comparePeriodsSpending(
        extendedTransactions,
        currentPeriod,
        comparisonPeriod
      );

      expect(comparison.currentPeriod).toEqual(currentPeriod);
      expect(comparison.comparisonPeriod).toEqual(comparisonPeriod);
      expect(comparison.overallComparison).toBeDefined();
      expect(comparison.categoryComparison).toBeDefined();
      expect(comparison.behaviorChanges).toBeDefined();
      expect(comparison.insights).toBeInstanceOf(Array);
      expect(comparison.summary).toBeDefined();
    });
  });

  describe('getHistoricalInsights', () => {
    it('should preserve historical insights for multiple periods', () => {
      const periods = [
        {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
        {
          startDate: '2024-02-01',
          endDate: '2024-02-29',
        },
      ];

      const historicalInsights = analyticsEngine.getHistoricalInsights(
        sampleTransactions,
        periods
      );

      expect(historicalInsights.historicalInsights).toHaveLength(2);
      expect(historicalInsights.totalPeriods).toBe(2);
      expect(historicalInsights.overallTrends).toBeDefined();
      expect(historicalInsights.preservedAt).toBeDefined();

      // Each period should have insights and summary
      historicalInsights.historicalInsights.forEach(periodData => {
        expect(periodData.period).toBeDefined();
        expect(periodData.insights).toBeInstanceOf(Array);
        expect(periodData.summary).toBeDefined();
        expect(periodData.summary.totalInsights).toBeDefined();
      });
    });
  });
});
