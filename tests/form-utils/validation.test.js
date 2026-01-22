/**
 * Form Validation Utilities - Unit Tests
 */

import {
  validateAmount,
  validateCategory,
  validateTransferAccount,
  validateTransactionForm,
  validateLength,
  showFieldError,
  showContainerError,
} from '../../src/utils/form-utils/validation.js';

// Mock mobileUtils for consistent testing
global.window = {
  mobileUtils: {
    supportsHaptic: () => true,
    hapticFeedback: vi.fn(),
  },
};

describe('Form Validation Utilities', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  describe('validateAmount', () => {
    test('validates positive numbers correctly', () => {
      const result = validateAmount('100');
      expect(result).toEqual({
        valid: true,
        value: 100,
        error: null,
      });
    });

    test('validates decimal numbers correctly', () => {
      const result = validateAmount('99.99');
      expect(result).toEqual({
        valid: true,
        value: 99.99,
        error: null,
      });
    });

    test('handles comma as decimal separator', () => {
      const result = validateAmount('99,99');
      expect(result).toEqual({
        valid: true,
        value: 99.99,
        error: null,
      });
    });

    test('converts negative numbers to positive', () => {
      const result = validateAmount('-50');
      expect(result).toEqual({
        valid: true,
        value: 50,
        error: null,
      });
    });

    test('rejects zero amount', () => {
      const result = validateAmount('0');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
      expect(result.value).toBe(null);
    });

    test('rejects empty string', () => {
      const result = validateAmount('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    test('rejects non-numeric strings', () => {
      const result = validateAmount('abc');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    test('rejects null and undefined', () => {
      expect(validateAmount(null).valid).toBe(false);
      expect(validateAmount(undefined).valid).toBe(false);
    });
  });

  describe('validateCategory', () => {
    test('accepts valid category for expense', () => {
      const result = validateCategory('Food', 'expense');
      expect(result).toEqual({ valid: true, error: null });
    });

    test('accepts valid category for income', () => {
      const result = validateCategory('Salary', 'income');
      expect(result).toEqual({ valid: true, error: null });
    });

    test('accepts valid category for refund', () => {
      const result = validateCategory('Food', 'refund');
      expect(result).toEqual({ valid: true, error: null });
    });

    test('accepts null category for transfer (not required)', () => {
      const result = validateCategory(null, 'transfer');
      expect(result).toEqual({ valid: true, error: null });
    });

    test('accepts empty category for transfer', () => {
      const result = validateCategory('', 'transfer');
      expect(result).toEqual({ valid: true, error: null });
    });

    test('rejects null category for expense', () => {
      const result = validateCategory(null, 'expense');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('select a category');
    });

    test('rejects empty category for income', () => {
      const result = validateCategory('', 'income');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('select a category');
    });

    test('rejects whitespace-only category', () => {
      const result = validateCategory('   ', 'expense');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateTransferAccount', () => {
    test('accepts valid account ID', () => {
      const result = validateTransferAccount('account-123');
      expect(result).toEqual({ valid: true, error: null });
    });

    test('rejects null account ID', () => {
      const result = validateTransferAccount(null);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('destination account');
    });

    test('rejects empty account ID', () => {
      const result = validateTransferAccount('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('destination account');
    });

    test('rejects whitespace-only account ID', () => {
      const result = validateTransferAccount('   ');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateLength', () => {
    test('accepts string within length limit', () => {
      const result = validateLength('Hello', 10, 'Test field');
      expect(result).toEqual({ valid: true, error: null });
    });

    test('accepts string at exact length limit', () => {
      const result = validateLength('Hello', 5, 'Test field');
      expect(result).toEqual({ valid: true, error: null });
    });

    test('rejects string over length limit', () => {
      const result = validateLength('Hello World', 5, 'Test field');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too long');
      expect(result.error).toContain('Test field');
      expect(result.error).toContain('max 5 characters');
    });

    test('accepts null or undefined values', () => {
      expect(validateLength(null, 10, 'Field').valid).toBe(true);
      expect(validateLength(undefined, 10, 'Field').valid).toBe(true);
    });
  });

  describe('validateTransactionForm', () => {
    test('validates complete expense transaction', () => {
      const data = {
        amount: '100',
        type: 'expense',
        category: 'Food',
      };

      const result = validateTransactionForm(data);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    test('validates complete income transaction', () => {
      const data = {
        amount: '500',
        type: 'income',
        category: 'Salary',
      };

      const result = validateTransactionForm(data);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    test('validates complete transfer transaction', () => {
      const data = {
        amount: '200',
        type: 'transfer',
        toAccountId: 'account-123',
      };

      const result = validateTransactionForm(data);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    test('validates transaction with note within length limit', () => {
      const data = {
        amount: '100',
        type: 'expense',
        category: 'Food',
        note: 'Valid note',
      };

      const result = validateTransactionForm(data);
      expect(result.valid).toBe(true);
    });

    test('rejects transaction with note over length limit', () => {
      const longNote = 'a'.repeat(256);
      const data = {
        amount: '100',
        type: 'expense',
        category: 'Food',
        note: longNote,
      };

      const result = validateTransactionForm(data);
      expect(result.valid).toBe(false);
      expect(result.errors.note).toContain('too long');
    });

    test('collects multiple validation errors', () => {
      const data = {
        amount: '0', // Invalid amount
        type: 'expense',
        category: '', // Invalid category
        note: 'a'.repeat(300), // Invalid note length
      };

      const result = validateTransactionForm(data);
      expect(result.valid).toBe(false);
      expect(result.errors.amount).toBeDefined();
      expect(result.errors.category).toBeDefined();
      expect(result.errors.note).toBeDefined();
    });

    test('validates transfer with missing destination account', () => {
      const data = {
        amount: '100',
        type: 'transfer',
        // Missing toAccountId
      };

      const result = validateTransactionForm(data);
      expect(result.valid).toBe(false);
      expect(result.errors.toAccountId).toBeDefined();
    });
  });

  describe('showFieldError', () => {
    test('applies error styling to element', () => {
      const mockElement = {
        style: {},
        focus: vi.fn(),
      };

      showFieldError(mockElement);

      expect(mockElement.style.border).toBe('1px solid #ef4444');
      expect(mockElement.focus).toHaveBeenCalled();
    });

    test('clears error styling after timeout', async () => {
      vi.useFakeTimers();
      const mockElement = {
        style: { border: '1px solid #ef4444' },
        focus: vi.fn(),
      };

      showFieldError(mockElement);

      // Fast-forward time (TIMING.ANIMATION_NORMAL * 10 = 3000ms)
      vi.advanceTimersByTime(3000);

      expect(mockElement.style.border).toBe('1px solid var(--color-border)');
      vi.useRealTimers();
    });
  });

  describe('showContainerError', () => {
    test('applies error styling to container', () => {
      const mockContainer = {
        style: {},
      };

      showContainerError(mockContainer);

      expect(mockContainer.style.border).toBe('1px solid #ef4444');
    });

    test('clears container error styling after timeout', async () => {
      vi.useFakeTimers();
      const mockContainer = {
        style: { border: '1px solid #ef4444' },
      };

      showContainerError(mockContainer);

      vi.advanceTimersByTime(3000);

      expect(mockContainer.style.border).toBe('1px solid var(--color-border)');
      vi.useRealTimers();
    });
  });
});
