/**
 * Transaction delete undo flow.
 *
 * After a delete, shows a transient "Transaction deleted [Undo]" toast.
 * Undo restores the exact transaction object(s) — including any cascaded
 * ghost — at their original positions via TransactionService.restore(),
 * which persists, syncs and dispatches `storage-updated` for re-render.
 * The toast is fixed-position and CSS-transition-only, so the delete
 * itself stays instant, causes no layout thrash, and respects
 * `prefers-reduced-motion` (global rule in src/styles/base.css).
 */
import { TransactionService } from '../core/transaction-service.js';
import { markTransactionForHighlight } from './success-feedback.js';
import { TIMING } from './constants.js';
import { showUndoToast } from './toast-notifications.js';

const UNDO_TOAST_DURATION = TIMING.UNDO_TOAST || 5000;

/**
 * Notify the user about a delete and offer Undo for a limited window.
 * @param {Array<{transaction: Object, index: number}>|null} removedEntries
 *   Value returned by TransactionService.remove().
 * @param {Object} [options]
 * @param {string} [options.message] - Override the default toast message.
 * @returns {string|null} Toast id, or null when there is nothing to undo.
 */
export function notifyTransactionDeleted(removedEntries, options = {}) {
  if (!Array.isArray(removedEntries) || removedEntries.length === 0) {
    return null;
  }

  const { message = 'Transaction deleted' } = options;

  return showUndoToast(
    message,
    () => {
      // Mark BEFORE restore: the storage-updated re-render reads this marker
      // and gives the restored rows the same green highlight + entrance
      // treatment used for added/edited transactions.
      markTransactionForHighlight(
        removedEntries.map(entry => entry.transaction.id).join(',')
      );

      const restored = TransactionService.restore(removedEntries);
      if (!restored) {
        console.warn(
          '[TransactionUndo] Undo skipped — transactions already present'
        );
      }
    },
    { duration: UNDO_TOAST_DURATION }
  );
}
