import { createPlaceholder } from '../../utils/financial-planning-helpers.js';

/**
 * Placeholder Component - Displays placeholder content for sections
 * @param {Object} props - Placeholder properties
 * @param {string} props.title - Placeholder title
 * @param {string} props.description - Placeholder description
 * @param {string} props.icon - Placeholder icon emoji
 * @returns {HTMLElement} The placeholder element
 */
export const Placeholder = ({ title, description, icon }) => {
  const placeholder = createPlaceholder(title, description, icon);
  // Add accessibility attribute for component version
  placeholder
    .querySelector('div:first-child')
    ?.setAttribute('aria-hidden', 'true');
  return placeholder;
};
