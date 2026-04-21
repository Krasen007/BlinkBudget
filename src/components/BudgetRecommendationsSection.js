/**
 * BudgetRecommendationsSection Component
 * Part of Feature 3.3.4: Budget Recommendations
 *
 * Displays AI-powered budget recommendations based on spending history
 */

import { COLORS } from '../utils/constants.js';
import { SettingsService } from '../core/settings-service.js';

const getCurrencyFormatter = () => {
  const currency = SettingsService.getSetting('currency') || 'EUR';
  const locale = SettingsService.getSetting('locale') || 'en-IE';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  });
};

export const BudgetRecommendationsSection = (recommendations, _timePeriod) => {
  const container = document.createElement('div');
  container.className = 'budget-recommendations-section';

  const title = document.createElement('h3');
  title.textContent = 'Budget Recommendations';
  title.className = 'budget-recommendations-title';
  container.appendChild(title);

  const description = document.createElement('p');
  description.innerHTML = `AI-powered budget suggestions based on your spending patterns. 
    <strong>Recommended</strong> amounts include a 10% buffer from your historical average. 
    <strong>Confidence</strong> shows how consistent your spending is (70%+ = high confidence).`;
  description.className = 'budget-recommendations-description';
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
    noData.className = 'budget-recommendations-no-data';
    container.appendChild(noData);
    return container;
  }

  // Create table header
  const headerDiv = document.createElement('div');
  headerDiv.className = 'budget-recommendations-header-row';

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
    itemDiv.className = 'budget-recommendations-row';
    itemDiv.style.borderLeft = `3px solid ${getConfidenceColor(rec.confidence)}`;

    // Category column
    const categorySpan = document.createElement('div');
    categorySpan.textContent = rec.category || 'Unknown';
    categorySpan.className = 'budget-recommendations-cell';
    itemDiv.appendChild(categorySpan);

    // Current spending column
    const current = rec.currentBudget || 0;
    const currentSpan = document.createElement('div');
    const safeCurrent =
      typeof current === 'number' && isFinite(current) ? current : 0;
    currentSpan.textContent = getCurrencyFormatter().format(safeCurrent);
    currentSpan.className = 'budget-recommendations-cell';
    currentSpan.style.color = COLORS.TEXT_MAIN;
    itemDiv.appendChild(currentSpan);

    // Recommended budget column
    const recommended = rec.recommendedBudget || 0;
    const recommendedSpan = document.createElement('div');
    const safeRecommended =
      typeof recommended === 'number' && isFinite(recommended)
        ? recommended
        : 0;
    recommendedSpan.textContent =
      getCurrencyFormatter().format(safeRecommended);
    recommendedSpan.className = 'budget-recommendations-cell';
    recommendedSpan.style.color = COLORS.TEXT_MUTED;
    recommendedSpan.style.fontWeight = '600';
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
        vsBudgetColor = COLORS.SUCCESS || '#22c55e';
      } else {
        // Show actual percentage for small differences within ±5%
        vsBudgetText = `${diff > 0 ? '↑' : '↓'}${Math.abs(diff).toFixed(1)}%`;
        vsBudgetColor = COLORS.TEXT_MUTED;
      }
    }

    vsBudgetSpan.textContent = vsBudgetText;
    vsBudgetSpan.className = 'budget-recommendations-cell';
    vsBudgetSpan.style.color = vsBudgetColor;
    vsBudgetSpan.style.fontSize = 'var(--font-size-sm)';
    vsBudgetSpan.style.fontWeight = '600';
    itemDiv.appendChild(vsBudgetSpan);

    // Confidence column
    const confSpan = document.createElement('div');
    confSpan.textContent = `${rec.confidence || 0}%`;
    confSpan.className = 'budget-recommendations-cell';
    confSpan.style.color = getConfidenceColor(rec.confidence);
    confSpan.style.fontSize = 'var(--font-size-sm)';
    confSpan.style.fontWeight = '600';
    itemDiv.appendChild(confSpan);
    list.appendChild(itemDiv);
  });

  container.appendChild(list);
  return container;
};

function getConfidenceColor(confidence) {
  // 0 is valid low confidence, only null/undefined means no data
  if (
    confidence === null ||
    confidence === undefined ||
    !Number.isFinite(confidence)
  ) {
    return COLORS.TEXT_MUTED;
  }
  if (confidence >= 70) return COLORS.SUCCESS || '#22c55e'; // green
  if (confidence >= 40) return COLORS.WARNING || '#fbbf24'; // yellow
  return COLORS.ERROR || '#f97316'; // orange
}

export default BudgetRecommendationsSection;
