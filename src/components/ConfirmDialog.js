import { Button } from './Button.js';

export const ConfirmDialog = ({ message, onConfirm, onCancel }) => {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';

    const card = document.createElement('div');
    card.className = 'dialog-card';

    const text = document.createElement('p');
    text.textContent = message;
    text.style.marginBottom = 'var(--spacing-lg)';
    text.style.textAlign = 'center';

    const btnGroup = document.createElement('div');
    btnGroup.style.display = 'flex';
    btnGroup.style.gap = 'var(--spacing-md)';
    btnGroup.style.justifyContent = 'center';

    const cancelBtn = Button({
        text: 'Cancel',
        onClick: () => {
            document.body.removeChild(overlay);
            if (onCancel) onCancel();
        }
    });
    cancelBtn.style.background = 'transparent';
    cancelBtn.style.border = '1px solid var(--color-border)';
    cancelBtn.style.color = 'var(--color-text-muted)';

    const confirmBtn = Button({
        text: 'Delete',
        variant: 'danger',
        onClick: () => {
            document.body.removeChild(overlay);
            if (onConfirm) onConfirm();
        }
    });

    // Apply danger styles directly
    confirmBtn.style.backgroundColor = '#ef4444';
    confirmBtn.style.color = 'white';
    confirmBtn.style.border = '1px solid #ef4444';

    btnGroup.appendChild(cancelBtn);
    btnGroup.appendChild(confirmBtn);

    card.appendChild(text);
    card.appendChild(btnGroup);
    overlay.appendChild(card);

    document.body.appendChild(overlay);
};
