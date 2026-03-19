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
 * @param {Object} formState - Form state object containing:
 *   @property {number} formState.amount - Transaction amount
 *   @property {string} formState.type - Transaction type
 *   @property {string} formState.category - Category (or null for transfers)
 *   @property {string} formState.accountId - Source account ID
 *   @property {string|null} formState.toAccountId - Destination account ID (for transfers)
 *   @property {string} [formState.description] - Transaction description/notes (optional)
 *   @property {HTMLInputElement|null} [formState.externalDateInput] - External date input element (optional)
 * @returns {Object} Prepared transaction data
 */
export const prepareTransactionData = formState => {
  const {
    amount,
    type,
    category,
    accountId,
    toAccountId = null,
    description = '',
    externalDateInput = null,
  } = formState;

  // Get date source - use external date input if provided, otherwise current time
  const dateSource = getDateSource(externalDateInput);
  let timestamp;

  const preserveTimeFromExistingTimestamp = selectedDate => {
    if (!externalDateInput || typeof externalDateInput !== 'object')
      return null;

    const existingTimestamp = externalDateInput.dataset?.timestamp;
    if (!existingTimestamp || typeof existingTimestamp !== 'string')
      return null;

    if (!selectedDate || typeof selectedDate !== 'string') return null;
    if (selectedDate.includes('T')) return null;

    const tIndex = existingTimestamp.indexOf('T');
    if (tIndex === -1) return null;
    const timePart = existingTimestamp.slice(tIndex + 1);
    if (!timePart) return null;

    const isoCandidate = `${selectedDate}T${timePart}`;
    const parsed = new Date(isoCandidate);
    if (isNaN(parsed.getTime())) return null;

    return parsed.toISOString();
  };

  if (dateSource && dateSource.value) {
    // Use the date from external input and combine with current time for precise timestamp
    const selectedDate = dateSource.value;

    const preserved = preserveTimeFromExistingTimestamp(selectedDate);
    if (preserved) {
      timestamp = preserved;
    } else {
      // Check if it's a full ISO timestamp or just a date
      const parsedDate = new Date(selectedDate);

      if (!isNaN(parsedDate.getTime())) {
        if (selectedDate.includes('T')) {
          // Full timestamp provided, use it
          timestamp = parsedDate.toISOString();
        } else {
          // Date only provided (YYYY-MM-DD), combine with current time
          const now = new Date();
          const [year, month, day] = selectedDate.split('-').map(Number);

          // Final sanity check for split parts
          if (year && month && day) {
            timestamp = new Date(
              Date.UTC(
                year,
                month - 1,
                day,
                now.getUTCHours(),
                now.getUTCMinutes(),
                now.getUTCSeconds(),
                now.getUTCMilliseconds()
              )
            ).toISOString();
          } else {
            timestamp = new Date().toISOString();
          }
        }
      } else {
        // Invalid date format, fallback to current time
        timestamp = new Date().toISOString();
      }
    }
  } else {
    // Fallback to current time
    timestamp = new Date().toISOString();
  }

  const transactionData = {
    amount: Math.abs(amount),
    type,
    accountId,
    timestamp,
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
          console.error('Original error:', errorMessage);
          // Create a simple DOM-based error message as fallback with generic message
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
          fallbackDiv.textContent = 'An error occurred. Please try again.';
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
