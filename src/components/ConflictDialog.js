export function ConflictDialog() {
  const overlay = document.createElement('div');
  overlay.className = 'conflict-dialog-overlay';
  Object.assign(overlay.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.4)',
    zIndex: 10000,
  });

  const dialog = document.createElement('div');
  dialog.className = 'conflict-dialog';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'conflict-dialog-title');
  dialog.setAttribute('aria-describedby', 'conflict-dialog-message');
  dialog.style.background = 'white';
  dialog.style.padding = '16px';
  dialog.style.borderRadius = '8px';
  dialog.style.maxWidth = '420px';
  dialog.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';

  const title = document.createElement('h3');
  title.id = 'conflict-dialog-title';
  title.textContent = 'Sync Conflict Detected';
  title.style.marginTop = '0';

  const message = document.createElement('p');
  message.id = 'conflict-dialog-message';
  message.textContent = 'A conflict was detected between local and cloud versions. Choose which version to keep.';

  const btns = document.createElement('div');
  btns.style.display = 'flex';
  btns.style.gap = '8px';
  btns.style.justifyContent = 'flex-end';
  btns.style.marginTop = '12px';

  const keepLocal = document.createElement('button');
  keepLocal.textContent = 'Keep Local';
  keepLocal.className = 'btn btn-primary';

  const keepCloud = document.createElement('button');
  keepCloud.textContent = 'Keep Cloud';
  keepCloud.className = 'btn btn-secondary';

  const cancel = document.createElement('button');
  cancel.textContent = 'Cancel';
  cancel.className = 'btn btn-ghost';

  btns.appendChild(cancel);
  btns.appendChild(keepCloud);
  btns.appendChild(keepLocal);

  dialog.appendChild(title);
  dialog.appendChild(message);
  dialog.appendChild(btns);
  overlay.appendChild(dialog);
  // Attach overlay when DOM is ready. If body exists, append immediately,
  // otherwise wait for DOMContentLoaded.
  if (document.body) {
    document.body.appendChild(overlay);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.appendChild(overlay);
    });
  }
  let currentConflict = null;

  function show(conflict) {
    currentConflict = conflict;
    // update message with context if available
    if (conflict && conflict.key) {
      message.textContent = `Conflict in ${conflict.key}. Local and cloud versions differ.`;
    }
    overlay.style.display = 'flex';
  }

  function hide() {
    overlay.style.display = 'none';
    currentConflict = null;
  }

  keepLocal.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('sync-conflict-resolution', { detail: { resolution: 'local', conflict: currentConflict } }));
    hide();
  });

  keepCloud.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('sync-conflict-resolution', { detail: { resolution: 'cloud', conflict: currentConflict } }));
    hide();
  });

  cancel.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('sync-conflict-resolution', { 
      detail: { resolution: 'cancel', conflict: currentConflict } 
    }));
    hide();
  });
  // Listen for conflict events
  const handler = (e) => show(e.detail);
  window.addEventListener('sync-conflict', handler);

  overlay.cleanup = () => {
    window.removeEventListener('sync-conflict', handler);
    overlay.remove();
  };

  return overlay;
}
