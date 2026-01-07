import { COLORS, SPACING } from '../../utils/constants.js';

/**
 * EmergencyFundCard Component - Displays emergency fund assessment
 * @param {Object} assessment - Emergency fund assessment data
 * @param {string} assessment.status - Assessment status ('adequate', 'inadequate', 'error')
 * @param {string} assessment.message - Assessment message
 * @param {string} assessment.recommendation - Assessment recommendation
 * @param {string} assessment.riskLevel - Risk level ('low', 'moderate', 'high')
 * @returns {HTMLElement} The emergency fund card element
 */
export const EmergencyFundCard = assessment => {
  if (
    !assessment ||
    !assessment.riskLevel ||
    !assessment.status ||
    !assessment.message ||
    !assessment.recommendation
  ) {
    throw new Error('Invalid assessment: missing required properties');
  }

  const card = document.createElement('div');
  card.className = 'emergency-fund-card';
  card.style.padding = SPACING.LG;
  card.style.background = COLORS.SURFACE;
  card.style.border = `2px solid ${assessment.riskLevel === 'low' ? COLORS.SUCCESS : assessment.riskLevel === 'moderate' ? COLORS.WARNING : COLORS.ERROR}`;
  card.style.borderRadius = 'var(--radius-lg)';
  card.style.marginBottom = SPACING.LG;
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.justifyContent = 'space-between';
  header.style.marginBottom = SPACING.MD;

  const title = document.createElement('h3');
  title.textContent = '🛡️ Emergency Fund Status';
  title.style.margin = '0';
  title.style.fontSize = '1.125rem';
  const status = document.createElement('span');
  status.textContent =
    assessment.status.charAt(0).toUpperCase() + assessment.status.slice(1);
  status.setAttribute(
    'aria-label',
    `Risk level: ${assessment.riskLevel}, Status: ${assessment.status}`
  );
  status.style.padding = `${SPACING.XS} ${SPACING.SM}`;
  status.style.borderRadius = 'var(--radius-sm)';
  status.style.fontSize = '0.75rem';
  status.style.fontWeight = '600';
  status.style.background =
    assessment.riskLevel === 'low'
      ? COLORS.SUCCESS
      : assessment.riskLevel === 'moderate'
        ? COLORS.WARNING
        : COLORS.ERROR;
  status.style.color = 'white';

  header.appendChild(title);
  header.appendChild(status);

  const message = document.createElement('p');
  message.textContent = assessment.message;
  message.style.margin = '0';
  message.style.marginBottom = SPACING.SM;
  message.style.color = COLORS.TEXT_MAIN;
  message.style.fontSize = '0.875rem';

  const recommendation = document.createElement('p');
  recommendation.textContent = assessment.recommendation;
  recommendation.style.margin = '0';
  recommendation.style.color = COLORS.TEXT_MUTED;
  recommendation.style.fontSize = '0.875rem';
  recommendation.style.fontStyle = 'italic';

  card.appendChild(header);
  card.appendChild(message);
  card.appendChild(recommendation);

  return card;
};
