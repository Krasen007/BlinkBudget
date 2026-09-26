import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEYS } from '../../src/utils/constants.js';

// tests/setup.js replaces localStorage with bare vi.fn() spies whose getItem
// returns undefined for every key, so a set-then-get assertion can never pass.
// Install a real store locally instead of changing the shared double.
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  clear() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] ?? null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }

  get length() {
    return Object.keys(this.store).length;
  }

  key(index) {
    return Object.keys(this.store)[index] ?? null;
  }
}

const TRUNCATED = '{"clicks":3,';

describe('ClickTracker with a corrupt history value', () => {
  const storage = new LocalStorageMock();

  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('localStorage', storage);
    storage.clear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // Regression for #4.2: the guard checked the raw string, so a truncated value
  // left this.history === null and every push() threw — from AddView's
  // onSubmit, *before* TransactionService.add() saved the user's expense.
  it('recovers an array when the stored value is truncated JSON', async () => {
    localStorage.setItem(STORAGE_KEYS.CLICK_TRACKING, TRUNCATED);
    const { ClickTracker } =
      await import('../../src/core/click-tracking-service.js');

    expect(Array.isArray(ClickTracker.history)).toBe(true);
    expect(ClickTracker.history).toEqual([]);
  });

  it('completes the transaction flow instead of throwing on push', async () => {
    localStorage.setItem(STORAGE_KEYS.CLICK_TRACKING, TRUNCATED);
    const { ClickTracker } =
      await import('../../src/core/click-tracking-service.js');

    ClickTracker.startTransactionFlow();
    ClickTracker.recordClick();

    // The user symptom: TypeError: Cannot read properties of null (reading 'push')
    expect(() => ClickTracker.completeTransactionFlow()).not.toThrow();
    expect(ClickTracker.history).toHaveLength(1);
    expect(ClickTracker.history[0].clicks).toBe(1);
  });

  it('reads average metrics rather than throwing on length', async () => {
    localStorage.setItem(STORAGE_KEYS.CLICK_TRACKING, TRUNCATED);
    const { ClickTracker } =
      await import('../../src/core/click-tracking-service.js');

    expect(ClickTracker.getAverageMetrics()).toEqual({
      averageClicks: 0,
      averageDuration: 0,
      totalTransactions: 0,
    });
    expect(ClickTracker.getRecentTransactions()).toEqual([]);
  });

  it.each([
    ['a bare "null" literal', 'null'],
    ['a JSON object rather than an array', '{"clicks":3}'],
  ])('recovers an empty array for %s', async (_label, stored) => {
    localStorage.setItem(STORAGE_KEYS.CLICK_TRACKING, stored);
    const { ClickTracker } =
      await import('../../src/core/click-tracking-service.js');

    expect(ClickTracker.history).toEqual([]);
  });

  it('still loads a well-formed history', async () => {
    const seeded = [
      { clicks: 2, duration: 1.5, timestamp: 'now', date: 'now' },
    ];
    localStorage.setItem(STORAGE_KEYS.CLICK_TRACKING, JSON.stringify(seeded));
    const { ClickTracker } =
      await import('../../src/core/click-tracking-service.js');

    expect(ClickTracker.history).toEqual(seeded);
    expect(ClickTracker.getAverageMetrics().totalTransactions).toBe(1);
  });

  it('persists under the STORAGE_KEYS token with no hardcoded fallback', async () => {
    localStorage.setItem(STORAGE_KEYS.CLICK_TRACKING, TRUNCATED);
    const { ClickTracker } =
      await import('../../src/core/click-tracking-service.js');

    ClickTracker.clearHistory();

    expect(localStorage.getItem(STORAGE_KEYS.CLICK_TRACKING)).toBe('[]');
  });
});
