/**
 * AnalyticsCache
 * Handles caching of analytics results to improve performance.
 */

export class AnalyticsCache {
  constructor() {
    this.cache = new Map();
    this.cacheTimestamps = new Map();
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
    this.cacheStats = {
      hits: 0,
      misses: 0,
      invalidations: 0,
      evictions: 0,
    };
  }

  /**
   * Get cached result if still valid
   * @param {string} key - Cache key
   * @returns {*} Cached result or null
   */
  get(key) {
    if (!this.cache.has(key)) {
      this.cacheStats.misses++;
      return null;
    }

    const timestamp = this.cacheTimestamps.get(key);
    if (Date.now() - timestamp < this.CACHE_DURATION) {
      this.cacheStats.hits++;
      return this.cache.get(key);
    }

    // Clean up expired cache entry
    this.cache.delete(key);
    this.cacheTimestamps.delete(key);
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
}
