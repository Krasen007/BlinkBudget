import { COLORS, SPACING } from '../../utils/constants.js';

/**
 * StatsCard Component - Reusable statistics display card
 * @param {Object} props - Card properties
 * @param {string} props.label - Card label
 * @param {string} props.value - Main value to display
 * @param {string} props.color - Text color for value
 * @param {string} props.icon - Icon emoji
 * @param {string} [props.subtitle] - Optional subtitle
 * @param {string} [props.calculationHelp] - Optional calculation explanation
 * @returns {HTMLElement} The stats card element
 */
export const StatsCard = ({ label, value, color, icon, subtitle, calculationHelp }) => {
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

  // Add calculation help section if provided
  if (calculationHelp) {
    const helpSection = document.createElement('div');
    helpSection.style.marginTop = SPACING.SM;
    helpSection.style.paddingTop = SPACING.XS;
    helpSection.style.borderTop = `1px solid ${COLORS.BORDER}`;

    const helpTitle = document.createElement('div');
    helpTitle.style.display = 'flex';
    helpTitle.style.alignItems = 'center';
    helpTitle.style.cursor = 'pointer';
    helpTitle.style.marginBottom = SPACING.XS;

    const helpTitleText = document.createElement('span');
    helpTitleText.textContent = '📊 How calculated?';
    helpTitleText.style.fontSize = '0.625rem';
    helpTitleText.style.fontWeight = '600';
    helpTitleText.style.color = COLORS.TEXT_MUTED;

    const toggleIcon = document.createElement('span');
    toggleIcon.textContent = '▼';
    toggleIcon.style.marginLeft = SPACING.XS;
    toggleIcon.style.fontSize = '0.5rem';
    toggleIcon.style.color = COLORS.TEXT_MUTED;
    toggleIcon.style.transition = 'transform 0.2s ease';

    helpTitle.appendChild(helpTitleText);
    helpTitle.appendChild(toggleIcon);

    const helpDetails = document.createElement('div');
    helpDetails.style.fontSize = '0.625rem';
    helpDetails.style.color = COLORS.TEXT_MUTED;
    helpDetails.style.lineHeight = '1.3';
    helpDetails.innerHTML = calculationHelp;

    // Initially hide details
    helpDetails.style.display = 'none';

    // Toggle functionality
    let isExpanded = false;
    helpTitle.addEventListener('click', () => {
      isExpanded = !isExpanded;
      helpDetails.style.display = isExpanded ? 'block' : 'none';
      toggleIcon.style.transform = isExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
    });

    helpSection.appendChild(helpTitle);
    helpSection.appendChild(helpDetails);
    card.appendChild(helpSection);
  }

  return card;
};
