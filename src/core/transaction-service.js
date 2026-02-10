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
import { auditService, auditEvents } from './audit-service.js';
import { PrivacyService } from './privacy-service.js';

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
      this._persist(transactions, true); // Push migration changes to cloud
    }

    return transactions;
  },

  /**
   * Get all transactions for export (sanitized)
   * @returns {Array} List of transactions with internal fields removed
   */
  getAllForExport() {
    const transactions = this.getAll();

    // Audit log data export
    auditService.log(
      auditEvents.DATA_EXPORT,
      {
        entityType: 'transaction',
        count: transactions.length,
        format: 'json',
      },
      AuthService.getUserId(),
      'medium'
    );

    return transactions.map(transaction => {
      // Create a copy and remove internal fields
      const exportTx = { ...transaction };
      delete exportTx.internalId;
      delete exportTx.metadata;
      return exportTx;
    });
  },

  /**
   * Get all transactions (alias for getAll for API consistency)
   * @returns {Array} List of transactions
   */
  getAllTransactions() {
    return this.getAll();
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
      timestamp: transaction.timestamp || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: AuthService.getUserId(),
      ...transaction,
    };

    // Apply data minimization
    const sanitizedTransaction = PrivacyService.sanitizeDataForStorage(
      newTransaction,
      'transaction'
    );

    transactions.unshift(sanitizedTransaction);
    this._persist(transactions);

    // Audit log transaction creation
    auditService.log(
      auditEvents.DATA_CREATE,
      {
        entityType: 'transaction',
        entityId: sanitizedTransaction.id,
        amount: sanitizedTransaction.amount,
        category: sanitizedTransaction.category,
        accountId: sanitizedTransaction.accountId,
      },
      AuthService.getUserId(),
      'low'
    );

    return sanitizedTransaction;
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

    const originalTransaction = transactions[index];
    transactions[index] = {
      ...transactions[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this._persist(transactions);

    // Audit log transaction update
    auditService.log(
      auditEvents.DATA_UPDATE,
      {
        entityType: 'transaction',
        entityId: id,
        changes: Object.keys(updates),
        originalAmount: originalTransaction.amount,
        newAmount: updates.amount || originalTransaction.amount,
      },
      AuthService.getUserId(),
      'low'
    );

    return transactions[index];
  },

  /**
   * Remove a transaction
   * @param {string} id - Transaction ID
   */
  remove(id) {
    const transaction = this.get(id);
    if (!transaction) return;

    if (transaction && transaction.ghostId) {
      // Cascade to ghost if this is a moved transaction being deleted
      this.remove(transaction.ghostId);
    }

    let transactions = this.getAll();
    transactions = transactions.filter(t => t.id !== id);
    this._persist(transactions);

    // Audit log transaction deletion
    auditService.log(
      auditEvents.DATA_DELETE,
      {
        entityType: 'transaction',
        entityId: id,
        amount: transaction.amount,
        category: transaction.category,
      },
      AuthService.getUserId(),
      'medium'
    );
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
    const transactionCount = this.getAll().length;
    localStorage.removeItem(TRANSACTIONS_KEY);

    // Audit log bulk transaction deletion
    auditService.log(
      auditEvents.DATA_DELETE,
      {
        entityType: 'transaction',
        operation: 'bulk_clear',
        count: transactionCount,
      },
      AuthService.getUserId(),
      'high'
    );
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
