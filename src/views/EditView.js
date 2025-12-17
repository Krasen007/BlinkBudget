import { TransactionForm } from '../components/TransactionForm.js';
import { Button } from '../components/Button.js';
import { ConfirmDialog } from '../components/ConfirmDialog.js';
import { DateInput } from '../components/DateInput.js';
import { StorageService } from '../core/storage.js';
import { Router } from '../core/router.js';
import { SPACING, DIMENSIONS, TOUCH_TARGETS, FONT_SIZES, COLORS, TIMING } from '../utils/constants.js';
import { createButton } from '../utils/dom-factory.js';
import { addHoverEffects } from '../utils/touch-utils.js';
import { markTransactionForHighlight } from '../utils/success-feedback.js';

export const EditView = ({ id }) => {
    const container = document.createElement('div');
    container.className = 'view-edit';
    container.style.maxWidth = DIMENSIONS.CONTAINER_MAX_WIDTH;
    container.style.width = '100%';

    const transaction = StorageService.get(id);

    if (!transaction) {
        container.textContent = 'Transaction not found';
        setTimeout(() => Router.navigate('dashboard'), TIMING.ANIMATION_FAST * 10);
        return container;
    }

    const header = document.createElement('div');
    header.style.marginBottom = SPACING.MD;
    header.style.flexDirection = 'column';
    header.style.alignItems = 'stretch';
    header.style.gap = SPACING.SM;

    const topRow = document.createElement('div');
    topRow.style.display = 'flex';
    topRow.style.justifyContent = 'space-between';
    topRow.style.alignItems = 'center';

    const title = document.createElement('h2');
    title.textContent = 'Edit Transaction';
    title.style.margin = '0';
    title.style.marginRight = SPACING.MD;

    // Date Input with transaction date
    const dateInput = DateInput({ value: transaction.timestamp });

    // Back button
    const rightControls = document.createElement('div');
    rightControls.style.display = 'flex';
    rightControls.style.alignItems = 'center';

    const smallBackBtn = createButton({
        text: 'Back',
        className: 'btn btn-ghost',
        style: {
            height: TOUCH_TARGETS.MIN_HEIGHT,
            minHeight: TOUCH_TARGETS.MIN_HEIGHT,
            padding: `${SPACING.SM} ${SPACING.MD}`,
            fontSize: FONT_SIZES.SM,
            width: 'auto',
            flexShrink: '0'
        },
        onClick: () => Router.navigate('dashboard')
    });

    rightControls.appendChild(dateInput);
    rightControls.appendChild(smallBackBtn);

    topRow.appendChild(title);
    topRow.appendChild(rightControls);
    header.appendChild(topRow);
    container.appendChild(header);

    const form = TransactionForm({
        initialValues: transaction,
        externalDateInput: dateInput.querySelector('input[type="date"]'),
        onSubmit: (data) => {
            StorageService.update(id, data);
            
            // Mark transaction for highlighting in dashboard
            markTransactionForHighlight(id);
            
            // Navigate to dashboard immediately
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

    Object.assign(deleteBtn.style, {
        backgroundColor: 'transparent',
        color: COLORS.ERROR,
        border: `1px solid ${COLORS.ERROR}`,
        width: '100%',
        marginTop: SPACING.MD
    });

    // Add hover effects
    addHoverEffects(deleteBtn, {
        hoverBackground: COLORS.ERROR,
        hoverColor: 'white',
        originalBackground: 'transparent',
        originalColor: COLORS.ERROR
    });

    container.appendChild(form);
    container.appendChild(deleteBtn);

    return container;
};
