/**
 * CategoryCard Component
 * Displays spending summary for a specific category.
 */

import { COLORS, SPACING } from '../utils/constants.js';

/**
 * Create individual category card
 * @param {Object} category - Category data
 * @param {number} index - Index for animation
 * @param {Map} categoryColorMap - Map of category names to colors
 * @param {Function} getChartColors - Logic for fallback colors
 * @param {Function} onCategoryClick - Click callback
 * @returns {HTMLElement}
 */
export const CategoryCard = (category, index, categoryColorMap, getChartColors, onCategoryClick) => {
    const card = document.createElement('button');
    card.className = 'category-card';
    card.style.background = COLORS.SURFACE;
    card.style.border = `2px solid ${COLORS.BORDER}`;
    card.style.borderRadius = 'var(--radius-md)';
    card.style.padding = SPACING.MD;
    card.style.cursor = 'pointer';
    card.style.transition = 'all 0.2s ease';
    card.style.textAlign = 'left';
    card.style.width = '100%';

    const categoryColor = categoryColorMap.get(category.name) || getChartColors(1)[0];
    card.style.setProperty('--category-color', categoryColor);

    card.addEventListener('mouseenter', () => {
        card.style.borderColor = COLORS.PRIMARY;
        card.style.transform = 'translateY(-2px)';
        card.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
    });

    card.addEventListener('mouseleave', () => {
        card.style.borderColor = COLORS.BORDER;
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = 'none';
    });

    const colorIndicator = document.createElement('div');
    colorIndicator.style.width = '4px';
    colorIndicator.style.height = '40px';
    colorIndicator.style.background = categoryColor;
    colorIndicator.style.borderRadius = '2px';
    colorIndicator.style.marginBottom = SPACING.SM;

    const name = document.createElement('div');
    name.textContent = category.name;
    name.style.fontWeight = '600';
    name.style.color = COLORS.TEXT_MAIN;
    name.style.marginBottom = SPACING.XS;

    const amount = document.createElement('div');
    amount.textContent = `€${category.amount.toFixed(2)}`;
    amount.style.fontSize = '1.25rem';
    amount.style.fontWeight = 'bold';
    amount.style.color = COLORS.PRIMARY;
    amount.style.marginBottom = SPACING.XS;

    const percentage = document.createElement('div');
    percentage.textContent = `${typeof category.percentage === 'string' ? category.percentage : category.percentage.toFixed(1)}% of expenses`;
    percentage.style.fontSize = '0.875rem';
    percentage.style.color = COLORS.TEXT_MUTED;

    const transactionCount = document.createElement('div');
    transactionCount.textContent = `${category.transactionCount} transaction${category.transactionCount !== 1 ? 's' : ''}`;
    transactionCount.style.fontSize = '0.75rem';
    transactionCount.style.color = COLORS.TEXT_MUTED;
    transactionCount.style.marginTop = SPACING.XS;

    card.appendChild(colorIndicator);
    card.appendChild(name);
    card.appendChild(amount);
    card.appendChild(percentage);
    card.appendChild(transactionCount);

    card.addEventListener('click', () => {
        if (onCategoryClick) {
            onCategoryClick(category.name, category.amount, category.percentage);
        }
    });

    return card;
};
