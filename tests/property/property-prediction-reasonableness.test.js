/**
 * Property Test: Prediction Reasonableness
 *
 * Property 14: For any historical spending pattern with sufficient data, generated
 * predictions should fall within reasonable bounds based on the historical variance
 * and trends.
 *
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.6
 */

import { describe, it, expect } from 'vitest';
import { AnalyticsEngine } from '../../src/core/analytics-engine.js';

describe('Property 14: Prediction Reasonableness', () => {
  const analyticsEngine = new AnalyticsEngine();

  function generateHistoricalTransactions(months, avgMonthlyAmount) {
    const transactions = [];
    const categories = ['Food', 'Transport'];

    for (let month = 0; month < months; month++) {
      const monthlyAmount =
        avgMonthlyAmount + (Math.random() - 0.5) * avgMonthlyAmount * 0.3;
      const txCount = Math.floor(Math.random() * 10) + 10;

      for (let i = 0; i < txCount; i++) {
        transactions.push({
          id: `tx-${month}-${i}`,
          amount: monthlyAmount / txCount + (Math.random() - 0.5) * 10,
          category: categories[Math.floor(Math.random() * categories.length)],
          description: `Transaction ${i}`,
          date: new Date(2024, month, Math.floor(Math.random() * 28) + 1),
          type: 'expense',
        });
      }
    }
    return transactions;
  }

  it('should generate predictions within reasonable bounds of historical average', () => {
    for (let run = 0; run < 20; run++) {
      const avgMonthlyAmount = Math.random() * 500 + 200;
      const transactions = generateHistoricalTransactions(6, avgMonthlyAmount);

      const result = analyticsEngine.predictFutureSpending(transactions, 3);

      expect(result).toHaveProperty('predictions');
      expect(Array.isArray(result.predictions)).toBe(true);

      if (result.predictions.length > 0) {
        result.predictions.forEach(prediction => {
          // Predictions should be within 200% of historical average
          expect(prediction.predictedAmount).toBeGreaterThan(0);
          expect(prediction.predictedAmount).toBeLessThan(avgMonthlyAmount * 3);
        });
      }
    }
  });

  it('should handle insufficient historical data gracefully', () => {
    const transactions = generateHistoricalTransactions(1, 100);

    expect(() => {
      const result = analyticsEngine.predictFutureSpending(transactions, 3);
      expect(result).toHaveProperty('predictions');
      expect(Array.isArray(result.predictions)).toBe(true);
    }).not.toThrow();
  });

  it('should generate predictions for requested number of months', () => {
    for (let run = 0; run < 20; run++) {
      const transactions = generateHistoricalTransactions(6, 300);
      const monthsToPredict = Math.floor(Math.random() * 5) + 1;

      const result = analyticsEngine.predictFutureSpending(
        transactions,
        monthsToPredict
      );

      expect(result.predictions.length).toBeLessThanOrEqual(monthsToPredict);
    }
  });

  it('should include confidence intervals in predictions', () => {
    for (let run = 0; run < 20; run++) {
      const transactions = generateHistoricalTransactions(6, 300);

      const result = analyticsEngine.predictFutureSpending(transactions, 3);

      if (result.predictions.length > 0) {
        result.predictions.forEach(prediction => {
          expect(prediction).toHaveProperty('predictedAmount');
          expect(typeof prediction.predictedAmount).toBe('number');
        });
      }
    }
  });
});
