import { Button } from '../components/Button.js';
import { Router } from '../core/router.js';
import { StorageService } from '../core/storage.js';

export const SettingsView = () => {
    const container = document.createElement('div');
    container.className = 'view-settings';
    container.style.maxWidth = '600px';
    container.style.width = '100%';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = 'var(--spacing-xl)';

    const title = document.createElement('h2');
    title.textContent = 'Settings';
    title.style.margin = 0;

    const backBtn = Button({
        text: 'Back',
        variant: 'secondary',
        onClick: () => Router.navigate('dashboard')
    });
    backBtn.style.padding = 'var(--spacing-sm) var(--spacing-md)';

    header.appendChild(title);
    header.appendChild(backBtn);
    container.appendChild(header);

    // Feature 0: Account Management
    const accountSection = document.createElement('div');
    accountSection.className = 'card';
    accountSection.style.marginBottom = 'var(--spacing-lg)';

    const accountTitle = document.createElement('h3');
    accountTitle.textContent = 'Accounts';
    accountTitle.style.marginBottom = 'var(--spacing-md)';
    accountSection.appendChild(accountTitle);

    const accountList = document.createElement('div');
    accountList.style.display = 'flex';
    accountList.style.flexDirection = 'column';
    accountList.style.gap = 'var(--spacing-sm)';
    accountList.style.marginBottom = 'var(--spacing-md)';

    const renderAccounts = () => {
        accountList.innerHTML = '';
        const accounts = StorageService.getAccounts();

        accounts.forEach(acc => {
            const item = document.createElement('div');
            item.style.display = 'flex';
            item.style.justifyContent = 'space-between';
            item.style.alignItems = 'center';
            item.style.padding = 'var(--spacing-md)';
            item.style.border = '1px solid var(--color-border)';
            item.style.borderRadius = 'var(--radius-md)';
            item.style.background = 'var(--color-surface-hover)';

            const info = document.createElement('div');
            const name = document.createElement('div');
            name.textContent = acc.name + (acc.isDefault ? ' (Default)' : '');
            name.style.fontWeight = '500';
            name.style.color = acc.isDefault ? 'var(--color-primary-light)' : 'var(--color-text-main)';

            const type = document.createElement('div');
            type.textContent = acc.type.charAt(0).toUpperCase() + acc.type.slice(1);
            type.style.fontSize = '0.75rem';
            type.style.color = 'var(--color-text-muted)';

            info.appendChild(name);
            info.appendChild(type);

            const actions = document.createElement('div');
            actions.style.display = 'flex';
            actions.style.gap = 'var(--spacing-sm)';

            if (!acc.isDefault) {
                const makeDefaultBtn = document.createElement('button');
                makeDefaultBtn.textContent = 'Set Default';
                makeDefaultBtn.className = 'btn btn-ghost';
                makeDefaultBtn.style.fontSize = '0.75rem';
                makeDefaultBtn.style.padding = 'var(--spacing-xs) var(--spacing-sm)';
                makeDefaultBtn.onclick = () => {
                    acc.isDefault = true;
                    StorageService.saveAccount(acc);
                    renderAccounts();
                };
                actions.appendChild(makeDefaultBtn);

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Delete';
                deleteBtn.className = 'btn btn-ghost';
                deleteBtn.style.color = '#ef4444';
                deleteBtn.style.fontSize = '0.75rem';
                deleteBtn.style.padding = 'var(--spacing-xs) var(--spacing-sm)';
                deleteBtn.onclick = () => {
                    if (confirm(`Delete account "${acc.name}"? Transactions will remain but might be orphaned if not handled.`)) {
                        if (StorageService.deleteAccount(acc.id)) {
                            renderAccounts();
                        } else {
                            alert('Cannot delete the last account.');
                        }
                    }
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

    const addAccountBtn = Button({
        text: 'Add New Account',
        variant: 'secondary',
        onClick: () => {
            const name = prompt('Enter account name:');
            if (name) {
                StorageService.saveAccount({
                    id: crypto.randomUUID(),
                    name: name,
                    type: 'checking', // Default type for now
                    isDefault: false
                });
                renderAccounts();
            }
        }
    });
    addAccountBtn.style.width = '100%';
    accountSection.appendChild(addAccountBtn);

    container.appendChild(accountSection);

    // Feature 1: Date Format
    const dateSection = document.createElement('div');
    dateSection.className = 'card';
    dateSection.style.marginBottom = 'var(--spacing-lg)';

    const dateTitle = document.createElement('h3');
    dateTitle.textContent = 'Date Format';
    dateTitle.style.marginBottom = 'var(--spacing-md)';
    dateTitle.style.fontSize = '1.2rem';

    const currentFormat = StorageService.getSetting('dateFormat') || 'US'; // Default US

    const createOption = (label, value) => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.padding = 'var(--spacing-sm) 0';
        row.style.cursor = 'pointer';

        const lbl = document.createElement('span');
        lbl.textContent = label;

        const check = document.createElement('span');
        check.textContent = currentFormat === value ? '✓' : '';
        check.style.color = 'var(--color-primary)';
        check.style.fontWeight = 'bold';

        row.appendChild(lbl);
        row.appendChild(check);

        row.addEventListener('click', () => {
            StorageService.saveSetting('dateFormat', value);
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
    dataSection.className = 'card';
    dataSection.style.marginBottom = 'var(--spacing-lg)';

    const dataTitle = document.createElement('h3');
    dataTitle.textContent = 'Data Management';
    dataTitle.style.marginBottom = 'var(--spacing-md)';
    dataTitle.style.fontSize = '1.2rem';

    // Date Range Inputs
    const dateRangeContainer = document.createElement('div');
    dateRangeContainer.style.display = 'flex';
    dateRangeContainer.style.gap = 'var(--spacing-md)';
    dateRangeContainer.style.marginBottom = 'var(--spacing-md)';

    const createDateInput = (label, id) => {
        const wrapper = document.createElement('div');
        wrapper.style.flex = '1';

        const lbl = document.createElement('label');
        lbl.textContent = label;
        lbl.style.display = 'block';
        lbl.style.fontSize = '0.875rem';
        lbl.style.color = 'var(--color-text-muted)';
        lbl.style.marginBottom = 'var(--spacing-xs)';

        const input = document.createElement('input');
        input.type = 'date';
        input.id = id;
        input.style.width = '100%';

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
                alert('No transactions found in this date range.');
                return;
            }

            // Generate CSV
            const headers = ['Date', 'Type', 'Category', 'Amount'];
            const rows = transactions.map(t => [
                new Date(t.timestamp).toLocaleDateString(), // Use default locale for simplicity or ISO
                t.type.charAt(0).toUpperCase() + t.type.slice(1),
                t.category,
                t.amount.toFixed(2)
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
        }
    });

    exportBtn.style.width = '100%';

    dataSection.appendChild(dataTitle);
    dataSection.appendChild(dateRangeContainer);
    dataSection.appendChild(exportBtn);
    container.appendChild(dataSection);

    return container;
};
