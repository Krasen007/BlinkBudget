import { Button } from '../components/Button.js';
import { Router } from '../core/router.js';
import { StorageService } from '../core/storage.js';
import { MobileBackButton } from '../components/MobileNavigation.js';

export const SettingsView = () => {
    const container = document.createElement('div');
    container.className = 'view-settings mobile-settings-layout';
    container.style.maxWidth = '600px';
    container.style.width = '100%';

    const header = document.createElement('div');
    header.className = 'settings-header';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = 'var(--spacing-xl)';

    const title = document.createElement('h2');
    title.textContent = 'Settings';
    title.style.margin = 0;

    // Add mobile back button
    const mobileBackBtn = MobileBackButton({
        onBack: () => Router.navigate('dashboard'),
        label: 'Back'
    });

    const backBtn = Button({
        text: 'Back',
        variant: 'secondary',
        onClick: () => Router.navigate('dashboard')
    });
    backBtn.style.padding = 'var(--spacing-sm) var(--spacing-md)';
    backBtn.className += ' desktop-only'; // Hide on mobile

    header.appendChild(title);
    header.appendChild(backBtn);
    
    // Add mobile back button before header
    const mobileBackContainer = document.createElement('div');
    mobileBackContainer.className = 'mobile-only';
    mobileBackContainer.style.marginBottom = 'var(--spacing-md)';
    mobileBackContainer.appendChild(mobileBackBtn);
    container.appendChild(mobileBackContainer);
    container.appendChild(header);

    // Feature 0: Account Management
    const accountSection = document.createElement('div');
    accountSection.className = 'card mobile-settings-card';
    accountSection.style.marginBottom = 'var(--spacing-lg)';

    const accountTitle = document.createElement('h3');
    accountTitle.textContent = 'Accounts';
    accountTitle.className = 'mobile-settings-title';
    accountTitle.style.marginBottom = 'var(--spacing-md)';
    accountSection.appendChild(accountTitle);

    const accountList = document.createElement('div');
    accountList.className = 'mobile-account-list';
    accountList.style.display = 'flex';
    accountList.style.flexDirection = 'column';
    accountList.style.gap = 'var(--spacing-md)';
    accountList.style.marginBottom = 'var(--spacing-md)';

    const renderAccounts = () => {
        accountList.innerHTML = '';
        const accounts = StorageService.getAccounts();

        accounts.forEach(acc => {
            const item = document.createElement('div');
            item.className = 'mobile-account-item';
            item.style.display = 'flex';
            item.style.flexDirection = 'column';
            item.style.gap = 'var(--spacing-sm)';
            item.style.padding = 'var(--spacing-lg)';
            item.style.border = '1px solid var(--color-border)';
            item.style.borderRadius = 'var(--radius-md)';
            item.style.background = 'var(--color-surface-hover)';
            item.style.minHeight = 'var(--touch-target-min)';

            const info = document.createElement('div');
            info.className = 'mobile-account-info';
            const name = document.createElement('div');
            name.textContent = acc.name + (acc.isDefault ? ' (Default)' : '');
            name.style.fontWeight = '500';
            name.style.fontSize = 'var(--font-size-lg)';
            name.style.color = acc.isDefault ? 'var(--color-primary-light)' : 'var(--color-text-main)';
            name.style.marginBottom = 'var(--spacing-xs)';

            const type = document.createElement('div');
            type.textContent = acc.type.charAt(0).toUpperCase() + acc.type.slice(1);
            type.style.fontSize = 'var(--font-size-sm)';
            type.style.color = 'var(--color-text-muted)';

            info.appendChild(name);
            info.appendChild(type);

            const actions = document.createElement('div');
            actions.className = 'mobile-account-actions';
            actions.style.display = 'flex';
            actions.style.flexWrap = 'wrap';
            actions.style.gap = 'var(--spacing-md)';
            actions.style.marginTop = 'var(--spacing-sm)';

            // Rename button (available for all accounts)
            const renameBtn = document.createElement('button');
            renameBtn.textContent = 'Rename';
            renameBtn.className = 'btn btn-ghost touch-target mobile-action-btn';
            renameBtn.style.fontSize = 'var(--font-size-sm)';
            renameBtn.style.padding = 'var(--spacing-md) var(--spacing-lg)';
            renameBtn.style.minHeight = 'var(--touch-target-min)';
            renameBtn.style.minWidth = 'var(--touch-target-min)';
            renameBtn.style.flex = '1';
            renameBtn.onclick = () => {
                // Use mobile-friendly modal instead of prompt
                createMobileAccountModal(acc.name, (newName) => {
                    if (newName && newName.trim() !== '') {
                        acc.name = newName.trim();
                        StorageService.saveAccount(acc);
                        renderAccounts();
                    }
                });
            };
            actions.appendChild(renameBtn);

            if (!acc.isDefault) {
                const makeDefaultBtn = document.createElement('button');
                makeDefaultBtn.textContent = 'Set Default';
                makeDefaultBtn.className = 'btn btn-ghost touch-target mobile-action-btn';
                makeDefaultBtn.style.fontSize = 'var(--font-size-sm)';
                makeDefaultBtn.style.padding = 'var(--spacing-md) var(--spacing-lg)';
                makeDefaultBtn.style.minHeight = 'var(--touch-target-min)';
                makeDefaultBtn.style.minWidth = 'var(--touch-target-min)';
                makeDefaultBtn.style.flex = '1';
                makeDefaultBtn.onclick = () => {
                    acc.isDefault = true;
                    StorageService.saveAccount(acc);
                    renderAccounts();
                    // Haptic feedback for successful action
                    if (window.mobileUtils?.supportsHaptic()) {
                        window.mobileUtils.hapticFeedback([10]);
                    }
                };
                actions.appendChild(makeDefaultBtn);

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Delete';
                deleteBtn.className = 'btn btn-ghost touch-target mobile-action-btn mobile-delete-btn';
                deleteBtn.style.color = '#ef4444';
                deleteBtn.style.fontSize = 'var(--font-size-sm)';
                deleteBtn.style.padding = 'var(--spacing-md) var(--spacing-lg)';
                deleteBtn.style.minHeight = 'var(--touch-target-min)';
                deleteBtn.style.minWidth = 'var(--touch-target-min)';
                deleteBtn.style.flex = '1';
                deleteBtn.onclick = () => {
                    createMobileConfirmModal(
                        `Delete account "${acc.name}"?`,
                        'Transactions will remain but might be orphaned if not handled.',
                        () => {
                            if (StorageService.deleteAccount(acc.id)) {
                                renderAccounts();
                                // Haptic feedback for deletion
                                if (window.mobileUtils?.supportsHaptic()) {
                                    window.mobileUtils.hapticFeedback([20, 10, 20]);
                                }
                            } else {
                                alert('Cannot delete the last account.');
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
    accountSection.appendChild(accountList);

    // Mobile-optimized Add Account Form
    const addContainer = document.createElement('div');
    addContainer.className = 'mobile-add-account-form';
    addContainer.style.display = 'flex';
    addContainer.style.flexDirection = 'column';
    addContainer.style.gap = 'var(--spacing-md)';
    addContainer.style.marginTop = 'var(--spacing-md)';

    const nameInput = document.createElement('input');
    nameInput.placeholder = 'Account Name';
    nameInput.className = 'touch-target mobile-form-input';
    nameInput.style.width = '100%';
    nameInput.style.minHeight = 'var(--touch-target-min)';
    nameInput.style.fontSize = '16px'; // Prevent zoom on iOS
    nameInput.style.padding = 'var(--spacing-md)';
    nameInput.style.borderRadius = 'var(--radius-md)';
    nameInput.style.border = '1px solid var(--color-border)';
    nameInput.style.background = 'var(--color-surface)';
    nameInput.style.color = 'var(--color-text-main)';

    const typeSelect = document.createElement('select');
    typeSelect.className = 'touch-target mobile-form-select input-select';
    typeSelect.style.width = '100%';
    typeSelect.style.minHeight = 'var(--touch-target-min)';
    typeSelect.style.fontSize = '16px'; // Prevent zoom on iOS
    typeSelect.style.padding = 'var(--spacing-md)';
    typeSelect.style.borderRadius = 'var(--radius-md)';
    typeSelect.style.border = '1px solid var(--color-border)';
    typeSelect.style.background = 'var(--color-surface)';
    typeSelect.style.color = 'var(--color-text-main)';

    ['Checking', 'Savings', 'Credit Card', 'Cash'].forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.toLowerCase();
        opt.textContent = t;
        typeSelect.appendChild(opt);
    });

    const addBtn = Button({
        text: 'Add Account',
        variant: 'secondary',
        onClick: () => {
            const name = nameInput.value.trim();
            if (name) {
                StorageService.saveAccount({
                    id: crypto.randomUUID(),
                    name: name,
                    type: typeSelect.value,
                    isDefault: false
                });
                nameInput.value = ''; // Reset
                renderAccounts();
                // Haptic feedback for successful addition
                if (window.mobileUtils?.supportsHaptic()) {
                    window.mobileUtils.hapticFeedback([10]);
                }
            }
        }
    });
    addBtn.className += ' touch-target mobile-form-button';
    addBtn.style.width = '100%';
    addBtn.style.minHeight = 'var(--touch-target-min)';
    addBtn.style.padding = 'var(--spacing-md)';
    addBtn.style.fontSize = 'var(--font-size-base)';

    // Add touch feedback for inputs
    [nameInput, typeSelect].forEach(input => {
        input.addEventListener('focus', () => {
            if (window.mobileUtils?.isMobile()) {
                window.mobileUtils.preventInputZoom(input);
                window.mobileUtils.scrollIntoViewAboveKeyboard(input);
            }
        });
    });

    addContainer.appendChild(nameInput);
    addContainer.appendChild(typeSelect);
    addContainer.appendChild(addBtn);

    accountSection.appendChild(addContainer);

    container.appendChild(accountSection);

    // Feature 1: Date Format
    const dateSection = document.createElement('div');
    dateSection.className = 'card mobile-settings-card';
    dateSection.style.marginBottom = 'var(--spacing-lg)';

    const dateTitle = document.createElement('h3');
    dateTitle.textContent = 'Date Format';
    dateTitle.className = 'mobile-settings-title';
    dateTitle.style.marginBottom = 'var(--spacing-md)';
    dateTitle.style.fontSize = 'var(--font-size-xl)';

    const currentFormat = StorageService.getSetting('dateFormat') || 'US'; // Default US

    const createOption = (label, value) => {
        const row = document.createElement('div');
        row.className = 'mobile-settings-option touch-target';
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.padding = 'var(--spacing-lg)';
        row.style.cursor = 'pointer';
        row.style.minHeight = 'var(--touch-target-min)';
        row.style.borderRadius = 'var(--radius-md)';
        row.style.transition = 'background-color var(--transition-fast)';
        row.style.marginBottom = 'var(--spacing-sm)';
        row.style.border = '1px solid var(--color-border)';
        
        // Touch feedback for settings options
        row.addEventListener('touchstart', (e) => {
            row.style.backgroundColor = 'var(--color-surface-hover)';
            row.style.transform = 'scale(0.98)';
        }, { passive: true });
        
        row.addEventListener('touchend', () => {
            row.style.backgroundColor = 'transparent';
            row.style.transform = 'scale(1)';
        }, { passive: true });
        
        row.addEventListener('touchcancel', () => {
            row.style.backgroundColor = 'transparent';
            row.style.transform = 'scale(1)';
        }, { passive: true });

        const lbl = document.createElement('span');
        lbl.textContent = label;
        lbl.style.fontSize = 'var(--font-size-base)';
        lbl.style.fontWeight = '500';

        const check = document.createElement('span');
        check.textContent = currentFormat === value ? '✓' : '';
        check.style.color = 'var(--color-primary)';
        check.style.fontWeight = 'bold';
        check.style.fontSize = 'var(--font-size-lg)';

        row.appendChild(lbl);
        row.appendChild(check);

        row.addEventListener('click', () => {
            StorageService.saveSetting('dateFormat', value);
            // Haptic feedback for selection
            if (window.mobileUtils?.supportsHaptic()) {
                window.mobileUtils.hapticFeedback([5]);
            }
            // Re-render view to show update
            const parent = container.parentNode;
            if (parent) {
                parent.innerHTML = '';
                parent.appendChild(SettingsView());
            }
        });

        return row;
    };

    dateSection.appendChild(dateTitle);
    dateSection.appendChild(createOption('US (MM/DD/YYYY)', 'US'));
    dateSection.appendChild(createOption('ISO (YYYY-MM-DD)', 'ISO'));
    dateSection.appendChild(createOption('European (DD/MM/YYYY)', 'EU'));

    container.appendChild(dateSection);

    // Feature 2: Data Management (Export)
    const dataSection = document.createElement('div');
    dataSection.className = 'card mobile-settings-card';
    dataSection.style.marginBottom = 'var(--spacing-lg)';

    const dataTitle = document.createElement('h3');
    dataTitle.textContent = 'Data Management';
    dataTitle.className = 'mobile-settings-title';
    dataTitle.style.marginBottom = 'var(--spacing-md)';
    dataTitle.style.fontSize = 'var(--font-size-xl)';

    // Mobile-optimized Date Range Inputs
    const dateRangeContainer = document.createElement('div');
    dateRangeContainer.className = 'mobile-date-range-form';
    dateRangeContainer.style.display = 'flex';
    dateRangeContainer.style.flexDirection = 'column';
    dateRangeContainer.style.gap = 'var(--spacing-md)';
    dateRangeContainer.style.marginBottom = 'var(--spacing-lg)';

    const createDateInput = (label, id) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'mobile-date-input-wrapper';
        wrapper.style.width = '100%';

        const lbl = document.createElement('label');
        lbl.textContent = label;
        lbl.htmlFor = id;
        lbl.style.display = 'block';
        lbl.style.fontSize = 'var(--font-size-sm)';
        lbl.style.fontWeight = '500';
        lbl.style.color = 'var(--color-text-muted)';
        lbl.style.marginBottom = 'var(--spacing-xs)';

        const input = document.createElement('input');
        input.type = 'date';
        input.id = id;
        input.className = 'touch-target mobile-form-input';
        input.style.width = '100%';
        input.style.minHeight = 'var(--touch-target-min)';
        input.style.fontSize = '16px'; // Prevent zoom on iOS
        input.style.padding = 'var(--spacing-md)';
        input.style.borderRadius = 'var(--radius-md)';
        input.style.border = '1px solid var(--color-border)';
        input.style.background = 'var(--color-surface)';
        input.style.color = 'var(--color-text-main)';

        // Add focus handling for mobile
        input.addEventListener('focus', () => {
            if (window.mobileUtils?.isMobile()) {
                window.mobileUtils.preventInputZoom(input);
                window.mobileUtils.scrollIntoViewAboveKeyboard(input);
            }
        });

        wrapper.appendChild(lbl);
        wrapper.appendChild(input);
        return { wrapper, input };
    };

    const startInput = createDateInput('Start Date', 'export-start');
    const endInput = createDateInput('End Date', 'export-end');

    // Default: Start of current month to Today
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    startInput.input.value = firstDay.toISOString().split('T')[0];
    endInput.input.value = now.toISOString().split('T')[0];

    dateRangeContainer.appendChild(startInput.wrapper);
    dateRangeContainer.appendChild(endInput.wrapper);

    const exportBtn = Button({
        text: 'Export Transactions (CSV)',
        variant: 'primary',
        onClick: () => {
            const start = new Date(startInput.input.value);
            const end = new Date(endInput.input.value);
            // Set end date to end of day for inclusive comparison
            end.setHours(23, 59, 59, 999);

            const transactions = StorageService.getAll().filter(t => {
                const tDate = new Date(t.timestamp);
                return tDate >= start && tDate <= end;
            });

            if (transactions.length === 0) {
                createMobileAlert('No transactions found in this date range.');
                return;
            }

            // Generate CSV
            const headers = ['Date', 'Type', 'Category', 'Amount'];
            const rows = transactions.map(t => [
                new Date(t.timestamp).toLocaleDateString(), // Use default locale for simplicity or ISO
                t.type.charAt(0).toUpperCase() + t.type.slice(1),
                t.category,
                (t.type === 'expense' ? -t.amount : t.amount).toFixed(2)
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `blinkbudget_export_${startInput.input.value}_to_${endInput.input.value}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);

            // Haptic feedback for successful export
            if (window.mobileUtils?.supportsHaptic()) {
                window.mobileUtils.hapticFeedback([10, 5, 10]);
            }
        }
    });
    exportBtn.className += ' touch-target mobile-form-button';
    exportBtn.style.width = '100%';
    exportBtn.style.minHeight = 'var(--touch-target-min)';
    exportBtn.style.padding = 'var(--spacing-md)';
    exportBtn.style.fontSize = 'var(--font-size-base)';

    dataSection.appendChild(dataTitle);
    dataSection.appendChild(dateRangeContainer);
    dataSection.appendChild(exportBtn);
    container.appendChild(dataSection);

    return container;
};

/**
 * Create mobile-friendly account rename modal
 */
const createMobileAccountModal = (currentName, onSave) => {
    const overlay = document.createElement('div');
    overlay.className = 'mobile-modal-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '1000';
    overlay.style.padding = 'var(--spacing-lg)';

    const modal = document.createElement('div');
    modal.className = 'mobile-modal';
    modal.style.backgroundColor = 'var(--color-surface)';
    modal.style.borderRadius = 'var(--radius-lg)';
    modal.style.padding = 'var(--spacing-xl)';
    modal.style.width = '100%';
    modal.style.maxWidth = '400px';
    modal.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3)';

    const title = document.createElement('h3');
    title.textContent = 'Rename Account';
    title.style.margin = '0 0 var(--spacing-lg) 0';
    title.style.fontSize = 'var(--font-size-xl)';
    title.style.textAlign = 'center';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentName;
    input.placeholder = 'Account Name';
    input.className = 'touch-target mobile-form-input';
    input.style.width = '100%';
    input.style.minHeight = 'var(--touch-target-min)';
    input.style.fontSize = '16px';
    input.style.padding = 'var(--spacing-md)';
    input.style.marginBottom = 'var(--spacing-lg)';
    input.style.borderRadius = 'var(--radius-md)';
    input.style.border = '1px solid var(--color-border)';
    input.style.background = 'var(--color-surface)';
    input.style.color = 'var(--color-text-main)';

    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = 'var(--spacing-md)';

    const cancelBtn = Button({
        text: 'Cancel',
        variant: 'secondary',
        onClick: () => {
            document.body.removeChild(overlay);
        }
    });
    cancelBtn.className += ' touch-target';
    cancelBtn.style.flex = '1';
    cancelBtn.style.minHeight = 'var(--touch-target-min)';

    const saveBtn = Button({
        text: 'Save',
        variant: 'primary',
        onClick: () => {
            const newName = input.value.trim();
            if (newName) {
                onSave(newName);
                document.body.removeChild(overlay);
            }
        }
    });
    saveBtn.className += ' touch-target';
    saveBtn.style.flex = '1';
    saveBtn.style.minHeight = 'var(--touch-target-min)';

    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(saveBtn);

    modal.appendChild(title);
    modal.appendChild(input);
    modal.appendChild(buttonContainer);
    overlay.appendChild(modal);

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    });

    // Focus input and select text
    setTimeout(() => {
        input.focus();
        input.select();
    }, 100);

    document.body.appendChild(overlay);
};

/**
 * Create mobile-friendly confirmation modal
 */
const createMobileConfirmModal = (title, message, onConfirm) => {
    const overlay = document.createElement('div');
    overlay.className = 'mobile-modal-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '1000';
    overlay.style.padding = 'var(--spacing-lg)';

    const modal = document.createElement('div');
    modal.className = 'mobile-modal';
    modal.style.backgroundColor = 'var(--color-surface)';
    modal.style.borderRadius = 'var(--radius-lg)';
    modal.style.padding = 'var(--spacing-xl)';
    modal.style.width = '100%';
    modal.style.maxWidth = '400px';
    modal.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3)';

    const titleEl = document.createElement('h3');
    titleEl.textContent = title;
    titleEl.style.margin = '0 0 var(--spacing-md) 0';
    titleEl.style.fontSize = 'var(--font-size-xl)';
    titleEl.style.textAlign = 'center';

    const messageEl = document.createElement('p');
    messageEl.textContent = message;
    messageEl.style.margin = '0 0 var(--spacing-lg) 0';
    messageEl.style.fontSize = 'var(--font-size-sm)';
    messageEl.style.color = 'var(--color-text-muted)';
    messageEl.style.textAlign = 'center';
    messageEl.style.lineHeight = 'var(--line-height-relaxed)';

    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = 'var(--spacing-md)';

    const cancelBtn = Button({
        text: 'Cancel',
        variant: 'secondary',
        onClick: () => {
            document.body.removeChild(overlay);
        }
    });
    cancelBtn.className += ' touch-target';
    cancelBtn.style.flex = '1';
    cancelBtn.style.minHeight = 'var(--touch-target-min)';

    const confirmBtn = Button({
        text: 'Delete',
        variant: 'primary',
        onClick: () => {
            onConfirm();
            document.body.removeChild(overlay);
        }
    });
    confirmBtn.className += ' touch-target';
    confirmBtn.style.flex = '1';
    confirmBtn.style.minHeight = 'var(--touch-target-min)';
    confirmBtn.style.backgroundColor = '#ef4444';
    confirmBtn.style.borderColor = '#ef4444';

    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(confirmBtn);

    modal.appendChild(titleEl);
    modal.appendChild(messageEl);
    modal.appendChild(buttonContainer);
    overlay.appendChild(modal);

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    });

    document.body.appendChild(overlay);
};

/**
 * Create mobile-friendly alert modal
 */
const createMobileAlert = (message) => {
    const overlay = document.createElement('div');
    overlay.className = 'mobile-modal-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '1000';
    overlay.style.padding = 'var(--spacing-lg)';

    const modal = document.createElement('div');
    modal.className = 'mobile-modal';
    modal.style.backgroundColor = 'var(--color-surface)';
    modal.style.borderRadius = 'var(--radius-lg)';
    modal.style.padding = 'var(--spacing-xl)';
    modal.style.width = '100%';
    modal.style.maxWidth = '350px';
    modal.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3)';

    const messageEl = document.createElement('p');
    messageEl.textContent = message;
    messageEl.style.margin = '0 0 var(--spacing-lg) 0';
    messageEl.style.fontSize = 'var(--font-size-base)';
    messageEl.style.textAlign = 'center';
    messageEl.style.lineHeight = 'var(--line-height-relaxed)';

    const okBtn = Button({
        text: 'OK',
        variant: 'primary',
        onClick: () => {
            document.body.removeChild(overlay);
        }
    });
    okBtn.className += ' touch-target';
    okBtn.style.width = '100%';
    okBtn.style.minHeight = 'var(--touch-target-min)';

    modal.appendChild(messageEl);
    modal.appendChild(okBtn);
    overlay.appendChild(modal);

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    });

    document.body.appendChild(overlay);
};
