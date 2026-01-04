/**
 * Success feedback utilities
 * Provides subtle visual confirmation for newly added/updated transactions
 */

import { COLORS, HAPTIC_PATTERNS } from './constants.js';

/**
 * Highlight a transaction item with subtle success animation
 * @param {HTMLElement} element - Element to highlight
 * @param {number} duration - Duration in milliseconds (default: 1000)
 */
export const highlightTransactionSuccess = (element, duration = 1500) => {
  if (!element) return;

  // Store original styles
  const originalBackground = element.style.backgroundColor;
  const originalTransition = element.style.transition;

  // Apply subtle success highlight - very light green
  element.style.transition = 'background-color 0.3s ease';
  element.style.backgroundColor = COLORS.SUCCESS_LIGHT;

  // Subtle haptic feedback
  if (window.mobileUtils && window.mobileUtils.supportsHaptic()) {
    window.mobileUtils.hapticFeedback(HAPTIC_PATTERNS.LIGHT);
  }

  // Fade back to original after 1 second
  setTimeout(() => {
    element.style.transition = 'background-color 0.5s ease';
    element.style.backgroundColor = originalBackground;

    // Restore original transition after fade completes
    setTimeout(() => {
      element.style.transition = originalTransition;
    }, 500);
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
