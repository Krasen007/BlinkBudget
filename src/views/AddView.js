import { TransactionForm } from '../components/TransactionForm.js';
import { StorageService } from '../core/storage.js';
import { Router } from '../core/router.js';

export const AddView = () => {
    const container = document.createElement('div');
    container.className = 'view-add';

    const title = document.createElement('h2');
    title.textContent = 'Add Expense';
    title.style.marginBottom = 'var(--spacing-lg)';

    const form = TransactionForm({
        onSubmit: (data) => {
            StorageService.add(data);
            Router.navigate('dashboard');
        }
    });

    const backLink = document.createElement('a');
    backLink.textContent = 'Cancel';
    backLink.href = '#dashboard';
    backLink.style.display = 'block';
    backLink.style.marginTop = 'var(--spacing-md)';
    backLink.style.color = 'var(--color-text-muted)';

    container.appendChild(title);
    container.appendChild(form);
    container.appendChild(backLink);

    return container;
};
