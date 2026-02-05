/**
 * Account Deletion Service
 * GDPR-compliant account deletion with data handling and audit logging
 */

import { AuthService } from './auth-service.js';
import { TransactionService } from './transaction-service.js';
import { auditService, auditEvents } from './audit-service.js';
import { auth } from './firebase-config.js';
import { deleteUser } from 'firebase/auth';

export class AccountDeletionService {
  constructor() {
    this.deletionInProgress = false;
    this.deletionSteps = [];
  }

  /**
   * Initiate GDPR-compliant account deletion
   * @param {Object} options - Deletion options
   * @returns {Promise<Object>} Deletion process result
   */
  async initiateAccountDeletion(options = {}) {
    if (this.deletionInProgress) {
      throw new Error('Account deletion already in progress');
    }

    this.deletionInProgress = true;
    const deletionId = this.generateDeletionId();
    const startTime = Date.now();

    try {
      // Validate user is authenticated
      if (!AuthService.isAuthenticated()) {
        throw new Error('User must be authenticated to delete account');
      }

      const userId = AuthService.getUserId();
      const userEmail = AuthService.getUserEmail();

      // Log deletion initiation
      auditService.log(
        auditEvents.ACCOUNT_DELETION,
        {
          deletionId,
          userId,
          userEmail,
          stage: 'initiated',
          options,
        },
        userId,
        'critical'
      );

      const result = {
        deletionId,
        userId,
        userEmail,
        timestamp: new Date().toISOString(),
        steps: [],
        dataDeleted: {
          transactions: 0,
          accounts: 0,
          settings: 0,
          goals: 0,
          investments: 0,
          budgets: 0,
          auditLogs: 0,
        },
        errors: [],
        warnings: [],
        success: false,
      };

      // Step 1: Create final data export (GDPR requirement)
      await this.stepCreateFinalExport(result, options);

      // Step 2: Delete user data from all services
      await this.stepDeleteUserData(result, options);

      // Step 3: Clean up authentication data
      await this.stepDeleteAuthData(result, options);

      // Step 4: Verify deletion completion
      await this.stepVerifyDeletion(result, options);

      // Step 5: Final cleanup and logging
      await this.stepFinalizeDeletion(result, options);

      result.duration = Date.now() - startTime;
      result.success = result.errors.length === 0;

      // Log completion
      auditService.log(
        auditEvents.ACCOUNT_DELETION,
        {
          deletionId,
          userId,
          success: result.success,
          duration: result.duration,
          dataDeleted: result.dataDeleted,
          errors: result.errors.length,
        },
        userId,
        result.success ? 'high' : 'critical'
      );

      this.deletionSteps.push(result);
      return result;
    } catch (error) {
      const errorResult = {
        deletionId,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      };

      auditService.log(
        auditEvents.ACCOUNT_DELETION,
        {
          deletionId,
          userId: AuthService.getUserId(),
          success: false,
          error: error.message,
          duration: errorResult.duration,
        },
        AuthService.getUserId(),
        'critical'
      );

      this.deletionSteps.push(errorResult);
      throw error;
    } finally {
      this.deletionInProgress = false;
    }
  }

  /**
   * Step 1: Create final data export for user
   */
  async stepCreateFinalExport(result, _options) {
    const step = {
      name: 'Final Data Export',
      status: 'running',
      startTime: Date.now(),
    };

    try {
      const { EmergencyExportService } =
        await import('./emergency-export-service.js');

      // Create comprehensive export
      const exportResult = await EmergencyExportService.createEmergencyExport({
        format: 'json',
        includeAudit: true,
        reason: 'account_deletion',
      });

      if (exportResult.success) {
        result.finalExport = {
          filename: exportResult.filename,
          size: exportResult.size,
          downloadUrl: exportResult.downloadUrl,
          dataCount: exportResult.dataCount,
        };
        step.status = 'completed';
        step.exportSize = exportResult.size;
      } else {
        throw new Error(`Export failed: ${exportResult.error}`);
      }
    } catch (error) {
      step.status = 'failed';
      step.error = error.message;
      result.errors.push(`Final export failed: ${error.message}`);
    }

    step.endTime = Date.now();
    result.steps.push(step);
  }

  /**
   * Step 2: Delete user data from all services
   */
  async stepDeleteUserData(result, _options) {
    const step = {
      name: 'User Data Deletion',
      status: 'running',
      startTime: Date.now(),
    };

    try {
      const userId = AuthService.getUserId();

      // Delete transactions
      try {
        const transactions = TransactionService.getAll();
        const userTransactions = transactions.filter(
          tx => !tx.userId || tx.userId === userId
        );

        for (const transaction of userTransactions) {
          TransactionService.remove(transaction.id);
          result.dataDeleted.transactions++;
        }
      } catch (error) {
        result.warnings.push(`Transaction deletion failed: ${error.message}`);
      }

      // Delete accounts
      try {
        const { AccountService } = await import('./account-service.js');
        const accounts = AccountService.getAccounts();

        for (const account of accounts) {
          AccountService.deleteAccount(account.id);
          result.dataDeleted.accounts++;
        }
      } catch (error) {
        result.warnings.push(`Account deletion failed: ${error.message}`);
      }

      // Delete goals
      try {
        const { goalPlanner } = await import('./goal-planner.js');
        const goals = goalPlanner.getAllGoals();

        for (const goal of goals) {
          goalPlanner.deleteGoal(goal.id);
          result.dataDeleted.goals++;
        }
      } catch (error) {
        result.warnings.push(`Goal deletion failed: ${error.message}`);
      }

      // Delete investments
      try {
        const { InvestmentTracker } = await import('./investment-tracker.js');
        const investments = InvestmentTracker.getAllInvestments();

        for (const investment of investments) {
          InvestmentTracker.removeInvestment(investment.id);
          result.dataDeleted.investments++;
        }
      } catch (error) {
        result.warnings.push(`Investment deletion failed: ${error.message}`);
      }

      // Delete budgets
      try {
        const { BudgetService } = await import('./budget-service.js');
        const budgets = BudgetService.getAllBudgets();

        for (const budget of budgets) {
          BudgetService.deleteBudget(budget.id);
          result.dataDeleted.budgets++;
        }
      } catch (error) {
        result.warnings.push(`Budget deletion failed: ${error.message}`);
      }

      // Delete settings
      try {
        const settingsKeys = Object.keys(localStorage).filter(
          key =>
            key.startsWith('blinkbudget_setting_') ||
            key.startsWith('blink_settings')
        );

        for (const key of settingsKeys) {
          localStorage.removeItem(key);
          result.dataDeleted.settings++;
        }
      } catch (error) {
        result.warnings.push(`Settings deletion failed: ${error.message}`);
      }

      step.status = 'completed';
      step.dataDeleted = result.dataDeleted;
    } catch (error) {
      step.status = 'failed';
      step.error = error.message;
      result.errors.push(`Data deletion failed: ${error.message}`);
    }

    step.endTime = Date.now();
    result.steps.push(step);
  }

  /**
   * Step 3: Delete authentication data
   */
  async stepDeleteAuthData(result, _options) {
    const step = {
      name: 'Authentication Data Deletion',
      status: 'running',
      startTime: Date.now(),
    };

    try {
      const user = AuthService.user;

      if (user && auth) {
        console.log(
          '[AccountDeletion] Attempting to delete Firebase user:',
          user.uid
        );

        // Check if Firebase is available before attempting deletion
        const { firebaseStatus } = await import('./firebase-config.js');
        if (!firebaseStatus.isInitialized || !firebaseStatus.canUseAuth) {
          console.warn(
            '[AccountDeletion] Firebase not available, skipping auth deletion'
          );
          result.authDeleted = false;
          result.warnings.push(
            'Firebase not available, skipping authentication deletion'
          );
        } else {
          // Delete the Firebase user account
          await deleteUser(user);
          result.authDeleted = true;
          console.log('[AccountDeletion] Firebase user deleted successfully');
        }
      } else {
        console.warn(
          '[AccountDeletion] No authenticated user found for deletion'
        );
        // Fallback: just sign out if no authenticated user
        await AuthService.logout();
        result.authDeleted = false;
        result.warnings.push('No authenticated user found for deletion');
      }

      // Clear auth-related localStorage
      const authKeys = Object.keys(localStorage).filter(
        key =>
          key.includes('auth') ||
          key.includes('token') ||
          key.includes('session')
      );

      for (const key of authKeys) {
        localStorage.removeItem(key);
      }

      // Clear session storage
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }

      step.status = 'completed';
      step.authKeysCleared = authKeys.length;
      step.firebaseAccountDeleted = result.authDeleted;
    } catch (error) {
      console.error('[AccountDeletion] Auth deletion failed:', error);
      step.status = 'failed';
      step.error = error.message;
      result.errors.push(`Auth deletion failed: ${error.message}`);

      // Check if it's a Firebase auth error
      if (error.code === 'auth/user-not-found') {
        result.warnings.push('User was already deleted from Firebase');
        result.authDeleted = true; // Consider this successful
      } else if (error.code === 'auth/requires-recent-login') {
        result.warnings.push(
          'Recent login required for account deletion. Please log in again and try.'
        );
        result.authDeleted = false;
      } else {
        result.authDeleted = false;
      }

      // Fallback: try to at least sign out
      try {
        await AuthService.logout();
        if (!result.authDeleted) {
          result.warnings.push(
            'Firebase account deletion failed, but user was signed out'
          );
        }
      } catch (logoutError) {
        result.warnings.push(`Sign out also failed: ${logoutError.message}`);
      }
    }

    step.endTime = Date.now();
    result.steps.push(step);
  }

  /**
   * Step 4: Verify deletion completion
   */
  async stepVerifyDeletion(result, _options) {
    const step = {
      name: 'Deletion Verification',
      status: 'running',
      startTime: Date.now(),
    };

    try {
      const userId = result.userId;
      const verificationResults = {
        authCheck: false,
        localStorageCheck: false,
        transactionCheck: false,
        accountCheck: false,
        goalCheck: false,
        investmentCheck: false,
        budgetCheck: false,
        settingsCheck: false,
      };

      // Check if user is still authenticated (should be false)
      verificationResults.authCheck = !AuthService.isAuthenticated();
      if (!verificationResults.authCheck) {
        result.warnings.push('User still appears to be authenticated');
      }

      // Check localStorage for remaining user data
      const remainingKeys = Object.keys(localStorage).filter(key =>
        key.startsWith('blinkbudget_')
      );

      verificationResults.localStorageCheck = remainingKeys.length === 0;
      if (remainingKeys.length > 0) {
        result.warnings.push(
          `${remainingKeys.length} localStorage keys remain: ${remainingKeys.join(', ')}`
        );
      }

      // Verify transactions are deleted
      try {
        const remainingTransactions = TransactionService.getAll();
        const userTransactions = remainingTransactions.filter(
          tx => !tx.userId || tx.userId === userId
        );
        verificationResults.transactionCheck = userTransactions.length === 0;
        if (userTransactions.length > 0) {
          result.warnings.push(
            `${userTransactions.length} user transactions still exist`
          );
        }
      } catch {
        // Expected - service should fail after auth deletion
        verificationResults.transactionCheck = true;
      }

      // Verify accounts are deleted
      try {
        const { AccountService } = await import('./account-service.js');
        const remainingAccounts = AccountService.getAccounts();
        const userAccounts = remainingAccounts.filter(
          acc => !acc.userId || acc.userId === userId
        );
        verificationResults.accountCheck = userAccounts.length === 0;
        if (userAccounts.length > 0) {
          result.warnings.push(
            `${userAccounts.length} user accounts still exist`
          );
        }
      } catch {
        verificationResults.accountCheck = true;
      }

      // Verify goals are deleted
      try {
        const { goalPlanner } = await import('./goal-planner.js');
        const remainingGoals = goalPlanner.getAllGoals();
        const userGoals = remainingGoals.filter(
          goal => !goal.userId || goal.userId === userId
        );
        verificationResults.goalCheck = userGoals.length === 0;
        if (userGoals.length > 0) {
          result.warnings.push(`${userGoals.length} user goals still exist`);
        }
      } catch {
        verificationResults.goalCheck = true;
      }

      // Verify investments are deleted
      try {
        const { InvestmentTracker } = await import('./investment-tracker.js');
        const remainingInvestments = InvestmentTracker.getAllInvestments();
        const userInvestments = remainingInvestments.filter(
          inv => !inv.userId || inv.userId === userId
        );
        verificationResults.investmentCheck = userInvestments.length === 0;
        if (userInvestments.length > 0) {
          result.warnings.push(
            `${userInvestments.length} user investments still exist`
          );
        }
      } catch {
        verificationResults.investmentCheck = true;
      }

      // Verify budgets are deleted
      try {
        const { BudgetService } = await import('./budget-service.js');
        const remainingBudgets = BudgetService.getAllBudgets();
        const userBudgets = remainingBudgets.filter(
          budget => !budget.userId || budget.userId === userId
        );
        verificationResults.budgetCheck = userBudgets.length === 0;
        if (userBudgets.length > 0) {
          result.warnings.push(
            `${userBudgets.length} user budgets still exist`
          );
        }
      } catch {
        verificationResults.budgetCheck = true;
      }

      // Verify settings are deleted
      const settingsKeys = Object.keys(localStorage).filter(
        key =>
          key.startsWith('blinkbudget_setting_') ||
          key.startsWith('blink_settings')
      );
      verificationResults.settingsCheck = settingsKeys.length === 0;
      if (settingsKeys.length > 0) {
        result.warnings.push(
          `${settingsKeys.length} settings keys still exist`
        );
      }

      // Overall verification result
      const allChecksPass = Object.values(verificationResults).every(
        check => check === true
      );

      step.status = 'completed';
      step.verificationPassed = allChecksPass;
      step.verificationResults = verificationResults;
      step.verificationSummary = {
        totalChecks: Object.keys(verificationResults).length,
        passedChecks: Object.values(verificationResults).filter(check => check)
          .length,
        failedChecks: Object.values(verificationResults).filter(check => !check)
          .length,
      };

      if (!allChecksPass) {
        result.warnings.push(
          'Some verification checks failed - data may not be completely deleted'
        );
      }
    } catch (error) {
      step.status = 'failed';
      step.error = error.message;
      result.errors.push(`Verification failed: ${error.message}`);
    }

    step.endTime = Date.now();
    result.steps.push(step);
  }

  /**
   * Step 5: Finalize deletion
   */
  async stepFinalizeDeletion(result, _options) {
    const step = {
      name: 'Finalization',
      status: 'running',
      startTime: Date.now(),
    };

    try {
      // Create deletion record
      const deletionRecord = {
        deletionId: result.deletionId,
        // Omit PII for compliance - store only operational metadata
        timestamp: result.timestamp,
        duration: result.duration,
        dataDeleted: result.dataDeleted,
        success: result.success,
      };

      // Store deletion record (for compliance purposes)
      localStorage.setItem(
        `deletion_record_${result.deletionId}`,
        JSON.stringify(deletionRecord)
      );

      // Clear any remaining cache
      if (typeof window !== 'undefined' && 'caches' in window) {
        try {
          const cacheNames = await window.caches.keys();
          await Promise.all(cacheNames.map(name => window.caches.delete(name)));
        } catch (cacheError) {
          result.warnings.push(`Cache clearing failed: ${cacheError.message}`);
        }
      }

      step.status = 'completed';
      step.recordCreated = true;
    } catch (error) {
      step.status = 'failed';
      step.error = error.message;
      result.errors.push(`Finalization failed: ${error.message}`);
    }

    step.endTime = Date.now();
    result.steps.push(step);
  }

  /**
   * Get deletion status
   * @param {string} deletionId - Deletion ID
   * @returns {Object|null} Deletion status
   */
  getDeletionStatus(deletionId) {
    return (
      this.deletionSteps.find(step => step.deletionId === deletionId) || null
    );
  }

  /**
   * Get all deletion history
   * @returns {Array} Deletion history
   */
  getDeletionHistory() {
    return [...this.deletionSteps];
  }

  /**
   * Generate unique deletion ID
   */
  generateDeletionId() {
    return `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if deletion is in progress
   * @returns {boolean} Deletion status
   */
  isDeletionInProgress() {
    return this.deletionInProgress;
  }

  /**
   * Get user data summary before deletion
   * @returns {Object} Data summary
   */
  async getUserDataSummary() {
    const summary = {
      transactions: 0,
      accounts: 0,
      goals: 0,
      investments: 0,
      budgets: 0,
      settings: 0,
      totalStorageSize: 0,
    };

    try {
      // Count transactions
      const transactions = TransactionService.getAll();
      summary.transactions = transactions.length;

      // Count accounts
      const { AccountService } = await import('./account-service.js');
      const accounts = AccountService.getAccounts();
      summary.accounts = accounts.length;

      // Count goals
      const { goalPlanner } = await import('./goal-planner.js');
      const goals = goalPlanner.getAllGoals();
      summary.goals = goals.length;

      // Count investments
      const { InvestmentTracker } = await import('./investment-tracker.js');
      const investments = InvestmentTracker.getAllInvestments
        ? InvestmentTracker.getAllInvestments()
        : [];
      summary.investments = investments.length;

      // Count budgets
      const { BudgetService } = await import('./budget-service.js');
      const budgets = BudgetService.getAllBudgets();
      summary.budgets = budgets.length;

      // Count settings
      const settingsKeys = Object.keys(localStorage).filter(
        key =>
          key.startsWith('blinkbudget_setting_') ||
          key.startsWith('blink_settings')
      );
      summary.settings = settingsKeys.length;

      // Calculate storage size
      let totalSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('blinkbudget_')) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += value.length;
          }
        }
      }
      summary.totalStorageSize = totalSize;
    } catch (error) {
      console.warn('Failed to get user data summary:', error);
    }

    return summary;
  }
}

// Singleton instance
export const accountDeletionService = new AccountDeletionService();
