/**
 * Anomaly Markers Tests
 *
 * Guards the detectUnusualTransactions refund-guard fix (it previously
 * compared the category average against mean+3σ and could never pass, so
 * detection always returned []) and the buildPeriodMarkers tooltip helper.
 */

import { describe, it, expect } from 'vitest';
import { AnomalyService } from '../../src/core/analytics/AnomalyService.js';

/**
 * Expense fixture
 * @returns {Object}
 */
const expense = (id, amount, timestamp, category = 'Shopping') => ({
  id,
  amount,
  category,
  type: 'expense',
  timestamp,
});

/**
 * Ten regular €100 expenses plus one €600 spike on June 15, 2026
 * @returns {Array}
 */
const buildSpikeFixture = () => {
  const txs = [];
  for (let i = 0; i < 10; i++) {
    txs.push(expense(`e${i}`, 100, new Date(2026, 5, 1 + i, 12).toISOString()));
  }
  txs.push(expense('spike', 600, new Date(2026, 5, 15, 12).toISOString()));
  return txs;
};

describe('AnomalyService.detectUnusualTransactions', () => {
  it('flags a clear spending spike (refund-guard regression)', () => {
    const unusual =
      AnomalyService.detectUnusualTransactions(buildSpikeFixture());

    expect(unusual).toHaveLength(1);
    expect(unusual[0].id).toBe('spike');
    expect(unusual[0].unusualSpending.threshold).toBeGreaterThan(0);
    // The spike is several × the mean of the baseline
    expect(Number(unusual[0].unusualSpending.multiplier)).toBeGreaterThan(3);
  });

  it('suppresses the alert when same-category refunds net it below the threshold', () => {
    const txs = buildSpikeFixture()
      .filter(tx => tx.id !== 'spike')
      .concat([
        expense('spike', 900, new Date(2026, 5, 20, 12).toISOString()),
        {
          id: 'r1',
          amount: 70,
          category: 'Shopping',
          type: 'refund',
          timestamp: new Date(2026, 5, 21, 12).toISOString(),
        },
      ]);

    expect(AnomalyService.detectUnusualTransactions(txs)).toHaveLength(0);
  });

  it('needs a minimum number of expenses before flagging anything', () => {
    expect(
      AnomalyService.detectUnusualTransactions(buildSpikeFixture().slice(0, 3))
    ).toHaveLength(0);
  });
});

describe('AnomalyService.buildPeriodMarkers', () => {
  it('builds day/month/year counts for tooltip flags', () => {
    const markers = AnomalyService.buildPeriodMarkers(buildSpikeFixture());

    expect(markers.count).toBe(1);
    expect(markers.ids.has('spike')).toBe(true);
    expect(markers.byDay.get('2026-06-15')).toBe(1);
    expect(markers.byMonth.get('2026-06')).toBe(1);
    expect(markers.byYear.get('2026')).toBe(1);
  });

  it('ignores ghost transactions', () => {
    const txs = buildSpikeFixture();
    txs.push({
      ...expense('ghost-spike', 700, new Date(2026, 5, 25, 12).toISOString()),
      isGhost: true,
    });

    const markers = AnomalyService.buildPeriodMarkers(txs);

    expect(markers.ids.has('ghost-spike')).toBe(false);
    expect(markers.count).toBe(1);
  });

  it('returns empty markers for empty or missing input', () => {
    expect(AnomalyService.buildPeriodMarkers([]).count).toBe(0);
    expect(AnomalyService.buildPeriodMarkers(undefined).count).toBe(0);
  });
});
