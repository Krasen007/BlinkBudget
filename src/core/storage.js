import { STORAGE_KEYS, DEFAULTS } from '../utils/constants.js';
import { SyncService } from './sync-service.js';
import { AuthService } from './auth-service.js';

const STORAGE_KEY = STORAGE_KEYS.TRANSACTIONS;
const ACCOUNTS_KEY = STORAGE_KEYS.ACCOUNTS;

export const StorageService = {
    // Utility for ID generation (Pollyfill for crypto.randomUUID)
    generateId() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        // Fallback for secure context issues (http mostly)
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    // --- Accounts ---

    getAccounts() {
        const data = localStorage.getItem(ACCOUNTS_KEY);
        if (!data) {
            // Initialize default account if none exist
            const defaultAccount = {
                id: DEFAULTS.ACCOUNT_ID,
                name: DEFAULTS.ACCOUNT_NAME,
                type: DEFAULTS.ACCOUNT_TYPE,
                isDefault: true
            };
            // Directly save to avoid recursion with saveAccount -> getAccounts
            localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([defaultAccount]));
            return [defaultAccount];
        }
        const accounts = JSON.parse(data);

        // Final fallback: Ensure no duplicates by ID or Name+Type combo
        const seenId = new Set();
        const seenNameType = new Set();
        const cleaned = accounts.filter(acc => {
            if (!acc.id || seenId.has(acc.id)) return false;
            const combo = `${(acc.name || '').toLowerCase()}|${acc.type}`;
            if (seenNameType.has(combo)) return false;
            seenId.add(acc.id);
            seenNameType.add(combo);
            return true;
        });

        if (cleaned.length !== accounts.length) {
            localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(cleaned));
        }

        return cleaned;
    },

    isAccountDuplicate(name, type, excludeId = null) {
        const accounts = this.getAccounts();
        return accounts.some(acc =>
            acc.name.toLowerCase() === name.toLowerCase() &&
            acc.type === type &&
            acc.id !== excludeId
        );
    },

    saveAccount(account) {
        if (!account.timestamp) {
            account.timestamp = new Date().toISOString();
        }
        const userId = AuthService.getUserId();
        if (userId) {
            account.userId = userId;
        }
        console.log("[Storage] Saving account:", account.name, account.id);
        const accounts = this.getAccounts(); // This handles initialization if needed
        const index = accounts.findIndex(a => a.id === account.id);

        if (index !== -1) {
            accounts[index] = account; // Update
        } else {
            accounts.push(account); // Add
        }

        // Ensure only one default
        if (account.isDefault) {
            accounts.forEach(a => {
                if (a.id !== account.id) a.isDefault = false;
            });
        }

        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
        SyncService.pushToCloud(STORAGE_KEYS.ACCOUNTS, accounts);
        return account;
    },

    deleteAccount(id) {
        console.log("[Storage] Deleting account:", id);
        let accounts = this.getAccounts();

        // Prevent deleting the last account
        if (accounts.length <= 1) return false;

        accounts = accounts.filter(a => a.id !== id);

        // Ensure there's still a default
        if (!accounts.some(a => a.isDefault)) {
            accounts[0].isDefault = true;
        }

        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
        SyncService.pushToCloud(STORAGE_KEYS.ACCOUNTS, accounts);
        return true;
    },

    getDefaultAccount() {
        const accounts = this.getAccounts();
        return accounts.find(a => a.isDefault) || accounts[0];
    },

    // --- Transactions ---

    getAll() {
        const data = localStorage.getItem(STORAGE_KEY);
        let transactions = data ? JSON.parse(data) : [];

        // Migration: Ensure all transactions have an accountId
        const defaultAccount = this.getDefaultAccount();
        let hasChanges = false;

        transactions = transactions.map(t => {
            if (!t.accountId) {
                hasChanges = true;
                return { ...t, accountId: defaultAccount.id };
            }
            return t;
        });

        if (hasChanges) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
        }

        return transactions;
    },

    add(transaction) {
        const transactions = this.getAll();

        // Ensure accountId is present
        if (!transaction.accountId) {
            transaction.accountId = this.getDefaultAccount().id;
        }

        const newTransaction = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            userId: AuthService.getUserId(),
            ...transaction,
        };
        transactions.unshift(newTransaction); // Newest first
        localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
        SyncService.pushToCloud(STORAGE_KEYS.TRANSACTIONS, transactions);
        return newTransaction;
    },

    get(id) {
        const transactions = this.getAll();
        const t = transactions.find(t => t.id === id);
        if (!t) return null;

        // IDOR Protection: Verify ownership if userId is present
        const currentUserId = AuthService.getUserId();
        if (t.userId && currentUserId && t.userId !== currentUserId) {
            console.warn(`[Storage] Ownership mismatch for transaction ${id}`);
            return null;
        }

        return t;
    },

    update(id, updates) {
        const transactions = this.getAll();
        const index = transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            transactions[index] = { ...transactions[index], ...updates };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
            SyncService.pushToCloud(STORAGE_KEYS.TRANSACTIONS, transactions);
            return transactions[index];
        }
        return null;
    },

    remove(id) {
        let transactions = this.getAll();
        transactions = transactions.filter(t => t.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
        SyncService.pushToCloud(STORAGE_KEYS.TRANSACTIONS, transactions);
    },

    clear() {
        localStorage.removeItem(STORAGE_KEY);
        // We probably don't want to clear accounts by default to keep the app usable
    },

    // --- Settings ---

    getSetting(key) {
        const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}');
        return settings[key];
    },

    saveSetting(key, value) {
        const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}');
        settings[key] = value;
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        SyncService.pushToCloud(STORAGE_KEYS.SETTINGS, settings);
    }
};
