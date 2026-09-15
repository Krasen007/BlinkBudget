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
  NEUTRAL: 'neutral',
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
 * Active toast notification containers
 */
let toastContainer = null;
let toastContainerBottom = null;
const activeToasts = new Map();

/**
 * Initialize a toast container
 * @param {string} position - One of TOAST_POSITIONS (bottom variants get
 *   their own container pinned to the bottom edge)
 * @returns {HTMLElement} The container for this toast
 */
function initializeContainer(position = TOAST_POSITIONS.TOP_CENTER) {
  if (position === TOAST_POSITIONS.BOTTOM_CENTER) {
    if (!toastContainerBottom || !toastContainerBottom.isConnected) {
      toastContainerBottom = document.createElement('div');
      toastContainerBottom.id = 'toast-container-bottom';
      toastContainerBottom.className = 'toast-container toast-container-bottom';
      toastContainerBottom.setAttribute('aria-live', 'polite');
      toastContainerBottom.setAttribute('aria-label', 'Notifications');
      document.body.appendChild(toastContainerBottom);
    }
    return toastContainerBottom;
  }

  if (!toastContainer || !toastContainer.isConnected) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container';
    toastContainer.setAttribute('aria-live', 'polite');
    toastContainer.setAttribute('aria-label', 'Notifications');

    document.body.appendChild(toastContainer);
  }
  return toastContainer;
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
      duration: TIMING.NOTIFICATION_SUCCESS,
    },
    [TOAST_TYPES.ERROR]: {
      background: COLORS.ERROR,
      icon: '❌',
      duration: TIMING.NOTIFICATION_ERROR,
    },
    [TOAST_TYPES.WARNING]: {
      background: COLORS.WARNING,
      icon: '⚠️',
      duration: TIMING.NOTIFICATION_WARNING,
    },
    [TOAST_TYPES.INFO]: {
      background: COLORS.PRIMARY,
      icon: 'ℹ️',
      duration: TIMING.NOTIFICATION_INFO,
    },
    [TOAST_TYPES.NEUTRAL]: {
      // Muted hint style — calm, non-alarming feedback (e.g. delete undo)
      background: COLORS.SURFACE,
      icon: '',
      duration: TIMING.NOTIFICATION_INFO,
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
  const { position } = options;

  const toast = document.createElement('div');
  toast.id = toastId;
  toast.className = `toast toast-${type}${
    position === TOAST_POSITIONS.BOTTOM_CENTER ? ' toast-bottom' : ''
  }`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');

  // Icon (omitted for muted variants)
  let icon = null;
  if (config.icon) {
    icon = document.createElement('span');
    icon.className = 'toast-icon';
    icon.textContent = config.icon;
  }

  const messageElement = document.createElement('div');
  messageElement.className = 'toast-message';
  messageElement.textContent = message;

  const closeButton = document.createElement('button');
  closeButton.className = 'toast-close';
  closeButton.textContent = '×';
  closeButton.setAttribute('aria-label', 'Close notification');

  if (icon) {
    toast.appendChild(icon);
  }
  toast.appendChild(messageElement);

  // Optional action button (e.g. "View Changes" after a PWA update)
  const { actionText, onAction } = options;
  if (actionText && typeof onAction === 'function') {
    const actionButton = document.createElement('button');
    actionButton.className = 'toast-action';
    actionButton.textContent = actionText;
    actionButton.setAttribute('aria-label', actionText);
    actionButton.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      removeToastById(toastId);
      onAction();
    });
    toast.appendChild(actionButton);
  }

  toast.appendChild(closeButton);

  const handleRemove = () => {
    removeToastById(toastId);
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
    onClose: options.onClose || null,
  });

  return toast;
}

/**
 * Animate toast in
 * @param {HTMLElement} toast - Toast element
 */
function animateToastIn(toast) {
  // Force reflow before adding class to ensure transition runs
  void toast.offsetHeight;
  toast.classList.add('active');
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

  // Create toast
  const toast = createToastElement(message, type, options);
  const toastId = toast.id;

  // Initialize the right container (top or bottom) if needed and mount
  const container = initializeContainer(options.position);
  container.appendChild(toast);

  // Animate in
  animateToastIn(toast);

  // Set auto-remove timeout
  if (!persistent) {
    const config = getToastConfig(type);
    const finalDuration = duration !== undefined ? duration : config.duration;

    const timeoutId = setTimeout(() => {
      removeToastById(toastId);
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
 * Show info toast with an Undo action button (e.g. transaction delete undo)
 * @param {string} message - Toast message
 * @param {Function} onUndo - Called when the Undo button is clicked
 * @param {Object} options - Additional options (duration, onClose, ...)
 */
export function showUndoToast(message, onUndo, options = {}) {
  // Muted hint pinned to the bottom edge — deletion is assumed intentional;
  // the toast is a restore hint, not an alarm.
  return showToast(message, TOAST_TYPES.NEUTRAL, {
    position: TOAST_POSITIONS.BOTTOM_CENTER,
    actionText: 'Undo',
    onAction: onUndo,
    ...options,
  });
}

/**
 * Clear all active toasts
 */
export function clearAllToasts() {
  // Create snapshot of keys before removing to avoid mutation during iteration
  const toastIds = Array.from(activeToasts.keys());
  toastIds.forEach(toastId => {
    removeToastById(toastId);
  });
}

/**
 * Remove specific toast
 * @param {string} toastId - Toast ID to remove
 */
export function removeToastById(toastId) {
  const toastData = activeToasts.get(toastId);
  if (!toastData) return;

  const { element, timeoutId, onClose } = toastData;

  if (timeoutId) clearTimeout(timeoutId);

  element.classList.remove('active');

  setTimeout(() => {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
    activeToasts.delete(toastId);
    if (onClose && typeof onClose === 'function') {
      onClose();
    }
  }, TIMING.ANIMATION_FAST);
}
