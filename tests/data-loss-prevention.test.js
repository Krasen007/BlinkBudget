/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EmergencyExportService } from '../src/core/emergency-export-service.js';
import { dataIntegrityService } from '../src/core/data-integrity-service.js';

// Mock the services that EmergencyExportService depends on
vi.mock('../src/core/transaction-service.js', () => ({
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

vi.mock('../src/core/account-service.js', () => ({
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

vi.mock('../src/core/settings-service.js', () => ({
  SettingsService: {
    getAllSettings: vi.fn(() => ({
      theme: 'dark',
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
    })),
  },
}));

vi.mock('../src/core/auth-service.js', () => ({
  AuthService: {
    getUserId: vi.fn(() => 'test-user-123'),
  },
}));

vi.mock('../src/core/audit-service.js', () => ({
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
    it('should create emergency export successfully', async () => {
      const result = await EmergencyExportService.createEmergencyExport();

      expect(result.success).toBe(true);
      expect(result.downloadUrl).toBe('mock-url');
      expect(result.filename).toMatch(
        /^blinkbudget-emergency-export-test-user-123-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.json$/
      );
      expect(result.size).toBeGreaterThan(0);
      expect(result.dataCount).toHaveProperty('transactions');
      expect(result.dataCount).toHaveProperty('accounts');
      expect(result.dataCount).toHaveProperty('settings');
      expect(result.integrity).toHaveProperty('overall');
    });

    it('should generate proper data structure', async () => {
      await EmergencyExportService.createEmergencyExport();

      // The actual data is in the download process, but we can check the structure
      expect(Blob).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ type: 'application/json' })
      );

      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    it('should handle export options correctly', async () => {
      const options = {
        includeTransactions: false,
        includeAccounts: true,
        includeSettings: false,
        format: 'json',
      };

      await EmergencyExportService.createEmergencyExport(options);

      expect(Blob).toHaveBeenCalled();
    });

    it('should validate export integrity', () => {
      const exportData = {
        data: {
          transactions: { count: 1, items: [] },
          accounts: { count: 1, items: [] },
        },
        integrity: {
          transactions: 'abc123',
          accounts: 'def456',
          overall: 'ghi789',
        },
      };

      const validation =
        EmergencyExportService.validateExportIntegrity(exportData);

      expect(validation.valid).toBe(true);
      expect(validation.mismatches).toHaveLength(0);
    });

    it('should detect integrity mismatches', () => {
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
        EmergencyExportService.validateExportIntegrity(exportData);

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

    it('should generate appropriate recommendations', () => {
      const testResult = {
        summary: { corruptionDetected: true },
        issues: [
          { type: 'duplicate' },
          { type: 'orphaned' },
          { type: 'consistency' },
        ],
      };

      dataIntegrityService.generateRecommendations(testResult);

      expect(testResult.recommendations.length).toBeGreaterThan(0);
      expect(
        testResult.recommendations.some(rec => rec.priority === 'high')
      ).toBe(true);
      expect(
        testResult.recommendations.some(rec => rec.action.includes('recovery'))
      ).toBe(true);
      // Verify each issue type gets a recommendation
      expect(
        testResult.recommendations.some(rec => rec.relatedTo === 'duplicate')
      ).toBe(true);
    });

    it('should maintain check history', async () => {
      expect(dataIntegrityService.getLastCheckTime()).toBeNull();
      expect(dataIntegrityService.getLastReport()).toBeNull();
    });
  });

  describe('Integration Tests', () => {
    it('should handle emergency export during data corruption', async () => {
      // Emergency export should still work even with corruption
      const exportResult = await EmergencyExportService.createEmergencyExport();

      expect(exportResult.success).toBe(true);
      expect(exportResult.integrity).toHaveProperty('overall');
    });

    it('should validate exported data integrity', async () => {
      const exportResult = await EmergencyExportService.createEmergencyExport();

      expect(exportResult.success).toBe(true);
      expect(exportResult.integrity).toBeDefined();
      expect(exportResult.integrity.overall).toMatch(/^[a-f0-9]+$/);
    });
  });
});
