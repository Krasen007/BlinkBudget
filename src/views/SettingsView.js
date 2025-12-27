import { Button } from '../components/Button.js';
import { Router } from '../core/router.js';
import { AuthService } from '../core/auth-service.js';
import { AccountSection } from '../components/AccountSection.js';
import { DateFormatSection } from '../components/DateFormatSection.js';
import { DataManagementSection } from '../components/DataManagementSection.js';
import { DIMENSIONS, SPACING, TOUCH_TARGETS, FONT_SIZES } from '../utils/constants.js';
import { createButton } from '../utils/dom-factory.js';
import { createPWAInstructionsModal } from '../utils/modal-utils.js';
import { InstallService } from '../core/install.js';

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

    const refreshBtn = Button({
        text: 'Refresh App',
        variant: 'ghost',
        onClick: () => {
            if (window.mobileUtils?.supportsHaptic()) {
                window.mobileUtils.hapticFeedback([10]);
            }
            window.location.hash = '#dashboard';
            window.location.reload();
        }
    });
    refreshBtn.className += ' touch-target mobile-form-button';
    Object.assign(refreshBtn.style, {
        width: '100%',
        marginTop: SPACING.MD,
        minHeight: TOUCH_TARGETS.MIN_HEIGHT,
        padding: SPACING.MD,
        fontSize: FONT_SIZES.BASE,
        color: 'var(--color-primary-light)'
    });
    container.appendChild(refreshBtn);

    // OK Button
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

    // Install App Button (Conditional)
    const installBtn = Button({
        text: 'Install App',
        variant: 'primary',
        onClick: async () => {
            if (InstallService.isInstallable()) {
                const installed = await InstallService.promptInstall();
                if (installed) {
                    installBtn.style.display = 'none';
                }
            } else {
                // Show manual instructions
                createPWAInstructionsModal();
            }
        }
    });

    const updateInstallBtnVisibility = () => {
        const isStandalone = InstallService.isStandalone();
        const isMobile = window.mobileUtils?.isMobile();
        const isInstallable = InstallService.isInstallable();

        if (isStandalone) {
            installBtn.style.display = 'none';
        } else if (isInstallable || isMobile) {
            // Show button if it's installable OR if we're on mobile (to show manual instructions)
            installBtn.style.display = 'block';
        } else {
            installBtn.style.display = 'none';
        }
    };

    Object.assign(installBtn.style, {
        width: '100%',
        marginTop: SPACING.XL
    });

    updateInstallBtnVisibility();

    // Subscribe to installable changes
    const unsubscribeInstall = InstallService.subscribe(() => {
        updateInstallBtnVisibility();
    });

    container.appendChild(installBtn);

    // Logout Button
    const logoutBtn = Button({
        text: 'Logout',
        variant: 'ghost',
        onClick: () => {
            import('../components/ConfirmDialog.js').then(({ ConfirmDialog }) => {
                ConfirmDialog({
                    title: 'Logout',
                    message: 'Are you sure you want to logout? Cloud sync will stop.',
                    confirmText: 'Logout',
                    variant: 'danger',
                    onConfirm: async () => {
                        await AuthService.logout();
                        Router.navigate('login');
                    }
                });
            });
        }
    });
    Object.assign(logoutBtn.style, {
        width: '100%',
        color: 'var(--color-error)',
        marginTop: SPACING.MD,
        fontSize: FONT_SIZES.SM
    });
    container.appendChild(logoutBtn);

    const handleStorageUpdate = (e) => {
        console.log(`[Settings] Storage updated (${e.detail.key}), re-rendering...`);
        const parent = container.parentNode;
        if (parent) {
            parent.innerHTML = '';
            parent.appendChild(SettingsView());
        }
    };

    window.addEventListener('storage-updated', handleStorageUpdate);

    container.cleanup = () => {
        window.removeEventListener('storage-updated', handleStorageUpdate);
        unsubscribeInstall();
        if (dataSection && typeof dataSection.cleanup === 'function') {
            dataSection.cleanup();
        }
    };

    return container;
};
