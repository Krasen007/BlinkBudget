/**
 * Account Management Section Component
 * Handles account listing, renaming, deletion, and creation
 */

import { Button } from './Button.js';
import { StorageService } from '../core/storage.js';
import { createAccountRenameModal, createConfirmModal, createAlertModal } from '../utils/modal-utils.js';
import { COLORS, SPACING, TOUCH_TARGETS, FONT_SIZES, HAPTIC_PATTERNS, ACCOUNT_TYPES } from '../utils/constants.js';
import { createInput, createSelect, createFlexContainer } from '../utils/dom-factory.js';
import { addTouchFeedback } from '../utils/touch-utils.js';

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
        const accounts = StorageService.getAccounts();

        accounts.forEach(acc => {
            const item = document.createElement('div');
            item.className = 'mobile-account-item';
            Object.assign(item.style, {
                display: 'flex',
                flexDirection: 'column',
                gap: SPACING.SM,
                padding: SPACING.LG,
                border: `1px solid ${COLORS.BORDER}`,
                borderRadius: 'var(--radius-md)',
                background: COLORS.SURFACE_HOVER,
                minHeight: TOUCH_TARGETS.MIN_HEIGHT
            });

            const info = document.createElement('div');
            info.className = 'mobile-account-info';
            
            const name = document.createElement('div');
            name.textContent = acc.name + (acc.isDefault ? ' (Default)' : '');
            Object.assign(name.style, {
                fontWeight: '500',
                fontSize: FONT_SIZES.LG,
                color: acc.isDefault ? COLORS.PRIMARY_LIGHT : COLORS.TEXT_MAIN,
                marginBottom: SPACING.XS
            });

            const type = document.createElement('div');
            type.textContent = acc.type.charAt(0).toUpperCase() + acc.type.slice(1);
            Object.assign(type.style, {
                fontSize: FONT_SIZES.SM,
                color: COLORS.TEXT_MUTED
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
            addTouchFeedback(renameBtn);
            renameBtn.onclick = () => {
                createAccountRenameModal(acc.name, (newName) => {
                    if (newName && newName.trim() !== '') {
                        acc.name = newName.trim();
                        StorageService.saveAccount(acc);
                        renderAccounts();
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
                addTouchFeedback(makeDefaultBtn);
                makeDefaultBtn.onclick = () => {
                    acc.isDefault = true;
                    StorageService.saveAccount(acc);
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
                addTouchFeedback(deleteBtn);
                deleteBtn.onclick = () => {
                    createConfirmModal(
                        `Delete account "${acc.name}"?`,
                        'Transactions will remain but might be orphaned if not handled.',
                        () => {
                            if (StorageService.deleteAccount(acc.id)) {
                                renderAccounts();
                                if (window.mobileUtils?.supportsHaptic()) {
                                    window.mobileUtils.hapticFeedback([20, 10, 20]);
                                }
                            } else {
                                createAlertModal('Cannot delete the last account.');
                            }
                        }
                    );
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
        placeholder: 'Account Name',
        className: 'touch-target mobile-form-input',
        fontSize: FONT_SIZES.PREVENT_ZOOM
    });

    const typeSelect = createSelect({
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

    const addBtn = Button({
        text: 'Add Account',
        variant: 'secondary',
        onClick: () => {
            const name = nameInput.value.trim();
            if (name) {
                StorageService.saveAccount({
                    id: StorageService.generateId(),
                    name: name,
                    type: typeSelect.value,
                    isDefault: false
                });
                nameInput.value = '';
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
    addContainer.appendChild(typeSelect);
    addContainer.appendChild(addBtn);
    section.appendChild(addContainer);

    return section;
};

