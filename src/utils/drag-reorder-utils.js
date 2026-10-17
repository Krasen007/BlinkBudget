/**
 * Drag-to-reorder utilities
 * Pure, DOM-free helpers that compute a new ordering from a drag-and-drop
 * interaction. Kept independent of the DOM so the ordering logic can be
 * unit-tested and reused by any sortable list.
 */

/**
 * Move `id` to `targetIndex` within `ids`.
 * @param {string[]} ids - Current ordering.
 * @param {string} id - Id to move.
 * @param {number} targetIndex - Destination index in the original array.
 * @returns {string[]} New array with `id` at `targetIndex`.
 */
export const moveIdToIndex = (ids, id, targetIndex) => {
  const fromIndex = ids.indexOf(id);
  if (fromIndex === -1) return [...ids];
  const next = [...ids];
  next.splice(fromIndex, 1);
  const clamped = Math.max(0, Math.min(targetIndex, next.length));
  next.splice(clamped, 0, id);
  return next;
};

/**
 * Compute the new visible ordering when `draggedId` is dropped onto
 * `targetId`: the dragged card takes the target's slot in the order, which
 * keeps the interaction unambiguous in a 2-D grid (no before/after midpoint
 * guessing).
 * @param {string[]} ids - Current visible ordering.
 * @param {string} draggedId - Id of the card being dragged.
 * @param {string} targetId - Id of the card dropped upon.
 * @returns {string[]|null} New ordering, or null when the drop is a no-op
 *   (same card, unknown id, or missing ids).
 */
export const buildReorderFromDrop = (ids, draggedId, targetId) => {
  if (!draggedId || !targetId || draggedId === targetId) return null;
  const fromIndex = ids.indexOf(draggedId);
  const toIndex = ids.indexOf(targetId);
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return null;
  }
  return moveIdToIndex(ids, draggedId, toIndex);
};
