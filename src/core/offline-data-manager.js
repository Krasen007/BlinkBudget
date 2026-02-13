/**
 * Offline Data Manager
 *
 * Centralized service for offline data management and synchronization.
 * Handles caching, offline detection, and data synchronization states.
 */

export class OfflineDataManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    this.cacheVersion = '1.0.0';
    this.CACHE_PREFIX = 'blinkbudget_offline_';

    // Initialize offline detection
    this.setupOfflineDetection();

    // Load cached data on initialization
    this.hydrateFromStorage();
  }

  /**
   * Setup offline/online event listeners
   */
  setupOfflineDetection() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processSyncQueue();
      this.notifyStatusChange('online');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyStatusChange('offline');
    });
  }

  /**
   * Notify components of status changes
   */
  notifyStatusChange(status) {
    window.dispatchEvent(
      new CustomEvent('offline-status-change', {
        detail: { status, isOnline: this.isOnline },
      })
    );
  }

  /**
   * Hydrate in-memory cache from localStorage
   */
  hydrateFromStorage() {
    try {
      const cachedReports = this.getFromStorage('reports_data');
      const cachedPlanning = this.getFromStorage('planning_data');

      if (cachedReports) {
        this.reportsCache = cachedReports;
      }
      if (cachedPlanning) {
        this.planningCache = cachedPlanning;
      }
    } catch (error) {
      console.warn(
        '[OfflineDataManager] Failed to hydrate from storage:',
        error
      );
    }
  }

  /**
   * Store data in localStorage with versioning
   */
  setInStorage(key, data, ttl = 24 * 60 * 60 * 1000) {
    // 24 hours default
    try {
      const storageKey = this.CACHE_PREFIX + key;
      const cacheEntry = {
        data,
        timestamp: Date.now(),
        version: this.cacheVersion,
        ttl,
      };
      localStorage.setItem(storageKey, JSON.stringify(cacheEntry));
    } catch (error) {
      console.warn(`[OfflineDataManager] Failed to cache ${key}:`, error);
    }
  }

  /**
   * Get data from localStorage with TTL validation
   */
  getFromStorage(key) {
    try {
      const storageKey = this.CACHE_PREFIX + key;
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
      if (cacheEntry.version !== this.cacheVersion) {
        localStorage.removeItem(storageKey);
        return null;
      }

      return cacheEntry.data;
    } catch (error) {
      console.warn(`[OfflineDataManager] Failed to retrieve ${key}:`, error);
      return null;
    }
  }

  /**
   * Cache reports data
   */
  cacheReportsData(data, cacheKey) {
    if (!this.reportsCache) {
      this.reportsCache = new Map();
    }

    this.reportsCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      isOffline: !this.isOnline,
    });

    // Persist to localStorage
    const cacheObject = Object.fromEntries(this.reportsCache);
    this.setInStorage('reports_data', cacheObject);
  }

  /**
   * Get cached reports data
   */
  getCachedReportsData(cacheKey) {
    // Check memory cache first
    if (this.reportsCache && this.reportsCache.has(cacheKey)) {
      return this.reportsCache.get(cacheKey).data;
    }

    // Fallback to localStorage
    const cached = this.getFromStorage('reports_data');
    if (cached && cached[cacheKey]) {
      // Restore memory cache
      if (!this.reportsCache) {
        this.reportsCache = new Map();
      }
      this.reportsCache.set(cacheKey, cached[cacheKey]);
      return cached[cacheKey].data;
    }

    return null;
  }

  /**
   * Cache financial planning data
   */
  cachePlanningData(section, data) {
    if (!this.planningCache) {
      this.planningCache = {};
    }

    this.planningCache[section] = {
      data,
      timestamp: Date.now(),
      isOffline: !this.isOnline,
    };

    // Persist to localStorage
    this.setInStorage('planning_data', this.planningCache);
  }

  /**
   * Get cached planning data
   */
  getCachedPlanningData(section) {
    // Check memory cache first
    if (this.planningCache && this.planningCache[section]) {
      return this.planningCache[section].data;
    }

    // Fallback to localStorage
    const cached = this.getFromStorage('planning_data');
    if (cached && cached[section]) {
      // Restore memory cache
      if (!this.planningCache) {
        this.planningCache = {};
      }
      this.planningCache[section] = cached[section];
      return cached[section].data;
    }

    return null;
  }

  /**
   * Add operation to sync queue
   */
  addToSyncQueue(operation) {
    const queueItem = {
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
      operation,
      retries: 0,
    };

    this.syncQueue.push(queueItem);
    this.persistSyncQueue();
  }

  /**
   * Process sync queue when online
   */
  async processSyncQueue() {
    if (!this.isOnline || this.syncQueue.length === 0) return;

    const failedOperations = [];

    for (const item of this.syncQueue) {
      try {
        await this.executeOperation(item.operation);
        console.log(`[OfflineDataManager] Synced operation:`, item.operation);
      } catch (error) {
        console.error(`[OfflineDataManager] Failed to sync operation:`, error);
        item.retries++;

        if (item.retries < 3) {
          failedOperations.push(item);
        }
      }
    }

    this.syncQueue = failedOperations;
    this.persistSyncQueue();
  }

  /**
   * Execute queued operation
   */
  async executeOperation(operation) {
    const { type, data } = operation;

    switch (type) {
      case 'saveGoal': {
        const { StorageService } = await import('./storage.js');
        StorageService.createGoal(
          data.name,
          data.targetAmount,
          data.targetDate,
          data.currentSavings,
          data.options
        );
        break;
      }

      case 'updateGoal': {
        const { StorageService: Storage } = await import('./storage.js');
        Storage.updateGoal(data.goalId, data.updates);
        break;
      }

      case 'deleteGoal': {
        const { StorageService: StorageDel } = await import('./storage.js');
        StorageDel.deleteGoal(data.goalId);
        break;
      }

      default:
        console.warn(`[OfflineDataManager] Unknown operation type:`, type);
    }
  }

  /**
   * Persist sync queue to localStorage
   */
  persistSyncQueue() {
    try {
      this.setInStorage('sync_queue', this.syncQueue, 7 * 24 * 60 * 60 * 1000); // 7 days
    } catch (error) {
      console.warn('[OfflineDataManager] Failed to persist sync queue:', error);
    }
  }

  /**
   * Load sync queue from localStorage
   */
  loadSyncQueue() {
    const cached = this.getFromStorage('sync_queue');
    if (cached) {
      this.syncQueue = cached;
    }
  }

  /**
   * Clear all cached data
   */
  clearCache() {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });

      this.reportsCache = new Map();
      this.planningCache = {};
      this.syncQueue = [];
    } catch (error) {
      console.warn('[OfflineDataManager] Failed to clear cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const stats = {
      isOnline: this.isOnline,
      reportsCacheSize: this.reportsCache ? this.reportsCache.size : 0,
      planningCacheSections: this.planningCache
        ? Object.keys(this.planningCache).length
        : 0,
      syncQueueSize: this.syncQueue.length,
    };

    // Calculate localStorage usage
    let totalSize = 0;
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.CACHE_PREFIX)) {
        totalSize += localStorage[key].length;
      }
    });
    stats.localStorageUsage = `${(totalSize / 1024).toFixed(2)} KB`;

    return stats;
  }

  /**
   * Check if data is fresh (less than 1 hour old)
   */
  isDataFresh(timestamp) {
    const oneHour = 60 * 60 * 1000;
    return Date.now() - timestamp < oneHour;
  }
}

// Singleton instance
export const offlineDataManager = new OfflineDataManager();
