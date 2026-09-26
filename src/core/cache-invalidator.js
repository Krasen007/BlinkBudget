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
        analyticsCache.invalidateInBackground('portfolioSummary');
        analyticsCache.invalidateInBackground('goalsSummary');
      }

      // When transactions change, invalidate forecasts and analytics
      if (key === STORAGE_KEYS.TRANSACTIONS) {
        // invalidateInBackground() clears the in-memory map synchronously and
        // passes the keys captured beforehand to the async pass, so same-tick
        // reads see fresh data AND the persistent layer is still purged.
        [
          'analytics_',
          'forecast_',
          'financial_planning_data',
          'reports_preload_',
        ].forEach(pattern => analyticsCache.invalidateInBackground(pattern));

        // Notify instances to clear their in-memory caches
        window.dispatchEvent(
          new CustomEvent('forecast-invalidate', {
            detail: { reason: 'transactions-updated', timestamp: Date.now() },
          })
        );
      }

      // When accounts change, forecasts may be affected too
      if (key === STORAGE_KEYS.ACCOUNTS) {
        analyticsCache.invalidateInBackground('forecast_');
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
