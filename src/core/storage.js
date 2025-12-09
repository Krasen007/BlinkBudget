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

    clear() {
        localStorage.removeItem(STORAGE_KEY);
    },
};
