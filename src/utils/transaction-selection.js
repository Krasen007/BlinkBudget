/**
 * Transaction selection helpers
 * Shared util used by both TransactionListItem and DashboardView to avoid a
 * circular import (component <-> view). Keeps selection styling in one place.
 */

import { COLORS } from './constants.js';

/**
 * Apply or remove selected styling to a transaction item
 * @param {HTMLElement} item - The transaction list item element
 * @param {boolean} isSelected - Whether the item is selected
 */
export const setSelectedStyle = (item, isSelected) => {
  if (isSelected) {
    item.style.background =
      'color-mix(in srgb, var(--color-primary) 12%, transparent)';
    item.style.borderLeft = `3px solid ${COLORS.PRIMARY}`;
  } else {
    item.style.background = '';
    item.style.borderLeft = '';
  }
};
