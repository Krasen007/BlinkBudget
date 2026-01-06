import { COLORS, SPACING } from '../utils/constants.js';

/**
 * Creates a sync status component.
 * Returns an `HTMLElement` with a `cleanup()` method that should be called
 * if the element is removed from the DOM manually. The component also
 * performs auto-cleanup via a `MutationObserver` when the element is
 * detached after being attached, so consumers that forget `cleanup()` are
 * still protected from leaking the window event listener.
 *
 * @returns {HTMLElement} Element with a `cleanup()` method.
 */
export function SyncStatus() {
  const el = document.createElement('div');
  el.className = 'sync-status-component';
  el.setAttribute('role', 'status');
  el.setAttribute('aria-live', 'polite');
  el.style.padding = `${SPACING.XS} ${SPACING.SM}`;
  el.style.borderRadius = 'var(--radius-sm)';
  el.style.background = 'transparent';
  el.style.color = COLORS.TEXT_MUTED;
  el.style.fontSize = '0.9rem';
  el.textContent = navigator.onLine ? 'Synced' : 'Offline';
  const handle = e => {
    const d = e.detail || {};
    const dataType = d.dataType || 'data';
    if (d.state === 'syncing') {
      el.textContent = `Syncing ${dataType}...`;
      el.style.background = 'transparent';
      el.style.color = COLORS.TEXT_MAIN;
    } else if (d.state === 'synced') {
      el.textContent = `Synced ${dataType}`;
      el.style.color = COLORS.TEXT_MUTED;
    } else if (d.state === 'error') {
      el.textContent = `Sync error (${dataType})`;
      el.style.color = COLORS.ERROR;
    }
  };
  window.addEventListener('sync-state', handle);

  // Base cleanup: remove event listener
  el.cleanup = () => window.removeEventListener('sync-state', handle);

  // Auto-cleanup: observe the document body and detect when the element
  // was attached and later removed. This avoids leaking the global listener
  // if consumer forgets to call `cleanup()`.
  let seenConnected = el.isConnected;
  const observer = new MutationObserver(() => {
    const currentlyConnected = document.body.contains(el);
    if (currentlyConnected) {
      seenConnected = true;
      return;
    }
    if (seenConnected && !currentlyConnected) {
      try {
        el.cleanup();
      } catch {
        /* noop */
      }
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Ensure cleanup also disconnects the observer
  const originalCleanup = el.cleanup;
  el.cleanup = () => {
    try {
      originalCleanup();
    } catch {
      /* noop */
    }
    try {
      observer.disconnect();
    } catch {
      /* noop */
    }
  };

  return el;
}
