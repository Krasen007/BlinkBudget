/**
 * Guarded loader for the MobileAlert dialog.
 *
 * MobileModal is a dynamic import so it stays out of the initial bundle — which
 * also means the import itself can fail (offline, chunk evicted by a new
 * deploy). Inside a catch block that failure throws *while handling* the
 * original error, so the user is left with no feedback at all and the
 * rejection escapes unhandled.
 *
 * Route error-path MobileAlert calls through here: it returns the real dialog
 * when the import works and a plain-alert fallback when it does not, so
 * reporting a failure can never itself fail silently.
 *
 * @returns {Promise<Function>} MobileAlert, or an alert() stand-in
 */
export const loadMobileAlert = async () => {
  try {
    const { MobileAlert } = await import('../components/MobileModal.js');
    return MobileAlert;
  } catch (error) {
    console.error(
      '[Dialog] MobileModal unavailable, falling back to alert():',
      error
    );
    return ({ title, message }) =>
      // eslint-disable-next-line no-alert -- last-resort feedback, see header
      window.alert([title, message].filter(Boolean).join('\n\n'));
  }
};
