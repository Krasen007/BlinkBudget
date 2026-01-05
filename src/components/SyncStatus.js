import { COLORS, SPACING } from '../utils/constants.js';

export function SyncStatus() {
  const el = document.createElement('div');
  el.className = 'sync-status-component';
  el.style.padding = `${SPACING.XS} ${SPACING.SM}`;
  el.style.borderRadius = 'var(--radius-sm)';
  el.style.background = 'transparent';
  el.style.color = COLORS.TEXT_MUTED;
  el.style.fontSize = '0.9rem';
  el.textContent = navigator.onLine ? 'Synced' : 'Offline';

  const handle = (e) => {
    const d = e.detail || {};
    if (d.state === 'syncing') {
      el.textContent = `Syncing ${d.dataType}...`;
      el.style.background = 'transparent';
      el.style.color = COLORS.TEXT_MAIN;
    } else if (d.state === 'synced') {
      el.textContent = `Synced ${d.dataType}`;
      el.style.color = COLORS.TEXT_MUTED;
    } else if (d.state === 'error') {
      el.textContent = `Sync error (${d.dataType})`;
      el.style.color = COLORS.ERROR;
    }
  };

  window.addEventListener('sync-state', handle);
  el.cleanup = () => window.removeEventListener('sync-state', handle);
  return el;
}
