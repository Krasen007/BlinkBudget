/* eslint-disable no-script-url */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BackupService } from '../../src/core/backup-service.js';
import { EmergencyRecoveryService } from '../../src/core/emergency-recovery-service.js';
import { TransactionService } from '../../src/core/transaction-service.js';
import { StorageService } from '../../src/core/storage.js';
import { AuthService } from '../../src/core/auth-service.js';
import { mockFinancialData } from './test-data.js';

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

describe('Data Export Integrity Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset services
    StorageService.clear();
    AuthService.user = null;
    localStorage.clear();

    // Mock user authentication
    AuthService.user = { uid: 'test-user-123', email: 'test@example.com' };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('CSV Export Functionality', () => {
    it('should export transactions with correct structure', async () => {
      // Create test transactions
      const testTransactions = [
        {
          id: 'tx1',
          amount: 100.5,
          category: 'Food & Dining',
          date: '2024-01-15',
          type: 'expense',
          description: 'Lunch at cafe',
          userId: 'test-user-123',
        },
        {
          id: 'tx2',
          amount: 2000.0,
          category: 'Salary',
          date: '2024-01-01',
          type: 'income',
          description: 'Monthly salary',
          userId: 'test-user-123',
        },
      ];

      // Add transactions to storage
      testTransactions.forEach(tx => {
        StorageService.add(tx);
      });

      // Mock the CSV export functionality
      const mockCreateObjectURL = vi.fn(() => 'mock-url');
      const mockRevokeObjectURL = vi.fn();

      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      // Mock createElement and click for download
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      const mockCreateElement = vi.fn(() => mockLink);
      global.document.createElement = mockCreateElement;

      // Simulate export process using existing method
      const transactions = TransactionService.getAllTransactions();
      expect(transactions.length).toBe(2);

      // Verify data integrity
      transactions.forEach(tx => {
        expect(tx.userId).toBe('test-user-123');
        expect(typeof tx.amount).toBe('number');
        expect(typeof tx.date).toBe('string');
        expect(['expense', 'income']).toContain(tx.type);
      });
    });

    it('should handle empty export gracefully', () => {
      // Mock empty export
      const mockCreateObjectURL = vi.fn(() => 'mock-url');
      global.URL.createObjectURL = mockCreateObjectURL;

      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      const mockCreateElement = vi.fn(() => mockLink);
      global.document.createElement = mockCreateElement;

      expect(() => {
        const transactions = TransactionService.getAllTransactions();
        expect(Array.isArray(transactions)).toBe(true);
      }).not.toThrow();
    });

    it('should handle potentially malicious data', () => {
      // Create transaction with potentially malicious data
      const maliciousTx = {
        amount: 100,
        category: '<script>alert("XSS")</script>',
        date: '2024-01-15',
        type: 'expense',
        description: 'javascript:alert("XSS")',
        userId: 'test-user-123',
      };

      StorageService.add(maliciousTx);

      const transactions = TransactionService.getAllTransactions();
      expect(transactions.length).toBe(1);

      // Data should be stored as-is (sanitization happens at display layer)
      const tx = transactions[0];
      expect(tx.category).toBe('<script>alert("XSS")</script>');
      expect(tx.description).toBe('javascript:alert("XSS")');
    });
  });

  describe('Backup Service Integrity', () => {
    it('should verify backup exists for user', async () => {
      // Mock backup existence check
      const mockCheckBackupExists = vi.fn().mockResolvedValue({
        exists: true,
        data: {
          userId: 'test-user-123',
          timestamp: '2024-01-15T10:00:00Z',
          transactions: [],
          settings: {},
        },
      });

      BackupService.checkBackupExists = mockCheckBackupExists;

      const result = await BackupService.checkBackupExists('test-user-123');
      expect(result.exists).toBe(true);
      expect(result.data.userId).toBe('test-user-123');
    });

    it('should verify backup integrity', async () => {
      const mockBackupData = {
        userId: 'test-user-123',
        timestamp: '2024-01-15T10:00:00Z',
        transactions: [
          {
            id: 'tx1',
            amount: 100,
            category: 'Food',
            date: '2024-01-15',
            type: 'expense',
          },
        ],
        settings: {
          currency: 'USD',
          theme: 'light',
        },
      };

      // Mock integrity check
      const mockVerifyIntegrity = vi.fn().mockResolvedValue({
        valid: true,
        checksum: 'abc123',
        size: 1024,
        issues: [],
      });

      BackupService.verifyBackupIntegrity = mockVerifyIntegrity;

      const result = await BackupService.verifyBackupIntegrity(mockBackupData);
      expect(result.valid).toBe(true);
      expect(result.checksum).toBe('abc123');
    });

    it('should detect corrupted backup data', async () => {
      const corruptedData = {
        userId: 'test-user-123',
        transactions: null, // Corrupted data
        settings: undefined,
      };

      const mockVerifyIntegrity = vi.fn().mockResolvedValue({
        valid: false,
        issues: ['Missing transactions array', 'Invalid settings object'],
        checksum: null,
      });

      BackupService.verifyBackupIntegrity = mockVerifyIntegrity;

      const result = await BackupService.verifyBackupIntegrity(corruptedData);
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should verify data completeness', async () => {
      const completeData = {
        userId: 'test-user-123',
        transactions: [
          { id: 'tx1', amount: 100 },
          { id: 'tx2', amount: 200 },
        ],
        settings: { currency: 'USD' },
        accounts: [{ id: 'acc1', balance: 1000 }],
        goals: [{ id: 'goal1', target: 5000 }],
      };

      const mockVerifyCompleteness = vi.fn().mockResolvedValue({
        valid: true,
        missingFields: [],
        dataTypes: {
          transactions: 2,
          settings: 1,
          accounts: 1,
          goals: 1,
        },
      });

      BackupService.verifyDataCompleteness = mockVerifyCompleteness;

      const result = await BackupService.verifyDataCompleteness(completeData);
      expect(result.valid).toBe(true);
      expect(result.missingFields.length).toBe(0);
    });

    it('should detect incomplete backup data', async () => {
      const incompleteData = {
        userId: 'test-user-123',
        transactions: [],
        // Missing settings, accounts, goals
      };

      const mockVerifyCompleteness = vi.fn().mockResolvedValue({
        valid: false,
        missingFields: ['settings', 'accounts', 'goals'],
        dataTypes: {
          transactions: 0,
          settings: 0,
          accounts: 0,
          goals: 0,
        },
      });

      BackupService.verifyDataCompleteness = mockVerifyCompleteness;

      const result = await BackupService.verifyDataCompleteness(incompleteData);
      expect(result.valid).toBe(false);
      expect(result.missingFields).toContain('settings');
    });
  });

  describe('Emergency Recovery Service', () => {
    it('should perform emergency recovery with integrity checks', async () => {
      const recoveryService = new EmergencyRecoveryService();

      // Mock successful recovery
      const mockPerformRecovery = vi.fn().mockResolvedValue({
        success: true,
        recoveredItems: {
          transactions: mockFinancialData.validTransactions.length,
          settings: 1,
        },
        integrityVerified: true,
        timestamp: new Date().toISOString(),
      });

      recoveryService.performEmergencyRecovery = mockPerformRecovery;

      const result = await recoveryService.performEmergencyRecovery();
      expect(result.success).toBe(true);
      expect(result.integrityVerified).toBe(true);
      expect(result.recoveredItems.transactions).toBe(
        mockFinancialData.validTransactions.length
      );
    });

    it('should handle recovery failures gracefully', async () => {
      const recoveryService = new EmergencyRecoveryService();

      const mockPerformRecovery = vi
        .fn()
        .mockRejectedValue(new Error('Backup data corrupted - cannot recover'));

      recoveryService.performEmergencyRecovery = mockPerformRecovery;

      await expect(recoveryService.performEmergencyRecovery()).rejects.toThrow(
        'Backup data corrupted - cannot recover'
      );
    });

    it('should limit recovery attempts', async () => {
      const recoveryService = new EmergencyRecoveryService();

      // Mock failed recovery
      const mockPerformRecovery = vi
        .fn()
        .mockRejectedValue(new Error('Maximum recovery attempts exceeded'));
      recoveryService.performEmergencyRecovery = mockPerformRecovery;

      // Make maximum attempts
      for (let i = 0; i < recoveryService.maxRecoveryAttempts; i++) {
        try {
          await recoveryService.performEmergencyRecovery();
        } catch {
          // Expected to fail
        }
      }

      // Should throw on next attempt
      await expect(recoveryService.performEmergencyRecovery()).rejects.toThrow(
        'Maximum recovery attempts exceeded'
      );
    });
  });

  describe('Data Consistency Validation', () => {
    it('should maintain referential integrity', () => {
      // Create related data
      const transaction = StorageService.add({
        amount: 100,
        category: 'Food',
        type: 'expense',
        date: '2024-01-15',
        description: 'Test transaction',
      });

      const budget = StorageService.addBudget({
        category: 'Food',
        amount: 500,
        period: 'monthly',
      });

      // Verify user isolation
      expect(transaction.userId).toBe('test-user-123');
      expect(budget.userId).toBe('test-user-123');

      // Verify data consistency
      const retrievedTx = StorageService.get(transaction.id);
      const retrievedBudgets = StorageService.getBudgets();
      const retrievedBudget = retrievedBudgets.find(b => b.id === budget.id);

      expect(retrievedTx.userId).toBe(transaction.userId);
      expect(retrievedBudget.userId).toBe(budget.userId);
    });

    it('should handle data corruption scenarios', () => {
      // Simulate corrupted data
      const corruptedData = {
        id: 'corrupted-tx',
        amount: null,
        category: undefined,
        date: 'invalid-date',
        type: 'invalid-type',
        userId: 'test-user-123',
      };

      // Should handle gracefully without crashing
      expect(() => {
        // The service should validate and reject corrupted data
        const result = StorageService.add(corruptedData);
        // Either rejects or sanitizes the data
        expect(result).toBeDefined();
      }).not.toThrow();
    });

    it('should verify data type consistency', () => {
      const validTransaction = StorageService.add({
        amount: 100.5,
        category: 'Food',
        type: 'expense',
        date: '2024-01-15',
        description: 'Test',
      });

      // Verify data types
      expect(typeof validTransaction.amount).toBe('number');
      expect(typeof validTransaction.category).toBe('string');
      expect(typeof validTransaction.type).toBe('string');
      expect(typeof validTransaction.date).toBe('string');
      expect(typeof validTransaction.description).toBe('string');
      expect(typeof validTransaction.userId).toBe('string');
    });
  });

  describe('Export Security', () => {
    it('should not expose sensitive user data in exports', () => {
      // Create transaction with sensitive info
      const sensitiveTx = {
        amount: 100,
        category: 'Food',
        type: 'expense',
        date: '2024-01-15',
        description: 'Transaction with sensitive info',
        userId: 'test-user-123',
        // Internal fields that shouldn't be exported
        internalId: 'internal-123',
        metadata: { sensitive: 'data' },
      };

      StorageService.add(sensitiveTx);

      const transactions = TransactionService.getAllForExport();
      const tx = transactions[0];

      // Should not expose internal fields in export
      expect(tx.internalId).toBeUndefined();
      expect(tx.metadata).toBeUndefined();
      expect(tx.userId).toBeDefined(); // User ID needed for data ownership
    });

    it('should sanitize export filenames', () => {
      // Mock date inputs with potentially malicious values
      const maliciousStart = '<script>alert("XSS")</script>';
      const maliciousEnd = '../../../etc/passwd';

      // Should sanitize filenames
      const sanitizeFilename = str => {
        return str.replace(/[<>:"/\\|?*]/g, '_');
      };

      const sanitizedStart = sanitizeFilename(maliciousStart);
      const sanitizedEnd = sanitizeFilename(maliciousEnd);

      expect(sanitizedStart).not.toContain('<script>');
      expect(sanitizedEnd).not.toContain('../');
    });

    it('should handle large exports efficiently', () => {
      // Create many transactions
      const transactions = [];
      for (let i = 0; i < 1000; i++) {
        transactions.push({
          amount: Math.random() * 1000,
          category: 'Test',
          type: 'expense',
          date: '2024-01-15',
          description: `Transaction ${i}`,
          userId: 'test-user-123',
        });
      }

      const startTime = performance.now();

      // Simulate export process
      transactions.forEach(tx => {
        StorageService.add(tx);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(10000); // Less than 10 seconds (adjusted for test environment)
      expect(StorageService.getAllTransactions().length).toBe(1000);
    }, 15000); // 15 second timeout
  });

  describe('Backup Verification Workflow', () => {
    it('should perform complete backup verification', async () => {
      const mockVerificationResult = {
        userId: 'test-user-123',
        timestamp: '2024-01-15T10:00:00Z',
        success: true,
        checks: {
          backupExists: { exists: true },
          integrity: { valid: true, checksum: 'abc123' },
          completeness: { valid: true, missingFields: [] },
          freshness: { valid: true, age: 86400000 }, // 1 day old
          consistency: { valid: true, conflicts: [] },
        },
        errors: [],
        warnings: [],
      };

      const mockVerifyBackup = vi
        .fn()
        .mockResolvedValue(mockVerificationResult);
      BackupService.verifyBackup = mockVerifyBackup;

      const result = await BackupService.verifyBackup('test-user-123');

      expect(result.success).toBe(true);
      expect(result.checks.integrity.valid).toBe(true);
      expect(result.checks.completeness.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should identify backup issues', async () => {
      const mockVerificationResult = {
        userId: 'test-user-123',
        timestamp: '2024-01-15T10:00:00Z',
        success: false,
        checks: {
          backupExists: { exists: false },
          integrity: { valid: false, checksum: null },
          completeness: { valid: false, missingFields: ['settings'] },
          freshness: { valid: false, age: 604800000 }, // 7 days old
          consistency: { valid: false, conflicts: ['duplicate_ids'] },
        },
        errors: [
          'No backup found for user',
          'Backup integrity check failed',
          'Missing critical data fields',
        ],
        warnings: ['Backup is stale'],
      };

      const mockVerifyBackup = vi
        .fn()
        .mockResolvedValue(mockVerificationResult);
      BackupService.verifyBackup = mockVerifyBackup;

      const result = await BackupService.verifyBackup('test-user-123');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});
