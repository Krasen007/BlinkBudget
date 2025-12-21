/**
 * Amount input factory
 * Creates mobile-optimized amount input with validation
 */

import { FONT_SIZES, TIMING } from '../constants.js';

/**
 * Create an amount input element with mobile optimizations
 * @param {Object} options - Input configuration
 * @param {string|number} options.initialValue - Initial amount value
 * @param {HTMLInputElement} options.externalDateInput - External date input for submission
 * @returns {Object} Input element and utility methods
 */
export const createAmountInput = (options = {}) => {
    const {
        initialValue = '',
        externalDateInput = null
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
    input.pattern = '[0-9]*[.,]?[0-9]*'; // Allow both dot and comma

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
        // Support both comma and dot
        const normalized = input.value.replace(/,/g, '.');
        const value = parseFloat(normalized);
        return isNaN(value) ? null : value;
    };

    /**
     * Set the input value
     * @param {string|number} value - Value to set
     */
    const setValue = (value) => {
        input.value = value || '';
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
                error: 'Amount is required and must be greater than 0'
            };
        }
        return {
            valid: true,
            value: Math.abs(value)
        };
    };

    /**
     * Get date source for submission
     * @returns {HTMLInputElement} Date input element
     */
    const getDateSource = () => {
        return externalDateInput || (() => {
            const fallback = document.createElement('input');
            fallback.type = 'date';
            fallback.value = new Date().toISOString().split('T')[0];
            return fallback;
        })();
    };

    return {
        input,
        getValue,
        setValue,
        validate,
        getDateSource
    };
};

