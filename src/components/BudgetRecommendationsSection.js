/**
 * BudgetRecommendationsSection Component
 * Part of Feature 3.3.4: Budget Recommendations
 *
 * Displays AI-powered budget recommendations based on spending history
 */

import { COLORS } from '../utils/constants.js';
import { SettingsService } from '../core/settings-service.js';
import { UnusualSpendingDetector } from '../core/unusual-spending-detector.js';
import { ActionCard } from './ui/ActionCard.js';

const getCurrencyFormatter = () => {
  const currency = SettingsService.getSetting('currency') || 'EUR';
  const locale = SettingsService.getSetting('locale') || 'en-IE';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  });
};

export const BudgetRecommendationsSection = (
  recommendations,
  _timePeriod,
  transactions = null
) => {
  const container = document.createElement('div');
  container.className = 'budget-recommendations-section';

  const title = document.createElement('h3');
  title.textContent = 'Budget Recommendations';
  title.className = 'budget-recommendations-title';
  container.appendChild(title);

  // Add unusual spending alerts if transactions provided
  if (transactions && transactions.length > 0) {
    const unusualRecommendations =
      UnusualSpendingDetector.getBudgetRecommendations(transactions);
    const unusualAlerts = unusualRecommendations.filter(
      rec =>
        rec.type === 'unusual_spending_alert' || rec.type === 'high_variance'
    );

    if (unusualAlerts.length > 0) {
      const alertsSection = document.createElement('div');
      alertsSection.style.cssText = `
        margin-bottom: var(--spacing-md);
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
      `;

      const alertsTitle = document.createElement('h4');
      alertsTitle.textContent = 'Spending Pattern Alerts';
      alertsTitle.style.cssText = `
        font-size: 0.875rem;
        font-weight: 600;
        margin: '0 0 var(--spacing-xs) 0';
        color: ${COLORS.TEXT_MAIN};
      `;
      alertsSection.appendChild(alertsTitle);

      unusualAlerts.slice(0, 3).forEach(alert => {
        const alertCard = ActionCard({
          title: alert.title,
          description: alert.description,
          type: alert.priority === 'high' ? 'warning' : 'info',
          actionText: 'View Details',
          onAction: () => {
            // Scroll to the category in the recommendations table
            const categoryRows = container.querySelectorAll(
              '.budget-recommendations-row'
            );
            categoryRows.forEach(row => {
              const categoryCell = row.querySelector(
                '.budget-recommendations-cell'
              );
              if (categoryCell && categoryCell.textContent === alert.category) {
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                row.style.animation = 'pulse 2s ease-in-out';
                setTimeout(() => {
                  row.style.animation = '';
                }, 2000);
              }
            });
          },
          icon: '!',
        });
        alertsSection.appendChild(alertCard);
      });

      container.appendChild(alertsSection);
    }
  }

  const description = document.createElement('p');
  description.innerHTML = `
    <strong>Spent</strong> shows your current spending, <strong>Budget</strong> shows your set limit (if any).
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

  const headers = ['Category', 'Spent', 'Budget', 'Recommended', 'Confidence'];
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

  // Get formatter once to avoid repeated calls in loop
  const formatter = getCurrencyFormatter();

  recs.slice(0, 6).forEach(rec => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'budget-recommendations-row';
    itemDiv.style.borderLeft = `3px solid ${getConfidenceColor(rec.confidence)}`;

    // Category column
    const categorySpan = document.createElement('div');
    categorySpan.textContent = rec.category || 'Unknown';
    categorySpan.className = 'budget-recommendations-cell';
    itemDiv.appendChild(categorySpan);

    // Spent column (current spending)
    const current = rec.currentBudget || 0;
    const currentSpan = document.createElement('div');
    const safeCurrent =
      typeof current === 'number' && isFinite(current) ? current : 0;
    currentSpan.textContent = formatter.format(safeCurrent);
    currentSpan.className = 'budget-recommendations-cell';
    currentSpan.style.color = COLORS.TEXT_MAIN;
    itemDiv.appendChild(currentSpan);

    // Budget column (set budget amount)
    const budgetAmount = rec.budgetAmount || 0;
    const budgetSpan = document.createElement('div');
    if (Number.isFinite(budgetAmount) && budgetAmount > 0) {
      budgetSpan.textContent = formatter.format(budgetAmount);
      budgetSpan.style.color = COLORS.PRIMARY || '#3b82f6';
    } else {
      budgetSpan.textContent = '—';
      budgetSpan.style.color = COLORS.TEXT_MUTED;
    }
    budgetSpan.className = 'budget-recommendations-cell';
    itemDiv.appendChild(budgetSpan);

    // Recommended budget column
    const recommended = rec.recommendedBudget || 0;
    const recommendedSpan = document.createElement('div');
    if (Number.isFinite(recommended) && recommended > 0) {
      recommendedSpan.textContent = formatter.format(recommended);
    } else {
      recommendedSpan.textContent = '—';
    }
    recommendedSpan.className = 'budget-recommendations-cell';
    recommendedSpan.style.color = COLORS.TEXT_MUTED;
    itemDiv.appendChild(recommendedSpan);

    // Confidence column
    const confSpan = document.createElement('div');
    confSpan.textContent = `${rec.confidence || 0}%`;
    confSpan.className = 'budget-recommendations-cell';
    confSpan.style.color = getConfidenceColor(rec.confidence);
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
