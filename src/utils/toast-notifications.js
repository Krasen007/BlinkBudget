/**
 * Toast Notification System
 *
 * Centralized notification system to replace browser alerts
 * Provides consistent, accessible user feedback
 */

import { TIMING, COLORS } from './constants.js';

/**
 * Toast notification types
 */
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

/**
 * Toast position options
 */
export const TOAST_POSITIONS = {
  TOP_RIGHT: 'top-right',
  TOP_CENTER: 'top-center',
  BOTTOM_RIGHT: 'bottom-right',
  BOTTOM_CENTER: 'bottom-center',
};

/**
 * Active toast notifications container
 */
let toastContainer = null;
const activeToasts = new Map();

/**
 * Initialize toast container
 */
function initializeContainer() {
  if (toastContainer) return;

  toastContainer = document.createElement('div');
  toastContainer.id = 'toast-container';
  toastContainer.className = 'toast-container';
  toastContainer.setAttribute('aria-live', 'polite');
  toastContainer.setAttribute('aria-label', 'Notifications');

  document.body.appendChild(toastContainer);
}

/**
 * Get toast configuration by type
 * @param {string} type - Toast type
 * @returns {Object} Toast configuration
 */
function getToastConfig(type) {
  const configs = {
    [TOAST_TYPES.SUCCESS]: {
      background: COLORS.SUCCESS,
      icon: '✅',
      duration: TIMING.NOTIFICATION_SUCCESS || 3000,
    },
    [TOAST_TYPES.ERROR]: {
      background: COLORS.ERROR,
      icon: '❌',
      duration: TIMING.NOTIFICATION_ERROR || 5000,
    },
    [TOAST_TYPES.WARNING]: {
      background: COLORS.WARNING,
      icon: '⚠️',
      duration: TIMING.NOTIFICATION_WARNING || 4000,
    },
    [TOAST_TYPES.INFO]: {
      background: COLORS.PRIMARY,
      icon: 'ℹ️',
      duration: TIMING.NOTIFICATION_INFO || 3000,
    },
  };

  return configs[type] || configs[TOAST_TYPES.INFO];
}

/**
 * Create toast element
 * @param {string} message - Toast message
 * @param {string} type - Toast type
 * @param {Object} options - Additional options
 * @returns {HTMLElement} Toast element
 */
function createToastElement(message, type, options = {}) {
  const config = getToastConfig(type);
  const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const toast = document.createElement('div');
  toast.id = toastId;
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');

  // Icon
  const icon = document.createElement('span');
  icon.className = 'toast-icon';
  icon.textContent = config.icon;

  // Message
  const messageElement = document.createElement('div');
  messageElement.className = 'toast-message';
  messageElement.textContent = message;

  // Close button
  const closeButton = document.createElement('button');
  closeButton.className = 'toast-close';
  closeButton.textContent = '×';
  closeButton.setAttribute('aria-label', 'Close notification');

  // Assemble toast
  toast.appendChild(icon);
  toast.appendChild(messageElement);
  toast.appendChild(closeButton);

  // Event handlers
  const handleRemove = () => {
    removeToast(toastId);
  };

  closeButton.addEventListener('click', handleRemove);
  toast.addEventListener('click', e => {
    if (e.target !== closeButton) {
      handleRemove();
    }
  });

  // Store toast data including onClose callback
  activeToasts.set(toastId, {
    element: toast,
    timeoutId: null,
    removeFn: removeToast,
    onClose: options.onClose || null,
  });

  return toast;
}

/**
 * Animate toast in
 * @param {HTMLElement} toast - Toast element
 */
function animateToastIn(toast) {
  // Use CSS transitions instead of requestAnimationFrame
  toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  toast.classList.add('active');
}

/**
 * Animate toast out and remove
 * @param {string} toastId - Toast ID
 */
function animateToastOut(toastId) {
  const toastData = activeToasts.get(toastId);
  if (!toastData) return;

  const { element, timeoutId, onClose } = toastData;

  // Clear auto-remove timeout
  if (timeoutId) {
    clearTimeout(timeoutId);
  }

  // Animate out using class
  element.classList.remove('active');

  // Remove after animation and call onClose callback
  setTimeout(() => {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
    activeToasts.delete(toastId);

    // Call onClose callback if provided
    if (onClose && typeof onClose === 'function') {
      onClose();
    }
  }, TIMING.ANIMATION_FAST);
}

/**
 * Remove toast notification
 * @param {string} toastId - Toast ID
 */
function removeToast(toastId) {
  animateToastOut(toastId);
}

/**
 * Show toast notification
 * @param {string} message - Toast message
 * @param {string} type - Toast type (success, error, warning, info)
 * @param {Object} options - Additional options
 * @param {number} options.duration - Auto-dismiss duration in ms
 * @param {boolean} options.persistent - If true, won't auto-dismiss
 * @param {Function} options.onClose - Callback when toast is closed
 * @returns {string} Toast ID for manual removal
 */
export function showToast(message, type = TOAST_TYPES.INFO, options = {}) {
  const { duration, persistent = false } = options;

  // Initialize container if needed
  initializeContainer();

  // Create toast
  const toast = createToastElement(message, type, options);
  const toastId = toast.id;

  // Add to container
  toastContainer.appendChild(toast);

  // Animate in
  animateToastIn(toast);

  // Set auto-remove timeout
  if (!persistent) {
    const config = getToastConfig(type);
    const finalDuration = duration !== undefined ? duration : config.duration;

    const timeoutId = setTimeout(() => {
      removeToast(toastId);
    }, finalDuration);

    // Update toast data with timeout
    const toastData = activeToasts.get(toastId);
    if (toastData) {
      toastData.timeoutId = timeoutId;
    }
  }

  return toastId;
}

/**
 * Show success toast
 * @param {string} message - Success message
 * @param {Object} options - Additional options
 */
export function showSuccessToast(message, options = {}) {
  return showToast(message, TOAST_TYPES.SUCCESS, options);
}

/**
 * Show error toast
 * @param {string} message - Error message
 * @param {Object} options - Additional options
 */
export function showErrorToast(message, options = {}) {
  return showToast(message, TOAST_TYPES.ERROR, options);
}

/**
 * Show warning toast
 * @param {string} message - Warning message
 * @param {Object} options - Additional options
 */
export function showWarningToast(message, options = {}) {
  return showToast(message, TOAST_TYPES.WARNING, options);
}

/**
 * Show info toast
 * @param {string} message - Info message
 * @param {Object} options - Additional options
 */
export function showInfoToast(message, options = {}) {
  return showToast(message, TOAST_TYPES.INFO, options);
}

/**
 * Clear all active toasts
 */
export function clearAllToasts() {
  // Create snapshot of keys before removing to avoid mutation during iteration
  const toastIds = Array.from(activeToasts.keys());
  toastIds.forEach(toastId => {
    removeToast(toastId);
  });
}

/**
 * Remove specific toast
 * @param {string} toastId - Toast ID to remove
 */
export function removeToastById(toastId) {
  removeToast(toastId);
}

/**
 * Get count of active toasts
 * @returns {number} Number of active toasts
 */
export function getActiveToastCount() {
  return activeToasts.size;
}
