/**
 * TrendService
 * Consolidated service for trend detection, consistency analysis, and personal inflation
 * Merges: trend-analysis-service.js + personal-inflation-service.js
 */

import { TRANSACTION_TYPES } from '../../utils/constants.js';

const STORAGE_KEY = 'blinkbudget_trend_data';

// Month names for seasonal pattern detection
const MONTHS = [
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

export class TrendService {
  constructor() {
    this._loadPersistedData();
  }

  _loadPersistedData() {
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        const data = localStorage.getItem(STORAGE_KEY);
        this.persistedData = data
          ? JSON.parse(data)
          : { lastAnalysisDate: null };
      } else {
        this.persistedData = { lastAnalysisDate: null };
      }
    } catch {
      this.persistedData = { lastAnalysisDate: null };
    }
  }

  _persistData() {
    try {
      this.persistedData.lastAnalysisDate = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.persistedData));
    } catch (error) {
      console.warn('[TrendService] Failed to persist data:', error);
    }
  }

  // ========== Trend Analysis Methods ==========

  /**
   * Get trend analysis for categories
   * @param {string|null} categoryId - Optional category filter
   * @param {Array} transactions - All transaction data
   * @returns {Object} Trend analysis results
   */
  getTrendAnalysis(categoryId, transactions) {
    const monthlyData = this._aggregateMonthlyData(transactions, categoryId);

    if (monthlyData.length < 2) {
      return {
        trends: [],
        message: 'Not enough data for trend analysis',
        enoughData: false,
      };
    }

    const trends = [];

    const overallTrend = this._calculateTrend(monthlyData.map(m => m.total));
    trends.push({
      category: categoryId || 'Overall',
      direction: overallTrend.direction,
      changePercent: overallTrend.changePercent,
      monthlyAverage: overallTrend.average,
      description: this._getTrendDescription(overallTrend),
    });

    if (!categoryId) {
      const categoryTrends = this._analyzeCategoryTrends(transactions);
      trends.push(...categoryTrends);
    }

    this._persistData();
    return { trends, enoughData: true };
  }

  /**
   * Calculate consistency scores for spending
   * @returns {Object} Consistency scores (0-1 scale)
   */
  getConsistencyScores(transactions) {
    const categoryConsistency = {};

    const categoryMap = {};
    transactions.forEach(t => {
      const cat = t.category || 'Uncategorized';
      if (!categoryMap[cat]) categoryMap[cat] = [];
      categoryMap[cat].push(Math.abs(t.amount || 0));
    });

    Object.entries(categoryMap).forEach(([category, amounts]) => {
      if (amounts.length < 2) {
        categoryConsistency[category] = null;
        return;
      }

      const mean = amounts.reduce((s, v) => s + v, 0) / amounts.length;
      if (mean === 0) {
        categoryConsistency[category] = null;
        return;
      }

      const variance =
        amounts.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / amounts.length;
      const stdDev = Math.sqrt(variance);
      const cv = stdDev / mean;

      categoryConsistency[category] = Math.max(0, Math.min(1, 1 - cv));
    });

    const validConsistencies = Object.values(categoryConsistency).filter(
      v => v !== null
    );
    const overallConsistency =
      validConsistencies.length > 0
        ? validConsistencies.reduce((s, v) => s + v, 0) /
          validConsistencies.length
        : 1.0;

    return { categories: categoryConsistency, overall: overallConsistency };
  }

  /**
   * Detect seasonal patterns in spending
   * @param {string} categoryId - Category to analyze
   * @returns {Object} Seasonal pattern data
   */
  detectSeasonalPatterns(categoryId, transactions) {
    const monthTotals = Array(12).fill(0);
    const monthCounts = Array(12).fill(0);

    transactions.forEach(t => {
      if (t.type !== TRANSACTION_TYPES.EXPENSE) return;
      if (categoryId && t.category !== categoryId) return;

      const d = new Date(t.date || t.timestamp);
      if (isNaN(d.getTime())) return;
      const month = d.getMonth();
      if (month < 0 || month > 11) return;
      monthTotals[month] += Math.abs(t.amount || 0);
      monthCounts[month]++;
    });

    const averages = monthTotals.map((total, i) =>
      monthCounts[i] > 0 ? total / monthCounts[i] : 0
    );

    const positiveAverages = averages.filter(a => a > 0);
    const overallAvg =
      positiveAverages.length > 0
        ? positiveAverages.reduce((s, v) => s + v, 0) / positiveAverages.length
        : 0;

    const peaks = [];
    averages.forEach((avg, i) => {
      if (overallAvg > 0 && avg > overallAvg * 1.3) {
        peaks.push({
          month: MONTHS[i],
          average: avg,
          percentAboveAvg: (avg / overallAvg - 1) * 100,
        });
      }
    });

    return {
      monthlyAverages: MONTHS.map((m, i) => ({
        month: m,
        average: averages[i],
      })),
      overallAverage: overallAvg,
      peaks,
      hasSeasonality: peaks.length > 0,
    };
  }

  /**
   * Determine spending direction for a category
   * @param {string} categoryId - Category to analyze
   * @returns {Object} Spending direction data
   */
  getSpendingDirection(categoryId, transactions, referenceDate = new Date()) {
    const recentMonths = this._getRecentMonthsData(
      categoryId,
      transactions,
      3,
      referenceDate
    );
    const previousMonths = this._getPreviousMonthsData(
      categoryId,
      transactions,
      3,
      referenceDate
    );

    const recentAvg =
      recentMonths.length > 0
        ? recentMonths.reduce((s, v) => s + v, 0) / recentMonths.length
        : 0;
    const previousAvg =
      previousMonths.length > 0
        ? previousMonths.reduce((s, v) => s + v, 0) / previousMonths.length
        : 0;

    let direction = 'stable';
    let changePercent = 0;

    if (previousAvg > 0) {
      changePercent = ((recentAvg - previousAvg) / previousAvg) * 100;
      if (changePercent > 15) direction = 'increasing';
      else if (changePercent < -15) direction = 'decreasing';
    }

    return {
      direction,
      changePercent,
      recentAverage: recentAvg,
      previousAverage: previousAvg,
      message: this._getDirectionMessage(direction, changePercent),
    };
  }

  // ========== Personal Inflation Methods ==========

  /**
   * Calculate personal inflation rate for a specific category
   * @param {Array} transactions - All transactions
   * @param {string} category - Category to analyze
   * @param {number} monthsBack - Number of months to look back (default: 12)
   * @param {string} method - Calculation method: 'average' or 'median' (default: 'average')
   * @returns {number} Personal inflation rate as decimal (0.15 = 15%)
   */
  calculateCategoryInflation(
    transactions,
    category,
    monthsBack = 12,
    method = 'average',
    referenceDate = new Date()
  ) {
    const categoryTransactions = transactions
      .filter(
        t =>
          t.category === category &&
          !t.isGhost &&
          t.type === TRANSACTION_TYPES.EXPENSE
      )
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    if (categoryTransactions.length < 2) return 0;

    const cutoff = new Date(referenceDate);
    cutoff.setMonth(cutoff.getMonth() - monthsBack);
    cutoff.setDate(1);
    cutoff.setHours(0, 0, 0, 0);

    const endWindow = new Date(referenceDate);

    const monthlyGroups = {};
    categoryTransactions
      .filter(t => {
        const d = new Date(t.timestamp);
        return d >= cutoff && d <= endWindow;
      })
      .forEach(t => {
        const d = new Date(t.timestamp);
        const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyGroups[month]) monthlyGroups[month] = [];
        if (!isNaN(t.amount)) {
          monthlyGroups[month].push(t.amount);
        }
      });

    const months = Object.keys(monthlyGroups).sort();
    if (months.length < 2) return 0;

    const oldestMonth = months[0];
    const newestMonth = months[months.length - 1];

    let oldVal, recentVal;

    if (method === 'median') {
      const getMedian = arr => {
        const validAmounts = arr.filter(a => !isNaN(a));
        const sorted = [...validAmounts].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length === 0
          ? 0
          : sorted.length % 2 !== 0
            ? sorted[mid]
            : (sorted[mid - 1] + sorted[mid]) / 2;
      };
      oldVal = getMedian(monthlyGroups[oldestMonth]);
      recentVal = getMedian(monthlyGroups[newestMonth]);
    } else {
      const getAvg = arr => {
        const validAmounts = arr.filter(a => !isNaN(a));
        return validAmounts.length === 0
          ? 0
          : validAmounts.reduce((sum, a) => sum + a, 0) / validAmounts.length;
      };
      oldVal = getAvg(monthlyGroups[oldestMonth]);
      recentVal = getAvg(monthlyGroups[newestMonth]);
    }

    if (oldVal === 0) return 0;
    return (recentVal - oldVal) / oldVal;
  }

  /**
   * Get monthly average spending for a category
   * @param {Array} transactions - Category transactions
   * @param {number} monthsBack - Number of months to analyze
   * @param {Date} referenceDate - Reference date (default: now)
   * @returns {Array} Array of monthly averages (most recent first)
   */
  getMonthlyAverages(transactions, monthsBack, referenceDate = null) {
    const effectiveReferenceDate = referenceDate
      ? new Date(referenceDate)
      : transactions && transactions.length
        ? (() => {
            const maxTimestamp = transactions.reduce((max, t) => {
              const ts = new Date(t.timestamp).getTime();
              return Number.isFinite(ts) && ts > max ? ts : max;
            }, -Infinity);
            return maxTimestamp > -Infinity
              ? new Date(maxTimestamp)
              : new Date();
          })()
        : new Date();

    const monthly = {};
    const cutoff = new Date(effectiveReferenceDate);
    cutoff.setMonth(cutoff.getMonth() - monthsBack);
    cutoff.setDate(1);

    const endWindow = new Date(effectiveReferenceDate);

    transactions
      .filter(t => {
        const d = new Date(t.timestamp);
        return d >= cutoff && d <= endWindow;
      })
      .forEach(t => {
        const d = new Date(t.timestamp);
        const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (Number.isFinite(t.amount)) {
          monthly[month] = (monthly[month] || []).concat(Number(t.amount));
        }
      });

    return Object.entries(monthly)
      .map(([month, amounts]) => ({
        month,
        average: amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length,
      }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .map(item => item.average);
  }

  /**
   * Get top categories by personal inflation impact
   * @param {Array} transactions - All transactions
   * @param {number} count - Number of top categories to return (default: 9)
   * @param {number} monthsBack - Number of months to analyze (default: 12)
   * @param {string} method - Calculation method (default: 'average')
   * @returns {Array} Top categories with inflation data
   */
  getTopInflationCategories(
    transactions,
    count = 9,
    monthsBack = 12,
    method = 'average',
    referenceDate = new Date()
  ) {
    const categories = [
      ...new Set(
        transactions
          .filter(t => t.type === TRANSACTION_TYPES.EXPENSE)
          .map(t => t.category)
      ),
    ];

    const cutoff = new Date(referenceDate);
    cutoff.setMonth(cutoff.getMonth() - monthsBack);
    cutoff.setDate(1);
    cutoff.setHours(0, 0, 0, 0);

    const endWindow = new Date(referenceDate);

    const categoryInflation = categories.map(category => {
      const validation = this.validateCategoryData(
        transactions,
        category,
        monthsBack,
        referenceDate
      );
      const inflationRate = validation.hasData
        ? this.calculateCategoryInflation(
            transactions,
            category,
            monthsBack,
            method,
            referenceDate
          )
        : 0;
      const trend = this.getTrendDirection(inflationRate);

      const categoryTransactions = transactions.filter(t => {
        const d = new Date(t.timestamp);
        return (
          t.category === category &&
          !t.isGhost &&
          t.type === TRANSACTION_TYPES.EXPENSE &&
          d >= cutoff &&
          d <= endWindow
        );
      });

      return {
        category,
        inflationRate,
        totalSpending: categoryTransactions.reduce((sum, t) => {
          const amount = Number(t.amount) || 0;
          return isNaN(amount) ? sum : sum + amount;
        }, 0),
        trend,
      };
    });

    return categoryInflation
      .filter(c => c.inflationRate !== 0 && !isNaN(c.inflationRate))
      .sort((a, b) => Math.abs(b.inflationRate) - Math.abs(a.inflationRate))
      .slice(0, count);
  }

  /**
   * Get trend direction for visual indicators
   * @param {number} inflationRate - Inflation rate as decimal
   * @returns {string} Trend direction: 'up', 'down', or 'stable'
   */
  getTrendDirection(inflationRate) {
    if (inflationRate > 0.05) return 'up';
    if (inflationRate < -0.05) return 'down';
    return 'stable';
  }

  /**
   * Get monthly spending data for chart visualization
   * @param {Array} transactions - All transactions
   * @param {string} category - Category to analyze
   * @param {number} monthsBack - Number of months to analyze
   * @param {Date} referenceDate - Reference date (default: now)
   * @returns {Array} Monthly spending data
   */
  getMonthlySpendingData(
    transactions,
    category,
    monthsBack,
    referenceDate = new Date()
  ) {
    const cutoff = new Date(referenceDate);
    cutoff.setMonth(cutoff.getMonth() - (monthsBack - 1));
    cutoff.setDate(1);

    const endWindow = new Date(referenceDate);

    const monthlySpending = {};

    transactions
      .filter(t => {
        const d = new Date(t.timestamp);
        return (
          t.category === category &&
          t.type === TRANSACTION_TYPES.EXPENSE &&
          d >= cutoff &&
          d <= endWindow
        );
      })
      .forEach(t => {
        const d = new Date(t.timestamp);
        const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlySpending[month]) monthlySpending[month] = 0;
        if (!isNaN(t.amount)) {
          monthlySpending[month] += t.amount;
        }
      });

    return Object.entries(monthlySpending)
      .map(([month, amount]) => ({
        month,
        amount,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Validate if there's enough data for meaningful inflation analysis
   * @param {Array} transactions - All transactions
   * @param {string} category - Category to check
   * @param {number} monthsBack - Number of months to check
   * @returns {Object} Validation result with hasData and reason
   */
  validateCategoryData(
    transactions,
    category,
    monthsBack = 12,
    referenceDate = new Date()
  ) {
    const categoryTransactions = transactions.filter(
      t =>
        t.category === category &&
        !t.isGhost &&
        t.type === TRANSACTION_TYPES.EXPENSE
    );

    if (categoryTransactions.length < 2) {
      return {
        hasData: false,
        reason: 'Not enough transactions in this category',
      };
    }

    const cutoff = new Date(referenceDate);
    cutoff.setMonth(cutoff.getMonth() - monthsBack);

    const recentTransactions = categoryTransactions.filter(
      t => new Date(t.timestamp) >= cutoff
    );

    if (recentTransactions.length < 2) {
      const periodLabel = monthsBack === 1 ? 'month' : 'months';
      return {
        hasData: false,
        reason: `Not enough transactions in the last ${monthsBack} ${periodLabel}`,
      };
    }

    const monthlyData = this.getMonthlyAverages(
      categoryTransactions,
      monthsBack,
      referenceDate
    );
    if (monthlyData.length < 2) {
      return {
        hasData: false,
        reason: 'Need spending in multiple months',
      };
    }

    return { hasData: true };
  }

  // ========== Helper Methods ==========

  _aggregateMonthlyData(transactions, categoryId) {
    const monthlyTotals = {};

    transactions.forEach(t => {
      if (t.type !== TRANSACTION_TYPES.EXPENSE) return;
      if (categoryId && t.category !== categoryId) return;

      const date = new Date(t.date || t.timestamp);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;

      if (!monthlyTotals[monthKey]) {
        monthlyTotals[monthKey] = { month: monthKey, total: 0, count: 0 };
      }
      monthlyTotals[monthKey].total += Math.abs(t.amount || 0);
      monthlyTotals[monthKey].count += 1;
    });

    return Object.values(monthlyTotals).sort((a, b) =>
      a.month.localeCompare(b.month)
    );
  }

  _calculateTrend(values) {
    if (values.length < 2)
      return { direction: 'stable', changePercent: 0, average: values[0] || 0 };

    const first = values[0];
    const last = values[values.length - 1];
    const average = values.reduce((s, v) => s + v, 0) / values.length;

    const changePercent = first > 0 ? ((last - first) / first) * 100 : 0;
    let direction = 'stable';

    if (changePercent > 10) direction = 'increasing';
    else if (changePercent < -10) direction = 'decreasing';

    return { direction, changePercent, average };
  }

  _getTrendDescription(trend) {
    if (trend.direction === 'increasing') {
      return `Spending increased by ${Math.abs(trend.changePercent).toFixed(1)}% over the period`;
    } else if (trend.direction === 'decreasing') {
      return `Spending decreased by ${Math.abs(trend.changePercent).toFixed(1)}% over the period`;
    }
    return 'Spending has remained stable';
  }

  _analyzeCategoryTrends(transactions) {
    const categoryMap = {};

    transactions.forEach(t => {
      if (t.type !== TRANSACTION_TYPES.EXPENSE) return;
      const cat = t.category || 'Uncategorized';
      if (!categoryMap[cat]) categoryMap[cat] = [];
      categoryMap[cat].push({
        amount: Math.abs(t.amount || 0),
        date: new Date(t.date || t.timestamp),
      });
    });

    const trends = [];
    Object.entries(categoryMap).forEach(([category, data]) => {
      if (data.length < 3) return;

      const monthlyData = this._aggregateMonthlyData(transactions, category);
      if (monthlyData.length < 2) return;

      const trend = this._calculateTrend(monthlyData.map(m => m.total));
      trends.push({
        category,
        direction: trend.direction,
        changePercent: trend.changePercent,
        monthlyAverage: trend.average,
        description: this._getTrendDescription(trend),
      });
    });

    return trends;
  }

  _getRecentMonthsData(
    categoryId,
    transactions,
    count,
    referenceDate = new Date()
  ) {
    const now = referenceDate;
    const months = [];

    for (let i = 0; i < count; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth() });
    }

    return this._getMonthlyTotalsForPeriods(categoryId, transactions, months);
  }

  _getPreviousMonthsData(
    categoryId,
    transactions,
    count,
    referenceDate = new Date()
  ) {
    const now = referenceDate;
    const months = [];

    for (let i = count; i < count * 2; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth() });
    }

    return this._getMonthlyTotalsForPeriods(categoryId, transactions, months);
  }

  _getMonthlyTotalsForPeriods(categoryId, transactions, periods) {
    const totals = [];

    periods.forEach(p => {
      let total = 0;
      transactions.forEach(t => {
        if (t.type !== TRANSACTION_TYPES.EXPENSE) return;
        if (categoryId && t.category !== categoryId) return;

        const d = new Date(t.date || t.timestamp);
        if (d.getFullYear() === p.year && d.getMonth() === p.month) {
          total += Math.abs(t.amount || 0);
        }
      });
      totals.push(total);
    });

    return totals;
  }

  _getDirectionMessage(direction, changePercent) {
    if (direction === 'increasing') {
      return `Spending is increasing (+${Math.abs(changePercent).toFixed(1)}%)`;
    } else if (direction === 'decreasing') {
      return `Spending is decreasing (${changePercent.toFixed(1)}%)`;
    }
    return 'Spending is stable';
  }
}

export const trendService = new TrendService();
export default trendService;
