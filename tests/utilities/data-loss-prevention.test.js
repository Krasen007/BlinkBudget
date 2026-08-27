/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BackupService } from '../../src/core/backup-service.js';
import { dataIntegrityService } from '../../src/core/data-integrity-service.js';

// Firebase and storage-layer dependencies of BackupService
vi.mock('../../src/core/firebase-config.js', () => ({
  getDb: vi.fn(() => ({})),
}));
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
}));
vi.mock('../../src/core/Account/account-service.js', () => ({
  AccountService: {
    getAccounts: vi.fn(() => []),
    getDefaultAccount: vi.fn(() => null),
    clear: vi.fn(),
    batchSet: vi.fn(),
  },
}));
vi.mock('../../src/core/goal-planner.js', () => ({
  goalPlanner: {
    getAllGoals: vi.fn(() => []),
    clearAllGoals: vi.fn(),
    batchSetGoals: vi.fn(),
  },
  GoalPlanner: class {
    goals = [];
    getAllGoals() {
      return this.goals;
    }
    clearAllGoals() {}
    batchSetGoals(list) {
      this.goals = list || [];
    }
  },
}));
vi.mock('../../src/core/sync-service.js', () => ({
  SyncService: {
    startRealtimeSync: vi.fn(),
    stopSync: vi.fn(),
    pushToCloudSafe: vi.fn(),
    getStatus: vi.fn(() => ({})),
  },
}));
vi.mock('../../src/core/investment-tracker.js', () => ({
  investmentTracker: {
    getAllInvestments: vi.fn(() => []),
    clearAllInvestments: vi.fn(),
    batchSetInvestments: vi.fn(),
  },
  InvestmentTracker: class {
    investments = [];
    getAllInvestments() {
      return this.investments;
    }
    clearAllInvestments() {}
    batchSetInvestments(list) {
      this.investments = list || [];
    }
  },
}));
vi.mock('../../src/core/budget-service.js', () => ({
  BudgetService: { getAll: vi.fn(() => []) },
}));

// Mock the services that BackupService depends on
vi.mock('../../src/core/transaction-service.js', () => ({
  TransactionService: {
    getAll: vi.fn(() => [
      {
        id: 'tx1',
        amount: 100,
        category: 'Food',
        date: '2024-01-15',
        type: 'expense',
        description: 'Test transaction',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      },
    ]),
  },
}));

vi.mock('../../src/core/account-service.js', () => ({
  AccountService: {
    getAccounts: vi.fn(() => [
      {
        id: 'acc1',
        name: 'Test Account',
        type: 'checking',
        balance: 1000,
        currency: 'USD',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ]),
  },
}));

vi.mock('../../src/core/settings-service.js', () => ({
  SettingsService: {
    getAllSettings: vi.fn(() => ({
      theme: 'dark',
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
    })),
  },
}));

vi.mock('../../src/core/auth-service.js', () => ({
  AuthService: {
    getUserId: vi.fn(() => 'test-user-123'),
  },
}));

vi.mock('../../src/core/audit-service.js', () => ({
  auditService: {
    log: vi.fn(),
  },
  auditEvents: {
    DATA_EXPORT: 'data_export',
    DATA_INTEGRITY_CHECK: 'data_integrity_check',
  },
}));

// Mock URL.createObjectURL and download
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock Blob
global.Blob = vi.fn((content, options) => ({
  content,
  type: options.type,
}));

describe('Week 2: Data Loss Prevention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock document methods
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();

    // Mock createElement
    const mockElement = {
      href: '',
      download: '',
      click: vi.fn(),
      style: {},
      appendChild: vi.fn(),
    };
    global.document.createElement = vi.fn(() => mockElement);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Emergency Export Service', () => {
    it('should detect integrity mismatches', async () => {
      const exportData = {
        data: {
          transactions: { count: 1, items: [] },
          accounts: { count: 1, items: [] },
        },
        integrity: {
          transactions: 'wrong-hash',
          accounts: 'def456',
          overall: 'ghi789',
        },
      };

      const validation =
        await BackupService.validateExportIntegrity(exportData);

      expect(validation.valid).toBe(false);
      expect(validation.mismatches).toContain('transactions');
    });
  });

  describe('Data Integrity Service', () => {
    it('should perform basic integrity check structure', async () => {
      // Test the service structure and basic functionality
      expect(dataIntegrityService).toHaveProperty('performIntegrityCheck');
      expect(dataIntegrityService).toHaveProperty('validateTransaction');
      expect(dataIntegrityService).toHaveProperty('validateAccount');
      expect(typeof dataIntegrityService.performIntegrityCheck).toBe(
        'function'
      );
    });

    it('should validate transaction structure correctly', () => {
      const validTransaction = {
        id: 'tx1',
        amount: 100,
        category: 'Food',
        date: '2024-01-15',
        type: 'expense',
        description: 'Test transaction',
      };

      const issues = dataIntegrityService.validateTransaction(validTransaction);
      expect(issues).toHaveLength(0);
    });

    it('should detect invalid transaction structure', () => {
      const invalidTransaction = {
        id: '', // Invalid
        amount: -100, // Invalid
        category: '', // Invalid
        date: 'invalid-date', // Invalid
        type: 'invalid-type', // Invalid
        description: '', // Invalid
      };

      const issues =
        dataIntegrityService.validateTransaction(invalidTransaction);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.some(issue => issue.includes('Missing'))).toBe(true);
    });

    it('should validate account structure correctly', () => {
      const validAccount = {
        id: 'acc1',
        name: 'Test Account',
        type: 'checking',
        balance: 1000,
      };

      const issues = dataIntegrityService.validateAccount(validAccount);
      expect(issues).toHaveLength(0);
    });

    it('should detect invalid account structure', () => {
      const invalidAccount = {
        id: '', // Invalid
        name: '', // Invalid
        type: 'invalid-type', // Invalid
        balance: NaN, // Invalid
      };

      const issues = dataIntegrityService.validateAccount(invalidAccount);
      expect(issues.length).toBeGreaterThan(0);
    });

    it('should maintain check history', async () => {
      expect(dataIntegrityService.getLastCheckTime()).toBeNull();
      expect(dataIntegrityService.getLastReport()).toBeNull();
    });
  });
});
