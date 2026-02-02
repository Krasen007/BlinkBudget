/**
 * AccountService
 *
 * Handles all account-related operations, persistence, and synchronization.
 */

import { STORAGE_KEYS, DEFAULTS } from '../utils/constants.js';
import { SyncService } from './sync-service.js';
import { AuthService } from './auth-service.js';
import { safeJsonParse } from '../utils/security-utils.js';
import { auditService, auditEvents } from './audit-service.js';

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

    // Audit log account operation
    auditService.log(
      isUpdate ? auditEvents.DATA_UPDATE : auditEvents.DATA_CREATE,
      {
        entityType: 'account',
        entityId: account.id,
        accountName: account.name,
        accountType: account.type,
        operation: isUpdate ? 'update' : 'create',
      },
      userId,
      'low'
    );

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
    const accountToDelete = accounts.find(a => a.id === id);

    // Prevent deleting the last account
    if (accounts.length <= 1) return false;

    accounts = accounts.filter(a => a.id !== id);

    // Ensure there's still a default
    if (!accounts.some(a => a.isDefault)) {
      accounts[0].isDefault = true;
    }

    this._persist(accounts);

    // Audit log account deletion
    auditService.log(
      auditEvents.DATA_DELETE,
      {
        entityType: 'account',
        entityId: id,
        accountName: accountToDelete?.name || 'unknown',
        accountType: accountToDelete?.type || 'unknown',
      },
      AuthService.getUserId(),
      'medium'
    );

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
   * Private helper to deduplicate and clean account data
   */
  _cleanAccounts(accounts) {
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
};
