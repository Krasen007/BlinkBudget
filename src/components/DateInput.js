/**
 * Date Input Component
 * Simplified to use natural native date picker interactions
 */

import { getTodayISO, dateToISO } from '../utils/date-utils.js';
import { createInput } from '../utils/dom-factory.js';
import { DIMENSIONS, SPACING, COLORS, FONT_SIZES } from '../utils/constants.js';

export const DateInput = (options = {}) => {
  const { value = null, onChange = null, showLabel = true } = options;

  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'center';
  container.style.width = DIMENSIONS.DATE_INPUT_WIDTH; // Default width, can be overridden by parent
  container.style.marginRight = SPACING.SM;

  // Label for accessibility and context
  const label = document.createElement('label');
  label.style.fontSize = FONT_SIZES.XS;
  label.style.color = COLORS.TEXT_MUTED;
  label.style.marginBottom = SPACING.XS;
  label.style.fontWeight = '500';
  label.style.textAlign = 'center';
  label.style.width = '100%';
  label.style.display = showLabel ? 'block' : 'none';

  const inputId = `date-input-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Native Date Input - Visible and styled directly
  const realDate = createInput({
    type: 'date',
    id: inputId,
    name: 'transaction_date',
    className: 'mobile-form-input date-input-field',
    readOnly: false, // Explicitly ensure it's not readonly
  });

  // Accessibility attributes
  realDate.setAttribute('aria-label', 'Transaction date');

  // Double-check that it's not readonly
  realDate.readOnly = false;

  // Initialize with today's date or provided value
  const initialDate = value
    ? typeof value === 'string'
      ? value.includes('T')
        ? value.split('T')[0]
        : value
      : dateToISO(new Date(value))
    : getTodayISO();
  realDate.value = initialDate;

  // Store the original full timestamp in dataset for time preservation during edits
  if (value && typeof value === 'string' && value.includes('T')) {
    realDate.dataset.timestamp = value;
    container.dataset.timestamp = value;
  }

  // Connect label to input
  label.setAttribute('for', inputId);

  // Handle value changes
  realDate.addEventListener('change', e => {
    if (onChange) {
      onChange(e.target.value);
    }
  });

  // Handle click to show picker (fixes issues where appearance:none hides the trigger)
  realDate.addEventListener('click', () => {
    // Let the native behavior handle the click - don't interfere
  });

  // Build the component structure
  container.appendChild(label);
  container.appendChild(realDate);

  // Expose methods for external consumption
  container.getDate = () => {
    // Return the current date value (date-only format YYYY-MM-DD)
    return realDate.value;
  };
  container.setDate = isoDate => {
    realDate.value = isoDate;
    // Store the original full timestamp in dataset for timestamp preservation
    // Store on both the input element and the container for accessibility
    if (typeof isoDate === 'string' && isoDate.includes('T')) {
      realDate.dataset.timestamp = isoDate;
      container.dataset.timestamp = isoDate;
    }
  };

  return container;
};
