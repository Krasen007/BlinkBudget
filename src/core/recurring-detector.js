/**
 * RecurringDetector
 *
 * Lightweight detection of recurring expenses (subscriptions, rent, bills)
 * from per-category interval + amount consistency statistics:
 * - at least MIN_OCCURRENCES expenses in a category
 * - fixed-ish price (coefficient of variation ≤ MAX_AMOUNT_CV)
 * - steady cadence: median interval ≥ MIN_INTERVAL_DAYS and mean absolute
 *   deviation of intervals ≤ MAX_INTERVAL_CV × median
 *
 * Pure functions over the transactions passed in — no storage reads, no
 * side effects — so Forecasts can reuse it later without extra coupling.
 * Deliberately simple: category-level heuristics only (the data model has
 * no merchant field), guarding against anti-goal complexity creep.
 */

const MIN_OCCURRENCES = 4;
const MAX_AMOUNT_CV = 0.3;
const MIN_INTERVAL_DAYS = 5;
const MAX_INTERVAL_CV = 0.5;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Arithmetic mean of a numeric array
 * @param {number[]} values
 * @returns {number}
 */
function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Population standard deviation of a numeric array
 * @param {number[]} values
 * @returns {number}
 */
function stdev(values) {
  const avg = mean(values);
  const variance =
    values.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0) /
    values.length;
  return Math.sqrt(variance);
}

/**
 * Median of a numeric array (average of the two middle values when even)
 * @param {number[]} values
 * @returns {number}
 */
function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export class RecurringDetector {
  /**
   * Detect recurring expenses per category.
   * @param {Array} transactions - Raw transactions
   * @returns {Array<{ category: string, amount: number, intervalDays: number,
   *   occurrences: number, lastDate: Date, nextDate: Date }>} Sorted by the
   *   most imminent next expected charge first
   */
  static detectRecurring(transactions = []) {
    if (!Array.isArray(transactions) || transactions.length === 0) return [];

    // Group expense dates/amounts per category (ghosts, income, transfers
    // and non-positive amounts are noise for this heuristic)
    const byCategory = new Map();
    for (const tx of transactions) {
      if (tx.isGhost || tx.type !== 'expense') continue;
      const date = new Date(tx.date || tx.timestamp);
      if (isNaN(date.getTime())) continue;
      const amount =
        typeof tx.amount === 'number' ? tx.amount : Number(tx.amount) || 0;
      if (amount <= 0) continue;
      const category = tx.category || 'Uncategorized';
      const entries = byCategory.get(category) || [];
      entries.push({ date, amount });
      byCategory.set(category, entries);
    }

    const results = [];
    for (const [category, entries] of byCategory) {
      if (entries.length < MIN_OCCURRENCES) continue;

      // Fixed-ish price: variable categories (groceries, dining) fail here
      const amounts = entries.map(entry => entry.amount);
      const avgAmount = mean(amounts);
      if (avgAmount <= 0) continue;
      if (stdev(amounts) / avgAmount > MAX_AMOUNT_CV) continue;

      // Steady cadence: median interval + robust deviation (MAD / median)
      entries.sort((a, b) => a.date - b.date);
      const intervals = [];
      for (let i = 1; i < entries.length; i++) {
        intervals.push((entries[i].date - entries[i - 1].date) / MS_PER_DAY);
      }
      const intervalMedian = median(intervals);
      if (intervalMedian < MIN_INTERVAL_DAYS) continue;
      const mad = mean(
        intervals.map(value => Math.abs(value - intervalMedian))
      );
      if (mad / intervalMedian > MAX_INTERVAL_CV) continue;

      const lastDate = entries[entries.length - 1].date;
      results.push({
        category,
        amount: Math.round(avgAmount * 100) / 100,
        intervalDays: Math.round(intervalMedian),
        occurrences: entries.length,
        lastDate,
        nextDate: new Date(lastDate.getTime() + intervalMedian * MS_PER_DAY),
      });
    }

    results.sort((a, b) => a.nextDate - b.nextDate);
    return results;
  }
}
