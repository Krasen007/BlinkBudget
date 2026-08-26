/**
 * BudgetPlanner
 *
 * Calculates budget utilization and health based on actual spending.
 */

import { MetricsService } from './analytics/MetricsService.js';
import { BudgetService } from './budget-service.js';
import { getCurrentMonthPeriod } from '../utils/reports-utils.js';

export class BudgetPlanner {
  /**
   * Get utilization for all budgets
   * @param {Array} transactions - List of transactions
   * @param {Object} timePeriod - Time period object (optional, defaults to current month)
   * @returns {Array} List of budget status objects
   */
  static getBudgetsStatus(transactions, timePeriod = null) {
    const budgets = BudgetService.getAll();
    const currentPeriod = timePeriod || getCurrentMonthPeriod();
    const categoryBreakdown = MetricsService.calculateCategoryBreakdown(
      transactions,
      currentPeriod
    );

    return budgets.map(budget => {
      const actual =
        categoryBreakdown.categories.find(c => c.name === budget.categoryName)
          ?.amount || 0;
      const remaining = Math.max(0, budget.amountLimit - actual);
      const utilization =
        budget.amountLimit > 0 ? (actual / budget.amountLimit) * 100 : 0;

      return {
        ...budget,
        actual,
        remaining,
        utilization,
        isExceeded: actual > budget.amountLimit,
        isWarning: utilization >= 80 && utilization <= 100,
      };
    });
  }

  /**
   * Get overall budget health summary
   * @param {Array} transactions - List of transactions
   * @param {Object} timePeriod - Time period object (optional, defaults to current month)
   * @returns {Object} Summary object
   */
  static getSummary(transactions, timePeriod = null) {
    const status = this.getBudgetsStatus(transactions, timePeriod);
    const totalLimit = status.reduce((sum, b) => sum + b.amountLimit, 0);
    const totalActual = status.reduce((sum, b) => sum + b.actual, 0);
    const exceededCount = status.filter(b => b.isExceeded).length;
    const warningCount = status.filter(b => b.isWarning).length;

    const totalOverspent = status.reduce((sum, b) => {
      return b.isExceeded ? sum + (b.actual - b.amountLimit) : sum;
    }, 0);

    const totalAvailable = status.reduce((sum, b) => {
      return !b.isExceeded ? sum + (b.amountLimit - b.actual) : sum;
    }, 0);

    return {
      totalBudgets: status.length,
      onTrackCount: status.length - exceededCount - warningCount,
      warningCount,
      exceededCount,
      totalLimit,
      totalActual,
      totalOverspent,
      totalAvailable,
      overallUtilization: totalLimit > 0 ? (totalActual / totalLimit) * 100 : 0,
    };
  }

  /**
   * Suggest budget amounts based on historical spending
   * @param {Array} transactions - Array of transactions
   * @param {number} daysBack - Number of days to analyze (default 90)
   * @returns {Promise<Array>} Array of suggested budgets with category, amount, and source count
   */
  static async suggestBudgets(transactions, daysBack = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    // Filter to recent transactions only
    const recentTransactions = transactions.filter(t => {
      const txnDate = t.timestamp ? new Date(t.timestamp) : new Date(t.date);
      return txnDate >= cutoffDate && t.type === 'expense';
    });

    // Aggregate spending by category
    const categoryTotals = {};
    recentTransactions.forEach(txn => {
      const category = txn.category || 'Uncategorized';
      categoryTotals[category] =
        (categoryTotals[category] || 0) + (txn.amount || 0);
    });

    // Calculate monthly average and generate suggestions
    const suggestions = Object.entries(categoryTotals)
      .map(([category, total]) => {
        const monthsAnalyzed = Math.max(1, daysBack / 30);
        const monthlyAverage = total / monthsAnalyzed;
        // Round to nearest 5 for cleaner numbers
        const suggestedAmount = Math.round(monthlyAverage / 5) * 5;
        // Ensure minimum of 5 for any category with spending
        const finalAmount = Math.max(5, suggestedAmount);

        return {
          category,
          suggestedAmount: finalAmount,
          basedOnTransactions: recentTransactions.filter(
            t => (t.category || 'Uncategorized') === category
          ).length,
          averageMonthly: Math.round(monthlyAverage * 100) / 100,
        };
      })
      .filter(s => s.basedOnTransactions >= 2) // At least 2 transactions for confidence
      .sort((a, b) => b.averageMonthly - a.averageMonthly); // Sort by amount descending

    return suggestions;
  }
}
