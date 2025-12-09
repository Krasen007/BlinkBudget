const STORAGE_KEY = 'blinkbudget_transactions';

export const StorageService = {
    getAll() {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },

    add(transaction) {
        const transactions = this.getAll();
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

    clear() {
        localStorage.removeItem(STORAGE_KEY);
    },
};
