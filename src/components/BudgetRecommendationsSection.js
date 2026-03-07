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
  description.innerHTML = `AI-powered budget suggestions based on your spending patterns. 
    <strong>Recommended</strong> amounts include a 10% buffer from your historical average. 
    <strong>Confidence</strong> shows how consistent your spending is (70%+ = high confidence).`;
  description.style.color = COLORS.TEXT_MUTED;
  description.style.fontSize = 'var(--font-size-sm)';
  description.style.lineHeight = '1.4';
  description.style.margin = '0 0 var(--spacing-md) 0';
  container.appendChild(description);

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

  // Create table header
  const headerDiv = document.createElement('div');
  headerDiv.style.display = 'grid';
  headerDiv.style.gridTemplateColumns = '2fr 1fr 1fr 1fr 1fr';
  headerDiv.style.gap = 'var(--spacing-sm)';
  headerDiv.style.padding = 'var(--spacing-sm)';
  headerDiv.style.background =
    COLORS.SURFACE_BORDER || 'rgba(156, 163, 175, 0.1)';
  headerDiv.style.borderRadius = 'var(--radius-sm)';
  headerDiv.style.marginBottom = 'var(--spacing-xs)';
  headerDiv.style.fontWeight = '600';
  headerDiv.style.fontSize = 'var(--font-size-sm)';
  headerDiv.style.color = COLORS.TEXT_MUTED;

  const headers = [
    'Category',
    'Current',
    'Recommended',
    'vs Budget',
    'Confidence',
  ];
  headers.forEach(headerText => {
    const header = document.createElement('div');
    header.textContent = headerText;
    header.style.textAlign = headerText === 'Category' ? 'left' : 'right';
    headerDiv.appendChild(header);
  });
  container.appendChild(headerDiv);

  // Create table rows
  const list = document.createElement('div');
  list.style.display = 'flex';
  list.style.flexDirection = 'column';
  list.style.gap = 'var(--spacing-xs)';

  recs.slice(0, 6).forEach(rec => {
    const itemDiv = document.createElement('div');
    itemDiv.style.display = 'grid';
    itemDiv.style.gridTemplateColumns = '2fr 1fr 1fr 1fr 1fr';
    itemDiv.style.gap = 'var(--spacing-sm)';
    itemDiv.style.alignItems = 'center';
    itemDiv.style.padding = 'var(--spacing-sm)';
    itemDiv.style.background = COLORS.BACKGROUND;
    itemDiv.style.borderRadius = 'var(--radius-md)';
    itemDiv.style.borderLeft = `3px solid ${getConfidenceColor(rec.confidence)}`;

    // Category column
    const categorySpan = document.createElement('div');
    categorySpan.textContent = rec.category || 'Unknown';
    categorySpan.style.fontWeight = '500';
    categorySpan.style.textAlign = 'left';
    itemDiv.appendChild(categorySpan);

    // Current spending column
    const current = rec.currentBudget || 0;
    const currentSpan = document.createElement('div');
    const safeCurrent =
      typeof current === 'number' && isFinite(current) ? current : 0;
    currentSpan.textContent = `$${safeCurrent.toFixed(2)}`;
    currentSpan.style.color = COLORS.TEXT_MAIN;
    currentSpan.style.textAlign = 'right';
    currentSpan.style.fontFamily = 'monospace';
    itemDiv.appendChild(currentSpan);

    // Recommended budget column
    const recommended = rec.recommendedBudget || 0;
    const recommendedSpan = document.createElement('div');
    const safeRecommended =
      typeof recommended === 'number' && isFinite(recommended)
        ? recommended
        : 0;
    recommendedSpan.textContent = `$${safeRecommended.toFixed(2)}`;
    recommendedSpan.style.color = COLORS.TEXT_MUTED;
    recommendedSpan.style.fontWeight = '600';
    recommendedSpan.style.textAlign = 'right';
    recommendedSpan.style.fontFamily = 'monospace';
    itemDiv.appendChild(recommendedSpan);

    // vs Budget column (percentage difference)
    const vsBudgetSpan = document.createElement('div');
    let vsBudgetText = '→0%';
    let vsBudgetColor = COLORS.TEXT_MUTED;

    if (recommended > 0) {
      const diff = ((current - recommended) / recommended) * 100;
      if (diff > 5) {
        vsBudgetText = `↑${Math.abs(diff).toFixed(1)}%`;
        vsBudgetColor = COLORS.ERROR;
      } else if (diff < -5) {
        vsBudgetText = `↓${Math.abs(diff).toFixed(1)}%`;
        vsBudgetColor = '#22c55e';
      } else {
        vsBudgetText = '→0%';
        vsBudgetColor = COLORS.TEXT_MUTED;
      }
    }

    vsBudgetSpan.textContent = vsBudgetText;
    vsBudgetSpan.style.color = vsBudgetColor;
    vsBudgetSpan.style.fontSize = 'var(--font-size-sm)';
    vsBudgetSpan.style.fontWeight = '600';
    vsBudgetSpan.style.textAlign = 'right';
    vsBudgetSpan.style.fontFamily = 'monospace';
    itemDiv.appendChild(vsBudgetSpan);

    // Confidence column
    const confSpan = document.createElement('div');
    confSpan.textContent = `${rec.confidence || 0}%`;
    confSpan.style.color = getConfidenceColor(rec.confidence);
    confSpan.style.fontSize = 'var(--font-size-sm)';
    confSpan.style.fontWeight = '600';
    confSpan.style.textAlign = 'right';
    confSpan.style.fontFamily = 'monospace';
    itemDiv.appendChild(confSpan);
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
