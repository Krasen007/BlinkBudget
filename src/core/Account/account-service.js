/**
 * AccountService
 *
 * Handles all account-related operations, persistence, and synchronization.
 */

import { STORAGE_KEYS, DEFAULTS } from '../../utils/constants.js';
import { SyncService } from '../sync-service.js';
import { AuthService } from '../auth-service.js';
import { safeJsonParse } from '../../utils/security-utils.js';

const ACCOUNTS_KEY = STORAGE_KEYS.ACCOUNTS;

export const AccountService = {
  /**
   * Get all accounts
   * @returns {Array} List of accounts
   */
  getAccounts() {
    const data = localStorage.getItem(ACCOUNTS_KEY);
    if (!data) {
      // Initialize default account if none exist
      const defaultAccount = {
        id: DEFAULTS.ACCOUNT_ID,
        name: DEFAULTS.ACCOUNT_NAME,
        type: DEFAULTS.ACCOUNT_TYPE,
        isDefault: true,
        timestamp: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([defaultAccount]));
      return [defaultAccount];
    }

    try {
      const accounts = safeJsonParse(data);
      return this._cleanAccounts(accounts);
    } catch (error) {
      console.error('[AccountService] Failed to parse accounts data:', error);
      return [];
    }
  },

  /**
   * Save/Update an account
   * @param {Object} account - Account object
   * @returns {Object} Saved account
   */
  saveAccount(account) {
    if (!account.id) {
      throw new Error('[AccountService] Account ID is required for saving.');
    }

    if (!account.timestamp) {
      account.timestamp = new Date().toISOString();
    }

    const userId = AuthService.getUserId();
    if (userId) {
      account.userId = userId;
    }

    console.log('[AccountService] Saving account:', account.name, account.id);
    const accounts = this.getAccounts();
    const index = accounts.findIndex(a => a.id === account.id);
    const isUpdate = index !== -1;

    if (isUpdate) {
      accounts[index] = {
        ...accounts[index],
        ...account,
        updatedAt: new Date().toISOString(),
      };
      account = accounts[index]; // Update the reference to return
    } else {
      account.updatedAt = new Date().toISOString();
      accounts.push(account);
    }

    // Ensure only one default
    if (account.isDefault) {
      accounts.forEach(a => {
        if (a.id !== account.id) a.isDefault = false;
      });
    }

    this._persist(accounts);

    return account;
  },

  /**
   * Delete an account
   * @param {string} id - Account ID
   * @returns {boolean} Success status
   */
  deleteAccount(id) {
    console.log('[AccountService] Deleting account:', id);
    let accounts = this.getAccounts();

    // Prevent deleting the last account
    if (accounts.length <= 1) return false;

    accounts = accounts.filter(a => a.id !== id);

    // Ensure there's still a default
    if (!accounts.some(a => a.isDefault)) {
      accounts[0].isDefault = true;
    }

    this._persist(accounts);

    return true;
  },

  /**
   * Get the default account
   * @returns {Object} Default account
   */
  getDefaultAccount() {
    const accounts = this.getAccounts();
    return accounts.find(a => a.isDefault) || accounts[0];
  },

  /**
   * Check if an account name/type combo is a duplicate
   * @param {string} name - Account name
   * @param {string} type - Account type
   * @param {string} excludeId - Optional ID to exclude from check
   * @returns {boolean}
   */
  isAccountDuplicate(name, type, excludeId = null) {
    const accounts = this.getAccounts();
    return accounts.some(
      acc =>
        acc.name.toLowerCase() === name.toLowerCase() &&
        acc.type === type &&
        acc.id !== excludeId
    );
  },

  /**
   * Private helper to remove duplicate accounts (without persistence)
   */
  _removeDuplicateAccounts(accounts) {
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

    return cleaned;
  },

  /**
   * Private helper to deduplicate and clean account data
   */
  _cleanAccounts(accounts, skipPersist = false) {
    const cleaned = this._removeDuplicateAccounts(accounts);

    if (!skipPersist && cleaned.length !== accounts.length) {
      this._persist(cleaned, false); // Persist but don't push to cloud if just cleaning
    }

    return cleaned;
  },

  /**
   * Private helper to persist accounts
   */
  _persist(accounts, sync = true) {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    if (sync) {
      SyncService.pushToCloud(ACCOUNTS_KEY, accounts);
    }
  },

  /**
   * Clear all accounts (for restore operations)
   */
  clear() {
    console.log('[AccountService] Clearing all accounts');
    localStorage.removeItem(ACCOUNTS_KEY);
  },

  /**
   * Set multiple accounts at once (for restore operations)
   * @param {Array} accounts - Array of account objects
   */
  batchSet(accounts) {
    if (!Array.isArray(accounts)) {
      throw new Error(
        '[AccountService] batchSet requires an array of accounts'
      );
    }

    console.log(`[AccountService] Setting ${accounts.length} accounts`);

    // Clean and validate accounts (skip persistence for now)
    const cleanedAccounts = this._cleanAccounts(accounts, true);

    // Ensure at least one account exists
    if (cleanedAccounts.length === 0) {
      const defaultAccount = {
        id: DEFAULTS.ACCOUNT_ID,
        name: DEFAULTS.ACCOUNT_NAME,
        type: DEFAULTS.ACCOUNT_TYPE,
        isDefault: true,
        timestamp: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      cleanedAccounts.push(defaultAccount);
    }

    // Ensure only one default account
    const defaultAccounts = cleanedAccounts.filter(a => a.isDefault);
    if (defaultAccounts.length === 0) {
      cleanedAccounts[0].isDefault = true;
    } else if (defaultAccounts.length > 1) {
      // Find the first account that is actually marked as default
      const firstTrueDefaultIndex = cleanedAccounts.findIndex(
        a => a.isDefault === true
      );
      // Set all accounts to non-default except the first true default
      cleanedAccounts.forEach((account, index) => {
        account.isDefault = index === firstTrueDefaultIndex;
      });
    }

    this._persist(cleanedAccounts);

    return cleanedAccounts;
  },
};
