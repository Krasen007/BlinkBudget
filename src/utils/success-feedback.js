/**
 * Success feedback utilities
 * Provides visual confirmation for save operations with checkmark animations
 */

import { SPACING, FONT_SIZES } from '../utils/constants.js';

/**
 * Show success checkmark animation
 * @param {HTMLElement} container - Container element to show animation in
 * @param {string} message - Success message to display
 * @param {number} duration - Duration in milliseconds (default: 2000)
 */
export const showSuccessCheckmark = (
  container,
  message = 'Success!',
  duration = 2000
) => {
  if (!container) return;

  // Create checkmark container
  const checkmarkContainer = document.createElement('div');
  checkmarkContainer.className = 'success-checkmark-container';
  checkmarkContainer.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 9999;
    pointer-events: none;
  `;

  // Create checkmark circle
  const circle = document.createElement('div');
  circle.className = 'success-checkmark-circle';
  circle.style.cssText = `
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: var(--color-success);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: checkmarkPop 0.6s ease-out;
  `;

  // Create checkmark symbol
  const checkmark = document.createElement('div');
  checkmark.className = 'success-checkmark';
  checkmark.innerHTML = '✓';
  checkmark.style.cssText = `
    color: white;
    font-size: 28px;
    font-weight: bold;
    animation: checkmarkDraw 0.4s ease-out 0.2s;
  `;

  // Create message
  const messageEl = document.createElement('div');
  messageEl.className = 'success-checkmark-message';
  messageEl.textContent = message;
  messageEl.style.cssText = `
    margin-top: 80px;
    padding: ${SPACING.SM} ${SPACING.MD};
    background: var(--color-surface);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    font-weight: 600;
    font-size: ${FONT_SIZES.BASE};
    color: var(--color-text);
    text-align: center;
    animation: slideInUp 0.5s ease-out;
  `;

  circle.appendChild(checkmark);
  checkmarkContainer.appendChild(circle);
  checkmarkContainer.appendChild(messageEl);
  container.appendChild(checkmarkContainer);

  // Auto-remove after duration
  setTimeout(() => {
    if (container.contains(checkmarkContainer)) {
      container.removeChild(checkmarkContainer);
    }
  }, duration);
};

/**
 * Highlight a transaction item with subtle success animation
 * @param {HTMLElement} element - Element to highlight
 * @param {number} duration - Duration in milliseconds (default: 1500)
 */
export const highlightTransactionSuccess = (element, duration = 1500) => {
  if (!element) return;

  // Add the highlight class
  element.classList.add('success-highlight', 'success-highlight-active');

  // Fade back to original
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
 * CSS for success animations
 */
export const addSuccessStyles = () => {
  const styleId = 'success-feedback-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes checkmarkPop {
      0% {
        transform: scale(0);
        opacity: 0;
      }
      50% {
        transform: scale(1.1);
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }
    
    @keyframes checkmarkDraw {
      0% {
        transform: scale(0) rotate(-45deg);
        opacity: 0;
      }
      50% {
        transform: scale(0.8) rotate(-10deg);
        opacity: 0.8;
      }
      100% {
        transform: scale(1) rotate(0deg);
        opacity: 1;
      }
    }
    
    @keyframes slideInUp {
      0% {
        opacity: 0;
        transform: translateY(30px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .success-highlight {
      transition: all 0.3s ease;
    }
    
    .success-highlight-active {
      background-color: color-mix(in srgb, var(--color-success) 10%, transparent);
      border-radius: 4px;
    }
  `;
  document.head.appendChild(style);
};

// Initialize styles when module is imported
if (typeof document !== 'undefined') {
  addSuccessStyles();
}

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
