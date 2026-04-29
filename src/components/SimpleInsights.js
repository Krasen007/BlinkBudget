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
  
  // Color-coded severity indicators
  const severityColors = {
    high: { border: '#ef4444', bg: 'rgba(239, 68, 68, 0.05)', accent: '#ef4444' },
    warning: { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.05)', accent: '#f59e0b' },
    medium: { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.05)', accent: '#3b82f6' },
    low: { border: '#22c55e', bg: 'rgba(34, 197, 94, 0.05)', accent: '#22c55e' },
    default: { border: COLORS.BORDER, bg: COLORS.SURFACE, accent: COLORS.PRIMARY }
  };
  
  const severity = insight.severity || 
    (insight.type === 'budget_alert' ? 'high' : 
     insight.type === 'unusual_spending' ? 'warning' : 
     insight.type === 'spending_trend' && insight.direction === 'up' ? 'warning' : 
     insight.type === 'spending_trend' && insight.direction === 'down' ? 'low' : 
     'medium');
  
  const colors = severityColors[severity] || severityColors.default;
  
  card.style.cssText = `
    background: ${colors.bg};
    border: 1px solid ${colors.border};
    border-left: 4px solid ${colors.accent};
    border-radius: var(--radius-md);
    padding: ${SPACING.MD};
    margin-bottom: ${SPACING.SM};
    display: flex;
    align-items: flex-start;
    gap: ${SPACING.SM};
    transition: all 0.2s ease;
    position: relative;
  `;

  // Enhanced icon with dynamic visual indicators
  const iconContainer = document.createElement('div');
  iconContainer.className = 'icon-container';
  iconContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: ${SPACING.XS};
    flex-shrink: 0;
  `;
  
  const icon = document.createElement('div');
  icon.className = 'icon';
  icon.style.cssText = `
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    background: ${colors.accent}20;
    color: ${colors.accent};
    position: relative;
  `;

  switch (insight.type) {
    case 'top_category':
      icon.textContent = '📊';
      actionBtn.textContent = 'View insights';
      break;
    case 'spending_trend': {
      if (insight.direction === 'up') {
        icon.textContent = '📈';
      } else if (insight.direction === 'down') {
        icon.textContent = '�';
      } else {
        icon.textContent = '➡️';
      }
      break;
    }
    case 'budget_alert':
      icon.textContent = '⚠️';
      break;
    case 'unusual_spending':
      icon.textContent = '❗';
      break;
    default:
      icon.textContent = '�';
  }
  
  // Add progress indicator for percentage-based insights
  let progressIndicator = null;
  if (insight.percentage) {
    progressIndicator = document.createElement('div');
    progressIndicator.className = 'progress-indicator';
    progressIndicator.style.cssText = `
      width: 40px;
      height: 4px;
      background: rgba(0, 0, 0, 0.1);
      border-radius: 2px;
      overflow: hidden;
      position: relative;
    `;
    
    const progressBar = document.createElement('div');
    const progressWidth = Math.min(insight.percentage, 100);
    progressBar.style.cssText = `
      height: 100%;
      width: ${progressWidth}%;
      background: ${colors.accent};
      transition: width 0.3s ease;
    `;
    progressIndicator.appendChild(progressBar);
  }
  
  iconContainer.appendChild(icon);
  if (progressIndicator) {
    iconContainer.appendChild(progressIndicator);
  }

  // Enhanced content with better visual hierarchy
  const content = document.createElement('div');
  content.style.cssText = `
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: ${SPACING.XS};
  `;

  // Title with severity indicator
  const titleRow = document.createElement('div');
  titleRow.style.cssText = `
    display: flex;
    align-items: center;
    gap: ${SPACING.XS};
  `;
  
  const title = document.createElement('div');
  title.textContent = insight.title;
  title.style.cssText = `
    font-weight: 600;
    font-size: 0.875rem;
    color: ${COLORS.TEXT_MAIN};
  `;
  
  // Add trend arrow for spending trends
  if (insight.type === 'spending_trend' && insight.direction) {
    const trendArrow = document.createElement('span');
    trendArrow.style.cssText = `
      font-size: 0.75rem;
      color: ${insight.direction === 'up' ? '#ef4444' : insight.direction === 'down' ? '#22c55e' : '#6b7280'};
    `;
    trendArrow.textContent = insight.direction === 'up' ? '↑' : insight.direction === 'down' ? '↓' : '→';
    titleRow.appendChild(title);
    titleRow.appendChild(trendArrow);
  } else {
    titleRow.appendChild(title);
  }
  
  content.appendChild(titleRow);

  const description = document.createElement('div');
  description.textContent = insight.description;
  description.style.cssText = `
    font-size: 0.8125rem;
    color: ${COLORS.TEXT_MUTED};
    line-height: 1.4;
  `;

  content.appendChild(description);

  // Enhanced amount display with percentage badge
  if (insight.amount !== undefined) {
    const amountContainer = document.createElement('div');
    amountContainer.className = 'amount-container';
    amountContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: ${SPACING.XS};
      flex-wrap: wrap;
    `;
    
    const amountEl = document.createElement('div');
    amountEl.textContent = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(insight.amount);
    amountEl.className = 'amount';
    amountEl.style.cssText = `
      font-weight: 600;
      font-size: 0.9375rem;
      color: ${colors.accent};
    `;
    
    amountContainer.appendChild(amountEl);
    
    // Add percentage badge if available
    if (insight.percentage) {
      const percentBadge = document.createElement('span');
      percentBadge.textContent = `${insight.percentage}%`;
      percentBadge.className = 'percent-badge';
      percentBadge.style.cssText = `
        background: ${colors.accent}20;
        color: ${colors.accent};
        padding: 2px 6px;
        border-radius: 12px;
        font-size: 0.6875rem;
        font-weight: 500;
      `;
      amountContainer.appendChild(percentBadge);
    }
    
    content.appendChild(amountContainer);
  }

  card.appendChild(iconContainer);
  card.appendChild(content);

  // Enhanced action button with better styling and specific actions
  let actionBtn = null;
  if (insight.action || insight.onAction) {
    actionBtn = document.createElement('button');
    actionBtn.textContent = insight.action || 'Action';
    actionBtn.className = 'action-btn';
    actionBtn.style.cssText = `
      background: ${colors.accent};
      color: white;
      border: none;
      border-radius: var(--radius-sm);
      padding: ${SPACING.XS} ${SPACING.SM};
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;
      align-self: flex-start;
      margin-top: auto;
    `;

    // Disable button if no valid action is available
    if (!insight.action && !insight.onAction) {
      actionBtn.disabled = true;
      actionBtn.textContent = 'No Action';
      actionBtn.style.opacity = '0.5';
    }

    actionBtn.addEventListener('click', () => {
      // Handle action based on insight type with specific actions
      if (insight.type === 'top_category') {
        // Navigate to financial planning insights for category analysis
        window.location.hash = '#financial-planning?section=insights';
      } else if (insight.type === 'budget_alert') {
        // Navigate to financial planning budgets section
        window.location.hash = '#financial-planning?section=budgets';
      } else if (insight.type === 'spending_trend') {
        // Navigate to financial planning insights for trend analysis
        window.location.hash = '#financial-planning?section=insights';
      } else if (insight.type === 'unusual_spending') {
        // Navigate to reports for detailed transaction review
        window.location.hash = '#reports';
      } else if (typeof insight.onAction === 'function') {
        // Generic action callback
        insight.onAction(insight);
      } else {
        // Default/fallback case - navigate to dashboard
        window.location.hash = '#dashboard';
      }
    });

    card.appendChild(actionBtn);
  }

  // Enhanced hover effect with subtle animations
  card.addEventListener('mouseenter', () => {
    card.style.transform = 'translateY(-2px)';
    card.style.boxShadow = `0 4px 16px ${colors.accent}20`;
    if (actionBtn) {
      actionBtn.style.transform = 'scale(1.05)';
      actionBtn.style.boxShadow = `0 2px 8px ${colors.accent}40`;
    }
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'translateY(0)';
    card.style.boxShadow = 'none';
    if (actionBtn) {
      actionBtn.style.transform = 'scale(1)';
      actionBtn.style.boxShadow = 'none';
    }
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
    width: 100%;
  `;
  
  // Add responsive styles container
  const style = document.createElement('style');
  style.textContent = `
    .simple-insights .insight-card {
      width: 100%;
      box-sizing: border-box;
    }
    
    @media (max-width: 768px) {
      .simple-insights .insight-card {
        padding: 12px;
        gap: 10px;
      }
      
      .simple-insights .insight-card .icon-container {
        gap: 4px;
      }
      
      .simple-insights .insight-card .icon-container .icon {
        width: 32px;
        height: 32px;
        font-size: 1rem;
      }
      
      .simple-insights .insight-card .icon-container .progress-indicator {
        width: 32px;
        height: 3px;
      }
      
      .simple-insights .insight-card .content {
        gap: 4px;
      }
      
      .simple-insights .insight-card .content .title {
        font-size: 0.8125rem;
      }
      
      .simple-insights .insight-card .content .description {
        font-size: 0.75rem;
      }
      
      .simple-insights .insight-card .content .amount-container {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }
      
      .simple-insights .insight-card .content .amount-container .amount {
        font-size: 0.875rem;
      }
      
      .simple-insights .insight-card .content .amount-container .percent-badge {
        font-size: 0.625rem;
        padding: 1px 4px;
      }
      
      .simple-insights .insight-card .action-btn {
        font-size: 0.6875rem;
        padding: 6px 10px;
        min-width: 80px;
      }
    }
    
    @media (max-width: 480px) {
      .simple-insights .insight-card {
        flex-direction: column;
        align-items: stretch;
        text-align: center;
        gap: 12px;
      }
      
      .simple-insights .insight-card .icon-container {
        align-self: center;
      }
      
      .simple-insights .insight-card .content .title-row {
        justify-content: center;
      }
      
      .simple-insights .insight-card .content .amount-container {
        justify-content: center;
      }
      
      .simple-insights .insight-card .action-btn {
        align-self: center;
        width: 100%;
        max-width: 200px;
      }
    }
  `;
  container.appendChild(style);

  // Generate simple insights
  const insights = SimpleInsightsService.generateSimpleInsights(
    transactions,
    currentPeriod
  );

  if (insights.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.style.cssText = `
      text-align: center;
      padding: ${SPACING.XL};
      color: ${COLORS.TEXT_MUTED};
      font-size: 0.875rem;
      background: ${COLORS.SURFACE};
      border: 1px solid ${COLORS.BORDER};
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: ${SPACING.MD};
    `;
    
    // Add icon for empty state
    const emptyIcon = document.createElement('div');
    emptyIcon.textContent = 'ð';
    emptyIcon.style.cssText = `
      font-size: 3rem;
      opacity: 0.5;
    `;
    
    // Add helpful message
    const emptyMessage = document.createElement('div');
    emptyMessage.innerHTML = `
      <div style="font-weight: 600; margin-bottom: ${SPACING.XS}; color: ${COLORS.TEXT_MAIN};">
        No insights yet
      </div>
      <div style="line-height: 1.5;">
        Start adding transactions to see personalized insights about your spending patterns, budget alerts, and money-saving opportunities.
      </div>
    `;
    
    // Add action button to add first transaction
    const addAction = document.createElement('button');
    addAction.textContent = 'Add your first transaction';
    addAction.style.cssText = `
      background: ${COLORS.PRIMARY};
      color: white;
      border: none;
      border-radius: var(--radius-sm);
      padding: ${SPACING.SM} ${SPACING.MD};
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-top: ${SPACING.SM};
    `;
    
    addAction.addEventListener('click', () => {
      window.location.hash = '#add-transaction';
    });
    
    emptyState.appendChild(emptyIcon);
    emptyState.appendChild(emptyMessage);
    emptyState.appendChild(addAction);
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
