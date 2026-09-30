import { describe, it, expect, vi } from 'vitest';

/**
 * Regression tests: budgets are defined per month (period: 'monthly'), so
 * when the Reports view selects a longer period (quarter, year, custom
 * range) the monthly limit must be scaled to that period. Previously the
 * period's expenses were compared against a single month's limit — the
 * "budget set" showed one month while expenses covered the whole period,
 * flagging everything as wildly over budget.
 */

const BUDGETS = [
  {
    id: 'b1',
    categoryName: 'Food',
    amountLimit: 100, // monthly limit
    period: 'monthly',
    userId: 'user-1',
  },
  {
    id: 'b2',
    categoryName: 'Fuel',
    amountLimit: 50, // monthly limit
    period: 'monthly',
    userId: 'user-1',
  },
];

vi.mock('../../src/core/budget-service.js', () => ({
  BudgetService: {
    getAll: () => BUDGETS,
  },
}));

// Aggregate expenses per category, mirroring MetricsService semantics.
// The scaling under test depends only on the timePeriod passed to the
// planner, not on this aggregation.
vi.mock('../../src/core/analytics/MetricsService.js', () => ({
  MetricsService: {
    calculateCategoryBreakdown: transactions => {
      const totals = {};
      (transactions || []).forEach(t => {
        if (t.type === 'expense') {
          totals[t.category] = (totals[t.category] || 0) + Math.abs(t.amount);
        }
      });
      return {
        categories: Object.entries(totals).map(([name, amount]) => ({
          name,
          amount,
        })),
      };
    },
  },
}));

import { BudgetPlanner } from '../../src/core/budget-planner.js';

const monthPeriod = {
  type: 'monthly',
  startDate: new Date(2026, 3, 1),
  endDate: new Date(2026, 3, 30, 23, 59, 59, 999),
  label: 'April 2026',
};

const quarterPeriod = {
  type: 'quarterly',
  startDate: new Date(2026, 3, 1),
  endDate: new Date(2026, 5, 30, 23, 59, 59, 999),
  label: 'Q2 2026',
};

const yearPeriod = {
  type: 'yearly',
  startDate: new Date(2026, 0, 1),
  endDate: new Date(2026, 11, 31, 23, 59, 59, 999),
  label: '2026',
};

// Spending already scoped to the selected period (as ReportsView does)
const TRANSACTIONS = [
  { category: 'Food', type: 'expense', amount: 80 },
  { category: 'Fuel', type: 'expense', amount: 45 },
];

describe('BudgetPlanner.getPeriodMonths', () => {
  it('counts a single month as 1', () => {
    expect(BudgetPlanner.getPeriodMonths(monthPeriod)).toBe(1);
  });

  it('counts a quarter as 3', () => {
    expect(BudgetPlanner.getPeriodMonths(quarterPeriod)).toBe(3);
  });

  it('counts a year as 12', () => {
    expect(BudgetPlanner.getPeriodMonths(yearPeriod)).toBe(12);
  });

  it('counts calendar months covered for custom ranges', () => {
    const custom = {
      type: 'custom',
      startDate: new Date(2026, 1, 15),
      endDate: new Date(2026, 2, 20),
    };
    expect(BudgetPlanner.getPeriodMonths(custom)).toBe(2);
  });

  it('falls back to 1 for missing or invalid periods', () => {
    expect(BudgetPlanner.getPeriodMonths(null)).toBe(1);
    expect(BudgetPlanner.getPeriodMonths({})).toBe(1);
    expect(
      BudgetPlanner.getPeriodMonths({ startDate: 'not-a-date', endDate: 5 })
    ).toBe(1);
    // End before start -> invalid, treat as a single month
    expect(
      BudgetPlanner.getPeriodMonths({
        startDate: new Date(2026, 5, 1),
        endDate: new Date(2026, 3, 1),
      })
    ).toBe(1);
  });
});

describe('BudgetPlanner.getBudgetsStatus across periods', () => {
  it('keeps single-month periods unchanged (limit = monthly amountLimit)', () => {
    const status = BudgetPlanner.getBudgetsStatus(TRANSACTIONS, monthPeriod);
    const food = status.find(b => b.categoryName === 'Food');
    expect(food.periodLimit).toBe(100);
    expect(food.actual).toBe(80);
    expect(food.isExceeded).toBe(false);
    expect(food.remaining).toBe(20);
    expect(food.utilization).toBeCloseTo(80, 5);
    expect(food.isWarning).toBe(true);
  });

  it('scales the limit x3 for a quarter so period expenses are comparable', () => {
    // Food: 80 spent in the quarter vs 300 quarterly budget -> on track.
    // The old code compared 80... or worse, a full quarter's spend against
    // the 100 monthly limit and flagged it as over budget.
    const status = BudgetPlanner.getBudgetsStatus(TRANSACTIONS, quarterPeriod);
    const food = status.find(b => b.categoryName === 'Food');
    expect(food.periodLimit).toBe(300); // 100 x 3 months
    expect(food.amountLimit).toBe(100); // raw monthly value preserved
    expect(food.periodMonths).toBe(3);
    expect(food.actual).toBe(80);
    expect(food.isExceeded).toBe(false);
    expect(food.remaining).toBe(220);
  });

  it('flags as exceeded only when spending passes the scaled limit', () => {
    const heavy = [
      ...TRANSACTIONS,
      { category: 'Food', type: 'expense', amount: 250 }, // 330 total
    ];
    const status = BudgetPlanner.getBudgetsStatus(heavy, quarterPeriod);
    const food = status.find(b => b.categoryName === 'Food');
    expect(food.actual).toBe(330);
    expect(food.isExceeded).toBe(true); // 330 > 300, not 330 > 100
    expect(food.remaining).toBe(0);
  });

  it('scales a year period x12', () => {
    const status = BudgetPlanner.getBudgetsStatus(TRANSACTIONS, yearPeriod);
    const fuel = status.find(b => b.categoryName === 'Fuel');
    expect(fuel.periodLimit).toBe(600); // 50 x 12
    expect(fuel.remaining).toBe(555); // 600 - 45
  });

  it('defaults to the current month (factor 1) without a time period', () => {
    const status = BudgetPlanner.getBudgetsStatus(TRANSACTIONS);
    const food = status.find(b => b.categoryName === 'Food');
    expect(food.periodMonths).toBe(1);
    expect(food.periodLimit).toBe(food.amountLimit);
  });
});

describe('BudgetPlanner.getSummary across periods', () => {
  it('totals the scaled limits for multi-month periods', () => {
    const summary = BudgetPlanner.getSummary(TRANSACTIONS, quarterPeriod);
    // Food 100x3 + Fuel 50x3 = 450 for the quarter
    expect(summary.totalLimit).toBe(450);
    expect(summary.totalActual).toBe(125);
    expect(summary.periodMonths).toBe(3);
    expect(summary.overallUtilization).toBeCloseTo((125 / 450) * 100, 5);
    expect(summary.exceededCount).toBe(0);
  });

  it('keeps single-month summaries unchanged', () => {
    const summary = BudgetPlanner.getSummary(TRANSACTIONS, monthPeriod);
    expect(summary.totalLimit).toBe(150); // 100 + 50
    expect(summary.periodMonths).toBe(1);
  });
});
