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
    store.delete(key);
  }

  function clear() {
    store.clear();
  }

  return { put, get, del, clear };
})();

export default CacheService;
