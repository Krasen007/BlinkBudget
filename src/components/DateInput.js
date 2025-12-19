/**
 * Date Input Component
 * Provides a formatted date input with hidden native date picker
 */

import { formatDate } from '../utils/date-utils.js';
import { getTodayISO, dateToISO } from '../utils/date-utils.js';
import { createInput } from '../utils/dom-factory.js';
import { DIMENSIONS, Z_INDEX, SPACING, COLORS, FONT_SIZES } from '../utils/constants.js';

export const DateInput = (options = {}) => {
    const { value = null, onChange = null, showLabel = true } = options;

    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.width = DIMENSIONS.DATE_INPUT_WIDTH;
    container.style.marginRight = SPACING.SM;

    // Label for accessibility and context
    const label = document.createElement('label');
    label.textContent = 'Select Date';
    label.style.fontSize = FONT_SIZES.XS;
    label.style.color = COLORS.TEXT_MUTED;
    label.style.marginBottom = SPACING.XS;
    label.style.fontWeight = '500';
    label.style.textAlign = 'center';
    label.style.width = '100%';
    label.style.display = showLabel ? 'block' : 'none';

    // Input wrapper for positioning
    const inputWrapper = document.createElement('div');
    inputWrapper.style.position = 'relative';
    inputWrapper.style.width = '100%';
    inputWrapper.style.display = 'flex';
    inputWrapper.style.alignItems = 'center';

    const inputId = `date-input-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Visible Display Input
    const displayDate = createInput({
        type: 'text',
        readOnly: true,
        className: 'mobile-form-input',
        id: `${inputId}-display`,
        name: 'transaction_date_display',
        style: {
            width: '100%',
            textAlign: 'center',
            cursor: 'pointer',
            color: COLORS.TEXT_MUTED,
            border: `1px solid ${COLORS.BORDER}`,
            borderRadius: 'var(--radius-md)',
            transition: 'all var(--transition-fast)'
        }
    });

    // Add accessibility attributes
    displayDate.setAttribute('aria-label', 'Transaction date - click to change');
    displayDate.setAttribute('role', 'button');
    displayDate.setAttribute('tabindex', '0');
    displayDate.title = 'Click to change transaction date';

    // Hidden Native Date Input
    const realDate = createInput({
        type: 'date',
        id: inputId,
        name: 'transaction_date',
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

    // Connect label to input for accessibility
    label.setAttribute('for', inputId);


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

    // Add keyboard support for accessibility
    displayDate.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            realDate.click();
        }
    });

    // Visual feedback on hover/focus
    const addHoverEffects = () => {
        displayDate.style.borderColor = COLORS.TEXT_MUTED;
        displayDate.style.transform = 'scale(1.02)';
    };

    const removeHoverEffects = () => {
        displayDate.style.borderColor = COLORS.BORDER;
        displayDate.style.transform = 'scale(1)';
    };

    displayDate.addEventListener('mouseenter', addHoverEffects);
    displayDate.addEventListener('mouseleave', removeHoverEffects);
    displayDate.addEventListener('focus', addHoverEffects);
    displayDate.addEventListener('blur', removeHoverEffects);

    // Build the component structure
    inputWrapper.appendChild(displayDate);
    inputWrapper.appendChild(realDate);

    // Always append label for accessibility, but control visibility
    container.appendChild(label);
    container.appendChild(inputWrapper);

    // Expose methods
    container.getDate = () => realDate.value;
    container.setDate = (isoDate) => {
        realDate.value = isoDate;
        displayDate.value = formatDate(isoDate);
    };

    return container;
};

