/**
 * Key Takeaways Tests
 *
 * Verifies the textual takeaway feed renders the top severity insights for
 * the selected month, caps at three cards, and tracks month navigation.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { createTakeawaysSection } from '../../src/views/financial-planning/insights-takeaways.js';

const now = new Date();

const dateInMonth = (monthOffset, day) =>
  new Date(
    now.getFullYear(),
    now.getMonth() + monthOffset,
    day,
    12
  ).toISOString();

describe('createTakeawaysSection', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('renders at most three insight cards for the current month', () => {
    const transactions = [
      {
        id: 't1',
        amount: 500,
        category: 'Food',
        type: 'expense',
        timestamp: dateInMonth(0, 3),
      },
      {
        id: 't2',
        amount: 10,
        category: 'Food',
        type: 'expense',
        timestamp: dateInMonth(0, 4),
      },
      {
        id: 't3',
        amount: 2000,
        category: 'Salary',
        type: 'income',
        timestamp: dateInMonth(0, 1),
      },
    ];

    const { element } = createTakeawaysSection({ transactions }, { offset: 0 });
    document.body.append(element);

    expect(element.querySelector('.insights-card-title').textContent).toBe(
      'Key Takeaways'
    );
    const cards = element.querySelectorAll(
      '.insights-takeaways-list .insight-card'
    );
    expect(cards.length).toBeGreaterThan(0);
    expect(cards.length).toBeLessThanOrEqual(3);
  });

  it('shows an empty note when the month has no activity', () => {
    const { element } = createTakeawaysSection(
      { transactions: [] },
      { offset: 0 }
    );
    document.body.append(element);

    expect(element.querySelector('.insights-takeaways-empty')).not.toBeNull();
  });

  it('updates the month label when the shared month changes', () => {
    const transactions = [
      {
        id: 't1',
        amount: 50,
        category: 'Food',
        type: 'expense',
        timestamp: dateInMonth(0, 2),
      },
    ];
    const sharedMonthState = { offset: 0 };
    const { element, render } = createTakeawaysSection(
      { transactions },
      sharedMonthState
    );
    document.body.append(element);

    const subtitle = element.querySelector('.insights-card-subtitle');
    const currentLabel = now.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
    expect(subtitle.textContent).toBe(currentLabel);

    sharedMonthState.offset = -1;
    render();

    const previousLabel = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    ).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    expect(subtitle.textContent).toBe(previousLabel);
  });
});
