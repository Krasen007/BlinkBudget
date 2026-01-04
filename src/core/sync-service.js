import { getDb } from './firebase-config.js';
import { AuthService } from './auth-service.js';
import {
    doc,
    setDoc,
    onSnapshot,
    collection,
    getDocs
} from "firebase/firestore";
import { STORAGE_KEYS } from '../utils/constants.js';

export const SyncService = {
    unsubscribes: [],
    pendingWrites: new Map(), // Track pending writes to avoid race conditions
    lastPushTimes: new Map(), // Track last push time per dataType for rate limiting

    async init() {
        AuthService.init(async (user) => {
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

        // handle visibility change to pause/resume sync
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
    },

    handleVisibilityChange() {
        if (document.hidden) {
            console.log("[Sync] App hidden, pausing real-time sync...");
            this.stopSync();
        } else {
            const userId = AuthService.getUserId();
            if (userId) {
                console.log("[Sync] App visible, resuming real-time sync...");
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

            const userDocRef = doc(getDb(), "users", userId);
            // Wrap arrays in { items: data } for consistent storage, objects stay as they are
            const payload = Array.isArray(data) ? { items: data } : data;

            console.log(`[Sync] Pushing ${dataType} to cloud...`);
            await setDoc(doc(userDocRef, dataType, "data"), payload, { merge: true });

            // Keep the write lock for a brief moment to allow Firebase to propagate
            setTimeout(() => {
                if (this.pendingWrites.get(dataType) === writeId) {
                    this.pendingWrites.delete(dataType);
                    console.log(`[Sync] Write lock released for ${dataType}`);
                }
            }, 1000); // 1 second should be enough for Firebase to process
        } catch (error) {
            console.error(`[Sync] Failed to push ${dataType} to cloud:`, error);
            this.pendingWrites.delete(dataType);
        }
    },

    async pullFromCloud(userId) {
        console.log("[Sync] Pulling data from cloud for user:", userId);
        const userDocRef = doc(getDb(), "users", userId);
        const keys = [STORAGE_KEYS.TRANSACTIONS, STORAGE_KEYS.ACCOUNTS, STORAGE_KEYS.SETTINGS];

        for (const key of keys) {
            try {
                const snap = await getDocs(collection(userDocRef, key));
                const dataDoc = snap.docs.find(d => d.id === "data");
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
        console.log("[Sync] Starting offline-first realtime sync for user:", userId);

        const keys = [STORAGE_KEYS.TRANSACTIONS, STORAGE_KEYS.ACCOUNTS, STORAGE_KEYS.SETTINGS];

        keys.forEach(key => {
            const unsub = onSnapshot(
                doc(getDb(), "users", userId, key, "data"),
                {
                    // includeMetadataChanges to know if data is from cache or server
                    includeMetadataChanges: true
                },
                (doc) => {
                    if (doc.exists()) {
                        const rawData = doc.data();
                        const processedData = rawData.items || rawData;

                        // Log whether this is cached data or fresh from server
                        const source = doc.metadata.fromCache ? "cache" : "server";
                        console.log(`[Sync] ${key} loaded from ${source}`);

                        this.mergeLocalWithCloud(key, processedData);
                    }
                },
                (error) => {
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
            // For simple lists, we trust the cloud data to support deletions and renames correctly.
            // Additive merging was causing deleted items to be resurrected and renames to be reverted.
            const localData = JSON.parse(localRaw || '[]');

            // Deduplicate incoming cloud data just in case of server-side duplicates
            const cleanedCloudData = this.uniqueById(cloudData, key);

            // Only update and dispatch if there's an actual change to avoid infinite loops or unnecessary re-renders
            if (JSON.stringify(cleanedCloudData) !== JSON.stringify(localData)) {
                console.log(`[Sync] Updating local ${key} from cloud (Authoritative).`);
                localStorage.setItem(key, JSON.stringify(cleanedCloudData));
                window.dispatchEvent(new CustomEvent('storage-updated', { detail: { key } }));
            }
        } else if (typeof cloudData === 'object' && cloudData !== null) {
            // For settings objects, we still perform a shallow merge to preserve local settings not yet in cloud
            const localData = JSON.parse(localRaw || '{}');
            const merged = { ...localData, ...cloudData };

            if (JSON.stringify(merged) !== JSON.stringify(localData)) {
                console.log(`[Sync] Merging local ${key} with cloud data.`);
                localStorage.setItem(key, JSON.stringify(merged));
                window.dispatchEvent(new CustomEvent('storage-updated', { detail: { key } }));
            }
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
    }
};
