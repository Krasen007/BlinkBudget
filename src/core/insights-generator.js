// InsightsGenerator: unified insights module for BlinkBudget.
// Top Movers / Timeline comparison utilities plus period spending insights
// (absorbed from core/analytics/InsightsService.js).

import { TRANSACTION_TYPES } from '../utils/constants.js';
import { FilteringService } from './analytics/FilteringService.js';
import { MetricsService } from './analytics/MetricsService.js';
import { AnomalyService } from './analytics/AnomalyService.js';
import { BudgetPlanner } from './budget-planner.js';
import { formatCurrency } from '../utils/financial-planning-helpers.js';

const InsightsGenerator = {
  // transactions: array of {id, date, amount, category, account, type}
  // Returns top N movers by absolute amount (descending), excluding income, transfer, and ghost transactions.
  topMovers(transactions, n = 5) {
    if (!Array.isArray(transactions)) return [];
    const byCategory = new Map();
    for (const tx of transactions) {
      // Skip income and transfer transactions to prevent skewing expense analysis
      if (tx.type === 'income' || tx.type === 'transfer' || tx.isGhost)
        continue;

      const cat = tx.category || 'Uncategorized';
      const amt =
        typeof tx.amount === 'number' ? tx.amount : Number(tx.amount) || 0;

      // Handle refunds: subtract from total (same logic as MetricsService.calculateCategoryBreakdown)
      const isRefund = tx.type === 'refund';
      const adjustedAmount = isRefund ? -Math.abs(amt) : Math.abs(amt);

      const entry = byCategory.get(cat) || {
        category: cat,
        total: 0,
        count: 0,
      };
      entry.total += adjustedAmount;
      entry.count += 1;
      byCategory.set(cat, entry);
    }
    const arr = Array.from(byCategory.values());
    arr.sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
    return arr.slice(0, n).map(item => ({
      category: item.category,
      total: item.total,
      count: item.count,
    }));
  },

  // Compare two time series (arrays of {period, value}) and return differences
  // Returns array of {period, current, previous, absoluteChange, percentChange}
  timelineComparison(currentSeries, previousSeries) {
    const prevByPeriod = new Map();
    for (const p of previousSeries || []) {
      prevByPeriod.set(
        p.period,
        typeof p.value === 'number' ? p.value : Number(p.value) || 0
      );
    }
    const result = [];
    for (const cur of currentSeries || []) {
      const period = cur.period;
      const current =
        typeof cur.value === 'number' ? cur.value : Number(cur.value) || 0;
      const previous = prevByPeriod.get(period) ?? 0;
      const absoluteChange = current - previous;
      const percentChange =
        previous === 0
          ? current === 0
            ? 0
            : Infinity
          : (absoluteChange / Math.abs(previous)) * 100;
      result.push({ period, current, previous, absoluteChange, percentChange });
    }
    return result;
  },

  /**
   * Generate spending insights based on transaction patterns
   * @param {Array} transactions - All transaction data
   * @param {Object} currentPeriod - Current time period
   * @param {Object} previousPeriod - Previous time period for comparison
   * @returns {Array} Array of insight objects
   */
  generateSpendingInsights(transactions, currentPeriod, previousPeriod = null) {
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
        message: `You saved ${formatCurrency(Math.abs(currentData.netBalance))} this period with a positive balance.`,
        severity: 'low',
        actionable: false,
      });
    } else if (currentData.netBalance < 0) {
      insights.push({
        id: 'negative_balance',
        type: 'warning',
        message: `You spent ${formatCurrency(Math.abs(currentData.netBalance))} more than you earned this period.`,
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

    // Add anomaly detection insights
    const anomalyInsights = AnomalyService.detectAnomalies(
      transactions,
      currentPeriod
    );
    insights.push(...anomalyInsights);

    // Add spending pattern insights
    const patternInsights = this.analyzeSpendingPatterns(
      transactions,
      currentPeriod
    );
    insights.push(...patternInsights);

    // Add Budget Insights
    try {
      const budgetStatuses = BudgetPlanner.getBudgetsStatus(transactions);
      budgetStatuses.forEach(status => {
        if (status.isExceeded) {
          insights.push({
            id: `budget_exceeded_${status.categoryName}`,
            type: 'warning',
            category: status.categoryName,
            message: `You've exceeded your budget for "${status.categoryName}" by ${formatCurrency(Math.abs(status.amountLimit - status.actual))}.`,
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
            recommendation: `You have ${formatCurrency(status.remaining)} remaining in your "${status.categoryName}" budget.`,
          });
        }
      });
    } catch {
      // Budget insights are additive; never fail insight generation
    }

    return insights;
  },

  /**
   * Analyze spending patterns (frequency, timing, sizes)
   */
  analyzeSpendingPatterns(transactions, timePeriod) {
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

    insights.push(
      ...this.analyzeSpendingFrequency(expenseTransactions, timePeriod)
    );
    insights.push(...this.analyzeSpendingTiming(expenseTransactions));
    insights.push(...this.analyzeTransactionSizes(expenseTransactions));

    return insights;
  },

  analyzeSpendingFrequency(expenseTransactions, timePeriod) {
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
  },

  analyzeSpendingTiming(expenseTransactions) {
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
      const dayName = dayNames[date.getDay()];

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
  },

  analyzeTransactionSizes(expenseTransactions) {
    const insights = [];
    if (expenseTransactions.length < 3) return insights;

    const amounts = expenseTransactions
      .map(t => Math.abs(t.amount || 0))
      .sort((a, b) => a - b);
    const averageAmount =
      amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;

    const smallTransactions = amounts.filter(
      amount => amount < averageAmount * 0.5
    );

    if (smallTransactions.length > amounts.length * 0.7) {
      insights.push({
        id: 'small_transaction_pattern',
        type: 'pattern',
        message: `${((smallTransactions.length / amounts.length) * 100).toFixed(1)}% of your transactions are small purchases under ${formatCurrency(averageAmount * 0.5)}.`,
        severity: 'low',
        actionable: true,
        recommendation:
          'Small frequent purchases can add up. Consider tracking these more closely or setting daily limits.',
      });
    }

    return insights;
  },

  generateCategoryComparisonInsights(currentCategories, previousCategories) {
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
            message: `Your "${categoryName}" spending ${amountChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(percentChange).toFixed(1)}% (${formatCurrency(Math.abs(amountChange))}) compared to the previous period.`,
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
          message: `You started spending in a new category "${categoryName}" with ${formatCurrency(currentCat.amount)} this period.`,
          severity: 'low',
          actionable: false,
        });
      }
    }

    return insights;
  },
};

export { InsightsGenerator };
export default InsightsGenerator;
