/**
 * Simple Insights Component
 *
 * Displays 3-4 actionable insights instead of overwhelming analytics.
 * Focuses on clear, actionable information users can use immediately.
 */

import { COLORS, SPACING } from '../utils/constants.js';
import { SimpleInsightsService } from '../core/simple-insights-service.js';

/**
 * Create insight card component
 */
function createInsightCard(insight, currency = 'EUR') {
  const card = document.createElement('div');
  card.className = 'insight-card';
  card.style.cssText = `
    background: ${COLORS.SURFACE};
    border: 1px solid ${COLORS.BORDER};
    border-radius: var(--radius-md);
    padding: ${SPACING.MD};
    margin-bottom: ${SPACING.SM};
    display: flex;
    align-items: center;
    gap: ${SPACING.SM};
    transition: all 0.2s ease;
  `;

  // Icon based on type
  const icon = document.createElement('div');
  icon.style.cssText = `
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    flex-shrink: 0;
  `;

  switch (insight.type) {
    case 'top_category':
      icon.textContent = '📊';
      icon.style.background = 'rgba(59, 130, 246, 0.1)';
      icon.style.color = '#3b82f6';
      break;
    case 'spending_trend': {
      // Explicitly handle three directions: up (red), down (green), neutral (muted gray)
      if (insight.direction === 'up') {
        icon.textContent = '📈';
        icon.style.background = 'rgba(239, 68, 68, 0.1)';
        icon.style.color = '#ef4444';
      } else if (insight.direction === 'down') {
        icon.textContent = '📉';
        icon.style.background = 'rgba(34, 197, 94, 0.1)';
        icon.style.color = '#22c55e';
      } else {
        icon.textContent = '➡️';
        icon.style.background = 'rgba(107, 114, 128, 0.08)';
        icon.style.color = '#6b7280';
      }
      break;
    }
    case 'budget_alert':
      icon.textContent = '⚠️';
      icon.style.background = 'rgba(251, 191, 36, 0.1)';
      icon.style.color = '#f59e0b';
      break;
    case 'unusual_spending':
      icon.textContent = '❗';
      icon.style.background = 'rgba(168, 85, 247, 0.1)';
      icon.style.color = '#a855f7';
      break;
    default:
      icon.textContent = '💡';
      icon.style.background = 'rgba(107, 114, 128, 0.1)';
      icon.style.color = '#6b7280';
  }

  // Content
  const content = document.createElement('div');
  content.style.cssText = `
    flex: 1;
    min-width: 0;
  `;

  const title = document.createElement('div');
  title.textContent = insight.title;
  title.style.cssText = `
    font-weight: 600;
    font-size: 0.875rem;
    color: ${COLORS.TEXT_MAIN};
    margin-bottom: ${SPACING.XS};
  `;

  const description = document.createElement('div');
  description.textContent = insight.description;
  description.style.cssText = `
    font-size: 0.75rem;
    color: ${COLORS.TEXT_MUTED};
    line-height: 1.4;
  `;

  // Amount if available — create now but append after title & description
  let amountEl = null;
  if (insight.amount !== undefined) {
    amountEl = document.createElement('div');
    amountEl.textContent = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(insight.amount);
    amountEl.style.cssText = `
      font-weight: 600;
      font-size: 0.875rem;
      color: ${insight.type === 'budget_alert' ? COLORS.ERROR : COLORS.TEXT_MAIN};
      margin-top: ${SPACING.XS};
    `;
  }

  // Title and description should come before the amount (visual order: title → description → amount)
  content.appendChild(title);
  content.appendChild(description);
  if (amountEl) content.appendChild(amountEl);

  card.appendChild(icon);
  card.appendChild(content);

  // Action button if available — append after icon & content so layout is [icon] [content] [action]
  if (insight.action || insight.onAction) {
    const actionBtn = document.createElement('button');
    actionBtn.textContent = insight.action || 'Action';
    actionBtn.style.cssText = `
      background: ${COLORS.PRIMARY};
      color: white;
      border: none;
      border-radius: var(--radius-sm);
      padding: ${SPACING.XS} ${SPACING.SM};
      font-size: 0.75rem;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;
    `;

    // Disable button if no valid action is available
    if (!insight.action && !insight.onAction) {
      actionBtn.disabled = true;
      actionBtn.textContent = 'No Action';
    }

    actionBtn.addEventListener('click', () => {
      // Handle action based on insight type
      if (insight.type === 'top_category') {
        // Navigate to category details
        console.log('Navigate to category:', insight.category);
      } else if (insight.type === 'budget_alert') {
        // Navigate to budget settings
        console.log('Navigate to budget settings');
      } else if (insight.type === 'spending_trend') {
        // Navigate to reports/trends view
        console.log('Navigate to spending trends:', insight.message);
      } else if (insight.type === 'unusual_spending') {
        // Navigate to detailed analysis
        console.log('Navigate to unusual spending analysis:', insight.message);
      } else if (typeof insight.onAction === 'function') {
        // Generic action callback
        insight.onAction(insight);
      } else {
        // Default/fallback case
        console.warn('Unhandled insight type:', insight.type);
      }
    });

    card.appendChild(actionBtn);
  }

  // Hover effect
  card.addEventListener('mouseenter', () => {
    card.style.transform = 'translateY(-2px)';
    card.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'translateY(0)';
    card.style.boxShadow = 'none';
  });

  return card;
}

/**
 * Simple Insights Component
 */
export const SimpleInsights = (
  transactions,
  currentPeriod,
  currency = 'EUR'
) => {
  const container = document.createElement('div');
  container.className = 'simple-insights';
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: ${SPACING.SM};
  `;

  // Generate simple insights
  const insights = SimpleInsightsService.generateSimpleInsights(
    transactions,
    currentPeriod
  );

  if (insights.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.style.cssText = `
      text-align: center;
      padding: ${SPACING.LG};
      color: ${COLORS.TEXT_MUTED};
      font-size: 0.875rem;
    `;
    emptyState.textContent = 'No insights available for this period';
    container.appendChild(emptyState);
    return container;
  }

  // Add insight cards
  insights.forEach(insight => {
    const card = createInsightCard(insight, currency);
    container.appendChild(card);
  });

  return container;
};
