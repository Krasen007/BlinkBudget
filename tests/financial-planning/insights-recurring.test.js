import { describe, it, expect } from 'vitest';
import { createRecurringCard } from '../../src/views/financial-planning/insights-recurring.js';

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

/**
 * Five monthly Netflix charges ending May 1, 2026
 * @returns {Array}
 */
const netflixTransactions = () => [
  expense('n1', 'Netflix', 12.99, new Date(2026, 0, 1, 12)),
  expense('n2', 'Netflix', 12.99, new Date(2026, 0, 31, 12)),
  expense('n3', 'Netflix', 12.99, new Date(2026, 2, 2, 12)),
  expense('n4', 'Netflix', 12.99, new Date(2026, 3, 1, 12)),
  expense('n5', 'Netflix', 12.99, new Date(2026, 4, 1, 12)),
];

describe('createRecurringCard', () => {
  it('renders rows for detected recurring expenses', () => {
    const now = new Date(2026, 4, 10, 12); // next ≈ May 31 is still upcoming
    const card = createRecurringCard(
      { transactions: netflixTransactions() },
      now
    );

    expect(card.querySelector('.insights-card-title').textContent).toBe(
      'Recurring & Subscriptions'
    );
    const rows = card.querySelectorAll('.recurring-row');
    expect(rows).toHaveLength(1);
    expect(card.textContent).toContain('Netflix');
    expect(card.textContent).toContain('monthly');
    expect(card.textContent).toContain('12.99');
    expect(card.textContent).toContain('Next ≈ May 31');
  });

  it('shows an empty note when nothing qualifies', () => {
    const card = createRecurringCard({ transactions: [] });

    expect(card.querySelector('.insights-empty-note')).not.toBeNull();
    expect(card.querySelectorAll('.recurring-row')).toHaveLength(0);
  });

  it('shows the last-seen date once the next charge date has passed', () => {
    const now = new Date(2026, 5, 30, 12); // after next ≈ May 31
    const card = createRecurringCard(
      { transactions: netflixTransactions() },
      now
    );

    expect(card.textContent).toContain('Last: May 1');
    expect(card.textContent).not.toContain('Next ≈');
  });
});
