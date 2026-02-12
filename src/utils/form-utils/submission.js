/**
 * Form submission utilities
 * Handles transaction data preparation and submission
 */

import { getTodayISO } from '../date-utils.js';
import { sanitizeInput } from '../security-utils.js';

/**
 * Get date source for transaction timestamp
 * @param {HTMLInputElement|null} externalDateInput - External date input
 * @returns {HTMLInputElement} Date input element with value
 */
export const getDateSource = (externalDateInput = null) => {
  if (externalDateInput) {
    if (externalDateInput.getDate) {
      // Handle DateInput component interface
      // We create a dummy input-like object that has a value property getter
      return {
        get value() {
          return externalDateInput.getDate();
        },
      };
    }
    return externalDateInput;
  }

  // Create fallback date input with today's date
  const fallback = document.createElement('input');
  fallback.type = 'date';
  fallback.value = getTodayISO();
  return fallback;
};

/**
 * Prepare transaction data for submission
 * @param {Object} formState - Current form state
 * @param {number} amount - Transaction amount
 * @param {string} type - Transaction type
 * @param {string} category - Category (or null for transfers)
 * @param {string} accountId - Source account ID
 * @param {string|null} toAccountId - Destination account ID (for transfers)
 * @param {HTMLInputElement|null} externalDateInput - External date input
 * @param {string} description - Transaction description/notes (optional)
 * @returns {Object} Prepared transaction data
 */
export const prepareTransactionData = formState => {
  const {
    amount,
    type,
    category,
    accountId,
    toAccountId = null,
    externalDateInput = null,
    description = '',
  } = formState;

  const dateSource = getDateSource(externalDateInput);
  const dateValue = dateSource.value || getTodayISO();

  const transactionData = {
    amount: Math.abs(amount),
    type,
    accountId,
    timestamp: new Date(dateValue).toISOString(),
  };

  if (type === 'transfer') {
    transactionData.category = 'Transfer';
    transactionData.toAccountId = toAccountId;
  } else {
    transactionData.category = sanitizeInput(category || '');
  }

  // Add description/notes field if provided
  if (description && description.trim()) {
    transactionData.description = sanitizeInput(description.trim());
  }

  return transactionData;
};

/**
 * Handle form submission with error handling
 * @param {Object} transactionData - Prepared transaction data
 * @param {Function} onSubmit - Submit callback
 * @param {Function} onError - Error callback (optional)
 */
export const handleFormSubmit = (transactionData, onSubmit, onError = null) => {
  try {
    onSubmit(transactionData);
  } catch (e) {
    console.error('Submit failed:', e);
    const errorMessage = `Error submitting transaction: ${e.message}`;

    if (onError) {
      onError(e, errorMessage);
    } else {
      // Import toast notifications dynamically to avoid circular dependencies
      import('../toast-notifications.js')
        .then(({ showErrorToast }) => {
          showErrorToast(errorMessage, {
            duration: 5000,
            persistent: false,
          });
        })
        .catch(importErr => {
          console.error('Failed to load toast notifications:', importErr);
          // Fallback: show error using browser alert as last resort
          console.error('Original error:', errorMessage);
          // Create a simple DOM-based error message as fallback
          const fallbackDiv = document.createElement('div');
          fallbackDiv.setAttribute('role', 'alert');
          fallbackDiv.setAttribute('aria-live', 'assertive');
          fallbackDiv.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #ef4444;
          color: white;
          padding: 12px 16px;
          border-radius: 6px;
          z-index: 10000;
          max-width: 300px;
        `;
          fallbackDiv.textContent = errorMessage;
          document.body.appendChild(fallbackDiv);
          setTimeout(() => {
            if (fallbackDiv.parentNode) {
              fallbackDiv.parentNode.removeChild(fallbackDiv);
            }
          }, 5000);
        });
    }
  }
};
