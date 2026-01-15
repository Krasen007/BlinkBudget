import { getDb } from './firebase-config.js';
import { AuthService } from './auth-service.js';
import {
  doc,
  setDoc,
  onSnapshot,
  collection,
  getDocs,
} from 'firebase/firestore';
import { STORAGE_KEYS } from '../utils/constants.js';

// Sanitize helper: convert Dates to ISO, recursively sanitize objects/arrays,
// and protect against circular references using a WeakSet.
const sanitize = (value, seen = new WeakSet()) => {
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    return value.toISOString();
  }
  if (Array.isArray(value)) return value.map(v => sanitize(v, seen));
  if (value && typeof value === 'object') {
    if (seen.has(value)) return null; // break cycles
    seen.add(value);
    const out = {};
    Object.keys(value).forEach(k => {
      out[k] = sanitize(value[k], seen);
    });
    return out;
  }
  return value;
};

export const SyncService = {
  unsubscribes: [],
  pendingWrites: new Map(), // Track pending writes to avoid race conditions
  lastPushTimes: new Map(), // Track last push time per dataType for rate limiting
  _conflictResolutionHandler: null,
  isOnline: navigator.onLine, // NEW: Track connection status

  async init() {
    this.setupConnectionMonitoring(); // NEW: Setup connection monitoring

    AuthService.init(async user => {
      if (user) {
        await this.pullFromCloud(user.uid);
        // Only start real-time sync if the page is visible
        if (!document.hidden) {
          this.startRealtimeSync(user.uid);
        }
      } else {
        this.stopSync();
      }
    });

    // Remove existing listener if any to avoid duplicates when `init()` is called multiple times
    if (this._conflictResolutionHandler) {
      window.removeEventListener(
        'sync-conflict-resolution',
        this._conflictResolutionHandler
      );
    }

    // Listen for user-driven conflict resolutions from the UI
    this._conflictResolutionHandler = e => {
      try {
        const detail = e.detail || {};
        this.handleConflictResolution(detail);
      } catch (err) {
        console.warn('[Sync] Error handling conflict resolution event:', err);
      }
    };
    window.addEventListener(
      'sync-conflict-resolution',
      this._conflictResolutionHandler
    );

    // handle visibility change to pause/resume sync
    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });
  },

  handleVisibilityChange() {
    if (document.hidden) {
      console.log('[Sync] App hidden, pausing real-time sync...');
      this.stopSync();
    } else {
      const userId = AuthService.getUserId();
      if (userId) {
        console.log('[Sync] App visible, resuming real-time sync...');
        this.startRealtimeSync(userId);
      }
    }
  },

  stopSync() {
    this.unsubscribes.forEach(unsub => unsub());
    this.unsubscribes = [];
  },

  async pushToCloud(dataType, data) {
    const userId = AuthService.getUserId();
    if (!userId) return;

    // Rate limiting: Ensure at least 2 seconds between pushes for the same dataType
    const now = Date.now();
    const lastPush = this.lastPushTimes.get(dataType) || 0;
    if (now - lastPush < 2000) {
      console.log(`[Sync] Throttling push for ${dataType}...`);
      // We could use a debounce here instead, but for now simple throttle/skip is safer for security context
      return;
    }
    this.lastPushTimes.set(dataType, now);

    try {
      // Mark that we're writing to this dataType to prevent race conditions
      const writeId = Date.now();
      this.pendingWrites.set(dataType, writeId);

      const userDocRef = doc(getDb(), 'users', userId);
      // Wrap arrays in { items: data } for consistent storage, objects stay as they are
      const payload = Array.isArray(data) ? { items: data } : data;

      // Sanitize payload (module-level helper handles cycles)
      const safePayload = sanitize(payload);

      console.log(`[Sync] Pushing ${dataType} to cloud...`);
      // Notify UI that a push is starting
      window.dispatchEvent(
        new CustomEvent('sync-state', {
          detail: { dataType, state: 'syncing', timestamp: Date.now() },
        })
      );
      await setDoc(doc(userDocRef, dataType, 'data'), safePayload, {
        merge: true,
      });
      // Notify UI that push completed
      window.dispatchEvent(
        new CustomEvent('sync-state', {
          detail: { dataType, state: 'synced', timestamp: Date.now() },
        })
      );

      // Keep the write lock for a brief moment to allow Firebase to propagate
      setTimeout(() => {
        if (this.pendingWrites.get(dataType) === writeId) {
          this.pendingWrites.delete(dataType);
          console.log(`[Sync] Write lock released for ${dataType}`);
        }
      }, 1000); // 1 second should be enough for Firebase to process
    } catch (error) {
      console.error(`[Sync] Failed to push ${dataType} to cloud:`, error);

      // Check if it's a network error
      const isNetworkError = error.message && (
        error.message.includes('ERR_INTERNET_DISCONNECTED') ||
        error.message.includes('ERR_BLOCKED_BY_CLIENT') ||
        error.message.includes('network') ||
        error.message.includes('connection')
      );

      if (isNetworkError) {
        console.log(`[Sync] Network error detected for ${dataType}, will retry when online`);
      }

      // Emit sync error for UI
      window.dispatchEvent(
        new CustomEvent('sync-state', {
          detail: {
            dataType,
            state: 'error',
            error: String(error),
            timestamp: Date.now(),
            isNetworkError: isNetworkError || false,
          },
        })
      );
      this.pendingWrites.delete(dataType);
    }
  },

  async pullFromCloud(userId) {
    console.log('[Sync] Pulling data from cloud for user:', userId);
    const userDocRef = doc(getDb(), 'users', userId);
    const keys = [
      STORAGE_KEYS.TRANSACTIONS,
      STORAGE_KEYS.ACCOUNTS,
      STORAGE_KEYS.SETTINGS,
      STORAGE_KEYS.INVESTMENTS,
      STORAGE_KEYS.GOALS,
    ];

    for (const key of keys) {
      try {
        const snap = await getDocs(collection(userDocRef, key));
        const dataDoc = snap.docs.find(d => d.id === 'data');
        if (dataDoc) {
          const rawData = dataDoc.data();
          const processedData = rawData.items || rawData;
          console.log(`[Sync] Found ${key} in cloud.`);
          this.mergeLocalWithCloud(key, processedData);
        }
      } catch (error) {
        console.error(`[Sync] Failed to pull ${key} from cloud:`, error);
      }
    }
  },

  startRealtimeSync(userId) {
    this.stopSync();
    console.log(
      '[Sync] Starting offline-first realtime sync for user:',
      userId
    );

    const keys = [
      STORAGE_KEYS.TRANSACTIONS,
      STORAGE_KEYS.ACCOUNTS,
      STORAGE_KEYS.SETTINGS,
      STORAGE_KEYS.INVESTMENTS,
      STORAGE_KEYS.GOALS,
    ];

    keys.forEach(key => {
      const unsub = onSnapshot(
        doc(getDb(), 'users', userId, key, 'data'),
        {
          // includeMetadataChanges to know if data is from cache or server
          includeMetadataChanges: true,
        },
        doc => {
          if (doc.exists()) {
            const rawData = doc.data();
            const processedData = rawData.items || rawData;

            // Log whether this is cached data or fresh from server
            const source = doc.metadata.fromCache ? 'cache' : 'server';
            console.log(`[Sync] ${key} loaded from ${source}`);

            this.mergeLocalWithCloud(key, processedData);
          }
        },
        error => {
          console.error(`[Sync] Error in realtime listener for ${key}:`, error);
        }
      );
      this.unsubscribes.push(unsub);
    });
  },

  mergeLocalWithCloud(key, cloudData) {
    if (!cloudData) return;

    // If we're currently writing to this key, skip the merge to prevent race conditions
    if (this.pendingWrites.has(key)) {
      console.log(`[Sync] Skipping merge for ${key} - write in progress`);
      return;
    }

    const localRaw = localStorage.getItem(key);
    if (Array.isArray(cloudData)) {
      const localData = JSON.parse(localRaw || '[]');

      // Deduplicate cloud data
      const cleanedCloudData = this.uniqueById(cloudData, key);

      // Merge per-item using Last-Write-Wins strategy and emit conflicts when near-simultaneous edits occur
      const merged = this.mergeArraysById(localData, cleanedCloudData, { key });

      if (JSON.stringify(merged) !== JSON.stringify(localData)) {
        console.log(
          `[Sync] Merging local ${key} with cloud data (per-item LWW).`
        );
        localStorage.setItem(key, JSON.stringify(merged));
        window.dispatchEvent(
          new CustomEvent('storage-updated', { detail: { key } })
        );
      }
    } else if (typeof cloudData === 'object' && cloudData !== null) {
      // For settings objects, we still perform a shallow merge to preserve local settings not yet in cloud
      const localData = JSON.parse(localRaw || '{}');
      const merged = { ...localData, ...cloudData };

      if (JSON.stringify(merged) !== JSON.stringify(localData)) {
        console.log(`[Sync] Merging local ${key} with cloud data.`);
        localStorage.setItem(key, JSON.stringify(merged));
        window.dispatchEvent(
          new CustomEvent('storage-updated', { detail: { key } })
        );
      }
    }
  },

  /**
   * Merge two arrays of objects by `id` using Last-Write-Wins (LWW).
   * Emits `sync-conflict` events when timestamps are nearly equal and payloads differ.
   * Cloud-authoritative deletion: items missing from cloud are removed locally.
   */
  mergeArraysById(localArray = [], cloudArray = [], opts = {}) {
    const key = opts.key || 'unknown';
    const localById = new Map();
    (localArray || []).forEach(item => {
      if (item && item.id) localById.set(item.id, item);
    });
    const cloudById = new Map();
    (cloudArray || []).forEach(item => {
      if (item && item.id) cloudById.set(item.id, item);
    });

    const merged = [];

    // Normalize helper for timestamp (ms)
    const ts = item => {
      if (!item) return 0;
      const v =
        item.updatedAt ||
        item.updatedDate ||
        item.updated ||
        item.ts ||
        item.lastModified;
      const n = v ? (typeof v === 'number' ? v : Date.parse(v)) : 0;
      return isNaN(n) ? 0 : n;
    };

    // Include items present in cloud (authoritative for existing items)
    cloudById.forEach((cloudItem, id) => {
      const localItem = localById.get(id);
      if (!localItem) {
        // New item from cloud
        merged.push(cloudItem);
        return;
      }

      const localTs = ts(localItem);
      const cloudTs = ts(cloudItem);

      // If timestamps are very close and payload differs, emit conflict for UI resolution
      const timeDiff = Math.abs(localTs - cloudTs);
      const localJson = JSON.stringify(localItem);
      const cloudJson = JSON.stringify(cloudItem);
      if (timeDiff <= 2000 && localJson !== cloudJson) { // Increased from 100ms to 1000ms
        console.log(
          `[Sync] Detected near-simultaneous edit for id=${id} on ${key}`
        );
        window.dispatchEvent(
          new CustomEvent('sync-conflict', {
            detail: { key, id, localItem, cloudItem },
          })
        );
        // Prefer cloud version (cloud-authoritative) but UI may later request resolution
        merged.push(cloudItem);
        return;
      }

      // Last write wins
      if (cloudTs >= localTs) {
        merged.push(cloudItem);
      } else {
        merged.push(localItem);
      }
      // Remove processed local item from the map
      localById.delete(id);
    });

    // Items still in localById but not in cloud => cloud deletion (authoritative), so skip them
    // If you want to resurrect local items, change behavior here.

    // For items without id, use cloud-authoritative approach (only include cloud items)
    const cloudNoId = (cloudArray || []).filter(i => i && !i.id);
    merged.push(...cloudNoId);
    return merged;
  },

  /**
   * Handle conflict resolution choices from the UI.
   * detail: { resolution: 'local'|'cloud', conflict: { key, id, localItem, cloudItem } }
   */
  async handleConflictResolution(detail = {}) {
    try {
      const { resolution, conflict } = detail;
      if (!conflict || !conflict.key || !conflict.id) return;
      const key = conflict.key;

      // Load current local array
      const localRaw = localStorage.getItem(key) || '[]';
      const localArray = JSON.parse(localRaw);

      if (resolution === 'local') {
        // Push local state to cloud (authoritative single-doc pattern)
        await this.pushToCloud(key, localArray);
        console.log(
          `[Sync] Conflict resolved: kept local for ${key}/${conflict.id}`
        );
        return;
      }

      if (resolution === 'cloud') {
        // Replace local item with cloud item
        const cloudItem = conflict.cloudItem;
        if (!cloudItem) return;
        const idx = (localArray || []).findIndex(
          item => item && item.id === cloudItem.id
        );
        if (idx >= 0) {
          localArray[idx] = cloudItem;
        } else {
          localArray.push(cloudItem); // Item was deleted locally, restore from cloud
        }
        localStorage.setItem(key, JSON.stringify(localArray));
        window.dispatchEvent(
          new CustomEvent('storage-updated', { detail: { key } })
        );
        console.log(
          `[Sync] Conflict resolved: kept cloud for ${key}/${cloudItem.id}`
        );
        return;
      }
    } catch (error) {
      console.error('[Sync] Error in handleConflictResolution:', error);
    }
  },

  uniqueById(items, key = null) {
    const seenId = new Set();
    const seenNameType = new Set();

    return items.filter(item => {
      if (!item.id || seenId.has(item.id)) return false;

      // Special handling for accounts: prevent same name + type combo
      if (key === STORAGE_KEYS.ACCOUNTS && item.name) {
        const combo = `${item.name.toLowerCase()}|${item.type}`;
        if (seenNameType.has(combo)) return false;
        seenNameType.add(combo);
      }

      seenId.add(item.id);
      return true;
    });
  },

  // NEW: Connection monitoring methods
  setupConnectionMonitoring() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('[Sync] Connection restored, resuming sync...');
      this.resumeSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('[Sync] Connection lost, pausing sync...');
      this.pauseSync();
    });

    // Log initial connection status
    console.log(`[Sync] Initial connection status: ${this.isOnline ? 'Online' : 'Offline'}`);
  },

  resumeSync() {
    // Trigger background sync when connection is restored
    console.log('[Sync] Triggering background sync...');
    this.triggerBackgroundSync();

    // Notify UI about connection change
    window.dispatchEvent(
      new CustomEvent('connection-change', {
        detail: { isOnline: true, timestamp: Date.now() },
      })
    );
  },

  pauseSync() {
    // Notify UI about connection change
    window.dispatchEvent(
      new CustomEvent('connection-change', {
        detail: { isOnline: false, timestamp: Date.now() },
      })
    );
  },

  triggerBackgroundSync() {
    // Sync all data types that might have pending changes
    const dataTypes = [
      'transactions',
      'accounts',
      'settings',
      'goals',
      'investments',
    ];

    dataTypes.forEach(dataType => {
      try {
        const data = localStorage.getItem(dataType);
        if (data) {
          this.pushToCloud(dataType, JSON.parse(data));
        }
      } catch (error) {
        console.error(`[Sync] Background sync failed for ${dataType}:`, error);
      }
    });
  },
};
