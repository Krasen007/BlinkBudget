/**
 * Data Integrity Service
 * Provides comprehensive data integrity checks and corruption detection
 */

import { StorageService } from './storage.js';
import { AuthService } from './auth-service.js';
import { auditService, auditEvents } from './audit-service.js';

export class DataIntegrityService {
  constructor() {
    this.integrityChecks = new Map();
    this.lastCheckTime = null;
    this.corruptionDetected = false;
    this.integrityReport = null;
  }

  /**
   * Perform comprehensive data integrity check
   * @param {Object} options - Check options
   * @returns {Promise<Object>} Integrity check results
   */
  async performIntegrityCheck(options = {}) {
    const checkId = this.generateCheckId();
    const startTime = Date.now();

    try {
      auditService.log(
        auditEvents.DATA_INTEGRITY_CHECK,
        {
          checkId,
          options,
        },
        AuthService.getUserId(),
        'medium'
      );

      const results = {
        checkId,
        timestamp: new Date().toISOString(),
        checks: [],
        summary: {
          totalChecks: 0,
          passedChecks: 0,
          failedChecks: 0,
          warnings: 0,
          corruptionDetected: false,
        },
        dataMetrics: {
          totalTransactions: 0,
          totalAccounts: 0,
          totalSettings: 0,
          totalGoals: 0,
          totalInvestments: 0,
          totalBudgets: 0,
        },
        issues: [],
        recommendations: [],
      };

      // Perform all integrity checks
      await this.checkTransactionIntegrity(results);
      await this.checkAccountIntegrity(results);
      await this.checkSettingsIntegrity(results);
      await this.checkDataConsistency(results);
      await this.checkDataStructure(results);
      await this.checkDuplicates(results);
      await this.checkDataOrphans(results);
      await this.checkDataCorruption(results);

      // Calculate summary
      results.summary.totalChecks = results.checks.length;
      results.summary.passedChecks = results.checks.filter(
        c => c.status === 'passed'
      ).length;
      results.summary.failedChecks = results.checks.filter(
        c => c.status === 'failed'
      ).length;
      results.summary.warnings = results.checks.filter(
        c => c.status === 'warning'
      ).length;
      results.summary.corruptionDetected = results.issues.some(
        i => i.severity === 'critical'
      );

      // Generate recommendations
      this.generateRecommendations(results);

      results.duration = Date.now() - startTime;
      this.lastCheckTime = new Date();
      this.integrityReport = results;
      this.corruptionDetected = results.summary.corruptionDetected;

      // Log completion
      auditService.log(
        auditEvents.DATA_INTEGRITY_CHECK,
        {
          checkId,
          success: !results.summary.corruptionDetected,
          duration: results.duration,
          issuesFound: results.issues.length,
          corruptionDetected: results.summary.corruptionDetected,
        },
        AuthService.getUserId(),
        results.summary.corruptionDetected ? 'high' : 'low'
      );

      return results;
    } catch (error) {
      auditService.log(
        auditEvents.DATA_INTEGRITY_CHECK,
        {
          checkId,
          success: false,
          error: error.message,
          duration: Date.now() - startTime,
        },
        AuthService.getUserId(),
        'critical'
      );

      throw error;
    }
  }

  /**
   * Check transaction data integrity
   */
  async checkTransactionIntegrity(results) {
    const check = {
      name: 'Transaction Integrity',
      status: 'running',
      startTime: Date.now(),
    };

    try {
      const transactions = StorageService.getAll();
      results.dataMetrics.totalTransactions = transactions.length;

      const issues = [];
      let validCount = 0;

      for (const transaction of transactions) {
        const transactionIssues = this.validateTransaction(transaction);
        if (transactionIssues.length > 0) {
          issues.push({
            id: transaction.id,
            issues: transactionIssues,
            severity: this.determineSeverity(transactionIssues),
          });
        } else {
          validCount++;
        }
      }

      if (issues.length === 0) {
        check.status = 'passed';
      } else {
        check.status = issues.some(i => i.severity === 'critical')
          ? 'failed'
          : 'warning';
        results.issues.push(
          ...issues.map(i => ({
            type: 'transaction',
            id: i.id,
            description: i.issues.join(', '),
            severity: i.severity,
          }))
        );
      }

      check.endTime = Date.now();
      check.details = {
        total: transactions.length,
        valid: validCount,
        invalid: issues.length,
      };
    } catch (error) {
      check.status = 'failed';
      check.error = error.message;
      results.issues.push({
        type: 'transaction',
        description: `Transaction integrity check failed: ${error.message}`,
        severity: 'critical',
      });
    }

    results.checks.push(check);
  }

  /**
   * Check account data integrity
   */
  async checkAccountIntegrity(results) {
    const check = {
      name: 'Account Integrity',
      status: 'running',
      startTime: Date.now(),
    };

    try {
      const accounts = StorageService.getAccounts();
      results.dataMetrics.totalAccounts = accounts.length;

      const issues = [];
      let validCount = 0;

      for (const account of accounts) {
        const accountIssues = this.validateAccount(account);
        if (accountIssues.length > 0) {
          issues.push({
            id: account.id,
            issues: accountIssues,
            severity: this.determineSeverity(accountIssues),
          });
        } else {
          validCount++;
        }
      }

      if (issues.length === 0) {
        check.status = 'passed';
      } else {
        check.status = issues.some(i => i.severity === 'critical')
          ? 'failed'
          : 'warning';
        results.issues.push(
          ...issues.map(i => ({
            type: 'account',
            id: i.id,
            description: i.issues.join(', '),
            severity: i.severity,
          }))
        );
      }

      check.endTime = Date.now();
      check.details = {
        total: accounts.length,
        valid: validCount,
        invalid: issues.length,
      };
    } catch (error) {
      check.status = 'failed';
      check.error = error.message;
      results.issues.push({
        type: 'account',
        description: `Account integrity check failed: ${error.message}`,
        severity: 'critical',
      });
    }

    results.checks.push(check);
  }

  /**
   * Check settings integrity
   */
  async checkSettingsIntegrity(results) {
    const check = {
      name: 'Settings Integrity',
      status: 'running',
      startTime: Date.now(),
    };

    try {
      const settings = this.getAllSettings();
      results.dataMetrics.totalSettings = Object.keys(settings).length;

      const issues = [];
      const validSettings = [];

      for (const [key, value] of Object.entries(settings)) {
        const settingIssues = this.validateSetting(key, value);
        if (settingIssues.length > 0) {
          issues.push({
            key,
            issues: settingIssues,
            severity: this.determineSeverity(settingIssues),
          });
        } else {
          validSettings.push(key);
        }
      }

      if (issues.length === 0) {
        check.status = 'passed';
      } else {
        check.status = issues.some(i => i.severity === 'critical')
          ? 'failed'
          : 'warning';
        results.issues.push(
          ...issues.map(i => ({
            type: 'setting',
            id: i.key,
            description: i.issues.join(', '),
            severity: i.severity,
          }))
        );
      }

      check.endTime = Date.now();
      check.details = {
        total: Object.keys(settings).length,
        valid: validSettings.length,
        invalid: issues.length,
      };
    } catch (error) {
      check.status = 'failed';
      check.error = error.message;
      results.issues.push({
        type: 'setting',
        description: `Settings integrity check failed: ${error.message}`,
        severity: 'critical',
      });
    }

    results.checks.push(check);
  }

  /**
   * Check data consistency across different data types
   */
  async checkDataConsistency(results) {
    const check = {
      name: 'Data Consistency',
      status: 'running',
      startTime: Date.now(),
    };

    try {
      const transactions = StorageService.getAll();
      const issues = [];

      // Check if transaction account references are valid
      for (const transaction of transactions) {
        if (transaction.accountId) {
          const accountExists = StorageService.getAccounts().some(
            acc => acc.id === transaction.accountId
          );
          if (!accountExists) {
            issues.push({
              type: 'consistency',
              description: `Transaction ${transaction.id} references non-existent account ${transaction.accountId}`,
              severity: 'high',
            });
          }
        }
      }

      // Check for negative balances where they shouldn't exist
      for (const account of StorageService.getAccounts()) {
        if (account.type !== 'credit' && account.balance < 0) {
          issues.push({
            type: 'consistency',
            description: `Account ${account.id} has negative balance but is not a credit account`,
            severity: 'medium',
          });
        }
      }

      if (issues.length === 0) {
        check.status = 'passed';
      } else {
        check.status = issues.some(i => i.severity === 'high')
          ? 'failed'
          : 'warning';
        results.issues.push(...issues);
      }

      check.endTime = Date.now();
      check.details = {
        consistencyIssues: issues.length,
      };
    } catch (error) {
      check.status = 'failed';
      check.error = error.message;
      results.issues.push({
        type: 'consistency',
        description: `Data consistency check failed: ${error.message}`,
        severity: 'critical',
      });
    }

    results.checks.push(check);
  }

  /**
   * Check data structure validity
   */
  async checkDataStructure(results) {
    const check = {
      name: 'Data Structure',
      status: 'running',
      startTime: Date.now(),
    };

    try {
      const transactions = StorageService.getAll();
      const issues = [];

      // Check for circular references
      const circularRefs = this.detectCircularReferences(transactions);
      if (circularRefs.length > 0) {
        issues.push({
          type: 'structure',
          description: `Circular references detected: ${circularRefs.join(', ')}`,
          severity: 'critical',
        });
      }

      // Check for malformed JSON in localStorage
      const malformedKeys = this.checkLocalStorageIntegrity();
      if (malformedKeys.length > 0) {
        issues.push({
          type: 'structure',
          description: `Malformed data in localStorage keys: ${malformedKeys.join(', ')}`,
          severity: 'high',
        });
      }

      if (issues.length === 0) {
        check.status = 'passed';
      } else {
        check.status = issues.some(i => i.severity === 'critical')
          ? 'failed'
          : 'warning';
        results.issues.push(...issues);
      }

      check.endTime = Date.now();
      check.details = {
        circularReferences: circularRefs.length,
        malformedKeys: malformedKeys.length,
      };
    } catch (error) {
      check.status = 'failed';
      check.error = error.message;
      results.issues.push({
        type: 'structure',
        description: `Data structure check failed: ${error.message}`,
        severity: 'critical',
      });
    }

    results.checks.push(check);
  }

  /**
   * Check for duplicate data
   */
  async checkDuplicates(results) {
    const check = {
      name: 'Duplicate Detection',
      status: 'running',
      startTime: Date.now(),
    };

    try {
      const transactions = StorageService.getAll();
      const issues = [];

      // Check for duplicate transactions
      const transactionHashes = new Map();
      for (const transaction of transactions) {
        const transactionHash = this.createTransactionHash(transaction);
        if (transactionHashes.has(transactionHash)) {
          transactionHashes.get(transactionHash).push(transaction.id);
        } else {
          transactionHashes.set(transactionHash, [transaction.id]);
        }
      }

      for (const [, ids] of transactionHashes) {
        if (ids.length > 1) {
          issues.push({
            type: 'duplicate',
            description: `Duplicate transactions detected: ${ids.join(', ')}`,
            severity: 'medium',
          });
        }
      }

      // Check for duplicate accounts
      const accountNames = new Map();
      for (const account of StorageService.getAccounts()) {
        const accountKey = `${account.name}_${account.type}`;
        if (accountNames.has(accountKey)) {
          accountNames.get(accountKey).push(account.id);
        } else {
          accountNames.set(accountKey, [account.id]);
        }
      }

      for (const [, ids] of accountNames) {
        if (ids.length > 1) {
          issues.push({
            type: 'duplicate',
            description: `Duplicate accounts detected: ${ids.join(', ')}`,
            severity: 'medium',
          });
        }
      }

      if (issues.length === 0) {
        check.status = 'passed';
      } else {
        check.status = 'warning';
        results.issues.push(...issues);
      }

      check.endTime = Date.now();
      check.details = {
        duplicateTransactions: issues.filter(i =>
          i.description.includes('transactions')
        ).length,
        duplicateAccounts: issues.filter(i =>
          i.description.includes('accounts')
        ).length,
      };
    } catch (error) {
      check.status = 'failed';
      check.error = error.message;
      results.issues.push({
        type: 'duplicate',
        description: `Duplicate detection failed: ${error.message}`,
        severity: 'critical',
      });
    }

    results.checks.push(check);
  }

  /**
   * Check for orphaned data
   */
  async checkDataOrphans(results) {
    const check = {
      name: 'Orphaned Data',
      status: 'running',
      startTime: Date.now(),
    };

    try {
      const issues = [];

      // Check for orphaned localStorage entries
      const orphanedKeys = this.findOrphanedLocalStorageEntries();
      if (orphanedKeys.length > 0) {
        issues.push({
          type: 'orphaned',
          description: `Orphaned localStorage entries: ${orphanedKeys.join(', ')}`,
          severity: 'low',
        });
      }

      if (issues.length === 0) {
        check.status = 'passed';
      } else {
        check.status = 'warning';
        results.issues.push(...issues);
      }

      check.endTime = Date.now();
      check.details = {
        orphanedEntries: orphanedKeys.length,
      };
    } catch (error) {
      check.status = 'failed';
      check.error = error.message;
      results.issues.push({
        type: 'orphaned',
        description: `Orphaned data check failed: ${error.message}`,
        severity: 'critical',
      });
    }

    results.checks.push(check);
  }

  /**
   * Check for data corruption
   */
  async checkDataCorruption(results) {
    const check = {
      name: 'Data Corruption',
      status: 'running',
      startTime: Date.now(),
    };

    try {
      const issues = [];

      // Check for NaN values in numeric fields
      const transactions = StorageService.getAll();
      for (const transaction of transactions) {
        if (
          typeof transaction.amount === 'number' &&
          isNaN(transaction.amount)
        ) {
          issues.push({
            type: 'corruption',
            description: `Transaction ${transaction.id} has NaN amount`,
            severity: 'critical',
          });
        }

        if (transaction.date && isNaN(new Date(transaction.date).getTime())) {
          issues.push({
            type: 'corruption',
            description: `Transaction ${transaction.id} has invalid date`,
            severity: 'critical',
          });
        }
      }

      // Check for infinite values
      const accounts = StorageService.getAccounts();
      for (const account of accounts) {
        if (typeof account.balance === 'number' && !isFinite(account.balance)) {
          issues.push({
            type: 'corruption',
            description: `Account ${account.id} has infinite balance`,
            severity: 'critical',
          });
        }
      }

      if (issues.length === 0) {
        check.status = 'passed';
      } else {
        check.status = 'failed';
        results.issues.push(...issues);
      }

      check.endTime = Date.now();
      check.details = {
        corruptionIssues: issues.length,
      };
    } catch (error) {
      check.status = 'failed';
      check.error = error.message;
      results.issues.push({
        type: 'corruption',
        description: `Data corruption check failed: ${error.message}`,
        severity: 'critical',
      });
    }

    results.checks.push(check);
  }

  /**
   * Validate transaction structure
   */
  validateTransaction(transaction) {
    const issues = [];

    if (!transaction.id) {
      issues.push('Missing transaction ID');
    }

    if (typeof transaction.amount !== 'number' || transaction.amount <= 0) {
      issues.push('Invalid or missing amount');
    }

    if (!transaction.date || isNaN(new Date(transaction.date).getTime())) {
      issues.push('Invalid or missing date');
    }

    if (!transaction.category || typeof transaction.category !== 'string') {
      issues.push('Invalid or missing category');
    }

    if (
      !transaction.description ||
      typeof transaction.description !== 'string'
    ) {
      issues.push('Invalid or missing description');
    }

    if (
      !transaction.type ||
      !['income', 'expense'].includes(transaction.type)
    ) {
      issues.push('Invalid or missing transaction type');
    }

    return issues;
  }

  /**
   * Validate account structure
   */
  validateAccount(account) {
    const issues = [];

    if (!account.id) {
      issues.push('Missing account ID');
    }

    if (!account.name || typeof account.name !== 'string') {
      issues.push('Invalid or missing account name');
    }

    if (
      !account.type ||
      !['checking', 'savings', 'credit', 'investment'].includes(account.type)
    ) {
      issues.push('Invalid or missing account type');
    }

    if (typeof account.balance !== 'number' || !isFinite(account.balance)) {
      issues.push('Invalid or missing balance');
    }

    return issues;
  }

  /**
   * Validate setting structure
   */
  validateSetting(key, value) {
    const issues = [];

    if (!key || typeof key !== 'string') {
      issues.push('Invalid setting key');
    }

    if (value === undefined) {
      issues.push('Setting value is undefined');
    }

    return issues;
  }

  /**
   * Determine severity based on issues
   */
  determineSeverity(issues) {
    if (
      issues.some(
        issue => issue.includes('Missing') || issue.includes('Invalid')
      )
    ) {
      return 'critical';
    }
    if (
      issues.some(issue => issue.includes('NaN') || issue.includes('infinite'))
    ) {
      return 'critical';
    }
    return 'medium';
  }

  /**
   * Create transaction hash for duplicate detection
   */
  createTransactionHash(transaction) {
    return `${transaction.amount}_${transaction.date}_${transaction.category}_${transaction.description}`;
  }

  /**
   * Detect circular references
   */
  detectCircularReferences(transactions) {
    // Simplified circular reference detection
    const circularRefs = [];
    const visited = new Set();

    for (const transaction of transactions) {
      if (transaction.id && !visited.has(transaction.id)) {
        // In a real implementation, this would check for actual circular references
        // For now, just return empty array
      }
    }

    return circularRefs;
  }

  /**
   * Check localStorage integrity
   */
  checkLocalStorageIntegrity() {
    const malformedKeys = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('blinkbudget_')) {
        try {
          const value = localStorage.getItem(key);
          JSON.parse(value);
        } catch {
          malformedKeys.push(key);
        }
      }
    }

    return malformedKeys;
  }

  /**
   * Find orphaned localStorage entries
   */
  findOrphanedLocalStorageEntries() {
    const orphanedKeys = [];
    const validPrefixes = [
      'blinkbudget_setting_',
      'blinkbudget_cache_',
      'blinkbudget_backup_',
      'blinkbudget_sync_',
    ];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('blinkbudget_')) {
        const isValidPrefix = validPrefixes.some(prefix =>
          key.startsWith(prefix)
        );
        if (!isValidPrefix) {
          orphanedKeys.push(key);
        }
      }
    }

    return orphanedKeys;
  }

  /**
   * Get all settings from localStorage
   */
  getAllSettings() {
    const settings = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('blinkbudget_setting_')) {
        try {
          const value = localStorage.getItem(key);
          settings[key.replace('blinkbudget_setting_', '')] = JSON.parse(value);
        } catch {
          settings[key.replace('blinkbudget_setting_', '')] =
            localStorage.getItem(key);
        }
      }
    }
    return settings;
  }

  /**
   * Generate recommendations based on issues found
   */
  generateRecommendations(results) {
    const recommendations = [];

    if (results.summary.corruptionDetected) {
      recommendations.push({
        priority: 'high',
        action: 'Run emergency data recovery',
        description:
          'Critical data corruption detected. Immediate recovery recommended.',
      });
    }

    if (results.issues.some(i => i.type === 'duplicate')) {
      recommendations.push({
        priority: 'medium',
        action: 'Remove duplicate entries',
        description:
          'Duplicate data found. Review and remove duplicates to maintain data integrity.',
      });
    }

    if (results.issues.some(i => i.type === 'orphaned')) {
      recommendations.push({
        priority: 'low',
        action: 'Clean up orphaned data',
        description:
          'Orphaned data entries found. Consider cleaning up to optimize storage.',
      });
    }

    if (results.issues.some(i => i.type === 'consistency')) {
      recommendations.push({
        priority: 'medium',
        action: 'Fix data consistency issues',
        description:
          'Data consistency issues found. Review and fix to ensure data reliability.',
      });
    }

    results.recommendations = recommendations;
  }

  /**
   * Generate unique check ID
   */
  generateCheckId() {
    return `integrity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get last integrity report
   */
  getLastReport() {
    return this.integrityReport;
  }

  /**
   * Check if corruption was detected in last check
   */
  isCorruptionDetected() {
    return this.corruptionDetected;
  }

  /**
   * Get time of last integrity check
   */
  getLastCheckTime() {
    return this.lastCheckTime;
  }
}

// Singleton instance
export const dataIntegrityService = new DataIntegrityService();
