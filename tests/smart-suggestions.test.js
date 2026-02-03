/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SuggestionService } from '../src/core/suggestion-service.js';
import { TransactionService } from '../src/core/transaction-service.js';

// Mock TransactionService
vi.mock('../src/core/transaction-service.js', () => ({
  TransactionService: {
    getAll: vi.fn(),
  },
}));

describe('Smart Suggestions Service', () => {
  let service;

  beforeEach(() => {
    service = new SuggestionService();
    vi.clearAllMocks();
    service.clearCache();
    service.userHistory = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Empty History Scenarios', () => {
    it('should handle completely empty transaction history', async () => {
      TransactionService.getAll.mockReturnValue([]);

      const amountSuggestions = await service.getAmountSuggestions();
      const categorySuggestions = await service.getCategorySuggestions(25);
      const noteSuggestions = await service.getNoteSuggestions('Food', 25);

      // Should still provide time-based suggestions even with no history
      expect(amountSuggestions.length).toBeGreaterThan(0);
      expect(categorySuggestions.length).toBeGreaterThan(0);
      expect(noteSuggestions.length).toBe(0); // No notes without history
    });

    it('should handle new user with no transactions', async () => {
      TransactionService.getAll.mockReturnValue([]);

      const suggestions = await service.getAmountSuggestions({ newUser: true });

      // Should rely on common patterns
      expect(
        suggestions.every(
          s => s.source === 'timePattern' || s.source === 'frequency'
        )
      ).toBe(true);
      expect(suggestions.every(s => s.confidence >= 0.5)).toBe(true);
    });

    it('should handle single transaction history', async () => {
      const singleTransaction = [
        {
          id: 1,
          amount: 25,
          category: 'Lunch',
          date: new Date().toISOString(),
          description: 'Sandwich',
        },
      ];
      TransactionService.getAll.mockReturnValue(singleTransaction);

      const amountSuggestions = await service.getAmountSuggestions();
      const categorySuggestions = await service.getCategorySuggestions(25);

      // Should include the single transaction in suggestions
      expect(
        amountSuggestions.some(s => s.amount === 25 && s.source === 'recent')
      ).toBe(true);
      expect(categorySuggestions.some(s => s.category === 'Lunch')).toBe(true);
    });

    it('should handle transactions with missing data', async () => {
      const incompleteTransactions = [
        { id: 1, amount: null, category: '', date: new Date().toISOString() },
        { id: 2, amount: 25, category: null, date: null },
        { id: 3, amount: 15, category: 'Food', description: null },
      ];
      TransactionService.getAll.mockReturnValue(incompleteTransactions);

      const amountSuggestions = await service.getAmountSuggestions();
      const categorySuggestions = await service.getCategorySuggestions(15);

      // Should handle missing data gracefully
      expect(Array.isArray(amountSuggestions)).toBe(true);
      expect(Array.isArray(categorySuggestions)).toBe(true);
      expect(amountSuggestions.length).toBeGreaterThanOrEqual(0);
      expect(categorySuggestions.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Edge Cases - Amount Suggestions', () => {
    it('should handle zero amount', async () => {
      TransactionService.getAll.mockReturnValue([]);

      const suggestions = await service.getAmountSuggestions({ amount: 0 });

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.every(s => typeof s.amount === 'number')).toBe(true);
      expect(suggestions.every(s => s.amount >= 0)).toBe(true);
    });

    it('should handle negative amounts', async () => {
      TransactionService.getAll.mockReturnValue([]);

      const suggestions = await service.getAmountSuggestions({ amount: -10 });

      expect(Array.isArray(suggestions)).toBe(true);
      // Should still provide suggestions but handle negative context
    });

    it('should handle very large amounts', async () => {
      TransactionService.getAll.mockReturnValue([]);

      const suggestions = await service.getAmountSuggestions({
        amount: 1000000,
      });

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.every(s => s.amount > 0)).toBe(true);
    });

    it('should handle decimal amounts', async () => {
      TransactionService.getAll.mockReturnValue([]);

      const suggestions = await service.getAmountSuggestions({ amount: 4.99 });

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.every(s => typeof s.amount === 'number')).toBe(true);
    });

    it('should handle very small decimal amounts', async () => {
      TransactionService.getAll.mockReturnValue([]);

      const suggestions = await service.getAmountSuggestions({ amount: 0.01 });

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.every(s => s.amount > 0)).toBe(true);
    });

    it('should handle invalid amount types', async () => {
      TransactionService.getAll.mockReturnValue([]);

      const suggestions1 = await service.getAmountSuggestions({
        amount: 'invalid',
      });
      const suggestions2 = await service.getAmountSuggestions({ amount: null });
      const suggestions3 = await service.getAmountSuggestions({
        amount: undefined,
      });

      expect(Array.isArray(suggestions1)).toBe(true);
      expect(Array.isArray(suggestions2)).toBe(true);
      expect(Array.isArray(suggestions3)).toBe(true);
    });
  });

  describe('Edge Cases - Category Suggestions', () => {
    it('should handle empty category input', async () => {
      TransactionService.getAll.mockReturnValue([]);

      const suggestions = await service.getCategorySuggestions(25, {
        category: '',
      });

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.every(s => typeof s.category === 'string')).toBe(true);
    });

    it('should handle null/undefined category', async () => {
      TransactionService.getAll.mockReturnValue([]);

      const suggestions1 = await service.getCategorySuggestions(25, {
        category: null,
      });
      const suggestions2 = await service.getCategorySuggestions(25, {
        category: undefined,
      });

      expect(Array.isArray(suggestions1)).toBe(true);
      expect(Array.isArray(suggestions2)).toBe(true);
    });

    it('should handle very long category names', async () => {
      TransactionService.getAll.mockReturnValue([]);

      const longCategory = 'A'.repeat(1000);
      const suggestions = await service.getCategorySuggestions(25, {
        category: longCategory,
      });

      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should handle special characters in category', async () => {
      TransactionService.getAll.mockReturnValue([]);

      const specialCategory = 'Food & Drink!@#$%^&*()';
      const suggestions = await service.getCategorySuggestions(25, {
        category: specialCategory,
      });

      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should handle case sensitivity in categories', async () => {
      const transactions = [
        { id: 1, amount: 25, category: 'food', date: new Date().toISOString() },
        { id: 2, amount: 30, category: 'Food', date: new Date().toISOString() },
        { id: 3, amount: 20, category: 'FOOD', date: new Date().toISOString() },
      ];
      TransactionService.getAll.mockReturnValue(transactions);

      const suggestions = await service.getCategorySuggestions(25);

      // Should handle case variations
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.some(s => s.category.toLowerCase() === 'food')).toBe(
        true
      );
    });
  });

  describe('Edge Cases - Note Suggestions', () => {
    it('should handle empty note input', async () => {
      TransactionService.getAll.mockReturnValue([]);

      const suggestions = await service.getNoteSuggestions('Food', 25, '');

      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should handle very long note descriptions', async () => {
      TransactionService.getAll.mockReturnValue([]);

      const longNote = 'A'.repeat(10000);
      const suggestions = await service.getNoteSuggestions(
        'Food',
        25,
        longNote
      );

      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should handle special characters and emojis in notes', async () => {
      TransactionService.getAll.mockReturnValue([]);

      const specialNote = 'Lunch 🍕 with friends! @#$%^&*()';
      const suggestions = await service.getNoteSuggestions(
        'Food',
        25,
        specialNote
      );

      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should handle HTML/script injection in notes', async () => {
      TransactionService.getAll.mockReturnValue([]);

      const maliciousNote = '<script>alert("xss")</script>Lunch';
      const suggestions = await service.getNoteSuggestions(
        'Food',
        25,
        maliciousNote
      );

      expect(Array.isArray(suggestions)).toBe(true);
      // Should handle malicious input safely
    });

    it('should handle unicode and international characters', async () => {
      TransactionService.getAll.mockReturnValue([]);

      const unicodeNote = '午餐 午食 ランチ Обед';
      const suggestions = await service.getNoteSuggestions(
        'Food',
        25,
        unicodeNote
      );

      expect(Array.isArray(suggestions)).toBe(true);
    });
  });

  describe('Time-based Edge Cases', () => {
    it('should handle midnight time', async () => {
      TransactionService.getAll.mockReturnValue([]);

      // Mock current time as midnight
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T00:00:00Z'));

      const suggestions = await service.getAmountSuggestions();

      expect(Array.isArray(suggestions)).toBe(true);
      vi.useRealTimers();
    });

    it('should handle early morning time', async () => {
      TransactionService.getAll.mockReturnValue([]);

      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T05:30:00Z'));

      const suggestions = await service.getAmountSuggestions();

      expect(Array.isArray(suggestions)).toBe(true);
      vi.useRealTimers();
    });

    it('should handle late night time', async () => {
      TransactionService.getAll.mockReturnValue([]);

      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T23:59:59Z'));

      const suggestions = await service.getAmountSuggestions();

      expect(Array.isArray(suggestions)).toBe(true);
      vi.useRealTimers();
    });

    it('should handle invalid time context', async () => {
      TransactionService.getAll.mockReturnValue([]);

      const suggestions = await service.getAmountSuggestions({
        time: 'invalid',
      });

      expect(Array.isArray(suggestions)).toBe(true);
    });
  });

  describe('Performance and Caching Edge Cases', () => {
    it('should handle rapid successive calls', async () => {
      TransactionService.getAll.mockReturnValue([]);

      // Mock time to ensure consistent cache keys
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));

      // Make multiple rapid calls with same context
      const sameContext = { amount: 25 };
      const promises = Array(10)
        .fill()
        .map(() => service.getAmountSuggestions(sameContext));
      const results = await Promise.all(promises);

      // All should return valid results
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });

      // All results should be identical (indicating caching is working)
      const firstResult = results[0];
      results.forEach(result => {
        expect(result).toEqual(firstResult);
      });

      vi.useRealTimers();
    });

    it('should handle cache overflow', async () => {
      TransactionService.getAll.mockReturnValue([]);

      // Generate many different contexts to fill cache
      for (let i = 0; i < 1000; i++) {
        await service.getAmountSuggestions({ amount: i });
      }

      // Should still work
      const suggestions = await service.getAmountSuggestions();
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should handle cache clearing during operation', async () => {
      TransactionService.getAll.mockReturnValue([]);

      const promise1 = service.getAmountSuggestions({ amount: 25 });
      service.clearCache();
      const promise2 = service.getAmountSuggestions({ amount: 30 });

      const [result1, result2] = await Promise.all([promise1, promise2]);

      expect(Array.isArray(result1)).toBe(true);
      expect(Array.isArray(result2)).toBe(true);
    });
  });

  describe('Data Integrity Edge Cases', () => {
    it('should handle corrupted transaction data', async () => {
      const corruptedData = [
        { id: 1, amount: 'not-a-number', category: {}, date: 'invalid-date' },
        { id: 2, amount: Infinity, category: null, date: null },
        { id: 3, amount: NaN, category: '', description: undefined },
      ];
      TransactionService.getAll.mockReturnValue(corruptedData);

      const suggestions = await service.getAmountSuggestions();

      expect(Array.isArray(suggestions)).toBe(true);
      // Should handle corrupted data gracefully
    });

    it('should handle circular references in data', async () => {
      const circularData = { id: 1, amount: 25 };
      circularData.self = circularData;
      TransactionService.getAll.mockReturnValue([circularData]);

      const suggestions = await service.getAmountSuggestions();

      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should handle extremely large transaction arrays', async () => {
      const largeDataset = Array(10000)
        .fill()
        .map((_, i) => ({
          id: i,
          amount: Math.random() * 100,
          category: `Category${i % 10}`,
          date: new Date().toISOString(),
        }));
      TransactionService.getAll.mockReturnValue(largeDataset);

      const suggestions = await service.getAmountSuggestions();

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeLessThanOrEqual(8); // Should limit results
    });
  });

  describe('Smart Category Match Edge Cases', () => {
    it('should handle no confident matches', async () => {
      TransactionService.getAll.mockReturnValue([]);

      const match = await service.getSmartCategoryMatch(999999);

      expect(match).toBeNull();
    });

    it('should handle multiple high-confidence matches', async () => {
      const transactions = [
        {
          id: 1,
          amount: 25,
          category: 'Lunch',
          date: new Date().toISOString(),
        },
        {
          id: 2,
          amount: 25,
          category: 'Lunch',
          date: new Date().toISOString(),
        },
        {
          id: 3,
          amount: 25,
          category: 'Lunch',
          date: new Date().toISOString(),
        },
      ];
      TransactionService.getAll.mockReturnValue(transactions);

      const match = await service.getSmartCategoryMatch(25);

      expect(match).not.toBeNull();
      expect(match.category).toBe('Lunch');
      expect(match.alternatives).toBeDefined();
    });

    it('should handle invalid confidence thresholds', async () => {
      // Temporarily modify confidence thresholds
      const originalThresholds = service.confidenceThresholds;
      service.confidenceThresholds = { high: -1, medium: 2, low: 5 };

      TransactionService.getAll.mockReturnValue([]);

      const match = await service.getSmartCategoryMatch(25);

      // Should handle invalid thresholds gracefully
      expect(match).toBeDefined();

      // Restore original thresholds
      service.confidenceThresholds = originalThresholds;
    });
  });

  describe('User Selection Recording Edge Cases', () => {
    it('should handle invalid selection types', () => {
      expect(() => {
        service.recordUserSelection('invalid_type', 'selected', []);
      }).not.toThrow();
    });

    it('handle null/undefined selections', () => {
      expect(() => {
        service.recordUserSelection('amount', null, []);
        service.recordUserSelection('category', undefined, []);
      }).not.toThrow();
    });

    it('handle circular references in rejected items', () => {
      const circular = { self: null };
      circular.self = circular;

      expect(() => {
        service.recordUserSelection('amount', 25, [circular]);
      }).not.toThrow();
    });
  });

  describe('Merchant Pattern Edge Cases', () => {
    it('should handle partial merchant matches', async () => {
      TransactionService.getAll.mockReturnValue([]);

      const suggestions = await service.getNoteSuggestions('Coffee', 5, 'star');

      expect(Array.isArray(suggestions)).toBe(true);
      // Should handle partial matches
    });

    it('should handle false positive merchant matches', async () => {
      TransactionService.getAll.mockReturnValue([]);

      const suggestions = await service.getNoteSuggestions(
        'Food',
        25,
        'this is not starbucks'
      );

      expect(Array.isArray(suggestions)).toBe(true);
      // Should be careful with false positives
    });
  });

  describe('Deduplication Edge Cases', () => {
    it('should handle exact duplicates', async () => {
      const transactions = [
        {
          id: 1,
          amount: 25,
          category: 'Lunch',
          date: new Date().toISOString(),
        },
        {
          id: 2,
          amount: 25,
          category: 'Lunch',
          date: new Date().toISOString(),
        },
      ];
      TransactionService.getAll.mockReturnValue(transactions);

      const suggestions = await service.getAmountSuggestions();

      // Should not have duplicate suggestions (same amount + category)
      const uniqueSuggestions = new Set(
        suggestions.map(s => `${s.amount}_${s.category}`)
      );
      expect(uniqueSuggestions.size).toBe(suggestions.length);
    });

    it('should handle case-sensitive duplicates', async () => {
      const suggestions = [
        { category: 'Food', confidence: 0.8 },
        { category: 'food', confidence: 0.7 },
        { category: 'FOOD', confidence: 0.6 },
      ];

      const deduplicated = service.deduplicateCategorySuggestions(suggestions);

      expect(deduplicated.length).toBe(1);
    });

    it('should handle null/undefined values in deduplication', () => {
      const suggestions = [
        { note: null, confidence: 0.8 },
        { note: undefined, confidence: 0.7 },
        { note: '', confidence: 0.6 },
      ];

      expect(() => {
        service.deduplicateNoteSuggestions(suggestions);
      }).not.toThrow();
    });
  });

  describe('Error Recovery Edge Cases', () => {
    it('should handle TransactionService throwing errors', async () => {
      TransactionService.getAll.mockImplementation(() => {
        throw new Error('Database error');
      });

      const suggestions = await service.getAmountSuggestions();

      // Should fallback gracefully
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should handle memory allocation errors', async () => {
      // Mock a scenario where memory allocation fails
      const originalMap = Map.prototype.set;
      Map.prototype.set = function () {
        throw new Error('Out of memory');
      };

      try {
        TransactionService.getAll.mockReturnValue([]);
        const suggestions = await service.getAmountSuggestions();
        expect(Array.isArray(suggestions)).toBe(true);
      } finally {
        Map.prototype.set = originalMap;
      }
    });

    it('should handle concurrent access to shared state', async () => {
      TransactionService.getAll.mockReturnValue([]);

      // Simulate concurrent access
      const promises = Array(100)
        .fill()
        .map((_, i) => service.getAmountSuggestions({ amount: i }));

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });
    });
  });

  describe('Boundary Value Testing', () => {
    it('should handle confidence threshold boundaries', async () => {
      const transactions = [
        {
          id: 1,
          amount: 25,
          category: 'Lunch',
          date: new Date().toISOString(),
        },
      ];
      TransactionService.getAll.mockReturnValue(transactions);

      const match = await service.getSmartCategoryMatch(25);

      if (match) {
        expect(match.confidence).toBeGreaterThanOrEqual(
          service.confidenceThresholds.medium
        );
      }
    });

    it('should handle suggestion count boundaries', async () => {
      TransactionService.getAll.mockReturnValue([]);

      const amountSuggestions = await service.getAmountSuggestions();
      const categorySuggestions = await service.getCategorySuggestions(25);
      const noteSuggestions = await service.getNoteSuggestions('Food', 25);

      expect(amountSuggestions.length).toBeLessThanOrEqual(8);
      expect(categorySuggestions.length).toBeLessThanOrEqual(6);
      expect(noteSuggestions.length).toBeLessThanOrEqual(5);
    });

    it('should handle frequency calculation boundaries', async () => {
      const transactions = Array(1000)
        .fill()
        .map((_, i) => ({
          id: i,
          amount: 25,
          category: 'Lunch',
          date: new Date().toISOString(),
        }));
      TransactionService.getAll.mockReturnValue(transactions);

      const suggestions = await service.getAmountSuggestions();

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.every(s => s.confidence <= 1)).toBe(true);
    });
  });

  describe('Integration Edge Cases', () => {
    it('should handle integration with SmartNoteField', async () => {
      TransactionService.getAll.mockReturnValue([]);

      // Simulate SmartNoteField usage pattern
      const suggestions = await service.getNoteSuggestions('Coffee', 5, 'star');

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.every(s => typeof s.note === 'string')).toBe(true);
    });

    it('should handle real-time context updates', async () => {
      TransactionService.getAll.mockReturnValue([]);

      // Simulate rapid context changes
      const contexts = [
        { amount: 5, category: 'Coffee' },
        { amount: 25, category: 'Lunch' },
        { amount: 50, category: 'Groceries' },
      ];

      const promises = contexts.map(ctx =>
        service.getCategorySuggestions(ctx.amount, ctx)
      );

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });
    });
  });
});
