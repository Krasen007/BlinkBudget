/**
 * Modal creation utilities
 * Centralizes modal creation logic to eliminate duplication
 */

import { Button } from '../components/Button.js';
import { COLORS, DIMENSIONS, SPACING, FONT_SIZES, TOUCH_TARGETS, Z_INDEX, TIMING } from './constants.js';
import { addTouchFeedback } from './touch-utils.js';

/**
 * Create a modal overlay
 * @param {Object} options - Overlay configuration
 * @returns {HTMLDivElement} Overlay element
 */
export const createModalOverlay = (options = {}) => {
    const {
        onClick = null,
        className = 'mobile-modal-overlay',
        zIndex = Z_INDEX.MODAL_OVERLAY
    } = options;

    const overlay = document.createElement('div');
    overlay.className = className;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    const style = {
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: zIndex.toString(),
        padding: SPACING.LG
    };

    Object.assign(overlay.style, style);

    if (onClick) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                onClick();
            }
        });
    }

    return overlay;
};

/**
 * Create a modal container
 * @param {Object} options - Modal configuration
 * @returns {HTMLDivElement} Modal element
 */
export const createModal = (options = {}) => {
    const {
        maxWidth = DIMENSIONS.MODAL_MAX_WIDTH,
        className = 'mobile-modal',
        padding = SPACING.XL
    } = options;

    const modal = document.createElement('div');
    modal.className = className;

    const style = {
        backgroundColor: COLORS.SURFACE,
        borderRadius: 'var(--radius-lg)',
        padding,
        width: '100%',
        maxWidth,
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
    };

    Object.assign(modal.style, style);

    return modal;
};

/**
 * Create a mobile-friendly account rename modal
 * @param {string} currentName - Current account name
 * @param {Function} onSave - Callback when save is clicked
 */
export const createAccountRenameModal = (currentName, onSave) => {
    const closeModal = () => {
        if (overlay.parentNode) {
            overlay.classList.remove('visible');
            setTimeout(() => {
                if (overlay.parentNode) {
                    document.body.removeChild(overlay);
                }
            }, 200); // Match the CSS transition duration
        }
    };

    const overlay = createModalOverlay({ onClick: closeModal });
    const modal = createModal();

    const title = document.createElement('h3');
    title.textContent = 'Rename Account';
    title.style.margin = `0 0 ${SPACING.LG} 0`;
    title.style.fontSize = FONT_SIZES.XL;
    title.style.textAlign = 'center';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentName;
    input.placeholder = 'Account Name';
    input.className = 'touch-target mobile-form-input';
    Object.assign(input.style, {
        width: '100%',
        minHeight: TOUCH_TARGETS.MIN_HEIGHT,
        fontSize: FONT_SIZES.PREVENT_ZOOM,
        padding: SPACING.MD,
        marginBottom: SPACING.LG,
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${COLORS.BORDER}`,
        background: COLORS.SURFACE,
        color: COLORS.TEXT_MAIN
    });

    const buttonContainer = document.createElement('div');
    Object.assign(buttonContainer.style, {
        display: 'flex',
        gap: SPACING.MD
    });

    const cancelBtn = Button({
        text: 'Cancel',
        variant: 'secondary',
        onClick: closeModal
    });
    cancelBtn.className += ' touch-target';
    cancelBtn.style.flex = '1';
    cancelBtn.style.minHeight = TOUCH_TARGETS.MIN_HEIGHT;

    const saveBtn = Button({
        text: 'Save',
        variant: 'primary',
        onClick: () => {
            const newName = input.value.trim();
            if (newName) {
                onSave(newName);
                closeModal();
            }
        }
    });
    saveBtn.className += ' touch-target';
    saveBtn.style.flex = '1';
    saveBtn.style.minHeight = TOUCH_TARGETS.MIN_HEIGHT;

    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(saveBtn);

    modal.appendChild(title);
    modal.appendChild(input);
    modal.appendChild(buttonContainer);
    overlay.appendChild(modal);

    document.body.appendChild(overlay);

    // Trigger fade-in animation by adding visible class
    setTimeout(() => {
        overlay.classList.add('visible');
    }, 10);

    // Focus input and select text
    setTimeout(() => {
        input.focus();
        input.select();
    }, TIMING.FOCUS_DELAY);
};

/**
 * Create a mobile-friendly confirmation modal
 * @param {string} titleText - Modal title
 * @param {string} message - Modal message
 * @param {Function} onConfirm - Callback when confirmed
 */
export const createConfirmModal = (titleText, message, onConfirm) => {
    const closeModal = () => {
        if (overlay.parentNode) {
            overlay.classList.remove('visible');
            setTimeout(() => {
                if (overlay.parentNode) {
                    document.body.removeChild(overlay);
                }
            }, 200); // Match the CSS transition duration
        }
    };

    const overlay = createModalOverlay({ onClick: closeModal });
    const modal = createModal();

    const titleEl = document.createElement('h3');
    titleEl.textContent = titleText;
    titleEl.style.margin = `0 0 ${SPACING.MD} 0`;
    titleEl.style.fontSize = FONT_SIZES.XL;
    titleEl.style.textAlign = 'center';

    const messageEl = document.createElement('p');
    messageEl.textContent = message;
    messageEl.style.margin = `0 0 ${SPACING.LG} 0`;
    messageEl.style.fontSize = FONT_SIZES.SM;
    messageEl.style.color = COLORS.TEXT_MUTED;
    messageEl.style.textAlign = 'center';
    messageEl.style.lineHeight = 'var(--line-height-relaxed)';

    const buttonContainer = document.createElement('div');
    Object.assign(buttonContainer.style, {
        display: 'flex',
        gap: SPACING.MD
    });

    const cancelBtn = Button({
        text: 'Cancel',
        variant: 'secondary',
        onClick: closeModal
    });
    cancelBtn.className += ' touch-target';
    cancelBtn.style.flex = '1';
    cancelBtn.style.minHeight = TOUCH_TARGETS.MIN_HEIGHT;

    const confirmBtn = Button({
        text: 'Delete',
        variant: 'primary',
        onClick: () => {
            onConfirm();
            closeModal();
        }
    });
    confirmBtn.className += ' touch-target';
    confirmBtn.style.flex = '1';
    confirmBtn.style.minHeight = TOUCH_TARGETS.MIN_HEIGHT;
    confirmBtn.style.backgroundColor = COLORS.ERROR;
    confirmBtn.style.borderColor = COLORS.ERROR;

    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(confirmBtn);

    modal.appendChild(titleEl);
    modal.appendChild(messageEl);
    modal.appendChild(buttonContainer);
    overlay.appendChild(modal);

    document.body.appendChild(overlay);

    // Trigger fade-in animation by adding visible class
    setTimeout(() => {
        overlay.classList.add('visible');
    }, 10);
};

/**
 * Create a mobile-friendly alert modal
 * @param {string} message - Alert message
 */
export const createAlertModal = (message) => {
    const closeModal = () => {
        if (overlay.parentNode) {
            overlay.classList.remove('visible');
            setTimeout(() => {
                if (overlay.parentNode) {
                    document.body.removeChild(overlay);
                }
            }, 200); // Match the CSS transition duration
        }
    };

    const overlay = createModalOverlay({ onClick: closeModal });
    const modal = createModal({
        maxWidth: DIMENSIONS.MODAL_MAX_WIDTH_SMALL
    });

    const messageEl = document.createElement('p');
    messageEl.textContent = message;
    messageEl.style.margin = `0 0 ${SPACING.LG} 0`;
    messageEl.style.fontSize = FONT_SIZES.BASE;
    messageEl.style.textAlign = 'center';
    messageEl.style.lineHeight = 'var(--line-height-relaxed)';

    const okBtn = Button({
        text: 'OK',
        variant: 'primary',
        onClick: closeModal
    });
    okBtn.className += ' touch-target';
    okBtn.style.width = '100%';
    okBtn.style.minHeight = TOUCH_TARGETS.MIN_HEIGHT;

    modal.appendChild(messageEl);
    modal.appendChild(okBtn);
    overlay.appendChild(modal);

    document.body.appendChild(overlay);

    // Trigger fade-in animation by adding visible class
    setTimeout(() => {
        overlay.classList.add('visible');
    }, 10);
};

/**
 * Create a modal with manual PWA installation instructions
 */
export const createPWAInstructionsModal = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    const closeModal = () => {
        if (overlay.parentNode) {
            overlay.classList.remove('visible');
            setTimeout(() => {
                if (overlay.parentNode) {
                    document.body.removeChild(overlay);
                }
            }, 200);
        }
    };

    const overlay = createModalOverlay({ onClick: closeModal });
    const modal = createModal();

    const titleEl = document.createElement('h3');
    titleEl.textContent = 'Install App';
    titleEl.style.margin = `0 0 ${SPACING.MD} 0`;
    titleEl.style.fontSize = FONT_SIZES.XL;
    titleEl.style.textAlign = 'center';

    const messageEl = document.createElement('div');
    messageEl.style.marginBottom = SPACING.LG;
    messageEl.style.fontSize = FONT_SIZES.BASE;
    messageEl.style.lineHeight = '1.6';

    if (isIOS) {
        messageEl.innerHTML = `
            <p style="margin-bottom: 12px;">To install BlinkBudget on your iPhone/iPad:</p>
            <ol style="padding-left: 20px;">
                <li style="margin-bottom: 8px;">Tap the <strong>Share</strong> button (box with upward arrow) at the bottom of the screen.</li>
                <li style="margin-bottom: 8px;">Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                <li>Tap <strong>Add</strong> in the top right corner.</li>
            </ol>
        `;
    } else {
        messageEl.innerHTML = `
            <p style="margin-bottom: 12px;">To install BlinkBudget on your device:</p>
            <ol style="padding-left: 20px;">
                <li style="margin-bottom: 8px;">Open your browser's menu (usually three dots or lines in the corner).</li>
                <li style="margin-bottom: 8px;">Look for <strong>Install App</strong> or <strong>Add to Home Screen</strong>.</li>
                <li>Follow the on-screen instructions.</li>
            </ol>
        `;
    }

    const okBtn = Button({
        text: 'Got it',
        variant: 'primary',
        onClick: closeModal
    });
    okBtn.className += ' touch-target';
    okBtn.style.width = '100%';
    okBtn.style.minHeight = TOUCH_TARGETS.MIN_HEIGHT;

    modal.appendChild(titleEl);
    modal.appendChild(messageEl);
    modal.appendChild(okBtn);
    overlay.appendChild(modal);

    document.body.appendChild(overlay);

    setTimeout(() => {
        overlay.classList.add('visible');
    }, 10);
};
