import { Button } from '../components/Button.js';
import { Router } from '../core/router.js';
import { MobileBackButton } from '../components/MobileNavigation.js';
import { AccountSection } from '../components/AccountSection.js';
import { DateFormatSection } from '../components/DateFormatSection.js';
import { DataManagementSection } from '../components/DataManagementSection.js';
import { DIMENSIONS, SPACING, TOUCH_TARGETS, FONT_SIZES } from '../utils/constants.js';

export const SettingsView = () => {
    const container = document.createElement('div');
    container.className = 'view-settings mobile-settings-layout';
    container.style.maxWidth = DIMENSIONS.CONTAINER_MAX_WIDTH;
    container.style.width = '100%';

    // Header
    const header = document.createElement('div');
    header.className = 'settings-header';
    Object.assign(header.style, {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.XL
    });

    const title = document.createElement('h2');
    title.textContent = 'Settings';
    title.style.margin = 0;

    const mobileBackBtn = MobileBackButton({
        onBack: () => Router.navigate('dashboard'),
        label: 'Save'
    });

    const backBtn = Button({
        text: 'Save',
        variant: 'secondary',
        onClick: () => Router.navigate('dashboard')
    });
    backBtn.style.padding = `${SPACING.SM} ${SPACING.MD}`;
    backBtn.className += ' desktop-only';

    header.appendChild(title);
    header.appendChild(backBtn);

    // Mobile back button container
    const mobileBackContainer = document.createElement('div');
    mobileBackContainer.className = 'mobile-only';
    mobileBackContainer.style.marginBottom = SPACING.MD;
    mobileBackContainer.appendChild(mobileBackBtn);
    container.appendChild(mobileBackContainer);
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
