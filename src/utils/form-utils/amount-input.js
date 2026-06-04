/**
 * Amount input factory
 * Creates mobile-optimized amount input with validation
 */

import { FONT_SIZES, TIMING } from '../constants.js';
import { ClickTracker } from '../../core/click-tracking-service.js';

/**
 * Create an amount input element with mobile optimizations
 * @param {Object} options - Input configuration
 * @param {string|number} options.initialValue - Initial amount value
 * @param {HTMLInputElement} options.externalDateInput - External date input for submission
 * @param {Function} options.onMinusSign - Callback fired when user types a minus sign (for auto-switching to refund)
 * @returns {Object} Input element and utility methods
 */
export const createAmountInput = (options = {}) => {
  const {
    initialValue = '',
    externalDateInput = null,
    onMinusSign = null,
  } = options;

  const input = document.createElement('input');
  input.id = 'transaction-amount-input';
  input.name = 'amount';
  input.type = 'text'; // Use text allow both comma and dot
  input.value = initialValue || '';
  // input.step = '0.01'; // Not needed for text input
  input.required = true;
  input.autocomplete = 'off';

  input.placeholder = '0.00';
  input.className = 'mobile-form-input';
  input.style.width = '100%';
  input.style.fontSize = FONT_SIZES.AMOUNT_INPUT; // 1.5rem

  // Mobile-specific optimizations
  input.inputMode = 'decimal'; // Show numeric keypad on mobile
  input.pattern = '[0-9]*'; // Fallback for older devices to trigger numpad
  input.setAttribute('autofocus', 'true'); // Hint to browser related to focus

  let lastHadMinus =
    (initialValue && String(initialValue).startsWith('-')) || false;

  // Prevent non-numeric input
  input.addEventListener('keydown', e => {
    // Minus sign: allow it to appear in the field and switch type to refund.
    // The minus is stripped on getValue()/validate() since refund amounts are positive.
    if (e.key === '-' || e.key === 'Subtract') {
      // Only allow minus as the first character (prefix indicator)
      if (input.selectionStart === 0 && !input.value.startsWith('-')) {
        // Let the character through. The input event listener below will handle triggering onMinusSign.
      } else {
        // Prevent additional minus signs mid-value
        e.preventDefault();
      }
      return;
    }

    // Allow: backspace, delete, tab, escape, enter, decimal point, numbers, comma
    const allowedKeys = [
      'Backspace',
      'Delete',
      'Tab',
      'Escape',
      'Enter',
      'Esc',
      'Decimal',
      '.',
      ',',
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
    ];

    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X (and Cmd on Mac)
    if (
      (e.ctrlKey || e.metaKey) &&
      ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())
    ) {
      return;
    }

    if (!allowedKeys.includes(e.key) && !/^[0-9.,]$/.test(e.key)) {
      e.preventDefault();
    }
  });

  // Handle mobile-friendly input and minus detection
  input.addEventListener('input', () => {
    const val = input.value;

    // Check if there are any minus signs (and sanitize mid-value minus if any got through)
    if (val.includes('-')) {
      const hasLeadingMinus = val.startsWith('-');
      const cleanDigits = val.replace(/-/g, '');
      const cleanedVal = hasLeadingMinus ? `-${cleanDigits}` : cleanDigits;

      if (val !== cleanedVal) {
        const start = input.selectionStart;
        const end = input.selectionEnd;
        input.value = cleanedVal;
        input.setSelectionRange(start, end);
      }
    }

    const hasMinus = input.value.startsWith('-');
    if (hasMinus && !lastHadMinus) {
      if (onMinusSign) {
        onMinusSign();
      }
    }
    lastHadMinus = hasMinus;
  });

  // Sanitize paste input
  input.addEventListener('paste', e => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text');

    // Allow digits, dots, commas, and a leading minus sign
    if (!text) return;

    const sanitized = text.replace(/[^0-9.,-]/g, '');

    // Only allow minus as a leading character
    const hasLeadingMinus = sanitized.startsWith('-');
    const digits = sanitized.replace(/-/g, '');
    const finalValue = hasLeadingMinus ? `-${digits}` : digits;

    const start = input.selectionStart;
    const end = input.selectionEnd;
    const currentValue = input.value;

    const newValue =
      currentValue.substring(0, start) +
      finalValue +
      currentValue.substring(end);

    input.value = newValue;
    lastHadMinus = newValue.startsWith('-');

    // If pasted value starts with minus, trigger the refund switch
    if (hasLeadingMinus && onMinusSign) {
      setTimeout(() => onMinusSign(), 0);
    }

    // Restore cursor
    const newCursorPos = start + finalValue.length;
    input.setSelectionRange(newCursorPos, newCursorPos);
  });

  // Track clicks on amount input
  input.addEventListener('click', () => {
    ClickTracker.recordClick();
  });

  // Keyboard-aware viewport adjustments
  input.addEventListener('focus', () => {
    // Prevent zoom on input focus
    if (window.mobileUtils) {
      window.mobileUtils.preventInputZoom(input);

      // Scroll input into view above keyboard with delay for keyboard animation
      setTimeout(() => {
        window.mobileUtils.scrollIntoViewAboveKeyboard(input, 60);
      }, TIMING.KEYBOARD_DELAY);
    }
  });

  /**
   * Get the current value as a number
   * @returns {number|null} Parsed amount or null if invalid
   */
  const getValue = () => {
    // Support both comma and dot; strip leading minus (used as refund indicator)
    const normalized = input.value.replace(/^-/, '').replace(/,/g, '.');
    const value = parseFloat(normalized);
    return isNaN(value) ? null : value;
  };

  /**
   * Set the input value
   * @param {string|number} value - Value to set
   */
  const setValue = value => {
    input.value = value || '';
    lastHadMinus = (value && String(value).startsWith('-')) || false;
  };

  /**
   * Validate the current input value
   * @returns {Object} Validation result
   */
  const validate = () => {
    const value = getValue();
    if (value === null || value === 0) {
      return {
        valid: false,
        error: 'Amount is required and must be greater than 0',
      };
    }
    return {
      valid: true,
      value: Math.abs(value),
    };
  };

  /**
   * Get date source for submission
   * @returns {HTMLInputElement} Date input element
   */
  const getDateSource = () => {
    const source =
      externalDateInput ||
      (() => {
        const fallback = document.createElement('input');
        fallback.type = 'date';
        fallback.value = new Date().toISOString().split('T')[0];
        return fallback;
      })();

    if (source.getDate) {
      return {
        get value() {
          return source.getDate();
        },
      };
    }
    return source;
  };

  return {
    input,
    getValue,
    setValue,
    validate,
    getDateSource,
  };
};
