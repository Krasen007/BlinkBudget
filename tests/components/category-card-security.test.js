import { describe, expect, it } from 'vitest';
import { CategoryCard } from '../../src/components/CategoryCard.js';

describe('CategoryCard keyed data lookups', () => {
  it('does not use inherited frequency or budget properties for category names', () => {
    const inheritedFrequency = {
      averageVisitsPerWeek: 99,
    };
    const inheritedBudget = {
      isWarning: true,
      utilization: 99,
    };
    const card = CategoryCard(
      { name: 'toString', amount: 10 },
      0,
      new Map(),
      () => {},
      Object.create({ toString: inheritedFrequency }),
      [],
      Object.create({ toString: inheritedBudget })
    );

    expect(card.textContent).not.toContain('99 visits per week');
    expect(card.textContent).not.toContain('99% used');
  });

  it('supports own budget entries whose category name is __proto__', () => {
    const budgetStatus = Object.create(null);
    budgetStatus.__proto__ = { isWarning: true, utilization: 80 };

    const card = CategoryCard(
      { name: '__proto__', amount: 10 },
      0,
      new Map(),
      () => {},
      null,
      [],
      budgetStatus
    );

    expect(card.textContent).toContain('80% used');
  });
});
