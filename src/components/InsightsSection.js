/**
 * InsightsSection Component
 * Displays spending insights and optional predictions.
 */

import { COLORS, SPACING } from '../utils/constants.js';
import { InsightCard } from './InsightCard.js';
import { PredictionsSection } from './PredictionsSection.js';

/**
 * Create insights section
 * @param {Object} currentData - Analytics data
 * @returns {HTMLElement}
 */
export const InsightsSection = currentData => {
  const section = document.createElement('div');
  section.className = 'insights-section';
  section.style.background = COLORS.SURFACE;
  section.style.borderRadius = 'var(--radius-lg)';
  section.style.border = `1px solid ${COLORS.BORDER}`;
  section.style.padding = SPACING.MD;

  const title = document.createElement('h3');
  title.textContent = 'Financial Insights';
  title.style.margin = `0 0 ${SPACING.MD} 0`;
  title.style.color = COLORS.TEXT_MAIN;
  section.appendChild(title);

  const description = document.createElement('p');
  description.textContent =
    'AI-powered insights based on your spending patterns and trends.';
  description.style.margin = `0 0 ${SPACING.LG} 0`;
  description.style.color = COLORS.TEXT_MUTED;
  section.appendChild(description);

  const insightsGrid = document.createElement('div');
  insightsGrid.style.display = 'flex';
  insightsGrid.style.flexDirection = 'column';
  insightsGrid.style.gap = SPACING.MD;

  if (
    currentData.insights &&
    Array.isArray(currentData.insights) &&
    currentData.insights.length > 0
  ) {
    const topInsights = currentData.insights.slice(0, 5);
    topInsights.forEach((insight, index) => {
      const card = InsightCard(insight, index);
      insightsGrid.appendChild(card);
    });
  } else {
    const noInsights = document.createElement('div');
    noInsights.style.padding = SPACING.MD;
    noInsights.style.textAlign = 'center';
    noInsights.style.color = COLORS.TEXT_MUTED;
    noInsights.textContent =
      'No insights available yet. Add more transactions to see personalized insights.';
    insightsGrid.appendChild(noInsights);
  }

  section.appendChild(insightsGrid);

  if (currentData.predictions && currentData.predictions.hasEnoughData) {
    const predictions = PredictionsSection(currentData);
    section.appendChild(predictions);
  }

  return section;
};
