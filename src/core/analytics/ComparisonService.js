/**
 * ComparisonService
 * Consolidated service for period comparisons and personal benchmarking
 * Merges: ComparisonService (recreated) + BudgetRecommendationService benchmarking
 */

// Trend thresholds for different comparison contexts
// Month-to-month comparisons use more sensitive threshold (5%) for detecting
// smaller changes in spending patterns between consecutive months
const TREND_THRESHOLD_MONTHLY = 5;

// Broader period comparisons use less sensitive threshold (10%) to avoid
// flagging normal seasonal variations as significant trends
const TREND_THRESHOLD_PERIOD = 10;

import { MetricsService } from './MetricsService.js';

export class ComparisonService {
  /**
   * Compare spending patterns between two periods
   * @param {Array} transactions - All transaction data
   * @param {Object} currentPeriod - Current time period
   * @param {Object} comparisonPeriod - Previous time period for comparison
   * @returns {Object} Comparison results
   */
  static comparePeriodsSpending(transactions, currentPeriod, comparisonPeriod) {
    const currentData = MetricsService.calculateIncomeVsExpenses(
      transactions,
      currentPeriod
    );
    const comparisonData = MetricsService.calculateIncomeVsExpenses(
      transactions,
      comparisonPeriod
    );

    const currentCategories = MetricsService.calculateCategoryBreakdown(
      transactions,
      currentPeriod
    );
    const comparisonCategories = MetricsService.calculateCategoryBreakdown(
      transactions,
      comparisonPeriod
    );

    // Calculate overall comparison
    const incomeChange = currentData.totalIncome - comparisonData.totalIncome;
    const incomeChangePercent =
      comparisonData.totalIncome > 0
        ? (incomeChange / comparisonData.totalIncome) * 100
        : 0;

    const expenseChange =
      currentData.totalExpenses - comparisonData.totalExpenses;
    const expenseChangePercent =
      comparisonData.totalExpenses > 0
        ? (expenseChange / comparisonData.totalExpenses) * 100
        : 0;

    const overallComparison = {
      income: {
        current: currentData.totalIncome,
        comparison: comparisonData.totalIncome,
        change: incomeChange,
        changePercent: incomeChangePercent,
      },
      expenses: {
        current: currentData.totalExpenses,
        comparison: comparisonData.totalExpenses,
        change: expenseChange,
        changePercent: expenseChangePercent,
      },
      netBalance: {
        current: currentData.netBalance,
        comparison: comparisonData.netBalance,
        change: currentData.netBalance - comparisonData.netBalance,
      },
    };

    // Calculate category comparison
    const categoryComparison = [];
    const currentCategoryMap = new Map();
    const comparisonCategoryMap = new Map();

    currentCategories.categories.forEach(cat =>
      currentCategoryMap.set(cat.name, cat)
    );
    comparisonCategories.categories.forEach(cat =>
      comparisonCategoryMap.set(cat.name, cat)
    );

    const allCategories = new Set([
      ...currentCategoryMap.keys(),
      ...comparisonCategoryMap.keys(),
    ]);

    allCategories.forEach(category => {
      const currentCat = currentCategoryMap.get(category);
      const comparisonCat = comparisonCategoryMap.get(category);

      const currentAmount = currentCat ? currentCat.amount : 0;
      const comparisonAmount = comparisonCat ? comparisonCat.amount : 0;

      const change = currentAmount - comparisonAmount;
      let changePercent;
      let trend = 'stable';

      if (comparisonAmount === 0 && currentAmount > 0) {
        changePercent = null;
        trend = 'new';
      } else if (currentAmount === 0 && comparisonAmount > 0) {
        changePercent = null;
        trend = 'removed';
      } else if (comparisonAmount > 0) {
        changePercent = (change / comparisonAmount) * 100;
        if (changePercent > TREND_THRESHOLD_PERIOD) trend = 'increasing';
        else if (changePercent < -TREND_THRESHOLD_PERIOD) trend = 'decreasing';
      } else {
        changePercent = 0;
      }

      categoryComparison.push({
        category,
        current: currentAmount,
        comparison: comparisonAmount,
        change,
        changePercent,
        trend,
      });
    });

    // Sort by absolute change
    categoryComparison.sort(
      (a, b) => Math.abs(b.change) - Math.abs(a.change)
    );

    // Analyze behavior changes
    const behaviorChanges = [];
    if (Math.abs(expenseChangePercent) > 15) {
      behaviorChanges.push({
        type: 'spending_change',
        message: `Spending ${expenseChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(expenseChangePercent).toFixed(1)}%`,
        severity: Math.abs(expenseChangePercent) > 25 ? 'high' : 'medium',
      });
    }

    if (Math.abs(incomeChangePercent) > 10) {
      behaviorChanges.push({
        type: 'income_change',
        message: `Income ${incomeChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(incomeChangePercent).toFixed(1)}%`,
        severity: Math.abs(incomeChangePercent) > 20 ? 'high' : 'medium',
      });
    }

    return {
      currentPeriod,
      comparisonPeriod,
      overallComparison,
      categoryComparison,
      behaviorChanges,
      insights: behaviorChanges,
      summary: {
        totalCategories: categoryComparison.length,
        increasedCategories: categoryComparison.filter(c => c.trend === 'increasing').length,
        decreasedCategories: categoryComparison.filter(c => c.trend === 'decreasing').length,
        stableCategories: categoryComparison.filter(c => c.trend === 'stable').length,
      },
    };
  }

  /**
   * Get personal benchmarking data - compare current period vs last month
   * Absorbed from BudgetRecommendationService
   * @param {Array} transactions - All transaction data
   * @param {Object} timePeriod - Current time period
   * @returns {Array} Benchmarking data
   */
  static getPersonalBenchmarking(transactions, timePeriod) {
    if (!transactions || transactions.length === 0) {
      return [];
    }

    const currentStart = new Date(timePeriod.startDate);
    const currentMonth = currentStart.getMonth();
    const currentYear = currentStart.getFullYear();

    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const lastMonthStart = new Date(lastMonthYear, lastMonth, 1);
    const lastMonthEnd = new Date(lastMonthYear, lastMonth + 1, 0);

    const lastMonthStartStr = lastMonthStart.toISOString().split('T')[0];
    const lastMonthEndStr = lastMonthEnd.toISOString().split('T')[0];
    const lastMonthLabel = lastMonthStart.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });

    const currentBreakdown = MetricsService.calculateCategoryBreakdown(
      transactions,
      timePeriod
    );
    const currentSpending = {};
    currentBreakdown.categories.forEach(cat => {
      currentSpending[cat.name] = cat.amount;
    });

    const lastMonthPeriod = {
      startDate: lastMonthStartStr,
      endDate: lastMonthEndStr,
      type: 'monthly',
    };
    const lastMonthBreakdown = MetricsService.calculateCategoryBreakdown(
      transactions,
      lastMonthPeriod
    );
    const lastMonthSpending = {};
    lastMonthBreakdown.categories.forEach(cat => {
      lastMonthSpending[cat.name] = cat.amount;
    });

    const benchmarking = [];
    const currentCategories = currentBreakdown.categories.map(cat => cat.name);
    const lastMonthCategories = lastMonthBreakdown ? lastMonthBreakdown.categories.map(cat => cat.name) : [];
    const categories = [...new Set([...currentCategories, ...lastMonthCategories])];

    categories.forEach(category => {
      const current = currentSpending[category] || 0;
      const lastMonthAmount = lastMonthSpending[category] || 0;

      if (current > 0 || lastMonthAmount > 0) {
        let change = 0;
        let trend = 'stable';

        if (lastMonthAmount > 0) {
          change = ((current - lastMonthAmount) / lastMonthAmount) * 100;
          trend =
            change > TREND_THRESHOLD_MONTHLY ? 'increasing' : change < -TREND_THRESHOLD_MONTHLY ? 'decreasing' : 'stable';
        } else if (current > 0) {
          change = 0;
          trend = 'new';
        }

        benchmarking.push({
          category,
          current,
          lastMonth: lastMonthAmount,
          change: Math.round(change * 10) / 10,
          trend,
          period: `vs ${lastMonthLabel}`,
        });
      }
    });

    return benchmarking.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  }

  /**
   * Get historical insights for multiple periods
   * @param {Array} transactions - All transaction data
   * @param {Array} historicalPeriods - Array of historical time periods
   * @returns {Object} Historical insights
   */
  static getHistoricalInsights(transactions, historicalPeriods) {
    const historicalInsights = [];

    historicalPeriods.forEach(period => {
      const breakdown = MetricsService.calculateCategoryBreakdown(
        transactions,
        period
      );
      const incomeVsExpenses = MetricsService.calculateIncomeVsExpenses(
        transactions,
        period
      );

      historicalInsights.push({
        period,
        insights: [
          {
            id: 'balance',
            type: incomeVsExpenses.netBalance > 0 ? 'positive' : 'negative',
            message: `Net balance: ${incomeVsExpenses.netBalance.toFixed(2)}`,
          },
        ],
        summary: {
          totalIncome: incomeVsExpenses.totalIncome,
          totalExpenses: incomeVsExpenses.totalExpenses,
          netBalance: incomeVsExpenses.netBalance,
          topCategory: breakdown.categories[0]?.name || 'N/A',
          totalInsights: 1,
        },
      });
    });

    return {
      historicalInsights,
      totalPeriods: historicalPeriods.length,
      overallTrends: {
        averageIncome:
          historicalInsights.length > 0
            ? historicalInsights.reduce((s, h) => s + h.summary.totalIncome, 0) /
              historicalInsights.length
            : 0,
        averageExpenses:
          historicalInsights.length > 0
            ? historicalInsights.reduce((s, h) => s + h.summary.totalExpenses, 0) /
              historicalInsights.length
            : 0,
      },
      preservedAt: new Date().toISOString(),
    };
  }
}

const comparisonService = new ComparisonService();

export default comparisonService;
