import { TransactionForm } from '../components/TransactionForm.js';
import { Button } from '../components/Button.js';
import { ConfirmDialog } from '../components/ConfirmDialog.js'; // Import Dialog
import { StorageService } from '../core/storage.js';
import { Router } from '../core/router.js';
import { MobileBackButton } from '../components/MobileNavigation.js';

export const EditView = ({ id }) => {
    const container = document.createElement('div');
    container.className = 'view-edit';
    container.style.maxWidth = '600px';
    container.style.width = '100%';

    const transaction = StorageService.get(id);

    if (!transaction) {
        container.textContent = 'Transaction not found';
        setTimeout(() => Router.navigate('dashboard'), 2000);
        return container;
    }

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
    title.textContent = 'Edit Transaction';
    title.style.margin = '0';
    title.style.marginRight = 'var(--spacing-md)';

    // Date Input Container (for Top Right)
    const dateCtx = document.createElement('div');
    dateCtx.style.position = 'relative';
    dateCtx.style.display = 'flex';
    dateCtx.style.alignItems = 'center';
    dateCtx.style.width = '140px'; // Compact width
    dateCtx.style.marginRight = 'var(--spacing-sm)';

    // 1. Visible Display Input
    const displayDate = document.createElement('input');
    displayDate.type = 'text';
    displayDate.readOnly = true;
    displayDate.className = 'mobile-form-input';
    displayDate.style.width = '100%';
    displayDate.style.textAlign = 'center';
    displayDate.style.cursor = 'pointer';
    displayDate.style.color = 'var(--color-text-muted)';

    // 2. Hidden Native Date Input
    const realDate = document.createElement('input');
    realDate.type = 'date';
    realDate.style.position = 'absolute';
    realDate.style.top = '0';
    realDate.style.left = '0';
    realDate.style.width = '100%';
    realDate.style.height = '100%';
    realDate.style.opacity = '0';
    realDate.style.zIndex = '2';
    realDate.style.cursor = 'pointer';

    // Format Logic
    const formatDate = (isoDate) => {
        if (!isoDate) return '';
        const [year, month, day] = isoDate.split('-');
        const format = StorageService.getSetting('dateFormat') || 'US';
        switch (format) {
            case 'ISO': return `${year}-${month}-${day}`;
            case 'EU': return `${day}/${month}/${year}`;
            case 'US': default: return `${month}/${day}/${year}`;
        }
    };

    // Init Date with transaction date
    const transactionDate = new Date(transaction.timestamp).toISOString().split('T')[0];
    realDate.value = transactionDate;
    displayDate.value = formatDate(transactionDate);

    // Sync
    realDate.addEventListener('change', (e) => {
        displayDate.value = formatDate(e.target.value);
    });

    // Interaction Fixes
    realDate.addEventListener('click', (e) => {
        try { if (realDate.showPicker) realDate.showPicker(); } catch (err) { }
    });

    // Append
    dateCtx.appendChild(displayDate);
    dateCtx.appendChild(realDate);

    // Small Back button (Top Right)
    // Wrap Date and Back button in a container
    const rightControls = document.createElement('div');
    rightControls.style.display = 'flex';
    rightControls.style.alignItems = 'center';

    const smallBackBtn = document.createElement('button');
    smallBackBtn.textContent = 'Back';
    smallBackBtn.className = 'btn btn-ghost';
    smallBackBtn.style.height = '56px'; // Match form element height
    smallBackBtn.style.minHeight = '56px';
    smallBackBtn.style.padding = 'var(--spacing-sm) var(--spacing-md)';
    smallBackBtn.style.fontSize = 'var(--font-size-sm)';
    smallBackBtn.style.width = 'auto'; // Let it size to content
    smallBackBtn.style.flexShrink = '0'; // Don't shrink
    smallBackBtn.addEventListener('click', () => Router.navigate('dashboard'));

    rightControls.appendChild(dateCtx);
    rightControls.appendChild(smallBackBtn);

    topRow.appendChild(title);
    topRow.appendChild(rightControls);
    header.appendChild(topRow);
    container.appendChild(header);

    const form = TransactionForm({
        initialValues: transaction,
        externalDateInput: realDate, // Pass the hidden input
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

    container.appendChild(form);
    container.appendChild(deleteBtn);

    return container;
};
