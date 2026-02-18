/**
 * InsightCard Component
 * Displays an individual financial insight with icon and recommendation.
 */

import { COLORS, SPACING } from '../utils/constants.js';

/**
 * Create individual insight card
 * @param {Object} insight - Insight data
 * @param {number} index - Index for animation delays
 * @returns {HTMLElement}
 */
export const InsightCard = (insight, _index) => {
  const card = document.createElement('div');
  card.className = 'insight-card';
  card.style.background = getInsightBackgroundColor(insight.type);
  card.style.border = 'none';
  card.style.borderRadius = 'var(--radius-md)';
  card.style.padding = SPACING.MD;
  card.style.position = 'relative';

  // Create a container for icon and message on the same row
  const contentContainer = document.createElement('div');
  contentContainer.style.display = 'flex';
  contentContainer.style.alignItems = 'flex-start';
  contentContainer.style.gap = SPACING.SM;

  const icon = document.createElement('div');
  icon.style.fontSize = '1.5rem';
  icon.style.flexShrink = '0'; // Prevent icon from shrinking
  icon.textContent = getInsightIcon(insight.type);

  const messageContainer = document.createElement('div');
  messageContainer.style.flex = '1'; // Take remaining space

  const message = document.createElement('div');
  message.textContent = insight.message;
  message.style.color = COLORS.TEXT_MAIN;
  message.style.lineHeight = '1.5';
  message.style.marginBottom = insight.recommendation ? SPACING.SM : '0';

  messageContainer.appendChild(message);

  if (insight.recommendation) {
    const recommendation = document.createElement('div');
    recommendation.textContent = `💡 ${insight.recommendation}`;
    recommendation.style.fontSize = '0.875rem';
    recommendation.style.color = COLORS.TEXT_MUTED;
    recommendation.style.fontStyle = 'italic';
    recommendation.style.marginTop = SPACING.SM;
    recommendation.style.paddingTop = SPACING.SM;
    recommendation.style.borderTop = 'none';
    messageContainer.appendChild(recommendation);
  }

  contentContainer.appendChild(icon);
  contentContainer.appendChild(messageContainer);
  card.appendChild(contentContainer);

  if (insight.severity === 'high') {
    const severityIndicator = document.createElement('div');
    severityIndicator.style.position = 'absolute';
    severityIndicator.style.top = SPACING.SM;
    severityIndicator.style.right = SPACING.SM;
    severityIndicator.style.width = '8px';
    severityIndicator.style.height = '8px';
    severityIndicator.style.borderRadius = '50%';
    severityIndicator.style.background = COLORS.ERROR;
    card.appendChild(severityIndicator);
  }

  return card;
};

// Helper functions for insights
function getInsightIcon(type) {
  const icons = {
    positive: '✅',
    warning: '⚠️',
    pattern: '📈',
    anomaly: '🔍',
    increase: '📈',
    decrease: '📉',
  };
  return icons[type] || '💡';
}

function getInsightBackgroundColor(type) {
  const colors = {
    positive: 'rgba(34, 197, 94, 0.05)',
    warning: 'rgba(251, 191, 36, 0.05)',
    pattern: 'rgba(59, 130, 246, 0.05)',
    anomaly: 'rgba(239, 68, 68, 0.05)',
    increase: 'rgba(251, 191, 36, 0.05)',
    decrease: 'rgba(34, 197, 94, 0.05)',
  };
  return colors[type] || 'rgba(156, 163, 175, 0.05)';
}

