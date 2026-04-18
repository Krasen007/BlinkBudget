import { TransactionForm } from '../components/TransactionForm.js';
import { DateInput } from '../components/DateInput.js';
import { TransactionService } from '../core/transaction-service.js';
import { Router } from '../core/router.js';
import { ClickTracker } from '../core/click-tracking-service.js';
import {
  SPACING,
  TOUCH_TARGETS,
  FONT_SIZES,
  STORAGE_KEYS,
} from '../utils/constants.js';
import { createButton } from '../utils/dom-factory.js';
import { markTransactionForHighlight } from '../utils/success-feedback.js';

export const AddView = ({ accountId, amount } = {}) => {
  // Start tracking the transaction flow
  ClickTracker.startTransactionFlow();

  const container = document.createElement('div');
  container.className = 'view-add view-container';

  const header = document.createElement('div');
  header.style.position = 'sticky';
  header.style.top = '0';
  header.style.zIndex = '10';
  header.style.background = 'var(--color-background)'; // Use CSS variable
  header.style.padding = `${SPACING.XS} 0`;
  header.style.flexDirection = 'column';
  header.style.alignItems = 'stretch';
  header.style.gap = SPACING.SM;

  const topRow = document.createElement('div');
  topRow.style.display = 'flex';
  topRow.style.justifyContent = 'space-between';
  topRow.style.alignItems = 'center';

  const title = document.createElement('h2');
  title.textContent = 'Add Transaction';
  title.style.margin = '0';
  title.style.marginRight = SPACING.MD;

  // Date Input with enhanced context
  const dateInput = DateInput({ showLabel: false });

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
    initialValues: { accountId, amount },
    externalDateInput: dateInput,
    showCancelButton: true, // Add cancel button to the form
    onSubmit: data => {
      // Record the final click (submit action)
      ClickTracker.recordClick();

      // Complete tracking and get metrics
      const metrics = ClickTracker.completeTransactionFlow();

      // Log metrics for debugging (can be removed in production)
      if (metrics) {
        console.log(
          `Transaction completed: ${metrics.clicks} clicks, ${metrics.duration.toFixed(1)}s`
        );
      }

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
    onCancel: () => {
      // Cancel tracking if user backs out
      ClickTracker.cancelTransactionFlow();
      Router.navigate('dashboard');
    },
  });
  container.appendChild(form);

  // Handle Escape key to navigate back to dashboard
  const handleKeyDown = e => {
    if (e.key === 'Escape') {
      e.preventDefault();
      // Cancel tracking if user backs out
      ClickTracker.cancelTransactionFlow();
      Router.navigate('dashboard');
    }
  };

  window.addEventListener('keydown', handleKeyDown);

  container.cleanup = () => {
    window.removeEventListener('keydown', handleKeyDown);
  };

  return container;
};
