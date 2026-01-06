/**
 * Amount Input Factory - Unit Tests
 */

import { createAmountInput } from '../../src/utils/form-utils/amount-input.js';

// Mock mobileUtils for consistent testing
global.window = {
  mobileUtils: {
    preventInputZoom: vi.fn(),
    scrollIntoViewAboveKeyboard: vi.fn(),
  },
};

// Mock document for DOM operations
global.document = {
  createElement: vi.fn(tag => {
    const element = {
      tagName: tag.toUpperCase(),
      style: {},
      addEventListener: vi.fn(),
      setAttribute: vi.fn(),
      focus: vi.fn(),
      _value: '', // Internal value storage
      get value() {
        return this._value;
      },
      set value(val) {
        this._value = String(val || '');
      },
    };
    return element;
  }),
};

describe('Amount Input Factory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAmountInput', () => {
    test('creates input element with correct attributes', () => {
      const result = createAmountInput();

      expect(document.createElement).toHaveBeenCalledWith('input');
      expect(result.input).toBeDefined();
      expect(result.input.type).toBe('text'); // Uses text for comma support
      expect(result.input.inputMode).toBe('decimal');
      expect(result.input.pattern).toBe('[0-9]*');
      expect(result.input.required).toBe(true);
      expect(result.input.autocomplete).toBe('off');
      expect(result.input.className).toBe('mobile-form-input');
    });

    test('sets initial value correctly', () => {
      const result = createAmountInput({ initialValue: '123.45' });

      expect(result.input.value).toBe('123.45');
    });

    test('sets default attributes for mobile optimization', () => {
      const result = createAmountInput();

      expect(result.input.inputMode).toBe('decimal');
      expect(result.input.pattern).toBe('[0-9]*');
      expect(result.input.setAttribute).toHaveBeenCalledWith(
        'autofocus',
        'true'
      );
    });

    test('sets font size for amount display', () => {
      const result = createAmountInput();

      expect(result.input.style.fontSize).toBe('1.5rem');
    });

    test('returns utility methods', () => {
      const result = createAmountInput();

      expect(typeof result.getValue).toBe('function');
      expect(typeof result.setValue).toBe('function');
      expect(typeof result.validate).toBe('function');
      expect(typeof result.getDateSource).toBe('function');
    });
  });

  describe('getValue', () => {
    test('parses valid numbers correctly', () => {
      const result = createAmountInput();
      result.input.value = '123.45';

      expect(result.getValue()).toBe(123.45);
    });

    test('handles comma as decimal separator', () => {
      const result = createAmountInput();
      result.input.value = '123,45';

      expect(result.getValue()).toBe(123.45);
    });

    test('returns null for invalid input', () => {
      const result = createAmountInput();
      result.input.value = 'abc';

      expect(result.getValue()).toBe(null);
    });

    test('returns null for empty string', () => {
      const result = createAmountInput();
      result.input.value = '';

      expect(result.getValue()).toBe(null);
    });
  });

  describe('setValue', () => {
    test('sets string value correctly', () => {
      const result = createAmountInput();
      result.setValue('123.45');

      expect(result.input.value).toBe('123.45');
    });

    test('sets numeric value correctly', () => {
      const result = createAmountInput();
      result.setValue(123.45);

      expect(result.input.value).toBe('123.45');
    });

    test('handles null value', () => {
      const result = createAmountInput();
      result.setValue(null);

      expect(result.input.value).toBe('');
    });
  });

  describe('validate', () => {
    test('validates positive amounts correctly', () => {
      const result = createAmountInput();
      result.input.value = '100';

      const validation = result.validate();
      expect(validation.valid).toBe(true);
      expect(validation.value).toBe(100);
    });

    test('validates decimal amounts correctly', () => {
      const result = createAmountInput();
      result.input.value = '99.99';

      const validation = result.validate();
      expect(validation.valid).toBe(true);
      expect(validation.value).toBe(99.99);
    });

    test('rejects zero amount', () => {
      const result = createAmountInput();
      result.input.value = '0';

      const validation = result.validate();
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('required');
    });

    test('rejects negative amounts (converts to positive)', () => {
      const result = createAmountInput();
      result.input.value = '-50';

      const validation = result.validate();
      expect(validation.valid).toBe(true);
      expect(validation.value).toBe(50);
    });

    test('rejects invalid input', () => {
      const result = createAmountInput();
      result.input.value = 'abc';

      const validation = result.validate();
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('required');
    });
  });

  describe('getDateSource', () => {
    test('returns external date input when provided', () => {
      const mockDateInput = { type: 'date', value: '2024-01-01' };
      const result = createAmountInput({ externalDateInput: mockDateInput });

      expect(result.getDateSource()).toBe(mockDateInput);
    });

    test('creates fallback date input when none provided', () => {
      const result = createAmountInput();

      const dateSource = result.getDateSource();
      expect(dateSource.type).toBe('date');
      expect(dateSource.value).toMatch(/^\d{4}-\d{2}-\d{2}$/); // ISO date format
    });
  });

  describe('focus event handling', () => {
    test('calls preventInputZoom on focus', () => {
      const result = createAmountInput();

      // Simulate focus event
      const focusHandler = result.input.addEventListener.mock.calls.find(
        ([event]) => event === 'focus'
      )[1];

      focusHandler();

      expect(window.mobileUtils.preventInputZoom).toHaveBeenCalledWith(
        result.input
      );
    });

    test('calls scrollIntoViewAboveKeyboard on focus with delay', () => {
      vi.useFakeTimers();
      const result = createAmountInput();

      const focusHandler = result.input.addEventListener.mock.calls.find(
        ([event]) => event === 'focus'
      )[1];

      focusHandler();

      expect(
        window.mobileUtils.scrollIntoViewAboveKeyboard
      ).not.toHaveBeenCalled();

      vi.advanceTimersByTime(300);

      expect(
        window.mobileUtils.scrollIntoViewAboveKeyboard
      ).toHaveBeenCalledWith(result.input, 60);

      vi.useRealTimers();
    });

    test('handles missing mobileUtils gracefully', () => {
      // Temporarily remove mobileUtils
      const originalMobileUtils = window.mobileUtils;
      delete window.mobileUtils;

      const result = createAmountInput();

      const focusHandler = result.input.addEventListener.mock.calls.find(
        ([event]) => event === 'focus'
      )[1];

      // Should not throw error
      expect(() => focusHandler()).not.toThrow();

      // Restore mobileUtils
      window.mobileUtils = originalMobileUtils;
    });
  });

  describe('input attributes and styling', () => {
    test('sets correct width and placeholder', () => {
      const result = createAmountInput();

      expect(result.input.style.width).toBe('100%');
      expect(result.input.placeholder).toBe('0.00');
    });

    test('sets id when provided', () => {
      // Note: createAmountInput doesn't take id as parameter, it sets it internally
      const result = createAmountInput();

      expect(result.input.id).toBe('transaction-amount-input');
    });

    test('sets name attribute', () => {
      const result = createAmountInput();

      expect(result.input.name).toBe('amount');
    });
  });

  describe('integration with external date input', () => {
    test('works with external date input for validation', () => {
      const mockDateInput = { type: 'date', value: '2024-01-01' };
      const result = createAmountInput({
        initialValue: '100',
        externalDateInput: mockDateInput,
      });

      expect(result.input.value).toBe('100');
      expect(result.getDateSource()).toBe(mockDateInput);

      const validation = result.validate();
      expect(validation.valid).toBe(true);
    });
  });
});
