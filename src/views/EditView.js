import { TransactionForm } from '../components/TransactionForm.js';
import { StorageService } from '../core/storage.js';
import { Router } from '../core/router.js';

export const EditView = ({ id }) => {
    const container = document.createElement('div');
    container.className = 'view-edit';

    const title = document.createElement('h2');
    title.textContent = 'Edit Transaction';
    title.style.marginBottom = 'var(--spacing-lg)';

    const transaction = StorageService.get(id);

    if (!transaction) {
        container.textContent = 'Transaction not found';
        setTimeout(() => Router.navigate('dashboard'), 2000);
        return container;
    }

    const form = TransactionForm({
        initialValues: transaction,
        onSubmit: (data) => {
            StorageService.update(id, data);
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
