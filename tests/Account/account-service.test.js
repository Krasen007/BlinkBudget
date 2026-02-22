/**
 * Account Service Test Suite
 * Tests for account management operations and persistence
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AccountService } from '../../src/core/Account/account-service.js';
import { STORAGE_KEYS, DEFAULTS } from '../../src/utils/constants.js';

// Mock dependencies
vi.mock('../../src/core/sync-service.js', () => ({
  SyncService: {
    pushToCloud: vi.fn(),
  },
}));

vi.mock('../../src/core/auth-service.js', () => ({
  AuthService: {
    getUserId: vi.fn(() => 'test-user-123'),
  },
}));

vi.mock('../../src/utils/security-utils.js', () => ({
  safeJsonParse: vi.fn((data) => JSON.parse(data)),
}));

vi.mock('../../src/core/audit-service.js', () => ({
  auditService: {
    log: vi.fn(),
  },
  auditEvents: {
    DATA_CREATE: 'DATA_CREATE',
    DATA_UPDATE: 'DATA_UPDATE',
    DATA_DELETE: 'DATA_DELETE',
  },
}));

describe('AccountService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('getAccounts', () => {
    it('should return default account when no accounts exist', () => {
      const accounts = AccountService.getAccounts();

      expect(accounts).toHaveLength(1);
      expect(accounts[0].id).toBe(DEFAULTS.ACCOUNT_ID);
      expect(accounts[0].name).toBe(DEFAULTS.ACCOUNT_NAME);
      expect(accounts[0].type).toBe(DEFAULTS.ACCOUNT_TYPE);
      expect(accounts[0].isDefault).toBe(true);
    });

    it('should return existing accounts from localStorage', () => {
      const testAccounts = [
        {
          id: 'acc1',
          name: 'Test Account 1',
          type: 'checking',
          isDefault: true,
          timestamp: new Date().toISOString(),
        },
        {
          id: 'acc2',
          name: 'Test Account 2',
          type: 'savings',
          isDefault: false,
          timestamp: new Date().toISOString(),
        },
      ];

      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(testAccounts));
      const accounts = AccountService.getAccounts();

      expect(accounts).toHaveLength(2);
      expect(accounts[0].name).toBe('Test Account 1');
      expect(accounts[1].name).toBe('Test Account 2');
    });

    it('should handle corrupted localStorage data', async () => {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, 'invalid-json');

      // Re-import to get a fresh mock that throws for this test
      const { safeJsonParse } = await import('../../src/utils/security-utils.js');
      safeJsonParse.mockImplementationOnce(() => {
        throw new Error('Invalid JSON');
      });

      const accounts = AccountService.getAccounts();
      expect(accounts).toHaveLength(0);
    });
  });

  describe('saveAccount', () => {
    it('should save new account with required fields', () => {
      const newAccount = {
        id: 'new-acc',
        name: 'New Account',
        type: 'checking',
        isDefault: false,
      };

      const savedAccount = AccountService.saveAccount(newAccount);

      expect(savedAccount.id).toBe('new-acc');
      expect(savedAccount.timestamp).toBeDefined();
      expect(savedAccount.updatedAt).toBeDefined();
      expect(savedAccount.userId).toBe('test-user-123');

      const storedAccounts = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCOUNTS));
      expect(storedAccounts).toHaveLength(2); // Default + new account
    });

    it('should update existing account', () => {
      // First create an account
      const account = {
        id: 'test-acc',
        name: 'Original Name',
        type: 'checking',
        isDefault: false,
      };
      AccountService.saveAccount(account);

      // Update the account
      const updatedAccount = {
        id: 'test-acc',
        name: 'Updated Name',
        type: 'savings',
        isDefault: true,
      };
      const result = AccountService.saveAccount(updatedAccount);

      expect(result.name).toBe('Updated Name');
      expect(result.type).toBe('savings');
      expect(result.updatedAt).toBeDefined();

      const storedAccounts = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCOUNTS));
      const storedAccount = storedAccounts.find(acc => acc.id === 'test-acc');
      expect(storedAccount.name).toBe('Updated Name');
    });

    it('should throw error for missing account ID', () => {
      const invalidAccount = {
        name: 'Invalid Account',
        type: 'checking',
      };

      expect(() => AccountService.saveAccount(invalidAccount)).toThrow(
        'Account ID is required for saving.'
      );
    });

    it('should ensure only one default account', () => {
      const account1 = {
        id: 'acc1',
        name: 'Account 1',
        type: 'checking',
        isDefault: true,
      };
      const account2 = {
        id: 'acc2',
        name: 'Account 2',
        type: 'savings',
        isDefault: true,
      };

      AccountService.saveAccount(account1);
      AccountService.saveAccount(account2);

      const accounts = AccountService.getAccounts();
      const defaultAccounts = accounts.filter(acc => acc.isDefault);
      expect(defaultAccounts).toHaveLength(1);
      expect(defaultAccounts[0].id).toBe('acc2');
    });
  });

  describe('deleteAccount', () => {
    it('should delete account successfully', () => {
      // Create multiple accounts
      const account1 = { id: 'acc1', name: 'Account 1', type: 'checking', isDefault: false };
      const account2 = { id: 'acc2', name: 'Account 2', type: 'savings', isDefault: false };

      AccountService.saveAccount(account1);
      AccountService.saveAccount(account2);

      const result = AccountService.deleteAccount('acc1');
      expect(result).toBe(true);

      const accounts = AccountService.getAccounts();
      expect(accounts).toHaveLength(2); // Default + acc2
      expect(accounts.find(acc => acc.id === 'acc1')).toBeUndefined();
    });

    it('should prevent deleting the last account', () => {
      const accounts = AccountService.getAccounts();
      const lastAccountId = accounts[0].id;

      const result = AccountService.deleteAccount(lastAccountId);
      expect(result).toBe(false);

      const remainingAccounts = AccountService.getAccounts();
      expect(remainingAccounts).toHaveLength(1);
    });

    it('should ensure there is always a default account after deletion', () => {
      // Create accounts with one being default
      const account1 = { id: 'acc1', name: 'Account 1', type: 'checking', isDefault: true };
      const account2 = { id: 'acc2', name: 'Account 2', type: 'savings', isDefault: false };

      AccountService.saveAccount(account1);
      AccountService.saveAccount(account2);

      // Delete the default account (acc1)
      AccountService.deleteAccount('acc1');

      const accounts = AccountService.getAccounts();
      const defaultAccounts = accounts.filter(acc => acc.isDefault);
      expect(defaultAccounts).toHaveLength(1);

      // There should be exactly one default account after deletion
      expect(defaultAccounts[0]).toBeDefined();
    });
  });

  describe('getDefaultAccount', () => {
    it('should return the default account', () => {
      const account1 = { id: 'acc1', name: 'Account 1', type: 'checking', isDefault: false };
      const account2 = { id: 'acc2', name: 'Account 2', type: 'savings', isDefault: true };

      AccountService.saveAccount(account1);
      AccountService.saveAccount(account2);

      const defaultAccount = AccountService.getDefaultAccount();
      expect(defaultAccount.id).toBe('acc2');
      expect(defaultAccount.isDefault).toBe(true);
    });

    it('should return first account if no default is set', () => {
      const accounts = AccountService.getAccounts();
      const defaultAccount = AccountService.getDefaultAccount();

      expect(defaultAccount.id).toBe(accounts[0].id);
    });
  });

  describe('isAccountDuplicate', () => {
    it('should detect duplicate account names and types', () => {
      const account1 = { id: 'acc1', name: 'Test Account', type: 'checking', isDefault: false };

      AccountService.saveAccount(account1);

      const isDuplicate = AccountService.isAccountDuplicate('Test Account', 'checking');
      expect(isDuplicate).toBe(true);
    });

    it('should allow same name with different type', () => {
      const account1 = { id: 'acc1', name: 'Test Account', type: 'checking', isDefault: false };

      AccountService.saveAccount(account1);

      const isDuplicate = AccountService.isAccountDuplicate('Test Account', 'savings');
      expect(isDuplicate).toBe(false);
    });

    it('should exclude specified account from duplicate check', () => {
      const account1 = { id: 'acc1', name: 'Test Account', type: 'checking', isDefault: false };

      AccountService.saveAccount(account1);

      const isDuplicate = AccountService.isAccountDuplicate('Test Account', 'checking', 'acc1');
      expect(isDuplicate).toBe(false);
    });

    it('should be case insensitive for name comparison', () => {
      const account1 = { id: 'acc1', name: 'Test Account', type: 'checking', isDefault: false };

      AccountService.saveAccount(account1);

      const isDuplicate = AccountService.isAccountDuplicate('test account', 'checking');
      expect(isDuplicate).toBe(true);
    });
  });

  describe('private methods', () => {
    it('should clean duplicate accounts', () => {
      // Test the _cleanAccounts method directly
      const duplicatedAccounts = [
        { id: 'acc1', name: 'Account 1', type: 'checking' },
        { id: 'acc1', name: 'Account 1 Duplicate', type: 'checking' }, // Same ID
        { id: 'acc2', name: 'Account 2', type: 'savings' },
        { id: 'acc3', name: 'Account 2', type: 'savings' }, // Same name+type
      ];

      // Call the private method directly for testing
      const cleanedAccounts = AccountService._cleanAccounts(duplicatedAccounts);

      // Should remove duplicates, keeping only unique accounts
      expect(cleanedAccounts).toHaveLength(2);
      expect(cleanedAccounts.map(acc => acc.id)).toEqual(expect.arrayContaining(['acc1', 'acc2']));
    });
  });

  describe('audit logging', () => {
    it('should log account creation', async () => {
      const { auditService } = await import('../../src/core/audit-service.js');

      const newAccount = {
        id: 'new-acc',
        name: 'New Account',
        type: 'checking',
        isDefault: false,
      };

      AccountService.saveAccount(newAccount);

      expect(auditService.log).toHaveBeenCalledWith(
        'DATA_CREATE',
        expect.objectContaining({
          entityType: 'account',
          entityId: 'new-acc',
          operation: 'create',
        }),
        'test-user-123',
        'low'
      );
    });

    it('should log account update', async () => {
      const { auditService } = await import('../../src/core/audit-service.js');

      const account = {
        id: 'test-acc',
        name: 'Original Name',
        type: 'checking',
        isDefault: false,
      };
      AccountService.saveAccount(account);

      const updatedAccount = {
        ...account,
        name: 'Updated Name',
      };

      AccountService.saveAccount(updatedAccount);

      expect(auditService.log).toHaveBeenCalledWith(
        'DATA_UPDATE',
        expect.objectContaining({
          entityType: 'account',
          entityId: 'test-acc',
          operation: 'update',
        }),
        'test-user-123',
        'low'
      );
    });

    it('should log account deletion', async () => {
      const { auditService } = await import('../../src/core/audit-service.js');

      const account = {
        id: 'test-acc',
        name: 'Test Account',
        type: 'checking',
        isDefault: false,
      };
      AccountService.saveAccount(account);

      AccountService.deleteAccount('test-acc');

      expect(auditService.log).toHaveBeenCalledWith(
        'DATA_DELETE',
        expect.objectContaining({
          entityType: 'account',
          entityId: 'test-acc',
          accountName: 'Test Account',
          accountType: 'checking',
        }),
        'test-user-123',
        'medium'
      );
    });
  });

  describe('sync integration', () => {
    it('should call SyncService when persisting accounts', async () => {
      const { SyncService } = await import('../../src/core/sync-service.js');

      const account = {
        id: 'sync-acc',
        name: 'Sync Account',
        type: 'checking',
        isDefault: false,
      };

      AccountService.saveAccount(account);

      expect(SyncService.pushToCloud).toHaveBeenCalledWith(
        STORAGE_KEYS.ACCOUNTS,
        expect.any(Array)
      );
    });
  });
});
