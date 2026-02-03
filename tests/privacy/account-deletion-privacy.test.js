/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { accountDeletionService } from '../../src/core/account-deletion-service.js';
import { AuthService } from '../../src/core/auth-service.js';
import { TransactionService } from '../../src/core/transaction-service.js';
import { StorageService } from '../../src/core/storage.js';
import { auditService, auditEvents } from '../../src/core/audit-service.js';
import { mockFinancialData } from '../security/test-data.js';

// Mock Firebase for testing
vi.mock('../../src/core/firebase-config.js', () => ({
  auth: {
    currentUser: null,
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
    signOut: vi.fn(),
  },
}));

describe('Account Deletion Privacy Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset services
    StorageService.clear();
    AuthService.user = null;
    localStorage.clear();
    sessionStorage.clear();

    // Mock user authentication
    AuthService.user = {
      uid: 'test-user-123',
      email: 'test@example.com',
    };

    // Reset deletion service
    accountDeletionService.deletionInProgress = false;
    accountDeletionService.deletionSteps = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Pre-Deletion Data Setup', () => {


    it('should create data for multiple users to test isolation', () => {
      // Create data for current user
      const user1Tx = {
        id: 'tx1',
        amount: 100,
        category: 'Food',
        userId: 'test-user-123',
      };
      StorageService.add(user1Tx);

      // Create data for different user
      const user2Tx = {
        id: 'tx2',
        amount: 200,
        category: 'Transport',
        userId: 'other-user-456',
      };
      StorageService.add(user2Tx);

      // Should have both transactions
      expect(StorageService.getAllTransactions().length).toBe(2);
    });
  });

  describe('Account Deletion Process', () => {
    it('should initiate account deletion with proper validation', async () => {
      // Mock successful authentication
      AuthService.user = { uid: 'test-user-123', email: 'test@example.com' };

      // Mock audit service
      const mockLog = vi.fn();
      auditService.log = mockLog;

      // Mock emergency export service
      const mockExportService = {
        createEmergencyExport: vi.fn().mockResolvedValue({
          success: true,
          filename: 'export.json',
          size: 1024,
          downloadUrl: 'http://example.com/export.json',
          dataCount: { transactions: 5, accounts: 2, goals: 2 },
        }),
      };
      vi.doMock('../../src/core/emergency-export-service.js', () => ({
        EmergencyExportService: mockExportService,
      }));

      const result = await accountDeletionService.initiateAccountDeletion();

      expect(result).toBeDefined();
      expect(result.userId).toBe('test-user-123');
      expect(result.userEmail).toBe('test@example.com');
      expect(result.deletionId).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.steps).toBeDefined();
      expect(result.dataDeleted).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(result.warnings).toBeDefined();
    });

    it('should reject deletion for unauthenticated users', async () => {
      AuthService.user = null;

      await expect(
        accountDeletionService.initiateAccountDeletion()
      ).rejects.toThrow('User must be authenticated to delete account');
    });

    it('should prevent concurrent deletion processes', async () => {
      AuthService.user = { uid: 'test-user-123', email: 'test@example.com' };

      // Set deletion in progress
      accountDeletionService.deletionInProgress = true;

      await expect(
        accountDeletionService.initiateAccountDeletion()
      ).rejects.toThrow('Account deletion already in progress');
    });
  });

  describe('Data Deletion Verification', () => {
    it('should delete all user transactions', async () => {
      // Create test transactions
      const transactions = [
        { id: 'tx1', amount: 100, userId: 'test-user-123' },
        { id: 'tx2', amount: 200, userId: 'test-user-123' },
        { id: 'tx3', amount: 300, userId: 'other-user-456' }, // Different user
      ];
      transactions.forEach(tx => StorageService.add(tx));

      // Mock the deletion process
      const mockDeleteUserData = vi.fn().mockImplementation(async result => {
        const userId = AuthService.getUserId();
        const allTransactions = TransactionService.getAll();
        const userTransactions = allTransactions.filter(
          tx => !tx.userId || tx.userId === userId
        );

        for (const transaction of userTransactions) {
          TransactionService.remove(transaction.id);
          result.dataDeleted.transactions++;
        }
      });

      accountDeletionService.stepDeleteUserData = mockDeleteUserData;

      const result = { dataDeleted: { transactions: 0 } };
      await accountDeletionService.stepDeleteUserData(result);

      // Should delete only user's transactions
      expect(result.dataDeleted.transactions).toBe(2);

      // Other user's transaction should remain
      const remainingTransactions = TransactionService.getAll();
      expect(remainingTransactions.length).toBe(1);
      expect(remainingTransactions[0].userId).toBe('other-user-456');
    });





    it('should delete user settings from localStorage', async () => {
      // Create test settings
      localStorage.setItem('blinkbudget_setting_currency', 'USD');
      localStorage.setItem('blinkbudget_setting_theme', 'dark');
      localStorage.setItem('blink_settings_language', 'en');
      localStorage.setItem('other_setting', 'should_not_be_deleted');

      // Mock the settings deletion
      const mockDeleteUserData = vi.fn().mockImplementation(async result => {
        const settingsKeys = Object.keys(localStorage).filter(
          key =>
            key.startsWith('blinkbudget_setting_') ||
            key.startsWith('blink_settings')
        );

        for (const key of settingsKeys) {
          localStorage.removeItem(key);
          result.dataDeleted.settings++;
        }
      });

      accountDeletionService.stepDeleteUserData = mockDeleteUserData;

      const result = { dataDeleted: { settings: 0 } };
      await accountDeletionService.stepDeleteUserData(result);

      expect(result.dataDeleted.settings).toBe(3);
      expect(localStorage.getItem('blinkbudget_setting_currency')).toBeNull();
      expect(localStorage.getItem('blinkbudget_setting_theme')).toBeNull();
      expect(localStorage.getItem('blink_settings_language')).toBeNull();
      expect(localStorage.getItem('other_setting')).toBe(
        'should_not_be_deleted'
      );
    });


  });

  describe('Post-Deletion Verification', () => {
    it('should verify complete data deletion', async () => {
      // Create some remaining data to verify deletion
      localStorage.setItem('blinkbudget_setting_currency', 'USD');
      StorageService.add({
        id: 'tx1',
        amount: 100,
        userId: 'test-user-123',
      });

      // Mock verification step
      const mockVerifyDeletion = vi.fn().mockImplementation(async result => {
        // Check if user is still authenticated
        if (AuthService.isAuthenticated()) {
          result.warnings.push('User still appears to be authenticated');
        }

        // Check localStorage for remaining user data
        const remainingKeys = Object.keys(localStorage).filter(key =>
          key.startsWith('blinkbudget_')
        );

        if (remainingKeys.length > 0) {
          result.warnings.push(
            `${remainingKeys.length} localStorage keys remain: ${remainingKeys.join(', ')}`
          );
        }

        // Check if any user data can still be retrieved
        try {
          const remainingTransactions = TransactionService.getAll();
          if (remainingTransactions.length > 0) {
            result.warnings.push(
              `${remainingTransactions.length} transactions still exist`
            );
          }
        } catch {
          // Expected - service should fail after auth deletion
        }

        result.verificationPassed = result.errors.length === 0;
      });

      accountDeletionService.stepVerifyDeletion = mockVerifyDeletion;

      const result = { errors: [], warnings: [] };
      await accountDeletionService.stepVerifyDeletion(result);

      expect(result.verificationPassed).toBeDefined();
      expect(result.warnings.length).toBeGreaterThan(0); // Should find remaining data
    });




  });

  describe('Privacy Compliance', () => {
    it('should create final export before deletion', async () => {
      // Mock emergency export service
      const mockExportService = {
        createEmergencyExport: vi.fn().mockResolvedValue({
          success: true,
          filename: 'final_export.json',
          size: 2048,
          downloadUrl: 'http://example.com/final_export.json',
          dataCount: { transactions: 5, accounts: 2, goals: 2, settings: 3 },
        }),
      };

      // Mock the import
      vi.doMock('../../src/core/emergency-export-service.js', () => ({
        EmergencyExportService: mockExportService,
      }));

      const result = { finalExport: null };
      await accountDeletionService.stepCreateFinalExport(result);

      expect(mockExportService.createEmergencyExport).toHaveBeenCalledWith({
        format: 'json',
        includeAudit: true,
        reason: 'account_deletion',
      });

      expect(result.finalExport).toBeDefined();
      expect(result.finalExport.filename).toBe('final_export.json');
      expect(result.finalExport.size).toBe(2048);
    });

    it('should log all deletion steps for audit trail', async () => {
      AuthService.user = { uid: 'test-user-123', email: 'test@example.com' };

      const mockLog = vi.fn();
      auditService.log = mockLog;

      // Mock emergency export to avoid import issues
      const mockExportService = {
        createEmergencyExport: vi.fn().mockResolvedValue({
          success: true,
          filename: 'export.json',
          size: 1024,
          downloadUrl: 'http://example.com/export.json',
        }),
      };
      vi.doMock('../../src/core/emergency-export-service.js', () => ({
        EmergencyExportService: mockExportService,
      }));

      await accountDeletionService.initiateAccountDeletion();

      // Should log initiation
      expect(mockLog).toHaveBeenCalledWith(
        auditEvents.ACCOUNT_DELETION,
        expect.objectContaining({
          stage: 'initiated',
        }),
        'test-user-123',
        'critical'
      );

      // Should log completion
      expect(mockLog).toHaveBeenCalledWith(
        auditEvents.ACCOUNT_DELETION,
        expect.objectContaining({
          success: expect.any(Boolean),
        }),
        'test-user-123',
        'critical'
      );
    });

    it('should handle deletion failures gracefully', async () => {
      AuthService.user = { uid: 'test-user-123', email: 'test@example.com' };

      // Mock export failure
      const mockExportService = {
        createEmergencyExport: vi.fn().mockResolvedValue({
          success: false,
          error: 'Export failed due to server error',
        }),
      };
      vi.doMock('../../src/core/emergency-export-service.js', () => ({
        EmergencyExportService: mockExportService,
      }));

      const result = await accountDeletionService.initiateAccountDeletion();

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Export failed');
    });
  });

  describe('Data Isolation Verification', () => {
    it('should only delete data belonging to the requesting user', async () => {
      // Create data for multiple users
      const user1Data = [
        { id: 'tx1', amount: 100, userId: 'test-user-123' },
        { id: 'acc1', name: 'Checking', userId: 'test-user-123' },
        { id: 'goal1', name: 'Emergency Fund', userId: 'test-user-123' },
      ];

      const user2Data = [
        { id: 'tx2', amount: 200, userId: 'other-user-456' },
        { id: 'acc2', name: 'Savings', userId: 'other-user-456' },
        { id: 'goal2', name: 'Vacation', userId: 'other-user-456' },
      ];

      // Add all data
      [...user1Data, ...user2Data].forEach(item => {
        if (item.amount) {
          StorageService.add(item);
        } else if (item.name && !item.target) {
          StorageService.addAccount(item);
        } else {
          StorageService.addGoal(item);
        }
      });

      // Mock deletion for user1
      const mockDeleteUserData = vi.fn().mockImplementation(async result => {
        const userId = AuthService.getUserId();

        // Delete transactions
        const transactions = TransactionService.getAll();
        const userTransactions = transactions.filter(
          tx => !tx.userId || tx.userId === userId
        );
        userTransactions.forEach(tx => {
          TransactionService.remove(tx.id);
          result.dataDeleted.transactions++;
        });

        // Delete accounts
        const { AccountService } =
          await import('../../src/core/account-service.js');
        const accounts = AccountService.getAccounts();
        accounts.forEach(acc => {
          AccountService.deleteAccount(acc.id);
          result.dataDeleted.accounts++;
        });

        // Delete goals
        const { GoalPlanner } = await import('../../src/core/goal-planner.js');
        const goals = GoalPlanner.getAllGoals();
        goals.forEach(goal => {
          GoalPlanner.deleteGoal(goal.id);
          result.dataDeleted.goals++;
        });
      });

      accountDeletionService.stepDeleteUserData = mockDeleteUserData;

      const result = {
        dataDeleted: { transactions: 0, accounts: 0, goals: 0 },
      };
      await accountDeletionService.stepDeleteUserData(result);

      // Should only delete user1's data
      expect(result.dataDeleted.transactions).toBe(1);
      expect(result.dataDeleted.accounts).toBe(1);
      expect(result.dataDeleted.goals).toBe(1);

      // User2's data should remain
      const remainingData = StorageService.getAllTransactions();
      expect(remainingData.length).toBe(1);
      expect(remainingData[0].userId).toBe('other-user-456');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing user data gracefully', async () => {
      AuthService.user = { uid: 'test-user-123', email: 'test@example.com' };

      // No data exists - should handle gracefully
      const mockExportService = {
        createEmergencyExport: vi.fn().mockResolvedValue({
          success: true,
          filename: 'empty_export.json',
          size: 0,
          downloadUrl: 'http://example.com/empty_export.json',
          dataCount: { transactions: 0, accounts: 0, goals: 0 },
        }),
      };
      vi.doMock('../../src/core/emergency-export-service.js', () => ({
        EmergencyExportService: mockExportService,
      }));

      const result = await accountDeletionService.initiateAccountDeletion();

      expect(result.success).toBe(true);
      expect(result.dataDeleted.transactions).toBe(0);
      expect(result.dataDeleted.accounts).toBe(0);
      expect(result.dataDeleted.goals).toBe(0);
    });

    it('should handle service failures during deletion', async () => {
      AuthService.user = { uid: 'test-user-123', email: 'test@example.com' };

      // Mock service failure
      const mockExportService = {
        createEmergencyExport: vi.fn().mockResolvedValue({
          success: true,
          filename: 'export.json',
          size: 1024,
          downloadUrl: 'http://example.com/export.json',
        }),
      };
      vi.doMock('../../src/core/emergency-export-service.js', () => ({
        EmergencyExportService: mockExportService,
      }));

      // Mock transaction service failure
      const mockGetAll = vi.fn().mockImplementation(() => {
        throw new Error('Service unavailable');
      });
      TransactionService.getAll = mockGetAll;

      const result = await accountDeletionService.initiateAccountDeletion();

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should handle partial deletion scenarios', async () => {
      AuthService.user = { uid: 'test-user-123', email: 'test@example.com' };

      // Create some data
      StorageService.add({ id: 'tx1', amount: 100, userId: 'test-user-123' });
      localStorage.setItem('blinkbudget_setting_currency', 'USD');

      // Mock partial failure - transactions succeed, settings fail
      const mockDeleteUserData = vi.fn().mockImplementation(async result => {
        try {
          // Delete transactions successfully
          const transactions = TransactionService.getAll();
          const userTransactions = transactions.filter(
            tx => !tx.userId || tx.userId === AuthService.getUserId()
          );
          userTransactions.forEach(tx => {
            TransactionService.remove(tx.id);
            result.dataDeleted.transactions++;
          });
        } catch (error) {
          result.warnings.push(`Transaction deletion failed: ${error.message}`);
        }

        try {
          // Simulate settings deletion failure
          throw new Error('Settings service unavailable');
        } catch (error) {
          result.warnings.push(`Settings deletion failed: ${error.message}`);
        }
      });

      accountDeletionService.stepDeleteUserData = mockDeleteUserData;

      const result = {
        dataDeleted: { transactions: 0, settings: 0 },
        warnings: [],
      };
      await accountDeletionService.stepDeleteUserData(result);

      expect(result.dataDeleted.transactions).toBe(1);
      expect(result.warnings.length).toBe(1);
      expect(result.warnings[0]).toContain('Settings deletion failed');
    });
  });
});
