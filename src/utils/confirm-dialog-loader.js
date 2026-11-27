import { showErrorToast } from './toast-notifications.js';

/**
 * Load and open the confirmation dialog without allowing destructive actions
 * to proceed when its lazy-loaded UI is unavailable.
 * @param {Object} options - ConfirmDialog properties
 * @returns {Promise<boolean>} Whether the dialog opened
 */
export async function openConfirmDialog(options) {
  try {
    const { ConfirmDialog } = await import('../components/ConfirmDialog.js');
    ConfirmDialog(options);
    return true;
  } catch (error) {
    console.error('Failed to open confirmation dialog:', error);
    showErrorToast(
      'Unable to open confirmation. No data was changed. Please try again.'
    );
    return false;
  }
}
