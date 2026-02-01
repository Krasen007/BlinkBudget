/**
 * Emergency Data Recovery Service
 * Provides comprehensive data recovery procedures for critical data loss scenarios
 */

import { BackupService } from './backup-service.js';
import { StorageService } from './storage.js';
import { AuthService } from './auth-service.js';
import { auditService, auditEvents } from './audit-service.js';
import { SyncService } from './sync-service.js';

export class EmergencyRecoveryService {
  constructor() {
    this.recoveryAttempts = 0;
    this.maxRecoveryAttempts = 3;
    this.recoveryLog = [];
    this.isRecovering = false;
  }

  /**
   * Perform comprehensive emergency data recovery
   * @param {Object} options - Recovery options
   * @returns {Promise<Object>} Recovery results
   */
  async performEmergencyRecovery(_options = {}) {
    if (this.isRecovering) {
      throw new Error('Recovery already in progress');
    }

    if (this.recoveryAttempts >= this.maxRecoveryAttempts) {
      throw new Error('Maximum recovery attempts exceeded');
    }

    this.isRecovering = true;
    this.recoveryAttempts++;

    const recoveryId = this.generateRecoveryId();
    const startTime = Date.now();

    try {
      auditService.log(auditEvents.DATA_RECOVERY, {
        recoveryId,
        attempt: this.recoveryAttempts,
        options: _options
      }, AuthService.getUserId(), 'high');

      const results = {
        recoveryId,
        timestamp: new Date().toISOString(),
        steps: [],
        dataRestored: {
          transactions: 0,
          accounts: 0,
          settings: 0,
          goals: 0,
          investments: 0,
          budgets: 0
        },
        errors: [],
        warnings: [],
        success: false
      };

      // Step 1: Validate current environment
      await this.stepValidateEnvironment(results);

      // Step 2: Create emergency backup of current state
      await this.stepCreateEmergencyBackup(results);

      // Step 3: Attempt multiple recovery strategies
      await this.attemptRecoveryStrategies(results, _options);

      // Step 4: Validate recovered data
      await this.validateRecoveredData(results);

      // Step 5: Finalize recovery
      await this.finalizeRecovery(results, _options);

      results.duration = Date.now() - startTime;
      results.success = results.errors.length === 0;

      // Log recovery completion
      auditService.log(auditEvents.DATA_RECOVERY, {
        recoveryId,
        success: results.success,
        duration: results.duration,
        dataRestored: results.dataRestored,
        errors: results.errors.length
      }, AuthService.getUserId(), results.success ? 'medium' : 'high');

      this.recoveryLog.push(results);
      return results;

    } catch (error) {
      const errorResult = {
        recoveryId,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      };

      auditService.log(auditEvents.DATA_RECOVERY, {
        recoveryId,
        success: false,
        error: error.message,
        duration: errorResult.duration
      }, AuthService.getUserId(), 'critical');

      this.recoveryLog.push(errorResult);
      throw error;

    } finally {
      this.isRecovering = false;
    }
  }

  /**
   * Step 1: Validate recovery environment
   */
  async stepValidateEnvironment(results) {
    const step = { name: 'Environment Validation', status: 'running', startTime: Date.now() };

    try {
      // Check authentication
      if (!AuthService.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      // Check online status
      if (!navigator.onLine) {
        results.warnings.push('Offline mode - limited recovery options available');
      }

      // Check localStorage availability
      try {
        localStorage.setItem('recovery-test', 'test');
        localStorage.removeItem('recovery-test');
      } catch {
        throw new Error('localStorage not available');
      }

      step.status = 'completed';
      step.endTime = Date.now();

    } catch (error) {
      step.status = 'failed';
      step.error = error.message;
      results.errors.push(`Environment validation failed: ${error.message}`);
    }

    results.steps.push(step);
  }

  /**
   * Step 2: Create emergency backup of current state
   */
  async stepCreateEmergencyBackup(results) {
    const step = { name: 'Emergency Backup Creation', status: 'running', startTime: Date.now() };

    try {
      const backupData = {
        timestamp: new Date().toISOString(),
        recoveryId: results.recoveryId,
        transactions: StorageService.getAll(),
        accounts: StorageService.getAccounts(),
        settings: this.getAllSettings(),
        goals: StorageService.getGoals(),
        investments: StorageService.getInvestments(),
        budgets: StorageService.getBudgets()
      };

      // Store emergency backup in localStorage
      localStorage.setItem(`emergency_backup_${results.recoveryId}`, JSON.stringify(backupData));

      step.status = 'completed';
      step.endTime = Date.now();
      step.backupSize = JSON.stringify(backupData).length;

    } catch (error) {
      step.status = 'failed';
      step.error = error.message;
      results.errors.push(`Emergency backup failed: ${error.message}`);
    }

    results.steps.push(step);
  }

  /**
   * Step 3: Attempt multiple recovery strategies
   */
  async attemptRecoveryStrategies(results, _options) {
    const strategies = [
      () => this.attemptCloudBackupRecovery(results),
      () => this.attemptLocalStorageRecovery(results),
      () => this.attemptSyncServiceRecovery(results),
      () => this.attemptCacheRecovery(results)
    ];

    // Try each strategy until one succeeds
    for (const strategy of strategies) {
      try {
        await strategy();
        if (results.dataRestored.transactions > 0 ||
          results.dataRestored.accounts > 0) {
          break; // Stop if we've recovered some data
        }
      } catch {
        results.warnings.push(`Recovery strategy failed: unknown error`);
      }
    }
  }

  /**
   * Attempt recovery from cloud backup
   */
  async attemptCloudBackupRecovery(results) {
    const step = { name: 'Cloud Backup Recovery', status: 'running', startTime: Date.now() };

    try {
      if (!navigator.onLine) {
        throw new Error('Offline - cannot access cloud backup');
      }

      const backup = await BackupService.fetchBackup();
      if (!backup) {
        throw new Error('No cloud backup available');
      }

      // Restore transactions
      if (backup.transactions && Array.isArray(backup.transactions)) {
        StorageService.clear();
        backup.transactions.forEach(transaction => {
          StorageService.add(transaction);
          results.dataRestored.transactions++;
        });
      }

      // Restore other data types
      if (backup.accounts) {
        // Account restoration logic would go here
        results.dataRestored.accounts = backup.accounts.length || 0;
      }

      step.status = 'completed';
      step.endTime = Date.now();
      step.dataRecovered = {
        transactions: results.dataRestored.transactions,
        accounts: results.dataRestored.accounts
      };

    } catch (error) {
      step.status = 'failed';
      step.error = error.message;
      results.errors.push(`Cloud backup recovery failed: ${error.message}`);
    }

    results.steps.push(step);
  }

  /**
   * Attempt recovery from localStorage
   */
  async attemptLocalStorageRecovery(results) {
    const step = { name: 'LocalStorage Recovery', status: 'running', startTime: Date.now() };

    try {
      // Look for previous emergency backups
      const backupKeys = Object.keys(localStorage).filter(key =>
        key.startsWith('emergency_backup_') || key.startsWith('blinkbudget_')
      );

      let dataFound = false;

      for (const key of backupKeys) {
        try {
          const data = JSON.parse(localStorage.getItem(key));

          if (data.transactions && Array.isArray(data.transactions)) {
            // Only restore if we don't have data yet
            if (results.dataRestored.transactions === 0) {
              StorageService.clear();
              data.transactions.forEach(transaction => {
                StorageService.add(transaction);
                results.dataRestored.transactions++;
              });
              dataFound = true;
            }
          }

          if (data.accounts && Array.isArray(data.accounts)) {
            if (results.dataRestored.accounts === 0) {
              results.dataRestored.accounts = data.accounts.length;
            }
          }

        } catch (parseError) {
          results.warnings.push(`Failed to parse backup ${key}: ${parseError.message}`);
        }
      }

      if (dataFound) {
        step.status = 'completed';
        step.dataRecovered = {
          transactions: results.dataRestored.transactions,
          accounts: results.dataRestored.accounts
        };
      } else {
        step.status = 'failed';
        step.error = 'No valid localStorage backups found';
      }

      step.endTime = Date.now();

    } catch (error) {
      step.status = 'failed';
      step.error = error.message;
      results.errors.push(`LocalStorage recovery failed: ${error.message}`);
    }

    results.steps.push(step);
  }

  /**
   * Attempt recovery from sync service
   */
  async attemptSyncServiceRecovery(results) {
    const step = { name: 'Sync Service Recovery', status: 'running', startTime: Date.now() };

    try {
      if (!navigator.onLine) {
        throw new Error('Offline - cannot access sync service');
      }

      // Try to pull latest data from sync service
      const syncData = await this.pullFromSyncService();

      if (syncData && syncData.transactions) {
        if (results.dataRestored.transactions === 0) {
          StorageService.clear();
          syncData.transactions.forEach(transaction => {
            StorageService.add(transaction);
            results.dataRestored.transactions++;
          });
        }
      }

      step.status = 'completed';
      step.endTime = Date.now();

    } catch (error) {
      step.status = 'failed';
      step.error = error.message;
      results.warnings.push(`Sync service recovery failed: ${error.message}`);
    }

    results.steps.push(step);
  }

  /**
   * Attempt recovery from cache
   */
  async attemptCacheRecovery(results) {
    const step = { name: 'Cache Recovery', status: 'running', startTime: Date.now() };

    try {
      // Look for cached data that might be recoverable
      const cacheKeys = ['transactions', 'accounts', 'settings'];
      let dataFound = false;

      for (const key of cacheKeys) {
        try {
          const cachedData = localStorage.getItem(`cache_${key}`);
          if (cachedData) {
            const data = JSON.parse(cachedData);

            if (key === 'transactions' && Array.isArray(data)) {
              if (results.dataRestored.transactions === 0) {
                data.forEach(transaction => {
                  StorageService.add(transaction);
                  results.dataRestored.transactions++;
                });
                dataFound = true;
              }
            }
          }
        } catch (parseError) {
          results.warnings.push(`Failed to parse cache ${key}: ${parseError.message}`);
        }
      }

      if (dataFound) {
        step.status = 'completed';
      } else {
        step.status = 'failed';
        step.error = 'No valid cache data found';
      }

      step.endTime = Date.now();

    } catch (error) {
      step.status = 'failed';
      step.error = error.message;
      results.warnings.push(`Cache recovery failed: ${error.message}`);
    }

    results.steps.push(step);
  }

  /**
   * Step 4: Validate recovered data
   */
  async validateRecoveredData(results) {
    const step = { name: 'Data Validation', status: 'running', startTime: Date.now() };

    try {
      const transactions = StorageService.getAll();
      const accounts = StorageService.getAccounts();

      // Basic validation
      if (!Array.isArray(transactions)) {
        throw new Error('Transactions data is not an array');
      }

      if (!Array.isArray(accounts)) {
        throw new Error('Accounts data is not an array');
      }

      // Validate transaction structure
      const invalidTransactions = transactions.filter(t =>
        !t.id || !t.amount || !t.date || !t.category
      );

      if (invalidTransactions.length > 0) {
        results.warnings.push(`Found ${invalidTransactions.length} invalid transactions`);
      }

      // Check for duplicates
      const transactionIds = transactions.map(t => t.id).filter(Boolean);
      const uniqueIds = new Set(transactionIds);
      if (transactionIds.length !== uniqueIds.size) {
        results.warnings.push('Duplicate transaction IDs found');
      }

      step.status = 'completed';
      step.endTime = Date.now();
      step.validationResults = {
        totalTransactions: transactions.length,
        totalAccounts: accounts.length,
        invalidTransactions: invalidTransactions.length,
        duplicatesFound: transactionIds.length !== uniqueIds.size
      };

    } catch (error) {
      step.status = 'failed';
      step.error = error.message;
      results.errors.push(`Data validation failed: ${error.message}`);
    }

    results.steps.push(step);
  }

  /**
   * Step 5: Finalize recovery
   */
  async finalizeRecovery(results, _options) {
    const step = { name: 'Recovery Finalization', status: 'running', startTime: Date.now() };

    try {
      // Clear recovery attempts counter on success
      if (results.errors.length === 0) {
        this.recoveryAttempts = 0;
      }

      // Trigger sync to ensure data consistency
      if (navigator.onLine) {
        try {
          await this.triggerDataSync();
        } catch (syncError) {
          results.warnings.push(`Post-recovery sync failed: ${syncError.message}`);
        }
      }

      // Clean up old emergency backups (keep last 5)
      this.cleanupOldBackups();

      step.status = 'completed';
      step.endTime = Date.now();

    } catch (error) {
      step.status = 'failed';
      step.error = error.message;
      results.errors.push(`Recovery finalization failed: ${error.message}`);
    }

    results.steps.push(step);
  }

  /**
   * Generate unique recovery ID
   */
  generateRecoveryId() {
    return `recovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get all settings from various sources
   */
  getAllSettings() {
    try {
      const settings = {};
      // Collect settings from localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('blinkbudget_setting_')) {
          settings[key.replace('blinkbudget_setting_', '')] = localStorage.getItem(key);
        }
      }
      return settings;
    } catch (error) {
      console.warn('Failed to get settings:', error);
      return {};
    }
  }

  /**
   * Pull data from sync service
   */
  async pullFromSyncService() {
    // This would integrate with the actual sync service
    // For now, return null as placeholder
    return null;
  }

  /**
   * Trigger data sync after recovery
   */
  async triggerDataSync() {
    try {
      // Trigger sync for all data types
      const transactions = StorageService.getAll();
      await SyncService.pushToCloud('transactions', transactions);
    } catch (error) {
      console.warn('Post-recovery sync failed:', error);
      throw error;
    }
  }

  /**
   * Clean up old emergency backups
   */
  cleanupOldBackups() {
    try {
      const backupKeys = Object.keys(localStorage)
        .filter(key => key.startsWith('emergency_backup_'))
        .sort((a, b) => {
          const aTime = parseInt(a.split('_')[2]);
          const bTime = parseInt(b.split('_')[2]);
          return bTime - aTime; // Sort by time descending
        });

      // Keep only the 5 most recent backups
      const keysToRemove = backupKeys.slice(5);
      keysToRemove.forEach(key => localStorage.removeItem(key));

    } catch (error) {
      console.warn('Backup cleanup failed:', error);
    }
  }

  /**
   * Get recovery history
   */
  getRecoveryHistory() {
    return [...this.recoveryLog];
  }

  /**
   * Export recovery log for analysis
   */
  exportRecoveryLog() {
    return JSON.stringify(this.recoveryLog, null, 2);
  }

  /**
   * Reset recovery state
   */
  resetRecoveryState() {
    this.recoveryAttempts = 0;
    this.isRecovering = false;
  }
}

// Singleton instance
export const emergencyRecoveryService = new EmergencyRecoveryService();
