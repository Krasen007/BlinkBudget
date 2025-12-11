import { Button } from '../components/Button.js';
import { StorageService } from '../core/storage.js';
import { Router } from '../core/router.js';

export const DashboardView = () => {
    const container = document.createElement('div');
    container.className = 'view-dashboard';
    container.style.width = '100%';
    container.style.maxWidth = '600px';

    // 0. Header (Account Selector & Settings)
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = 'var(--spacing-md)';

    // Account Selector
    const leftHeader = document.createElement('div');
    leftHeader.style.flex = '1';

    const accountSelect = document.createElement('select');
    accountSelect.style.padding = 'var(--spacing-xs) var(--spacing-sm)';
    accountSelect.style.borderRadius = 'var(--radius-sm)';
    accountSelect.style.background = 'transparent';
    accountSelect.style.color = 'var(--color-text-main)';
    accountSelect.style.border = '1px solid var(--color-border)';
    accountSelect.style.fontSize = '0.9rem';
    accountSelect.style.cursor = 'pointer';

    const accounts = StorageService.getAccounts();
    const defaultAccount = StorageService.getDefaultAccount();

    // Add "All Accounts" option
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'All Accounts';
    accountSelect.appendChild(allOption);

    accounts.forEach(acc => {
        const opt = document.createElement('option');
        opt.value = acc.id;
        opt.textContent = acc.name;
        if (acc.id === defaultAccount.id) opt.selected = true; // Default to Main
        accountSelect.appendChild(opt);
    });

    leftHeader.appendChild(accountSelect);
    header.appendChild(leftHeader);

    // Settings Button
    const settingsBtn = document.createElement('button');
    settingsBtn.innerHTML = '⚙️';
    settingsBtn.className = 'btn btn-ghost';
    settingsBtn.style.fontSize = '1.5rem';
    settingsBtn.style.padding = 'var(--spacing-xs)';
    settingsBtn.style.border = 'none';
    settingsBtn.title = 'Settings';
    settingsBtn.addEventListener('click', () => Router.navigate('settings'));

    header.appendChild(settingsBtn);
    container.appendChild(header);

    // Filter Logic
    let currentFilter = accountSelect.value;

    // Main Content Wrapper to allow re-rendering
    const content = document.createElement('div');
    container.appendChild(content);

    const renderDashboard = () => {
        content.innerHTML = ''; // Clear prev content

        const allTransactions = StorageService.getAll();

        // Filter Transactions
        const transactions = allTransactions.filter(t => {
            if (currentFilter === 'all') return true;
            return t.accountId === currentFilter || t.toAccountId === currentFilter;
        }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const dateFormat = StorageService.getSetting('dateFormat') || 'US';

        const formatDate = (isoString) => {
            const d = new Date(isoString);
            if (dateFormat === 'ISO') return d.toISOString().split('T')[0];
            if (dateFormat === 'EU') return d.toLocaleDateString('en-GB');
            return d.toLocaleDateString('en-US');
        };

        // Calculate Totals (Respecting Filter)
        let totalIncome = 0;
        let totalExpense = 0;

        transactions.forEach(t => {
            // Logic differs if viewing "All" vs Specific Account due to transfers
            if (currentFilter === 'all') {
                if (t.type === 'income') totalIncome += t.amount;
                if (t.type === 'expense') totalExpense += t.amount;
                if (t.type === 'refund') totalExpense -= t.amount;
                // Transfers cancel out in "All" view (money moved, not lost/gained)
            } else {
                // Specific Account View
                const isSource = t.accountId === currentFilter;
                const isDest = t.toAccountId === currentFilter;

                if (t.type === 'income' && isSource) totalIncome += t.amount;
                if (t.type === 'expense' && isSource) totalExpense += t.amount;
                if (t.type === 'refund' && isSource) totalExpense -= t.amount;

                if (t.type === 'transfer') {
                    if (isSource) totalExpense += t.amount; // Money leaving
                    if (isDest) totalIncome += t.amount;   // Money entering
                }
            }
        });

        const availableBalance = totalIncome - totalExpense;

        // 2. Statistics Cards
        const statsContainer = document.createElement('div');
        statsContainer.style.display = 'grid';
        statsContainer.style.gap = 'var(--spacing-md)';
        statsContainer.style.marginBottom = 'var(--spacing-xl)';

        const createCard = (label, value, color) => {
            const card = document.createElement('div');
            card.className = 'card';
            card.style.textAlign = 'left';
            card.style.padding = 'var(--spacing-lg)';

            const lbl = document.createElement('p');
            lbl.textContent = label;
            lbl.style.fontSize = '0.875rem';
            lbl.style.marginBottom = 'var(--spacing-xs)';
            lbl.style.color = 'var(--color-text-muted)';

            const val = document.createElement('h2');
            val.textContent = `$${value.toFixed(2)}`;
            val.style.color = color;
            val.style.margin = 0;
            val.style.fontSize = '1.75rem';

            card.appendChild(lbl);
            card.appendChild(val);
            return card;
        };

        statsContainer.appendChild(createCard('Total Available', availableBalance, 'var(--color-primary-light)'));
        statsContainer.appendChild(createCard('Total Spent', totalExpense, '#ef4444'));

        content.appendChild(statsContainer);

        // 3. Action Button
        // Pass current account ID if filtered, so AddView knows which account to pre-select
        const addBtn = Button({
            text: '+ Add Transaction',
            onClick: () => {
                // If "All Accounts" is selected, let AddView use default. 
                // If specific account, pass it.
                if (currentFilter !== 'all') {
                    // We might need to update Router to pass query params, or just store in state
                    // For now, simpler to just navigate. AddView defaults to DefaultAccount.
                    // Ideally we'd pass ?accountId=xyz
                }
                Router.navigate('add-expense');
            },
            variant: 'primary'
        });
        addBtn.style.width = '100%';
        addBtn.style.marginBottom = 'var(--spacing-xl)';
        content.appendChild(addBtn);

        // 4. Recent Transactions
        const listContainer = document.createElement('div');
        const listTitle = document.createElement('h3');
        listTitle.textContent = 'Recent Transactions';
        listTitle.style.marginBottom = 'var(--spacing-md)';
        listTitle.style.textAlign = 'left';

        listContainer.appendChild(listTitle);

        if (transactions.length === 0) {
            const emptyState = document.createElement('p');
            emptyState.textContent = 'No transactions yet.';
            emptyState.style.color = 'var(--color-text-muted)';
            listContainer.appendChild(emptyState);
        } else {
            const list = document.createElement('ul');
            list.style.listStyle = 'none';
            list.style.padding = 0;
            list.style.maxHeight = '400px';
            list.style.overflowY = 'auto';
            list.style.borderTop = '1px solid var(--color-surface-hover)';

            transactions.forEach(t => {
                const item = document.createElement('li');
                item.className = 'transaction-item';
                item.style.display = 'flex';
                item.style.justifyContent = 'space-between';
                item.style.padding = 'var(--spacing-md)';
                item.style.borderBottom = '1px solid var(--color-surface-hover)';
                item.style.cursor = 'pointer';

                item.addEventListener('click', () => {
                    Router.navigate('edit-expense', { id: t.id });
                });

                const info = document.createElement('div');
                info.style.display = 'flex';
                info.style.flexDirection = 'column';
                info.style.alignItems = 'flex-start';
                info.style.gap = '2px';
                info.style.textAlign = 'left';

                const cat = document.createElement('div');

                // Special Display for Transfers
                if (t.type === 'transfer') {
                    const params = StorageService.getAccounts();
                    const getAccName = (id) => params.find(a => a.id === id)?.name || 'Unknown';

                    if (currentFilter === 'all') {
                        cat.textContent = `Transfer: ${getAccName(t.accountId)} → ${getAccName(t.toAccountId)}`;
                    } else if (t.accountId === currentFilter) {
                        cat.textContent = `Transfer to ${getAccName(t.toAccountId)}`;
                    } else {
                        cat.textContent = `Transfer from ${getAccName(t.accountId)}`;
                    }
                } else {
                    cat.textContent = t.category;
                }

                cat.style.fontWeight = '500';

                const date = document.createElement('div');
                date.textContent = formatDate(t.timestamp);
                date.style.fontSize = '0.75rem';
                date.style.color = 'var(--color-text-muted)';

                info.appendChild(cat);
                info.appendChild(date);

                const val = document.createElement('div');

                // Color Logic
                let isPositive = false;
                let color = 'inherit';

                if (t.type === 'income' || t.type === 'refund') {
                    isPositive = true;
                    color = '#10b981';
                } else if (t.type === 'transfer') {
                    // If viewing specific account:
                    if (currentFilter !== 'all') {
                        if (t.toAccountId === currentFilter) { // Incoming transfer
                            isPositive = true;
                            color = '#10b981';
                        } else { // Outgoing transfer
                            isPositive = false;
                            color = 'inherit'; // or red?
                        }
                    } else {
                        // In All view, transfer doesn't change net worth, maybe neutral?
                        isPositive = true; // Technically neutral, but let's just show amount
                        color = 'var(--color-text-muted)';
                    }
                }

                // Append sign
                let sign = isPositive ? '+' : '-';
                if (t.type === 'transfer' && currentFilter === 'all') sign = ''; // Neutral

                val.textContent = `${sign}$${Math.abs(t.amount).toFixed(2)}`;
                val.style.fontWeight = '600';
                val.style.color = color;

                item.appendChild(info);
                item.appendChild(val);
                list.appendChild(item);
            });
            listContainer.appendChild(list);
        }

        content.appendChild(listContainer);
    };

    renderDashboard();

    accountSelect.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        renderDashboard();
    });

    return container;
};
