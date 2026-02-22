import { describe, it, expect, beforeEach } from 'vitest';
import { TrendAnalysisService } from '../../src/core/analytics/trend-analysis-service.js';
import { TRANSACTION_TYPES } from '../../src/utils/constants.js';

describe('TrendAnalysisService', () => {
  let trendService;
  let sampleTransactions;

  beforeEach(() => {
    trendService = new TrendAnalysisService();
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
        amount: 100.0,
        category: 'Food',
        type: TRANSACTION_TYPES.EXPENSE,
        date: '2024-02-15',
        accountId: 'main',
      },
      {
        id: '3',
        amount: 75.0,
        category: 'Food',
        type: TRANSACTION_TYPES.EXPENSE,
        date: '2024-03-15',
        accountId: 'main',
      },
      {
        id: '4',
        amount: 1000.0,
        category: 'Salary',
        type: TRANSACTION_TYPES.INCOME,
        date: '2024-01-01',
        accountId: 'main',
      },
    ];
    global.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    };
  });

  describe('getTrendAnalysis', () => {
    it('should return trend analysis for transactions', () => {
      const result = trendService.getTrendAnalysis(null, sampleTransactions);
      expect(result).toHaveProperty('trends');
      expect(result).toHaveProperty('enoughData');
    });
    it('should indicate not enough data for insufficient transactions', () => {
      const fewTransactions = [
        {
          id: '1',
          amount: 50.0,
          category: 'Food',
          type: TRANSACTION_TYPES.EXPENSE,
          date: '2024-01-15',
        },
      ];
      const result = trendService.getTrendAnalysis(null, fewTransactions);
      expect(result.enoughData).toBe(false);
    });
    it('should filter by category when specified', () => {
      const result = trendService.getTrendAnalysis('Food', sampleTransactions);
      expect(result).toHaveProperty('trends');
    });
  });

  describe('getConsistencyScores', () => {
    it('should calculate consistency scores for categories', () => {
      const scores = trendService.getConsistencyScores(sampleTransactions);
      expect(scores).toHaveProperty('categories');
      expect(scores).toHaveProperty('overall');
    });
    it('should return 1.0 for single transaction categories', () => {
      const scores = trendService.getConsistencyScores(sampleTransactions);
      expect(scores.categories['Salary']).toBe(1.0);
    });
    it('should handle empty transactions', () => {
      const scores = trendService.getConsistencyScores([]);
      expect(scores.overall).toBe(1.0);
    });
  });

  describe('detectSeasonalPatterns', () => {
    it('should detect seasonal patterns in spending', () => {
      const patterns = trendService.detectSeasonalPatterns(
        'Food',
        sampleTransactions
      );
      expect(patterns).toHaveProperty('monthlyAverages');
      expect(patterns).toHaveProperty('hasSeasonality');
    });
    it('should return monthly averages for all months', () => {
      const patterns = trendService.detectSeasonalPatterns(
        'Food',
        sampleTransactions
      );
      expect(patterns.monthlyAverages).toHaveLength(12);
    });
  });

  describe('getSpendingDirection', () => {
    it('should determine spending direction for category', () => {
      const direction = trendService.getSpendingDirection(
        'Food',
        sampleTransactions
      );
      expect(direction).toHaveProperty('direction');
      expect(direction).toHaveProperty('changePercent');
    });
    it('should return stable for insufficient data', () => {
      const fewTransactions = [
        {
          id: '1',
          amount: 50.0,
          category: 'Food',
          type: TRANSACTION_TYPES.EXPENSE,
          date: '2024-01-15',
        },
      ];
      const direction = trendService.getSpendingDirection(
        'Food',
        fewTransactions
      );
      expect(direction.direction).toBe('stable');
    });
  });

  describe('Edge Cases', () => {
    it('should handle income-only transactions', () => {
      const incomeOnly = [
        {
          id: '1',
          amount: 1000.0,
          category: 'Salary',
          type: TRANSACTION_TYPES.INCOME,
          date: '2024-01-15',
        },
      ];
      const result = trendService.getTrendAnalysis(null, incomeOnly);
      expect(result).toHaveProperty('trends');
    });
    it('should handle missing category', () => {
      const noCategory = [
        {
          id: '1',
          amount: 50.0,
          type: TRANSACTION_TYPES.EXPENSE,
          date: '2024-01-15',
        },
      ];
      const scores = trendService.getConsistencyScores(noCategory);
      expect(scores).toHaveProperty('categories');
    });
  });
});
