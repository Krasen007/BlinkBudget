import { Button } from '../components/Button.js';
import { StorageService } from '../core/storage.js';
import { Router } from '../core/router.js';

export const DashboardView = () => {
    const container = document.createElement('div');
    container.className = 'view-dashboard';
    container.style.width = '100%';
    container.style.maxWidth = '600px';

    // 0. Header (Settings)
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'flex-end';
    header.style.marginBottom = 'var(--spacing-md)';

    const settingsBtn = document.createElement('button');
    settingsBtn.innerHTML = '⚙️'; // Minimal gear icon
    settingsBtn.className = 'btn btn-ghost';
    settingsBtn.style.fontSize = '1.5rem';
    settingsBtn.style.padding = 'var(--spacing-xs)';
    settingsBtn.style.border = 'none';
    settingsBtn.title = 'Settings';
    settingsBtn.addEventListener('click', () => Router.navigate('settings'));

    header.appendChild(settingsBtn);
    container.appendChild(header);

    // 1. Data Processing
    const rawTransactions = StorageService.getAll();
    const transactions = rawTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const dateFormat = StorageService.getSetting('dateFormat') || 'US';

    const formatDate = (isoString) => {
        const d = new Date(isoString);
        if (dateFormat === 'ISO') return d.toISOString().split('T')[0];
        if (dateFormat === 'EU') return d.toLocaleDateString('en-GB'); // DD/MM/YYYY
        return d.toLocaleDateString('en-US'); // MM/DD/YYYY
    };

    const totalIncome = transactions.reduce((sum, t) => {
        if (t.type === 'income') return sum + t.amount;
        return sum;
    }, 0);

    const totalExpense = transactions.reduce((sum, t) => {
        if (t.type === 'expense') return sum + t.amount;
        if (t.type === 'refund') return sum - t.amount; // Refund reduces the total spent
        return sum;
    }, 0);

    const availableBalance = totalIncome - totalExpense;

    // 2. Statistics Cards

    // 2. Statistics Cards
    const statsContainer = document.createElement('div');
    statsContainer.style.display = 'grid';
    statsContainer.style.gap = 'var(--spacing-md)';
    statsContainer.style.marginBottom = 'var(--spacing-xl)';

    // Card Helper
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

    // Available Balance Card (Green/Primary)
    const balanceCard = createCard('Total Available', availableBalance, 'var(--color-primary-light)');
    // Total Spent Card (Red/Warning) - or neutral
    const spentCard = createCard('Total Spent', totalExpense, '#ef4444'); // Red for spent

    statsContainer.appendChild(balanceCard);
    statsContainer.appendChild(spentCard);

    container.appendChild(statsContainer);

    // 3. Action Button
    const addBtn = Button({
        text: '+ Add Transaction', // Renamed from Add Expense
        onClick: () => Router.navigate('add-expense'),
        variant: 'primary'
    });
    addBtn.style.width = '100%';
    addBtn.style.marginBottom = 'var(--spacing-xl)';
    container.appendChild(addBtn);

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
            cat.textContent = t.category;
            cat.style.fontWeight = '500';

            const date = document.createElement('div');
            date.textContent = formatDate(t.timestamp);
            date.style.fontSize = '0.75rem';
            date.style.color = 'var(--color-text-muted)';

            info.appendChild(cat);
            info.appendChild(date);

            const isIncome = t.type === 'income' || t.type === 'refund';
            const val = document.createElement('div');
            val.textContent = `${isIncome ? '+' : '-'}$${Math.abs(t.amount).toFixed(2)}`;
            val.style.fontWeight = '600';
            val.style.color = isIncome ? '#10b981' : 'inherit'; // Green for income

            item.appendChild(info);
            item.appendChild(val);
            list.appendChild(item);
        });
        listContainer.appendChild(list);
    }

    container.appendChild(listContainer);

    return container;
};
