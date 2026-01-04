import { describe, it, expect, beforeEach } from 'vitest';
import { InvestmentTracker } from '../src/core/investment-tracker.js';

describe('InvestmentTracker', () => {
  let tracker;

  beforeEach(() => {
    // Ensure a fresh tracker and clear storage
    localStorage.clear();
    tracker = new InvestmentTracker();
    tracker.clearAllInvestments();
  });

  it('performs CRUD operations', () => {
    const inv = tracker.addInvestment('AAPL', 10, 150, new Date('2023-01-01'), { currentPrice: 200, assetClass: 'stocks', sector: 'tech' });
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
    tracker.addInvestment('AAA', 2, 50, new Date('2022-01-01'), { currentPrice: 75, assetClass: 'stocks' });
    tracker.addInvestment('BBB', 5, 20, new Date('2022-06-01'), { currentPrice: 18, assetClass: 'bonds' });

    const totalValue = tracker.calculatePortfolioValue();
    // AAA: 2*75=150, BBB:5*18=90 => total 240
    expect(totalValue).toBeCloseTo(240);

    const gains = tracker.calculateGainsLosses();
    expect(gains.totalCurrentValue).toBeCloseTo(240);
    expect(gains.individualGains.length).toBe(2);
    const aaa = gains.individualGains.find(i => i.symbol === 'AAA');
    expect(aaa.gainLoss).toBeCloseTo(150 - 100); // current - purchase
  });

  it('analyzes asset allocation', () => {
    tracker.addInvestment('S1', 1, 100, new Date(), { currentPrice: 100, assetClass: 'stocks' });
    tracker.addInvestment('B1', 2, 50, new Date(), { currentPrice: 50, assetClass: 'bonds' });

    const allocation = tracker.analyzeAssetAllocation();
    expect(allocation.totalValue).toBeGreaterThan(0);
    expect(Object.keys(allocation.allocations)).toContain('stocks');
    expect(Object.keys(allocation.allocations)).toContain('bonds');
    expect(allocation.percentages.stocks + allocation.percentages.bonds).toBeGreaterThan(0);
  });
});
