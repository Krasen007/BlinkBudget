// Offline fallback behavior for public/offline.html.
// Kept in an external file (not inline) so the page stays compliant with a
// strict Content-Security-Policy that omits 'unsafe-inline' from script-src.
(() => {
  'use strict';

  const retryBtn = document.getElementById('retry-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      window.location.reload();
    });
  }

  // Auto-reload as soon as the connection is restored.
  window.addEventListener('online', () => {
    window.location.reload();
  });
})();
