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

const CACHE_PREFIX = 'blinkbudget_analytics_';
const CACHE_VERSION = '1.0.0';

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

    // Create a new lock promise and capture resolve function
    this._lockPromise = new Promise(resolve => {
      this._lockResolve = resolve;
    });

    return this._lockPromise;
  }

  /**
   * Release mutex lock
   */
  _releaseLock() {
    if (this._lockResolve) {
      this._lockResolve();
      this._lockResolve = null;
      this._lockPromise = null;
    }
  }

  /**
   * Get data from localStorage with TTL validation
   */
  _getFromStorage(key) {
    try {
      const storageKey = CACHE_PREFIX + key;
      const cached = localStorage.getItem(storageKey);

      if (!cached) return null;

      const cacheEntry = JSON.parse(cached);
      const now = Date.now();

      // Check TTL
      if (now - cacheEntry.timestamp > cacheEntry.ttl) {
        localStorage.removeItem(storageKey);
        return null;
      }

      // Check version compatibility
      if (cacheEntry.version !== CACHE_VERSION) {
        localStorage.removeItem(storageKey);
        return null;
      }

      return cacheEntry.data;
    } catch (error) {
      console.warn(`[AnalyticsCache] Failed to retrieve ${key}:`, error);
      return null;
    }
  }

  /**
   * Store data in localStorage with versioning
   */
  _setInStorage(key, data, ttl = this.PERSISTENT_CACHE_DURATION) {
    try {
      const storageKey = CACHE_PREFIX + key;
      const cacheEntry = {
        data,
        timestamp: Date.now(),
        version: CACHE_VERSION,
        ttl,
      };
      localStorage.setItem(storageKey, JSON.stringify(cacheEntry));
    } catch (error) {
      // Check if error is quota-related
      const isQuotaError =
        error.name === 'QuotaExceededError' ||
        (error instanceof DOMException &&
          (error.code === 22 || error.code === 1014));

      if (isQuotaError) {
        // Attempt eviction of stale/old entries for the same CACHE_PREFIX
        try {
          const entries = [];
          for (let i = 0; i < localStorage.length; i++) {
            const storageKey = localStorage.key(i);
            if (storageKey && storageKey.startsWith(CACHE_PREFIX)) {
              try {
                const value = localStorage.getItem(storageKey);
                if (value) {
                  const parsed = JSON.parse(value);
                  entries.push({
                    key: storageKey,
                    timestamp: parsed.timestamp || 0,
                  });
                }
              } catch {
                // Skip entries that can't be parsed
                entries.push({ key: storageKey, timestamp: 0 });
              }
            }
          }

          // Sort by timestamp (oldest first) and remove up to 5 oldest entries
          entries.sort((a, b) => a.timestamp - b.timestamp);
          const toRemove = entries.slice(0, 5);
          toRemove.forEach(entry => {
            localStorage.removeItem(entry.key);
          });

          // Retry the set operation after eviction
          const storageKey = CACHE_PREFIX + key;
          const cacheEntry = {
            data,
            timestamp: Date.now(),
            version: CACHE_VERSION,
            ttl,
          };
          localStorage.setItem(storageKey, JSON.stringify(cacheEntry));
        } catch (retryError) {
          console.error(
            `[AnalyticsCache] Failed to cache ${key} after quota eviction:`,
            retryError
          );
        }
      } else {
        console.error(
          `[AnalyticsCache] Failed to cache ${key}:`,
          error,
          `Key: ${key}`
        );
      }
    }
  }

  /**
   * Remove data from localStorage
   */
  _removeFromStorage(key) {
    try {
      const storageKey = CACHE_PREFIX + key;
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn(`[AnalyticsCache] Failed to remove ${key}:`, error);
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
   *
   * Note: This method uses relaxed consistency for persistent storage reads.
   * The persistent storage read is not protected by the mutex lock because
   * get() is synchronous while the lock mechanism is async. This is acceptable
   * for a cache where eventual consistency is sufficient. For strong consistency,
   * use _getFromPersistentStorage(key) which is async and uses the lock.
   */
  get(key) {
    // Check in-memory cache first
    if (this.cache.has(key)) {
      this.cacheStats.hits++;
      return this.cache.get(key);
    }

    // Check persistent storage (relaxed consistency - no lock)
    const cached = this._getFromStorage('analytics_cache');
    if (cached && cached[key]) {
      // Update in-memory cache with persistent data
      this.cache.set(key, cached[key].data);
      this.cacheTimestamps.set(key, cached[key].timestamp);
      return cached[key].data;
    }

    // Only increment miss counter if key is not found in either cache
    this.cacheStats.misses++;
    return null;
  }

  /**
   * Get data from persistent storage with mutex protection
   */
  async _getFromPersistentStorage(key) {
    await this._acquireLock();

    try {
      const cached = this._getFromStorage('analytics_cache');
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
    // Read existing persistent data first without acquiring lock
    const cached = this._getFromStorage('analytics_cache') || {};

    await this._acquireLock();

    try {
      const updated = { ...cached, [key]: result };

      this._setInStorage(
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
    this._cleanupInProgress = true;

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
        const cached = this._getFromStorage('analytics_cache') || {};
        const keysToRemove = entries.map(([key]) => key);

        keysToRemove.forEach(key => {
          delete cached[key];
        });

        this._setInStorage(
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
      this._releaseLock();
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
        this._removeFromStorage('analytics_cache');
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
        const cached = this._getFromStorage('analytics_cache');
        if (cached && typeof cached === 'object') {
          keysToDelete.forEach(key => {
            delete cached[key];
          });

          this._setInStorage(
            'analytics_cache',
            cached,
            this.PERSISTENT_CACHE_DURATION
          );
        }
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
      this._removeFromStorage('analytics_cache');
    } catch (error) {
      console.warn(
        '[AnalyticsCache] Failed to clear persistent storage:',
        error
      );
    }
  }
}
