import { TransactionForm } from '../components/TransactionForm.js';
import { Button } from '../components/Button.js';
import { ConfirmDialog } from '../components/ConfirmDialog.js'; // Import Dialog
import { StorageService } from '../core/storage.js';
import { Router } from '../core/router.js';
import { MobileBackButton } from '../components/MobileNavigation.js';

export const EditView = ({ id }) => {
    // ... existing initialization ...
    const container = document.createElement('div');
    container.className = 'view-edit';

    // Add mobile back button
    const mobileBackBtn = MobileBackButton({
        onBack: () => Router.navigate('dashboard'),
        label: 'Cancel'
    });

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

    const deleteBtn = Button({
        text: 'Delete Transaction',
        variant: 'danger',
        onClick: () => {
            ConfirmDialog({
                message: 'Are you sure you want to delete this transaction?',
                onConfirm: () => {
                    StorageService.remove(id);
                    Router.navigate('dashboard');
                }
            });
        }
    });

    deleteBtn.style.backgroundColor = 'transparent';
    deleteBtn.style.color = '#ef4444';
    deleteBtn.style.border = '1px solid #ef4444';
    deleteBtn.style.width = '100%';
    deleteBtn.style.marginTop = 'var(--spacing-xl)';

    deleteBtn.addEventListener('mouseenter', () => {
        deleteBtn.style.backgroundColor = '#ef4444';
        deleteBtn.style.color = 'white';
    });
    deleteBtn.addEventListener('mouseleave', () => {
        deleteBtn.style.backgroundColor = 'transparent';
        deleteBtn.style.color = '#ef4444';
    });

    const backLink = document.createElement('button');
    backLink.textContent = 'Cancel';
    backLink.className = 'btn btn-ghost desktop-only'; // Hide on mobile
    backLink.style.width = '100%';
    backLink.style.marginTop = 'var(--spacing-md)';
    backLink.addEventListener('click', () => Router.navigate('dashboard'));

    container.appendChild(mobileBackBtn);
    container.appendChild(title);
    container.appendChild(form);
    container.appendChild(deleteBtn);
    container.appendChild(backLink);

    return container;
};
