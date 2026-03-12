/**
 * Personal Inflation Service Tests
 *
 * Unit tests for personal inflation calculation methods
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PersonalInflationService } from '../../src/core/personal-inflation-service.js';

describe('PersonalInflationService', () => {
  let mockTransactions;

  beforeEach(() => {
    // Mock transaction data spanning 6 months (recent dates relative to current date)
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Create dates for the last 6 months
    mockTransactions = [];

    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(currentYear, currentMonth - i, 15);
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');

      // Coffee category - increasing prices
      mockTransactions.push({
        id: `coffee-${i}`,
        category: 'Coffee',
        type: 'expense',
        amount: 4.5 + (5 - i) * 0.25, // Oldest: 4.50, Newest: 5.75
        timestamp: `${year}-${month}-15T10:00:00Z`,
      });

      // Groceries category - stable prices
      mockTransactions.push({
        id: `groceries-${i}`,
        category: 'Groceries',
        type: 'expense',
        amount: 100 + (Math.random() * 4 - 2), // Around 100 with small variation
        timestamp: `${year}-${month}-20T15:00:00Z`,
      });

      // Transport category - decreasing prices
      mockTransactions.push({
        id: `transport-${i}`,
        category: 'Transport',
        type: 'expense',
        amount: 50 - (5 - i) * 1.67, // Oldest: 50, Newest: 41.67
        timestamp: `${year}-${month}-10T08:00:00Z`,
      });
    }

    // Add some income transactions (should be ignored)
    const salary1Date = new Date(currentYear, currentMonth - 4, 1);
    const salary2Date = new Date(currentYear, currentMonth - 3, 1);

    mockTransactions.push(
      {
        id: 'salary-1',
        category: 'Salary',
        type: 'income',
        amount: 3000.0,
        timestamp: salary1Date.toISOString(),
      },
      {
        id: 'salary-2',
        category: 'Salary',
        type: 'income',
        amount: 3000.0,
        timestamp: salary2Date.toISOString(),
      }
    );
  });

  describe('calculateCategoryInflation', () => {
    it('should calculate inflation for increasing prices', () => {
      const inflation = PersonalInflationService.calculateCategoryInflation(
        mockTransactions,
        'Coffee',
        6,
        'average'
      );

      // Coffee increased from $4.50 to $5.75 = 27.8% increase
      expect(inflation).toBeCloseTo(0.278, 2);
    });

    it('should calculate deflation for decreasing prices', () => {
      const inflation = PersonalInflationService.calculateCategoryInflation(
        mockTransactions,
        'Transport',
        6,
        'average'
      );

      // Transport decreased from around $50 to around $41.67 = ~16.7% decrease
      expect(inflation).toBeCloseTo(-0.167, 2);
    });

    it('should calculate stable prices as near zero', () => {
      const inflation = PersonalInflationService.calculateCategoryInflation(
        mockTransactions,
        'Groceries',
        6,
        'average'
      );

      // Groceries stayed around $100 = stable
      expect(Math.abs(inflation)).toBeLessThan(0.1); // Allow more tolerance for random variation
    });

    it('should return 0 for categories with insufficient data', () => {
      const inflation = PersonalInflationService.calculateCategoryInflation(
        mockTransactions,
        'NonExistent',
        6,
        'average'
      );

      expect(inflation).toBe(0);
    });

    it('should work with median calculation method', () => {
      const inflationAverage =
        PersonalInflationService.calculateCategoryInflation(
          mockTransactions,
          'Coffee',
          6,
          'average'
        );

      const inflationMedian =
        PersonalInflationService.calculateCategoryInflation(
          mockTransactions,
          'Coffee',
          6,
          'median'
        );

      // Both methods should return reasonable values
      expect(typeof inflationAverage).toBe('number');
      expect(typeof inflationMedian).toBe('number');
      expect(!isNaN(inflationAverage)).toBe(true);
      expect(!isNaN(inflationMedian)).toBe(true);
    });
  });

  describe('getMonthlyAverages', () => {
    it('should return monthly averages in correct order', () => {
      const categoryTransactions = mockTransactions.filter(
        t => t.category === 'Coffee'
      );
      const averages = PersonalInflationService.getMonthlyAverages(
        categoryTransactions,
        6
      );

      expect(averages).toHaveLength(6);
      expect(averages[0]).toBe(5.75); // Most recent (December)
      expect(averages[5]).toBe(4.5); // Oldest (July)
    });

    it('should handle empty transactions', () => {
      const averages = PersonalInflationService.getMonthlyAverages([], 6);
      expect(averages).toHaveLength(0);
    });

    it('should filter by date range correctly', () => {
      // Only look at last 3 months
      const categoryTransactions = mockTransactions.filter(
        t => t.category === 'Coffee'
      );
      const averages = PersonalInflationService.getMonthlyAverages(
        categoryTransactions,
        3
      );

      expect(averages).toHaveLength(3);
      expect(averages[0]).toBe(5.75); // December
      expect(averages[2]).toBe(5.25); // October
    });
  });

  describe('getTopInflationCategories', () => {
    it('should return top categories by inflation impact', () => {
      const topCategories = PersonalInflationService.getTopInflationCategories(
        mockTransactions,
        3,
        6
      );

      expect(topCategories).toHaveLength(3);
      expect(topCategories[0].category).toBe('Coffee'); // Highest inflation
      expect(topCategories[0].trend).toBe('up');

      expect(topCategories[1].category).toBe('Transport'); // Highest deflation
      expect(topCategories[1].trend).toBe('down');

      expect(topCategories[2].category).toBe('Groceries'); // Stable
      expect(topCategories[2].trend).toBe('stable');
    });

    it('should include total spending for each category', () => {
      const topCategories = PersonalInflationService.getTopInflationCategories(
        mockTransactions,
        3,
        6
      );

      const coffeeTotal = topCategories.find(
        c => c.category === 'Coffee'
      ).totalSpending;
      expect(coffeeTotal).toBeCloseTo(30.75, 2); // Sum of all coffee transactions
    });

    it('should filter out zero inflation rates', () => {
      const recentDate = new Date().toISOString();
      const transactionsWithEmptyCategory = [
        ...mockTransactions,
        {
          id: '21',
          category: 'Empty',
          type: 'expense',
          amount: 0,
          timestamp: recentDate,
        },
      ];

      const topCategories = PersonalInflationService.getTopInflationCategories(
        transactionsWithEmptyCategory,
        5,
        6
      );

      // Should not include categories with zero or NaN inflation
      topCategories.forEach(category => {
        expect(category.inflationRate).not.toBe(0);
        expect(!isNaN(category.inflationRate)).toBe(true);
      });
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

  describe('getMonthlySpendingData', () => {
    it('should return correct monthly spending data', () => {
      const monthlyData = PersonalInflationService.getMonthlySpendingData(
        mockTransactions,
        'Coffee',
        6
      );

      expect(monthlyData).toHaveLength(6);
      expect(monthlyData[0].amount).toBeCloseTo(4.5, 2); // Oldest
      expect(monthlyData[5].amount).toBeCloseTo(5.75, 2); // Most recent
      expect(monthlyData[0].month).toMatch(/^\d{4}-\d{2}$/); // Valid date format
    });

    it('should filter by category and expense type', () => {
      const monthlyData = PersonalInflationService.getMonthlySpendingData(
        mockTransactions,
        'Salary',
        6
      );

      // Salary is income, should return empty
      expect(monthlyData).toHaveLength(0);
    });

    it('should sort data chronologically', () => {
      const monthlyData = PersonalInflationService.getMonthlySpendingData(
        mockTransactions,
        'Coffee',
        6
      );

      for (let i = 1; i < monthlyData.length; i++) {
        expect(monthlyData[i].month).toBeGreaterThan(monthlyData[i - 1].month);
      }
    });
  });

  describe('validateCategoryData', () => {
    it('should validate sufficient data', () => {
      const validation = PersonalInflationService.validateCategoryData(
        mockTransactions,
        'Coffee',
        6
      );

      expect(validation.hasData).toBe(true);
      expect(validation.reason).toBeUndefined();
    });

    it('should reject categories with insufficient transactions', () => {
      const validation = PersonalInflationService.validateCategoryData(
        mockTransactions,
        'NonExistent',
        6
      );

      expect(validation.hasData).toBe(false);
      expect(validation.reason).toBe(
        'Not enough transactions in this category'
      );
    });

    it('should reject categories with insufficient time range', () => {
      const validation = PersonalInflationService.validateCategoryData(
        mockTransactions,
        'Coffee',
        12 // Ask for 12 months but only have 6
      );

      expect(validation.hasData).toBe(false);
      expect(validation.reason).toMatch(
        /Not enough transactions in the last 12 months|Need more than 12 months of data/
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle division by zero gracefully', () => {
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

      const transactionsWithZeroOldPrice = [
        {
          id: '1',
          category: 'Test',
          type: 'expense',
          amount: 0,
          timestamp: sixMonthsAgo.toISOString(),
        },
        {
          id: '2',
          category: 'Test',
          type: 'expense',
          amount: 10,
          timestamp: now.toISOString(),
        },
      ];

      const inflation = PersonalInflationService.calculateCategoryInflation(
        transactionsWithZeroOldPrice,
        'Test',
        6,
        'average'
      );

      expect(inflation).toBe(0);
    });

    it('should handle NaN values gracefully', () => {
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

      const transactionsWithNaN = [
        {
          id: '1',
          category: 'Test',
          type: 'expense',
          amount: NaN,
          timestamp: sixMonthsAgo.toISOString(),
        },
        {
          id: '2',
          category: 'Test',
          type: 'expense',
          amount: 10,
          timestamp: now.toISOString(),
        },
      ];

      const inflation = PersonalInflationService.calculateCategoryInflation(
        transactionsWithNaN,
        'Test',
        6,
        'average'
      );

      expect(typeof inflation).toBe('number');
      expect(!isNaN(inflation)).toBe(true);
    });

    it('should handle empty transaction arrays', () => {
      const topCategories = PersonalInflationService.getTopInflationCategories(
        [],
        3,
        6
      );
      expect(topCategories).toHaveLength(0);
    });
  });
});
