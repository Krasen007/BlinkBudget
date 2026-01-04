/**
 * PredictionsSection Component
 * Displays spending predictions if enough data is available.
 */

import { COLORS, SPACING } from '../utils/constants.js';

/**
 * Create predictions section
 * @param {Object} currentData - Analytics data
 * @returns {HTMLElement}
 */
export const PredictionsSection = currentData => {
  const section = document.createElement('div');
  section.style.marginTop = SPACING.LG;
  section.style.paddingTop = SPACING.LG;
  section.style.borderTop = `1px solid ${COLORS.BORDER}`;

  const title = document.createElement('h4');
  title.textContent = 'Spending Predictions';
  title.style.margin = `0 0 ${SPACING.MD} 0`;
  title.style.color = COLORS.TEXT_MAIN;
  section.appendChild(title);

  const predictionsGrid = document.createElement('div');
  predictionsGrid.style.display = 'grid';
  predictionsGrid.style.gridTemplateColumns =
    'repeat(auto-fit, minmax(150px, 1fr))';
  predictionsGrid.style.gap = SPACING.MD;

  const predictions = currentData.predictions?.predictions || [];

  predictions.forEach(prediction => {
    const predictionCard = document.createElement('div');
    predictionCard.style.background = 'rgba(59, 130, 246, 0.05)';
    predictionCard.style.border = '1px solid rgba(59, 130, 246, 0.2)';
    predictionCard.style.borderRadius = 'var(--radius-md)';
    predictionCard.style.padding = SPACING.MD;
    predictionCard.style.textAlign = 'center';

    const monthName = document.createElement('div');
    monthName.textContent = prediction.monthName;
    monthName.style.fontSize = '0.875rem';
    monthName.style.color = COLORS.TEXT_MUTED;
    monthName.style.marginBottom = SPACING.XS;

    const amount = document.createElement('div');
    amount.textContent = `€${prediction.predictedAmount.toFixed(0)}`;
    amount.style.fontSize = '1.25rem';
    amount.style.fontWeight = 'bold';
    amount.style.color = COLORS.PRIMARY;

    const confidence = document.createElement('div');
    confidence.textContent = `${prediction.confidence} confidence`;
    confidence.style.fontSize = '0.75rem';
    confidence.style.color = COLORS.TEXT_MUTED;
    confidence.style.marginTop = SPACING.XS;

    predictionCard.appendChild(monthName);
    predictionCard.appendChild(amount);
    predictionCard.appendChild(confidence);

    predictionsGrid.appendChild(predictionCard);
  });

  section.appendChild(predictionsGrid);
  return section;
};
