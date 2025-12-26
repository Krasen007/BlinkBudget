/**
 * Data Management Section Component
 * Handles CSV export functionality
 */

import { Button } from './Button.js';
import { StorageService } from '../core/storage.js';
import { createAlertModal } from '../utils/modal-utils.js';
import { SPACING, TOUCH_TARGETS, FONT_SIZES, HAPTIC_PATTERNS } from '../utils/constants.js';
import { createInput } from '../utils/dom-factory.js';
import { getFirstDayOfMonthISO, getTodayISO } from '../utils/date-utils.js';
import { InstallService } from '../core/install.js';

export const DataManagementSection = () => {
    const section = document.createElement('div');
    section.className = 'card mobile-settings-card';
    section.style.marginBottom = SPACING.LG;

    const title = document.createElement('h3');
    title.textContent = 'Data Management';
    title.className = 'mobile-settings-title';
    Object.assign(title.style, {
        marginBottom: SPACING.MD,
        fontSize: FONT_SIZES.XL
    });
    section.appendChild(title);

    // Date Range Container
    const dateRangeContainer = document.createElement('div');
    dateRangeContainer.className = 'mobile-date-range-form';
    Object.assign(dateRangeContainer.style, {
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.MD,
        marginBottom: SPACING.LG
    });

    const createDateInput = (label, id) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'mobile-date-input-wrapper';
        wrapper.style.width = '100%';

        const lbl = document.createElement('label');
        lbl.textContent = label;
        lbl.htmlFor = id;
        Object.assign(lbl.style, {
            display: 'block',
            fontSize: FONT_SIZES.SM,
            fontWeight: '500',
            color: 'var(--color-text-muted)',
            marginBottom: SPACING.XS
        });

        const input = createInput({
            type: 'date',
            id,
            className: 'touch-target mobile-form-input',
            fontSize: FONT_SIZES.PREVENT_ZOOM
        });

        input.addEventListener('focus', () => {
            if (window.mobileUtils?.isMobile()) {
                window.mobileUtils.preventInputZoom(input);
                window.mobileUtils.scrollIntoViewAboveKeyboard(input);
            }
        });

        wrapper.appendChild(lbl);
        wrapper.appendChild(input);
        return { wrapper, input };
    };

    const startInput = createDateInput('Start Date', 'export-start');
    const endInput = createDateInput('End Date', 'export-end');

    // Default: Start of current month to Today
    startInput.input.value = getFirstDayOfMonthISO();
    endInput.input.value = getTodayISO();

    dateRangeContainer.appendChild(startInput.wrapper);
    dateRangeContainer.appendChild(endInput.wrapper);

    const exportBtn = Button({
        text: 'Export Transactions (CSV)',
        variant: 'primary',
        onClick: () => {
            const start = new Date(startInput.input.value);
            const end = new Date(endInput.input.value);
            end.setHours(23, 59, 59, 999);

            const transactions = StorageService.getAll().filter(t => {
                const tDate = new Date(t.timestamp);
                return tDate >= start && tDate <= end;
            });

            if (transactions.length === 0) {
                createAlertModal('No transactions found in this date range.');
                return;
            }

            // Generate CSV
            const headers = ['Date', 'Type', 'Category', 'Amount'];
            const rows = transactions.map(t => [
                new Date(t.timestamp).toLocaleDateString(),
                t.type.charAt(0).toUpperCase() + t.type.slice(1),
                t.category,
                (t.type === 'expense' ? -t.amount : t.amount).toFixed(2)
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `blinkbudget_export_${startInput.input.value}_to_${endInput.input.value}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);

            if (window.mobileUtils?.supportsHaptic()) {
                window.mobileUtils.hapticFeedback([10, 5, 10]);
            }
        }
    });
    exportBtn.className += ' touch-target mobile-form-button';
    Object.assign(exportBtn.style, {
        width: '100%',
        minHeight: TOUCH_TARGETS.MIN_HEIGHT,
        padding: SPACING.MD,
        fontSize: FONT_SIZES.BASE
    });

    section.appendChild(dateRangeContainer);
    section.appendChild(exportBtn);

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
    section.appendChild(refreshBtn);

    // Install Button
    const installBtn = Button({
        text: 'Install App',
        variant: 'primary',
        onClick: async () => {
            if (window.mobileUtils?.supportsHaptic()) {
                window.mobileUtils.hapticFeedback([10, 5, 10]);
            }
            const installed = await InstallService.promptInstall();
            if (installed) {
                installBtn.style.display = 'none';
            }
        }
    });
    installBtn.className += ' touch-target mobile-form-button';
    Object.assign(installBtn.style, {
        width: '100%',
        marginTop: SPACING.MD,
        minHeight: TOUCH_TARGETS.MIN_HEIGHT,
        padding: SPACING.MD,
        fontSize: FONT_SIZES.BASE,
        display: InstallService.isInstallable() ? 'block' : 'none'
    });

    // Subscribe to installable state changes
    const unsubscribeInstall = InstallService.subscribe((isInstallable) => {
        installBtn.style.display = isInstallable ? 'block' : 'none';
    });

    section.appendChild(installBtn);

    // Add cleanup to section or handle it in the view
    section.cleanup = () => {
        unsubscribeInstall();
    };

    return section;
};

