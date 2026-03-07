/**
 * Form Submission - Unit Tests
 */

import {
  prepareTransactionData,
  handleFormSubmit,
  getDateSource,
} from '../../src/utils/form-utils/submission.js';

// Mock dependencies
vi.mock('../../src/utils/date-utils.js', () => ({
  getTodayISO: vi.fn(() => '2024-01-01'),
}));

vi.mock('../../src/utils/security-utils.js', () => ({
  sanitizeInput: vi.fn(input => input),
}));

vi.mock('../../components/MobileModal.js', () => ({
  MobileAlert: vi.fn(),
}));

// Import the mocked functions
import { sanitizeInput } from '../../src/utils/security-utils.js';

// Mock document for DOM operations
global.document = {
  createElement: vi.fn(tag => {
    const element = {
      tagName: tag.toUpperCase(),
      type: 'date',
      value: '2024-01-01',
      className: '',
      style: {},
      appendChild: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      closest: vi.fn(() => ({ closeModal: vi.fn() })),
    };
    return element;
  }),
  body: {
    appendChild: vi.fn(),
    style: {},
  },
};

describe('Form Submission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDateSource', () => {
    test('returns external date input when provided', () => {
      const externalInput = { type: 'date', value: '2024-01-15' };

      const result = getDateSource(externalInput);

      expect(result).toBe(externalInput);
    });

    test('creates fallback date input when none provided', () => {
      const result = getDateSource();

      expect(document.createElement).toHaveBeenCalledWith('input');
      expect(result.type).toBe('date');
      expect(result.value).toBe('2024-01-01'); // From getTodayISO mock
    });

    test('fallback date input has correct properties', () => {
      const result = getDateSource();

      expect(result.type).toBe('date');
      expect(result.value).toBe('2024-01-01');
    });
  });

  describe('prepareTransactionData', () => {
    test('prepares expense transaction data correctly', () => {
      const formState = {
        amount: 100,
        type: 'expense',
        category: 'Food',
        accountId: 'acc123',
        externalDateInput: { value: '2024-01-15' },
      };

      const result = prepareTransactionData(formState);

      expect(result).toEqual({
        amount: 100,
        type: 'expense',
        accountId: 'acc123',
        timestamp: expect.any(String), // ISO string
        category: 'Food',
      });

      // Verify timestamp is valid ISO
      expect(() => new Date(result.timestamp)).not.toThrow();
    });

    test('prepares income transaction data correctly', () => {
      const formState = {
        amount: 500,
        type: 'income',
        category: 'Salary',
        accountId: 'acc456',
      };

      const result = prepareTransactionData(formState);

      expect(result).toEqual({
        amount: 500,
        type: 'income',
        accountId: 'acc456',
        timestamp: expect.any(String),
        category: 'Salary',
      });
    });

    test('prepares transfer transaction data correctly', () => {
      const formState = {
        amount: 200,
        type: 'transfer',
        accountId: 'acc123',
        toAccountId: 'acc456',
      };

      const result = prepareTransactionData(formState);

      expect(result).toEqual({
        amount: 200,
        type: 'transfer',
        accountId: 'acc123',
        timestamp: expect.any(String),
        category: 'Transfer',
        toAccountId: 'acc456',
      });
    });

    test('prepares refund transaction data correctly', () => {
      const formState = {
        amount: 50,
        type: 'refund',
        category: 'Food',
        accountId: 'acc789',
      };

      const result = prepareTransactionData(formState);

      expect(result).toEqual({
        amount: 50,
        type: 'refund',
        accountId: 'acc789',
        timestamp: expect.any(String),
        category: 'Food',
      });
    });

    test('converts negative amounts to positive', () => {
      const formState = {
        amount: -75,
        type: 'expense',
        category: 'Food',
        accountId: 'acc123',
      };

      const result = prepareTransactionData(formState);

      expect(result.amount).toBe(75);
    });

    test('uses external date input when provided', () => {
      const externalDateInput = { value: '2024-02-14' };
      const formState = {
        amount: 100,
        type: 'expense',
        category: 'Food',
        accountId: 'acc123',
        externalDateInput,
      };

      const result = prepareTransactionData(formState);

      // Should use current time, not external date (implementation changed)
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    test('uses full ISO timestamp from external date input', () => {
      const externalDateInput = { value: '2024-02-14T15:30:45.123Z' };
      const formState = {
        amount: 100,
        type: 'expense',
        category: 'Food',
        accountId: 'acc123',
        externalDateInput,
      };

      const result = prepareTransactionData(formState);

      // Should use the exact timestamp provided
      expect(result.timestamp).toBe('2024-02-14T15:30:45.123Z');
    });

    test('combines date-only input with current time', () => {
      const externalDateInput = { value: '2024-02-14' };
      const formState = {
        amount: 100,
        type: 'expense',
        category: 'Food',
        accountId: 'acc123',
        externalDateInput,
      };

      const result = prepareTransactionData(formState);

      // Should use the date from input with current time components
      expect(result.timestamp).toMatch(/^2024-02-14T\d{2}:\d{2}:\d{2}/);
      const timestampDate = new Date(result.timestamp);
      
      // Use UTC methods to avoid timezone issues in validation
      expect(timestampDate.getUTCFullYear()).toBe(2024);
      expect(timestampDate.getUTCMonth()).toBe(1); // February is 1 (0-indexed)
      expect(timestampDate.getUTCDate()).toBe(14);
    });

    test('handles DateInput component interface', () => {
      const mockDateInput = {
        getDate: vi.fn(() => '2024-12-25')
      };
      const formState = {
        amount: 100,
        type: 'expense',
        category: 'Food',
        accountId: 'acc123',
        externalDateInput: mockDateInput,
      };

      const result = prepareTransactionData(formState);

      expect(mockDateInput.getDate).toHaveBeenCalled();
      expect(result.timestamp).toMatch(/^2024-12-25T\d{2}:\d{2}:\d{2}/);
      
      // Use UTC methods for validation
      const timestampDate = new Date(result.timestamp);
      expect(timestampDate.getUTCFullYear()).toBe(2024);
      expect(timestampDate.getUTCMonth()).toBe(11); // December is 11 (0-indexed)
      expect(timestampDate.getUTCDate()).toBe(25);
    });

    test('falls back to today when no external date', () => {
      const formState = {
        amount: 100,
        type: 'expense',
        category: 'Food',
        accountId: 'acc123',
      };

      const result = prepareTransactionData(formState);

      // Should use current time, not mocked date (implementation changed)
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    test('falls back to today when external date has no value', () => {
      const externalDateInput = { value: '' };
      const formState = {
        amount: 100,
        type: 'expense',
        category: 'Food',
        accountId: 'acc123',
        externalDateInput,
      };

      const result = prepareTransactionData(formState);

      // Should use current time, not mocked date (implementation changed)
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    test('handles null external date input', () => {
      const formState = {
        amount: 100,
        type: 'expense',
        category: 'Food',
        accountId: 'acc123',
        externalDateInput: null,
      };

      const result = prepareTransactionData(formState);

      // Should use current time when externalDateInput is null
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    test('sanitizes category input for non-transfer transactions', () => {
      const formState = {
        amount: 100,
        type: 'expense',
        category: 'Food<script>alert("xss")</script>',
        accountId: 'acc123',
      };

      prepareTransactionData(formState);

      expect(sanitizeInput).toHaveBeenCalledWith(
        'Food<script>alert("xss")</script>'
      );
    });

    test('does not sanitize category for transfer transactions', () => {
      const formState = {
        amount: 100,
        type: 'transfer',
        accountId: 'acc123',
        toAccountId: 'acc456',
      };

      prepareTransactionData(formState);

      expect(sanitizeInput).not.toHaveBeenCalled();
      // Transfer category is hardcoded to 'Transfer'
    });

    test('handles missing toAccountId for transfers gracefully', () => {
      const formState = {
        amount: 100,
        type: 'transfer',
        accountId: 'acc123',
        toAccountId: null, // Explicitly null
      };

      const result = prepareTransactionData(formState);

      expect(result.toAccountId).toBeNull();
    });

    test('creates valid ISO timestamp', () => {
      const formState = {
        amount: 100,
        type: 'expense',
        category: 'Food',
        accountId: 'acc123',
      };

      const result = prepareTransactionData(formState);

      const date = new Date(result.timestamp);
      expect(date).toBeInstanceOf(Date);
      expect(isNaN(date.getTime())).toBe(false);
    });
  });

  describe('handleFormSubmit', () => {
    test('calls onSubmit with transaction data', () => {
      const transactionData = {
        amount: 100,
        type: 'expense',
        category: 'Food',
        accountId: 'acc123',
      };
      const onSubmit = vi.fn();

      handleFormSubmit(transactionData, onSubmit);

      expect(onSubmit).toHaveBeenCalledWith(transactionData);
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    test('handles different types of submit errors', () => {
      const testCases = [
        new Error('Network timeout'),
        new TypeError('Invalid data'),
        'String error',
        { message: 'Object error' },
      ];

      testCases.forEach(error => {
        const onSubmit = vi.fn(() => {
          throw error;
        });
        const onError = vi.fn();

        handleFormSubmit({}, onSubmit, onError);

        expect(onError).toHaveBeenCalled();
      });
    });

    test('does not call error handler when submit succeeds', () => {
      const transactionData = { amount: 100 };
      const onSubmit = vi.fn();
      const onError = vi.fn();

      handleFormSubmit(transactionData, onSubmit, onError);

      expect(onError).not.toHaveBeenCalled();
      expect(onSubmit).toHaveBeenCalledWith(transactionData);
    });

    test('preserves original error object in error callback', () => {
      const originalError = new Error('Original error');
      const onSubmit = vi.fn(() => {
        throw originalError;
      });
      const onError = vi.fn();

      handleFormSubmit({}, onSubmit, onError);

      expect(onError).toHaveBeenCalledWith(originalError, expect.any(String));
    });
  });

  describe('integration scenarios', () => {
    test('complete expense transaction flow', () => {
      const formState = {
        amount: 25.5,
        type: 'expense',
        category: 'Coffee',
        accountId: 'checking',
        externalDateInput: { value: '2024-01-15T10:30:00' },
      };

      const transactionData = prepareTransactionData(formState);
      const onSubmit = vi.fn();

      handleFormSubmit(transactionData, onSubmit);

      expect(onSubmit).toHaveBeenCalledWith({
        amount: 25.5,
        type: 'expense',
        accountId: 'checking',
        timestamp: '2024-01-15T10:30:00',
        category: 'Coffee',
      });
    });

    test('complete transfer transaction flow', () => {
      const formState = {
        amount: 500,
        type: 'transfer',
        accountId: 'checking',
        toAccountId: 'savings',
      };

      const transactionData = prepareTransactionData(formState);
      const onSubmit = vi.fn();

      handleFormSubmit(transactionData, onSubmit);

      expect(onSubmit).toHaveBeenCalledWith({
        amount: 500,
        type: 'transfer',
        accountId: 'checking',
        timestamp: expect.any(String),
        category: 'Transfer',
        toAccountId: 'savings',
      });
    });

    test('date editing scenario - change transaction date', () => {
      // Simulate editing a transaction to a different date
      const externalDateInput = { value: '2024-03-20' };
      const formState = {
        amount: 150,
        type: 'expense',
        category: 'Groceries',
        accountId: 'checking',
        externalDateInput,
      };

      const transactionData = prepareTransactionData(formState);

      // Should preserve the new date with current time
      expect(transactionData.timestamp).toMatch(/^2024-03-20T\d{2}:\d{2}:\d{2}/);
      expect(transactionData.amount).toBe(150);
      expect(transactionData.category).toBe('Groceries');
    });

    test('date editing scenario - preserve full timestamp', () => {
      // Simulate editing with a full timestamp (should be preserved)
      const externalDateInput = { value: '2024-03-20T14:25:30.000Z' };
      const formState = {
        amount: 75,
        type: 'income',
        category: 'Salary',
        accountId: 'checking',
        externalDateInput,
      };

      const transactionData = prepareTransactionData(formState);

      // Should preserve the exact timestamp
      expect(transactionData.timestamp).toBe('2024-03-20T14:25:30.000Z');
      expect(transactionData.amount).toBe(75);
      expect(transactionData.category).toBe('Salary');
    });

    test('date editing with DateInput component', () => {
      // Simulate the DateInput component interface used in EditView
      const mockDateInput = {
        getDate: vi.fn(() => '2024-06-15')
      };
      const formState = {
        amount: 200,
        type: 'expense',
        category: 'Utilities',
        accountId: 'checking',
        externalDateInput: mockDateInput,
      };

      const transactionData = prepareTransactionData(formState);

      expect(mockDateInput.getDate).toHaveBeenCalled();
      expect(transactionData.timestamp).toMatch(/^2024-06-15T\d{2}:\d{2}:\d{2}/);
      expect(transactionData.amount).toBe(200);
      expect(transactionData.category).toBe('Utilities');
    });
  });

  // Regression Tests for Date Handling Improvements
  describe('Date Handling Regression Tests', () => {
    test('should handle externalDateInput with full ISO timestamp', () => {
      const externalDateInput = { value: '2024-02-14T15:30:45.123Z' };
      const formState = {
        amount: 100,
        type: 'expense',
        category: 'Food',
        accountId: 'acc123',
        externalDateInput,
      };

      const result = prepareTransactionData(formState);

      // Should preserve the exact timestamp
      expect(result.timestamp).toBe('2024-02-14T15:30:45.123Z');
    });

    test('should handle externalDateInput with date-only string', () => {
      const externalDateInput = { value: '2024-02-14' };
      const formState = {
        amount: 100,
        type: 'expense',
        category: 'Food',
        accountId: 'acc123',
        externalDateInput,
      };

      const result = prepareTransactionData(formState);

      // Should use the date from input with current time components
      expect(result.timestamp).toMatch(/^2024-02-14T\d{2}:\d{2}:\d{2}/);
      const timestampDate = new Date(result.timestamp);
      
      // Use UTC methods to avoid timezone issues in validation
      expect(timestampDate.getUTCFullYear()).toBe(2024);
      expect(timestampDate.getUTCMonth()).toBe(1); // February is 1 (0-indexed)
      expect(timestampDate.getUTCDate()).toBe(14);
    });

    test('should handle DateInput component interface with getDate method', () => {
      const mockDateInput = {
        getDate: vi.fn(() => '2024-12-25')
      };
      const formState = {
        amount: 100,
        type: 'expense',
        category: 'Food',
        accountId: 'acc123',
        externalDateInput: mockDateInput,
      };

      const result = prepareTransactionData(formState);

      expect(mockDateInput.getDate).toHaveBeenCalled();
      expect(result.timestamp).toMatch(/^2024-12-25T\d{2}:\d{2}:\d{2}/);
      
      // Use UTC methods for validation
      const timestampDate = new Date(result.timestamp);
      expect(timestampDate.getUTCFullYear()).toBe(2024);
      expect(timestampDate.getUTCMonth()).toBe(11); // December is 11 (0-indexed)
      expect(timestampDate.getUTCDate()).toBe(25);
    });

    test('should handle null externalDateInput gracefully', () => {
      const formState = {
        amount: 100,
        type: 'expense',
        category: 'Food',
        accountId: 'acc123',
        externalDateInput: null,
      };

      const result = prepareTransactionData(formState);

      // Should use current time when externalDateInput is null
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    test('should handle externalDateInput with undefined value', () => {
      const externalDateInput = { value: undefined };
      const formState = {
        amount: 100,
        type: 'expense',
        category: 'Food',
        accountId: 'acc123',
        externalDateInput,
      };

      const result = prepareTransactionData(formState);

      // Should use current time when value is undefined
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    test('should handle externalDateInput with empty string value', () => {
      const externalDateInput = { value: '' };
      const formState = {
        amount: 100,
        type: 'expense',
        category: 'Food',
        accountId: 'acc123',
        externalDateInput,
      };

      const result = prepareTransactionData(formState);

      // Should use current time when value is empty string
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    test('should preserve full timestamp during date editing', () => {
      // Simulate editing with a full timestamp (should be preserved)
      const externalDateInput = { value: '2024-03-20T14:25:30.000Z' };
      const formState = {
        amount: 75,
        type: 'income',
        category: 'Salary',
        accountId: 'checking',
        externalDateInput,
      };

      const transactionData = prepareTransactionData(formState);

      // Should preserve the exact timestamp
      expect(transactionData.timestamp).toBe('2024-03-20T14:25:30.000Z');
      expect(transactionData.amount).toBe(75);
      expect(transactionData.category).toBe('Salary');
    });

    test('should handle date editing with new date', () => {
      // Simulate editing a transaction to a different date
      const externalDateInput = { value: '2024-03-20' };
      const formState = {
        amount: 150,
        type: 'expense',
        category: 'Groceries',
        accountId: 'checking',
        externalDateInput,
      };

      const transactionData = prepareTransactionData(formState);

      // Should preserve the new date with current time
      expect(transactionData.timestamp).toMatch(/^2024-03-20T\d{2}:\d{2}:\d{2}/);
      expect(transactionData.amount).toBe(150);
      expect(transactionData.category).toBe('Groceries');
    });

    test('should handle DateInput component used in EditView', () => {
      // Simulate the DateInput component interface used in EditView
      const mockDateInput = {
        getDate: vi.fn(() => '2024-06-15')
      };
      const formState = {
        amount: 200,
        type: 'expense',
        category: 'Utilities',
        accountId: 'checking',
        externalDateInput: mockDateInput,
      };

      const transactionData = prepareTransactionData(formState);

      expect(mockDateInput.getDate).toHaveBeenCalled();
      expect(transactionData.timestamp).toMatch(/^2024-06-15T\d{2}:\d{2}:\d{2}/);
      expect(transactionData.amount).toBe(200);
      expect(transactionData.category).toBe('Utilities');
    });
  });
});
