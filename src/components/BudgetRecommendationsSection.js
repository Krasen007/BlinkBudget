/**
 * BudgetRecommendationsSection Component
 * Part of Feature 3.3.4: Budget Recommendations
 *
 * Displays AI-powered budget recommendations based on spending history
 */

import { COLORS, SPACING } from '../utils/constants.js';

export const BudgetRecommendationsSection = (recommendations, _timePeriod) => {
  const container = document.createElement('div');
  container.className = 'budget-recommendations-section';
  container.style.background = COLORS.SURFACE;
  container.style.borderRadius = 'var(--radius-lg)';
  container.style.padding = SPACING.MD;
  container.style.marginTop = SPACING.MD;

  const title = document.createElement('h3');
  title.textContent = 'Budget Recommendations';
  title.style.margin = '0 0 var(--spacing-sm) 0';
  title.style.color = COLORS.TEXT_MAIN;
  container.appendChild(title);

  const description = document.createElement('p');
  description.textContent =
    'AI-powered budget suggestions based on your spending patterns.';
  description.style.color = COLORS.TEXT_MUTED;
  description.style.fontSize = 'var(--font-size-sm)';
  description.style.margin = '0 0 var(--spacing-md) 0';
  container.appendChild(description);

  // Debug log
  console.log('[BudgetRecommendationsSection] Received data:', recommendations);

  // Handle both array and object input
  let recs = recommendations;
  if (
    recommendations &&
    typeof recommendations === 'object' &&
    !Array.isArray(recommendations)
  ) {
    recs = recommendations.recommendations || [];
  }

  if (!recs || !Array.isArray(recs) || recs.length === 0) {
    const noData = document.createElement('div');
    noData.textContent = 'Add more transactions to get budget recommendations.';
    noData.style.color = COLORS.TEXT_MUTED;
    noData.style.fontStyle = 'italic';
    noData.style.padding = 'var(--spacing-md)';
    noData.style.textAlign = 'center';
    container.appendChild(noData);
    return container;
  }

  // Create list of recommendations
  const list = document.createElement('div');
  list.style.display = 'flex';
  list.style.flexDirection = 'column';
  list.style.gap = 'var(--spacing-sm)';

  recs.slice(0, 6).forEach(rec => {
    const itemDiv = document.createElement('div');
    itemDiv.style.display = 'flex';
    itemDiv.style.justifyContent = 'space-between';
    itemDiv.style.alignItems = 'center';
    itemDiv.style.padding = 'var(--spacing-sm)';
    itemDiv.style.background = COLORS.BACKGROUND;
    itemDiv.style.borderRadius = 'var(--radius-md)';
    itemDiv.style.borderLeft = `3px solid ${getConfidenceColor(rec.confidence)}`;

    const categorySpan = document.createElement('span');
    categorySpan.textContent = rec.category || 'Unknown';
    categorySpan.style.fontWeight = '500';
    itemDiv.appendChild(categorySpan);

    const statsDiv = document.createElement('div');
    statsDiv.style.display = 'flex';
    statsDiv.style.gap = 'var(--spacing-md)';
    statsDiv.style.alignItems = 'center';

    // Budget amount - handle both property names
    const budget = rec.recommendedBudget || rec.currentBudget || 0;
    const budgetSpan = document.createElement('span');
    const safeBudget =
      typeof budget === 'number' && isFinite(budget) ? budget : 0;
    budgetSpan.textContent = `$${safeBudget.toFixed(2)}`;
    budgetSpan.style.color = COLORS.TEXT_MAIN;
    statsDiv.appendChild(budgetSpan);

    // Confidence indicator
    const confSpan = document.createElement('span');
    confSpan.textContent = `${rec.confidence || 0}%`;
    confSpan.style.color = getConfidenceColor(rec.confidence);
    confSpan.style.fontSize = 'var(--font-size-sm)';
    confSpan.style.fontWeight = '600';
    statsDiv.appendChild(confSpan);

    itemDiv.appendChild(statsDiv);
    list.appendChild(itemDiv);
  });

  container.appendChild(list);
  return container;
};

function getConfidenceColor(confidence) {
  if (!confidence) return COLORS.TEXT_MUTED;
  if (confidence >= 70) return '#22c55e'; // green
  if (confidence >= 40) return '#fbbf24'; // yellow
  return '#f97316'; // orange
}

export default BudgetRecommendationsSection;
