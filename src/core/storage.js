import { AccountService } from './account-service.js';
import { TransactionService } from './transaction-service.js';
import { SettingsService } from './settings-service.js';
import { generateId } from '../utils/id-utils.js';

/**
 * StorageService (Bridge)
 * 
 * This service now acts as a backward-compatible bridge to specialized domain services.
 * Existing code can continue to use StorageService while being progressively refactored.
 */
export const StorageService = {
    // Utility
    generateId: () => generateId(),

    // --- Accounts (delegated to AccountService) ---
    getAccounts: () => AccountService.getAccounts(),
    saveAccount: (account) => AccountService.saveAccount(account),
    deleteAccount: (id) => AccountService.deleteAccount(id),
    getDefaultAccount: () => AccountService.getDefaultAccount(),
    isAccountDuplicate: (name, type, excludeId) => AccountService.isAccountDuplicate(name, type, excludeId),

    // --- Transactions (delegated to TransactionService) ---
    getAll: () => TransactionService.getAll(),
    add: (transaction) => TransactionService.add(transaction),
    get: (id) => TransactionService.get(id),
    update: (id, updates) => TransactionService.update(id, updates),
    remove: (id) => TransactionService.remove(id),
    clear: () => TransactionService.clear(),

    // --- Settings (delegated to SettingsService) ---
    getSetting: (key) => SettingsService.getSetting(key),
    saveSetting: (key, value) => SettingsService.saveSetting(key, value)
};
