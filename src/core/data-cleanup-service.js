/**
 * Data Cleanup Service
 * Helps fix common data integrity issues
 */

import { TransactionService } from './transaction-service.js';
import { AuthService } from './auth-service.js';
import { auditService, auditEvents } from './audit-service.js';

export const DataCleanupService = {
  /**
   * Fix common transaction data issues (SAFE VERSION)
   * @returns {Object} Cleanup results
   */
  async fixTransactionDataIssues() {
    const results = {
      fixed: 0,
      errors: 0,
      details: [],
    };

    // SAFETY: Create backup before making changes
    try {
      const backupData = {
        timestamp: new Date().toISOString(),
        transactions: TransactionService.getAll(),
        accounts: await this.getAllAccounts(),
      };
      localStorage.setItem(
        `cleanup_backup_${Date.now()}`,
        JSON.stringify(backupData)
      );
      results.details.push('Created safety backup before cleanup');
    } catch (backupError) {
      results.warnings = results.warnings || [];
      results.warnings.push(`Failed to create backup: ${backupError.message}`);
    }

    try {
      const transactions = TransactionService.getAll();

      for (const transaction of transactions) {
        let hasChanges = false;

        // Fix missing or invalid dates
        if (!transaction.date || isNaN(new Date(transaction.date).getTime())) {
          transaction.date = new Date().toISOString().split('T')[0];
          hasChanges = true;
          results.details.push(`Fixed date for transaction ${transaction.id}`);
        }

        // Fix missing or empty descriptions
        if (
          !transaction.description ||
          typeof transaction.description !== 'string' ||
          transaction.description.trim() === ''
        ) {
          transaction.description = transaction.category || 'Transaction';
          hasChanges = true;
          results.details.push(
            `Fixed description for transaction ${transaction.id}`
          );
        }

        // Fix missing categories
        if (!transaction.category || typeof transaction.category !== 'string') {
          transaction.category = 'Uncategorized';
          hasChanges = true;
          results.details.push(
            `Fixed category for transaction ${transaction.id}`
          );
        }

        // Ensure amount is valid
        if (typeof transaction.amount !== 'number' || transaction.amount <= 0) {
          transaction.amount = Math.abs(parseFloat(transaction.amount) || 0);
          hasChanges = true;
          results.details.push(
            `Fixed amount for transaction ${transaction.id}`
          );
        }

        // Fix missing or invalid transaction type
        if (
          !transaction.type ||
          !['income', 'expense'].includes(transaction.type)
        ) {
          transaction.type = 'expense'; // Default to expense
          hasChanges = true;
          results.details.push(`Fixed type for transaction ${transaction.id}`);
        }

        // Update the transaction if changes were made
        if (hasChanges) {
          transaction.updatedAt = new Date().toISOString();

          // Actually update the transaction in storage
          try {
            TransactionService.update(transaction.id, {
              date: transaction.date,
              description: transaction.description,
              category: transaction.category,
              amount: transaction.amount,
              type: transaction.type,
              updatedAt: transaction.updatedAt,
            });
            results.fixed++;
            results.details.push(
              `Updated transaction ${transaction.id} in storage`
            );
          } catch (updateError) {
            results.errors++;
            results.details.push(
              `Failed to update transaction ${transaction.id}: ${updateError.message}`
            );
          }
        }
      }

      // Also clean up account data
      const accountResults = await this.cleanupAccountData();
      results.fixed += accountResults.fixed;
      results.errors += accountResults.errors;
      results.details.push(...accountResults.details);

      // Handle duplicate transactions
      const duplicateResults = await this.handleDuplicateTransactions();
      results.fixed += duplicateResults.fixed;
      results.errors += duplicateResults.errors;
      results.details.push(...duplicateResults.details);

      // Clean up orphaned localStorage entries
      const orphanedResults = await this.cleanupOrphanedEntries();
      results.fixed += orphanedResults.fixed;
      results.errors += orphanedResults.errors;
      results.details.push(...orphanedResults.details);

      // Log the cleanup operation
      auditService.log(
        auditEvents.DATA_INTEGRITY_CHECK,
        {
          action: 'data_cleanup',
          fixed: results.fixed,
          errors: results.errors,
          details: results.details,
        },
        AuthService.getUserId(),
        'medium'
      );

      return results;
    } catch (error) {
      console.error('Data cleanup failed:', error);
      results.errors++;
      results.details.push(`Cleanup failed: ${error.message}`);
      return results;
    }
  },

  /**
   * Get summary of data issues
   * @returns {Object} Issue summary
   */
  async getDataIssueSummary() {
    const { dataIntegrityService } =
      await import('./data-integrity-service.js');

    try {
      const result = await dataIntegrityService.performIntegrityCheck();

      const summary = {
        totalIssues: result.issues.length,
        criticalIssues: result.issues.filter(i => i.severity === 'critical')
          .length,
        highIssues: result.issues.filter(i => i.severity === 'high').length,
        mediumIssues: result.issues.filter(i => i.severity === 'medium').length,
        lowIssues: result.issues.filter(i => i.severity === 'low').length,

        // Categorize issues by type
        issuesByType: {},
      };

      // Group issues by type
      result.issues.forEach(issue => {
        if (!summary.issuesByType[issue.type]) {
          summary.issuesByType[issue.type] = 0;
        }
        summary.issuesByType[issue.type]++;
      });

      return summary;
    } catch (error) {
      console.error('Failed to get issue summary:', error);
      return {
        totalIssues: 0,
        criticalIssues: 0,
        highIssues: 0,
        mediumIssues: 0,
        lowIssues: 0,
        issuesByType: {},
        error: error.message,
      };
    }
  },

  /**
   * Create a data cleanup plan
   * @returns {Object} Cleanup plan
   */
  async createCleanupPlan() {
    const summary = await this.getDataIssueSummary();

    const plan = {
      summary,
      steps: [],
      estimatedTime: '2-5 minutes',
      riskLevel: 'low',
    };

    if (summary.criticalIssues > 0) {
      plan.steps.push({
        priority: 'high',
        action: 'Fix critical data issues',
        description: `${summary.criticalIssues} critical issues found that could cause data loss`,
        automated: true,
      });
    }

    if (summary.issuesByType.transaction > 50) {
      plan.steps.push({
        priority: 'high',
        action: 'Clean up transaction data',
        description: `${summary.issuesByType.transaction} transactions have data quality issues`,
        automated: true,
      });
    }

    plan.steps.push({
      priority: 'medium',
      action: 'Run data integrity check again',
      description: 'Verify all issues have been resolved',
      automated: false,
    });

    return plan;
  },

  /**
   * Helper method to get all accounts safely
   * @returns {Array} Array of accounts
   */
  async getAllAccounts() {
    try {
      const { AccountService } = await import('./account-service.js');
      return AccountService.getAccounts();
    } catch (error) {
      console.warn('Failed to get accounts:', error);
      return [];
    }
  },

  /**
   * Clean up account data issues (SAFE VERSION)
   * @returns {Object} Account cleanup results
   */
  async cleanupAccountData() {
    const results = {
      fixed: 0,
      errors: 0,
      details: [],
    };

    try {
      const { AccountService } = await import('./account-service.js');
      const accounts = AccountService.getAccounts();

      for (const account of accounts) {
        let hasChanges = false;

        // Fix missing or invalid account type
        if (
          !account.type ||
          !['checking', 'savings', 'credit', 'investment'].includes(
            account.type
          )
        ) {
          account.type = 'checking'; // Default to checking
          hasChanges = true;
          results.details.push(`Fixed type for account ${account.id}`);
        }

        // Fix missing or invalid balance
        if (typeof account.balance !== 'number' || !isFinite(account.balance)) {
          account.balance = 0; // Default to 0
          hasChanges = true;
          results.details.push(`Fixed balance for account ${account.id}`);
        }

        // Update the account if changes were made
        if (hasChanges) {
          try {
            // AccountService uses saveAccount() instead of update()
            AccountService.saveAccount({
              ...account,
              updatedAt: new Date().toISOString(),
            });
            results.fixed++;
            results.details.push(`Updated account ${account.id} in storage`);
          } catch (updateError) {
            results.errors++;
            results.details.push(
              `Failed to update account ${account.id}: ${updateError.message}`
            );
          }
        }
      }
    } catch (error) {
      console.error('Account cleanup failed:', error);
      results.errors++;
      results.details.push(`Account cleanup failed: ${error.message}`);
    }

    return results;
  },

  /**
   * Handle duplicate transactions
   * @returns {Object} Duplicate handling results
   */
  async handleDuplicateTransactions() {
    const results = {
      fixed: 0,
      errors: 0,
      details: [],
    };

    try {
      const transactions = TransactionService.getAll();
      const seenTransactions = new Map();
      const duplicates = [];

      // Find duplicates
      for (const transaction of transactions) {
        const key = `${transaction.amount}_${transaction.date}_${transaction.category}_${transaction.description}`;

        if (seenTransactions.has(key)) {
          duplicates.push(transaction);
        } else {
          seenTransactions.set(key, transaction);
        }
      }

      // Remove duplicates (keep the first occurrence)
      for (const duplicate of duplicates) {
        try {
          TransactionService.remove(duplicate.id);
          results.fixed++;
          results.details.push(`Removed duplicate transaction ${duplicate.id}`);
        } catch (removeError) {
          results.errors++;
          results.details.push(
            `Failed to remove duplicate ${duplicate.id}: ${removeError.message}`
          );
        }
      }
    } catch (error) {
      console.error('Duplicate handling failed:', error);
      results.errors++;
      results.details.push(`Duplicate handling failed: ${error.message}`);
    }

    return results;
  },

  /**
   * Clean up orphaned localStorage entries (CONSERVATIVE VERSION)
   * @returns {Object} Orphaned cleanup results
   */
  async cleanupOrphanedEntries() {
    const results = {
      fixed: 0,
      errors: 0,
      details: [],
    };

    try {
      // CONSERVATIVE: Only remove entries that are clearly invalid
      // Never remove core data storage keys
      const validPrefixes = [
        // Core data storage - NEVER remove these
        'blinkbudget_transactions',
        'blinkbudget_accounts',
        'blinkbudget_goals',
        'blinkbudget_investments',
        'blinkbudget_budgets',
        'blink_settings', // Settings storage
        'blinkbudget_setting_', // Individual settings
        'blinkbudget_cache_', // Cache entries
        'blinkbudget_backup_', // Backup entries
        'blinkbudget_sync_', // Sync entries
        'emergency_backup_', // Emergency backups
      ];

      // Only remove entries that are clearly corrupted or invalid
      const keysToRemove = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        if (key && key.startsWith('blinkbudget_')) {
          // CONSERVATIVE: Only remove if it's clearly invalid
          const isValidPrefix = validPrefixes.some(prefix =>
            key.startsWith(prefix)
          );

          if (!isValidPrefix) {
            // Additional safety checks before removing
            try {
              const value = localStorage.getItem(key);
              if (!value || value === 'null' || value === 'undefined') {
                keysToRemove.push(key);
                results.details.push(
                  `Marked for removal: ${key} (empty value)`
                );
              } else {
                // Try to parse to see if it's corrupted
                JSON.parse(value);
                // If parsing succeeds, keep it - it might be valid data
                results.details.push(`Kept: ${key} (valid JSON)`);
              }
            } catch {
              // Only remove if it's clearly corrupted JSON
              const value = localStorage.getItem(key);
              if (value && value.length < 10) {
                // Very short corrupted entries
                keysToRemove.push(key);
                results.details.push(
                  `Marked for removal: ${key} (corrupted JSON, short entry)`
                );
              } else {
                // Keep longer corrupted entries - they might be recoverable
                results.details.push(
                  `Kept: ${key} (corrupted but potentially recoverable)`
                );
              }
            }
          }
        }
      }

      // CONSERVATIVE: Only remove entries that are clearly invalid
      for (const key of keysToRemove) {
        try {
          localStorage.removeItem(key);
          results.fixed++;
          results.details.push(`Removed invalid entry: ${key}`);
        } catch (removeError) {
          results.errors++;
          results.details.push(
            `Failed to remove ${key}: ${removeError.message}`
          );
        }
      }

      // Safety summary
      if (keysToRemove.length === 0) {
        results.details.push(
          'No invalid entries found - all localStorage entries preserved'
        );
      } else {
        results.details.push(
          `Conservative cleanup: removed ${keysToRemove.length} clearly invalid entries, preserved all others`
        );
      }
    } catch (error) {
      console.error('Orphaned cleanup failed:', error);
      results.errors++;
      results.details.push(`Orphaned cleanup failed: ${error.message}`);
    }

    return results;
  },
};
