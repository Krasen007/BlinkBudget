import { registerSW } from 'virtual:pwa-register';
import { ToastNotification } from './components/ToastNotification.js';

const GITHUB_RELEASES_URL = 'https://github.com/Krasen007/BlinkBudget/releases';
// __APP_VERSION__ is injected by Vite at build time
// eslint-disable-next-line no-undef
const CURRENT_VERSION = __APP_VERSION__;

// Track if update was found after manual check
let updateFoundCallback = null;
let updateFoundTimeout = null;
let pendingUpdate = false;

// Export getter function for live state access
export const hasPendingUpdate = () => pendingUpdate;

/**
 * Show update confirmation dialog with GitHub releases link
 */
function showUpdateConfirmation(onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'update-dialog-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    padding: 20px;
  `;

  const dialog = document.createElement('div');
  dialog.className = 'update-dialog';
  dialog.style.cssText = `
    background: var(--color-surface, #1a1a1a);
    border: 1px solid var(--color-border, #333);
    border-radius: 12px;
    padding: 24px;
    max-width: 400px;
    width: 100%;
    text-align: center;
  `;
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');

  dialog.innerHTML = `
    <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
    <h2 style="margin: 0 0 12px 0; font-size: 1.5rem; color: var(--color-text, #fff);">
      Update Available
    </h2>
    <p style="margin: 0 0 16px 0; color: var(--color-text-muted, #888); line-height: 1.5;">
      A new version of BlinkBudget is ready to install.
    </p>
    <a href="${GITHUB_RELEASES_URL}" 
       target="_blank" 
       rel="noopener noreferrer"
       class="update-releases-link"
       style="
         display: inline-block;
         margin-bottom: 20px;
         color: var(--color-primary, #00d084);
         text-decoration: none;
         font-size: 0.9rem;
       ">
      📋 View Release Notes on GitHub
    </a>
    <div style="display: flex; gap: 12px; justify-content: center;">
      <button class="update-later-btn" style="
        padding: 10px 20px;
        border: 1px solid var(--color-border, #333);
        background: transparent;
        color: var(--color-text, #fff);
        border-radius: 8px;
        cursor: pointer;
      ">Later</button>
      <button class="update-now-btn" style="
        padding: 10px 20px;
        border: none;
        background: var(--color-primary, #00d084);
        color: #000;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
      ">Update Now</button>
    </div>
  `;

  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  // Focus management and keyboard accessibility
  const updateNowBtn = dialog.querySelector('.update-now-btn');
  const laterBtn = dialog.querySelector('.update-later-btn');
  const releasesLink = dialog.querySelector('.update-releases-link');
  const previouslyFocused = document.activeElement;

  // Set initial focus to primary action
  updateNowBtn.focus();

  // Simple focus trap for Tab navigation - include all focusable elements
  const focusableElements = [updateNowBtn, laterBtn, releasesLink];
  const handleKeyDown = e => {
    if (e.key === 'Escape') {
      document.body.removeChild(overlay);
      if (previouslyFocused && previouslyFocused.focus) {
        previouslyFocused.focus();
      }
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const currentIndex = focusableElements.indexOf(document.activeElement);
      let nextIndex;
      
      if (e.shiftKey) {
        // Shift+Tab: go backwards
        nextIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
      } else {
        // Tab: go forwards
        nextIndex = currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1;
      }
      
      const nextElement = focusableElements[nextIndex];
      if (nextElement && nextElement.focus) {
        nextElement.focus();
      }
    }
  };

  overlay.addEventListener('keydown', handleKeyDown);

  // Handle buttons
  laterBtn.addEventListener('click', () => {
    document.body.removeChild(overlay);
    if (previouslyFocused) {
      previouslyFocused.focus();
    }
  });
  updateNowBtn.addEventListener('click', () => {
    document.body.removeChild(overlay);
    onConfirm();
    if (previouslyFocused) {
      previouslyFocused.focus();
    }
  });

  // Close on overlay click
  overlay.addEventListener('click', e => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
      if (previouslyFocused) {
        previouslyFocused.focus();
      }
    }
  });
}

/**
 * Show version confirmation toast after update
 */
function showVersionConfirmation() {
  ToastNotification({
    message: `Updated to v${CURRENT_VERSION}`,
    actionText: 'View Changes',
    variant: 'success',
    onAction: () => {
      window.open(GITHUB_RELEASES_URL, '_blank', 'noopener,noreferrer');
    },
  });
}

/**
 * Check if this is first launch after update
 */
function checkFirstLaunchAfterUpdate() {
  try {
    const lastVersion = localStorage.getItem('blinkbudget-version');
    if (lastVersion && lastVersion !== CURRENT_VERSION) {
      // Just updated - show confirmation
      setTimeout(showVersionConfirmation, 1000);
    }
    localStorage.setItem('blinkbudget-version', CURRENT_VERSION);
  } catch (error) {
    console.warn(
      '[PWA] Failed to access localStorage for version check:',
      error
    );
  }
}

const updateSW = registerSW({
  onNeedRefresh() {
    console.log('[PWA Update] onNeedRefresh triggered - update available!');
    pendingUpdate = true;

    // If manual check is waiting, notify it
    if (updateFoundCallback) {
      updateFoundCallback(true);
      updateFoundCallback = null;
      if (updateFoundTimeout) {
        clearTimeout(updateFoundTimeout);
        updateFoundTimeout = null;
      }
    }

    showUpdateConfirmation(() => {
      updateSW(true);
    });
  },
  onOfflineReady() {
    console.log('[PWA Update] App is ready to work offline.');
  },
});

// Check for version change on load
checkFirstLaunchAfterUpdate();

// Global state for managing concurrent update checks
const pendingUpdateResolvers = [];
const pendingUpdateTimeouts = [];

/**
 * Check for updates with feedback
 * Returns a promise that resolves with true if update found, false otherwise
 */
function checkForUpdatesWithFeedback() {
  return new Promise(resolve => {
    console.log('[PWA Update] Starting manual check with feedback');

    if (!('serviceWorker' in navigator)) {
      console.warn('[PWA Update] Service Worker not supported');
      resolve(false);
      return;
    }

    // Early return if there's already a pending update
    if (pendingUpdate === true) {
      console.log('[PWA Update] Update already pending, resolving immediately');
      resolve(true);
      return;
    }

    // Add this resolver to the pending list
    pendingUpdateResolvers.push(resolve);
    
    // Create timeout for this specific call
    const timeoutId = setTimeout(() => {
      console.log('[PWA Update] No update detected within timeout');
      const index = pendingUpdateResolvers.indexOf(resolve);
      if (index > -1) {
        pendingUpdateResolvers.splice(index, 1);
      }
      const timeoutIndex = pendingUpdateTimeouts.indexOf(timeoutId);
      if (timeoutIndex > -1) {
        pendingUpdateTimeouts.splice(timeoutIndex, 1);
      }
      resolve(false);
    }, 3000);
    
    pendingUpdateTimeouts.push(timeoutId);

    // Trigger the check
    navigator.serviceWorker.ready.then(registration => {
      console.log('[PWA Update] Calling registration.update()');
      registration.update().catch(error => {
        console.error('[PWA Update] Failed to check for updates:', error);
        // Resolve all pending calls with false on error
        const resolvers = pendingUpdateResolvers.splice(0);
        const timeouts = pendingUpdateTimeouts.splice(0);
        timeouts.forEach(timeoutId => clearTimeout(timeoutId));
        resolvers.forEach(resolver => resolver(false));
      });
    });
  });
}

// Export for manual update checks
export {
  updateSW,
  CURRENT_VERSION,
  GITHUB_RELEASES_URL,
  checkForUpdatesWithFeedback,
};
