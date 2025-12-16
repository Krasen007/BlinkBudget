import { Button } from '../components/Button.js';
import { Router } from '../core/router.js';
import { AccountSection } from '../components/AccountSection.js';
import { DateFormatSection } from '../components/DateFormatSection.js';
import { DataManagementSection } from '../components/DataManagementSection.js';
import { DIMENSIONS, SPACING, TOUCH_TARGETS, FONT_SIZES } from '../utils/constants.js';
import { createButton } from '../utils/dom-factory.js';

export const SettingsView = () => {
    const container = document.createElement('div');
    container.className = 'view-settings mobile-settings-layout';
    container.style.maxWidth = DIMENSIONS.CONTAINER_MAX_WIDTH;
    container.style.width = '100%';

    // Header - compact like DashboardView
    const header = document.createElement('div');
    header.style.marginBottom = SPACING.MD;
    header.style.flexShrink = '0';

    const topRow = document.createElement('div');
    topRow.style.display = 'flex';
    topRow.style.justifyContent = 'space-between';
    topRow.style.alignItems = 'center';

    const title = document.createElement('h2');
    title.textContent = 'Settings';
    title.style.margin = '0';
    title.style.marginRight = SPACING.MD;

    // Save button in top right (same format as back button in AddView)
    const rightControls = document.createElement('div');
    rightControls.style.display = 'flex';
    rightControls.style.alignItems = 'center';

    const saveBtn = createButton({
        text: 'Save',
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

    rightControls.appendChild(saveBtn);

    topRow.appendChild(title);
    topRow.appendChild(rightControls);
    header.appendChild(topRow);
    container.appendChild(header);

    // Account Section
    const accountSection = AccountSection();
    container.appendChild(accountSection);

    // Date Format Section
    const dateFormatSection = DateFormatSection({
        onFormatChange: () => {
            // Re-render view to show update
            const parent = container.parentNode;
            if (parent) {
                parent.innerHTML = '';
                parent.appendChild(SettingsView());
            }
        }
    });
    container.appendChild(dateFormatSection);

    // Data Management Section
    const dataSection = DataManagementSection();
    container.appendChild(dataSection);

    // Done Button
    const doneBtn = Button({
        text: 'OK',
        variant: 'primary',
        onClick: () => Router.navigate('dashboard')
    });
    Object.assign(doneBtn.style, {
        width: '100%',
        marginTop: SPACING.XL,
        marginBottom: SPACING.XL,
        padding: SPACING.MD,
        fontSize: FONT_SIZES.BUTTON_LARGE,
        fontWeight: '600'
    });
    doneBtn.className += ' touch-target';
    container.appendChild(doneBtn);
    return container;
};
