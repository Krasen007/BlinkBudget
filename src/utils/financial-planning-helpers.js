/**
 * Financial Planning Helper Utilities
 *
 * Extracted helper functions for the Financial Planning view.
 * These utilities handle common UI element creation and formatting.
 */

import { COLORS, SPACING } from './constants.js';

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
  placeholder.style.minHeight = '300px';

  const iconDiv = document.createElement('div');
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
 * Calculate current balance from transactions
 * @param {Array} transactions - Array of transaction objects
 * @returns {number} The current balance
 */
export function calculateCurrentBalance(transactions) {
  return transactions.reduce((balance, t) => {
    if (t.type === 'income') {
      return balance + t.amount;
    } else if (t.type === 'expense') {
      return balance - t.amount;
    }
    return balance;
  }, 0);
}

/**
 * Calculate average monthly expenses from recent transactions
 * @param {Array} transactions - Array of transaction objects
 * @param {number} monthsBack - Number of months to look back (default: 3)
 * @returns {number} The average monthly expenses
 */
export function calculateMonthlyExpenses(transactions, monthsBack = 3) {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);

  const recentTransactions = transactions.filter(
    t => new Date(t.timestamp) >= startDate
  );

  if (recentTransactions.length === 0) {
    return 0;
  }

  const recentExpenses = recentTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthsOfData = Math.max(
    1,
    (now - startDate) / (1000 * 60 * 60 * 24 * 30)
  );

  return recentExpenses / monthsOfData;
}

/**
 * Calculate savings rate as a percentage
 * @param {number} totalIncome - Total income amount
 * @param {number} totalExpenses - Total expenses amount
 * @returns {number} The savings rate percentage
 */
export function calculateSavingsRate(totalIncome, totalExpenses) {
  if (totalIncome <= 0) {
    return 0;
  }
  return ((totalIncome - totalExpenses) / totalIncome) * 100;
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
 * Format date with options
 * @param {Date|string} date - The date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} The formatted date string
 */
export function formatDate(date, options = {}) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', options);
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
