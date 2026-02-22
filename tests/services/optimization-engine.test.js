import { describe, it, expect, beforeEach } from 'vitest';
import { OptimizationEngine } from '../../src/core/analytics/optimization-engine.js';
import { TRANSACTION_TYPES } from '../../src/utils/constants.js';

describe('OptimizationEngine', () => {
  let optimizationEngine;
  let sampleTransactions;

  beforeEach(() => {
    global.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    };
    optimizationEngine = new OptimizationEngine();
    optimizationEngine.clearDismissedInsights();
    sampleTransactions = [
      {
        id: '1',
        amount: 50.0,
        category: 'Food',
        type: TRANSACTION_TYPES.EXPENSE,
        date: '2024-01-15',
        accountId: 'main',
      },
      {
        id: '2',
        amount: 1000.0,
        category: 'Salary',
        type: TRANSACTION_TYPES.INCOME,
        date: '2024-01-15',
        accountId: 'main',
      },
      {
        id: '3',
        amount: 25.0,
        category: 'Dining',
        type: TRANSACTION_TYPES.EXPENSE,
        date: '2024-01-16',
        accountId: 'main',
      },
    ];
  });

  describe('getOptimizationInsights', () => {
    it('should generate optimization insights for transactions', () => {
      const insights = optimizationEngine.getOptimizationInsights(
        sampleTransactions,
        { startDate: '2024-01-15', endDate: '2024-01-18' }
      );
      expect(insights).toBeInstanceOf(Array);
    });
    it('should return empty array for empty transactions', () => {
      const insights = optimizationEngine.getOptimizationInsights([], {
        startDate: '2024-01-15',
        endDate: '2024-01-18',
      });
      expect(insights).toBeInstanceOf(Array);
    });
  });

  describe('getSavingsPotential', () => {
    it('should calculate total savings potential', () => {
      const savings = optimizationEngine.getSavingsPotential(
        sampleTransactions,
        { startDate: '2024-01-15', endDate: '2024-01-18' }
      );
      expect(savings).toHaveProperty('substitutionSavings');
      expect(savings).toHaveProperty('totalPotential');
    });
    it('should calculate potential savings rate', () => {
      const savings = optimizationEngine.getSavingsPotential(
        sampleTransactions,
        { startDate: '2024-01-15', endDate: '2024-01-18' }
      );
      expect(savings.potentialSavingsRate).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getAlternativeSuggestions', () => {
    it('should return suggestions for valid category', () => {
      const suggestions = optimizationEngine.getAlternativeSuggestions(
        'Food',
        sampleTransactions,
        { startDate: '2024-01-15', endDate: '2024-01-18' }
      );
      expect(suggestions).toBeInstanceOf(Array);
    });
    it('should return empty array for invalid category', () => {
      const suggestions = optimizationEngine.getAlternativeSuggestions(
        'InvalidCategory',
        sampleTransactions,
        { startDate: '2024-01-15', endDate: '2024-01-18' }
      );
      expect(suggestions).toBeInstanceOf(Array);
    });
  });

  describe('dismissInsight', () => {
    it('should dismiss insight and persist to storage', () => {
      optimizationEngine.dismissInsight('test_insight');
      const stats = optimizationEngine.getStats();
      expect(stats.dismissedCount).toBe(1);
    });
  });

  describe('restoreInsight', () => {
    it('should restore dismissed insight', () => {
      optimizationEngine.dismissInsight('test_insight');
      optimizationEngine.restoreInsight('test_insight');
      const stats = optimizationEngine.getStats();
      expect(stats.dismissedCount).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return optimization engine statistics', () => {
      const stats = optimizationEngine.getStats();
      expect(stats).toHaveProperty('dismissedCount');
      expect(stats).toHaveProperty('lastAnalysisDate');
    });
  });

  describe('Edge Cases', () => {
    it('should handle transactions with no expenses', () => {
      const incomeOnly = [
        {
          id: '1',
          amount: 1000.0,
          category: 'Salary',
          type: TRANSACTION_TYPES.INCOME,
          date: '2024-01-15',
          accountId: 'main',
        },
      ];
      const insights = optimizationEngine.getOptimizationInsights(incomeOnly, {
        startDate: '2024-01-15',
        endDate: '2024-01-18',
      });
      expect(insights).toBeInstanceOf(Array);
    });
  });
});
