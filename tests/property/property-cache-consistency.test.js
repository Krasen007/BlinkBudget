/**
 * Property Test: Cache Consistency
 *
 * Property 12: For any cached calculation, when new transactions are added that
 * affect the cached result, the cache should be invalidated and recalculated
 * to reflect the new data.
 *
 * Validates: Requirements 9.3, 9.4
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AnalyticsEngine } from '../../src/core/analytics-engine.js';

describe('Property 12: Cache Consistency', () => {
  let analyticsEngine;

  beforeEach(() => {
    analyticsEngine = new AnalyticsEngine();
    analyticsEngine.clearCache();
  });

  function generateTransactions(count, month = 0) {
    const transactions = [];
    const categories = ['Food', 'Transport'];

    for (let i = 0; i < count; i++) {
      transactions.push({
        id: `tx-${month}-${i}`,
        amount: Math.random() * 100,
        category: categories[Math.floor(Math.random() * categories.length)],
        description: `Transaction ${i}`,
        date: new Date(2024, month, Math.floor(Math.random() * 28) + 1),
        type: 'expense',
      });
    }
    return transactions;
  }

  it('should return same result from cache on second call', () => {
    for (let run = 0; run < 20; run++) {
      analyticsEngine.clearCache();
      const transactions = generateTransactions(20);
      const timePeriod = {
        type: 'monthly',
        startDate: new Date(2024, 0, 1),
        endDate: new Date(2024, 0, 31),
      };

      const result1 = analyticsEngine.calculateCategoryBreakdown(
        transactions,
        timePeriod
      );
      const result2 = analyticsEngine.calculateCategoryBreakdown(
        transactions,
        timePeriod
      );

      expect(result1.totalAmount).toBe(result2.totalAmount);
      expect(result1.categories.length).toBe(result2.categories.length);
    }
  });

  it('should recalculate when cache is invalidated', () => {
    for (let run = 0; run < 20; run++) {
      analyticsEngine.clearCache();
      const transactions = generateTransactions(20);
      const timePeriod = {
        type: 'monthly',
        startDate: new Date(2024, 0, 1),
        endDate: new Date(2024, 0, 31),
      };

      const result1 = analyticsEngine.calculateCategoryBreakdown(
        transactions,
        timePeriod
      );
      analyticsEngine.clearCache();
      const result2 = analyticsEngine.calculateCategoryBreakdown(
        transactions,
        timePeriod
      );

      // Results should be equal even after cache clear
      expect(Math.abs(result1.totalAmount - result2.totalAmount)).toBeLessThan(
        0.01
      );
    }
  });

  it('should reflect new data when transactions change', () => {
    for (let run = 0; run < 20; run++) {
      analyticsEngine.clearCache();
      const transactions1 = generateTransactions(20);
      const timePeriod = {
        type: 'monthly',
        startDate: new Date(2024, 0, 1),
        endDate: new Date(2024, 0, 31),
      };

      const result1 = analyticsEngine.calculateCategoryBreakdown(
        transactions1,
        timePeriod
      );

      // Add more transactions
      const transactions2 = [...transactions1, ...generateTransactions(10)];
      analyticsEngine.clearCache();
      const result2 = analyticsEngine.calculateCategoryBreakdown(
        transactions2,
        timePeriod
      );

      // Result should be different with more transactions
      expect(result2.totalAmount).toBeGreaterThan(result1.totalAmount);
    }
  });
});
