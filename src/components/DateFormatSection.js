/**
 * Date Format Selection Section Component
 */

import { StorageService } from '../core/storage.js';
import { SPACING, TOUCH_TARGETS, FONT_SIZES, DATE_FORMATS, HAPTIC_PATTERNS } from '../utils/constants.js';
import { addTouchFeedback } from '../utils/touch-utils.js';

export const DateFormatSection = ({ onFormatChange }) => {
    const section = document.createElement('div');
    section.className = 'card mobile-settings-card';
    section.style.marginBottom = SPACING.LG;

    const title = document.createElement('h3');
    title.textContent = 'Date Format';
    title.className = 'mobile-settings-title';
    Object.assign(title.style, {
        marginBottom: SPACING.MD,
        fontSize: FONT_SIZES.XL
    });
    section.appendChild(title);

    const currentFormat = StorageService.getSetting('dateFormat') || DATE_FORMATS.DEFAULT;

    const createOption = (label, value) => {
        const row = document.createElement('div');
        row.className = 'mobile-settings-option touch-target';
        Object.assign(row.style, {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: SPACING.LG,
            cursor: 'pointer',
            minHeight: TOUCH_TARGETS.MIN_HEIGHT,
            borderRadius: 'var(--radius-md)',
            transition: 'background-color var(--transition-fast)',
            marginBottom: SPACING.SM,
            border: '1px solid var(--color-border)'
        });

        addTouchFeedback(row, {
            backgroundColor: 'var(--color-surface-hover)',
            scale: 0.98
        });

        const lbl = document.createElement('span');
        lbl.textContent = label;
        Object.assign(lbl.style, {
            fontSize: FONT_SIZES.BASE,
            fontWeight: '500'
        });

        const check = document.createElement('span');
        check.textContent = currentFormat === value ? '✓' : '';
        Object.assign(check.style, {
            color: 'var(--color-primary)',
            fontWeight: 'bold',
            fontSize: FONT_SIZES.LG
        });

        row.appendChild(lbl);
        row.appendChild(check);

        row.addEventListener('click', () => {
            StorageService.saveSetting('dateFormat', value);
            if (window.mobileUtils?.supportsHaptic()) {
                window.mobileUtils.hapticFeedback(HAPTIC_PATTERNS.WELCOME);
            }
            if (onFormatChange) {
                onFormatChange();
            }
        });

        return row;
    };

    section.appendChild(createOption('US (MM/DD/YYYY)', DATE_FORMATS.US));
    section.appendChild(createOption('ISO (YYYY-MM-DD)', DATE_FORMATS.ISO));
    section.appendChild(createOption('European (DD/MM/YYYY)', DATE_FORMATS.EU));

    return section;
};

