/**
 * Personal Inflation Service Tests (Simplified)
 *
 * Unit tests for personal inflation calculation methods
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PersonalInflationService } from '../../src/core/personal-inflation-service.js';

describe('PersonalInflationService (Simplified)', () => {
  let mockTransactions;

  const REFERENCE_DATE = new Date('2026-03-31T23:59:59Z');

  beforeEach(() => {
    // Simple test data without complex date filtering
    mockTransactions = [
      // Coffee category - increasing prices (recent dates)
      {
        id: '1',
        category: 'Coffee',
        type: 'expense',
        amount: 4.0,
        timestamp: '2026-01-15T10:00:00Z',
      },
      {
        id: '2',
        category: 'Coffee',
        type: 'expense',
        amount: 4.5,
        timestamp: '2026-02-15T10:00:00Z',
      },
      {
        id: '3',
        category: 'Coffee',
        type: 'expense',
        amount: 5.0,
        timestamp: '2026-03-15T10:00:00Z',
      },

      // Transport category - decreasing prices
      {
        id: '4',
        category: 'Transport',
        type: 'expense',
        amount: 60.0,
        timestamp: '2026-01-10T08:00:00Z',
      },
      {
        id: '5',
        category: 'Transport',
        type: 'expense',
        amount: 55.0,
        timestamp: '2026-02-10T08:00:00Z',
      },
      {
        id: '6',
        category: 'Transport',
        type: 'expense',
        amount: 50.0,
        timestamp: '2026-03-10T08:00:00Z',
      },

      // Stable category
      {
        id: '7',
        category: 'Groceries',
        type: 'expense',
        amount: 100.0,
        timestamp: '2026-01-20T15:00:00Z',
      },
      {
        id: '8',
        category: 'Groceries',
        type: 'expense',
        amount: 102.0,
        timestamp: '2026-02-20T15:00:00Z',
      },
      {
        id: '9',
        category: 'Groceries',
        type: 'expense',
        amount: 98.0,
        timestamp: '2026-03-20T15:00:00Z',
      },

      // Income (should be ignored)
      {
        id: '10',
        category: 'Salary',
        type: 'income',
        amount: 3000.0,
        timestamp: '2026-01-01T09:00:00Z',
      },
    ];
  });

  describe('calculateCategoryInflation', () => {
    it('should calculate inflation for increasing prices', () => {
      const inflation = PersonalInflationService.calculateCategoryInflation(
        mockTransactions,
        'Coffee',
        3,
        'average',
        REFERENCE_DATE
      );

      // Coffee increased from $4.00 to $5.00 = 25% increase
      expect(inflation).toBeCloseTo(0.25, 2);
    });

    it('should calculate deflation for decreasing prices', () => {
      const inflation = PersonalInflationService.calculateCategoryInflation(
        mockTransactions,
        'Transport',
        3,
        'average',
        REFERENCE_DATE
      );

      // Transport decreased from $60.00 to $50.00 = 16.67% decrease
      expect(inflation).toBeCloseTo(-0.167, 2);
    });

    it('should calculate stable prices as near zero', () => {
      const inflation = PersonalInflationService.calculateCategoryInflation(
        mockTransactions,
        'Groceries',
        3,
        'average',
        REFERENCE_DATE
      );

      // Groceries stayed around $100 = stable
      expect(Math.abs(inflation)).toBeLessThan(0.05);
    });

    it('should return 0 for categories with insufficient data', () => {
      const inflation = PersonalInflationService.calculateCategoryInflation(
        mockTransactions,
        'NonExistent',
        3,
        'average',
        REFERENCE_DATE
      );

      expect(inflation).toBe(0);
    });

    it('should work with median calculation method', () => {
      const inflationAverage =
        PersonalInflationService.calculateCategoryInflation(
          mockTransactions,
          'Coffee',
          3,
          'average',
          REFERENCE_DATE
        );

      const inflationMedian =
        PersonalInflationService.calculateCategoryInflation(
          mockTransactions,
          'Coffee',
          3,
          'median',
          REFERENCE_DATE
        );

      // Both methods should return reasonable values
      expect(typeof inflationAverage).toBe('number');
      expect(typeof inflationMedian).toBe('number');
      expect(!isNaN(inflationAverage)).toBe(true);
      expect(!isNaN(inflationMedian)).toBe(true);
    });
  });

  describe('getTrendDirection', () => {
    it('should return "up" for inflation > 5%', () => {
      expect(PersonalInflationService.getTrendDirection(0.1)).toBe('up');
      expect(PersonalInflationService.getTrendDirection(0.06)).toBe('up');
      expect(PersonalInflationService.getTrendDirection(0.051)).toBe('up');
    });

    it('should return "down" for deflation > 5%', () => {
      expect(PersonalInflationService.getTrendDirection(-0.1)).toBe('down');
      expect(PersonalInflationService.getTrendDirection(-0.06)).toBe('down');
      expect(PersonalInflationService.getTrendDirection(-0.051)).toBe('down');
    });

    it('should return "stable" for changes within 5%', () => {
      expect(PersonalInflationService.getTrendDirection(0.05)).toBe('stable');
      expect(PersonalInflationService.getTrendDirection(-0.05)).toBe('stable');
      expect(PersonalInflationService.getTrendDirection(0.03)).toBe('stable');
      expect(PersonalInflationService.getTrendDirection(-0.03)).toBe('stable');
      expect(PersonalInflationService.getTrendDirection(0)).toBe('stable');
    });
  });

  describe('getTopInflationCategories', () => {
    it('should return top categories by inflation impact', () => {
      const topCategories = PersonalInflationService.getTopInflationCategories(
        mockTransactions,
        3,
        3,
        'average',
        REFERENCE_DATE
      );

      expect(topCategories).toHaveLength(3);

      // Should include Coffee (highest inflation)
      const coffeeCategory = topCategories.find(c => c.category === 'Coffee');
      expect(coffeeCategory).toBeDefined();
      expect(coffeeCategory.trend).toBe('up');
      expect(coffeeCategory.inflationRate).toBeGreaterThan(0);

      // Should include Transport (deflation)
      const transportCategory = topCategories.find(
        c => c.category === 'Transport'
      );
      expect(transportCategory).toBeDefined();
      expect(transportCategory.trend).toBe('down');
      expect(transportCategory.inflationRate).toBeLessThan(0);
    });

    it('should include total spending for each category', () => {
      const topCategories = PersonalInflationService.getTopInflationCategories(
        mockTransactions,
        3,
        3,
        'average',
        REFERENCE_DATE
      );

      const coffeeTotal = topCategories.find(
        c => c.category === 'Coffee'
      ).totalSpending;
      expect(coffeeTotal).toBeCloseTo(13.5, 2); // 4.00 + 4.50 + 5.00
    });

    it('should filter out zero inflation rates', () => {
      const transactionsWithEmptyCategory = [
        ...mockTransactions,
        {
          id: '11',
          category: 'Empty',
          type: 'expense',
          amount: 0,
          timestamp: '2026-03-15T10:00:00Z',
        },
      ];

      const topCategories = PersonalInflationService.getTopInflationCategories(
        transactionsWithEmptyCategory,
        5,
        3,
        'average',
        REFERENCE_DATE
      );

      // Should not include categories with zero or NaN inflation
      topCategories.forEach(category => {
        expect(category.inflationRate).not.toBe(0);
        expect(!isNaN(category.inflationRate)).toBe(true);
      });
    });
  });

  describe('validateCategoryData', () => {
    it('should validate sufficient data', () => {
      const validation = PersonalInflationService.validateCategoryData(
        mockTransactions,
        'Coffee',
        3
      );

      expect(validation.hasData).toBe(true);
      expect(validation.reason).toBeUndefined();
    });

    it('should reject categories with insufficient transactions', () => {
      const validation = PersonalInflationService.validateCategoryData(
        mockTransactions,
        'NonExistent',
        3
      );

      expect(validation.hasData).toBe(false);
      expect(validation.reason).toBe(
        'Not enough transactions in this category'
      );
    });

    it('should accept categories even if requested time range is larger than available data, assuming minimum data is met', () => {
      const validation = PersonalInflationService.validateCategoryData(
        mockTransactions,
        'Coffee',
        12, // Ask for 12 months but only have 3
        new Date('2026-03-31') // Use fixed date for testing
      );

      expect(validation.hasData).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle division by zero gracefully', () => {
      const transactionsWithZeroOldPrice = [
        {
          id: '1',
          category: 'Test',
          type: 'expense',
          amount: 0,
          timestamp: '2026-01-15T10:00:00Z',
        },
        {
          id: '2',
          category: 'Test',
          type: 'expense',
          amount: 10,
          timestamp: '2026-03-15T10:00:00Z',
        },
      ];

      const inflation = PersonalInflationService.calculateCategoryInflation(
        transactionsWithZeroOldPrice,
        'Test',
        3,
        'average',
        REFERENCE_DATE
      );

      expect(inflation).toBe(0);
    });

    it('should handle NaN values gracefully', () => {
      const transactionsWithNaN = [
        {
          id: '1',
          category: 'Test',
          type: 'expense',
          amount: NaN,
          timestamp: '2026-01-15T10:00:00Z',
        },
        {
          id: '2',
          category: 'Test',
          type: 'expense',
          amount: 10,
          timestamp: '2026-03-15T10:00:00Z',
        },
      ];

      const inflation = PersonalInflationService.calculateCategoryInflation(
        transactionsWithNaN,
        'Test',
        3,
        'average',
        REFERENCE_DATE
      );

      expect(typeof inflation).toBe('number');
      expect(!isNaN(inflation)).toBe(true);
    });

    it('should handle empty transaction arrays', () => {
      const topCategories = PersonalInflationService.getTopInflationCategories(
        [],
        3,
        3,
        'average',
        REFERENCE_DATE
      );
      expect(topCategories).toHaveLength(0);
    });
  });
});
