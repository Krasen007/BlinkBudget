import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../../src/core/auth-service.js', () => ({
  AuthService: {
    getUserId: () => 'test-user',
    isAuthenticated: () => true,
    hasAuthHint: () => false,
  },
}));

vi.mock('../../src/core/sync-service.js', () => ({
  SyncService: {
    pushToCloud: vi.fn(),
    pushToCloudSafe: vi.fn(),
    startRealtimeSync: vi.fn(),
    stopSync: vi.fn(),
    getStatus: vi.fn(() => ({})),
  },
}));

vi.mock('../../src/core/analytics/AnalyticsInstance.js', () => ({
  getAnalyticsEngine: () => ({ recordAmountPreset: vi.fn() }),
  resetAnalyticsEngine: vi.fn(),
}));

import { AccountService } from '../../src/core/Account/account-service.js';
import { TransactionService } from '../../src/core/transaction-service.js';
import { STORAGE_KEYS } from '../../src/utils/constants.js';

const ACCOUNTS_KEY = STORAGE_KEYS.ACCOUNTS;
const TRANSACTIONS_KEY = STORAGE_KEYS.TRANSACTIONS;

// Functional Map-backed storage so persistence actually round-trips.
const store = new Map();
const installStorage = () => {
  global.localStorage = {
    getItem: key => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: key => store.delete(key),
    clear: () => store.clear(),
    get length() {
      return store.size;
    },
    key: i => [...store.keys()][i] ?? null,
  };
};

describe('Phase A1: corrupt accounts recovery', () => {
  beforeEach(() => {
    store.clear();
    installStorage();
    TransactionService.clear();
    AccountService.clear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reseeds the default account when stored JSON is corrupt', () => {
    localStorage.setItem(ACCOUNTS_KEY, '{bad json');

    const accounts = AccountService.getAccounts();

    expect(accounts).toHaveLength(1);
    expect(accounts[0].id).toBe('main');
    expect(accounts[0].isDefault).toBe(true);
    // Recovery is persisted so the next read is clean.
    expect(JSON.parse(localStorage.getItem(ACCOUNTS_KEY))).toHaveLength(1);
  });

  it('reseeds when stored data parses to a non-array', () => {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify({ not: 'an array' }));

    const accounts = AccountService.getAccounts();

    expect(accounts).toHaveLength(1);
    expect(accounts[0].id).toBe('main');
  });

  it('getDefaultAccount never returns undefined after corruption', () => {
    localStorage.setItem(ACCOUNTS_KEY, '{bad json');

    const fallback = AccountService.getDefaultAccount();

    expect(fallback).toBeTruthy();
    expect(fallback.id).toBe('main');
  });

  it('TransactionService.getAll migrates account-less transactions after corruption', () => {
    localStorage.setItem(ACCOUNTS_KEY, '{bad json');
    localStorage.setItem(
      TRANSACTIONS_KEY,
      JSON.stringify([
        {
          id: 't1',
          amount: 10,
          category: 'Food',
          type: 'expense',
          timestamp: '2026-02-21T10:00:00.000Z',
        },
      ])
    );

    const transactions = TransactionService.getAll();

    expect(transactions).toHaveLength(1);
    expect(transactions[0].accountId).toBe('main');
  });

  it('TransactionService.add succeeds when accounts were corrupt', () => {
    localStorage.setItem(ACCOUNTS_KEY, '{bad json');

    const added = TransactionService.add({
      amount: 25,
      category: 'Food',
      type: 'expense',
    });

    expect(added.accountId).toBe('main');
    expect(AccountService.getAccounts()).toHaveLength(1);
  });

  it('account reads return copies and account writes read current storage', () => {
    const initialAccounts = [
      { id: 'a', name: 'Cash', type: 'cash', isDefault: true },
      { id: 'b', name: 'Card', type: 'card', isDefault: false },
    ];
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(initialAccounts));

    const accounts = AccountService.getAccounts();
    accounts[0].name = 'Mutated';
    accounts.push({ id: 'caller-only' });
    expect(AccountService.getAccounts()).toEqual(initialAccounts);

    const currentAccounts = [
      ...initialAccounts,
      { id: 'external', name: 'External', type: 'cash', isDefault: false },
    ];
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(currentAccounts));
    AccountService.saveAccount({
      id: 'new',
      name: 'New account',
      type: 'bank',
      isDefault: false,
    });

    expect(
      JSON.parse(localStorage.getItem(ACCOUNTS_KEY)).map(a => a.id)
    ).toEqual(['a', 'b', 'external', 'new']);
  });

  it('account deletion preserves accounts added after the read cache was filled', () => {
    const cachedAccounts = [
      { id: 'a', name: 'Cash', type: 'cash', isDefault: true },
      { id: 'b', name: 'Card', type: 'card', isDefault: false },
    ];
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(cachedAccounts));
    AccountService.getAccounts();

    localStorage.setItem(
      ACCOUNTS_KEY,
      JSON.stringify([
        ...cachedAccounts,
        { id: 'external', name: 'External', type: 'bank', isDefault: false },
      ])
    );
    expect(AccountService.deleteAccount('b')).toBe(true);
    expect(
      JSON.parse(localStorage.getItem(ACCOUNTS_KEY)).map(a => a.id)
    ).toEqual(['a', 'external']);
  });

  it('transaction reads return copies and add reads current storage', () => {
    const initialTransactions = [
      {
        id: 'original',
        amount: 10,
        type: 'expense',
        accountId: 'main',
        tags: ['original-tag'],
      },
    ];
    localStorage.setItem(
      ACCOUNTS_KEY,
      JSON.stringify([
        {
          id: 'main',
          name: 'Cash',
          type: 'cash',
          isDefault: true,
        },
      ])
    );
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(initialTransactions));

    const transactions = TransactionService.getAll();
    transactions[0].amount = 999;
    transactions[0].tags[0] = 'mutated-tag';
    transactions.push({ id: 'caller-only' });

    const currentTransactions = [
      ...initialTransactions,
      {
        id: 'external',
        amount: 20,
        type: 'expense',
        accountId: 'main',
      },
    ];
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(currentTransactions));

    TransactionService.add({
      amount: 30,
      type: 'income',
      accountId: 'main',
    });

    const persistedTransactions = JSON.parse(
      localStorage.getItem(TRANSACTIONS_KEY)
    );
    expect(persistedTransactions.map(transaction => transaction.id)).toEqual(
      expect.arrayContaining(['original', 'external'])
    );
    expect(persistedTransactions.find(t => t.id === 'original')).toMatchObject({
      amount: 10,
      tags: ['original-tag'],
    });
    expect(persistedTransactions).toHaveLength(3);
  });
});
