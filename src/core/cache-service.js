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
      const prefix = key.replace('*', '');
      const keysToDelete = [];

      // Find all keys matching the pattern
      for (const [storeKey] of store) {
        if (storeKey.startsWith(prefix)) {
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
