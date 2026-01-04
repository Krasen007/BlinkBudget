import { TransactionForm } from '../components/TransactionForm.js';
import { DateInput } from '../components/DateInput.js';
import { TransactionService } from '../core/transaction-service.js';
import { Router } from '../core/router.js';
import {
  SPACING,
  DIMENSIONS,
  TOUCH_TARGETS,
  FONT_SIZES,
  STORAGE_KEYS,
} from '../utils/constants.js';
import { createButton } from '../utils/dom-factory.js';
import { markTransactionForHighlight } from '../utils/success-feedback.js';

export const AddView = ({ accountId } = {}) => {
  const container = document.createElement('div');
  container.className = 'view-add view-container';

  const header = document.createElement('div');
  header.style.marginBottom = SPACING.MD;
  header.style.flexDirection = 'column';
  header.style.alignItems = 'stretch';
  header.style.gap = SPACING.SM;

  const topRow = document.createElement('div');
  topRow.style.display = 'flex';
  topRow.style.justifyContent = 'space-between';
  topRow.style.alignItems = 'flex-end';

  const title = document.createElement('h2');
  title.textContent = 'Add Transaction';
  title.style.margin = '0';
  title.style.marginRight = SPACING.MD;

  // Date Input with enhanced context
  const dateInput = DateInput({ showLabel: true });

  // Back button
  const rightControls = document.createElement('div');
  rightControls.style.display = 'flex';
  rightControls.style.alignItems = 'flex-end';
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
    initialValues: { accountId },
    externalDateInput: dateInput.querySelector('input[type="date"]'),
    showCancelButton: true, // Add cancel button to the form
    onSubmit: data => {
      // Update dashboard filter to show the account used for this transaction
      if (data.accountId) {
        sessionStorage.setItem(STORAGE_KEYS.DASHBOARD_FILTER, data.accountId);
      }

      // Add the transaction and get the full transaction object
      const newTransaction = TransactionService.add(data);

      // Mark transaction for highlighting in dashboard
      markTransactionForHighlight(newTransaction.id);

      // Navigate to dashboard immediately
      Router.navigate('dashboard');
    },
    onCancel: () => Router.navigate('dashboard'),
  });
  container.appendChild(form);

  return container;
};
