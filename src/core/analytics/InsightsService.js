/**
 * InsightsService
 * Generates spending insights and pattern analysis.
 */

import { TRANSACTION_TYPES } from '../../utils/constants.js';
import { FilteringService } from './FilteringService.js';
import { MetricsService } from './MetricsService.js';
import { AnomalyService } from './AnomalyService.js';
import { BudgetPlanner } from '../budget-planner.js';

export class InsightsService {
  /**
   * Generate spending insights based on transaction patterns
   * @param {Array} transactions - All transaction data (for historical comparison)
   * @param {Object} currentPeriod - Current time period
   * @param {Object} previousPeriod - Previous time period for comparison
   * @returns {Array} Array of insight objects
   */
  static generateSpendingInsights(
    transactions,
    currentPeriod,
    previousPeriod = null
  ) {
    const insights = [];

    const currentData = MetricsService.calculateIncomeVsExpenses(
      transactions,
      currentPeriod
    );
    const currentCategories = MetricsService.calculateCategoryBreakdown(
      transactions,
      currentPeriod
    );

    // Basic insights about current period
    if (currentData.netBalance > 0) {
      insights.push({
        id: 'positive_balance',
        type: 'positive',
        message: `You saved ${Math.abs(currentData.netBalance).toFixed(2)} this period with a positive balance.`,
        severity: 'low',
        actionable: false,
      });
    } else if (currentData.netBalance < 0) {
      insights.push({
        id: 'negative_balance',
        type: 'warning',
        message: `You spent ${Math.abs(currentData.netBalance).toFixed(2)} more than you earned this period.`,
        severity: 'high',
        actionable: true,
        recommendation:
          'Consider reviewing your spending in top categories to identify areas for reduction.',
      });
    }

    // Top spending category insight
    if (currentCategories.categories.length > 0) {
      const topCategory = currentCategories.categories[0];
      insights.push({
        id: 'top_category',
        type: 'pattern',
        category: topCategory.name,
        message: `Your highest spending category is "${topCategory.name}" at ${topCategory.percentage.toFixed(1)}% of total expenses.`,
        severity: 'low',
        actionable: topCategory.percentage > 40,
        recommendation:
          topCategory.percentage > 40
            ? `Consider if ${topCategory.percentage.toFixed(1)}% spending on "${topCategory.name}" aligns with your financial goals.`
            : null,
      });
    }

    // Compare with previous period if provided
    if (previousPeriod) {
      const previousData = MetricsService.calculateIncomeVsExpenses(
        transactions,
        previousPeriod
      );
      const previousCategories = MetricsService.calculateCategoryBreakdown(
        transactions,
        previousPeriod
      );

      // Income comparison
      const incomeChange = currentData.totalIncome - previousData.totalIncome;
      const incomeChangePercent =
        previousData.totalIncome > 0
          ? (incomeChange / previousData.totalIncome) * 100
          : 0;

      if (Math.abs(incomeChangePercent) > 10) {
        insights.push({
          id: 'income_change',
          type: incomeChange > 0 ? 'increase' : 'decrease',
          message: `Your income ${incomeChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(incomeChangePercent).toFixed(1)}% compared to the previous period.`,
          severity: Math.abs(incomeChangePercent) > 25 ? 'high' : 'medium',
          actionable: incomeChange < 0,
        });
      }

      // Expense comparison
      const expenseChange =
        currentData.totalExpenses - previousData.totalExpenses;
      const expenseChangePercent =
        previousData.totalExpenses > 0
          ? (expenseChange / previousData.totalExpenses) * 100
          : 0;

      if (Math.abs(expenseChangePercent) > 15) {
        insights.push({
          id: 'expense_change',
          type: expenseChange > 0 ? 'increase' : 'decrease',
          message: `Your expenses ${expenseChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(expenseChangePercent).toFixed(1)}% compared to the previous period.`,
          severity:
            expenseChange > 0 && expenseChangePercent > 25 ? 'high' : 'medium',
          actionable: expenseChange > 0,
          recommendation:
            expenseChange > 0
              ? 'Review your recent spending to identify what drove the increase.'
              : null,
        });
      }

      // Category-specific insights
      const categoryInsights = this.generateCategoryComparisonInsights(
        currentCategories,
        previousCategories
      );
      insights.push(...categoryInsights);
    }

    // Add spending pattern insights
    const patternInsights = this.analyzeSpendingPatterns(
      transactions,
      currentPeriod
    );
    insights.push(...patternInsights);

    // Add anomaly detection insights
    const anomalyInsights = AnomalyService.detectAnomalies(
      transactions,
      currentPeriod
    );
    insights.push(...anomalyInsights);

    // Add Budget Insights
    try {
      const budgetStatuses = BudgetPlanner.getBudgetsStatus(transactions);
      budgetStatuses.forEach(status => {
        if (status.isExceeded) {
          insights.push({
            id: `budget_exceeded_${status.categoryName}`,
            type: 'warning',
            category: status.categoryName,
            message: `You've exceeded your budget for "${status.categoryName}" by ${Math.abs(status.amountLimit - status.actual).toFixed(2)}.`,
            severity: 'high',
            actionable: true,
            recommendation: `Consider reviewing recent purchases in "${status.categoryName}" to find savings for the rest of the month.`,
          });
        } else if (status.isWarning) {
          insights.push({
            id: `budget_warning_${status.categoryName}`,
            type: 'warning',
            category: status.categoryName,
            message: `You've used ${status.utilization.toFixed(0)}% of your "${status.categoryName}" budget.`,
            severity: 'medium',
            actionable: true,
            recommendation: `You have ${status.remaining.toFixed(2)} remaining in your "${status.categoryName}" budget.`,
          });
        }
      });
    } catch (budgetInsightError) {
      console.warn(
        '[InsightsService] Failed to generate budget insights:',
        budgetInsightError
      );
    }

    return insights;
  }

  /**
   * Analyze spending patterns and generate insights
   * @param {Array} transactions - All transaction data
   * @param {Object} timePeriod - Current time period
   * @returns {Array} Array of pattern-based insights
   */
  static analyzeSpendingPatterns(transactions, timePeriod) {
    const insights = [];
    const filteredTransactions = FilteringService.filterByTimePeriod(
      transactions,
      timePeriod
    );
    const expenseTransactions = filteredTransactions.filter(
      t => t.type === TRANSACTION_TYPES.EXPENSE
    );

    if (expenseTransactions.length === 0) {
      return insights;
    }

    // Analyze spending frequency patterns
    insights.push(
      ...this.analyzeSpendingFrequency(expenseTransactions, timePeriod)
    );

    // Analyze timing patterns
    insights.push(...this.analyzeSpendingTiming(expenseTransactions));

    // Analyze transaction size patterns
    insights.push(...this.analyzeTransactionSizes(expenseTransactions));

    return insights;
  }

  /**
   * Analyze spending frequency patterns
   * @param {Array} expenseTransactions - Expense transactions
   * @param {Object} timePeriod - Time period
   * @returns {Array} Frequency-based insights
   */
  static analyzeSpendingFrequency(expenseTransactions, timePeriod) {
    const insights = [];
    const startDate = new Date(timePeriod.startDate);
    const endDate = new Date(timePeriod.endDate);
    const durationDays =
      Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const avgTransactionsPerDay = expenseTransactions.length / durationDays;

    if (avgTransactionsPerDay > 5) {
      insights.push({
        id: 'high_frequency_spending',
        type: 'pattern',
        message: `You're making ${avgTransactionsPerDay.toFixed(1)} expense transactions per day on average. This suggests frequent small purchases.`,
        severity: 'medium',
        actionable: true,
        recommendation:
          'Consider consolidating purchases or setting daily spending limits to reduce transaction frequency.',
      });
    } else if (avgTransactionsPerDay < 1 && expenseTransactions.length > 0) {
      insights.push({
        id: 'low_frequency_spending',
        type: 'pattern',
        message: `You're making ${avgTransactionsPerDay.toFixed(1)} expense transactions per day on average. This suggests infrequent, larger purchases.`,
        severity: 'low',
        actionable: false,
      });
    }

    return insights;
  }

  /**
   * Analyze spending timing patterns
   * @param {Array} expenseTransactions - Expense transactions
   * @returns {Array} Timing-based insights
   */
  static analyzeSpendingTiming(expenseTransactions) {
    const insights = [];
    const dayOfWeekCounts = Object.create(null);
    const dayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    expenseTransactions.forEach(transaction => {
      const date = new Date(transaction.date || transaction.timestamp);
      const dayOfWeek = date.getDay();
      const dayName = dayNames[dayOfWeek];

      if (!dayOfWeekCounts[dayName]) {
        dayOfWeekCounts[dayName] = { count: 0, amount: 0 };
      }
      dayOfWeekCounts[dayName].count += 1;
      dayOfWeekCounts[dayName].amount += Math.abs(transaction.amount || 0);
    });

    const sortedDays = Object.entries(dayOfWeekCounts).sort(
      (a, b) => b[1].amount - a[1].amount
    );

    if (sortedDays.length > 0) {
      const [topDay, topDayData] = sortedDays[0];
      const totalAmount = Object.values(dayOfWeekCounts).reduce(
        (sum, day) => sum + day.amount,
        0
      );
      const dayPercentage = (topDayData.amount / totalAmount) * 100;

      if (dayPercentage > 30) {
        insights.push({
          id: 'day_spending_pattern',
          type: 'pattern',
          message: `${dayPercentage.toFixed(1)}% of your spending happens on ${topDay}s. This suggests a strong weekly spending pattern.`,
          severity: 'low',
          actionable: true,
          recommendation: `Consider if your ${topDay} spending aligns with your budget goals.`,
        });
      }
    }

    return insights;
  }

  /**
   * Analyze transaction size patterns
   * @param {Array} expenseTransactions - Expense transactions
   * @returns {Array} Size-based insights
   */
  static analyzeTransactionSizes(expenseTransactions) {
    const insights = [];
    if (expenseTransactions.length < 3) return insights;

    const amounts = expenseTransactions
      .map(t => Math.abs(t.amount || 0))
      .sort((a, b) => a - b);
    const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);
    const averageAmount = totalAmount / amounts.length;

    const smallTransactions = amounts.filter(
      amount => amount < averageAmount * 0.5
    );

    if (smallTransactions.length > amounts.length * 0.7) {
      insights.push({
        id: 'small_transaction_pattern',
        type: 'pattern',
        message: `${((smallTransactions.length / amounts.length) * 100).toFixed(1)}% of your transactions are small purchases under ${(averageAmount * 0.5).toFixed(2)}.`,
        severity: 'low',
        actionable: true,
        recommendation:
          'Small frequent purchases can add up. Consider tracking these more closely or setting daily limits.',
      });
    }

    return insights;
  }

  /**
   * Generate category comparison insights between periods
   * @param {Object} currentCategories - Current period category breakdown
   * @param {Object} previousCategories - Previous period category breakdown
   * @returns {Array} Category comparison insights
   */
  static generateCategoryComparisonInsights(
    currentCategories,
    previousCategories
  ) {
    const insights = [];
    const currentCategoryMap = new Map();
    const previousCategoryMap = new Map();

    currentCategories.categories.forEach(cat =>
      currentCategoryMap.set(cat.name, cat)
    );
    previousCategories.categories.forEach(cat =>
      previousCategoryMap.set(cat.name, cat)
    );

    for (const [categoryName, currentCat] of currentCategoryMap) {
      const previousCat = previousCategoryMap.get(categoryName);

      if (previousCat) {
        const amountChange = currentCat.amount - previousCat.amount;
        const percentChange =
          previousCat.amount > 0
            ? (amountChange / previousCat.amount) * 100
            : 0;

        if (Math.abs(percentChange) > 25 && Math.abs(amountChange) > 10) {
          insights.push({
            id: `category_change_${categoryName.toLowerCase().replace(/\s+/g, '_')}`,
            type: amountChange > 0 ? 'increase' : 'decrease',
            category: categoryName,
            message: `Your "${categoryName}" spending ${amountChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(percentChange).toFixed(1)}% (${Math.abs(amountChange).toFixed(2)}) compared to the previous period.`,
            severity: Math.abs(percentChange) > 50 ? 'high' : 'medium',
            actionable: amountChange > 0,
            recommendation:
              amountChange > 0
                ? `Review your recent "${categoryName}" purchases to understand what drove the increase.`
                : null,
          });
        }
      } else if (currentCat.amount > 20) {
        insights.push({
          id: `new_category_${categoryName.toLowerCase().replace(/\s+/g, '_')}`,
          type: 'pattern',
          category: categoryName,
          message: `You started spending in a new category "${categoryName}" with ${currentCat.amount.toFixed(2)} this period.`,
          severity: 'low',
          actionable: false,
        });
      }
    }

    return insights;
  }
}
