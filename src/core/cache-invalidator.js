/**
 * Central cache invalidator — single regime on top of AnalyticsCache.
 */
import { analyticsCache } from './analytics/AnalyticsCache.js';
import { STORAGE_KEYS } from '../utils/constants.js';

export const CacheInvalidator = {
  _initialized: false,
  _boundHandler: null,
  init() {
    if (this._initialized) return;
    this._boundHandler = this.handleStorageUpdate.bind(this);
    window.addEventListener('storage-updated', this._boundHandler);
    this._initialized = true;
  },

  destroy() {
    if (this._boundHandler) {
      window.removeEventListener('storage-updated', this._boundHandler);
      this._boundHandler = null;
    }
    this._initialized = false;
  },

  handleStorageUpdate(e) {
    try {
      const key = e.detail && e.detail.key;
      if (!key) return;

      // Clear related summary caches for planning data
      if (key === STORAGE_KEYS.INVESTMENTS || key === STORAGE_KEYS.GOALS) {
        analyticsCache.invalidate('portfolioSummary');
        analyticsCache.invalidate('goalsSummary');
      }

      // When transactions change, invalidate forecasts and analytics
      if (key === STORAGE_KEYS.TRANSACTIONS) {
        // Synchronous in-memory invalidation so same-tick reads see fresh data
        analyticsCache.invalidateSync('analytics_');
        analyticsCache.invalidateSync('forecast_');
        analyticsCache.invalidateSync('financial_planning_data');
        analyticsCache.invalidateSync('reports_preload_');
        // Async full invalidation (incl. persistent storage) in background
        analyticsCache.invalidate('analytics_');
        analyticsCache.invalidate('forecast_');
        analyticsCache.invalidate('financial_planning_data');
        analyticsCache.invalidate('reports_preload_');
        // Notify instances to clear their in-memory caches
        window.dispatchEvent(
          new CustomEvent('forecast-invalidate', {
            detail: { reason: 'transactions-updated', timestamp: Date.now() },
          })
        );
      }

      // When accounts change, forecasts may be affected too
      if (key === STORAGE_KEYS.ACCOUNTS) {
        analyticsCache.invalidate('forecast_');
        window.dispatchEvent(
          new CustomEvent('forecast-invalidate', {
            detail: { reason: 'accounts-updated', timestamp: Date.now() },
          })
        );
      }
    } catch (error) {
      console.warn('[CacheInvalidator] Error handling storage update:', error);
    }
  },
};
