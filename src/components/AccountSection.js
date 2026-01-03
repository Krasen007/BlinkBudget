/**
 * Account Management Section Component
 * Handles account listing, renaming, deletion, and creation
 */

import { Button } from './Button.js';
import { AccountService } from '../core/account-service.js';
import { generateId } from '../utils/id-utils.js';
import { ConfirmDialog, AlertDialog, PromptDialog } from './ConfirmDialog.js';
import { COLORS, SPACING, TOUCH_TARGETS, FONT_SIZES, HAPTIC_PATTERNS, ACCOUNT_TYPES } from '../utils/constants.js';
import { createInput, createSelect, createFlexContainer } from '../utils/dom-factory.js';
import { addTouchFeedback } from '../utils/touch-utils.js';
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

    const accountList = document.createElement('div');
    accountList.className = 'mobile-account-list';
    Object.assign(accountList.style, {
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.MD,
        marginBottom: SPACING.MD
    });

    const renderAccounts = () => {
        accountList.innerHTML = '';
        const accounts = AccountService.getAccounts();

        accounts.forEach(acc => {
            const item = document.createElement('div');
            item.className = 'mobile-account-item';
            Object.assign(item.style, {
                display: 'flex',
                flexDirection: 'column',
                gap: SPACING.XS,
                padding: SPACING.MD,
                border: `1px solid ${COLORS.BORDER}`,
                borderRadius: 'var(--radius-md)',
                background: COLORS.SURFACE_HOVER,
                minHeight: TOUCH_TARGETS.MIN_HEIGHT
            });

            const info = document.createElement('div');
            info.className = 'mobile-account-info';
            Object.assign(info.style, {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: SPACING.MD,
                width: '100%'
            });

            const name = document.createElement('div');
            name.className = 'mobile-account-name-container';
            name.textContent = acc.name + (acc.isDefault ? ' (Default)' : '');
            Object.assign(name.style, {
                fontWeight: '600',
                fontSize: FONT_SIZES.BASE,
                color: acc.isDefault ? COLORS.PRIMARY_LIGHT : COLORS.TEXT_MAIN,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: '1'
            });

            const type = document.createElement('div');
            type.textContent = acc.type.charAt(0).toUpperCase() + acc.type.slice(1);
            Object.assign(type.style, {
                fontSize: '0.75rem',
                color: COLORS.TEXT_MUTED,
                flexShrink: '0'
            });

            info.appendChild(name);
            info.appendChild(type);

            const actions = createFlexContainer({
                className: 'mobile-account-actions',
                direction: 'row',
                gap: SPACING.MD,
                style: {
                    flexWrap: 'wrap',
                    marginTop: SPACING.SM
                }
            });

            // Rename button
            const renameBtn = document.createElement('button');
            renameBtn.textContent = 'Rename';
            renameBtn.className = 'btn btn-ghost touch-target mobile-action-btn';
            Object.assign(renameBtn.style, {
                fontSize: FONT_SIZES.SM,
                padding: `${SPACING.MD} ${SPACING.LG}`,
                minHeight: TOUCH_TARGETS.MIN_HEIGHT,
                minWidth: TOUCH_TARGETS.MIN_HEIGHT,
                flex: '1'
            });
            renameBtn.style.flex = '1';
            renameBtn.onclick = () => {
                PromptDialog({
                    title: 'Rename Account',
                    initialValue: acc.name,
                    placeholder: 'Account Name',
                    onSave: (newName) => {
                        if (newName && newName.trim() !== '') {
                            const trimmedName = sanitizeInput(newName.trim(), 50); // Typical account name limit
                            if (AccountService.isAccountDuplicate(trimmedName, acc.type, acc.id)) {
                                AlertDialog({ message: `An account named "${trimmedName}" of type "${acc.type}" already exists.` });
                                return;
                            }
                            acc.name = trimmedName;
                            AccountService.saveAccount(acc);
                            renderAccounts();
                        }
                    }
                });
            };
            actions.appendChild(renameBtn);

            if (!acc.isDefault) {
                // Set Default button
                const makeDefaultBtn = document.createElement('button');
                makeDefaultBtn.textContent = 'Set Default';
                makeDefaultBtn.className = 'btn btn-ghost touch-target mobile-action-btn';
                Object.assign(makeDefaultBtn.style, {
                    fontSize: FONT_SIZES.SM,
                    padding: `${SPACING.MD} ${SPACING.LG}`,
                    minHeight: TOUCH_TARGETS.MIN_HEIGHT,
                    minWidth: TOUCH_TARGETS.MIN_HEIGHT,
                    flex: '1'
                });
                makeDefaultBtn.style.flex = '1';
                makeDefaultBtn.onclick = () => {
                    acc.isDefault = true;
                    AccountService.saveAccount(acc);
                    renderAccounts();
                    if (window.mobileUtils?.supportsHaptic()) {
                        window.mobileUtils.hapticFeedback(HAPTIC_PATTERNS.LIGHT);
                    }
                };
                actions.appendChild(makeDefaultBtn);

                // Delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Delete';
                deleteBtn.className = 'btn btn-ghost touch-target mobile-action-btn mobile-delete-btn';
                Object.assign(deleteBtn.style, {
                    color: COLORS.ERROR,
                    fontSize: FONT_SIZES.SM,
                    padding: `${SPACING.MD} ${SPACING.LG}`,
                    minHeight: TOUCH_TARGETS.MIN_HEIGHT,
                    minWidth: TOUCH_TARGETS.MIN_HEIGHT,
                    flex: '1'
                });
                deleteBtn.style.flex = '1';
                deleteBtn.onclick = () => {
                    ConfirmDialog({
                        title: `Delete account "${acc.name}"?`,
                        message: 'Transactions will remain but might be orphaned if not handled.',
                        onConfirm: () => {
                            if (AccountService.deleteAccount(acc.id)) {
                                renderAccounts();
                                if (window.mobileUtils?.supportsHaptic()) {
                                    window.mobileUtils.hapticFeedback([20, 10, 20]);
                                }
                            } else {
                                AlertDialog({ message: 'Cannot delete the last account.' });
                            }
                        }
                    });
                };
                actions.appendChild(deleteBtn);
            }

            item.appendChild(info);
            item.appendChild(actions);
            accountList.appendChild(item);
        });
    };

    renderAccounts();
    section.appendChild(accountList);

    // Add Account Form
    const addContainer = createFlexContainer({
        className: 'mobile-add-account-form',
        direction: 'column',
        gap: SPACING.MD,
        style: {
            marginTop: SPACING.MD
        }
    });

    const nameInput = createInput({
        id: 'new-account-name',
        name: 'new-account-name',
        autocomplete: 'off',
        placeholder: 'Account Name',
        className: 'touch-target mobile-form-input',
        fontSize: FONT_SIZES.PREVENT_ZOOM
    });

    const typeSelect = createSelect({
        id: 'new-account-type',
        name: 'new-account-type',
        className: 'touch-target mobile-form-select input-select',
        options: [
            { value: ACCOUNT_TYPES.CHECKING, text: 'Checking' },
            { value: ACCOUNT_TYPES.SAVINGS, text: 'Savings' },
            { value: ACCOUNT_TYPES.CREDIT_CARD, text: 'Credit Card' },
            { value: ACCOUNT_TYPES.CASH, text: 'Cash' }
        ],
        fontSize: FONT_SIZES.PREVENT_ZOOM
    });

    // Add mobile focus handling
    [nameInput, typeSelect].forEach(input => {
        input.addEventListener('focus', () => {
            if (window.mobileUtils?.isMobile()) {
                window.mobileUtils.preventInputZoom(input);
                window.mobileUtils.scrollIntoViewAboveKeyboard(input);
            }
        });
    });

    const errorMsg = document.createElement('div');
    Object.assign(errorMsg.style, {
        color: COLORS.ERROR,
        fontSize: FONT_SIZES.SM,
        marginTop: `-${SPACING.SM}`,
        marginBottom: SPACING.SM,
        display: 'none'
    });

    // Clear error on input
    nameInput.addEventListener('input', () => {
        errorMsg.style.display = 'none';
        nameInput.style.borderColor = COLORS.BORDER;
    });

    const addBtn = Button({
        text: 'Add Account',
        variant: 'secondary',
        onClick: () => {
            const name = sanitizeInput(nameInput.value.trim(), 50);
            const type = typeSelect.value;
            if (name) {
                if (AccountService.isAccountDuplicate(name, type)) {
                    errorMsg.textContent = `An account named "${name}" of type "${type}" already exists.`;
                    errorMsg.style.display = 'block';
                    nameInput.style.borderColor = COLORS.ERROR;
                    if (window.mobileUtils?.supportsHaptic()) {
                        window.mobileUtils.hapticFeedback(HAPTIC_PATTERNS.ERROR);
                    }
                    return;
                }
                AccountService.saveAccount({
                    id: generateId(),
                    name: name,
                    type: type,
                    isDefault: false
                });
                nameInput.value = '';
                errorMsg.style.display = 'none';
                renderAccounts();
                if (window.mobileUtils?.supportsHaptic()) {
                    window.mobileUtils.hapticFeedback(HAPTIC_PATTERNS.LIGHT);
                }
            }
        }
    });
    addBtn.className += ' touch-target mobile-form-button';
    Object.assign(addBtn.style, {
        width: '100%',
        minHeight: TOUCH_TARGETS.MIN_HEIGHT,
        padding: SPACING.MD,
        fontSize: FONT_SIZES.BASE
    });

    addContainer.appendChild(nameInput);
    addContainer.appendChild(errorMsg);
    addContainer.appendChild(typeSelect);
    addContainer.appendChild(addBtn);
    section.appendChild(addContainer);

    return section;
};

