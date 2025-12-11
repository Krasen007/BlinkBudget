const STORAGE_KEY = 'blinkbudget_transactions';
const ACCOUNTS_KEY = 'blinkbudget_accounts';

export const StorageService = {
    // --- Accounts ---

    getAccounts() {
        const data = localStorage.getItem(ACCOUNTS_KEY);
        if (!data) {
            // Initialize default account if none exist
            const defaultAccount = {
                id: 'main',
                name: 'Main Account',
                type: 'checking',
                isDefault: true
            };
            // Directly save to avoid recursion with saveAccount -> getAccounts
            localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([defaultAccount]));
            return [defaultAccount];
        }
        return JSON.parse(data);
    },

    saveAccount(account) {
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
        return account;
    },

    deleteAccount(id) {
        let accounts = this.getAccounts();

        // Prevent deleting the last account
        if (accounts.length <= 1) return false;

        accounts = accounts.filter(a => a.id !== id);

        // Ensure there's still a default
        if (!accounts.some(a => a.isDefault)) {
            accounts[0].isDefault = true;
        }

        localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
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
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            ...transaction,
        };
        transactions.unshift(newTransaction); // Newest first
        localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
        return newTransaction;
    },

    get(id) {
        const transactions = this.getAll();
        return transactions.find(t => t.id === id);
    },

    update(id, updates) {
        const transactions = this.getAll();
        const index = transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            transactions[index] = { ...transactions[index], ...updates };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
            return transactions[index];
        }
        return null;
    },

    remove(id) {
        let transactions = this.getAll();
        transactions = transactions.filter(t => t.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    },

    clear() {
        localStorage.removeItem(STORAGE_KEY);
        // We probably don't want to clear accounts by default to keep the app usable
    },

    // --- Settings ---

    getSetting(key) {
        const settings = JSON.parse(localStorage.getItem('blink_settings') || '{}');
        return settings[key];
    },

    saveSetting(key, value) {
        const settings = JSON.parse(localStorage.getItem('blink_settings') || '{}');
        settings[key] = value;
        localStorage.setItem('blink_settings', JSON.stringify(settings));
    }
};
