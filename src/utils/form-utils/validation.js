/**
 * Form validation utilities
 * Centralized validation logic for transaction forms
 */

import { COLORS, TIMING } from '../constants.js';

/**
 * Validate amount value
 * @param {string|number} value - Amount value to validate
 * @returns {Object} Validation result with valid flag and value/error
 */
export const validateAmount = value => {
  // Support both comma and dot by normalizing
  const normalized = String(value).replace(/,/g, '.');
  const amount = parseFloat(normalized);

  if (isNaN(amount) || amount === 0) {
    return {
      valid: false,
      error: 'Amount is required and must be greater than 0',
      value: null,
    };
  }

  return {
    valid: true,
    value: Math.abs(amount),
    error: null,
  };
};

/**
 * Validate category selection
 * @param {string|null} category - Selected category
 * @param {string} type - Transaction type
 * @returns {Object} Validation result
 */
export const validateCategory = (category, type) => {
  if (type === 'transfer') {
    // Transfers don't require category (they use toAccountId)
    return { valid: true, error: null };
  }

  if (!category || category.trim() === '') {
    return {
      valid: false,
      error: 'Please select a category',
    };
  }

  return { valid: true, error: null };
};

/**
 * Validate transfer destination account
 * @param {string|null} toAccountId - Destination account ID
 * @returns {Object} Validation result
 */
export const validateTransferAccount = toAccountId => {
  if (!toAccountId || toAccountId.trim() === '') {
    return {
      valid: false,
      error: 'Please select a destination account',
    };
  }

  return { valid: true, error: null };
};

/**
 * Validate string length
 * @param {string|null|undefined} value - Value to validate
 * @param {number} maxLength - Maximum allowed length
 * @param {string} fieldName - Field name for error message
 * @returns {Object} Validation result with valid flag and error
 */
export const validateLength = (value, maxLength, fieldName = 'Field') => {
  if (value === null || value === undefined) {
    return { valid: true, error: null };
  }

  const str = String(value);
  if (str.length <= maxLength) {
    return { valid: true, error: null };
  }

  return {
    valid: false,
    error: `${fieldName} is too long (max ${maxLength} characters)`,
  };
};

/**
 * Show validation error on a field
 * @param {HTMLElement} element - Element to show error on
 * @param {string} errorMessage - Error message (optional)
 */
export const showFieldError = (element, _errorMessage = null) => {
  // Visual error feedback
  element.style.border = `1px solid ${COLORS.ERROR}`;

  // Auto-clear error after timeout
  setTimeout(() => {
    element.style.border = `1px solid ${COLORS.BORDER}`;
  }, TIMING.ANIMATION_NORMAL * 10); // 2 seconds

  // Focus the element
  if (element.focus) {
    element.focus();
  }
};

/**
 * Show validation error on container (for category selector)
 * @param {HTMLElement} container - Container to show error on
 */
export const showContainerError = container => {
  container.style.border = `1px solid ${COLORS.ERROR}`;

  setTimeout(() => {
    container.style.border = `1px solid ${COLORS.BORDER}`;
  }, TIMING.ANIMATION_NORMAL * 10);
};
