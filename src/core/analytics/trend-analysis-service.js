/**
 * TrendAnalysisService
 * Feature 3.3.2 - Historical pattern recognition
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

export class TrendAnalysisService {
  constructor() {
    this._loadPersistedData();
  }

  _loadPersistedData() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      this.persistedData = data ? JSON.parse(data) : { lastAnalysisDate: null };
    } catch {
      this.persistedData = { lastAnalysisDate: null };
    }
  }

  _persistData() {
    try {
      this.persistedData.lastAnalysisDate = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.persistedData));
    } catch (error) {
      console.warn('[TrendAnalysisService] Failed to persist data:', error);
    }
  }
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

      const monthlyData = this._aggregateMonthlyDataByCategory(
        transactions,
        category
      );
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

  _aggregateMonthlyDataByCategory(transactions, categoryId) {
    return this._aggregateMonthlyData(transactions, categoryId);
  }
  /**
   * Calculate consistency scores for spending
   * @returns {Object} Consistency scores (0-1 scale)
   */
  getConsistencyScores(transactions) {
    const categoryConsistency = {};

    const categoryMap = {};
    transactions.forEach(t => {
      if (t.type !== TRANSACTION_TYPES.EXPENSE) return;
      const cat = t.category || 'Uncategorized';
      if (!categoryMap[cat]) categoryMap[cat] = [];
      categoryMap[cat].push(Math.abs(t.amount || 0));
    });

    Object.entries(categoryMap).forEach(([category, amounts]) => {
      if (amounts.length < 2) {
        categoryConsistency[category] = 1.0;
        return;
      }

      const mean = amounts.reduce((s, v) => s + v, 0) / amounts.length;
      if (mean === 0) {
        categoryConsistency[category] = 1.0;
        return;
      }

      const variance =
        amounts.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / amounts.length;
      const stdDev = Math.sqrt(variance);
      const cv = stdDev / mean;

      categoryConsistency[category] = Math.max(0, Math.min(1, 1 - cv));
    });

    const overallConsistency =
      Object.values(categoryConsistency).length > 0
        ? Object.values(categoryConsistency).reduce((s, v) => s + v, 0) /
          Object.values(categoryConsistency).length
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

      const month = new Date(t.date || t.timestamp).getMonth();
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
  getSpendingDirection(categoryId, transactions) {
    const recentMonths = this._getRecentMonthsData(categoryId, transactions, 3);
    const previousMonths = this._getPreviousMonthsData(
      categoryId,
      transactions,
      3
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

  _getRecentMonthsData(categoryId, transactions, count) {
    const now = new Date();
    const months = [];

    for (let i = 0; i < count; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth() });
    }

    return this._getMonthlyTotalsForPeriods(categoryId, transactions, months);
  }

  _getPreviousMonthsData(categoryId, transactions, count) {
    const now = new Date();
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

export const trendAnalysisService = new TrendAnalysisService();
