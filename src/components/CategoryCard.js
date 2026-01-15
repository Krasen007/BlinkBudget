/**
 * CategoryCard Component
 * Displays spending summary and frequency patterns for a specific category.
 */

import { COLORS, SPACING, FONT_SIZES } from '../utils/constants.js';
import { formatCurrency } from '../utils/financial-planning-helpers.js';

/**
 * Create individual category card
 * @param {Object} category - Category data
 * @param {number} index - Index for animation
 * @param {Map} categoryColorMap - Map of category names to colors
 * @param {Function} getChartColors - Logic for fallback colors
 * @param {Function} onCategoryClick - Click callback
 * @param {Object} frequencyData - Optional frequency analysis data
 * @returns {HTMLElement}
 */
export const CategoryCard = (
  category,
  index,
  categoryColorMap,
  getChartColors,
  onCategoryClick,
  frequencyData = null
) => {
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

  const categoryColor =
    categoryColorMap.get(category.name) || getChartColors(1)[0];
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
  amount.textContent = formatCurrency(category.amount);
  amount.style.fontSize = FONT_SIZES.TITLE_DESKTOP;
  amount.style.fontWeight = 'bold';
  amount.style.color = COLORS.PRIMARY;
  amount.style.marginBottom = SPACING.XS;

  const percentage = document.createElement('div');
  percentage.textContent = `${typeof category.percentage === 'string' ? category.percentage : category.percentage.toFixed(1)}% of expenses`;
  percentage.style.fontSize = FONT_SIZES.STAT_LABEL_DESKTOP;
  percentage.style.color = COLORS.TEXT_MUTED;

  const transactionCount = document.createElement('div');
  transactionCount.textContent = `${category.transactionCount} transaction${category.transactionCount !== 1 ? 's' : ''}`;
  transactionCount.style.fontSize = FONT_SIZES.BASE;
  transactionCount.style.color = COLORS.TEXT_MUTED;
  transactionCount.style.marginTop = SPACING.XS;

  card.appendChild(colorIndicator);
  card.appendChild(name);
  card.appendChild(amount);
  card.appendChild(percentage);
  card.appendChild(transactionCount);

  // Add frequency analysis if available
  if (frequencyData && frequencyData[category.name]) {
    const freqData = frequencyData[category.name];

    const frequencySection = document.createElement('div');
    frequencySection.style.marginTop = SPACING.SM;
    frequencySection.style.paddingTop = SPACING.SM;
    frequencySection.style.borderTop = `1px solid ${COLORS.BORDER}`;

    const frequencyTitle = document.createElement('div');
    frequencyTitle.textContent = 'Visit Frequency';
    frequencyTitle.style.fontSize = FONT_SIZES.SM;
    frequencyTitle.style.fontWeight = '600';
    frequencyTitle.style.color = COLORS.TEXT_MAIN;
    frequencyTitle.style.marginBottom = SPACING.XS;

    const visitsPerWeek = document.createElement('div');
    visitsPerWeek.textContent = `${freqData.averageVisitsPerWeek.toFixed(1)} visits/week`;
    visitsPerWeek.style.fontSize = FONT_SIZES.SM;
    visitsPerWeek.style.color = COLORS.TEXT_MUTED;
    visitsPerWeek.style.marginBottom = SPACING.XS;

    const avgSpent = document.createElement('div');
    avgSpent.textContent = `Avg: ${formatCurrency(freqData.averageSpentPerVisit)}`;
    avgSpent.style.fontSize = FONT_SIZES.SM;
    avgSpent.style.color = COLORS.TEXT_MUTED;

    frequencySection.appendChild(frequencyTitle);
    frequencySection.appendChild(visitsPerWeek);
    frequencySection.appendChild(avgSpent);
    card.appendChild(frequencySection);

    // Add insights if available
    if (freqData.insights && freqData.insights.length > 0) {
      const insightsSection = document.createElement('div');
      insightsSection.style.marginTop = SPACING.XS;

      freqData.insights.slice(0, 1).forEach(insight => {
        const insightEl = document.createElement('div');
        insightEl.textContent = `💡 ${insight}`;
        insightEl.style.fontSize = FONT_SIZES.BASE;
        insightEl.style.color = COLORS.TEXT_MUTED;
        insightEl.style.fontStyle = 'italic';
        insightsSection.appendChild(insightEl);
      });

      card.appendChild(insightsSection);
    }
  }

  card.addEventListener('click', () => {
    if (onCategoryClick) {
      onCategoryClick(category.name, category.amount, category.percentage);
    }
  });

  return card;
};
