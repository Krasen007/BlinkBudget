import { Button } from './Button.js';
import { MobileConfirmDialog } from './MobileModal.js';
import { COLORS } from '../utils/constants.js';

export const ConfirmDialog = ({
    message,
    onConfirm,
    onCancel,
    confirmText = 'Delete', // Default to delete for backward compatibility
    title = 'Confirm Action',
    variant = 'danger'
}) => {
    // Use mobile modal on mobile devices
    if (window.mobileUtils?.isMobile()) {
        return MobileConfirmDialog({
            title,
            message,
            confirmText,
            cancelText: 'Cancel',
            onConfirm,
            onCancel,
            variant
        });
    }

    // Desktop version
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';

    const card = document.createElement('div');
    card.className = 'dialog-card';

    const titleEl = document.createElement('h3');
    titleEl.textContent = title;
    titleEl.style.marginBottom = 'var(--spacing-md)';
    titleEl.style.textAlign = 'center';

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
        className: 'btn-ghost',
        onClick: () => {
            document.body.removeChild(overlay);
            if (onCancel) onCancel();
        }
    });

    const confirmBtn = Button({
        text: confirmText,
        variant: variant,
        onClick: () => {
            document.body.removeChild(overlay);
            if (onConfirm) onConfirm();
        }
    });

    if (variant === 'danger') {
        confirmBtn.style.backgroundColor = COLORS.ERROR;
        confirmBtn.style.color = 'white';
        confirmBtn.style.border = `1px solid ${COLORS.ERROR}`;
    }

    btnGroup.appendChild(cancelBtn);
    btnGroup.appendChild(confirmBtn);

    card.appendChild(titleEl);
    card.appendChild(text);
    card.appendChild(btnGroup);
    overlay.appendChild(card);

    document.body.appendChild(overlay);
};
