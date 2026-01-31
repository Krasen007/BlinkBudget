/**
 * CategoryCard Component
 * Displays spending summary and frequency patterns for a specific category.
 */

import { COLORS, SPACING, FONT_SIZES } from '../utils/constants.js';
import { formatCurrency } from '../utils/financial-planning-helpers.js';
import { BudgetService } from '../core/budget-service.js';
import { BudgetProgress } from './BudgetProgress.js';

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
  frequencyData = null,
  allInsights = []
) => {
  const card = document.createElement('button');
  card.className = 'category-card';
  card.setAttribute('data-category', category.name);
  card.style.background = COLORS.SURFACE;
  card.style.border = `2px solid ${COLORS.BORDER}`;
  card.style.borderRadius = 'var(--radius-md)';
  card.style.padding = SPACING.MD;
  card.style.cursor = 'pointer';
  card.style.transition = 'all 0.2s ease';
  card.style.textAlign = 'left';
  card.style.width = '100%';
  card.style.display = 'flex';
  card.style.flexDirection = 'column';
  card.style.gap = SPACING.XS;
  card.style.minWidth = '0'; // Allow flex items to shrink
  card.style.overflow = 'hidden'; // Prevent content overflow

  const categoryColor =
    categoryColorMap.get(category.name) || getChartColors(1)[0];
  card.style.setProperty('--category-color', categoryColor);
  card.style.borderLeft = `6px solid ${categoryColor}`; // Visual indicator consistent with BudgetForm

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

  const name = document.createElement('div');
  name.textContent = category.name;
  name.style.fontWeight = '600';
  name.style.color = COLORS.TEXT_MAIN;

  const amount = document.createElement('div');
  amount.textContent = formatCurrency(category.amount);
  amount.style.fontSize = FONT_SIZES.TITLE_DESKTOP;
  amount.style.fontWeight = 'bold';
  amount.style.color = COLORS.PRIMARY;

  const percentage = document.createElement('div');
  percentage.textContent = `${typeof category.percentage === 'string' ? category.percentage : category.percentage.toFixed(1)}% of expenses`;
  percentage.style.fontSize = FONT_SIZES.STAT_LABEL_DESKTOP;
  percentage.style.color = COLORS.TEXT_MUTED;

  const transactionCount = document.createElement('div');
  transactionCount.textContent = `${category.transactionCount} transaction${category.transactionCount !== 1 ? 's' : ''}`;
  transactionCount.style.fontSize = FONT_SIZES.BASE;
  transactionCount.style.color = COLORS.TEXT_MUTED;

  // Calculate and display average amount
  const averageAmount =
    category.transactionCount > 0
      ? category.amount / category.transactionCount
      : 0;
  const averageElement = document.createElement('div');
  averageElement.textContent = `Avg: ${formatCurrency(averageAmount)}`;
  averageElement.style.fontSize = FONT_SIZES.SM;
  averageElement.style.color = COLORS.TEXT_MUTED;

  card.appendChild(name);
  card.appendChild(amount);
  card.appendChild(percentage);
  card.appendChild(transactionCount);
  card.appendChild(averageElement);

  // Add frequency analysis if available
  if (frequencyData && frequencyData[category.name]) {
    const freqData = frequencyData[category.name];

    const visitsPerWeek = document.createElement('div');
    visitsPerWeek.textContent = `${freqData.averageVisitsPerWeek.toFixed(1)} visits per week`;
    visitsPerWeek.style.fontSize = FONT_SIZES.SM;
    visitsPerWeek.style.color = COLORS.TEXT_MUTED;

    card.appendChild(visitsPerWeek);

    // Gather all insights for this category
    const categoryInsights = [];

    // 1. Add frequency insights
    if (freqData.insights) {
      categoryInsights.push(...freqData.insights);
    }

    // 2. Add matching insights from global InsightsService (Anomalies, Trends, etc.)
    const matchingInsights = allInsights.filter(insight => {
      // Skip budget-related insights as they are redundant with the progress bar
      if (
        insight.id &&
        (insight.id.startsWith('budget_exceeded_') ||
          insight.id.startsWith('budget_warning_'))
      ) {
        return false;
      }

      // Direct category match
      if (insight.category === category.name) return true;

      return false;
    });

    categoryInsights.push(...matchingInsights.map(i => i.message));

    // Display unique insights
    const uniqueInsights = [...new Set(categoryInsights)];

    if (uniqueInsights.length > 0) {
      const insightsSection = document.createElement('div');
      insightsSection.style.marginTop = SPACING.XS;

      uniqueInsights.forEach(insight => {
        const insightEl = document.createElement('div');
        insightEl.textContent = `💡 ${insight}`;
        insightEl.style.fontSize = FONT_SIZES.BASE;
        insightEl.style.color = COLORS.TEXT_MUTED;
        insightEl.style.fontStyle = 'italic';
        insightEl.style.textDecoration = 'underline';
        insightsSection.appendChild(insightEl);
      });

      card.appendChild(insightsSection);
    }
  }

  // Add Budget Progress if budget exists
  const budget = BudgetService.getByCategory(category.name);
  if (budget) {
    const utilization =
      budget.amountLimit > 0 ? (category.amount / budget.amountLimit) * 100 : 0;
    const progress = BudgetProgress({
      utilization,
      isExceeded: category.amount > budget.amountLimit,
      isWarning: utilization >= 80 && utilization <= 100,
      label: 'Budget',
      secondaryLabel: `${((category.amount / budget.amountLimit) * 100).toFixed(0)}%`,
    });
    progress.style.marginTop = SPACING.SM;
    card.appendChild(progress);
  }

  card.addEventListener('click', () => {
    if (onCategoryClick) {
      onCategoryClick(category.name, category.amount, category.percentage);
    }
  });

  return card;
};
