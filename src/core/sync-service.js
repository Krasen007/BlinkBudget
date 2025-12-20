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
            console.log(`[Sync] Pushing ${dataType} to cloud...`, data.length, "items");
            const userDocRef = doc(db, "users", userId);
            await setDoc(doc(userDocRef, dataType, "data"), { items: data }, { merge: true });
            console.log(`[Sync] ${dataType} pushed successfully.`);
        } catch (error) {
            console.error(`[Sync] Failed to push ${dataType} to cloud:`, error);
        }
    },

    async pullFromCloud(userId) {
        console.log("[Sync] Pulling data from cloud for user:", userId);
        try {
            // Pull transactions
            const txSnap = await getDocs(collection(doc(db, "users", userId), STORAGE_KEYS.TRANSACTIONS));
            if (!txSnap.empty) {
                const txData = txSnap.docs.find(d => d.id === "data")?.data()?.items || [];
                console.log(`[Sync] Found ${txData.length} transactions in cloud.`);
                if (txData.length > 0) {
                    this.mergeLocalWithCloud(STORAGE_KEYS.TRANSACTIONS, txData);
                }
            }

            // Pull accounts
            const accSnap = await getDocs(collection(doc(db, "users", userId), STORAGE_KEYS.ACCOUNTS));
            if (!accSnap.empty) {
                const accData = accSnap.docs.find(d => d.id === "data")?.data()?.items || [];
                console.log(`[Sync] Found ${accData.length} accounts in cloud.`);
                if (accData.length > 0) {
                    this.mergeLocalWithCloud(STORAGE_KEYS.ACCOUNTS, accData);
                }
            }
        } catch (error) {
            console.error("[Sync] Failed to pull from cloud:", error);
        }
    },

    startRealtimeSync(userId) {
        this.stopSync();
        console.log("[Sync] Starting realtime sync for user:", userId);

        // Listen for transaction changes
        const txUnsub = onSnapshot(doc(db, "users", userId, STORAGE_KEYS.TRANSACTIONS, "data"), (doc) => {
            if (doc.exists()) {
                const cloudData = doc.data().items || [];
                console.log(`[Sync] Realtime Update: ${cloudData.length} transactions received.`);
                this.mergeLocalWithCloud(STORAGE_KEYS.TRANSACTIONS, cloudData);
            }
        });

        // Listen for account changes
        const accUnsub = onSnapshot(doc(db, "users", userId, STORAGE_KEYS.ACCOUNTS, "data"), (doc) => {
            if (doc.exists()) {
                const cloudData = doc.data().items || [];
                console.log(`[Sync] Realtime Update: ${cloudData.length} accounts received.`);
                this.mergeLocalWithCloud(STORAGE_KEYS.ACCOUNTS, cloudData);
            }
        });

        this.unsubscribes.push(txUnsub, accUnsub);
    },

    mergeLocalWithCloud(key, cloudData) {
        const localData = JSON.parse(localStorage.getItem(key) || '[]');

        // Simple merge: if cloud has it and local doesn't, add it.
        // For existing items, we'd need a lastModified timestamp to be robust.
        // For now, cloud takes precedence if it exists but we merge to avoid data loss.

        const merged = this.uniqueById([...localData, ...cloudData]);
        localStorage.setItem(key, JSON.stringify(merged));

        // Dispatch event so UI updates
        window.dispatchEvent(new CustomEvent('storage-updated', { detail: { key } }));
    },

    uniqueById(items) {
        const seen = new Set();
        return items.filter(item => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
        });
    }
};
