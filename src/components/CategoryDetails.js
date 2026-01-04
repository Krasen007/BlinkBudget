/**
 * CategoryDetails Component
 * Displays detailed information and recent transactions for a selected category.
 */

import { COLORS, SPACING } from '../utils/constants.js';

/**
 * Update the category details section with data
 * @param {string} categoryName - Name of the category
 * @param {number} amount - Total spent in category
 * @param {number|string} percentage - Percentage of total expenses
 * @param {Object} currentData - Full analytics data
 * @returns {void}
 */
export const showCategoryDetails = (categoryName, amount, percentage, currentData) => {
    const detailsSection = document.getElementById('category-details-section');
    if (!detailsSection) return;

    const categoryTransactions = currentData.transactions.filter(t =>
        (t.category || 'Uncategorized') === categoryName && t.type === 'expense'
    );

    const averageAmount = categoryTransactions.length > 0 ? (amount / categoryTransactions.length) : 0;

    detailsSection.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${SPACING.MD};">
            <h4 style="margin: 0; color: ${COLORS.TEXT_MAIN};">${categoryName} Details</h4>
            <button id="close-category-details" 
                    style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: ${COLORS.TEXT_MUTED}; padding: ${SPACING.XS};">×</button>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: ${SPACING.MD}; margin-bottom: ${SPACING.MD};">
            <div>
                <div style="font-size: 0.875rem; color: ${COLORS.TEXT_MUTED};">Total Spent</div>
                <div style="font-size: 1.25rem; font-weight: bold; color: ${COLORS.PRIMARY};">€${amount.toFixed(2)}</div>
            </div>
            <div>
                <div style="font-size: 0.875rem; color: ${COLORS.TEXT_MUTED};">Percentage</div>
                <div style="font-size: 1.25rem; font-weight: bold; color: ${COLORS.PRIMARY};">${typeof percentage === 'string' ? percentage : percentage.toFixed(1)}%</div>
            </div>
            <div>
                <div style="font-size: 0.875rem; color: ${COLORS.TEXT_MUTED};">Transactions</div>
                <div style="font-size: 1.25rem; font-weight: bold; color: ${COLORS.PRIMARY};">${categoryTransactions.length}</div>
            </div>
            <div>
                <div style="font-size: 0.875rem; color: ${COLORS.TEXT_MUTED};">Average</div>
                <div style="font-size: 1.25rem; font-weight: bold; color: ${COLORS.PRIMARY};">€${averageAmount.toFixed(2)}</div>
            </div>
        </div>
        <div style="margin-top: ${SPACING.MD};">
            <div style="font-size: 0.875rem; color: ${COLORS.TEXT_MUTED}; margin-bottom: ${SPACING.SM};">Recent Transactions:</div>
            <div style="max-height: 200px; overflow-y: auto;">
                ${categoryTransactions.length > 0 ? categoryTransactions.slice(0, 10).map(t => `
                    <div style="display: flex; justify-content: space-between; padding: ${SPACING.XS} 0; border-bottom: 1px solid ${COLORS.BORDER};">
                        <span style="color: ${COLORS.TEXT_MAIN};">${t.description || 'No description'}</span>
                        <span style="font-weight: 600; color: ${COLORS.ERROR};">€${Math.abs(t.amount).toFixed(2)}</span>
                    </div>
                `).join('') : `<div style="color: ${  COLORS.TEXT_MUTED  };">No transactions found</div>`}
            </div>
        </div>
    `;

    detailsSection.style.display = 'block';

    const closeBtn = detailsSection.querySelector('#close-category-details');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            detailsSection.style.display = 'none';
        });
    }

    detailsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};
