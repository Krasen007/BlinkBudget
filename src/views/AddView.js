import { TransactionForm } from '../components/TransactionForm.js';
import { DateInput } from '../components/DateInput.js';
import { StorageService } from '../core/storage.js';
import { Router } from '../core/router.js';
import { SPACING, DIMENSIONS, TOUCH_TARGETS, FONT_SIZES, COLORS } from '../utils/constants.js';
import { createButton } from '../utils/dom-factory.js';

export const AddView = () => {
    const container = document.createElement('div');
    container.className = 'view-add';
    container.style.maxWidth = DIMENSIONS.CONTAINER_MAX_WIDTH;
    container.style.width = '100%';

    const header = document.createElement('div');
    header.style.marginBottom = SPACING.XL;
    header.style.flexDirection = 'column';
    header.style.alignItems = 'stretch';
    header.style.gap = SPACING.MD;

    const topRow = document.createElement('div');
    topRow.style.display = 'flex';
    topRow.style.justifyContent = 'space-between';
    topRow.style.alignItems = 'center';

    const title = document.createElement('h2');
    title.textContent = 'Add Transaction';
    title.style.margin = '0';
    title.style.marginRight = SPACING.MD;

    // Date Input
    const dateInput = DateInput();

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
        externalDateInput: dateInput.querySelector('input[type="date"]'),
        onSubmit: (data) => {
            StorageService.add(data);
            Router.navigate('dashboard');
        }
    });
    container.appendChild(form);

    const backLink = createButton({
        text: 'Cancel',
        className: 'mobile-form-input desktop-only',
        style: {
            marginTop: SPACING.MD,
            cursor: 'pointer',
            border: `1px solid ${COLORS.BORDER}`,
            background: COLORS.SURFACE,
            color: COLORS.TEXT_MAIN,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '500'
        },
        onClick: () => Router.navigate('dashboard')
    });
    container.appendChild(backLink);

    return container;
};
