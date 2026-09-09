// tests/core/cache-invalidator-ghost.test.js
// Regression test: moving a transaction to another month must not leave a
// stale "ghost" visible in ReportsView Explore Categories.
// Root cause: ReportsView caches per-period analytics under keys like
// `analytics_reports_<iso>_<iso>` (5-min TTL) which did NOT match the
// `analytics_` invalidation pattern, so a same-tick / same-session refresh
// re-read the stale entry containing the pre-move transaction.
// Fix: CacheInvalidator synchronously drops `analytics_reports_*` (memory +
// persistent) on every transaction write.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { analyticsCache } from '../../src/core/analytics/AnalyticsCache.js';
import { CacheInvalidator } from '../../src/core/cache-invalidator.js';
import { STORAGE_KEYS } from '../../src/utils/constants.js';

const periodKey = `analytics_reports_${new Date('2026-09-01T00:00:00.000Z').toISOString()}_${new Date('2026-09-30T23:59:59.999Z').toISOString()}`;

const staleAnalytics = {
  categoryBreakdown: {
    categories: [{ name: 'Food', amount: 100, transactionCount: 1 }],
  },
};

const fireTransactionsUpdated = () => {
  window.dispatchEvent(
    new CustomEvent('storage-updated', {
      detail: { key: STORAGE_KEYS.TRANSACTIONS },
    })
  );
};

describe('CacheInvalidator - reports ghost invalidation', () => {
  beforeEach(() => {
    analyticsCache.clearAll();
    localStorage.clear();
    CacheInvalidator.destroy();
    CacheInvalidator.init();
  });

  it('drops cached reports analytics so a moved transaction is recomputed', () => {
    analyticsCache.set(periodKey, staleAnalytics, 5 * 60 * 1000);
    expect(analyticsCache.get(periodKey)).toEqual(staleAnalytics);

    fireTransactionsUpdated();

    expect(analyticsCache.get(periodKey)).toBeNull();
  });

  it('purges the persistent envelope too (no re-hydration of the ghost)', () => {
    analyticsCache.set(periodKey, staleAnalytics, 5 * 60 * 1000);
    fireTransactionsUpdated();

    // Simulate a fresh ReportsView instance: empty memory, localStorage only.
    analyticsCache.cache.clear();
    analyticsCache.cacheTimestamps.clear();
    analyticsCache._expiresAt.clear();

    expect(analyticsCache.get(periodKey)).toBeNull();
  });

  it('ignores unrelated storage keys', () => {
    analyticsCache.set(periodKey, staleAnalytics, 5 * 60 * 1000);
    window.dispatchEvent(
      new CustomEvent('storage-updated', {
        detail: { key: STORAGE_KEYS.SETTINGS },
      })
    );
    expect(analyticsCache.get(periodKey)).toEqual(staleAnalytics);
  });

  it('invalidateSync is a no-op for unknown patterns', () => {
    expect(analyticsCache.invalidateSync('no_such_key_xyz')).toBe(0);
    expect(vi.fn().mock.calls).toHaveLength(0);
  });
});
