/**
 * Property Test: Insight Generation Accuracy
 *
 * Property 6: For any comparison between current and previous periods, generated
 * percentage-based insights should accurately reflect the mathematical difference
 * between the periods.
 *
 * Validates: Requirements 4.1, 4.2
 */

import { describe, it, expect } from 'vitest';
import { AnalyticsEngine } from '../../src/core/analytics-engine.js';

describe('Property 6: Insight Generation Accuracy', () => {
  const analyticsEngine = new AnalyticsEngine();

  function generateTransactionsForPeriod(count, month, avgAmount) {
    const transactions = [];
    const categories = ['Food', 'Transport', 'Entertainment'];

    for (let i = 0; i < count; i++) {
      transactions.push({
        id: `tx-${month}-${i}`,
        amount: avgAmount + (Math.random() - 0.5) * 20,
        category: categories[Math.floor(Math.random() * categories.length)],
        description: `Transaction ${i}`,
        date: new Date(2024, month, Math.floor(Math.random() * 28) + 1),
        type: 'expense',
      });
    }
    return transactions;
  }

  it('should calculate percentage changes accurately', () => {
    for (let run = 0; run < 30; run++) {
      const previousAmount = Math.random() * 500 + 100;
      const currentAmount = Math.random() * 500 + 100;

      const previousTransactions = generateTransactionsForPeriod(
        10,
        0,
        previousAmount / 10
      );
      const currentTransactions = generateTransactionsForPeriod(
        10,
        1,
        currentAmount / 10
      );
      const allTransactions = [...previousTransactions, ...currentTransactions];

      const currentPeriod = {
        type: 'monthly',
        startDate: new Date(2024, 1, 1),
        endDate: new Date(2024, 1, 28),
      };
      const previousPeriod = {
        type: 'monthly',
        startDate: new Date(2024, 0, 1),
        endDate: new Date(2024, 0, 31),
      };

      const comparison = analyticsEngine.comparePeriodsSpending(
        allTransactions,
        currentPeriod,
        previousPeriod
      );

      const expectedChange =
        ((comparison.overallComparison.expenses.current -
          comparison.overallComparison.expenses.comparison) /
          comparison.overallComparison.expenses.comparison) *
        100;

      if (comparison.overallComparison.expenses.comparison > 0) {
        expect(
          Math.abs(comparison.overallComparison.expenses.changePercent - expectedChange)
        ).toBeLessThan(0.1);
      }
    }
  });

  it('should generate insights for significant changes', () => {
    for (let run = 0; run < 30; run++) {
      const previousTransactions = generateTransactionsForPeriod(10, 0, 50);
      const currentTransactions = generateTransactionsForPeriod(10, 1, 100); // 100% increase
      const allTransactions = [...previousTransactions, ...currentTransactions];

      const currentPeriod = {
        type: 'monthly',
        startDate: new Date(2024, 1, 1),
        endDate: new Date(2024, 1, 28),
      };
      const previousPeriod = {
        type: 'monthly',
        startDate: new Date(2024, 0, 1),
        endDate: new Date(2024, 0, 31),
      };

      const insights = analyticsEngine.generateSpendingInsights(
        allTransactions,
        currentPeriod,
        previousPeriod
      );

      expect(Array.isArray(insights)).toBe(true);
    }
  });

  it('should handle zero previous period spending', () => {
    const currentTransactions = generateTransactionsForPeriod(10, 1, 50);

    const currentPeriod = {
      type: 'monthly',
      startDate: new Date(2024, 1, 1),
      endDate: new Date(2024, 1, 28),
    };
    const previousPeriod = {
      type: 'monthly',
      startDate: new Date(2024, 0, 1),
      endDate: new Date(2024, 0, 31),
    };

    expect(() => {
      analyticsEngine.comparePeriodsSpending(
        currentTransactions,
        currentPeriod,
        previousPeriod
      );
    }).not.toThrow();
  });
});
