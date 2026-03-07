/**
 * Progress Indicators Utility
 * Provides loading and progress indicators for async operations
 */

import { SPACING, FONT_SIZES } from './constants.js';

const activeIndicators = new Map();

/**
 * Show progress indicator for an operation
 * @param {string} operationId - Unique identifier for the operation
 * @param {string} message - Progress message to display
 * @param {HTMLElement} container - Container element to show indicator in
 * @param {Object} options - Configuration options
 */
export const showProgressIndicator = (
  operationId,
  message = 'Processing...',
  container,
  options = {}
) => {
  const { timeout = 30000 } = options; // Default 30 second timeout

  // Remove existing indicator for this operation if it exists
  if (activeIndicators.has(operationId)) {
    const existingIndicator = activeIndicators.get(operationId);
    if (existingIndicator && existingIndicator.parentNode) {
      existingIndicator.parentNode.removeChild(existingIndicator);
    }
    activeIndicators.delete(operationId);
  }

  // Create progress indicator container
  const indicatorContainer = document.createElement('div');
  indicatorContainer.className = 'progress-indicator';
  indicatorContainer.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 9999;
    background: rgba(0, 0, 0, 0.8);
    border-radius: 8px;
    padding: ${SPACING.LG};
    min-width: 300px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  `;

  // Create spinner
  const spinner = document.createElement('div');
  spinner.className = 'progress-spinner';
  spinner.style.cssText = `
    width: 32px;
    height: 32px;
    border: 3px solid var(--color-primary);
    border-radius: 50%;
    border-top-color: var(--color-primary);
    border-right-color: var(--color-primary);
    border-bottom-color: var(--color-primary);
    animation: spin 1s linear infinite;
    margin: 0 auto ${SPACING.MD} 0;
  `;

  // Create message
  const messageEl = document.createElement('div');
  messageEl.className = 'progress-message';
  messageEl.textContent = message;
  messageEl.style.cssText = `
    color: var(--color-text);
    font-size: ${FONT_SIZES.SM};
    text-align: center;
    margin-bottom: ${SPACING.SM};
  `;

  // Create cancel button (if enabled)
  let cancelButton = null;
  if (options && options.onCancel !== undefined) {
    cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.cssText = `
      background: transparent;
      border: 1px solid var(--color-text);
      color: var(--color-text);
      padding: ${SPACING.XS} ${SPACING.SM};
      border-radius: 4px;
      cursor: pointer;
      font-size: ${FONT_SIZES.SM};
      margin-top: ${SPACING.SM};
    `;

    cancelButton.addEventListener('click', () => {
      if (options && options.onCancel) {
        options.onCancel();
        hideProgressIndicator(operationId);
      }
    });
  }

  // Assemble indicator
  indicatorContainer.appendChild(spinner);
  indicatorContainer.appendChild(messageEl);
  if (cancelButton) {
    indicatorContainer.appendChild(cancelButton);
  }

  // Add to container and track
  container.appendChild(indicatorContainer);
  activeIndicators.set(operationId, indicatorContainer);

  // Auto-hide after timeout
  const hideIndicator = () => {
    const indicator = activeIndicators.get(operationId);
    if (indicator && indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
      activeIndicators.delete(operationId);
    }
  };

  setTimeout(hideIndicator, timeout);

  return {
    hide: hideIndicator,
    update: newMessage => {
      const messageEl = indicatorContainer.querySelector('.progress-message');
      if (messageEl) {
        messageEl.textContent = newMessage;
      }
    },
  };
};

/**
 * Hide a specific progress indicator
 * @param {string} operationId - Operation identifier to hide
 */
export const hideProgressIndicator = operationId => {
  if (activeIndicators.has(operationId)) {
    const indicator = activeIndicators.get(operationId);
    if (indicator && indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
      activeIndicators.delete(operationId);
    }
  }
};

/**
 * CSS for spinner animation
 */
export const addProgressStyles = () => {
  const styleId = 'progress-indicator-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .progress-spinner {
      border: 3px solid var(--color-primary);
      border-radius: 50%;
      border-top-color: var(--color-primary);
      border-right-color: var(--color-primary);
      border-bottom-color: var(--color-primary);
      animation: spin 1s linear infinite;
    }
  `;
  document.head.appendChild(style);
};

// Initialize styles when module is imported
if (typeof document !== 'undefined') {
  addProgressStyles();
}
