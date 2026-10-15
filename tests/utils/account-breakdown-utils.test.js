// tests/utils/account-breakdown-utils.test.js
// Tests for the per-account-type aggregation powering "Explore Accounts".
import { describe, it, expect } from 'vitest';
import { buildAccountTypeBreakdown } from '../../src/utils/account-breakdown-utils.js';

const PERIOD = {
  startDate: new Date('2026-09-01T00:00:00.000Z'),
  endDate: new Date('2026-09-30T23:59:59.999Z'),
};

const ACCOUNTS = [
  { id: 'acc-checking', name: 'Main Checking', type: 'checking' },
  { id: 'acc-cash-1', name: 'Wallet', type: 'cash' },
  { id: 'acc-cash-2', name: 'Cash Jar', type: 'cash' },
  { id: 'acc-savings', name: 'Savings', type: 'savings' },
];

const tx = (overrides = {}) => ({
  id: 'tx',
  amount: 10,
  type: 'expense',
  accountId: 'acc-checking',
  toAccountId: null,
  timestamp: '2026-09-10T10:00:00.000Z',
  ...overrides,
});

describe('buildAccountTypeBreakdown', () => {
  it('aggregates every account of a type into a single entry', () => {
    const breakdown = buildAccountTypeBreakdown({
      transactions: [
        tx({ id: 'a', amount: 30, accountId: 'acc-cash-1' }),
        tx({ id: 'b', amount: 20, accountId: 'acc-cash-2' }),
      ],
      timePeriod: PERIOD,
      accounts: ACCOUNTS,
    });

    expect(breakdown).toHaveLength(1);
    expect(breakdown[0]).toMatchObject({
      name: 'Cash',
      type: 'cash',
      amount: 50,
      transactionCount: 2,
      accountCount: 2,
      isAccountType: true,
    });
  });

  it('subtracts refunds and computes the share of period expenses', () => {
    const breakdown = buildAccountTypeBreakdown({
      transactions: [
        tx({ id: 'a', amount: 80, accountId: 'acc-cash-1' }),
        tx({ id: 'b', amount: 40, type: 'refund', accountId: 'acc-cash-1' }),
        tx({ id: 'c', amount: 60, accountId: 'acc-checking' }),
      ],
      timePeriod: PERIOD,
      accounts: ACCOUNTS,
    });

    const cash = breakdown.find(entry => entry.type === 'cash');
    // 80 - 40 = 40 out of 100 total expenses
    expect(cash.amount).toBe(40);
    expect(cash.transactionCount).toBe(2);
    expect(cash.percentage).toBeCloseTo(40);

    const checking = breakdown.find(entry => entry.type === 'checking');
    expect(checking.percentage).toBeCloseTo(60);
  });

  it('counts transfers for both sides without adding to spending', () => {
    const breakdown = buildAccountTypeBreakdown({
      transactions: [
        tx({
          id: 'transfer',
          amount: 25,
          type: 'transfer',
          accountId: 'acc-checking',
          toAccountId: 'acc-cash-1',
        }),
      ],
      timePeriod: PERIOD,
      accounts: ACCOUNTS,
    });

    expect(breakdown.map(entry => entry.type).sort()).toEqual([
      'cash',
      'checking',
    ]);
    breakdown.forEach(entry => {
      expect(entry.amount).toBe(0);
      expect(entry.transactionCount).toBe(1);
    });
  });

  it('omits account types without activity in the period', () => {
    const breakdown = buildAccountTypeBreakdown({
      transactions: [tx({ id: 'a', accountId: 'acc-cash-1' })],
      timePeriod: PERIOD,
      accounts: ACCOUNTS,
    });

    expect(breakdown.map(entry => entry.type)).toEqual(['cash']);
  });

  it('ignores transactions outside the period and ghost copies', () => {
    const breakdown = buildAccountTypeBreakdown({
      transactions: [
        tx({
          id: 'outside',
          accountId: 'acc-cash-1',
          timestamp: '2026-10-02T10:00:00.000Z',
        }),
        tx({
          id: 'ghost',
          accountId: 'acc-cash-1',
          isGhost: true,
          timestamp: '2026-09-10T10:00:00.000Z',
        }),
      ],
      timePeriod: PERIOD,
      accounts: ACCOUNTS,
    });

    expect(breakdown).toEqual([]);
  });

  it('returns an empty list without a usable time period', () => {
    expect(
      buildAccountTypeBreakdown({
        transactions: [tx()],
        timePeriod: null,
        accounts: ACCOUNTS,
      })
    ).toEqual([]);
  });
});
