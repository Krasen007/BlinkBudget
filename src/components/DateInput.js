/**
 * Date Input Component
 * Provides a formatted date input with hidden native date picker
 */

import { formatDate } from '../utils/date-utils.js';
import { getTodayISO, dateToISO } from '../utils/date-utils.js';
import { createInput } from '../utils/dom-factory.js';
import { DIMENSIONS, Z_INDEX, SPACING, COLORS } from '../utils/constants.js';

export const DateInput = (options = {}) => {
    const { value = null, onChange = null } = options;
    
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.width = DIMENSIONS.DATE_INPUT_WIDTH;
    container.style.marginRight = SPACING.SM;

    // Visible Display Input
    const displayDate = createInput({
        type: 'text',
        readOnly: true,
        className: 'mobile-form-input',
        style: {
            width: '100%',
            textAlign: 'center',
            cursor: 'pointer',
            color: COLORS.TEXT_MUTED
        }
    });

    // Hidden Native Date Input
    const realDate = createInput({
        type: 'date',
        style: {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            opacity: '0',
            zIndex: Z_INDEX.DATE_INPUT_OVERLAY.toString(),
            cursor: 'pointer'
        }
    });

    // Initialize with today's date or provided value
    const initialDate = value ? dateToISO(new Date(value)) : getTodayISO();
    realDate.value = initialDate;
    displayDate.value = formatDate(initialDate);

    // Sync display with real date
    realDate.addEventListener('change', (e) => {
        displayDate.value = formatDate(e.target.value);
        if (onChange) {
            onChange(e.target.value);
        }
    });

    // Show picker on click
    realDate.addEventListener('click', () => {
        try {
            if (realDate.showPicker) realDate.showPicker();
        } catch (err) {
            // Fallback for browsers without showPicker
        }
    });

    container.appendChild(displayDate);
    container.appendChild(realDate);

    // Expose methods
    container.getDate = () => realDate.value;
    container.setDate = (isoDate) => {
        realDate.value = isoDate;
        displayDate.value = formatDate(isoDate);
    };

    return container;
};

