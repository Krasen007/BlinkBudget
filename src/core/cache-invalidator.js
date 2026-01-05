import { CacheService } from './cache-service.js';
import { STORAGE_KEYS } from '../utils/constants.js';

// Central cache invalidator
export const CacheInvalidator = {
  init() {
    // Listen for storage updates and perform targeted invalidation
    window.addEventListener('storage-updated', this.handleStorageUpdate.bind(this));
  },

  handleStorageUpdate(e) {
    try {
      const key = e.detail && e.detail.key;
      if (!key) return;

      // Always clear related summary caches for planning data
      if (
        key === STORAGE_KEYS.INVESTMENTS ||
        key === STORAGE_KEYS.GOALS
      ) {
        CacheService.del('portfolioSummary');
        CacheService.del('goalsSummary');
      }

      // When transactions change, invalidate forecasts and analytics
      if (key === STORAGE_KEYS.TRANSACTIONS) {
        CacheService.del('analytics_*');
        CacheService.del('forecast_*');
        // Notify instances to clear their in-memory caches
        window.dispatchEvent(new CustomEvent('forecast-invalidate', { detail: { reason: 'transactions-updated', timestamp: Date.now() } }));
      }

      // When accounts change, forecasts may be affected too
      if (key === STORAGE_KEYS.ACCOUNTS) {
        CacheService.del('forecast_*');
        window.dispatchEvent(new CustomEvent('forecast-invalidate', { detail: { reason: 'accounts-updated', timestamp: Date.now() } }));
      }
    } catch (error) {
      console.warn('[CacheInvalidator] Error handling storage update:', error);
    }
  }
};
