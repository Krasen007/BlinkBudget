/**
 * Simple in-memory cache with optional TTL for expensive calculations
 */
export const CacheService = (() => {
  const store = new Map();

  function put(key, value, ttlMs = 0) {
    const entry = { value };
    if (ttlMs > 0) {
      entry.expiresAt = Date.now() + ttlMs;
    }
    store.set(key, entry);
  }

  function get(key) {
    const entry = store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      store.delete(key);
      return null;
    }
    return entry.value;
  }

  function del(key) {
    // Support wildcard patterns (e.g., 'analytics_*', 'forecast_*')
    if (key.includes('*')) {
      if (key === '*') {
        throw new Error('Use clear() to delete all entries');
      }

      // Validate pattern - only support suffix wildcards like 'analytics_*'
      const starIndex = key.indexOf('*');
      if (starIndex !== key.length - 1) {
        throw new Error(
          `Invalid wildcard pattern: ${key}. Only suffix patterns like 'analytics_*' are supported`
        );
      }

      const prefix = key.slice(0, starIndex);
      const keysToDelete = [];

      // Build regex pattern for matching
      const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`^${escapedPrefix}.*`);

      // Find all keys matching the pattern
      for (const [storeKey] of store) {
        if (pattern.test(storeKey)) {
          keysToDelete.push(storeKey);
        }
      }

      // Delete all matching keys
      keysToDelete.forEach(k => store.delete(k));
      return;
    }

    // Exact key deletion
    store.delete(key);
  }

  function clear() {
    store.clear();
  }

  return { put, get, del, clear };
})();

export default CacheService;
