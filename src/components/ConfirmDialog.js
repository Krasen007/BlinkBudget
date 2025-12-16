import { Button } from './Button.js';
import { MobileConfirmDialog } from './MobileModal.js';
import { COLORS } from '../utils/constants.js';

export const ConfirmDialog = ({ message, onConfirm, onCancel }) => {
    // Use mobile modal on mobile devices
    if (window.mobileUtils?.isMobile()) {
        return MobileConfirmDialog({
            title: 'Confirm Action',
            message,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            onConfirm,
            onCancel,
            variant: 'danger'
        });
    }

    // Desktop version (existing implementation)
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
        className: 'btn-ghost', // Use ghost class
        onClick: () => {
            document.body.removeChild(overlay);
            if (onCancel) onCancel();
        }
    });

    const confirmBtn = Button({
        text: 'Delete',
        variant: 'danger',
        onClick: () => {
            document.body.removeChild(overlay);
            if (onConfirm) onConfirm();
        }
    });

    // Apply danger styles directly
    confirmBtn.style.backgroundColor = COLORS.ERROR;
    confirmBtn.style.color = 'white';
    confirmBtn.style.border = `1px solid ${COLORS.ERROR}`;

    btnGroup.appendChild(cancelBtn);
    btnGroup.appendChild(confirmBtn);

    card.appendChild(text);
    card.appendChild(btnGroup);
    overlay.appendChild(card);

    document.body.appendChild(overlay);
};
