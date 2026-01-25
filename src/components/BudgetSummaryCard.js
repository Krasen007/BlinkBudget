/**
 * BudgetSummaryCard Component
 * 
 * Displays a high-level overview of budget health.
 */

import { COLORS, SPACING, FONT_SIZES } from '../utils/constants.js';
import { formatCurrency } from '../utils/financial-planning-helpers.js';
import { BudgetProgress } from './BudgetProgress.js';

/**
 * Create a budget summary card
 * @param {Object} summary - Budget summary data from BudgetPlanner
 * @returns {HTMLElement}
 */
export const BudgetSummaryCard = (summary) => {
    const card = document.createElement('div');
    card.className = 'budget-summary-card';
    Object.assign(card.style, {
        background: COLORS.SURFACE,
        borderRadius: 'var(--radius-lg)',
        border: `1px solid ${COLORS.BORDER}`,
        padding: SPACING.LG,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.MD,
        width: '100%'
    });

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';

    const title = document.createElement('h3');
    title.textContent = 'Monthly Budget';
    title.style.margin = '0';
    title.style.fontSize = FONT_SIZES.LG;
    header.appendChild(title);

    const statusBadge = document.createElement('span');
    statusBadge.style.padding = `${SPACING.XS} ${SPACING.SM}`;
    statusBadge.style.borderRadius = 'var(--radius-sm)';
    statusBadge.style.fontSize = FONT_SIZES.SM;
    statusBadge.style.fontWeight = '600';

    if (summary.exceededCount > 0) {
        statusBadge.textContent = `${summary.exceededCount} Over`;
        statusBadge.style.background = 'rgba(239, 68, 68, 0.1)';
        statusBadge.style.color = COLORS.ERROR;
    } else if (summary.warningCount > 0) {
        statusBadge.textContent = 'At Risk';
        statusBadge.style.background = 'rgba(249, 115, 22, 0.1)';
        statusBadge.style.color = COLORS.WARNING;
    } else {
        statusBadge.textContent = 'On Track';
        statusBadge.style.background = 'rgba(16, 185, 129, 0.1)';
        statusBadge.style.color = COLORS.SUCCESS;
    }
    header.appendChild(statusBadge);
    card.appendChild(header);

    // Overall progress
    const progressContainer = BudgetProgress({
        utilization: summary.overallUtilization,
        isExceeded: summary.totalActual > summary.totalLimit && summary.totalLimit > 0,
        isWarning: summary.overallUtilization >= 80 && summary.overallUtilization <= 100,
        label: 'Overall Spending',
        secondaryLabel: `${formatCurrency(summary.totalActual)} / ${formatCurrency(summary.totalLimit)}`
    });
    card.appendChild(progressContainer);

    // Details
    const details = document.createElement('div');
    details.style.display = 'grid';
    details.style.gridTemplateColumns = '1fr 1fr';
    details.style.gap = SPACING.MD;
    details.style.marginTop = SPACING.XS;

    const createDetail = (label, value, color) => {
        const item = document.createElement('div');
        const labelEl = document.createElement('div');
        labelEl.textContent = label;
        labelEl.style.fontSize = FONT_SIZES.SM;
        labelEl.style.color = COLORS.TEXT_MUTED;

        const valueEl = document.createElement('div');
        valueEl.textContent = value;
        valueEl.style.fontSize = FONT_SIZES.MD;
        valueEl.style.fontWeight = 'bold';
        if (color) valueEl.style.color = color;

        item.appendChild(labelEl);
        item.appendChild(valueEl);
        return item;
    };

    details.appendChild(createDetail('Budgets', summary.totalBudgets));
    details.appendChild(createDetail('Available', formatCurrency(summary.totalAvailable), COLORS.SUCCESS));

    if (summary.totalOverspent > 0) {
        details.appendChild(createDetail('Overspent', formatCurrency(summary.totalOverspent), COLORS.ERROR));
    }

    card.appendChild(details);

    return card;
};
