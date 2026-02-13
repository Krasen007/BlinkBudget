/**
 * AnalyticsCache
 * Handles caching of analytics results to improve performance.
 * Enhanced with offline-first capabilities and persistent storage.
 */

import { offlineDataManager } from '../offline-data-manager.js';

export class AnalyticsCache {
  constructor() {
    this.cache = new Map();
    this.cacheTimestamps = new Map();
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in memory
    this.PERSISTENT_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in localStorage
    this.cacheStats = {
      hits: 0,
      misses: 0,
      invalidations: 0,
      evictions: 0,
      offlineHits: 0,
    };

    // Don't hydrate in test environment - let tests control cache state
    if (typeof globalThis !== 'undefined' && globalThis.__VITEST__) {
      console.log(
        '[AnalyticsCache] Running in test environment - skipping hydration'
      );
    } else {
      // Hydrate from persistent storage on initialization
      this.hydrateFromPersistentStorage();
    }
  }

  /**
   * Get cached result if still valid
   * @param {string} key - Cache key
   * @returns {*} Cached result or null
   */
  get(key) {
    // Check memory cache first
    if (this.cache.has(key)) {
      const timestamp = this.cacheTimestamps.get(key);
      if (Date.now() - timestamp < this.CACHE_DURATION) {
        this.cacheStats.hits++;
        return this.cache.get(key);
      }
      // Clean up expired memory cache entry
      this.cache.delete(key);
      this.cacheTimestamps.delete(key);
    }

    // Check persistent storage for offline access
    const persistentData = this.getFromPersistentStorage(key);
    if (persistentData) {
      this.cacheStats.offlineHits++;
      this.cacheStats.hits++;
      // Restore to memory cache
      this.cache.set(key, persistentData);
      this.cacheTimestamps.set(key, Date.now());
      return persistentData;
    }

    this.cacheStats.misses++;
    return null;
  }

  /**
   * Set a result in the cache
   * @param {string} key - Cache key
   * @param {*} result - Result to cache
   */
  set(key, result) {
    this.cache.set(key, result);
    this.cacheTimestamps.set(key, Date.now());

    // Also persist to storage for offline access
    this.setToPersistentStorage(key, result);

    // Prevent memory leaks by limiting cache size
    if (this.cache.size > 100) {
      this.cleanupOldest(20);
    }
  }

  /**
   * Remove oldest entries from cache
   * @param {number} count - Number of entries to remove
   */
  cleanupOldest(count) {
    const entries = Array.from(this.cacheTimestamps.entries())
      .sort((a, b) => a[1] - b[1]) // Sort by timestamp (oldest first)
      .slice(0, count);

    entries.forEach(([key]) => {
      this.cache.delete(key);
      this.cacheTimestamps.delete(key);
      this.cacheStats.evictions++;
    });
  }

  /**
   * Clear all cached results
   */
  clear() {
    this.cache.clear();
    this.cacheTimestamps.clear();
    this.cacheStats.invalidations++;

    // Clear persistent storage
    try {
      offlineDataManager.setInStorage(
        'analytics_cache',
        {},
        this.PERSISTENT_CACHE_DURATION
      );
    } catch (error) {
      console.warn(
        '[AnalyticsCache] Failed to clear persistent storage:',
        error
      );
    }

    // Reset stats for fresh start
    this.cacheStats.hits = 0;
    this.cacheStats.misses = 0;
    this.cacheStats.evictions = 0;
    this.cacheStats.offlineHits = 0;
  }

  /**
   * Invalidate cache entries that match a pattern
   * @param {string} pattern - Pattern to match against keys
   */
  invalidate(pattern) {
    const keysToDelete = [];

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key);
      this.cacheTimestamps.delete(key);
    });

    // Also clear from persistent storage
    try {
      const cached = offlineDataManager.getFromStorage('analytics_cache');
      if (cached) {
        Object.keys(cached).forEach(key => {
          if (key.includes(pattern)) {
            delete cached[key];
          }
        });
        offlineDataManager.setInStorage(
          'analytics_cache',
          cached,
          this.PERSISTENT_CACHE_DURATION
        );
      }
    } catch (error) {
      console.warn(
        '[AnalyticsCache] Failed to invalidate persistent cache:',
        error
      );
    }

    if (keysToDelete.length > 0) {
      this.cacheStats.invalidations++;
    }
  }

  /**
   * Get cache performance statistics
   * @returns {Object} Cache stats
   */
  getStats() {
    return {
      ...this.cacheStats,
      size: this.cache.size,
      hitRate:
        this.cacheStats.hits + this.cacheStats.misses > 0
          ? (this.cacheStats.hits /
            (this.cacheStats.hits + this.cacheStats.misses)) *
          100
          : 0,
    };
  }

  /**
   * Hydrate cache from persistent storage
   */
  hydrateFromPersistentStorage() {
    try {
      const cached = offlineDataManager.getFromStorage('analytics_cache');
      if (cached) {
        // Restore memory cache with recent entries (less than 1 hour old)
        const now = Date.now();
        Object.entries(cached).forEach(([key, entry]) => {
          if (now - entry.timestamp < this.CACHE_DURATION) {
            this.cache.set(key, entry.data);
            this.cacheTimestamps.set(key, entry.timestamp);
          }
        });
      }
    } catch (error) {
      console.warn(
        '[AnalyticsCache] Failed to hydrate from persistent storage:',
        error
      );
    }
  }

  /**
   * Clear all cache including persistent storage (for testing)
   */
  clearAll() {
    const hadContent = this.cache.size > 0;

    this.cache.clear();
    this.cacheTimestamps.clear();

    // Clear persistent storage completely
    try {
      offlineDataManager.removeFromStorage('analytics_cache');
    } catch (error) {
      console.warn(
        '[AnalyticsCache] Failed to clear persistent storage:',
        error
      );
    }

    // Reset stats for fresh start
    this.cacheStats = {
      hits: 0,
      misses: 0,
      invalidations: hadContent ? this.cacheStats.invalidations + 1 : this.cacheStats.invalidations,
      evictions: 0,
      offlineHits: 0,
    };
  }

  /**
   * Store data in persistent storage
   */
  setToPersistentStorage(key, result) {
    try {
      const cached = offlineDataManager.getFromStorage('analytics_cache') || {};
      cached[key] = {
        data: result,
        timestamp: Date.now(),
      };
      offlineDataManager.setInStorage(
        'analytics_cache',
        cached,
        this.PERSISTENT_CACHE_DURATION
      );
    } catch (error) {
      console.warn('[AnalyticsCache] Failed to persist to storage:', error);
    }
  }

  /**
   * Get data from persistent storage
   */
  getFromPersistentStorage(key) {
    try {
      const cached = offlineDataManager.getFromStorage('analytics_cache');
      if (cached && cached[key]) {
        const entry = cached[key];
        const age = Date.now() - entry.timestamp;
        if (age < this.PERSISTENT_CACHE_DURATION) {
          return entry.data;
        }
      }
      return null;
    } catch (error) {
      console.warn(
        '[AnalyticsCache] Failed to get from persistent storage:',
        error
      );
      return null;
    }
  }
}
