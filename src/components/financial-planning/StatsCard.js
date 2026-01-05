import { COLORS, SPACING } from '../../utils/constants.js';

/**
 * StatsCard Component - Reusable statistics display card
 * @param {Object} props - Card properties
 * @param {string} props.label - Card label
 * @param {string} props.value - Main value to display
 * @param {string} props.color - Text color for value
 * @param {string} props.icon - Icon emoji
 * @param {string} [props.subtitle] - Optional subtitle
 * @returns {HTMLElement} The stats card element
 */
export const StatsCard = ({ label, value, color, icon, subtitle }) => {
  const card = document.createElement('div');
  card.className = 'stats-card';
  card.style.padding = SPACING.LG;
  card.style.background = COLORS.SURFACE;
  card.style.border = `1px solid ${COLORS.BORDER}`;
  card.style.borderRadius = 'var(--radius-lg)';
  card.style.display = 'flex';
  card.style.flexDirection = 'column';
  card.style.gap = SPACING.SM;

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.gap = SPACING.SM;

  const iconSpan = document.createElement('span');
  iconSpan.textContent = icon;
  iconSpan.style.fontSize = '1.25rem';

  const labelSpan = document.createElement('span');
  labelSpan.textContent = label;
  labelSpan.style.fontSize = '0.875rem';
  labelSpan.style.color = COLORS.TEXT_MUTED;
  labelSpan.style.fontWeight = '500';

  header.appendChild(iconSpan);
  header.appendChild(labelSpan);

  const valueSpan = document.createElement('span');
  valueSpan.textContent = value;
  valueSpan.style.fontSize = '1.75rem';
  valueSpan.style.fontWeight = 'bold';
  valueSpan.style.color = color;

  card.appendChild(header);
  card.appendChild(valueSpan);

  if (subtitle) {
    const subtitleSpan = document.createElement('span');
    subtitleSpan.textContent = subtitle;
    subtitleSpan.style.fontSize = '0.75rem';
    subtitleSpan.style.color = COLORS.TEXT_MUTED;
    card.appendChild(subtitleSpan);
  }

  return card;
};
