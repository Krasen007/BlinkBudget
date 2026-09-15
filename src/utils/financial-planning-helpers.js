/**
 * Financial Planning Helper Utilities
 *
 * Extracted helper functions for the Financial Planning view.
 * These utilities handle common UI element creation and formatting.
 */

import { COLORS, SPACING, DIMENSIONS } from './constants.js';

/**
 * Create a section usage note element
 * @param {string} text - The usage note text to display
 * @returns {HTMLDivElement} The usage note element
 */
export function createUsageNote(text) {
  const note = document.createElement('div');
  note.className = 'section-usage-note';
  note.style.fontSize = '0.95rem';
  note.style.color = COLORS.TEXT_MUTED;
  note.style.marginBottom = SPACING.MD;
  note.style.lineHeight = '1.4';
  note.textContent = text;
  return note;
}

/**
 * Create a placeholder element for sections under development
 * @param {string} title - The placeholder title
 * @param {string} description - The placeholder description
 * @param {string} icon - The emoji icon to display
 * @returns {HTMLDivElement} The placeholder element
 */
export function createPlaceholder(title, description, icon) {
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
  placeholder.style.minHeight = DIMENSIONS.PLACEHOLDER_MIN_HEIGHT;

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
  descDiv.style.maxWidth = DIMENSIONS.CONTENT_MAX_WIDTH;
  descDiv.style.lineHeight = '1.5';

  placeholder.appendChild(iconDiv);
  placeholder.appendChild(titleDiv);
  placeholder.appendChild(descDiv);

  return placeholder;
}

/**
 * Create a section container with header
 * @param {string} id - The section ID
 * @param {string} title - The section title
 * @param {string} icon - The emoji icon to display
 * @returns {HTMLElement} The section container element
 */
export function createSectionContainer(id, title, icon) {
  const section = document.createElement('section');
  section.className = `financial-planning-section ${id}-section`;
  section.style.display = 'flex';
  section.style.flexDirection = 'column';
  section.style.gap = SPACING.LG;

  const header = document.createElement('div');
  header.className = 'section-header';
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.gap = SPACING.MD;
  header.style.marginBottom = SPACING.MD;

  const headerTitle = document.createElement('h2');
  headerTitle.textContent = `${icon} ${title}`;
  headerTitle.style.margin = '0';
  headerTitle.style.fontSize = '1.5rem';
  headerTitle.style.fontWeight = '600';
  headerTitle.style.color = COLORS.TEXT_MAIN;

  header.appendChild(headerTitle);
  section.appendChild(header);

  return section;
}

/**
 * Format currency value
 * @param {number} value - The value to format
 * @param {string} currency - The currency code (default: 'EUR')
 * @returns {string} The formatted currency string
 */
export function formatCurrency(value, currency = 'EUR') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(value);
}

/**
 * Safely parse a date and return ISO date string
 * @param {Date|string} date - The date to parse
 * @returns {string} ISO date string (YYYY-MM-DD) or empty string if invalid
 */
export function safeParseDate(date) {
  if (!date) {
    return '';
  }

  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return '';
  }

  return d.toISOString().slice(0, 10);
}
