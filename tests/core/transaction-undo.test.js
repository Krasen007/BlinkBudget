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

vi.mock('../../src/core/Account/account-service.js', () => ({
  AccountService: {
    getDefaultAccount: () => ({ id: 'main', name: 'Main Account' }),
    getAccounts: () => [],
    isAccountDuplicate: () => false,
  },
}));

vi.mock('../../src/core/analytics/AnalyticsInstance.js', () => ({
  getAnalyticsEngine: () => ({ recordAmountPreset: vi.fn() }),
  resetAnalyticsEngine: vi.fn(),
}));

import { TransactionService } from '../../src/core/transaction-service.js';
import { SyncService } from '../../src/core/sync-service.js';
import { notifyTransactionDeleted } from '../../src/utils/transaction-undo.js';
import { clearAllToasts } from '../../src/utils/toast-notifications.js';
import { STORAGE_KEYS } from '../../src/utils/constants.js';

const TRANSACTIONS_KEY = STORAGE_KEYS.TRANSACTIONS;

// tests/setup.js installs inert vi.fn() storage stubs — replace with a
// functional Map-backed implementation so persistence actually round-trips.
const store = new Map();
const sessionStorageStore = new Map();
const installStorage = () => {
  global.localStorage = {
    getItem: key => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: key => store.delete(key),
    clear: () => store.clear(),
  };
  global.sessionStorage = {
    getItem: key =>
      sessionStorageStore.has(key) ? sessionStorageStore.get(key) : null,
    setItem: (key, value) => sessionStorageStore.set(key, String(value)),
    removeItem: key => sessionStorageStore.delete(key),
    clear: () => sessionStorageStore.clear(),
  };
};

const seed = transactions => {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
};

const readAll = () =>
  JSON.parse(localStorage.getItem(TRANSACTIONS_KEY) || '[]');

const baseTx = (id, overrides = {}) => ({
  id,
  amount: 10,
  category: 'Храна',
  type: 'expense',
  accountId: 'main',
  timestamp: '2026-02-21T10:00:00.000Z',
  userId: 'test-user',
  ...overrides,
});

describe('TransactionService remove/restore (undo)', () => {
  beforeEach(() => {
    store.clear();
    installStorage();
    vi.clearAllMocks();
  });

  it('remove() returns the removed entry with its original index', () => {
    seed([baseTx('a'), baseTx('b'), baseTx('c')]);

    const removed = TransactionService.remove('b');

    expect(removed).toEqual([{ transaction: baseTx('b'), index: 1 }]);
    expect(readAll().map(t => t.id)).toEqual(['a', 'c']);
    expect(SyncService.pushToCloudSafe).toHaveBeenCalledTimes(1);
  });

  it('remove() cascades the linked ghost and returns both entries', () => {
    seed([
      baseTx('ghost', { isGhost: true, movedToDate: '2026-03-01' }),
      baseTx('main', { ghostId: 'ghost' }),
    ]);

    const removed = TransactionService.remove('main');

    expect(removed.map(entry => entry.transaction.id)).toEqual([
      'main',
      'ghost',
    ]);
    expect(readAll()).toEqual([]);
  });

  it('remove() returns null for an unknown id', () => {
    seed([baseTx('a')]);

    expect(TransactionService.remove('nope')).toBeNull();
    expect(readAll().map(t => t.id)).toEqual(['a']);
  });

  it('restore() re-inserts the exact object at its original position', () => {
    seed([baseTx('a'), baseTx('b'), baseTx('c')]);
    const removed = TransactionService.remove('b');
    const listener = vi.fn();
    window.addEventListener('storage-updated', listener);

    const ok = TransactionService.restore(removed);

    expect(ok).toBe(true);
    expect(readAll()).toEqual([baseTx('a'), baseTx('b'), baseTx('c')]);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(SyncService.pushToCloudSafe).toHaveBeenCalledWith(
      TRANSACTIONS_KEY,
      expect.any(Array)
    );
    window.removeEventListener('storage-updated', listener);
  });

  it('restore() skips transactions that already exist (no duplicates)', () => {
    seed([baseTx('a')]);

    const ok = TransactionService.restore([
      { transaction: baseTx('a'), index: 0 },
    ]);

    expect(ok).toBe(false);
    expect(readAll()).toHaveLength(1);
  });

  it('restore() returns false for empty or missing input', () => {
    expect(TransactionService.restore([])).toBe(false);
    expect(TransactionService.restore(null)).toBe(false);
  });
});

describe('notifyTransactionDeleted (undo toast)', () => {
  beforeEach(() => {
    store.clear();
    sessionStorageStore.clear();
    installStorage();
    vi.clearAllMocks();
    vi.useFakeTimers();
    clearAllToasts();
    vi.advanceTimersByTime(300); // flush pending toast removals
  });

  afterEach(() => {
    clearAllToasts();
    vi.advanceTimersByTime(300);
    vi.useRealTimers();
  });

  it('shows a "Transaction deleted [Undo]" toast that restores on click', () => {
    seed([baseTx('a'), baseTx('b')]);
    const removed = TransactionService.remove('b');
    expect(readAll().map(t => t.id)).toEqual(['a']);

    const toastId = notifyTransactionDeleted(removed);
    expect(toastId).toBeTruthy();

    const toast = document.getElementById(toastId);
    expect(toast).not.toBeNull();
    expect(toast.textContent).toContain('Transaction deleted');

    // Muted hint style, pinned to the bottom edge
    expect(toast.classList.contains('toast-neutral')).toBe(true);
    expect(toast.classList.contains('toast-bottom')).toBe(true);
    expect(toast.closest('.toast-container-bottom')).not.toBeNull();
    expect(toast.querySelector('.toast-icon')).toBeNull(); // no loud icon

    const undoBtn = toast.querySelector('.toast-action');
    expect(undoBtn).not.toBeNull();
    expect(undoBtn.textContent).toBe('Undo');

    undoBtn.click();
    expect(readAll().map(t => t.id)).toEqual(['a', 'b']);

    // Restored rows get the same green-highlight treatment as add/edit
    expect(sessionStorage.getItem('highlightTransactionId')).toBe('b');
  });

  it('auto-dismisses after the undo window without restoring', () => {
    seed([baseTx('a'), baseTx('b')]);
    const removed = TransactionService.remove('b');
    notifyTransactionDeleted(removed);

    vi.advanceTimersByTime(5300); // 5s undo window + exit animation

    expect(readAll().map(t => t.id)).toEqual(['a']); // still deleted
    expect(document.querySelector('.toast-action')).toBeNull();
  });

  it('returns null when there is nothing to undo', () => {
    expect(notifyTransactionDeleted(null)).toBeNull();
    expect(notifyTransactionDeleted([])).toBeNull();
    expect(document.querySelector('.toast')).toBeNull();
  });
});
