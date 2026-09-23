import { describe, it, expect } from 'vitest';
import { RecurringDetector } from '../../src/core/recurring-detector.js';

/**
 * Expense fixture
 * @returns {Object}
 */
const expense = (id, category, amount, date) => ({
  id,
  category,
  amount,
  type: 'expense',
  timestamp: date.toISOString(),
});

describe('RecurringDetector', () => {
  it('detects a fixed-price monthly charge', () => {
    // Exactly 30-day gaps, identical amounts
    const transactions = [
      expense('n1', 'Netflix', 12.99, new Date(2026, 0, 1, 12)),
      expense('n2', 'Netflix', 12.99, new Date(2026, 0, 31, 12)),
      expense('n3', 'Netflix', 12.99, new Date(2026, 2, 2, 12)),
      expense('n4', 'Netflix', 12.99, new Date(2026, 3, 1, 12)),
      expense('n5', 'Netflix', 12.99, new Date(2026, 4, 1, 12)),
    ];

    const results = RecurringDetector.detectRecurring(transactions);

    expect(results).toHaveLength(1);
    const [item] = results;
    expect(item.category).toBe('Netflix');
    expect(item.amount).toBe(12.99);
    expect(item.intervalDays).toBe(30);
    expect(item.occurrences).toBe(5);
    expect(item.lastDate.getMonth()).toBe(4); // May
    expect(item.lastDate.getDate()).toBe(1);
    expect(item.nextDate.getMonth()).toBe(4);
    expect(item.nextDate.getDate()).toBe(31); // May 1 + 30 days
  });

  it('detects a fixed-price weekly charge', () => {
    const transactions = [
      expense('w1', 'Gym', 9.99, new Date(2026, 0, 5, 12)),
      expense('w2', 'Gym', 9.99, new Date(2026, 0, 12, 12)),
      expense('w3', 'Gym', 9.99, new Date(2026, 0, 19, 12)),
      expense('w4', 'Gym', 9.99, new Date(2026, 0, 26, 12)),
      expense('w5', 'Gym', 9.99, new Date(2026, 1, 2, 12)),
    ];

    const results = RecurringDetector.detectRecurring(transactions);

    expect(results).toHaveLength(1);
    expect(results[0].intervalDays).toBe(7);
  });

  it('rejects categories with variable amounts (groceries-style spending)', () => {
    const transactions = [
      expense('g1', 'Groceries', 40, new Date(2026, 0, 5, 12)),
      expense('g2', 'Groceries', 80, new Date(2026, 0, 12, 12)),
      expense('g3', 'Groceries', 35, new Date(2026, 0, 19, 12)),
      expense('g4', 'Groceries', 90, new Date(2026, 0, 26, 12)),
      expense('g5', 'Groceries', 45, new Date(2026, 1, 2, 12)),
    ];

    expect(RecurringDetector.detectRecurring(transactions)).toHaveLength(0);
  });

  it('rejects categories with too few occurrences', () => {
    const transactions = [
      expense('s1', 'Software', 20, new Date(2026, 0, 1, 12)),
      expense('s2', 'Software', 20, new Date(2026, 1, 1, 12)),
      expense('s3', 'Software', 20, new Date(2026, 2, 1, 12)),
    ];

    expect(RecurringDetector.detectRecurring(transactions)).toHaveLength(0);
  });

  it('rejects fixed amounts with an irregular cadence', () => {
    // Gaps: 30, 31, 28, 90 days → MAD/median > 0.5
    const transactions = [
      expense('i1', 'Insurance', 50, new Date(2026, 0, 1, 12)),
      expense('i2', 'Insurance', 50, new Date(2026, 0, 31, 12)),
      expense('i3', 'Insurance', 50, new Date(2026, 2, 3, 12)),
      expense('i4', 'Insurance', 50, new Date(2026, 2, 31, 12)),
      expense('i5', 'Insurance', 50, new Date(2026, 5, 29, 12)),
    ];

    expect(RecurringDetector.detectRecurring(transactions)).toHaveLength(0);
  });

  it('ignores ghost and income transactions', () => {
    const real = [
      expense('r1', 'Rent', 800, new Date(2026, 0, 1, 12)),
      expense('r2', 'Rent', 800, new Date(2026, 1, 1, 12)),
      expense('r3', 'Rent', 800, new Date(2026, 2, 1, 12)),
    ];
    const ghosts = [
      {
        ...expense('gh1', 'Rent', 800, new Date(2026, 3, 1, 12)),
        isGhost: true,
      },
      {
        ...expense('gh2', 'Rent', 800, new Date(2026, 4, 1, 12)),
        isGhost: true,
      },
    ];
    const income = [
      {
        id: 'sal',
        category: 'Salary',
        amount: 2000,
        type: 'income',
        timestamp: new Date(2026, 0, 5, 12).toISOString(),
      },
    ];

    // 3 real + 2 ghosts stays below MIN_OCCURRENCES; income never counts
    expect(
      RecurringDetector.detectRecurring([...real, ...ghosts, ...income])
    ).toHaveLength(0);
  });

  it('sorts results by the most imminent next charge', () => {
    const transactions = [
      // Netflix: monthly, last charge May 1 → next ≈ May 31
      expense('n1', 'Netflix', 12.99, new Date(2026, 0, 1, 12)),
      expense('n2', 'Netflix', 12.99, new Date(2026, 1, 1, 12)),
      expense('n3', 'Netflix', 12.99, new Date(2026, 2, 1, 12)),
      expense('n4', 'Netflix', 12.99, new Date(2026, 3, 1, 12)),
      expense('n5', 'Netflix', 12.99, new Date(2026, 4, 1, 12)),
      // Phone plan: monthly, last charge May 15 → next ≈ Jun 14
      expense('p1', 'Phone', 19.99, new Date(2026, 0, 15, 12)),
      expense('p2', 'Phone', 19.99, new Date(2026, 1, 15, 12)),
      expense('p3', 'Phone', 19.99, new Date(2026, 2, 15, 12)),
      expense('p4', 'Phone', 19.99, new Date(2026, 3, 15, 12)),
      expense('p5', 'Phone', 19.99, new Date(2026, 4, 15, 12)),
    ];

    const results = RecurringDetector.detectRecurring(transactions);

    expect(results.map(item => item.category)).toEqual(['Netflix', 'Phone']);
  });
});
