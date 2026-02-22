/**
 * Emergency Export Service
 * Provides immediate data export capabilities for data loss prevention
 */

import { TransactionService } from './transaction-service.js';
import { AccountService } from './Account/account-service.js';
import { SettingsService } from './settings-service.js';
import { GoalPlanner } from './goal-planner.js';
import { InvestmentTracker } from './investment-tracker.js';
import { BudgetService } from './budget-service.js';
import { AuthService } from './auth-service.js';
import { auditService, auditEvents } from './audit-service.js';

export const EmergencyExportService = {
  /**
   * Create emergency data export with all user data
   * @param {Object} options - Export options
   * @returns {Object} Export result with download URL
   */
  async createEmergencyExport(options = {}) {
    const {
      includeTransactions = true,
      includeAccounts = true,
      includeSettings = true,
      includeGoals = true,
      includeInvestments = true,
      includeBudgets = true,
      format = 'json',
      compress: _compress = false, // Prefix with underscore to indicate intentionally unused
    } = options;

    try {
      // Log emergency export initiation
      auditService.log(
        auditEvents.DATA_EXPORT,
        {
          type: 'emergency',
          format,
          includeTransactions,
          includeAccounts,
          includeSettings,
          includeGoals,
          includeInvestments,
          includeBudgets,
        },
        AuthService.getUserId(),
        'medium'
      );

      const exportData = {
        exportInfo: {
          timestamp: new Date().toISOString(),
          version: '1.0',
          type: 'emergency_export',
          userId: AuthService.getUserId() || 'anonymous',
          appVersion: this.getAppVersion(),
          exportOptions: options,
        },
        data: {},
      };

      // Collect data based on options
      if (includeTransactions) {
        exportData.data.transactions = this.collectTransactionData();
      }

      if (includeAccounts) {
        exportData.data.accounts = this.collectAccountData();
      }

      if (includeSettings) {
        exportData.data.settings = this.collectSettingsData();
      }

      if (includeGoals) {
        exportData.data.goals = this.collectGoalsData();
      }

      if (includeInvestments) {
        exportData.data.investments = this.collectInvestmentData();
      }

      if (includeBudgets) {
        exportData.data.budgets = this.collectBudgetData();
      }

      // Add data integrity checksums
      exportData.integrity = this.generateIntegrityChecksums(exportData.data);

      // Create downloadable file
      const downloadUrl = await this.createDownloadFile(
        exportData,
        format,
        _compress
      );

      // Log successful export
      auditService.log(
        auditEvents.DATA_EXPORT,
        {
          type: 'emergency',
          status: 'success',
          format,
          size: JSON.stringify(exportData).length,
          downloadUrl: downloadUrl ? 'generated' : 'failed',
        },
        AuthService.getUserId(),
        'low'
      );

      return {
        success: true,
        downloadUrl,
        filename: this.generateFilename(format),
        size: JSON.stringify(exportData).length,
        dataCount: this.getDataCount(exportData.data),
        integrity: exportData.integrity,
      };
    } catch (error) {
      console.error('[EmergencyExport] Export failed:', error);

      // Log export failure
      auditService.log(
        auditEvents.DATA_EXPORT,
        {
          type: 'emergency',
          status: 'failed',
          error: error.message,
        },
        AuthService.getUserId(),
        'high'
      );

      return {
        success: false,
        error: error.message,
      };
    }
  },

  /**
   * Collect transaction data with validation
   */
  collectTransactionData() {
    try {
      const transactions = TransactionService.getAll();

      return {
        count: transactions.length,
        items: transactions.map(tx => ({
          id: tx.id,
          amount: tx.amount,
          category: tx.category,
          date: tx.date,
          type: tx.type,
          description: tx.description || '',
          accountId: tx.accountId || null,
          createdAt: tx.createdAt || new Date().toISOString(),
          updatedAt: tx.updatedAt || tx.createdAt || new Date().toISOString(),
        })),
        lastUpdated:
          transactions.length > 0
            ? transactions.reduce((max, tx) => {
              const time = new Date(tx.updatedAt || tx.createdAt).getTime();
              return time > max ? time : max;
            }, 0)
            : null,
      };
    } catch (error) {
      console.error('[EmergencyExport] Failed to collect transactions:', error);
      return { count: 0, items: [], error: error.message };
    }
  },

  /**
   * Collect account data
   */
  collectAccountData() {
    try {
      const accounts = AccountService.getAccounts();

      return {
        count: accounts.length,
        items: accounts.map(account => ({
          id: account.id,
          name: account.name,
          type: account.type,
          balance: account.balance || 0,
          currency: account.currency || 'USD',
          createdAt: account.createdAt || new Date().toISOString(),
          updatedAt:
            account.updatedAt || account.createdAt || new Date().toISOString(),
        })),
        lastUpdated:
          accounts.length > 0
            ? Math.max(
              ...accounts.map(acc =>
                new Date(acc.updatedAt || acc.createdAt).getTime()
              )
            )
            : null,
      };
    } catch (error) {
      console.error('[EmergencyExport] Failed to collect accounts:', error);
      return { count: 0, items: [], error: error.message };
    }
  },

  /**
   * Collect settings data
   */
  collectSettingsData() {
    try {
      const settings = SettingsService.getAllSettings();

      return {
        count: Object.keys(settings).length,
        items: settings,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[EmergencyExport] Failed to collect settings:', error);
      return { count: 0, items: {}, error: error.message };
    }
  },

  /**
   * Collect goals data
   */
  collectGoalsData() {
    try {
      const goals = GoalPlanner?.getAllGoals ? GoalPlanner.getAllGoals() : [];

      return {
        count: goals.length,
        items: goals.map(goal => ({
          id: goal.id,
          name: goal.name,
          targetAmount: goal.targetAmount,
          currentAmount: goal.currentAmount || 0,
          deadline: goal.deadline || null,
          category: goal.category || 'general',
          createdAt: goal.createdAt || new Date().toISOString(),
          updatedAt:
            goal.updatedAt || goal.createdAt || new Date().toISOString(),
        })),
        lastUpdated:
          goals.length > 0
            ? Math.max(
              ...goals.map(goal =>
                new Date(goal.updatedAt || goal.createdAt).getTime()
              )
            )
            : null,
      };
    } catch (error) {
      console.error('[EmergencyExport] Failed to collect goals:', error);
      return { count: 0, items: [], error: error.message };
    }
  },

  /**
   * Collect investment data
   */
  collectInvestmentData() {
    try {
      const investments = InvestmentTracker?.getAllInvestments
        ? InvestmentTracker.getAllInvestments()
        : [];

      return {
        count: investments.length,
        items: investments.map(investment => ({
          id: investment.id,
          symbol: investment.symbol,
          name: investment.name,
          quantity: investment.quantity || 0,
          purchasePrice: investment.purchasePrice || 0,
          currentPrice: investment.currentPrice || 0,
          purchaseDate:
            investment.purchaseDate ||
            investment.createdAt ||
            new Date().toISOString(),
          type: investment.type || 'stock',
          createdAt: investment.createdAt || new Date().toISOString(),
          updatedAt:
            investment.updatedAt ||
            investment.createdAt ||
            new Date().toISOString(),
        })),
        lastUpdated:
          investments.length > 0
            ? Math.max(
              ...investments.map(inv =>
                new Date(inv.updatedAt || inv.createdAt).getTime()
              )
            )
            : null,
      };
    } catch (error) {
      console.error('[EmergencyExport] Failed to collect investments:', error);
      return { count: 0, items: [], error: error.message };
    }
  },

  /**
   * Collect budget data
   */
  collectBudgetData() {
    try {
      const budgets = BudgetService?.getAllBudgets
        ? BudgetService.getAllBudgets()
        : [];

      return {
        count: budgets.length,
        items: budgets.map(budget => ({
          id: budget.id,
          name: budget.name,
          category: budget.category,
          amount: budget.amount || 0,
          spent: budget.spent || 0,
          period: budget.period || 'monthly',
          startDate: budget.startDate || null,
          endDate: budget.endDate || null,
          createdAt: budget.createdAt || new Date().toISOString(),
          updatedAt:
            budget.updatedAt || budget.createdAt || new Date().toISOString(),
        })),
        lastUpdated:
          budgets.length > 0
            ? Math.max(
              ...budgets.map(budget =>
                new Date(budget.updatedAt || budget.createdAt).getTime()
              )
            )
            : null,
      };
    } catch (error) {
      console.error('[EmergencyExport] Failed to collect budgets:', error);
      return { count: 0, items: [], error: error.message };
    }
  },

  /**
   * Generate integrity checksums for data validation
   */
  async generateIntegrityChecksums(data) {
    const crypto = window.crypto || window.msCrypto;
    const checksums = {};

    for (const key of Object.keys(data)) {
      try {
        const dataString = JSON.stringify(data[key]);
        const hashBuffer = await crypto.subtle.digest(
          'SHA-256',
          new TextEncoder().encode(dataString)
        );
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        checksums[key] = hashArray
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      } catch {
        // Fallback to simple hash if crypto not available
        checksums[key] = this.simpleHash(JSON.stringify(data[key]));
      }
    }

    // Generate overall checksum
    const overallData = JSON.stringify(data);
    try {
      const hashBuffer = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(overallData)
      );
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      checksums.overall = hashArray
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } catch {
      checksums.overall = this.simpleHash(overallData);
    }

    return checksums;
  },

  /**
   * Simple hash fallback for environments without crypto
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  },

  /**
   * Create downloadable file
   * @param {*} data - Data to export
   * @param {string} format - Export format ('json' or 'csv')
   * @param {boolean} _compress - Compression flag (unused)
   * @returns {string} Blob URL - Caller must revoke with URL.revokeObjectURL() when done
   */
  async createDownloadFile(data, format = 'json', _compress = false) {
    try {
      let content;
      let mimeType;
      let fileExtension;

      switch (format) {
        case 'json':
          content = JSON.stringify(data, null, 2);
          mimeType = 'application/json';
          fileExtension = 'json';
          break;
        case 'csv':
          content = this.convertToCSV(data);
          mimeType = 'text/csv';
          fileExtension = 'csv';
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      // Create blob
      const blob = new Blob([content], { type: mimeType });

      // Create download URL
      const url = URL.createObjectURL(blob);

      // Auto-download with sanitized filename
      const filename = this.generateFilename(fileExtension);
      const a = document.createElement('a');
      // Validate blob URL format before use (blob URLs are safe by design)
      if (!url.startsWith('blob:')) {
        throw new Error('Invalid blob URL');
      }
      a.href = url;
      a.download = filename;
      a.setAttribute('rel', 'noopener noreferrer');
      // Temporarily append to trigger download (element is not visible)
      a.style.display = 'none';
      a.style.position = 'absolute';
      a.style.left = '-9999px';

      // Use a safer approach to DOM manipulation
      // Create a temporary container that's not attached to the DOM
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.opacity = '0';
      container.style.pointerEvents = 'none';
      container.appendChild(a);

      // Use document.documentElement instead of body for better security
      const root = document.documentElement;
      if (root && root.appendChild && root.removeChild) {
        root.appendChild(container);
        a.click();
        root.removeChild(container);
      } else {
        throw new Error('Unable to access document root');
      }

      // Return URL for caller to manage lifecycle
      // Caller is responsible for revoking with URL.revokeObjectURL(url) when done
      // Auto-revoke after 5 minutes to prevent memory leaks if caller forgets
      setTimeout(
        () => {
          try {
            URL.revokeObjectURL(url);
          } catch {
            // URL may already be revoked
          }
        },
        5 * 60 * 1000
      );

      return url;
    } catch (error) {
      console.error('[EmergencyExport] Failed to create download file:', error);
      throw error;
    }
  },

  /**
   * Generate filename for export
   */
  generateFilename(format = 'json') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const userId = AuthService.getUserId() || 'anonymous';
    // Sanitize userId to prevent XSS in download attribute
    const safeUserId = String(userId)
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 50);
    // Sanitize format parameter
    const safeFormat = String(format)
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 10);
    return `blinkbudget-emergency-export-${safeUserId}-${timestamp}.${safeFormat}`;
  },

  /**
   * Convert data to CSV format with proper escaping
   */
  convertToCSV(data) {
    const rows = [];

    // Helper function to escape CSV fields
    const escapeCsvField = field => {
      if (field === null || field === undefined) return '';
      const str = String(field);
      // If field contains comma, quote, or newline, wrap in quotes and double internal quotes
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Add header
    rows.push('Type,ID,Name/Description,Amount/Target,Date,Created,Updated');

    // Add transactions
    if (data.transactions?.items) {
      data.transactions.items.forEach(tx => {
        rows.push(
          [
            escapeCsvField('transaction'),
            escapeCsvField(tx.id),
            escapeCsvField(tx.description || tx.category),
            escapeCsvField(tx.amount),
            escapeCsvField(tx.date),
            escapeCsvField(tx.createdAt),
            escapeCsvField(tx.updatedAt),
          ].join(',')
        );
      });
    }

    // Add accounts
    if (data.accounts?.items) {
      data.accounts.items.forEach(account => {
        rows.push(
          [
            escapeCsvField('account'),
            escapeCsvField(account.id),
            escapeCsvField(account.name),
            escapeCsvField(account.balance),
            escapeCsvField(''),
            escapeCsvField(account.createdAt),
            escapeCsvField(account.updatedAt),
          ].join(',')
        );
      });
    }

    // Add goals
    if (data.goals?.items) {
      data.goals.items.forEach(goal => {
        rows.push(
          [
            escapeCsvField('goal'),
            escapeCsvField(goal.id),
            escapeCsvField(goal.name || goal.description),
            // Use collected-model field names
            escapeCsvField(goal.targetAmount),
            escapeCsvField(goal.deadline || goal.date),
            escapeCsvField(goal.createdAt),
            escapeCsvField(goal.updatedAt),
          ].join(',')
        );
      });
    }

    // Add investments
    if (data.investments?.items) {
      data.investments.items.forEach(investment => {
        rows.push(
          [
            escapeCsvField('investment'),
            escapeCsvField(investment.id),
            escapeCsvField(investment.name || investment.description),
            // Prefer purchasePrice, fall back to currentPrice
            escapeCsvField(investment.purchasePrice || investment.currentPrice),
            escapeCsvField(investment.purchaseDate || investment.date),
            escapeCsvField(investment.createdAt),
            escapeCsvField(investment.updatedAt),
          ].join(',')
        );
      });
    }

    // Add budgets
    if (data.budgets?.items) {
      data.budgets.items.forEach(budget => {
        rows.push(
          [
            escapeCsvField('budget'),
            escapeCsvField(budget.id),
            escapeCsvField(budget.name || budget.category),
            // Use `amount` as the canonical field in the collected model
            escapeCsvField(budget.amount),
            escapeCsvField(budget.period || budget.startDate),
            escapeCsvField(budget.createdAt),
            escapeCsvField(budget.updatedAt),
          ].join(',')
        );
      });
    }

    return rows.join('\n');
  },

  /**
   * Get data count summary
   */
  getDataCount(data) {
    const count = {};
    Object.keys(data).forEach(key => {
      count[key] = data[key]?.count || 0;
    });
    return count;
  },

  /**
   * Get app version
   */
  getAppVersion() {
    /* global __APP_VERSION__ */
    return typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.17.10';
  },

  /**
   * Validate export integrity
   */
  async validateExportIntegrity(exportData) {
    if (!exportData?.integrity || !exportData?.data) {
      return { valid: false, error: 'Missing integrity or data' };
    }

    const currentChecksums = await this.generateIntegrityChecksums(
      exportData.data
    );
    const originalChecksums = exportData.integrity;

    const mismatches = [];
    Object.keys(currentChecksums).forEach(key => {
      if (currentChecksums[key] !== originalChecksums[key]) {
        mismatches.push(key);
      }
    });

    return {
      valid: mismatches.length === 0,
      mismatches,
      checksums: currentChecksums,
    };
  },
};
