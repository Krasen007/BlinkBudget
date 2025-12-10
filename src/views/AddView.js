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

    const backLink = document.createElement('button');
    backLink.textContent = 'Cancel';
    backLink.className = 'btn';
    backLink.style.width = '100%';
    backLink.style.marginTop = 'var(--spacing-md)';
    backLink.style.color = 'var(--color-text-muted)';
    backLink.style.backgroundColor = 'transparent';
    backLink.style.border = '1px solid var(--color-border)';
    backLink.addEventListener('click', () => Router.navigate('dashboard'));

    container.appendChild(title);
    container.appendChild(form);
    container.appendChild(backLink);

    return container;
};
