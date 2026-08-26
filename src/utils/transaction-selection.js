/**
 * Transaction selection helpers
 * Shared util used by both TransactionListItem and DashboardView to avoid a
 * circular import (component <-> view). Keeps selection styling in one place.
 */

/**
 * Apply or remove selected styling to a transaction item
 * @param {HTMLElement} item - The transaction list item element
 * @param {boolean} isSelected - Whether the item is selected
 */
export const setSelectedStyle = (item, isSelected) => {
  if (isSelected) {
    item.style.background = 'rgba(59, 130, 246, 0.12)';
    item.style.borderLeft = '3px solid var(--color-primary)';
  } else {
    item.style.background = '';
    item.style.borderLeft = '';
  }
};
