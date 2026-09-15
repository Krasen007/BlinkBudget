/**
 * Form submission utilities
 * Handles transaction data preparation and submission
 */

import { getTodayISO } from '../date-utils.js';
import { TIMING } from '../constants.js';
import { sanitizeInput } from '../security-utils.js';
import { applyExpenseTagToTransactionData } from './transaction-tags.js';
import { showErrorToast } from '../toast-notifications.js';

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

    const timePart = existingTimestamp.slice(
      existingTimestamp.indexOf('T') + 1
    );
    const parsed = new Date(`${selectedDate}T${timePart}`);
    return isNaN(parsed.getTime()) ? null : parsed.toISOString();
  };

  // Duck-type: DateInput component (getDate method) or plain input (value property)
  const selectedDate = externalDateInput
    ? externalDateInput.getDate
      ? externalDateInput.getDate()
      : externalDateInput.value
    : getTodayISO();

  if (String(selectedDate).includes('T')) {
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
      const now = new Date();
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
 * Resolve a date string from a DateInput component, a plain input,
 * or a fallback when neither is available. Shared by the transfer
 * and category chip auto-submit paths.
 * @param {Object|null} dateSource - External date input or null
 * @returns {string} Date value (YYYY-MM-DD or ISO)
 */
export const resolveSubmitDateValue = dateSource => {
  const source =
    dateSource ||
    (() => {
      const fallback = document.createElement('input');
      fallback.type = 'date';
      fallback.value = new Date().toISOString().split('T')[0];
      return fallback;
    })();

  if (source.getDate) return source.getDate();
  return source.value || new Date().toISOString().split('T')[0];
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
    const detail = e?.message ?? String(e);
    const errorMessage = `Error submitting transaction: ${detail}`;

    if (onError) {
      onError(e, errorMessage);
      return;
    }

    try {
      showErrorToast(errorMessage, {
        duration: TIMING.NOTIFICATION_ERROR,
      });
    } catch (toastError) {
      // Toast UI itself failed (should not happen with static imports,
      // but keeps a submit failure visible instead of console-only).
      console.error('Failed to show submit error toast:', toastError);
      // eslint-disable-next-line no-alert
      if (typeof alert === 'function') alert(errorMessage);
    }
  }
};
