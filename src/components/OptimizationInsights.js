/**
 * OptimizationInsights Component
 * Displays cost-saving recommendations (substitution, reduction, elimination).
 */

import { COLORS, SPACING } from '../utils/constants.js';
import { InsightCard } from './InsightCard.js';

/**
 * Create optimization insights section
 * @param {Array} insights - Array of optimization insight objects
 * @returns {HTMLElement}
 */
export const OptimizationInsights = insights => {
  const data = insights || [];

  const section = document.createElement('div');
  section.className = 'optimization-insights';
  section.style.background = COLORS.SURFACE;
  section.style.borderRadius = 'var(--radius-lg)';
  section.style.padding = SPACING.MD;

  const title = document.createElement('h3');
  title.textContent = 'Optimization Insights';
  title.style.margin = `0 0 ${SPACING.MD} 0`;
  title.style.color = COLORS.TEXT_MAIN;
  section.appendChild(title);

  const description = document.createElement('p');
  description.textContent = 'Recommendations to reduce your spending';
  description.style.margin = `0 0 ${SPACING.LG} 0`;
  description.style.color = COLORS.TEXT_MUTED;
  section.appendChild(description);

  const insightsGrid = document.createElement('div');
  insightsGrid.style.display = 'flex';
  insightsGrid.style.flexDirection = 'column';
  insightsGrid.style.gap = SPACING.MD;

  if (data && Array.isArray(data) && data.length > 0) {
    data.forEach((insight, index) => {
      const card = InsightCard(insight, index);
      insightsGrid.appendChild(card);
    });
  } else {
    const noInsights = document.createElement('div');
    noInsights.style.padding = SPACING.MD;
    noInsights.style.textAlign = 'center';
    noInsights.style.color = COLORS.TEXT_MUTED;
    noInsights.textContent =
      'Add more transactions to see personalized savings recommendations';
    insightsGrid.appendChild(noInsights);
  }

  section.appendChild(insightsGrid);

  return section;
};
