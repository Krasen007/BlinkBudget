import { describe, it, expect } from 'vitest';
import { InsightsGenerator } from '../../src/core/insights-generator.js';

// Phase 3 (#9.1): topMovers() and categoryExpenseTotals() shared ~80% of a
// loop body and now both delegate to accumulateByCategory(). These tests pin
// the shared rules so the dedup cannot silently change behaviour, and cover
// categoryExpenseTotals(), which had no direct coverage before.
describe('accumulateByCategory shared rules', () => {
  const mixed = () => [
    { id: 1, category: 'Food', amount: -20 },
    { id: 2, category: 'Food', amount: -30 },
    { id: 3, category: 'Rent', amount: -500 },
    { id: 4, category: 'Salary', amount: 2000, type: 'income' },
    { id: 5, category: 'Food', amount: 50, type: 'refund' },
    { id: 6, category: 'Transfer-ish', amount: 999, type: 'transfer' },
    { id: 7, category: 'Ghost', amount: 777, isGhost: true },
    { id: 8, amount: 12 },
  ];

  it('excludes income, transfer and ghost rows from both outputs', () => {
    const top = InsightsGenerator.topMovers(mixed(), 10);
    const totals = InsightsGenerator.categoryExpenseTotals(mixed());
    const categories = top.map(t => t.category);

    expect(categories).not.toContain('Salary');
    expect(categories).not.toContain('Transfer-ish');
    expect(categories).not.toContain('Ghost');
    expect(totals.has('Salary')).toBe(false);
    expect(totals.has('Transfer-ish')).toBe(false);
    expect(totals.has('Ghost')).toBe(false);
  });

  it('subtracts refunds so the total nets down', () => {
    // 20 + 30 expenses, minus a 50 refund => 0 net for Food.
    expect(InsightsGenerator.categoryExpenseTotals(mixed()).get('Food')).toBe(
      0
    );

    const food = InsightsGenerator.topMovers(mixed(), 10).find(
      t => t.category === 'Food'
    );
    expect(food.total).toBe(0);
    expect(food.count).toBe(3);
  });

  it('takes absolute values regardless of sign', () => {
    const totals = InsightsGenerator.categoryExpenseTotals(mixed());
    expect(totals.get('Rent')).toBe(500);
  });

  it('groups uncategorised rows under a single label', () => {
    const totals = InsightsGenerator.categoryExpenseTotals(mixed());
    expect(totals.get('Uncategorized')).toBe(12);
  });

  it('coerces non-numeric amounts to zero', () => {
    const totals = InsightsGenerator.categoryExpenseTotals([
      { id: 1, category: 'Odd', amount: 'not-a-number' },
      { id: 2, category: 'Odd', amount: '25' },
    ]);
    expect(totals.get('Odd')).toBe(25);
  });

  it('keeps the two methods in agreement on totals', () => {
    const transactions = mixed();
    const totals = InsightsGenerator.categoryExpenseTotals(transactions);
    InsightsGenerator.topMovers(transactions, 100).forEach(item => {
      expect(totals.get(item.category)).toBe(item.total);
    });
  });

  it('returns empty results for a non-array, preserving each return shape', () => {
    expect(InsightsGenerator.topMovers(null, 5)).toEqual([]);
    expect(InsightsGenerator.categoryExpenseTotals(undefined).size).toBe(0);
  });

  it('sorts topMovers by absolute total descending', () => {
    const top = InsightsGenerator.topMovers(mixed(), 3);
    expect(top.map(t => t.category)).toEqual(['Rent', 'Uncategorized', 'Food']);
  });
});

describe('InsightsGenerator', () => {
  it('returns top movers by category', () => {
    const transactions = [
      { id: 1, category: 'Food', amount: -20 },
      { id: 2, category: 'Food', amount: -30 },
      { id: 3, category: 'Rent', amount: -500 },
      { id: 4, category: 'Salary', amount: 2000 },
      { id: 5, category: 'Misc', amount: -5 },
    ];
    const top = InsightsGenerator.topMovers(transactions, 3);
    expect(top.length).toBe(3);
    expect(top[0].category).toBe('Salary');
    expect(top[1].category).toBe('Rent');
    expect(top[2].category).toBe('Food');
  });

  it('compares timelines and computes changes', () => {
    const prev = [
      { period: '2025-01', value: 100 },
      { period: '2025-02', value: 200 },
    ];
    const cur = [
      { period: '2025-01', value: 150 },
      { period: '2025-02', value: 100 },
    ];
    const comp = InsightsGenerator.timelineComparison(cur, prev);
    expect(comp).toHaveLength(2);
    const p1 = comp.find(c => c.period === '2025-01');
    expect(p1.absoluteChange).toBe(50);
    expect(p1.percentChange).toBeCloseTo(50);
    const p2 = comp.find(c => c.period === '2025-02');
    expect(p2.absoluteChange).toBe(-100);
    expect(p2.percentChange).toBeCloseTo(-50);
  });

  it('ranks category movers by absolute month-over-month change', () => {
    const current = [
      { id: 1, category: 'Food', amount: 100, type: 'expense' },
      { id: 2, category: 'Rent', amount: 500, type: 'expense' },
      { id: 3, category: 'Fun', amount: 80, type: 'expense' },
    ];
    const previous = [
      { id: 4, category: 'Food', amount: 40, type: 'expense' },
      { id: 5, category: 'Rent', amount: 500, type: 'expense' },
      { id: 6, category: 'Fun', amount: 200, type: 'expense' },
    ];

    const movers = InsightsGenerator.categoryMovers(current, previous, 5);

    // Unchanged categories (Rent) are dropped; the rest sort by |change|
    expect(movers.map(m => m.category)).toEqual(['Fun', 'Food']);
    expect(movers[0].absoluteChange).toBe(-120);
    expect(movers[1].absoluteChange).toBe(60);
    expect(movers[1].percentChange).toBeCloseTo(150);
  });

  it('keeps new and disappeared categories as movers', () => {
    const current = [
      { id: 1, category: 'Coffee', amount: 30, type: 'expense' },
    ];
    const previous = [{ id: 2, category: 'Gym', amount: 50, type: 'expense' }];

    const movers = InsightsGenerator.categoryMovers(current, previous, 5);

    expect(movers).toHaveLength(2);
    const coffee = movers.find(m => m.category === 'Coffee');
    expect(coffee.previous).toBe(0);
    expect(coffee.absoluteChange).toBe(30);
    expect(coffee.percentChange).toBe(Infinity);
    const gym = movers.find(m => m.category === 'Gym');
    expect(gym.absoluteChange).toBe(-50);
  });

  it('ignores sub-half-cent category changes when ranking movers', () => {
    const current = [
      { id: 1, category: 'Food', amount: 50.0, type: 'expense' },
    ];
    const previous = [
      { id: 2, category: 'Food', amount: 50.004, type: 'expense' },
    ];

    const movers = InsightsGenerator.categoryMovers(current, previous, 5);

    expect(movers).toHaveLength(0);
  });
});
