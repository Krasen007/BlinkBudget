/**
 * Account Deletion Section
 * GDPR-compliant account deletion interface
 */

import { Button } from './Button.js';
import { SPACING, TOUCH_TARGETS, FONT_SIZES } from '../utils/constants.js';

export const AccountDeletionSection = () => {
  const section = document.createElement('div');
  section.className = 'settings-section';
  section.style.marginBottom = SPACING.LG;

  // Section header
  const header = document.createElement('div');
  header.style.marginBottom = SPACING.MD;

  const title = document.createElement('h3');
  title.textContent = 'Account Deletion';
  title.style.fontSize = FONT_SIZES.LG;
  title.style.fontWeight = '600';
  title.style.marginTop = SPACING.LG;
  title.style.marginBottom = SPACING.XS;
  title.style.color = 'var(--color-danger)';

  const description = document.createElement('p');
  description.textContent =
    'Permanently delete your account and all associated data. This action cannot be undone.';
  description.style.fontSize = FONT_SIZES.SM;
  description.style.color = 'var(--color-text-secondary)';
  description.style.marginBottom = SPACING.SM;
  description.style.lineHeight = '1.5';

  header.appendChild(title);
  header.appendChild(description);
  section.appendChild(header);

  // Warning box
  const warningBox = document.createElement('div');
  warningBox.style.backgroundColor = 'rgba(220, 38, 38, 0.1)';
  warningBox.style.border = '1px solid var(--color-danger)';
  warningBox.style.borderRadius = '8px';
  warningBox.style.padding = SPACING.MD;
  warningBox.style.marginBottom = SPACING.MD;

  const warningTitle = document.createElement('div');
  warningTitle.textContent = '⚠️ Warning: Irreversible Action';
  warningTitle.style.fontWeight = '600';
  warningTitle.style.color = 'var(--color-danger)';
  warningTitle.style.marginBottom = SPACING.XS;

  const warningText = document.createElement('div');
  warningText.innerHTML = `
    <div style="font-size: ${FONT_SIZES.SM}; line-height: 1.6; color: var(--color-text-secondary);">
      <p style="margin-bottom: ${SPACING.XS};">• All your transactions, accounts, goals, and settings will be permanently deleted</p>
      <p style="margin-bottom: ${SPACING.XS};">• You will be automatically logged out</p>
      <p style="margin-bottom: ${SPACING.XS};">• A final data export will be provided for your records</p>
      <p style="margin-bottom: 0;">• This action complies with GDPR "right to be forgotten"</p>
    </div>
  `;

  warningBox.appendChild(warningTitle);
  warningBox.appendChild(warningText);
  section.appendChild(warningBox);

  // Data summary (loaded dynamically)
  const dataSummaryBox = document.createElement('div');
  dataSummaryBox.style.backgroundColor = 'var(--color-background-secondary)';
  dataSummaryBox.style.borderRadius = '8px';
  dataSummaryBox.style.padding = SPACING.MD;
  dataSummaryBox.style.marginBottom = SPACING.MD;
  dataSummaryBox.style.display = 'none'; // Hidden initially

  const summaryTitle = document.createElement('div');
  summaryTitle.textContent = '📊 Your Data Summary:';
  summaryTitle.style.fontWeight = '600';
  summaryTitle.style.marginBottom = SPACING.XS;

  const summaryContent = document.createElement('div');
  summaryContent.style.fontSize = FONT_SIZES.SM;
  summaryContent.style.color = 'var(--color-text-secondary)';

  dataSummaryBox.appendChild(summaryTitle);
  dataSummaryBox.appendChild(summaryContent);
  section.appendChild(dataSummaryBox);

  // Delete Account Button
  const deleteBtn = Button({
    text: '🗑️ Delete My Account',
    variant: 'danger',
    onClick: async () => {
      try {
        // Show loading state
        deleteBtn.disabled = true;
        deleteBtn.textContent = '⏳ Loading...';

        // Load data summary
        const { accountDeletionService } =
          await import('../core/Account/account-deletion-service.js');
        const dataSummary = await accountDeletionService.getUserDataSummary();

        // Show data summary
        // Clear previous content
        summaryContent.innerHTML = '';

        const grid = document.createElement('div');
        Object.assign(grid.style, {
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: SPACING.XS,
          fontSize: FONT_SIZES.SM,
        });

        const items = [
          ['Transactions', dataSummary.transactions],
          ['Accounts', dataSummary.accounts],
          ['Goals', dataSummary.goals],
          ['Investments', dataSummary.investments],
          ['Budgets', dataSummary.budgets],
          ['Settings', dataSummary.settings],
          [
            'Storage Size',
            `${(Number(dataSummary.totalStorageSize) / 1024).toFixed(1)} KB`,
          ],
        ];

        items.forEach(([label, value]) => {
          const labelSpan = document.createElement('span');
          labelSpan.textContent = `• ${label}:`;
          const valueSpan = document.createElement('span');
          const strong = document.createElement('strong');
          strong.textContent = String(value);
          valueSpan.appendChild(strong);
          grid.appendChild(labelSpan);
          grid.appendChild(valueSpan);
        });

        summaryContent.appendChild(grid);
        dataSummaryBox.style.display = 'block';

        deleteBtn.textContent = '⚠️ Confirm Deletion';
        deleteBtn.disabled = false;

        // Change button to show confirmation on next click
        deleteBtn.onclick = async () => {
          try {
            // Final confirmation
            const { MobileAlert } = await import('./MobileModal.js');
            const confirmed = await MobileAlert({
              title: '🚨 Final Confirmation',
              message: `Are you absolutely sure you want to delete your account and all ${dataSummary.transactions} transactions? This cannot be undone.`,
              buttonText: 'Yes, Delete Everything',
              cancelButtonText: 'Cancel',
              showCancel: true,
            });

            if (!confirmed) {
              deleteBtn.textContent = '🗑️ Delete My Account';
              return;
            }

            // Show loading state
            deleteBtn.disabled = true;
            deleteBtn.textContent = '🗑️ Deleting...';

            // Start deletion process
            const result =
              await accountDeletionService.initiateAccountDeletion();

            if (result.success) {
              const { MobileAlert } = await import('./MobileModal.js');
              await MobileAlert({
                title: '✅ Account Deleted',
                message: `Your account has been successfully deleted. ${result.dataDeleted.transactions} transactions and all associated data have been removed.`,
                buttonText: 'OK',
              });

              // Redirect to landing page
              window.location.href = '/';
            } else if (result.requiresReauth) {
              const { MobileAlert } = await import('./MobileModal.js');
              await MobileAlert({
                title: '🔒 Security Check',
                message:
                  'For your security, account deletion requires a recent login. Please log out and log back in, then try again.',
                buttonText: 'Log Out Now',
              });

              // Logout and redirect
              const { AuthService } = await import('../core/auth-service.js');
              await AuthService.logout();
              window.location.hash = '#login';
            } else {
              throw new Error(`Deletion failed: ${result.errors.join(', ')}`);
            }
          } catch (error) {
            console.error('Account deletion failed:', error);
            const { MobileAlert } = await import('./MobileModal.js');
            MobileAlert({
              title: '❌ Deletion Failed',
              message: `Account deletion failed: ${error.message}`,
              buttonText: 'OK',
            });

            deleteBtn.textContent = '🗑️ Delete My Account';
            deleteBtn.disabled = false;
          }
        };
      } catch (error) {
        console.error('Failed to load account deletion service:', error);
        const { MobileAlert } = await import('./MobileModal.js');
        MobileAlert({
          title: '❌ Error',
          message: `Failed to initialize deletion process: ${error.message}`,
          buttonText: 'OK',
        });

        deleteBtn.textContent = '🗑️ Delete My Account';
        deleteBtn.disabled = false;
      }
    },
  });

  deleteBtn.className += ' touch-target mobile-form-button';
  Object.assign(deleteBtn.style, {
    width: '100%',
    minHeight: TOUCH_TARGETS.MIN_HEIGHT,
    padding: SPACING.MD,
    fontSize: FONT_SIZES.BASE,
    borderColor: 'var(--color-danger)',
    color: 'var(--color-danger-light)',
    background: 'rgba(220, 38, 38, 0.1)',
    fontWeight: '600',
  });

  section.appendChild(deleteBtn);

  // Help text
  const helpText = document.createElement('div');
  helpText.innerHTML = `
    <div style="margin-top: ${SPACING.MD}; padding-top: ${SPACING.MD}; border-top: 1px solid var(--color-border);">
      <p style="font-size: ${FONT_SIZES.XS}; color: var(--color-text-tertiary); line-height: 1.5; margin: 0;">
        <strong>Need help?</strong> Contact us at support@blinkbudget.app for assistance with account deletion or data export requests.
      </p>
    </div>
  `;
  section.appendChild(helpText);

  return section;
};
