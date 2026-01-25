/**
 * BudgetProgress Component
 * 
 * A reusable progress bar for budget visualization with color stages.
 */

import { COLORS, SPACING, FONT_SIZES } from '../utils/constants.js';

/**
 * Create a budget progress bar
 * @param {Object} props - { utilization, isExceeded, isWarning, label, secondaryLabel }
 * @returns {HTMLElement}
 */
export const BudgetProgress = ({ utilization, isExceeded, isWarning, label, secondaryLabel }) => {
    const container = document.createElement('div');
    container.className = 'budget-progress-container';
    Object.assign(container.style, {
        width: '100%',
        marginTop: SPACING.XS,
        marginBottom: SPACING.SM
    });

    // Labels row
    if (label || secondaryLabel) {
        const labelsRow = document.createElement('div');
        Object.assign(labelsRow.style, {
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '4px',
            fontSize: FONT_SIZES.SM,
            color: COLORS.TEXT_MUTED
        });

        if (label) {
            const labelEl = document.createElement('span');
            labelEl.textContent = label;
            labelsRow.appendChild(labelEl);
        }

        if (secondaryLabel) {
            const secondaryEl = document.createElement('span');
            secondaryEl.textContent = secondaryLabel;
            secondaryEl.style.fontWeight = '600';
            if (isExceeded) secondaryEl.style.color = COLORS.ERROR;
            else if (isWarning) secondaryEl.style.color = COLORS.WARNING;
            labelsRow.appendChild(secondaryEl);
        }

        container.appendChild(labelsRow);
    }

    // Progress Track
    const track = document.createElement('div');
    Object.assign(track.style, {
        height: '8px',
        width: '100%',
        background: COLORS.BORDER,
        borderRadius: '4px',
        overflow: 'hidden',
        position: 'relative'
    });

    // Progress Bar
    const bar = document.createElement('div');
    const clampedUtilization = Math.min(100, Math.max(0, utilization));

    Object.assign(bar.style, {
        height: '100%',
        width: `${clampedUtilization}%`,
        transition: 'width 0.3s ease, background-color 0.3s ease',
        borderRadius: '4px'
    });

    // Color logic
    if (isExceeded) {
        bar.style.background = COLORS.ERROR;
    } else if (isWarning) {
        bar.style.background = COLORS.WARNING;
    } else {
        bar.style.background = COLORS.SUCCESS;
    }

    track.appendChild(bar);
    container.appendChild(track);

    return container;
};
