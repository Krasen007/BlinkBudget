import { Button } from '../components/Button.js';
import { StorageService } from '../core/storage.js';
import { Router } from '../core/router.js';

export const DashboardView = () => {
    const container = document.createElement('div');
    container.className = 'view-dashboard';
    container.style.width = '100%';
    container.style.maxWidth = '600px';

    // 1. Balance Card
    const transactions = StorageService.getAll();
    const totalExpense = transactions.reduce((sum, t) => {
        if (t.type === 'expense') return sum + t.amount;
        if (t.type === 'refund') return sum - t.amount;
        return sum;
    }, 0);

    const balanceCard = document.createElement('div');
    balanceCard.className = 'card';
    balanceCard.style.textAlign = 'left';
    balanceCard.style.marginBottom = 'var(--spacing-xl)';

    const label = document.createElement('p');
    label.textContent = 'Total Expenses (This Month)';
    label.style.fontSize = '0.875rem';
    label.style.marginBottom = 'var(--spacing-xs)';

    const amount = document.createElement('h1');
    amount.textContent = `$${Math.max(0, totalExpense).toFixed(2)}`; // Prevent negative total display
    amount.style.color = 'var(--color-primary-light)';

    balanceCard.appendChild(label);
    balanceCard.appendChild(amount);

    // 2. Action Button
    const addBtn = Button({
        text: '+ Add Expense',
        onClick: () => Router.navigate('add-expense'),
        variant: 'primary'
    });
    addBtn.style.width = '100%';
    addBtn.style.marginBottom = 'var(--spacing-xl)';

    // 3. Recent Questions
    const listContainer = document.createElement('div');
    const listTitle = document.createElement('h3');
    listTitle.textContent = 'Recent Transactions';
    listTitle.style.marginBottom = 'var(--spacing-md)';
    listTitle.style.textAlign = 'left';

    listContainer.appendChild(listTitle);

    if (transactions.length === 0) {
        const emptyState = document.createElement('p');
        emptyState.textContent = 'No transactions yet.';
        listContainer.appendChild(emptyState);
    } else {
        const list = document.createElement('ul');
        list.style.listStyle = 'none';
        list.style.padding = 0;

        transactions.slice(0, 5).forEach(t => {
            const item = document.createElement('li');
            item.className = 'transaction-item';
            item.style.display = 'flex';
            item.style.justifyContent = 'space-between';
            item.style.padding = 'var(--spacing-md) 0';
            item.style.borderBottom = '1px solid var(--color-surface-hover)';
            item.style.cursor = 'pointer'; // Indicate clickable

            // Navigate to edit on click
            item.addEventListener('click', () => {
                Router.navigate('edit-expense', { id: t.id });
            });

            const info = document.createElement('div');
            const cat = document.createElement('div');
            cat.textContent = t.category;
            cat.style.fontWeight = '500';

            const date = document.createElement('div');
            date.textContent = new Date(t.timestamp).toLocaleDateString();
            date.style.fontSize = '0.75rem';
            date.style.color = 'var(--color-text-muted)';

            info.appendChild(cat);
            info.appendChild(date);

            const isRefund = t.type === 'refund';
            const val = document.createElement('div');
            // Fix double negative display using Math.abs
            val.textContent = `${isRefund ? '+' : '-'}$${Math.abs(t.amount).toFixed(2)}`;
            val.style.fontWeight = '600';
            val.style.color = isRefund ? '#10b981' : 'inherit';

            item.appendChild(info);
            item.appendChild(val);
            list.appendChild(item);
        });
        listContainer.appendChild(list);
    }

    container.appendChild(balanceCard);
    container.appendChild(addBtn);
    container.appendChild(listContainer);

    return container;
};
