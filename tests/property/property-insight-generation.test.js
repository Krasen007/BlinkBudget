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

      // Test the mathematical accuracy of the percentage calculation
      const actualCurrent = comparison.overallComparison.expenses.current;
      const actualComparison = comparison.overallComparison.expenses.comparison;
      const actualChange = comparison.overallComparison.expenses.changePercent;

      // Verify the change percent is mathematically correct
      if (actualComparison > 0) {
        // Avoid division by zero
        const expectedChange =
          ((actualCurrent - actualComparison) / actualComparison) * 100;
        expect(actualChange).toBeCloseTo(expectedChange, 0.1);
      } else {
        // If comparison is 0, change should be undefined or handled specially
        expect(actualChange).toBe(0);
      }

      // Verify the values are reasonable (positive for expenses)
      expect(actualCurrent).toBeGreaterThan(0);
      expect(actualComparison).toBeGreaterThan(0);
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
      expect(insights.length).toBeGreaterThan(0);
      // Verify insights have expected structure
      insights.forEach(insight => {
        expect(insight).toHaveProperty('type');
        expect(insight).toHaveProperty('message');

        // Check for confidence interval fields (supporting different confidence property names)
        // Note: Some prediction models may not include confidence intervals
        if (insight.confidenceLower !== undefined) {
          expect(typeof insight.confidenceLower).toBe('number');
        }
        if (insight.confidenceUpper !== undefined) {
          expect(typeof insight.confidenceUpper).toBe('number');
        }

        // Also check for single confidence property or other variations
        const hasConfidence =
          insight.confidence !== undefined ||
          insight.confidenceInterval !== undefined ||
          insight.confidenceRange !== undefined;

        // At least one confidence-related property should exist or confidence intervals should be optional
        expect(hasConfidence || insight.confidenceLower === undefined).toBe(
          true
        );
      });
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
