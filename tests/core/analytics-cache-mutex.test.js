// tests/core/analytics-cache-mutex.test.js
// Regression guard: AnalyticsCache._acquireLock must hand out ownership
// without becoming an awaitable that never settles.
//
// It used to `return this._lockPromise`. That promise only settles in
// _releaseLock(), which only runs in the caller's `finally` — i.e. only after
// the `await this._acquireLock()` that can never complete. The lock was
// therefore taken on the first persistent write and never released, so every
// later write and every invalidate() queued behind it forever.
//
// Security relevance: invalidate() is how DashboardView drops user-specific
// planning data on an auth switch. Deadlocked, it silently never ran, so the
// previous user's goals stayed in localStorage on a shared device.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AnalyticsCache } from '../../src/core/analytics/AnalyticsCache.js';

const PERSISTENT_KEY = 'blinkbudget_analytics_analytics_cache';

// Resolves 'settled' if p wins the race, 'DEADLOCK' if the timer does.
const settlesWithin = (p, ms = 300) =>
  Promise.race([
    p.then(
      () => 'settled',
      () => 'rejected'
    ),
    new Promise(r => setTimeout(() => r('DEADLOCK'), ms)),
  ]);

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

describe('AnalyticsCache persistent-layer mutex', () => {
  let cache;

  beforeEach(() => {
    vi.stubGlobal('localStorage', new LocalStorageMock());
    cache = new AnalyticsCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('releases the lock so a second persistent write is not stranded', async () => {
    const first = await settlesWithin(cache.setToPersistentStorage('key_a', 1));
    expect(first).toBe('settled');

    const second = await settlesWithin(
      cache.setToPersistentStorage('key_b', 2)
    );
    expect(second).toBe('settled');

    // Both keys must survive: a stranded second write is the exact symptom
    // of the lock never being released.
    const stored = JSON.parse(localStorage.getItem(PERSISTENT_KEY)).data;
    expect(Object.keys(stored).sort()).toEqual(['key_a', 'key_b']);
  });

  it('does not lose a concurrent write (read-modify-write under the lock)', async () => {
    await Promise.all([
      cache.setToPersistentStorage('concurrent_a', 'A'),
      cache.setToPersistentStorage('concurrent_b', 'B'),
    ]);

    const stored = JSON.parse(localStorage.getItem(PERSISTENT_KEY)).data;
    expect(Object.keys(stored).sort()).toEqual([
      'concurrent_a',
      'concurrent_b',
    ]);
  });

  it('lets invalidate() remove a key from the persistent layer', async () => {
    await cache.setToPersistentStorage('financial_planning_preload', {
      goals: ['user-A-private-goal'],
    });
    expect(
      JSON.parse(localStorage.getItem(PERSISTENT_KEY)).data
        .financial_planning_preload
    ).toBeDefined();

    const keys = cache.getMatchingKeys('financial_planning_preload');
    expect(
      await settlesWithin(cache.invalidate('financial_planning_preload', keys))
    ).toBe('settled');

    // The cross-user data-bleed assertion: the previous user's planning data
    // must be gone from disk, not merely from memory.
    expect(
      JSON.parse(localStorage.getItem(PERSISTENT_KEY)).data
        .financial_planning_preload
    ).toBeUndefined();
  });
});
