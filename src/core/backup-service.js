/**
 * BackupService — the single local data-safety service for BlinkBudget.
 *
 * Owns three jobs:
 *   1. Daily Firestore backup + restore (cloud safety net)
 *   2. Emergency JSON/CSV export & integrity validation (absorbs
 *      emergency-export-service.js)
 *   3. Emergency recovery + transaction repair (absorbs
 *      emergency-recovery-service.js and data-cleanup-service.js)
 *
 * Integrity checks live in data-integrity-service.js; nothing else should
 * grow here without first asking "does the user need this?"
 */

import { getDb } from './firebase-config.js';
import { AuthService } from './auth-service.js';
import { TransactionService } from './transaction-service.js';
import { AccountService } from './Account/account-service.js';
import { SettingsService } from './settings-service.js';
import { BudgetService } from './budget-service.js';
import { goalPlanner } from './goal-planner.js';
import { investmentTracker } from './investment-tracker.js';
import {
  showProgressIndicator,
  hideProgressIndicator,
} from '../utils/progress-indicators.js';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { STORAGE_KEYS } from '../utils/constants.js';
import { safeJsonParse } from '../utils/security-utils.js';

const EXPORT_SECTIONS = [
  'transactions',
  'accounts',
  'budgets',
  'goals',
  'investments',
  'settings',
];

export const BackupService = {
  init() {
    setTimeout(() => {
      this.checkAndCreateBackup();
    }, 30000);

    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });
  },

  handleVisibilityChange() {
    if (!document.hidden) {
      console.log('[Backup] App became visible, checking for backup');
      setTimeout(() => {
        this.checkAndCreateBackup();
      }, 1000);
    }
  },

  async checkAndCreateBackup() {
    const lastBackupDate = SettingsService.getSetting('lastBackupDate');
    const today = this.getTodayISO();

    if (!lastBackupDate || lastBackupDate !== today) {
      if (!navigator.onLine) {
        console.log('[Backup] Skipping backup - offline');
        return;
      }

      try {
        await this.createBackup();
        SettingsService.saveSetting('lastBackupDate', today);
        SettingsService.saveSetting(
          'lastBackupDataAsOf',
          this.getYesterdayISO()
        );

        window.dispatchEvent(
          new CustomEvent('backup-operation', {
            detail: { operation: 'backup', status: 'completed' },
          })
        );
        console.log('[Backup] Daily backup created successfully');
      } catch (error) {
        console.error('[Backup] Failed to create backup:', error);
        window.dispatchEvent(
          new CustomEvent('backup-operation', {
            detail: {
              operation: 'backup',
              status: 'failed',
              error: error.message,
            },
          })
        );
      }
    }
  },

  async createBackup() {
    const userId = AuthService.getUserId();
    if (!userId) return;

    const backupData = {
      backupDate: this.getTodayISO(),
      dataAsOf: this.getYesterdayISO(),
      transactions: TransactionService.getAll(),
      accounts: AccountService.getAccounts(),
      settings: SettingsService.getAllSettings(),
      goals: goalPlanner?.getAllGoals ? goalPlanner.getAllGoals() : [],
      investments: investmentTracker?.getAllInvestments
        ? investmentTracker.getAllInvestments()
        : [],
    };

    const backupRef = doc(getDb(), 'users', userId, 'backups', 'daily_backup');
    await setDoc(backupRef, backupData);
  },

  async fetchBackup() {
    const userId = AuthService.getUserId();
    if (!userId) return null;

    try {
      const backupRef = doc(
        getDb(),
        'users',
        userId,
        'backups',
        'daily_backup'
      );
      const backupSnap = await getDoc(backupRef);

      if (backupSnap.exists()) {
        return backupSnap.data();
      }
    } catch (error) {
      console.error('[Backup] Failed to fetch backup:', error);
      throw error;
    }
    return null;
  },

  /**
   * Shared apply logic used by both restoreBackup() and recovery.
   */
  _applyRestoredData(backup) {
    const restored = {
      transactions: 0,
      accounts: 0,
      goals: 0,
      investments: 0,
    };

    if (Array.isArray(backup.transactions)) {
      TransactionService.clear();
      backup.transactions.forEach(t => TransactionService.add(t));
      restored.transactions = backup.transactions.length;
    }

    if (Array.isArray(backup.accounts)) {
      AccountService.clear();
      AccountService.batchSet(backup.accounts);
      restored.accounts = backup.accounts.length;
    }

    if (Array.isArray(backup.goals)) {
      goalPlanner.clearAllGoals();
      goalPlanner.batchSetGoals(backup.goals);
      restored.goals = backup.goals.length;
    }

    if (Array.isArray(backup.investments)) {
      investmentTracker.clearAllInvestments();
      investmentTracker.batchSetInvestments(backup.investments);
      restored.investments = backup.investments.length;
    }

    return restored;
  },

  async restoreBackup() {
    if (!navigator.onLine) {
      throw new Error('Restore requires internet connection');
    }

    const progressId = 'backup-restore';
    showProgressIndicator(
      progressId,
      'Restoring from backup...',
      document.body,
      { showCancel: false }
    );

    window.dispatchEvent(
      new CustomEvent('backup-operation', {
        detail: { operation: 'restore', status: 'starting' },
      })
    );

    try {
      const backup = await this.fetchBackup();
      if (!backup || !backup.transactions) {
        throw new Error('No backup data available');
      }

      const restored = this._applyRestoredData(backup);

      window.dispatchEvent(
        new CustomEvent('backup-operation', {
          detail: { operation: 'restore', status: 'completed', ...restored },
        })
      );

      console.log(
        `[Backup] Restore completed: ${restored.transactions} transactions, ${restored.accounts} accounts, ${restored.goals} goals, ${restored.investments} investments restored`
      );
      hideProgressIndicator(progressId);

      return restored;
    } catch (error) {
      console.error('[Backup] Restore failed:', error);
      window.dispatchEvent(
        new CustomEvent('backup-operation', {
          detail: {
            operation: 'restore',
            status: 'failed',
            error: error.message,
          },
        })
      );
      hideProgressIndicator(progressId);
      throw error;
    }
  },

  getTodayISO() {
    return new Date().toISOString().split('T')[0];
  },

  getYesterdayISO() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  },

  // ==================== Emergency Export (absorbed) ====================

  /**
   * Collect all user data into export sections.
   */
  _collectExportData() {
    const wrap = items => ({
      count: Array.isArray(items) ? items.length : 0,
      items: Array.isArray(items) ? items : [],
    });

    let budgets;
    try {
      budgets = BudgetService.getAll();
    } catch {
      budgets = [];
    }

    return {
      transactions: wrap(TransactionService.getAll()),
      accounts: wrap(AccountService.getAccounts()),
      budgets: wrap(budgets),
      goals: wrap(goalPlanner?.getAllGoals ? goalPlanner.getAllGoals() : []),
      investments: wrap(
        investmentTracker?.getAllInvestments
          ? investmentTracker.getAllInvestments()
          : []
      ),
      settings: SettingsService.getAllSettings() || {},
    };
  },

  /**
   * Small deterministic hash (djb2) for integrity checksums.
   */
  _simpleHash(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
    }
    return (hash >>> 0).toString(16);
  },

  _generateIntegrityChecksums(data) {
    const checksums = {};
    EXPORT_SECTIONS.forEach(section => {
      checksums[section] = this._simpleHash(JSON.stringify(data[section]));
    });
    checksums.overall = this._simpleHash(JSON.stringify(checksums));
    return checksums;
  },

  _generateFilename(format = 'json') {
    const date = new Date().toISOString().slice(0, 10);
    return `blinkbudget-emergency-${date}.${format}`;
  },

  /**
   * Trigger a browser download for the export payload.
   */
  _downloadFile(payload, format = 'json') {
    const isCsv = format === 'csv';
    const content = isCsv ? payload : JSON.stringify(payload, null, 2);
    const blob = new Blob([content], {
      type: isCsv ? 'text/csv;charset=utf-8;' : 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = this._generateFilename(format);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return content.length;
  },

  _convertToCSV(data) {
    const tx = (data.transactions && data.transactions.items) || [];
    if (tx.length === 0) return '';
    const headers = ['id', 'date', 'type', 'category', 'amount', 'note'];
    const escapeCell = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    return [
      headers.join(','),
      ...tx.map(t =>
        headers
          .map(h => escapeCell(t[h] ?? t[h === 'note' ? 'description' : h]))
          .join(',')
      ),
    ].join('\n');
  },

  _getAppVersion() {
    // eslint-disable-next-line no-undef
    return typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';
  },

  async createEmergencyExport(options = {}) {
    const { format = 'json', reason = 'manual' } = options;

    try {
      const data = this._collectExportData();
      const integrity = this._generateIntegrityChecksums(data);
      const dataCount =
        EXPORT_SECTIONS.reduce((sum, s) => sum + (data[s]?.count || 0), 0) || 0;

      const payload = {
        meta: {
          type: 'emergency-export',
          appVersion: this._getAppVersion(),
          createdAt: new Date().toISOString(),
          reason,
          dataCount,
        },
        data,
        integrity,
      };

      const size =
        format === 'csv'
          ? this._downloadFile(this._convertToCSV(data), 'csv')
          : this._downloadFile(payload, 'json');

      return {
        success: true,
        filename: this._generateFilename(format),
        size,
        format,
        dataCount,
        downloadUrl: null,
      };
    } catch (error) {
      console.error('[Backup] Emergency export failed:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Validate an export payload's integrity checksums.
   * @returns {Object} { valid, mismatches, checksums }
   */
  async validateExportIntegrity(exportData) {
    const mismatches = [];
    const checksums = {};

    try {
      const data = exportData?.data;
      const stored = exportData?.integrity || {};

      if (!data || typeof data !== 'object') {
        return { valid: false, mismatches: ['data'], checksums };
      }

      EXPORT_SECTIONS.forEach(section => {
        if (stored[section] === undefined) return; // legacy payloads
        const computed = this._simpleHash(JSON.stringify(data[section]));
        checksums[section] = computed;
        if (computed !== stored[section]) {
          mismatches.push(section);
        }
      });
      checksums.overall = this._simpleHash(
        JSON.stringify({ ...checksums, overall: undefined })
      );

      return {
        valid: mismatches.length === 0,
        mismatches,
        checksums,
      };
    } catch (error) {
      console.error('[Backup] Integrity validation failed:', error);
      return { valid: false, mismatches: ['validation'], checksums };
    }
  },

  // ==================== Emergency Recovery (absorbed) ====================

  async performEmergencyRecovery() {
    const steps = [];
    const errors = [];
    const warnings = [];
    const step = (name, status) => steps.push({ name, status });

    step('Validate environment', 'completed');

    // Strategy 1: cloud backup
    let backup = null;
    if (navigator.onLine) {
      try {
        backup = await this.fetchBackup();
        step('Fetch cloud backup', backup ? 'completed' : 'skipped');
      } catch (error) {
        warnings.push(`Cloud backup unavailable: ${error.message}`);
        step('Fetch cloud backup', 'failed');
      }
    } else {
      warnings.push('Offline - cloud backup unavailable');
      step('Fetch cloud backup', 'skipped');
    }

    // Strategy 2: salvage raw localStorage transactions
    let salvaged = null;
    if (!backup || !backup.transactions) {
      try {
        const raw = safeJsonParse(
          localStorage.getItem(STORAGE_KEYS.TRANSACTIONS),
          []
        );
        if (Array.isArray(raw) && raw.length > 0) {
          salvaged = raw.filter(
            t => t && t.id && Number.isFinite(Number(t.amount))
          );
          step('Salvage local storage', 'completed');
          if (salvaged.length < raw.length) {
            warnings.push(
              `Discarded ${raw.length - salvaged.length} corrupt entries during salvage`
            );
          }
        } else {
          step('Salvage local storage', 'skipped');
        }
      } catch (error) {
        errors.push(`Local storage salvage failed: ${error.message}`);
        step('Salvage local storage', 'failed');
      }
    }

    if (
      (!backup || !backup.transactions) &&
      (!salvaged || salvaged.length === 0)
    ) {
      errors.push('No recoverable data found');
      step('Restore data', 'failed');
      return { success: false, dataRestored: {}, steps, errors, warnings };
    }

    try {
      let restored = {};
      if (backup && backup.transactions) {
        restored = this._applyRestoredData(backup);
        step('Restore data (cloud)', 'completed');
      } else {
        TransactionService.clear();
        salvaged.forEach(t => TransactionService.add(t));
        restored = { transactions: salvaged.length };
        step('Restore data (local salvage)', 'completed');
      }

      window.dispatchEvent(
        new CustomEvent('storage-updated', {
          detail: { key: STORAGE_KEYS.TRANSACTIONS },
        })
      );

      return {
        success: true,
        dataRestored: restored,
        steps,
        errors,
        warnings,
      };
    } catch (error) {
      errors.push(`Apply recovered data failed: ${error.message}`);
      step('Restore data', 'failed');
      return { success: false, dataRestored: {}, steps, errors, warnings };
    }
  },

  // ==================== Transaction Repair (absorbed) ====================

  /**
   * Repair common transaction data issues in place.
   * @returns {Object} { fixed, errors, details, warnings? }
   */
  async fixTransactionDataIssues() {
    const results = { fixed: 0, errors: 0, details: [] };

    // Safety backup before making changes
    try {
      const backupData = {
        timestamp: new Date().toISOString(),
        transactions: TransactionService.getAll(),
        accounts: AccountService.getAccounts(),
      };
      localStorage.setItem(
        `cleanup_backup_${Date.now()}`,
        JSON.stringify(backupData)
      );
      results.details.push('Created safety backup before cleanup');
    } catch (backupError) {
      results.warnings = [`Failed to create backup: ${backupError.message}`];
    }

    try {
      const transactions = TransactionService.getAll();
      const accountIds = new Set(AccountService.getAccounts().map(a => a.id));
      const seenIds = new Set();
      let changed = false;

      for (const transaction of transactions) {
        let hasChanges = false;

        // Fix missing or invalid dates
        if (
          !transaction.date ||
          Number.isNaN(new Date(transaction.date).getTime())
        ) {
          transaction.date = new Date().toISOString().split('T')[0];
          hasChanges = true;
          results.details.push(
            `Fixed date for ${transaction.category || 'Unknown'} transaction (${transaction.amount ?? 'N/A'})`
          );
        }

        // Fix missing categories (skip transfers - they use toAccountId)
        if (
          transaction.type !== 'transfer' &&
          (!transaction.category || typeof transaction.category !== 'string')
        ) {
          transaction.category = 'Uncategorized';
          hasChanges = true;
          results.details.push(
            `Fixed category for $${transaction.amount || 'N/A'} transaction`
          );
        }

        // Ensure amount is valid (allow negative for refunds)
        if (
          typeof transaction.amount !== 'number' ||
          !Number.isFinite(transaction.amount)
        ) {
          transaction.amount = Math.abs(parseFloat(transaction.amount) || 0);
          hasChanges = true;
          results.details.push(
            `Fixed amount for ${transaction.category || 'Unknown'} transaction`
          );
        }

        // Fix missing or invalid transaction type
        const validTypes = ['income', 'expense', 'transfer', 'refund'];
        if (!validTypes.includes(transaction.type)) {
          transaction.type = 'expense';
          hasChanges = true;
          results.details.push(
            `Fixed type for ${transaction.category || 'Unknown'} transaction - now: expense`
          );
        }

        // Reset orphaned account references to the default account
        if (transaction.accountId && !accountIds.has(transaction.accountId)) {
          const fallback = AccountService.getDefaultAccount?.()?.id || null;
          if (fallback && fallback !== transaction.accountId) {
            transaction.accountId = fallback;
            hasChanges = true;
            results.details.push('Reset orphaned accountId to default account');
          }
        }

        // Drop duplicate ids (keep first occurrence)
        if (seenIds.has(transaction.id)) {
          hasChanges = false; // removal handled below
          results.fixed++;
          results.details.push(
            `Removed duplicate transaction id ${transaction.id}`
          );
          continue;
        }
        seenIds.add(transaction.id);

        if (hasChanges) {
          results.fixed++;
          changed = true;
        }
      }

      if (changed || results.fixed > 0) {
        TransactionService.clear();
        transactions.forEach(t => TransactionService.add(t));
      }
    } catch (error) {
      results.errors++;
      console.error('[Backup] Transaction repair failed:', error);
    }

    return results;
  },
};
