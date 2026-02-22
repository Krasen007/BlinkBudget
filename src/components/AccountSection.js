/**
 * Account Management Section Component
 * Handles account listing, renaming, deletion, and creation
 */

import { Button } from './Button.js';
import { AccountService } from '../core/Account/account-service.js';
import { generateId } from '../utils/id-utils.js';
import {
  COLORS,
  SPACING,
  TOUCH_TARGETS,
  FONT_SIZES,
} from '../utils/constants.js';
import { sanitizeInput } from '../utils/security-utils.js';
import { getAccountTypeLabel } from '../utils/constants.js';

export const AccountSection = () => {
  const section = document.createElement('div');
  section.className = 'card mobile-settings-card';
  section.style.marginBottom = SPACING.LG;

  const title = document.createElement('h3');
  title.textContent = 'Accounts';
  title.className = 'mobile-settings-title';
  title.style.marginBottom = SPACING.MD;

  section.appendChild(title);

  // Account List Container
  const accountListContainer = document.createElement('div');
  accountListContainer.style.display = 'flex';
  accountListContainer.style.flexDirection = 'column';
  accountListContainer.style.gap = SPACING.SM;

  // Add Account Button
  const addAccountBtn = Button({
    text: 'Add Account',
    variant: 'primary',
    onClick: () => {
      const showAccountCreationDialog = () => {
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        overlay.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        `;

        const card = document.createElement('div');
        card.className = 'dialog-card';
        card.setAttribute('role', 'dialog');
        card.setAttribute('aria-modal', 'true');
        card.setAttribute('aria-labelledby', 'add-account-title');
        card.tabIndex = -1;
        card.style.cssText = `
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          padding: var(--spacing-lg);
          border-radius: var(--radius-lg);
          max-width: 400px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        `;

        const titleEl = document.createElement('h3');
        titleEl.id = 'add-account-title';
        titleEl.textContent = 'Add New Account';
        titleEl.style.cssText = `
          margin-bottom: var(--spacing-md);
          text-align: center;
          color: var(--color-text-main);
          font-size: var(--font-size-lg);
          font-weight: 600;
        `;

        // Name input
        const nameLabel = document.createElement('label');
        nameLabel.textContent = 'Account Name:';
        nameLabel.style.cssText = `
          display: block;
          margin-bottom: var(--spacing-xs);
          font-weight: 500;
          color: var(--color-text-main);
        `;

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = 'e.g., Checking, Cash, Credit Card';
        nameInput.style.cssText = `
          width: 100%;
          padding: var(--spacing-md);
          margin-bottom: var(--spacing-xs);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: var(--font-size-base);
          background: var(--color-background);
          color: var(--color-text-main);
          box-sizing: border-box;
          transition: border-color 0.2s ease;
        `;

        const errorText = document.createElement('span');
        errorText.style.cssText = `
          display: block;
          color: var(--color-danger, #ef4444);
          font-size: var(--font-size-sm);
          margin-bottom: var(--spacing-md);
          min-height: 20px;
          opacity: 0;
          transition: opacity 0.2s ease;
        `;

        // Add focus styles
        nameInput.addEventListener('focus', () => {
          nameInput.style.borderColor =
            nameInput.getAttribute('aria-invalid') === 'true'
              ? 'var(--color-danger, #ef4444)'
              : 'var(--color-primary)';
          nameInput.style.outline = 'none';
          nameInput.style.boxShadow =
            nameInput.getAttribute('aria-invalid') === 'true'
              ? '0 0 0 3px rgba(239, 68, 68, 0.1)'
              : '0 0 0 3px rgba(59, 130, 246, 0.1)';
        });

        nameInput.addEventListener('blur', () => {
          nameInput.style.borderColor =
            nameInput.getAttribute('aria-invalid') === 'true'
              ? 'var(--color-danger, #ef4444)'
              : 'var(--color-border)';
          nameInput.style.boxShadow = 'none';
        });

        nameInput.addEventListener('input', () => {
          nameInput.setAttribute('aria-invalid', 'false');
          nameInput.style.borderColor = 'var(--color-primary)';
          errorText.style.opacity = '0';
          errorText.textContent = '';
        });

        // Account type selection
        const typeLabel = document.createElement('label');
        typeLabel.textContent = 'Account Type:';
        typeLabel.style.cssText = `
          display: block;
          margin-bottom: var(--spacing-xs);
          font-weight: 500;
          color: var(--color-text-main);
        `;

        const typeSelect = document.createElement('select');
        typeSelect.style.cssText = `
          width: 100%;
          padding: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-size: var(--font-size-base);
          background: var(--color-background);
          color: var(--color-text-main);
          box-sizing: border-box;
          transition: border-color 0.2s ease;
          cursor: pointer;
        `;

        // Add focus styles for select
        typeSelect.addEventListener('focus', () => {
          typeSelect.style.borderColor = 'var(--color-primary)';
          typeSelect.style.outline = 'none';
          typeSelect.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
        });

        typeSelect.addEventListener('blur', () => {
          typeSelect.style.borderColor = 'var(--color-border)';
          typeSelect.style.boxShadow = 'none';
        });

        const accountTypes = [
          { value: 'checking', label: 'Checking Account' },
          { value: 'bank', label: 'Bank Account' },
          { value: 'credit', label: 'Credit Card' },
          { value: 'savings', label: 'Savings Account' },
          { value: 'investment', label: 'Investment Account' },
          { value: 'cash', label: 'Cash' },
          { value: 'other', label: 'Other' },
        ];

        accountTypes.forEach(type => {
          const option = document.createElement('option');
          option.value = type.value;
          option.textContent = type.label;
          option.style.background = 'var(--color-background)';
          option.style.color = 'var(--color-text-main)';
          typeSelect.appendChild(option);
        });

        const btnGroup = document.createElement('div');
        btnGroup.style.display = 'flex';
        btnGroup.style.gap = 'var(--spacing-md)';

        const cancelBtn = Button({
          text: 'Cancel',
          variant: 'secondary',
          onClick: () => {
            cleanupOverlay();
          },
        });

        const saveBtn = Button({
          text: 'Add Account',
          variant: 'primary',
          onClick: async () => {
            const accountName = nameInput.value.trim();
            const accountType = typeSelect.value;

            if (!accountName) {
              nameInput.setAttribute('aria-invalid', 'true');
              nameInput.style.borderColor = 'var(--color-danger, #ef4444)';
              errorText.textContent = 'Account name is required';
              errorText.style.opacity = '1';
              nameInput.focus();
              return;
            }

            try {
              const sanitized = sanitizeInput(accountName);
              const newAccount = {
                id: generateId(),
                name: sanitized,
                type: accountType,
                balance: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };

              AccountService.saveAccount(newAccount);
              renderAccounts();
              cleanupOverlay();
            } catch (error) {
              console.error('Error adding account:', error);
              // Show error dialog to user
              import('./ConfirmDialog.js')
                .then(({ AlertDialog }) => {
                  AlertDialog({
                    message: 'Failed to add account. Please try again.',
                  });
                })
                .catch(() => {
                  errorText.textContent =
                    'Failed to add account. Please try again.';
                  errorText.style.opacity = '1';
                });
            }
          },
        });

        cancelBtn.style.flex = '1';
        saveBtn.style.flex = '1';

        btnGroup.appendChild(cancelBtn);
        btnGroup.appendChild(saveBtn);

        card.appendChild(titleEl);
        card.appendChild(nameLabel);
        card.appendChild(nameInput);
        card.appendChild(errorText);
        card.appendChild(typeLabel);
        card.appendChild(typeSelect);
        card.appendChild(btnGroup);
        overlay.appendChild(card);

        document.body.appendChild(overlay);
        setTimeout(() => {
          card.focus();
          nameInput.focus();
        }, 100);

        // Centralized cleanup for this overlay and the Escape listener
        function cleanupOverlay() {
          if (document.body.contains(overlay)) {
            document.body.removeChild(overlay);
          }
          document.removeEventListener('keydown', handleEscape);
        }

        // Close overlay when clicking outside (uses centralized cleanup)
        overlay.addEventListener('click', e => {
          if (e.target === overlay) {
            cleanupOverlay();
          }
        });

        // Close on Escape key
        function handleEscape(e) {
          if (e.key === 'Escape') {
            e.preventDefault();
            cleanupOverlay();
          }
        }
        document.addEventListener('keydown', handleEscape);
      };

      showAccountCreationDialog();
    },
  });

  addAccountBtn.className += ' touch-target mobile-form-button';
  Object.assign(addAccountBtn.style, {
    width: '100%',
    minHeight: TOUCH_TARGETS.MIN_HEIGHT,
    padding: SPACING.MD,
    fontSize: FONT_SIZES.BASE,
  });

  section.appendChild(addAccountBtn);

  // Render accounts
  const renderAccounts = () => {
    // Clear existing accounts
    while (accountListContainer.firstChild) {
      accountListContainer.removeChild(accountListContainer.firstChild);
    }

    try {
      const accounts = AccountService.getAccounts();

      if (accounts.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.style.cssText = `
          text-align: center;
          padding: ${SPACING.LG};
          color: ${COLORS.TEXT_MUTED};
          font-size: var(--font-size-sm);
        `;
        emptyState.textContent =
          'No accounts yet. Add your first account above.';
        accountListContainer.appendChild(emptyState);
        return;
      }

      accounts.forEach(account => {
        const accountItem = document.createElement('div');
        accountItem.style.cssText = `
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: ${SPACING.SM} ${SPACING.MD};
          background: ${COLORS.SURFACE};
          border: 1px solid ${COLORS.BORDER};
          border-radius: 8px;
          margin-bottom: ${SPACING.XS};
        `;

        const accountInfo = document.createElement('div');
        accountInfo.style.cssText = `
          flex: 1;
        `;

        const accountName = document.createElement('div');
        accountName.textContent = account.name;
        accountName.style.cssText = `
          font-weight: 500;
          color: ${COLORS.TEXT_PRIMARY};
          margin-bottom: 2px;
        `;

        const accountType = document.createElement('div');
        accountType.textContent = getAccountTypeLabel(account.type);
        accountType.style.cssText = `
          font-size: var(--font-size-sm);
          color: ${COLORS.TEXT_MUTED};
        `;

        accountInfo.appendChild(accountName);
        accountInfo.appendChild(accountType);

        const actionsContainer = document.createElement('div');
        actionsContainer.style.display = 'flex';
        actionsContainer.style.gap = SPACING.XS;

        // Rename Button
        const renameBtn = document.createElement('button');
        renameBtn.textContent = 'Edit';
        renameBtn.style.cssText = `
          padding: ${SPACING.XS} ${SPACING.SM};
          background: ${COLORS.PRIMARY};
          color: white;
          border: none;
          border-radius: 4px;
          font-size: ${FONT_SIZES.SM};
          cursor: pointer;
          min-height: 32px;
        `;
        renameBtn.addEventListener('click', () => {
          const showAccountEditDialog = () => {
            const overlay = document.createElement('div');
            overlay.className = 'dialog-overlay';
            overlay.style.cssText = `
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: rgba(0, 0, 0, 0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 1000;
            `;

            const card = document.createElement('div');
            card.className = 'dialog-card';
            card.setAttribute('role', 'dialog');
            card.setAttribute('aria-modal', 'true');
            card.setAttribute('aria-labelledby', 'edit-account-title');
            card.tabIndex = -1;
            card.style.cssText = `
              background: var(--color-surface);
              border: 1px solid var(--color-border);
              padding: var(--spacing-lg);
              border-radius: var(--radius-lg);
              max-width: 400px;
              width: 90%;
              max-height: 80vh;
              overflow-y: auto;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            `;

            const titleEl = document.createElement('h3');
            titleEl.id = 'edit-account-title';
            titleEl.textContent = 'Edit Account';
            titleEl.style.cssText = `
              margin-bottom: var(--spacing-md);
              text-align: center;
              color: var(--color-text-main);
              font-size: var(--font-size-lg);
              font-weight: 600;
            `;

            // Name input
            const nameLabel = document.createElement('label');
            nameLabel.textContent = 'Account Name:';
            nameLabel.style.cssText = `
              display: block;
              margin-bottom: var(--spacing-xs);
              font-weight: 500;
              color: var(--color-text-main);
            `;

            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.value = account.name;
            nameInput.style.cssText = `
              width: 100%;
              padding: var(--spacing-md);
              margin-bottom: var(--spacing-xs);
              border: 1px solid var(--color-border);
              border-radius: var(--radius-md);
              font-size: var(--font-size-base);
              background: var(--color-background);
              color: var(--color-text-main);
              box-sizing: border-box;
              transition: border-color 0.2s ease;
            `;

            const errorText = document.createElement('span');
            errorText.style.cssText = `
              display: block;
              color: var(--color-danger, #ef4444);
              font-size: var(--font-size-sm);
              margin-bottom: var(--spacing-md);
              min-height: 20px;
              opacity: 0;
              transition: opacity 0.2s ease;
            `;

            // Add focus styles
            nameInput.addEventListener('focus', () => {
              nameInput.style.borderColor =
                nameInput.getAttribute('aria-invalid') === 'true'
                  ? 'var(--color-danger, #ef4444)'
                  : 'var(--color-primary)';
              nameInput.style.outline = 'none';
              nameInput.style.boxShadow =
                nameInput.getAttribute('aria-invalid') === 'true'
                  ? '0 0 0 3px rgba(239, 68, 68, 0.1)'
                  : '0 0 0 3px rgba(59, 130, 246, 0.1)';
            });

            nameInput.addEventListener('blur', () => {
              nameInput.style.borderColor =
                nameInput.getAttribute('aria-invalid') === 'true'
                  ? 'var(--color-danger, #ef4444)'
                  : 'var(--color-border)';
              nameInput.style.boxShadow = 'none';
            });

            nameInput.addEventListener('input', () => {
              nameInput.setAttribute('aria-invalid', 'false');
              nameInput.style.borderColor = 'var(--color-primary)';
              errorText.style.opacity = '0';
              errorText.textContent = '';
            });

            // Account type selection
            const typeLabel = document.createElement('label');
            typeLabel.textContent = 'Account Type:';
            typeLabel.style.cssText = `
              display: block;
              margin-bottom: var(--spacing-xs);
              font-weight: 500;
              color: var(--color-text-main);
            `;

            const typeSelect = document.createElement('select');
            typeSelect.style.cssText = `
              width: 100%;
              padding: var(--spacing-md);
              margin-bottom: var(--spacing-lg);
              border: 1px solid var(--color-border);
              border-radius: var(--radius-md);
              font-size: var(--font-size-base);
              background: var(--color-background);
              color: var(--color-text-main);
              box-sizing: border-box;
              transition: border-color 0.2s ease;
              cursor: pointer;
            `;

            const accountTypes = [
              { value: 'checking', label: 'Checking Account' },
              { value: 'bank', label: 'Bank Account' },
              { value: 'credit', label: 'Credit Card' },
              { value: 'savings', label: 'Savings Account' },
              { value: 'investment', label: 'Investment Account' },
              { value: 'cash', label: 'Cash' },
              { value: 'other', label: 'Other' },
            ];

            accountTypes.forEach(type => {
              const option = document.createElement('option');
              option.value = type.value;
              option.textContent = type.label;
              option.style.background = 'var(--color-background)';
              option.style.color = 'var(--color-text-main)';
              if (type.value === account.type) {
                option.selected = true;
              }
              typeSelect.appendChild(option);
            });

            // Add focus styles for select
            typeSelect.addEventListener('focus', () => {
              typeSelect.style.borderColor = 'var(--color-primary)';
              typeSelect.style.outline = 'none';
              typeSelect.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
            });

            typeSelect.addEventListener('blur', () => {
              typeSelect.style.borderColor = 'var(--color-border)';
              typeSelect.style.boxShadow = 'none';
            });

            const btnGroup = document.createElement('div');
            btnGroup.style.display = 'flex';
            btnGroup.style.gap = 'var(--spacing-md)';

            const cancelBtn = Button({
              text: 'Cancel',
              variant: 'secondary',
              onClick: () => {
                cleanupOverlay();
              },
            });

            const saveBtn = Button({
              text: 'Save Changes',
              variant: 'primary',
              onClick: async () => {
                const accountName = nameInput.value.trim();
                const accountType = typeSelect.value;

                if (!accountName) {
                  nameInput.setAttribute('aria-invalid', 'true');
                  nameInput.style.borderColor = 'var(--color-danger, #ef4444)';
                  errorText.textContent = 'Account name is required';
                  errorText.style.opacity = '1';
                  nameInput.focus();
                  return;
                }

                try {
                  AccountService.saveAccount({
                    ...account,
                    name: sanitizeInput(accountName),
                    type: accountType,
                    updatedAt: new Date().toISOString(),
                  });
                  renderAccounts();
                  cleanupOverlay();
                } catch (error) {
                  console.error('Error updating account:', error);
                  // Show error inline in the dialog
                  errorText.textContent =
                    'Failed to update account. Please try again.';
                  errorText.style.opacity = '1';
                }
              },
            });

            cancelBtn.style.flex = '1';
            saveBtn.style.flex = '1';

            btnGroup.appendChild(cancelBtn);
            btnGroup.appendChild(saveBtn);

            card.appendChild(titleEl);
            card.appendChild(nameLabel);
            card.appendChild(nameInput);
            card.appendChild(errorText);
            card.appendChild(typeLabel);
            card.appendChild(typeSelect);
            card.appendChild(btnGroup);
            overlay.appendChild(card);

            document.body.appendChild(overlay);
            setTimeout(() => {
              card.focus();
              nameInput.focus();
            }, 100);

            // Centralized cleanup for this overlay and the Escape listener
            function cleanupOverlay() {
              if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
              }
              document.removeEventListener('keydown', handleEscape);
            }

            // Close overlay when clicking outside (uses centralized cleanup)
            overlay.addEventListener('click', e => {
              if (e.target === overlay) {
                cleanupOverlay();
              }
            });

            // Close on Escape key
            function handleEscape(e) {
              if (e.key === 'Escape') {
                e.preventDefault();
                cleanupOverlay();
              }
            }
            document.addEventListener('keydown', handleEscape);
          };

          showAccountEditDialog();
        });

        // Delete Button
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.style.cssText = `
          padding: ${SPACING.XS} ${SPACING.SM};
          background: ${COLORS.DANGER};
          color: white;
          border: none;
          border-radius: 4px;
          font-size: ${FONT_SIZES.SM};
          cursor: pointer;
          min-height: 32px;
        `;
        deleteBtn.addEventListener('click', () => {
          import('./ConfirmDialog.js')
            .then(({ ConfirmDialog, AlertDialog }) => {
              ConfirmDialog({
                title: 'Delete Account',
                message: `Are you sure you want to delete "${account.name}"? This action cannot be undone.`,
                confirmText: 'Delete',
                cancelText: 'Cancel',
                onConfirm: async () => {
                  try {
                    AccountService.deleteAccount(account.id);
                    renderAccounts();
                  } catch (error) {
                    console.error('Error deleting account:', error);
                    AlertDialog({
                      message: 'Failed to delete account. Please try again.',
                    });
                  }
                },
              });
            })
            .catch(error => {
              console.error('Error loading ConfirmDialog:', error);
            });
        });

        actionsContainer.appendChild(renameBtn);
        actionsContainer.appendChild(deleteBtn);

        accountItem.appendChild(accountInfo);
        accountItem.appendChild(actionsContainer);
        accountListContainer.appendChild(accountItem);
      });
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  // Initial render
  renderAccounts();

  section.appendChild(accountListContainer);

  return section;
};
