/**
 * Success feedback utilities
 * Provides visual confirmation for save operations with highlight animations
 */

/**
 * Highlight a transaction item with subtle success animation
 * @param {HTMLElement} element - Element to highlight
 * @param {number} duration - Duration in milliseconds (default: 1500)
 */
export const highlightTransactionSuccess = (element, duration = 1500) => {
  if (!element) return;

  element.classList.add('success-highlight', 'success-highlight-active');

  setTimeout(() => {
    element.classList.remove('success-highlight-active');
  }, duration);
};

/**
 * Store the ID of the last added transaction for highlighting
 * @param {string} transactionId - ID of the newly added transaction
 */
export const markTransactionForHighlight = transactionId => {
  sessionStorage.setItem('highlightTransactionId', transactionId);
};

/**
 * Get and clear the transaction ID(s) that should be highlighted
 * @returns {string[]|null} Array of transaction IDs to highlight, or null
 */
export const getTransactionToHighlight = () => {
  const ids = sessionStorage.getItem('highlightTransactionId');
  if (ids) {
    // Don't clear immediately - delay to allow sync-triggered re-renders to still access the IDs
    // Clear after 500ms to ensure all re-renders have completed
    setTimeout(() => {
      sessionStorage.removeItem('highlightTransactionId');
    }, 500);

    // Support both single ID and comma-separated multiple IDs
    return ids.split(',').map(id => id.trim());
  }
  return null;
};
