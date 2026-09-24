/**
 * Recurring & Subscriptions Card
 * Extracted from InsightsSection.js to maintain file size constraints (<500 lines)
 *
 * Compact list of expenses detected as recurring by RecurringDetector
 * (consistent category amounts + intervals). Static — not scoped to the
 * shared month navigation, since subscriptions are evergreen.
 */

import { RecurringDetector } from '../../core/recurring-detector.js';
import { formatCurrency } from '../../utils/financial-planning-helpers.js';
import { CATEGORY_COLORS } from '../../utils/constants.js';

const MAX_ROWS = 8;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Human-readable cadence label for an interval in days
 * @param {number} days
 * @returns {string}
 */
function describeInterval(days) {
  if (days >= 26 && days <= 32) return 'monthly';
  if (days >= 12 && days <= 17) return 'every 2 weeks';
  if (days >= 5 && days <= 9) return 'weekly';
  if (days >= 85 && days <= 95) return 'quarterly';
  if (days >= 360 && days <= 370) return 'yearly';
  return `every ~${days} days`;
}

/**
 * Short "Oct 31" style date label
 * @param {Date} date
 * @returns {string}
 */
function formatShortDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Create the Recurring & Subscriptions card
 * @param {Object} planningData - Financial planning data (transactions)
 * @param {Date} [now] - Reference date for next/last labels (testability)
 * @returns {HTMLElement}
 */
export function createRecurringCard(planningData, now = new Date()) {
  const card = document.createElement('div');
  card.className = 'card insights-card insights-recurring';

  // Header
  const header = document.createElement('div');
  header.className = 'insights-card-header';

  const titleGroup = document.createElement('div');
  titleGroup.className = 'insights-card-title-group';

  const title = document.createElement('h3');
  title.className = 'insights-card-title';
  title.textContent = 'Recurring & Subscriptions';

  const subtitle = document.createElement('p');
  subtitle.className = 'insights-card-subtitle';
  subtitle.textContent =
    'Detected from consistent category patterns — future charges feed your forecasts';

  titleGroup.appendChild(title);
  titleGroup.appendChild(subtitle);
  header.appendChild(titleGroup);
  card.appendChild(header);

  const detected = RecurringDetector.detectRecurring(
    planningData?.transactions || []
  );

  // detectRecurring sorts by nextDate ascending, so items overdue by more
  // than one interval (likely cancelled subscriptions) would otherwise come
  // first and crowd active entries out at the MAX_ROWS limit. Keep eligible
  // upcoming items first (still most-imminent first), then the stale ones.
  const nowMs = now.getTime();
  const isStale = item =>
    item.nextDate.getTime() < nowMs - item.intervalDays * MS_PER_DAY;
  const recurring = [
    ...detected.filter(item => !isStale(item)),
    ...detected.filter(isStale),
  ].slice(0, MAX_ROWS);

  if (recurring.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'insights-empty-note';
    empty.textContent =
      'No recurring expenses detected yet — needs at least 4 consistent payments in a category.';
    card.appendChild(empty);
    return card;
  }

  const list = document.createElement('div');
  list.className = 'insights-recurring-list';

  for (const item of recurring) {
    const row = document.createElement('div');
    row.className = 'recurring-row';

    const dot = document.createElement('span');
    dot.className = 'recurring-dot';
    dot.setAttribute('aria-hidden', 'true');
    dot.style.backgroundColor =
      CATEGORY_COLORS[item.category] || 'var(--color-primary)';

    const info = document.createElement('div');
    info.className = 'recurring-info';

    const name = document.createElement('span');
    name.className = 'recurring-name';
    name.textContent = item.category;

    const meta = document.createElement('span');
    meta.className = 'recurring-meta';
    meta.textContent = `${describeInterval(item.intervalDays)} · ${item.occurrences} times`;

    info.appendChild(name);
    info.appendChild(meta);

    const right = document.createElement('div');
    right.className = 'recurring-right';

    const amount = document.createElement('span');
    amount.className = 'recurring-amount';
    amount.textContent = formatCurrency(item.amount);

    const next = document.createElement('span');
    next.className = 'recurring-next';
    const isUpcoming = item.nextDate.getTime() >= now.getTime();
    next.textContent = isUpcoming
      ? `Next ≈ ${formatShortDate(item.nextDate)}`
      : `Last: ${formatShortDate(item.lastDate)}`;

    right.appendChild(amount);
    right.appendChild(next);

    row.append(dot, info, right);
    list.appendChild(row);
  }

  card.appendChild(list);
  return card;
}
