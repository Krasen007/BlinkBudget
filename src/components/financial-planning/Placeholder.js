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

  // Hide decorative icon from screen readers
  const iconElement = placeholder.querySelector('div:first-child');
  if (iconElement) {
    iconElement.setAttribute('aria-hidden', 'true');
  } else {
    console.warn(
      '[Placeholder] Expected decorative icon element not found in DOM. ' +
        'The placeholder structure may have changed.'
    );
  }

  return placeholder;
};
