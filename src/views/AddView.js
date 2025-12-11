import { TransactionForm } from '../components/TransactionForm.js';
import { StorageService } from '../core/storage.js';
import { Router } from '../core/router.js';

export const AddView = () => {
    const container = document.createElement('div');
    container.className = 'view-add';
    container.style.maxWidth = '600px';
    container.style.width = '100%';

    const header = document.createElement('div');
    header.style.marginBottom = 'var(--spacing-xl)';
    header.style.flexDirection = 'column';
    header.style.alignItems = 'stretch';
    header.style.gap = 'var(--spacing-md)';

    const topRow = document.createElement('div');
    topRow.style.display = 'flex';
    topRow.style.justifyContent = 'space-between';
    topRow.style.alignItems = 'center';

    const title = document.createElement('h2');
    title.textContent = 'Add Transaction';
    title.style.margin = '0';
    title.style.marginRight = 'var(--spacing-md)';

    const form = TransactionForm({
        onSubmit: (data) => {
            StorageService.add(data);
            Router.navigate('dashboard');
        }
    });

    const backLink = document.createElement('button');
    backLink.textContent = 'Cancel';
    backLink.className = 'btn btn-ghost'; // Use class
    backLink.style.width = '100%';
    backLink.style.marginTop = 'var(--spacing-md)';
    // Removed inline background/color/border to let CSS handle it
    backLink.addEventListener('click', () => Router.navigate('dashboard'));

    topRow.appendChild(title);
    header.appendChild(topRow);
    container.appendChild(header);
    container.appendChild(form);
    container.appendChild(backLink);

    return container;
};
