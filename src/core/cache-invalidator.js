import { CacheService } from './cache-service.js';
import { STORAGE_KEYS } from '../utils/constants.js';

// Central cache invalidator
export const CacheInvalidator = {
  _initialized: false,
  _boundHandler: null,
  init() {
    if (this._initialized) return;
    // Bind once and keep reference so we can avoid duplicate listeners and remove later
    this._boundHandler = this.handleStorageUpdate.bind(this);
    window.addEventListener('storage-updated', this._boundHandler);
    this._initialized = true;
  },

  // Optional: remove listeners and reset state
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

      // Always clear related summary caches for planning data
      if (key === STORAGE_KEYS.INVESTMENTS || key === STORAGE_KEYS.GOALS) {
        CacheService.del('portfolioSummary');
        CacheService.del('goalsSummary');
      }

      // When transactions change, invalidate forecasts and analytics
      if (key === STORAGE_KEYS.TRANSACTIONS) {
        CacheService.del('analytics_*');
        CacheService.del('forecast_*');
        // Notify instances to clear their in-memory caches
        window.dispatchEvent(
          new CustomEvent('forecast-invalidate', {
            detail: { reason: 'transactions-updated', timestamp: Date.now() },
          })
        );
      }

      // When accounts change, forecasts may be affected too
      if (key === STORAGE_KEYS.ACCOUNTS) {
        CacheService.del('forecast_*');
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
