/**
 * CategoryHistoryCard Component
 *
 * Shown above the transaction list when the dashboard is drilled into a single
 * category (Reports -> Explore Categories, or a category tap in the list): how
 * that category moved month by month over the last 12 months, or over every
 * month that actually has data. The list below only covers the active period,
 * so this strip answers "is this month normal?" without leaving the dashboard.
 *
 * The bars are plain DOM buttons scaled by a CSS custom property rather than a
 * Chart.js canvas: the dashboard is the first screen of the app, it must not
 * wait on the lazy chart chunk, and every bar is then a real tap target that
 * re-filters the list to its month.
 */

import { TRANSACTION_TYPES } from '../utils/constants.js';
import { formatCurrency } from '../utils/financial-planning-helpers.js';

/** Months of history the strip tries to show. */
export const MAX_HISTORY_MONTHS = 12;

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const pad = value => String(value).padStart(2, '0');

/** Calendar-month key in the same UTC terms the dashboard month filter uses. */
const monthKey = (year, monthIndex) => `${year}-${pad(monthIndex + 1)}`;

const monthKeyOf = date => monthKey(date.getUTCFullYear(), date.getUTCMonth());

/** ISO first-of-month value understood by the dashboard month filter. */
const monthIso = (year, monthIndex) =>
  new Date(Date.UTC(year, monthIndex, 1)).toISOString();

/**
 * Fold one category's transactions into calendar-month buckets.
 * @param {Array} transactions - Transactions to read (account filtering is the caller's job)
 * @param {string} category - Category name
 * @param {Object} options - { endDate, months, type }
 * @returns {Object} Monthly history for the category
 */
export const buildCategoryHistory = (transactions, category, options = {}) => {
  const {
    endDate = new Date(),
    months = MAX_HISTORY_MONTHS,
    type = TRANSACTION_TYPES.EXPENSE,
  } = options;
  const isIncome = type === TRANSACTION_TYPES.INCOME;
  const totals = new Map(); // 'YYYY-MM' -> { amount, count }

  for (const transaction of Array.isArray(transactions) ? transactions : []) {
    if (!transaction || transaction.isGhost) continue;
    if ((transaction.category || 'Uncategorized') !== category) continue;

    const isIncluded = isIncome
      ? transaction.type === TRANSACTION_TYPES.INCOME
      : transaction.type === TRANSACTION_TYPES.EXPENSE ||
        transaction.type === TRANSACTION_TYPES.REFUND;
    if (!isIncluded) continue;

    const date = new Date(transaction.timestamp || transaction.date);
    if (Number.isNaN(date.getTime())) continue;

    const key = monthKeyOf(date);
    const entry = totals.get(key) || { amount: 0, count: 0 };
    const amount = Math.abs(Number(transaction.amount) || 0);
    entry.amount +=
      transaction.type === TRANSACTION_TYPES.REFUND ? -amount : amount;
    entry.count += 1;
    totals.set(key, entry);
  }

  // Anchor the window on the month being viewed (the Spent-card arrows and a
  // Reports drill can both point at an older month), defaulting to this month.
  const parsedEnd = endDate instanceof Date ? endDate : new Date(endDate);
  const anchor = Number.isNaN(parsedEnd.getTime()) ? new Date() : parsedEnd;
  const anchorYear = anchor.getUTCFullYear();
  const anchorMonth = anchor.getUTCMonth();

  const buckets = [];
  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(anchorYear, anchorMonth - offset, 1));
    const year = date.getUTCFullYear();
    const monthIndex = date.getUTCMonth();
    const key = monthKey(year, monthIndex);
    const entry = totals.get(key);
    buckets.push({
      key,
      year,
      monthIndex,
      label: `${MONTH_LABELS[monthIndex]} ${year}`,
      shortLabel: MONTH_LABELS[monthIndex].slice(0, 3),
      iso: monthIso(year, monthIndex),
      amount: entry ? entry.amount : 0,
      count: entry ? entry.count : 0,
    });
  }

  // Drop leading months the user had no activity in, so a three-month-old
  // account shows three bars instead of nine empty ones. Gaps *inside* the
  // range stay, because a month you skipped is the interesting part.
  const firstWithData = buckets.findIndex(bucket => bucket.count > 0);
  const visible = firstWithData > 0 ? buckets.slice(firstWithData) : buckets;

  const monthsWithData = visible.filter(bucket => bucket.count > 0).length;
  const total = visible.reduce((sum, bucket) => sum + bucket.amount, 0);
  const maxAmount = visible.reduce(
    (max, bucket) => Math.max(max, Math.max(0, bucket.amount)),
    0
  );

  return {
    category,
    type,
    months: visible,
    monthsWithData,
    total,
    average: monthsWithData > 0 ? total / monthsWithData : 0,
    maxAmount,
  };
};

/**
 * Create the category history strip.
 * @param {Object} options - Component options
 * @param {string} options.category - Category the dashboard is filtered by
 * @param {Array} options.transactions - Candidate transactions (already account-filtered)
 * @param {string} [options.type] - 'expense' (default) or 'income'
 * @param {Date|string} [options.endDate] - Month the window ends on
 * @param {string} [options.activeMonth] - Active month filter ('YYYY-MM' or ISO)
 * @param {Function} [options.onMonthSelect] - Called with an ISO first-of-month value
 * @returns {HTMLElement|null} Card element, or null when there is no history
 */
export const CategoryHistoryCard = ({
  category,
  transactions = [],
  type = TRANSACTION_TYPES.EXPENSE,
  endDate,
  activeMonth = null,
  onMonthSelect = null,
} = {}) => {
  if (!category) return null;

  const history = buildCategoryHistory(transactions, category, {
    endDate,
    type,
  });
  if (history.monthsWithData === 0) return null;

  const isInteractive = typeof onMonthSelect === 'function';
  const activeKey = activeMonth ? String(activeMonth).slice(0, 7) : null;
  const isIncome = type === TRANSACTION_TYPES.INCOME;
  const monthCount = history.months.length;

  const card = document.createElement('section');
  card.className = 'card category-history-card';
  card.dataset.category = category;
  card.setAttribute('aria-label', `${category} history`);

  const header = document.createElement('div');
  header.className = 'category-history-header';

  const title = document.createElement('h3');
  title.className = 'category-history-title';
  title.textContent = category;
  header.appendChild(title);

  const subtitle = document.createElement('p');
  subtitle.className = 'category-history-subtitle';
  subtitle.textContent = [
    monthCount === 1 ? '1 month' : `Last ${monthCount} months`,
    `${formatCurrency(history.total)} ${isIncome ? 'earned' : 'spent'}`,
    `${formatCurrency(history.average)} avg/month`,
  ].join(' · ');
  header.appendChild(subtitle);

  card.appendChild(header);

  const bars = document.createElement('div');
  bars.className = 'category-history-bars';
  bars.setAttribute('role', 'group');
  bars.setAttribute(
    'aria-label',
    `${isIncome ? 'Income' : 'Spending'} by month for ${category}`
  );

  history.months.forEach(bucket => {
    const isActive = activeKey === bucket.key;
    const amountText =
      bucket.count === 0
        ? 'no activity'
        : `${formatCurrency(bucket.amount)} from ${bucket.count} transaction${
            bucket.count > 1 ? 's' : ''
          }`;

    const bar = document.createElement('button');
    bar.type = 'button';
    bar.className = 'category-history-bar';
    bar.dataset.month = bucket.key;
    // Share of the tallest month; empty months keep the track visible instead.
    const ratio =
      history.maxAmount > 0
        ? Math.max(0, bucket.amount) / history.maxAmount
        : 0;
    bar.style.setProperty('--bar-height', `${(ratio * 100).toFixed(1)}%`);

    if (bucket.count === 0) bar.classList.add('is-empty');
    if (bucket.amount < 0) bar.classList.add('is-negative');
    if (isActive) bar.classList.add('is-active');

    bar.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    bar.setAttribute('aria-label', `${bucket.label}: ${amountText}`);
    bar.title = `${bucket.label}: ${amountText}`;

    if (isInteractive) {
      bar.addEventListener('click', () => onMonthSelect(bucket.iso));
    } else {
      bar.disabled = true;
    }

    const track = document.createElement('span');
    track.className = 'category-history-bar-track';

    const fill = document.createElement('span');
    fill.className = 'category-history-bar-fill';
    track.appendChild(fill);
    bar.appendChild(track);

    const label = document.createElement('span');
    label.className = 'category-history-bar-label';

    const monthLabel = document.createElement('span');
    monthLabel.className = 'category-history-bar-month';
    monthLabel.textContent = bucket.shortLabel;
    label.appendChild(monthLabel);

    // Stamp the year on the first bar and on every January so the strip stays
    // readable across a year boundary without repeating "2026" twelve times.
    // Phones drop the year suffix; the aria-label keeps the full date.
    const showYear = bucket.monthIndex === 0 || bucket === history.months[0];
    if (showYear) {
      const yearLabel = document.createElement('span');
      yearLabel.className = 'category-history-bar-year';
      yearLabel.textContent = ` ’${String(bucket.year).slice(2)}`;
      label.appendChild(yearLabel);
    }

    bar.appendChild(label);

    bars.appendChild(bar);
  });

  card.appendChild(bars);

  if (isInteractive && monthCount > 1) {
    const hint = document.createElement('p');
    hint.className = 'category-history-hint';
    hint.textContent = 'Tap a month to filter the list below';
    card.appendChild(hint);
  }

  return card;
};
