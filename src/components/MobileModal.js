/**
 * Mobile Modal and Dialog Components
 * Provides mobile-appropriate modal dialogs with proper sizing and positioning
 * Requirements: 6.3
 */

/**
 * Mobile Modal Component
 * Creates a full-screen modal optimized for mobile devices
 */
export const MobileModal = ({
    title,
    content,
    onClose,
    showCloseButton = true,
    size = 'default' // 'default', 'full', 'bottom-sheet'
}) => {
    const overlay = document.createElement('div');
    overlay.className = 'mobile-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'modal-title');

    const modal = document.createElement('div');
    modal.className = `mobile-modal mobile-modal-${size}`;

    // Modal header
    if (title || showCloseButton) {
        const header = document.createElement('div');
        header.className = 'mobile-modal-header';

        if (title) {
            const titleElement = document.createElement('h2');
            titleElement.id = 'modal-title';
            titleElement.className = 'mobile-modal-title';
            titleElement.textContent = title;
            header.appendChild(titleElement);
        }

        if (showCloseButton) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'mobile-modal-close';
            closeBtn.setAttribute('aria-label', 'Close modal');
            closeBtn.innerHTML = '✕';

            // Touch feedback
            closeBtn.addEventListener('touchstart', (e) => {
                closeBtn.classList.add('touch-active');
                if (window.mobileUtils?.supportsHaptic()) {
                    window.mobileUtils.hapticFeedback([5]);
                }
            }, { passive: true });

            closeBtn.addEventListener('touchend', () => {
                closeBtn.classList.remove('touch-active');
            }, { passive: true });

            closeBtn.addEventListener('touchcancel', () => {
                closeBtn.classList.remove('touch-active');
            }, { passive: true });

            closeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                closeModal();
            });

            header.appendChild(closeBtn);
        }

        modal.appendChild(header);
    }

    // Modal content
    const contentContainer = document.createElement('div');
    contentContainer.className = 'mobile-modal-content';

    if (typeof content === 'string') {
        contentContainer.innerHTML = content;
    } else if (content instanceof HTMLElement) {
        contentContainer.appendChild(content);
    }

    modal.appendChild(contentContainer);
    overlay.appendChild(modal);

    // Close modal function
    const closeModal = () => {
        overlay.classList.add('closing');
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
            if (onClose) {
                onClose();
            }
        }, 200); // Match CSS animation duration
    };

    // Close on overlay click (but not on modal content click)
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeModal();
        }
    });

    // Close on escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    // Restore body scroll when modal closes
    const originalCloseModal = closeModal;
    const closeModalWithScrollRestore = () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleEscape);
        originalCloseModal();
    };

    // Update close functions
    overlay.closeModal = closeModalWithScrollRestore;

    // Add to DOM with animation
    document.body.appendChild(overlay);

    // Trigger animation
    requestAnimationFrame(() => {
        overlay.classList.add('visible');
    });

    return overlay;
};

/**
 * Mobile Alert Dialog
 */
export const MobileAlert = ({ title = 'Alert', message, buttonText = 'OK', onConfirm }) => {
    const content = document.createElement('div');
    content.className = 'mobile-confirm-content';

    if (message) {
        const messageElement = document.createElement('p');
        messageElement.className = 'mobile-confirm-message';
        messageElement.textContent = message;
        content.appendChild(messageElement);
    }

    const actions = document.createElement('div');
    actions.className = 'mobile-confirm-actions';

    const okBtn = document.createElement('button');
    okBtn.className = 'btn btn-primary mobile-confirm-btn';
    okBtn.style.width = '100%';
    okBtn.textContent = buttonText;

    okBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (onConfirm) onConfirm();
        const modal = okBtn.closest('.mobile-modal-overlay');
        if (modal && modal.closeModal) modal.closeModal();
    });

    actions.appendChild(okBtn);
    content.appendChild(actions);

    return MobileModal({
        title,
        content,
        showCloseButton: false
    });
};

/**
 * Mobile Prompt Dialog (for single input)
 */
export const MobilePrompt = ({ title, message, initialValue = '', placeholder = '', onSave, onCancel }) => {
    const content = document.createElement('div');
    content.className = 'mobile-prompt-content';

    if (message) {
        const messageElement = document.createElement('p');
        messageElement.className = 'mobile-confirm-message';
        messageElement.textContent = message;
        content.appendChild(messageElement);
    }

    const input = document.createElement('input');
    input.type = 'text';
    input.value = initialValue;
    input.placeholder = placeholder;
    input.className = 'mobile-form-input';
    Object.assign(input.style, {
        width: '100%',
        padding: 'var(--spacing-md)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        marginBottom: 'var(--spacing-lg)',
        fontSize: '16px' // Prevent iOS zoom
    });
    content.appendChild(input);

    const actions = document.createElement('div');
    actions.className = 'mobile-confirm-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-ghost mobile-confirm-btn';
    cancelBtn.textContent = 'Cancel';

    cancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (onCancel) onCancel();
        const modal = cancelBtn.closest('.mobile-modal-overlay');
        if (modal && modal.closeModal) modal.closeModal();
    });

    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-primary mobile-confirm-btn';
    saveBtn.textContent = 'Save';

    saveBtn.addEventListener('click', (e) => {
        e.preventDefault();
        onSave(input.value);
        const modal = saveBtn.closest('.mobile-modal-overlay');
        if (modal && modal.closeModal) modal.closeModal();
    });

    actions.appendChild(cancelBtn);
    actions.appendChild(saveBtn);
    content.appendChild(actions);

    const modalOverlay = MobileModal({
        title,
        content,
        showCloseButton: false
    });

    // Focus input
    setTimeout(() => input.focus(), 100);

    return modalOverlay;
};

/**
 * Mobile Confirmation Dialog
 * Creates a mobile-optimized confirmation dialog
 */
export const MobileConfirmDialog = ({
    title = 'Confirm Action',
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    variant = 'default' // 'default', 'danger'
}) => {
    const content = document.createElement('div');
    content.className = 'mobile-confirm-content';

    // Message
    if (message) {
        const messageElement = document.createElement('p');
        messageElement.className = 'mobile-confirm-message';
        messageElement.textContent = message;
        content.appendChild(messageElement);
    }

    // Action buttons
    const actions = document.createElement('div');
    actions.className = 'mobile-confirm-actions';

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-ghost mobile-confirm-btn';
    cancelBtn.textContent = cancelText;

    // Touch feedback for cancel
    cancelBtn.addEventListener('touchstart', (e) => {
        cancelBtn.classList.add('touch-active');
    }, { passive: true });

    cancelBtn.addEventListener('touchend', () => {
        cancelBtn.classList.remove('touch-active');
    }, { passive: true });

    cancelBtn.addEventListener('touchcancel', () => {
        cancelBtn.classList.remove('touch-active');
    }, { passive: true });

    cancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (onCancel) {
            onCancel();
        }
        // Close modal
        const modal = cancelBtn.closest('.mobile-modal-overlay');
        if (modal && modal.closeModal) {
            modal.closeModal();
        }
    });

    // Confirm button
    const confirmBtn = document.createElement('button');
    confirmBtn.className = `btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'} mobile-confirm-btn`;
    confirmBtn.textContent = confirmText;

    // Touch feedback for confirm
    confirmBtn.addEventListener('touchstart', (e) => {
        confirmBtn.classList.add('touch-active');
        if (window.mobileUtils?.supportsHaptic()) {
            window.mobileUtils.hapticFeedback([10]);
        }
    }, { passive: true });

    confirmBtn.addEventListener('touchend', () => {
        confirmBtn.classList.remove('touch-active');
    }, { passive: true });

    confirmBtn.addEventListener('touchcancel', () => {
        confirmBtn.classList.remove('touch-active');
    }, { passive: true });

    confirmBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (onConfirm) {
            onConfirm();
        }
        // Close modal
        const modal = confirmBtn.closest('.mobile-modal-overlay');
        if (modal && modal.closeModal) {
            modal.closeModal();
        }
    });

    actions.appendChild(cancelBtn);
    actions.appendChild(confirmBtn);
    content.appendChild(actions);

    return MobileModal({
        title,
        content,
        showCloseButton: false,
        size: 'default'
    });
};

/**
 * Mobile Bottom Sheet Component
 * Creates a bottom sheet modal that slides up from the bottom
 */
export const MobileBottomSheet = ({
    title,
    content,
    onClose,
    showHandle = true
}) => {
    const overlay = document.createElement('div');
    overlay.className = 'mobile-bottom-sheet-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    const sheet = document.createElement('div');
    sheet.className = 'mobile-bottom-sheet';

    // Drag handle
    if (showHandle) {
        const handle = document.createElement('div');
        handle.className = 'mobile-bottom-sheet-handle';
        sheet.appendChild(handle);
    }

    // Header
    if (title) {
        const header = document.createElement('div');
        header.className = 'mobile-bottom-sheet-header';

        const titleElement = document.createElement('h3');
        titleElement.className = 'mobile-bottom-sheet-title';
        titleElement.textContent = title;
        header.appendChild(titleElement);

        sheet.appendChild(header);
    }

    // Content
    const contentContainer = document.createElement('div');
    contentContainer.className = 'mobile-bottom-sheet-content';

    if (typeof content === 'string') {
        contentContainer.innerHTML = content;
    } else if (content instanceof HTMLElement) {
        contentContainer.appendChild(content);
    }

    sheet.appendChild(contentContainer);
    overlay.appendChild(sheet);

    // Close function
    const closeSheet = () => {
        overlay.classList.add('closing');
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
            document.body.style.overflow = '';
            if (onClose) {
                onClose();
            }
        }, 300); // Match CSS animation duration
    };

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeSheet();
        }
    });

    // Swipe to close functionality
    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    const handleTouchStart = (e) => {
        startY = e.touches[0].clientY;
        isDragging = true;
        sheet.style.transition = 'none';
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;

        currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;

        // Only allow downward swipes
        if (deltaY > 0) {
            sheet.style.transform = `translateY(${deltaY}px)`;
        }
    };

    const handleTouchEnd = () => {
        if (!isDragging) return;

        isDragging = false;
        sheet.style.transition = '';

        const deltaY = currentY - startY;

        // Close if swiped down more than 100px
        if (deltaY > 100) {
            closeSheet();
        } else {
            // Snap back to position
            sheet.style.transform = 'translateY(0)';
        }
    };

    sheet.addEventListener('touchstart', handleTouchStart, { passive: true });
    sheet.addEventListener('touchmove', handleTouchMove, { passive: true });
    sheet.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Add to DOM
    document.body.appendChild(overlay);

    // Trigger animation
    requestAnimationFrame(() => {
        overlay.classList.add('visible');
    });

    return overlay;
};