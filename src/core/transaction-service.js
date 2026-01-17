/**
 * TransactionService
 *
 * Handles all transaction-related operations, persistence, and complex logic like splitting.
 */

import { STORAGE_KEYS } from '../utils/constants.js';
import { SyncService } from './sync-service.js';
import { AuthService } from './auth-service.js';
import { AccountService } from './account-service.js';
import { generateId } from '../utils/id-utils.js';
import { safeJsonParse } from '../utils/security-utils.js';

const TRANSACTIONS_KEY = STORAGE_KEYS.TRANSACTIONS;

export const TransactionService = {
  /**
   * Get all transactions
   * @returns {Array} List of transactions
   */
  getAll() {
    const data = localStorage.getItem(TRANSACTIONS_KEY);
    let transactions = data ? safeJsonParse(data) : [];

    // Migration: Ensure all transactions have an accountId
    const defaultAccount = AccountService.getDefaultAccount();
    let hasChanges = false;

    transactions = transactions.map(t => {
      if (!t.accountId) {
        hasChanges = true;
        return { ...t, accountId: defaultAccount.id };
      }
      return t;
    });

    if (hasChanges) {
      this._persist(transactions, false);
    }

    return transactions;
  },

  /**
   * Add a new transaction
   * @param {Object} transaction - Transaction data
   * @returns {Object} Added transaction
   */
  add(transaction) {
    const transactions = this.getAll();

    if (!transaction.accountId) {
      transaction.accountId = AccountService.getDefaultAccount().id;
    }

    const newTransaction = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: AuthService.getUserId(),
      ...transaction,
    };

    transactions.unshift(newTransaction);
    this._persist(transactions);
    return newTransaction;
  },

  /**
   * Get a specific transaction by ID
   * @param {string} id - Transaction ID
   * @returns {Object|null} Transaction or null if not found/unauthorized
   */
  get(id) {
    const transactions = this.getAll();
    const t = transactions.find(t => t.id === id);
    if (!t) return undefined;

    // IDOR Protection: Verify ownership
    const currentUserId = AuthService.getUserId();
    if (t.userId && currentUserId && t.userId !== currentUserId) {
      console.warn(
        `[TransactionService] Ownership mismatch for transaction ${id}`
      );
      return undefined;
    }

    return t;
  },

  /**
   * Update a transaction
   * @param {string} id - Transaction ID
   * @param {Object} updates - Updated fields
   * @returns {Object|null} Updated transaction
   */
  update(id, updates) {
    const transactions = this.getAll();
    const index = transactions.findIndex(t => t.id === id);
    if (index === -1) return null;

    transactions[index] = {
      ...transactions[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this._persist(transactions);
    return transactions[index];
  },

  /**
   * Remove a transaction
   * @param {string} id - Transaction ID
   */
  remove(id) {
    let transactions = this.getAll();
    transactions = transactions.filter(t => t.id !== id);
    this._persist(transactions);
  },

  /**
   * Split a transaction into two parts
   * @param {string} id - Original transaction ID
   * @returns {Object|null} Result object with new transactions { first, second }
   */
  split(id) {
    const original = this.get(id);
    if (!original) return null;

    const originalAmount = original.amount;
    const half = originalAmount / 2;

    // Round first part down to nearest 0.50
    const firstAmount = Math.floor(half * 2) / 2;
    const secondAmount = originalAmount - firstAmount;

    // Create first transaction (rounded down)
    const firstTransaction = {
      ...original,
      amount: firstAmount,
    };
    delete firstTransaction.id;

    // Create second transaction (remainder)
    const secondTransaction = {
      ...original,
      amount: secondAmount,
    };
    delete secondTransaction.id;

    // Add both
    const addedFirst = this.add(firstTransaction);
    const addedSecond = this.add(secondTransaction);

    // Remove original
    this.remove(id);

    return { first: addedFirst, second: addedSecond };
  },

  /**
   * Clear all transactions
   */
  clear() {
    localStorage.removeItem(TRANSACTIONS_KEY);
  },

  /**
   * Private helper to persist transactions
   */
  _persist(transactions, sync = true) {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
    if (sync) {
      SyncService.pushToCloud(TRANSACTIONS_KEY, transactions);
    }
  },
};
