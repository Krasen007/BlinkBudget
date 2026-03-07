/**
 * TrendAnalysisSection Component
 * Displays spending trends with direction indicators, consistency scores, and MoM comparisons.
 */

import { COLORS, SPACING } from '../utils/constants.js';

/**
 * Create trend analysis section
 * @param {Object} options - Trend analysis data
 * @param {Array} options.trends - Array of trend data per category
 * @param {Object} options.consistencyScores - Map of category to consistency data
 * @param {Array} options.transactions - Transaction data for additional context
 * @returns {HTMLElement}
 */
export const TrendAnalysisSection = ({
  trends = [],
  consistencyScores = {},
  _transactions = [],
}) => {
  const section = document.createElement('div');
  section.className = 'trend-analysis-section';
  section.style.background = COLORS.SURFACE;
  section.style.borderRadius = 'var(--radius-lg)';
  section.style.padding = SPACING.MD;
  section.style.marginTop = SPACING.MD;

  // Section header
  const title = document.createElement('h3');
  title.textContent = 'Spending Trends';
  title.style.margin = `0 0 ${SPACING.XS} 0`;
  title.style.color = COLORS.TEXT_MAIN;
  section.appendChild(title);

  const description = document.createElement('p');
  description.textContent =
    'Your spending patterns over time (vs last 3 months)';
  description.style.margin = `0 0 ${SPACING.LG} 0`;
  description.style.color = COLORS.TEXT_MUTED;
  section.appendChild(description);

  // Check for valid trend data
  if (!trends || trends.length === 0) {
    const emptyState = createEmptyState();
    section.appendChild(emptyState);
    return section;
  }

  // Container for trend cards
  const trendsGrid = document.createElement('div');
  trendsGrid.style.display = 'flex';
  trendsGrid.style.flexDirection = 'column';
  trendsGrid.style.gap = SPACING.MD;

  // Render each category's trend
  trends.forEach((trend, index) => {
    const card = createTrendCard(
      trend,
      consistencyScores[trend.category],
      index
    );
    trendsGrid.appendChild(card);
  });

  section.appendChild(trendsGrid);

  return section;
};

/**
 * Create individual trend card
 * @param {Object} trend - Trend data
 * @param {Object} consistency - Consistency score data
 * @param {number} index - Index for styling
 * @returns {HTMLElement}
 */
function createTrendCard(trend, consistency, _index) {
  const card = document.createElement('div');
  card.className = 'trend-card';

  // Background color based on direction
  const isIncreasing = trend.direction === 'increasing';
  const isDecreasing = trend.direction === 'decreasing';
  const backgroundColor = isIncreasing
    ? 'rgba(239, 68, 68, 0.05)' // Red for increase (bad)
    : isDecreasing
      ? 'rgba(34, 197, 94, 0.05)' // Green for decrease (good)
      : 'rgba(156, 163, 175, 0.05)'; // Gray for stable

  card.style.background = backgroundColor;
  card.style.border = 'none';
  card.style.borderRadius = 'var(--radius-md)';
  card.style.padding = SPACING.MD;
  card.style.position = 'relative';

  // Main container: icon + content + metrics
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.alignItems = 'flex-start';
  container.style.gap = SPACING.SM;

  // Icon
  const icon = document.createElement('div');
  icon.style.fontSize = '1.5rem';
  icon.style.flexShrink = '0';
  icon.textContent = getTrendIcon(trend.direction);
  container.appendChild(icon);

  // Content (category name + description)
  const content = document.createElement('div');
  content.style.flex = '1';

  const categoryName = document.createElement('div');
  categoryName.textContent = trend.category || 'Unknown Category';
  categoryName.style.color = COLORS.TEXT_MAIN;
  categoryName.style.fontWeight = '600';
  categoryName.style.fontSize = '1rem';
  content.appendChild(categoryName);

  if (trend.description) {
    const description = document.createElement('div');
    description.textContent = trend.description;
    description.style.color = COLORS.TEXT_MUTED;
    description.style.fontSize = '0.875rem';
    description.style.marginTop = SPACING.XS;
    content.appendChild(description);
  }

  container.appendChild(content);

  // Metrics (direction + consistency)
  const metrics = document.createElement('div');
  metrics.style.display = 'flex';
  metrics.style.flexDirection = 'column';
  metrics.style.alignItems = 'flex-end';
  metrics.style.gap = SPACING.XS;
  metrics.style.flexShrink = '0';

  // Direction indicator
  const direction = document.createElement('div');
  direction.style.fontWeight = '600';
  direction.style.fontSize = '0.9rem';
  direction.style.whiteSpace = 'nowrap';

  if (trend.changePercent !== undefined && trend.changePercent !== null) {
    const arrow = isIncreasing ? '↑' : isDecreasing ? '↓' : '➡️';
    direction.textContent = `${arrow} ${trend.changePercent > 0 ? '+' : ''}${trend.changePercent.toFixed(1)}%`;
    direction.style.color = isIncreasing
      ? COLORS.ERROR
      : isDecreasing
        ? COLORS.SUCCESS
        : COLORS.TEXT_MUTED;
  } else {
    direction.textContent = '➡️';
    direction.style.color = COLORS.TEXT_MUTED;
  }
  metrics.appendChild(direction);

  // Consistency score
  if (consistency && consistency.score !== undefined) {
    const consistencyBadge = document.createElement('div');
    consistencyBadge.style.fontSize = '0.75rem';
    consistencyBadge.style.padding = '2px 6px';
    consistencyBadge.style.borderRadius = '4px';
    consistencyBadge.style.fontWeight = '500';
    consistencyBadge.textContent = `${consistency.score}% consistent`;

    // Color based on score
    if (consistency.score >= 80) {
      consistencyBadge.style.background = 'rgba(34, 197, 94, 0.15)';
      consistencyBadge.style.color = COLORS.SUCCESS;
    } else if (consistency.score >= 60) {
      consistencyBadge.style.background = 'rgba(251, 191, 36, 0.15)';
      consistencyBadge.style.color = '#b45309'; // Dark yellow
    } else {
      consistencyBadge.style.background = 'rgba(239, 68, 68, 0.15)';
      consistencyBadge.style.color = COLORS.ERROR;
    }

    metrics.appendChild(consistencyBadge);
  }

  container.appendChild(metrics);
  card.appendChild(container);

  return card;
}

/**
 * Create empty state when no trend data available
 * @returns {HTMLElement}
 */
function createEmptyState() {
  const emptyState = document.createElement('div');
  emptyState.style.padding = SPACING.MD;
  emptyState.style.textAlign = 'center';
  emptyState.style.color = COLORS.TEXT_MUTED;
  emptyState.innerHTML = `
    <div style="font-size: 2rem; margin-bottom: ${SPACING.SM};">📊</div>
    <div>Need at least 2 months of data for trend analysis</div>
  `;
  return emptyState;
}

/**
 * Get icon based on trend direction
 * @param {string} direction - Trend direction
 * @returns {string} Emoji icon
 */
function getTrendIcon(direction) {
  const icons = {
    increasing: '📈',
    decreasing: '📉',
    stable: '➡️',
  };
  return icons[direction] || '📊';
}
