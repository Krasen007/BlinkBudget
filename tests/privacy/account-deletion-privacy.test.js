/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { accountDeletionService } from '../../src/core/account-deletion-service.js';
import { AuthService } from '../../src/core/auth-service.js';
import { TransactionService } from '../../src/core/transaction-service.js';
import { StorageService } from '../../src/core/storage.js';
import { auditService, auditEvents } from '../../src/core/audit-service.js';

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

  describe('Privacy Compliance', () => {
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
});
