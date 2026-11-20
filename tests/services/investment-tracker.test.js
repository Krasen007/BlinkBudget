import { describe, it, expect, beforeEach } from 'vitest';
import { InvestmentTracker } from '../../src/core/investment-tracker.js';

describe('InvestmentTracker', () => {
  let tracker;

  beforeEach(() => {
    // Ensure a fresh tracker and clear storage
    localStorage.clear();
    tracker = new InvestmentTracker();
    tracker.clearAllInvestments();
  });

  it('performs CRUD operations', () => {
    const inv = tracker.addInvestment('AAPL', 10, 150, new Date('2023-01-01'));
    expect(inv).toBeTruthy();
    expect(inv.symbol).toBe('AAPL');
    expect(inv.shares).toBe(10);

    const all = tracker.getAllInvestments();
    expect(all.length).toBe(1);

    const found = tracker.getInvestment('AAPL');
    expect(found).toBeTruthy();
    expect(found.symbol).toBe('AAPL');

    const updated = tracker.updateInvestmentValue('AAPL', 210);
    expect(updated.currentPrice).toBe(210);

    const removed = tracker.removeInvestment('AAPL');
    expect(removed).toBe(true);
    expect(tracker.getAllInvestments().length).toBe(0);
  });

  it('calculates portfolio value and gains/losses', () => {
    tracker.addInvestment('AAA', 2, 50, new Date('2022-01-01'));
    tracker.updateInvestmentValue('AAA', 75);

    tracker.addInvestment('BBB', 5, 20, new Date('2022-06-01'));
    tracker.updateInvestmentValue('BBB', 18);

    const totalValue = tracker.calculatePortfolioValue();
    // AAA: 2*75=150, BBB:5*18=90 => total 240
    expect(totalValue).toBeCloseTo(240);

    const gains = tracker.calculateGainsLosses();
    expect(gains.totalCurrentValue).toBeCloseTo(240);
    expect(gains.individualGains.length).toBe(2);
    const aaa = gains.individualGains.find(i => i.symbol === 'AAA');
    expect(aaa.gainLoss).toBeCloseTo(150 - 100); // current - purchase
  });

  it('groups same-symbol purchases into one holding with average cost', () => {
    tracker.addInvestment('BTC', 1, 55000, new Date('2024-01-01'), {
      notes: 'first',
    });
    tracker.addInvestment('BTC', 1, 54500, new Date('2024-02-01'), {
      notes: 'second',
    });
    tracker.addInvestment('BTC', 1, 66000, new Date('2024-03-01'), {
      notes: 'third',
    });

    const holdings = tracker.getHoldingsGrouped();
    expect(holdings.length).toBe(1);

    const btc = holdings[0];
    expect(btc.symbol).toBe('BTC');
    expect(btc.lots.length).toBe(3);
    expect(btc.totalShares).toBe(3);
    expect(btc.totalInvested).toBeCloseTo(175500);
    // (55000 + 54500 + 66000) / 3
    expect(btc.averageCost).toBeCloseTo(58500);
    // current price falls back to purchase price per lot
    expect(btc.currentValue).toBeCloseTo(175500);
    expect(btc.totalGainLoss).toBeCloseTo(0);
  });

  it('computes holding gain/loss against average cost at current price', () => {
    tracker.addInvestment('BTC', 2, 55000, new Date('2024-01-01'));
    tracker.addInvestment('BTC', 1, 65000, new Date('2024-02-01'));
    tracker.updateInvestmentValue('BTC', 70000);

    const [btc] = tracker.getHoldingsGrouped();
    expect(btc.averageCost).toBeCloseTo((2 * 55000 + 65000) / 3);
    expect(btc.totalInvested).toBeCloseTo(175000);
    // First lot re-priced to 70000, second lot stays at its purchase price
    expect(btc.currentValue).toBeCloseTo(2 * 70000 + 65000);
    expect(btc.totalGainLoss).toBeCloseTo(btc.currentValue - btc.totalInvested);
  });

  it('removeInvestmentById removes a single lot and keeps siblings', () => {
    const a = tracker.addInvestment('AAA', 1, 10, new Date('2024-01-01'));
    tracker.addInvestment('AAA', 1, 20, new Date('2024-02-01'));
    tracker.addInvestment('BBB', 1, 30, new Date('2024-03-01'));

    expect(tracker.removeInvestmentById(a.id)).toBe(true);
    expect(tracker.getAllInvestments().length).toBe(2);

    const holdings = tracker.getHoldingsGrouped();
    const aaa = holdings.find(h => h.symbol === 'AAA');
    expect(aaa.lots.length).toBe(1);
    expect(aaa.totalShares).toBe(1);
    expect(aaa.averageCost).toBeCloseTo(20);

    expect(tracker.removeInvestmentById('does-not-exist')).toBe(false);
  });

  it('removeInvestment removes every lot for the symbol', () => {
    tracker.addInvestment('AAA', 1, 10, new Date('2024-01-01'));
    tracker.addInvestment('AAA', 2, 20, new Date('2024-02-01'));
    tracker.addInvestment('BBB', 1, 30, new Date('2024-03-01'));

    expect(tracker.removeInvestment('AAA')).toBe(true);
    const remaining = tracker.getAllInvestments();
    expect(remaining.length).toBe(1);
    expect(remaining[0].symbol).toBe('BBB');
    expect(tracker.removeInvestment('AAA')).toBe(false);
  });
});
