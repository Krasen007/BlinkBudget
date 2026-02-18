/**
 * CategoryCard Component
 * Provides a detailed card for a single spending category.
 */

import { COLORS, SPACING, FONT_SIZES } from '../utils/constants.js';
import { getChartColors } from '../core/chart-config.js';
import { formatCurrency } from '../utils/financial-planning-helpers.js';

/**
 * Create a detailed category card
 * @param {Object} category - Category breakdown data
 * @param {number} index - Index for color assignment
 * @param {Map} categoryColorMap - Consistent color mapping
 * @param {Function} getCategoryColors - Logic for colors
 * @param {Function} onClick - Click handler for details
 */
export const CategoryCard = (
  category,
  index,
  categoryColorMap,
  getCategoryColors,
  onClick,
  frequencyData = null,
  insights = []
) => {
  const card = document.createElement('button');
  card.className = 'category-card';
  card.setAttribute('data-category', category.name);
  card.style.background = COLORS.SURFACE;
  card.style.border = `2px solid ${COLORS.BORDER}`;

  card.style.borderLeft = 'none';
  card.style.borderRadius = 'var(--radius-md)';
  card.style.padding = SPACING.MD;
  card.style.cursor = 'pointer';
  card.style.transition = 'all 0.2s ease';
  card.style.textAlign = 'left';
  card.style.width = '100%';
  card.style.display = 'flex';
  card.style.flexDirection = 'column';
  card.style.gap = SPACING.XS;
  card.style.minWidth = '0';
  card.style.overflow = 'hidden';

  const categoryColor =
    categoryColorMap.get(category.name) || getChartColors(1)[0];
  card.style.setProperty('--category-color', categoryColor);

  card.addEventListener('mouseenter', () => {
    card.style.transform = 'translateY(-2px)';
    card.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'translateY(0)';
    card.style.boxShadow = 'none';
  });

  card.addEventListener('click', () => onClick(category));

  // Content
  const name = document.createElement('div');
  name.className = 'category-name';
  name.textContent = category.name;
  name.style.fontSize = FONT_SIZES.SM;
  name.style.fontWeight = 'bold';
  name.style.color = COLORS.TEXT_MAIN;
  name.style.textAlign = 'center';
  card.appendChild(name);

  const amount = document.createElement('div');
  amount.className = 'category-amount';
  amount.textContent = formatCurrency(category.amount);
  amount.style.fontSize = FONT_SIZES.LG;
  amount.style.fontWeight = 'bold';
  amount.style.color = COLORS.PRIMARY;
  amount.style.textAlign = 'center';
  card.appendChild(amount);

  // Add percentage if available
  if (category.percentage !== undefined && category.percentage !== null) {
    const percentage = document.createElement('div');
    percentage.className = 'category-percentage';
    percentage.textContent = `${category.percentage.toFixed(1)}% of expenses`;
    percentage.style.fontSize = '0.75rem';
    percentage.style.color = COLORS.TEXT_MUTED;
    percentage.style.textAlign = 'center';
    card.appendChild(percentage);
  }

  const freq = document.createElement('div');
  freq.style.fontSize = '0.75rem';
  freq.style.color = COLORS.TEXT_MUTED;
  freq.style.textAlign = 'center';
  const transactionCount = category.count || 1;
  freq.textContent = `${transactionCount} transaction${transactionCount > 1 ? 's' : ''}`;
  card.appendChild(freq);

  // Add average per visit if available
  if (category.amount && transactionCount > 0) {
    const avg = document.createElement('div');
    avg.style.fontSize = '0.75rem';
    avg.style.color = COLORS.TEXT_MUTED;
    avg.style.textAlign = 'center';
    avg.textContent = `Avg: ${formatCurrency(category.amount / transactionCount)}`;
    card.appendChild(avg);
  }

  // Add frequency if available
  if (frequencyData && frequencyData[category.name]) {
    const frequency = frequencyData[category.name];
    if (frequency.averageVisitsPerWeek !== undefined && frequency.averageVisitsPerWeek !== null) {
      const freqDisplay = document.createElement('div');
      freqDisplay.style.fontSize = '0.75rem';
      freqDisplay.style.color = COLORS.TEXT_MUTED;
      freqDisplay.style.textAlign = 'center';
      freqDisplay.textContent = `${frequency.averageVisitsPerWeek.toFixed(1)} visits per week`;
      card.appendChild(freqDisplay);
    }
  }

  // Insights snippet
  if (insights && insights.length > 0) {
    const relevantInsight = insights.find(
      i => i.category === category.name || i.message.includes(category.name)
    );
    if (relevantInsight) {
      const insightEl = document.createElement('div');
      insightEl.style.fontSize = '0.75rem';
      insightEl.style.color =
        relevantInsight.type === 'warning' ? COLORS.WARNING : COLORS.SUCCESS;
      insightEl.style.marginTop = SPACING.XS;
      insightEl.style.fontStyle = 'italic';
      insightEl.style.textAlign = 'center';
      insightEl.textContent = `💡 ${relevantInsight.message.split('.')[0]}`;
      card.appendChild(insightEl);
    }
  }

  return card;
};
