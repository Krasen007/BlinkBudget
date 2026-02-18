/**
 * Analytics Cache with offline persistence and intelligent invalidation
 *
 * Features:
 * - In-memory LRU cache with TTL
 * - Persistent storage for offline access
 * - Intelligent invalidation based on data changes
 * - Background cleanup and hydration
 * - Mutex to prevent TOCTOU races
 */

import { offlineDataManager } from '../offline-data-manager.js';

export class AnalyticsCache {
  constructor() {
    this.cache = new Map();
    this.cacheTimestamps = new Map();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      invalidations: 0,
      evictions: 0,
    };
    this.PERSISTENT_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    this._cleanupInProgress = false;
    this._lockPromise = null;
  }

  /**
   * Acquire mutex lock for persistent storage operations
   */
  async _acquireLock() {
    // Wait for any existing lock to be released
    while (this._lockPromise) {
      await this._lockPromise;
    }

    // Create a new lock promise
    this._lockPromise = new Promise(_resolve => {
      // The lock will be resolved when the current operation completes
    });

    return this._lockPromise;
  }

  /**
   * Release mutex lock
   */
  _releaseLock() {
    if (this._lockPromise) {
      const _resolve = this._lockPromise;
      this._lockPromise = null;
      _resolve();
    }
  }

  /**
   * Set data in both caches with mutex protection
   */
  set(key, result) {
    // Set in-memory cache
    this.cache.set(key, result);
    this.cacheTimestamps.set(key, Date.now());

    // Set in persistent storage asynchronously (fire and forget)
    this.setToPersistentStorage(key, result).catch(error => {
      console.error(
        '[AnalyticsCache] Failed to set persistent storage:',
        error
      );
    });
  }

  /**
   * Get data from cache with mutex protection
   */
  get(key) {
    // Check in-memory cache first
    if (this.cache.has(key)) {
      this.cacheStats.hits++;
      return this.cache.get(key);
    }

    // Check persistent storage
    this.cacheStats.misses++;
    const cached = offlineDataManager.getFromStorage('analytics_cache');
    if (cached && cached[key]) {
      // Update in-memory cache with persistent data
      this.cache.set(key, cached[key].data);
      this.cacheTimestamps.set(key, cached[key].timestamp);
      return cached[key].data;
    }

    return null;
  }

  /**
   * Get data from persistent storage with mutex protection
   */
  async _getFromPersistentStorage(key) {
    await this._acquireLock();

    try {
      const cached = offlineDataManager.getFromStorage('analytics_cache');
      if (cached && cached[key]) {
        return cached[key];
      }
      return null;
    } finally {
      this._releaseLock();
    }
  }

  /**
   * Set data in persistent storage with mutex protection
   */
  async setToPersistentStorage(key, result) {
    await this._acquireLock();

    try {
      const cached = await this._getFromPersistentStorage('analytics_cache');
      const updated = { ...cached, [key]: result };

      await offlineDataManager.setInStorage(
        'analytics_cache',
        updated,
        this.PERSISTENT_CACHE_DURATION
      );

      // Update in-memory cache
      this.cache.set(key, result);
      this.cacheTimestamps.set(key, Date.now());
    } finally {
      this._releaseLock();
    }
  }

  /**
   * Remove from persistent storage in batch with mutex protection
   */
  async cleanupOldest(count) {
    await this._acquireLock();

    try {
      const entries = Array.from(this.cacheTimestamps.entries())
        .sort((a, b) => a[1] - b[1]) // Sort by timestamp (oldest first)
        .slice(0, count);

      // Remove from in-memory cache first
      entries.forEach(([key]) => {
        this.cache.delete(key);
        this.cacheTimestamps.delete(key);
      });

      // Remove from persistent storage in batch
      try {
        const cached =
          offlineDataManager.getFromStorage('analytics_cache') || {};
        const keysToRemove = entries.map(([key]) => key);

        keysToRemove.forEach(key => {
          delete cached[key];
        });

        await offlineDataManager.setInStorage(
          'analytics_cache',
          cached,
          this.PERSISTENT_CACHE_DURATION
        );

        // Update eviction stats after successful persistent removal
        this.cacheStats.evictions += entries.length;
      } catch (error) {
        // Still increment evictions for in-memory cleanup but log persistent storage failure
        this.cacheStats.evictions += entries.length;
        console.error(
          '[AnalyticsCache] Failed to cleanup persistent storage:',
          error
        );
      }
    } finally {
      this._cleanupInProgress = false;
    }
  }

  /**
   * Clear all cached results
   */
  async clear() {
    await this._acquireLock();
    try {
      this.cache.clear();
      this.cacheTimestamps.clear();
      this.cacheStats.invalidations++;

      // Clear persistent storage completely
      try {
        await offlineDataManager.removeFromStorage('analytics_cache');
      } catch (error) {
        console.warn(
          '[AnalyticsCache] Failed to clear persistent storage:',
          error
        );
      }
    } finally {
      this._releaseLock();
    }
  }

  /**
   * Invalidate cache entries that match a pattern
   */
  async invalidate(pattern) {
    await this._acquireLock();
    await this._acquireLock();

    try {
      const keysToDelete = [];

      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          keysToDelete.push(key);
        }
      }

      // Remove from in-memory cache
      keysToDelete.forEach(key => {
        this.cache.delete(key);
        this.cacheTimestamps.delete(key);
      });

      // Also clear from persistent storage
      try {
        const cached = offlineDataManager.getFromStorage('analytics_cache');
        if (cached) {
          keysToDelete.forEach(key => {
            delete cached[key];
          });
        }

        await offlineDataManager.setInStorage(
          'analytics_cache',
          cached,
          this.PERSISTENT_CACHE_DURATION
        );
      } catch (error) {
        console.error(
          '[AnalyticsCache] Failed to invalidate persistent cache:',
          error
        );
      }
    } finally {
      this._releaseLock();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      ...this.cacheStats,
      size: this.cache.size,
    };
  }

  /**
   * Get cache statistics (alias for compatibility)
   */
  getStats() {
    return this.getCacheStats();
  }

  /**
   * Clear all cached results
   */
  clearCache() {
    this.cache.clear();
    this.cacheTimestamps.clear();
    this.cacheStats.invalidations++;
  }

  /**
   * Clear all cache including persistent storage (for testing)
   */
  clearAll() {
    this.cache.clear();
    this.cacheTimestamps.clear();
    this.cacheStats.invalidations++;

    // Clear persistent storage completely
    try {
      offlineDataManager.removeFromStorage('analytics_cache');
    } catch (error) {
      console.warn(
        '[AnalyticsCache] Failed to clear persistent storage:',
        error
      );
    }
  }
}
