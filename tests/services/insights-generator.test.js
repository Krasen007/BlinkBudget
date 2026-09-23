import { describe, it, expect } from 'vitest';
import { InsightsGenerator } from '../../src/core/insights-generator.js';

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
});
