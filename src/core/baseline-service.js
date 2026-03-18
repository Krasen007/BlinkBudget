/**
 * Baseline Service
 *
 * Calculates and analyzes floor vs average spending patterns to help users
 * understand their spending variability and make better budget decisions.
 */

import { TransactionService } from './transaction-service.js';

export const BaselineService = {
  /**
   * Calculate floor vs average baseline for a specific category or overall spending
   * @param {Object} options - Calculation options
   * @returns {Object} Baseline analysis results
   */
  calculateBaseline(options = {}) {
    const {
      category = null,
      period = 'monthly', // 'weekly', 'monthly', 'yearly'
      lookbackPeriods = 12, // Number of periods to analyze
      accountId = null,
    } = options;

    const transactions = TransactionService.getAll();

    // Filter transactions based on options
    let filteredTransactions = transactions;

    if (category) {
      filteredTransactions = filteredTransactions.filter(
        t => t.category === category
      );
    }

    if (accountId) {
      filteredTransactions = filteredTransactions.filter(
        t => t.accountId === accountId
      );
    }

    // Only include expenses for baseline calculations
    filteredTransactions = filteredTransactions.filter(
      t => t.type === 'expense'
    );

    if (filteredTransactions.length === 0) {
      return {
        period,
        category,
        average: 0,
        floor: 0,
        ceiling: 0,
        variability: 0,
        consistency: 'no_data',
        periods: [],
        insights: [],
      };
    }

    // Group transactions by period
    const periodGroups = this._groupTransactionsByPeriod(
      filteredTransactions,
      period
    );

    // Find the boundary dates to anchor our lookback without skewing averages
    // for periods before the user started
    const maxTimestamp = filteredTransactions.reduce(
      (acc, t) => Math.max(acc, new Date(t.timestamp).getTime()),
      Number.NEGATIVE_INFINITY
    );
    const minTimestamp = filteredTransactions.reduce(
      (acc, t) => Math.min(acc, new Date(t.timestamp).getTime()),
      Number.POSITIVE_INFINITY
    );
    const maxDate = new Date(maxTimestamp);
    const minDate = new Date(minTimestamp);

    // Count theoretical periods from minDate to maxDate
    let actualPeriods = 1;
    if (period === 'weekly') {
      actualPeriods =
        Math.floor((maxDate - minDate) / (1000 * 60 * 60 * 24 * 7)) + 1;
    } else if (period === 'monthly') {
      actualPeriods =
        (maxDate.getFullYear() - minDate.getFullYear()) * 12 +
        maxDate.getMonth() -
        minDate.getMonth() +
        1;
    } else if (period === 'yearly') {
      actualPeriods = maxDate.getFullYear() - minDate.getFullYear() + 1;
    }

    // Limit to lookbackPeriods
    const periodsToGenerate = Math.min(actualPeriods, lookbackPeriods);

    // Generate a continuous sequence of keys ending at the latest transaction
    const periodKeys = this._generatePeriodKeys(
      period,
      periodsToGenerate,
      maxDate
    );

    // Calculate period totals, ensuring empty periods have $0 totals
    const recentPeriods = periodKeys.map(periodKey => {
      const txs = periodGroups[periodKey] || [];
      return {
        period: periodKey,
        total: txs.reduce((sum, t) => sum + t.amount, 0),
        count: txs.length,
        transactions: txs,
      };
    });

    if (recentPeriods.length === 0) {
      return {
        period,
        category,
        average: 0,
        floor: 0,
        ceiling: 0,
        variability: 0,
        consistency: 'no_data',
        periods: [],
        insights: [],
      };
    }

    // Calculate baseline metrics
    const totals = recentPeriods.map(p => p.total);
    const average =
      totals.reduce((sum, total) => sum + total, 0) / totals.length;
    const floor = Math.min(...totals);
    const ceiling = Math.max(...totals);

    // Calculate variability (coefficient of variation)
    const variance =
      totals.reduce((sum, total) => sum + Math.pow(total - average, 2), 0) /
      totals.length;
    const standardDeviation = Math.sqrt(variance);
    const variability = average > 0 ? (standardDeviation / average) * 100 : 0;

    // Determine consistency level
    let consistency;
    if (variability < 15) {
      consistency = 'very_consistent';
    } else if (variability < 25) {
      consistency = 'consistent';
    } else if (variability < 40) {
      consistency = 'variable';
    } else {
      consistency = 'very_variable';
    }

    // Generate insights
    const insights = this._generateInsights({
      average,
      floor,
      ceiling,
      variability,
      consistency,
      periodTotals: recentPeriods,
      category,
      period,
    });

    return {
      period,
      category,
      accountId,
      average: Math.round(average * 100) / 100,
      floor: Math.round(floor * 100) / 100,
      ceiling: Math.round(ceiling * 100) / 100,
      variability: Math.round(variability * 10) / 10,
      consistency,
      periods: recentPeriods,
      insights,
      dataPoints: recentPeriods.length,
    };
  },

  /**
   * Group transactions by time period
   * @private
   */
  _groupTransactionsByPeriod(transactions, periodType) {
    const groups = {};

    transactions.forEach(transaction => {
      const date = new Date(transaction.timestamp);
      let periodKey;

      switch (periodType) {
        case 'weekly': {
          // Get week number and year
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          periodKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
          break;
        }
        case 'monthly':
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'yearly':
          periodKey = date.getFullYear().toString();
          break;
        default:
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!groups[periodKey]) {
        groups[periodKey] = [];
      }
      groups[periodKey].push(transaction);
    });

    return groups;
  },

  /**
   * Generates a sequence of period keys ending at the reference date
   * @private
   */
  _generatePeriodKeys(periodType, count, referenceDate) {
    const keys = [];
    const end = new Date(referenceDate);

    for (let i = count - 1; i >= 0; i--) {
      if (periodType === 'weekly') {
        const d = new Date(end);
        d.setDate(d.getDate() - d.getDay() - i * 7);
        keys.push(
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        );
      } else if (periodType === 'monthly') {
        const d = new Date(end.getFullYear(), end.getMonth() - i, 1);
        keys.push(
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        );
      } else if (periodType === 'yearly') {
        const d = new Date(end.getFullYear() - i, 0, 1);
        keys.push(d.getFullYear().toString());
      }
    }
    return keys;
  },

  /**
   * Generate insights based on baseline analysis
   * @private
   */
  _generateInsights(data) {
    const { average, floor, variability, category, periodTotals } = data;
    const insights = [];

    // Floor vs Average insight
    const floorToAverageRatio = average > 0 ? (floor / average) * 100 : 0;
    if (floorToAverageRatio < 60) {
      insights.push({
        type: 'opportunity',
        title: 'Low Spending Opportunity',
        description: `Your minimum spending is ${Math.round(100 - floorToAverageRatio)}% lower than your average. Consider this for conservative budgeting.`,
        priority: 'medium',
      });
    } else if (floorToAverageRatio > 90) {
      insights.push({
        type: 'warning',
        title: 'Consistent Spending Pattern',
        description:
          'Your spending is very consistent with minimal variation. This indicates fixed expenses dominate your budget.',
        priority: 'low',
      });
    }

    // Variability insight
    if (variability > 40) {
      insights.push({
        type: 'warning',
        title: 'High Spending Variability',
        description: `Your spending varies by ${Math.round(variability)}% from period to period. Consider building a larger emergency fund.`,
        priority: 'high',
      });
    } else if (variability < 10) {
      insights.push({
        type: 'positive',
        title: 'Very Predictable Spending',
        description:
          'Your spending is highly predictable, making budget planning much easier.',
        priority: 'low',
      });
    }

    // Trend insight
    if (periodTotals.length >= 3) {
      const recentHalf = periodTotals.slice(
        -Math.ceil(periodTotals.length / 2)
      );
      const olderHalf = periodTotals.slice(
        0,
        Math.floor(periodTotals.length / 2)
      );

      const recentAvg =
        recentHalf.reduce((sum, p) => sum + p.total, 0) / recentHalf.length;
      const olderAvg =
        olderHalf.reduce((sum, p) => sum + p.total, 0) / olderHalf.length;

      let trend = 0;
      if (olderAvg !== 0) {
        trend = ((recentAvg - olderAvg) / olderAvg) * 100;
      }

      if (trend > 10) {
        insights.push({
          type: 'warning',
          title: 'Increasing Spending Trend',
          description: `Your spending has increased by ${Math.round(trend)}% recently. Review your budget allocations.`,
          priority: 'medium',
        });
      } else if (trend < -10) {
        insights.push({
          type: 'positive',
          title: 'Decreasing Spending Trend',
          description: `Great job! Your spending has decreased by ${Math.round(Math.abs(trend))}% recently.`,
          priority: 'low',
        });
      }
    }

    // Category-specific insight
    if (category) {
      insights.push({
        type: 'info',
        title: `${category} Analysis`,
        description: `Your average ${category} spending is $${average.toFixed(2)} per ${data.period || 'month'}, with a minimum of $${floor.toFixed(2)}.`,
        priority: 'low',
      });
    }

    return insights;
  },

  /**
   * Get baseline comparison across all categories
   * @returns {Array} Array of baseline data for each category
   */
  getAllCategoryBaselines(options = {}) {
    const transactions = TransactionService.getAll();
    const expenseTransactions = transactions.filter(t => t.type === 'expense');

    // Get all unique categories
    const categories = [...new Set(expenseTransactions.map(t => t.category))];

    return categories
      .map(category => this.calculateBaseline({ ...options, category }))
      .filter(baseline => baseline.dataPoints > 0);
  },

  /**
   * Get overall spending baseline (all categories combined)
   * @returns {Object} Overall baseline analysis
   */
  getOverallBaseline(options = {}) {
    return this.calculateBaseline({ ...options, category: null });
  },

  /**
   * Compare user's spending to baseline
   * @param {string} category - Category to compare
   * @param {number} currentAmount - Current period spending
   * @param {Object} options - Baseline calculation options
   * @returns {Object} Comparison result
   */
  compareToBaseline(category, currentAmount, options = {}) {
    const baseline = this.calculateBaseline({ ...options, category });

    if (baseline.dataPoints === 0) {
      return {
        status: 'no_data',
        message: 'Insufficient data for comparison',
        baseline: null,
        currentAmount,
        difference: 0,
        percentageDifference: 0,
      };
    }

    const difference = currentAmount - baseline.average;
    const percentageDifference =
      baseline.average > 0 ? (difference / baseline.average) * 100 : 0;

    let status, message;
    if (currentAmount <= baseline.floor) {
      status = 'below_floor';
      message = 'Spending is at or below minimum level';
    } else if (currentAmount <= baseline.average) {
      status = 'below_average';
      message = 'Spending is below average';
    } else if (currentAmount <= baseline.ceiling) {
      status = 'above_average';
      message = 'Spending is above average';
    } else {
      status = 'above_ceiling';
      message = 'Spending is at maximum level';
    }

    return {
      status,
      message,
      baseline,
      currentAmount,
      difference: Math.round(difference * 100) / 100,
      percentageDifference: Math.round(percentageDifference * 10) / 10,
    };
  },
};
