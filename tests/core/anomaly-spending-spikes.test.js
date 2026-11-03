/**
 * Spending spike insight tests.
 *
 * Regression guard for the "Detected 2 unusually large transactions across 2
 * categories: Храна: €15.83, Заведения: €15.68" insight: two ordinary ~€15
 * purchases were reported as anomalies because the threshold was computed once
 * across every category, so a €15 lunch was compared against €1.65 bus tickets.
 * A category holding a single purchase also reported the nonsense "100.0% of
 * category spending".
 */

import { describe, expect, it } from 'vitest';
import { AnomalyService } from '../../src/core/analytics/AnomalyService.js';

/**
 * Expense fixture
 * @param {string} id - Transaction id
 * @param {number} amount - Amount in EUR
 * @param {string} category - Category name
 * @param {string} timestamp - ISO timestamp
 * @param {string} [description] - Optional note
 * @returns {Object} Transaction
 */
const expense = (id, amount, category, timestamp, description = '') => ({
  id,
  amount,
  category,
  type: 'expense',
  timestamp,
  description,
});

const NOVEMBER_2026 = {
  startDate: new Date('2026-11-01T00:00:00.000Z'),
  endDate: new Date('2026-11-30T23:59:59.999Z'),
};

/**
 * The month that produced the reported insight: two ~€15 purchases, each the
 * only purchase in its own category, surrounded by smaller, unrelated ones.
 * Total spend €49.85, so the pair is 63.2% of the month.
 * @returns {Array} Transactions
 */
const buildReportedFixture = () => [
  expense('t1', 15.83, 'Храна', '2026-11-01T10:00:00.000Z'),
  expense('t2', 15.68, 'Заведения', '2026-11-02T10:00:00.000Z'),
  expense('t3', 1.65, 'Транспорт', '2026-11-02T12:00:00.000Z'),
  expense('t4', 2.52, 'Сметки', '2026-11-03T09:00:00.000Z'),
  expense('t5', 4.99, 'Транспорт', '2026-11-03T18:00:00.000Z'),
  expense('t6', 5.06, 'Сметки', '2026-11-04T11:00:00.000Z'),
  expense('t7', 4.12, 'Разни', '2026-11-04T19:00:00.000Z'),
];

/**
 * Five regular purchases per category, plus one genuine outlier in Shopping and
 * one in Health.
 * @returns {Array} Transactions
 */
const buildSpikeFixture = () => {
  const transactions = [];
  for (let i = 0; i < 5; i++) {
    const day = String(i + 1).padStart(2, '0');
    transactions.push(
      expense(`shop${i}`, 40, 'Shopping', `2026-11-${day}T10:00:00.000Z`),
      expense(`food${i}`, 30, 'Food', `2026-11-${day}T12:00:00.000Z`),
      expense(`health${i}`, 25, 'Health', `2026-11-${day}T14:00:00.000Z`)
    );
  }
  transactions.push(
    expense(
      'laptop',
      450,
      'Shopping',
      '2026-11-06T10:00:00.000Z',
      'New laptop'
    ),
    expense(
      'dentist',
      260,
      'Health',
      '2026-11-07T10:00:00.000Z',
      'Dentist visit'
    )
  );
  return transactions;
};

describe('AnomalyService.detectSpendingSpikes', () => {
  it('does not flag ordinary purchases just because other categories are cheaper', () => {
    const transactions = buildReportedFixture();
    const expenses = transactions.filter(t => t.type === 'expense');

    expect(AnomalyService.detectSpendingSpikes(expenses, transactions)).toEqual(
      []
    );
  });

  it('reports no spike insight for the month that raised the false alarm', () => {
    const ids = AnomalyService.detectAnomalies(
      buildReportedFixture(),
      NOVEMBER_2026
    ).map(insight => insight.id);

    expect(ids.filter(id => id.startsWith('spending_spike'))).toEqual([]);
  });

  it('never treats a category with a single purchase as its own baseline', () => {
    const transactions = [
      ...[1, 2, 3, 4, 5].map(i =>
        expense(`food${i}`, 10, 'Food', `2026-11-0${i}T12:00:00.000Z`)
      ),
      // One-off large purchase: the only entry in its category, so there is no
      // normal range to deviate from.
      expense('rent', 900, 'Housing', '2026-11-06T09:00:00.000Z'),
    ];

    const ids = AnomalyService.detectAnomalies(transactions, NOVEMBER_2026).map(
      insight => insight.id
    );

    expect(ids).not.toContain('spending_spike_housing');
  });

  it('still flags a genuine outlier inside its own category', () => {
    const transactions = buildSpikeFixture();
    const insights = AnomalyService.detectSpendingSpikes(
      transactions,
      transactions
    );
    const shopping = insights.find(
      insight => insight.id === 'spending_spike_shopping'
    );

    expect(shopping).toBeDefined();
    expect(shopping.category).toBe('Shopping');
    expect(shopping.message).toContain('€450.00');
    expect(shopping.metadata.spikeTransactions.map(t => t.id)).toEqual([
      'laptop',
    ]);
    // Threshold sits above the category's regular €40 purchases, below the spike
    expect(shopping.metadata.threshold).toBeGreaterThan(40);
    expect(shopping.metadata.threshold).toBeLessThan(450);
    // Regressions here have produced "100.0% of category spending"
    expect(shopping.message).not.toContain('100.0%');
  });

  it('measures the spike against its own category, not against total spending', () => {
    const transactions = buildSpikeFixture();
    const insights = AnomalyService.detectSpendingSpikes(
      transactions,
      transactions
    );
    const shopping = insights.find(
      insight => insight.id === 'spending_spike_shopping'
    );
    const percentage = Number(
      shopping.message.match(/\(([\d.]+)% of category spending\)/)[1]
    );

    // Shopping holds 5 × €40 + €450 = €650, so €450 is 69.2% of that category
    expect(percentage).toBeCloseTo(69.2, 1);
    expect(percentage).toBeLessThanOrEqual(100);
  });

  it('names the purchase in the cross-category roll-up instead of the category', () => {
    const transactions = buildSpikeFixture();
    const insights = AnomalyService.detectSpendingSpikes(
      transactions,
      transactions
    );
    const summary = insights.find(
      insight => insight.id === 'spending_spikes_summary'
    );

    expect(summary).toBeDefined();
    expect(summary.message).toContain('2 unusually large transactions');
    expect(summary.message).toContain('New laptop (Shopping): €450.00');
    expect(summary.message).toContain('Dentist visit (Health): €260.00');
    expect(summary.metadata.spikeTransactions.map(t => t.id).sort()).toEqual([
      'dentist',
      'laptop',
    ]);
  });

  it('ignores ghost transactions in both the baseline and the spikes', () => {
    const transactions = buildSpikeFixture().concat({
      ...expense('ghost', 900, 'Shopping', '2026-11-08T10:00:00.000Z', 'Draft'),
      isGhost: true,
    });

    const insights = AnomalyService.detectSpendingSpikes(
      transactions,
      transactions
    );
    const flaggedIds = insights.flatMap(insight =>
      (insight.metadata.spikeTransactions || []).map(t => t.id)
    );

    expect(flaggedIds).not.toContain('ghost');
    expect(flaggedIds).toContain('laptop');
  });
});
