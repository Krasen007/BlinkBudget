/**
 * Form validation utilities
 * Centralized validation logic for transaction forms
 */

import { COLORS, HAPTIC_PATTERNS, TIMING } from '../constants.js';

/**
 * Validate amount value
 * @param {string|number} value - Amount value to validate
 * @returns {Object} Validation result with valid flag and value/error
 */
export const validateAmount = (value) => {
    // Support both comma and dot by normalizing
    const normalized = String(value).replace(/,/g, '.');
    const amount = parseFloat(normalized);

    if (isNaN(amount) || amount === 0) {
        return {
            valid: false,
            error: 'Amount is required and must be greater than 0',
            value: null
        };
    }

    return {
        valid: true,
        value: Math.abs(amount),
        error: null
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
            error: 'Please select a category'
        };
    }

    return { valid: true, error: null };
};

/**
 * Validate transfer destination account
 * @param {string|null} toAccountId - Destination account ID
 * @returns {Object} Validation result
 */
export const validateTransferAccount = (toAccountId) => {
    if (!toAccountId || toAccountId.trim() === '') {
        return {
            valid: false,
            error: 'Please select a destination account'
        };
    }

    return { valid: true, error: null };
};

/**
 * Show validation error on a field
 * @param {HTMLElement} element - Element to show error on
 * @param {string} errorMessage - Error message (optional)
 */
export const showFieldError = (element, errorMessage = null) => {
    // Visual error feedback
    element.style.border = `1px solid ${COLORS.ERROR}`;

    // Auto-clear error after timeout
    setTimeout(() => {
        element.style.border = '1px solid var(--color-border)';
    }, TIMING.ANIMATION_NORMAL * 10); // 2 seconds

    // Haptic error feedback
    if (window.mobileUtils?.supportsHaptic()) {
        window.mobileUtils.hapticFeedback(HAPTIC_PATTERNS.ERROR);
    }

    // Focus the element
    if (element.focus) {
        element.focus();
    }
};

/**
 * Show validation error on container (for category selector)
 * @param {HTMLElement} container - Container to show error on
 */
export const showContainerError = (container) => {
    container.style.border = `1px solid ${COLORS.ERROR}`;

    setTimeout(() => {
        container.style.border = '1px solid var(--color-border)';
    }, TIMING.ANIMATION_NORMAL * 10);

    if (window.mobileUtils?.supportsHaptic()) {
        window.mobileUtils.hapticFeedback(HAPTIC_PATTERNS.ERROR);
    }
};

/**
 * Validate string length
 * @param {string} value - String to validate
 * @param {number} max - Maximum length
 * @param {string} fieldName - Field name for error message
 * @returns {Object} Validation result
 */
export const validateLength = (value, max, fieldName) => {
    if (value && value.length > max) {
        return {
            valid: false,
            error: `${fieldName} is too long (max ${max} characters)`
        };
    }
    return { valid: true, error: null };
};

/**
 * Validate complete transaction form
 * @param {Object} data - Transaction data
 * @returns {Object} Validation result with errors object
 */
export const validateTransactionForm = (data) => {
    const errors = {};

    // Validate amount
    const amountValidation = validateAmount(data.amount);
    if (!amountValidation.valid) {
        errors.amount = amountValidation.error;
    }

    // Validate category/transfer account
    if (data.type === 'transfer') {
        const transferValidation = validateTransferAccount(data.toAccountId);
        if (!transferValidation.valid) {
            errors.toAccountId = transferValidation.error;
        }
    } else {
        const categoryValidation = validateCategory(data.category, data.type);
        if (!categoryValidation.valid) {
            errors.category = categoryValidation.error;
        }
    }

    // Validate note length if present
    if (data.note) {
        const noteValidation = validateLength(data.note, 255, 'Note');
        if (!noteValidation.valid) {
            errors.note = noteValidation.error;
        }
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors
    };
};

