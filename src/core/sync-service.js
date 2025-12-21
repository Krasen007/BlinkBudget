import { db } from './firebase-config.js';
import { AuthService } from './auth-service.js';
import {
    doc,
    setDoc,
    onSnapshot,
    collection,
    query,
    getDocs,
    writeBatch
} from "firebase/firestore";
import { STORAGE_KEYS } from '../utils/constants.js';

export const SyncService = {
    unsubscribes: [],

    async init() {
        AuthService.init(async (user) => {
            if (user) {
                await this.pullFromCloud(user.uid);
                this.startRealtimeSync(user.uid);
            } else {
                this.stopSync();
            }
        });
    },

    stopSync() {
        this.unsubscribes.forEach(unsub => unsub());
        this.unsubscribes = [];
    },

    async pushToCloud(dataType, data) {
        const userId = AuthService.getUserId();
        if (!userId) return;

        try {
            const userDocRef = doc(db, "users", userId);
            // Wrap arrays in { items: data } for consistent storage, objects stay as they are
            const payload = Array.isArray(data) ? { items: data } : data;

            console.log(`[Sync] Pushing ${dataType} to cloud...`);
            await setDoc(doc(userDocRef, dataType, "data"), payload, { merge: true });
        } catch (error) {
            console.error(`[Sync] Failed to push ${dataType} to cloud:`, error);
        }
    },

    async pullFromCloud(userId) {
        console.log("[Sync] Pulling data from cloud for user:", userId);
        const userDocRef = doc(db, "users", userId);
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
        console.log("[Sync] Starting realtime sync for user:", userId);

        const keys = [STORAGE_KEYS.TRANSACTIONS, STORAGE_KEYS.ACCOUNTS, STORAGE_KEYS.SETTINGS];

        keys.forEach(key => {
            const unsub = onSnapshot(doc(db, "users", userId, key, "data"), (doc) => {
                if (doc.exists()) {
                    const rawData = doc.data();
                    const processedData = rawData.items || rawData;
                    console.log(`[Sync] Realtime Update for ${key} received.`);
                    this.mergeLocalWithCloud(key, processedData);
                }
            });
            this.unsubscribes.push(unsub);
        });
    },

    mergeLocalWithCloud(key, cloudData) {
        const localRaw = localStorage.getItem(key);

        if (Array.isArray(cloudData)) {
            const localData = JSON.parse(localRaw || '[]');
            // Cloud items take precedence over local items with same ID
            const merged = this.uniqueById([...cloudData, ...localData]);
            localStorage.setItem(key, JSON.stringify(merged));
        } else if (typeof cloudData === 'object' && cloudData !== null) {
            // For settings objects, merge them
            const localData = JSON.parse(localRaw || '{}');
            const merged = { ...localData, ...cloudData };
            localStorage.setItem(key, JSON.stringify(merged));
        }

        // Dispatch event so UI updates
        window.dispatchEvent(new CustomEvent('storage-updated', { detail: { key } }));
    },

    uniqueById(items) {
        const seen = new Set();
        return items.filter(item => {
            if (!item.id || seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
        });
    }
};
