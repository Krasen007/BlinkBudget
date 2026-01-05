import { COLORS, SPACING } from '../../utils/constants.js';

/**
 * Placeholder Component - Displays placeholder content for sections
 * @param {Object} props - Placeholder properties
 * @param {string} props.title - Placeholder title
 * @param {string} props.description - Placeholder description
 * @param {string} props.icon - Placeholder icon emoji
 * @returns {HTMLElement} The placeholder element
 */
export const Placeholder = ({ title, description, icon }) => {
  const placeholder = document.createElement('div');
  placeholder.className = 'section-placeholder';
  placeholder.style.display = 'flex';
  placeholder.style.flexDirection = 'column';
  placeholder.style.alignItems = 'center';
  placeholder.style.justifyContent = 'center';
  placeholder.style.padding = `${SPACING.XL} ${SPACING.LG}`;
  placeholder.style.background = COLORS.SURFACE;
  placeholder.style.border = `2px dashed ${COLORS.BORDER}`;
  placeholder.style.borderRadius = 'var(--radius-lg)';
  placeholder.style.textAlign = 'center';
  placeholder.style.minHeight = '300px';

  const iconDiv = document.createElement('div');
  iconDiv.setAttribute('aria-hidden', 'true');
  iconDiv.textContent = icon;
  iconDiv.style.fontSize = '3rem';
  iconDiv.style.marginBottom = SPACING.MD;
  const titleDiv = document.createElement('h3');
  titleDiv.textContent = title;
  titleDiv.style.margin = '0';
  titleDiv.style.marginBottom = SPACING.SM;
  titleDiv.style.fontSize = '1.25rem';
  titleDiv.style.fontWeight = '600';
  titleDiv.style.color = COLORS.TEXT_MAIN;

  const descDiv = document.createElement('p');
  descDiv.textContent = description;
  descDiv.style.margin = '0';
  descDiv.style.fontSize = '0.875rem';
  descDiv.style.color = COLORS.TEXT_MUTED;
  descDiv.style.maxWidth = '400px';
  descDiv.style.lineHeight = '1.5';

  placeholder.appendChild(iconDiv);
  placeholder.appendChild(titleDiv);
  placeholder.appendChild(descDiv);

  return placeholder;
};
