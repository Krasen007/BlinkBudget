// tests/utils/account-filter-utils.test.js
// Unit tests for the dashboard account filter helpers. The filter value can be
// 'all', a single account id, or 'type:<accountType>' (set by the Explore
// Accounts section in Reports).
import { describe, it, expect } from 'vitest';
import {
  buildAccountTypeFilter,
  getAccountTypeFromFilter,
  isAccountFilterValid,
  isAccountTypeFilter,
  normalizeAccountType,
  resolveAccountIdsForFilter,
  resolvePreferredAccountId,
  transactionMatchesAccountFilter,
} from '../../src/utils/account-filter-utils.js';

const ACCOUNTS = [
  { id: 'acc-checking', name: 'Main Checking', type: 'checking' },
  { id: 'acc-cash-1', name: 'Wallet', type: 'cash' },
  { id: 'acc-cash-2', name: 'Cash Jar', type: 'cash' },
  { id: 'acc-legacy', name: 'Old Card', type: 'credit card' },
];

describe('account filter value parsing', () => {
  it('builds and recognizes account-type filters', () => {
    expect(buildAccountTypeFilter('cash')).toBe('type:cash');
    expect(isAccountTypeFilter('type:cash')).toBe(true);
    expect(isAccountTypeFilter('all')).toBe(false);
    expect(isAccountTypeFilter('acc-cash-1')).toBe(false);
    expect(isAccountTypeFilter(null)).toBe(false);
  });

  it('extracts the account type from a filter', () => {
    expect(getAccountTypeFromFilter('type:cash')).toBe('cash');
    expect(getAccountTypeFromFilter('all')).toBeNull();
    expect(getAccountTypeFromFilter('acc-cash-1')).toBeNull();
  });

  it('normalizes the legacy "credit card" type to "credit"', () => {
    expect(normalizeAccountType('credit card')).toBe('credit');
    expect(normalizeAccountType('cash')).toBe('cash');
    expect(normalizeAccountType(undefined)).toBe('other');
  });
});

describe('resolveAccountIdsForFilter', () => {
  it('returns null for the all-accounts filter', () => {
    expect(resolveAccountIdsForFilter('all', ACCOUNTS)).toBeNull();
    expect(resolveAccountIdsForFilter(null, ACCOUNTS)).toBeNull();
  });

  it('resolves a single account id', () => {
    expect([...resolveAccountIdsForFilter('acc-cash-1', ACCOUNTS)]).toEqual([
      'acc-cash-1',
    ]);
  });

  it('resolves every account of a type', () => {
    expect([...resolveAccountIdsForFilter('type:cash', ACCOUNTS)].sort()).toEqual(
      ['acc-cash-1', 'acc-cash-2']
    );
  });

  it('resolves the legacy credit card type alias', () => {
    expect([...resolveAccountIdsForFilter('type:credit', ACCOUNTS)]).toEqual([
      'acc-legacy',
    ]);
  });

  it('resolves a type with no accounts to an empty set', () => {
    expect(resolveAccountIdsForFilter('type:savings', ACCOUNTS).size).toBe(0);
  });
});

describe('isAccountFilterValid', () => {
  it('accepts all/known accounts and known account types', () => {
    expect(isAccountFilterValid('all', ACCOUNTS)).toBe(true);
    expect(isAccountFilterValid('acc-checking', ACCOUNTS)).toBe(true);
    expect(isAccountFilterValid('type:cash', ACCOUNTS)).toBe(true);
  });

  it('rejects deleted accounts and types without accounts', () => {
    expect(isAccountFilterValid('deleted-acc', ACCOUNTS)).toBe(false);
    expect(isAccountFilterValid('type:savings', ACCOUNTS)).toBe(false);
  });
});

describe('transactionMatchesAccountFilter', () => {
  const cashTransaction = { accountId: 'acc-cash-1', toAccountId: null };
  const checkingTransaction = { accountId: 'acc-checking', toAccountId: null };
  const transferIntoCash = { accountId: 'acc-checking', toAccountId: 'acc-cash-2' };

  it('matches every transaction when the filter is all', () => {
    expect(
      transactionMatchesAccountFilter('all', ACCOUNTS, checkingTransaction)
    ).toBe(true);
  });

  it('matches only the selected account for a single account filter', () => {
    expect(
      transactionMatchesAccountFilter('acc-cash-1', ACCOUNTS, cashTransaction)
    ).toBe(true);
    expect(
      transactionMatchesAccountFilter(
        'acc-cash-1',
        ACCOUNTS,
        checkingTransaction
      )
    ).toBe(false);
  });

  it('matches any account of the selected type, including transfer targets', () => {
    expect(
      transactionMatchesAccountFilter('type:cash', ACCOUNTS, cashTransaction)
    ).toBe(true);
    expect(
      transactionMatchesAccountFilter('type:cash', ACCOUNTS, transferIntoCash)
    ).toBe(true);
    expect(
      transactionMatchesAccountFilter(
        'type:cash',
        ACCOUNTS,
        checkingTransaction
      )
    ).toBe(false);
  });

  it('does not match a missing transaction', () => {
    expect(transactionMatchesAccountFilter('type:cash', ACCOUNTS, null)).toBe(
      false
    );
  });
});

describe('resolvePreferredAccountId', () => {
  it('returns null when the filter covers several accounts', () => {
    expect(resolvePreferredAccountId('all', ACCOUNTS)).toBeNull();
    expect(resolvePreferredAccountId('type:cash', ACCOUNTS)).toBe('acc-cash-1');
  });

  it('returns the single filtered account id', () => {
    expect(resolvePreferredAccountId('acc-checking', ACCOUNTS)).toBe(
      'acc-checking'
    );
  });

  it('returns null for a stale account id', () => {
    expect(resolvePreferredAccountId('deleted-acc', ACCOUNTS)).toBeNull();
  });
});
