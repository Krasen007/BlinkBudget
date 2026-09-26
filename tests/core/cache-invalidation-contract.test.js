// tests/core/cache-invalidation-contract.test.js
// Regression tests for #15.1: analyticsCache.invalidate() was called at 13
// sites without awaiting and without capturing keys.
//
// Mechanism verified against source: invalidate() is `async` and its first
// statement is `await this._acquireLock()` (AnalyticsCache.js), so the whole
// deletion body runs in a later microtask. Two consequences, both covered here:
//
//   1. Rule #15B — an unawaited call has deleted nothing by the time the
//      caller's next synchronous statement runs, so a same-tick read still
//      sees the stale entry.
//   2. Rule #15C — invalidate() derives its deletion set from the in-memory
//      map unless keys are passed in. Chaining invalidateSync() then
//      invalidate() with no capture re-derives an empty set and never purges
//      the persistent layer, so a fresh page load re-hydrates the ghost.
//
// Note this is NOT the #15E self-deadlock: _acquireLock() returns undefined
// and releases correctly. The defect is ordering, not a stuck lock.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { analyticsCache } from '../../src/core/analytics/AnalyticsCache.js';
import { CacheInvalidator } from '../../src/core/cache-invalidator.js';
import { STORAGE_KEYS } from '../../src/utils/constants.js';

const PERSISTENT_KEY = 'blinkbudget_analytics_analytics_cache';

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

const readPersisted = () =>
  JSON.parse(localStorage.getItem(PERSISTENT_KEY) || '{}').data || {};

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

const fireStorageUpdated = key =>
  window.dispatchEvent(new CustomEvent('storage-updated', { detail: { key } }));

describe('cache invalidation contract (#15.1)', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', new LocalStorageMock());
    analyticsCache.clearAll();
    CacheInvalidator.destroy();
    CacheInvalidator.init();
  });

  afterEach(() => {
    CacheInvalidator.destroy();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('invalidateInBackground', () => {
    // Rule #15B: the point of the helper is that the in-memory map is clear
    // *synchronously*, before the caller's next statement.
    it('clears the in-memory entry before returning', () => {
      analyticsCache.set('portfolioSummary', { stale: true }, 30000);
      expect(analyticsCache.get('portfolioSummary')).toEqual({ stale: true });

      analyticsCache.invalidateInBackground('portfolioSummary');

      expect(analyticsCache.get('portfolioSummary')).toBeNull();
    });

    // Rule #15C: without captured keys the async pass re-derives an empty set
    // from the just-emptied map and the persistent ghost survives.
    it('purges the persistent layer as well', async () => {
      analyticsCache.set('portfolioSummary', { stale: true }, 30000);
      analyticsCache.invalidateInBackground('portfolioSummary');
      await flush();

      expect(readPersisted().portfolioSummary).toBeUndefined();
    });

    it('survives a fresh instance reading from disk only', async () => {
      analyticsCache.set('portfolioSummary', { stale: true }, 30000);
      analyticsCache.invalidateInBackground('portfolioSummary');
      await flush();

      // Empty memory, localStorage only: the ghost must not re-hydrate.
      analyticsCache.cache.clear();
      analyticsCache.cacheTimestamps.clear();
      analyticsCache._expiresAt.clear();

      expect(analyticsCache.get('portfolioSummary')).toBeNull();
    });

    it('never rejects, so a fire-and-forget caller is safe', async () => {
      const spy = vi
        .spyOn(analyticsCache, 'invalidate')
        .mockRejectedValue(new Error('simulated persistent failure'));
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await expect(
        analyticsCache.invalidateInBackground('goalsSummary')
      ).resolves.toBeUndefined();
      expect(warn).toHaveBeenCalled();

      spy.mockRestore();
    });

    it('leaves non-matching keys alone', () => {
      analyticsCache.set('goalsSummary', { keep: true }, 30000);
      analyticsCache.set('portfolioSummary', { drop: true }, 30000);

      analyticsCache.invalidateInBackground('portfolioSummary');

      expect(analyticsCache.get('goalsSummary')).toEqual({ keep: true });
    });
  });

  describe('CacheInvalidator write paths', () => {
    it.each([
      [STORAGE_KEYS.INVESTMENTS, 'portfolioSummary'],
      [STORAGE_KEYS.GOALS, 'goalsSummary'],
    ])('drops %s summaries synchronously', (storageKey, pattern) => {
      analyticsCache.set(pattern, { stale: true }, 30000);

      fireStorageUpdated(storageKey);

      expect(analyticsCache.get(pattern)).toBeNull();
    });

    it.each([
      [STORAGE_KEYS.INVESTMENTS, 'portfolioSummary'],
      [STORAGE_KEYS.GOALS, 'goalsSummary'],
    ])('purges %s summaries from the persistent layer', async (sKey, pat) => {
      analyticsCache.set(pat, { stale: true }, 30000);

      fireStorageUpdated(sKey);
      await flush();

      expect(readPersisted()[pat]).toBeUndefined();
    });

    it('drops forecast_ keys synchronously on an accounts write', () => {
      analyticsCache.set('forecast_monthly', { stale: true }, 30000);

      fireStorageUpdated(STORAGE_KEYS.ACCOUNTS);

      expect(analyticsCache.get('forecast_monthly')).toBeNull();
    });

    it('purges forecast_ keys from the persistent layer on accounts write', async () => {
      analyticsCache.set('forecast_monthly', { stale: true }, 30000);

      fireStorageUpdated(STORAGE_KEYS.ACCOUNTS);
      await flush();

      expect(readPersisted().forecast_monthly).toBeUndefined();
    });

    it('drops cached reports analytics on a transactions write', () => {
      const stamp = new Date().toISOString();
      const periodKey = `analytics_reports_${stamp}_${stamp}`;
      analyticsCache.set(periodKey, { categoryBreakdown: {} }, 30000);

      fireStorageUpdated(STORAGE_KEYS.TRANSACTIONS);

      expect(analyticsCache.get(periodKey)).toBeNull();
    });

    it('ignores unrelated storage keys', () => {
      analyticsCache.set('portfolioSummary', { keep: true }, 30000);

      fireStorageUpdated(STORAGE_KEYS.SETTINGS);

      expect(analyticsCache.get('portfolioSummary')).toEqual({ keep: true });
    });
  });

  // The 13th call site — missed by the audit that produced the finding, and
  // the one with a confirmed same-tick stale read. clearPlanningCache() is
  // followed by loadPlanningData() on the very next line, which consults
  // getCachedPlanningData() -> analyticsCache.get(PLANNING_CACHE_KEY). With a
  // plain unawaited invalidate() the entry is still in the in-memory map at
  // that moment, so the reload serves the data it was told to discard.
  //
  // These call invalidateInBackground() directly rather than rendering the
  // view: a test that bypasses the call site cannot detect a regression in it
  // (verified by reverting FinancialPlanningView.js and watching this block
  // still pass). The view-level wiring is covered separately, below.
  describe('FinancialPlanningView planning-cache reload', () => {
    const PLANNING_CACHE_KEY = 'financial_planning_data';

    it('does not serve the stale entry to an immediate reload', async () => {
      const stale = { goals: ['user-A-private-goal'] };
      analyticsCache.set(PLANNING_CACHE_KEY, stale, 5 * 60 * 1000);
      expect(analyticsCache.get(PLANNING_CACHE_KEY)).toEqual(stale);

      // Exactly what handleStorageUpdate does: clear, then reload.
      analyticsCache.invalidateInBackground(PLANNING_CACHE_KEY);
      const reloaded = analyticsCache.get(PLANNING_CACHE_KEY);

      expect(reloaded).toBeNull();
      await flush();
    });

    it('purges the planning cache from the persistent layer too', async () => {
      analyticsCache.set(
        PLANNING_CACHE_KEY,
        { goals: ['user-A-private-goal'] },
        5 * 60 * 1000
      );

      analyticsCache.invalidateInBackground(PLANNING_CACHE_KEY);
      await flush();

      expect(readPersisted()[PLANNING_CACHE_KEY]).toBeUndefined();
    });

    // The cross-user assertion: planning data is user-specific, so a stale
    // entry surviving a reload is a data bleed on a shared device.
    it('does not re-hydrate the previous user data after a cache-only reload', async () => {
      analyticsCache.set(
        PLANNING_CACHE_KEY,
        { goals: ['user-A-private-goal'] },
        5 * 60 * 1000
      );

      analyticsCache.invalidateInBackground(PLANNING_CACHE_KEY);
      await flush();

      // Simulate a fresh view instance: empty memory, localStorage only.
      analyticsCache.cache.clear();
      analyticsCache.cacheTimestamps.clear();
      analyticsCache._expiresAt.clear();

      expect(analyticsCache.get(PLANNING_CACHE_KEY)).toBeNull();
    });
  });

  // View-level wiring: proves the view's own handleStorageUpdate goes through
  // the ordering-correct helper. Spy-based, so it fails if the call site is
  // reverted to a bare invalidate().
  describe('FinancialPlanningView call-site wiring', () => {
    it('clears the planning cache through invalidateInBackground', async () => {
      const spy = vi
        .spyOn(analyticsCache, 'invalidateInBackground')
        .mockImplementation(() => Promise.resolve());

      const { FinancialPlanningView } =
        await import('../../src/views/FinancialPlanningView.js');
      const view = FinancialPlanningView({ section: 'overview' });

      fireStorageUpdated(STORAGE_KEYS.GOALS);

      expect(spy).toHaveBeenCalledWith('financial_planning_data');
      view.container?.cleanup?.();
    });
  });
});
