/**
 * Category history strip tests.
 *
 * The strip answers "is this month normal for this category?" above the
 * transaction list, so its buckets have to follow the month filter's UTC terms,
 * net refunds out, and never invent a year of empty bars for a new account.
 */

import { describe, expect, it, vi } from 'vitest';
import {
  CategoryHistoryCard,
  buildCategoryHistory,
  MAX_HISTORY_MONTHS,
} from '../../src/components/CategoryHistoryCard.js';

const tx = (id, amount, category, timestamp, extra = {}) => ({
  id,
  amount,
  category,
  type: 'expense',
  timestamp,
  ...extra,
});

const END_NOV_2026 = new Date('2026-11-15T12:00:00.000Z');

describe('buildCategoryHistory', () => {
  it('buckets one category by month and nets refunds out', () => {
    const transactions = [
      tx('a', 20, 'Coffee', '2026-09-10T09:00:00.000Z'),
      tx('b', 10, 'Coffee', '2026-09-20T09:00:00.000Z'),
      tx('c', 30, 'Coffee', '2026-10-05T09:00:00.000Z', { type: 'refund' }),
      tx('d', 45.5, 'Coffee', '2026-10-06T09:00:00.000Z'),
      tx('e', 12.25, 'Coffee', '2026-11-02T09:00:00.000Z'),
      tx('f', 99, 'Food', '2026-11-03T09:00:00.000Z'),
      tx('g', 77, 'Coffee', '2026-11-04T09:00:00.000Z', { isGhost: true }),
      tx('h', 500, 'Coffee', '2026-11-05T09:00:00.000Z', { type: 'income' }),
    ];

    const history = buildCategoryHistory(transactions, 'Coffee', {
      endDate: END_NOV_2026,
    });

    expect(history.months.map(m => m.key)).toEqual([
      '2026-09',
      '2026-10',
      '2026-11',
    ]);
    expect(history.months.map(m => m.amount)).toEqual([30, 15.5, 12.25]);
    expect(history.months.map(m => m.count)).toEqual([2, 2, 1]);
    expect(history.total).toBeCloseTo(57.75, 2);
    expect(history.monthsWithData).toBe(3);
    expect(history.average).toBeCloseTo(19.25, 2);
    expect(history.maxAmount).toBe(30);
  });

  it('caps the window at 12 months but drops leading months with no history', () => {
    const transactions = [
      tx('old', 400, 'Coffee', '2024-01-15T09:00:00.000Z'),
      tx('new', 12, 'Coffee', '2026-11-02T09:00:00.000Z'),
    ];

    const history = buildCategoryHistory(transactions, 'Coffee', {
      endDate: END_NOV_2026,
    });

    // The 2024 entry is outside the window, so only November survives
    expect(MAX_HISTORY_MONTHS).toBe(12);
    expect(history.months).toHaveLength(1);
    expect(history.months[0].key).toBe('2026-11');
    expect(history.total).toBe(12);
  });

  it('keeps empty months that sit inside the range', () => {
    const transactions = [
      tx('apr', 10, 'Coffee', '2026-04-10T09:00:00.000Z'),
      tx('aug', 20, 'Coffee', '2026-08-10T09:00:00.000Z'),
    ];

    const history = buildCategoryHistory(transactions, 'Coffee', {
      endDate: END_NOV_2026,
    });

    expect(history.months.map(m => m.key)).toEqual([
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
      '2026-11',
    ]);
    expect(history.months.filter(m => m.count === 0)).toHaveLength(6);
    expect(history.monthsWithData).toBe(2);
  });

  it('ends the window on the month being viewed', () => {
    const transactions = [
      tx('jun', 10, 'Coffee', '2026-06-10T09:00:00.000Z'),
      tx('sep', 20, 'Coffee', '2026-09-10T09:00:00.000Z'),
    ];

    const history = buildCategoryHistory(transactions, 'Coffee', {
      endDate: new Date('2026-06-30T12:00:00.000Z'),
    });

    expect(history.months).toHaveLength(1);
    expect(history.months[0].key).toBe('2026-06');
    expect(history.total).toBe(10);
  });

  it('counts only income when asked for an income category', () => {
    const transactions = [
      tx('salary', 1000, 'Salary', '2026-11-01T09:00:00.000Z', {
        type: 'income',
      }),
      tx('spend', 40, 'Salary', '2026-11-02T09:00:00.000Z'),
    ];

    const history = buildCategoryHistory(transactions, 'Salary', {
      endDate: END_NOV_2026,
      type: 'income',
    });

    expect(history.total).toBe(1000);
    expect(history.months).toHaveLength(1);
  });

  it('ignores unparsable timestamps and unknown categories', () => {
    const transactions = [
      tx('bad', 50, 'Coffee', 'not-a-date'),
      tx('other', 60, 'Tea', '2026-11-02T09:00:00.000Z'),
    ];

    const history = buildCategoryHistory(transactions, 'Coffee', {
      endDate: END_NOV_2026,
    });

    expect(history.monthsWithData).toBe(0);
    expect(history.total).toBe(0);
  });

  describe('CategoryHistoryCard', () => {
    const transactions = [
      tx('a', 20, 'Coffee', '2026-09-10T09:00:00.000Z'),
      tx('b', 40, 'Coffee', '2026-10-10T09:00:00.000Z'),
      tx('c', 10, 'Coffee', '2026-11-10T09:00:00.000Z'),
      tx('d', 99, 'Food', '2026-11-11T09:00:00.000Z'),
    ];

    const build = (overrides = {}) =>
      CategoryHistoryCard({
        category: 'Coffee',
        transactions,
        endDate: END_NOV_2026,
        onMonthSelect: vi.fn(),
        ...overrides,
      });

    it('renders one bar per month with the tall month scaled to 100%', () => {
      const card = build();

      const bars = card.querySelectorAll('.category-history-bar');
      expect(bars).toHaveLength(3);
      expect([...bars].map(bar => bar.dataset.month)).toEqual([
        '2026-09',
        '2026-10',
        '2026-11',
      ]);
      expect(bars[1].style.getPropertyValue('--bar-height')).toBe('100.0%');
      expect(bars[0].style.getPropertyValue('--bar-height')).toBe('50.0%');
    });

    it('summarises the window in the header', () => {
      const card = build();

      expect(card.querySelector('.category-history-title').textContent).toBe(
        'Coffee'
      );
      const subtitle = card.querySelector(
        '.category-history-subtitle'
      ).textContent;
      expect(subtitle).toContain('Last 3 months');
      expect(subtitle).toContain('€70.00 spent');
      expect(subtitle).toContain('avg/month');
    });

    it('stamps the year on the first bar and on January only', () => {
      const card = build({
        endDate: new Date('2026-02-15T12:00:00.000Z'),
        transactions: [
          tx('dec', 5, 'Coffee', '2025-12-10T09:00:00.000Z'),
          tx('jan', 7, 'Coffee', '2026-01-10T09:00:00.000Z'),
          tx('feb', 9, 'Coffee', '2026-02-10T09:00:00.000Z'),
        ],
      });

      const labels = [
        ...card.querySelectorAll('.category-history-bar-label'),
      ].map(label => label.textContent);
      expect(labels).toEqual(['Dec ’25', 'Jan ’26', 'Feb']);
    });

    it('marks the active month and clears it on a second tap', () => {
      const onMonthSelect = vi.fn();
      const card = build({
        activeMonth: '2026-10-01T00:00:00.000Z',
        onMonthSelect,
      });

      const october = card.querySelector('[data-month="2026-10"]');
      expect(october.classList.contains('is-active')).toBe(true);
      expect(october.getAttribute('aria-pressed')).toBe('true');

      const september = card.querySelector('[data-month="2026-09"]');
      expect(september.getAttribute('aria-pressed')).toBe('false');

      september.click();
      expect(onMonthSelect).toHaveBeenCalledWith('2026-09-01T00:00:00.000Z');
    });

    it('labels each bar with the month and the amount', () => {
      const card = build();
      const october = card.querySelector('[data-month="2026-10"]');

      expect(october.getAttribute('aria-label')).toBe(
        'October 2026: €40.00 from 1 transaction'
      );
      expect(october.title).toBe('October 2026: €40.00 from 1 transaction');
    });

    it('marks refund-only months so they do not read as spending', () => {
      const card = build({
        transactions: [
          tx('refund', 15, 'Coffee', '2026-11-05T09:00:00.000Z', {
            type: 'refund',
          }),
        ],
      });

      const bar = card.querySelector('[data-month="2026-11"]');
      expect(bar.classList.contains('is-negative')).toBe(true);
      expect(bar.style.getPropertyValue('--bar-height')).toBe('0.0%');
      expect(bar.getAttribute('aria-label')).toBe(
        'November 2026: -€15.00 from 1 transaction'
      );
    });

    it('disables the bars when no month handler is supplied', () => {
      const card = build({ onMonthSelect: null });

      const bars = [...card.querySelectorAll('.category-history-bar')];
      expect(bars.every(bar => bar.disabled)).toBe(true);
      expect(card.querySelector('.category-history-hint')).toBeNull();
    });

    it('shows the tap hint when the bars are interactive', () => {
      const card = build();

      expect(card.querySelector('.category-history-hint').textContent).toBe(
        'Tap a month to filter the list below'
      );
    });

    it('returns null when the category has no history', () => {
      expect(build({ category: 'Travel' })).toBeNull();
      expect(build({ category: null })).toBeNull();
      expect(build({ transactions: [] })).toBeNull();
    });

    it('renders income history when asked for an income category', () => {
      const card = build({
        type: 'income',
        transactions: [
          tx('salary', 1000, 'Coffee', '2026-11-01T09:00:00.000Z', {
            type: 'income',
          }),
        ],
      });

      expect(
        card.querySelector('.category-history-subtitle').textContent
      ).toContain('€1,000.00 earned');
      expect(
        card.querySelector('.category-history-bars').getAttribute('aria-label')
      ).toBe('Income by month for Coffee');
    });
  });
});
