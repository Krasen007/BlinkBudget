import { TransactionForm } from '../components/TransactionForm.js';
import { DateInput } from '../components/DateInput.js';
import { TransactionService } from '../core/transaction-service.js';
import { AuthService } from '../core/auth-service.js';
import { Router } from '../core/router.js';
import {
  SPACING,
  TOUCH_TARGETS,
  FONT_SIZES,
  TIMING,
  STORAGE_KEYS,
  COLORS,
} from '../utils/constants.js';
import { createButton } from '../utils/dom-factory.js';
import { markTransactionForHighlight } from '../utils/success-feedback.js';

export const EditView = ({ id }) => {
  const container = document.createElement('div');
  container.className = 'view-edit view-container';

  const transaction = TransactionService.get(id);

  if (!transaction) {
    container.textContent = 'Transaction not found';
    setTimeout(() => Router.navigate('dashboard'), TIMING.ANIMATION_FAST * 10);
    return container;
  }

  // Security: Validate transaction ownership to prevent unauthorized access
  const currentUserId = AuthService.getUserId();
  if (transaction.userId && transaction.userId !== currentUserId) {
    container.textContent = 'Unauthorized access';
    setTimeout(() => Router.navigate('dashboard'), TIMING.ANIMATION_FAST * 10);
    return container;
  }

  const header = document.createElement('div');
  header.style.marginBottom = SPACING.XS;
  header.style.flexDirection = 'column';
  header.style.alignItems = 'stretch';
  header.style.gap = SPACING.SM;
  header.style.position = 'sticky';
  header.style.top = '0';
  header.style.zIndex = '10';
  header.style.background = COLORS.BACKGROUND;
  header.style.padding = `${SPACING.XS} 0`;

  const topRow = document.createElement('div');
  topRow.style.display = 'flex';
  topRow.style.justifyContent = 'space-between';
  topRow.style.alignItems = 'center';

  const title = document.createElement('h2');
  title.textContent = 'Edit Transaction';
  title.style.margin = '0';
  title.style.marginRight = SPACING.MD;

  // Date Input with transaction date and enhanced context
  const dateInput = DateInput({
    value: transaction.timestamp,
    showLabel: false,
  });

  // Back button
  const rightControls = document.createElement('div');
  rightControls.style.display = 'flex';
  rightControls.style.alignItems = 'center';
  rightControls.style.gap = SPACING.SM;

  const smallBackBtn = createButton({
    text: 'Back',
    className: 'btn btn-ghost',
    style: {
      height: TOUCH_TARGETS.MIN_HEIGHT,
      minHeight: TOUCH_TARGETS.MIN_HEIGHT,
      padding: `${SPACING.SM} ${SPACING.MD}`,
      fontSize: FONT_SIZES.SM,
      width: 'auto',
      flexShrink: '0',
    },
    onClick: () => Router.navigate('dashboard'),
  });

  rightControls.appendChild(dateInput);
  rightControls.appendChild(smallBackBtn);

  topRow.appendChild(title);
  topRow.appendChild(rightControls);
  header.appendChild(topRow);
  container.appendChild(header);

  const form = TransactionForm({
    initialValues: transaction,
    externalDateInput: dateInput,
    onSubmit: data => {
      // Check for date change to create a "ghost" of the original transaction
      const originalDate = transaction.timestamp.split('T')[0];
      const newDate = data.timestamp.split('T')[0];

      if (originalDate !== newDate) {
        // REVERSION: If moving back to the VERY FIRST original date, just clear the metadata
        if (
          transaction.originalDate &&
          newDate === transaction.originalDate.split('T')[0]
        ) {
          if (transaction.ghostId) {
            TransactionService.remove(transaction.ghostId);
          }
          data.originalDate = null;
          data.ghostId = null;
        } else {
          // If we already have a ghost (moving for the 2nd/3rd time), reuse it
          if (transaction.ghostId) {
            // Update the existing ghost's info to point to the new destination
            TransactionService.update(transaction.ghostId, {
              movedToDate: data.timestamp,
            });
            // Keep the original metadata
            data.originalDate = transaction.originalDate;
            data.ghostId = transaction.ghostId;
          } else {
            // FIRST MOVE: Create new ghost
            const ghostTransaction = {
              ...transaction,
              isGhost: true,
              movedToDate: data.timestamp,
            };

            delete ghostTransaction.id;
            delete ghostTransaction.ghostId;
            delete ghostTransaction.originalDate;

            const addedGhost = TransactionService.add(ghostTransaction);

            // Link the moved transaction to its ghost
            data.originalDate = transaction.timestamp;
            data.ghostId = addedGhost.id;
          }
        }
      }

      // Update dashboard filter to show the account used for this transaction
      if (data.accountId) {
        sessionStorage.setItem(STORAGE_KEYS.DASHBOARD_FILTER, data.accountId);
      }

      TransactionService.update(id, data);

      // Mark transaction for highlighting in dashboard
      markTransactionForHighlight(id);

      // Navigate to dashboard immediately
      Router.navigate('dashboard');
    },
    onCancel: () => Router.navigate('dashboard'),
    onDelete: () => {
      import('../components/ConfirmDialog.js').then(({ ConfirmDialog }) => {
        ConfirmDialog({
          message: 'Are you sure you want to delete this transaction?',
          onConfirm: () => {
            TransactionService.remove(id);
            Router.navigate('dashboard');
          },
        });
      });
    },
  });

  container.appendChild(form);

  return container;
};
