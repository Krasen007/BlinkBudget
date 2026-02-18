/**
 * Account Management Section Component
 * Handles account listing, renaming, deletion, and creation
 */

import { Button } from './Button.js';
import { AccountService } from '../core/account-service.js';
import { generateId } from '../utils/id-utils.js';
import {
  COLORS,
  SPACING,
  TOUCH_TARGETS,
  FONT_SIZES,
} from '../utils/constants.js';
import { sanitizeInput } from '../utils/security-utils.js';

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
      import('./ConfirmDialog.js')
        .then(({ PromptDialog }) => {
          PromptDialog({
            title: 'Add New Account',
            message: 'Enter account name:',
            placeholder: 'e.g., Checking, Savings, Credit Card',
            confirmText: 'Add',
            onConfirm: async accountName => {
              if (!accountName || accountName.trim().length === 0) {
                return;
              }

              const sanitized = sanitizeInput(accountName.trim());
              const newAccount = {
                id: generateId(),
                name: sanitized,
                type: 'bank',
                balance: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };

              try {
                AccountService.add(newAccount);
                renderAccounts();
              } catch (error) {
                console.error('Error adding account:', error);
              }
            },
          });
        })
        .catch(error => {
          console.error('Error loading ConfirmDialog:', error);
        });
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
        accountType.textContent = account.type || 'bank';
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
        renameBtn.textContent = 'Rename';
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
          import('./ConfirmDialog.js')
            .then(({ PromptDialog }) => {
              PromptDialog({
                title: 'Rename Account',
                message: 'Enter new name:',
                placeholder: account.name,
                confirmText: 'Rename',
                onConfirm: async newName => {
                  if (!newName || newName.trim().length === 0) {
                    return;
                  }

                  try {
                    AccountService.update(account.id, {
                      ...account,
                      name: sanitizeInput(newName.trim()),
                      updatedAt: new Date().toISOString(),
                    });
                    renderAccounts();
                  } catch (error) {
                    console.error('Error renaming account:', error);
                  }
                },
              });
            })
            .catch(error => {
              console.error('Error loading ConfirmDialog:', error);
            });
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
                    AccountService.remove(account.id);
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
