/**
 * Form submission utilities
 * Handles transaction data preparation and submission
 */

import { getTodayISO } from '../date-utils.js';
import { sanitizeInput } from '../security-utils.js';
import { applyExpenseTagToTransactionData } from './transaction-tags.js';

/**
 * Prepare transaction data for submission
 * @param {Object} formState - Form state object containing:
 *   @property {number} formState.amount - Transaction amount
 *   @property {string} formState.type - Transaction type
 *   @property {string} formState.category - Category (or null for transfers)
 *   @property {string} formState.accountId - Source account ID
 *   @property {string|null} formState.toAccountId - Destination account ID (for transfers)
 *   @property {string} [formState.description] - Transaction description/notes (optional)
 *   @property {string|null} [formState.tagName] - Optional expense flag name (optional)
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
    tagName = null,
    externalDateInput = null,
  } = formState;

  let timestamp;

  // Combine the selected date with the time part of the existing timestamp,
  // so editing a transaction keeps its original time of day.
  const preserveTimeFromExistingTimestamp = selectedDate => {
    const existingTimestamp = externalDateInput?.dataset?.timestamp;
    if (!selectedDate || selectedDate.includes('T')) return null;
    if (!existingTimestamp) return null;

    const tIndex = existingTimestamp.indexOf('T');
    if (tIndex === -1) return null;

    const parsed = new Date(
      `${selectedDate}T${existingTimestamp.slice(tIndex + 1)}`
    );
    return isNaN(parsed.getTime()) ? null : parsed.toISOString();
  };

  // Duck-type: DateInput component (getDate method) or plain input (value property)
  const selectedDate = externalDateInput
    ? externalDateInput.getDate
      ? externalDateInput.getDate()
      : externalDateInput.value
    : getTodayISO();

  if (String(selectedDate).includes('T')) {
    // Full ISO timestamp: preserve exactly if valid
    const parsed = new Date(selectedDate);
    timestamp = isNaN(parsed.getTime())
      ? new Date().toISOString()
      : parsed.toISOString();
  } else {
    const dateOnlyMatch = String(selectedDate).match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );
    const parsedDateOnly = dateOnlyMatch?.slice(1).map(Number);
    const [year, month, day] = parsedDateOnly || [];
    const utcDate = parsedDateOnly
      ? new Date(Date.UTC(year, month - 1, day))
      : null;
    const isValidDateOnly =
      Boolean(utcDate) &&
      utcDate.getUTCFullYear() === year &&
      utcDate.getUTCMonth() === month - 1 &&
      utcDate.getUTCDate() === day;

    if (!isValidDateOnly) {
      timestamp = new Date().toISOString();
    } else {
      timestamp = preserveTimeFromExistingTimestamp(selectedDate);
    }

    if (!timestamp && isValidDateOnly) {
      // Date only (YYYY-MM-DD): combine with current UTC time so the
      // calendar date is preserved regardless of local timezone offset.
      const now = new Date();
      const combinedDate = new Date(
        Date.UTC(
          year,
          month - 1,
          day,
          now.getUTCHours(),
          now.getUTCMinutes(),
          now.getUTCSeconds(),
          now.getUTCMilliseconds()
        )
      );

      if (
        combinedDate.getUTCFullYear() === year &&
        combinedDate.getUTCMonth() === month - 1 &&
        combinedDate.getUTCDate() === day
      ) {
        timestamp = combinedDate.toISOString();
      } else {
        timestamp = new Date().toISOString();
      }
    }
  }

  const transactionData = {
    amount: Math.abs(amount),
    type,
    accountId,
    timestamp,
  };

  transactionData.category =
    type === 'transfer' ? 'Transfer' : sanitizeInput(category || '');
  if (type === 'transfer') {
    transactionData.toAccountId = toAccountId;
  }

  if (description && description.trim()) {
    transactionData.description = sanitizeInput(description.trim());
  }

  const includeTagField = Object.prototype.hasOwnProperty.call(
    formState,
    'tagName'
  );
  return applyExpenseTagToTransactionData(
    transactionData,
    tagName,
    includeTagField
  );
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
      import('../toast-notifications.js')
        .then(({ showErrorToast }) => {
          showErrorToast(errorMessage, { duration: 5000, persistent: false });
        })
        .catch(importErr => {
          console.error('Failed to load toast notifications:', importErr);
          console.error('Original error:', errorMessage);
        });
    }
  }
};
