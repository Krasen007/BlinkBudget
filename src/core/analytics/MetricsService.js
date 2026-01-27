/**
 * MetricsService
 * Handles financial calculations and metric generation.
 */

import { TRANSACTION_TYPES } from '../../utils/constants.js';
import { FilteringService } from './FilteringService.js';

export class MetricsService {
  /**
   * Calculate category breakdown for expenses
   * @param {Array} transactions - Transaction data
   * @param {Object} timePeriod - Time period configuration
   * @returns {Object} Category breakdown with amounts and percentages
   */
  static calculateCategoryBreakdown(transactions, timePeriod) {
    const filteredTransactions = FilteringService.filterByTimePeriod(
      transactions,
      timePeriod
    ).filter(t => !t.isGhost);

    // Only process expense transactions for category breakdown
    const expenseTransactions = filteredTransactions.filter(
      t => t.type === TRANSACTION_TYPES.EXPENSE
    );

    const categoryTotals = {};
    let totalExpenses = 0;

    expenseTransactions.forEach(transaction => {
      const category = transaction.category || 'Uncategorized';
      const amount = Math.abs(transaction.amount || 0);

      if (!categoryTotals[category]) {
        categoryTotals[category] = {
          name: category,
          amount: 0,
          transactionCount: 0,
        };
      }

      categoryTotals[category].amount += amount;
      categoryTotals[category].transactionCount += 1;
      totalExpenses += amount;
    });

    // Convert to array and calculate percentages
    const categories = Object.values(categoryTotals).map(category => ({
      ...category,
      percentage:
        totalExpenses > 0 ? (category.amount / totalExpenses) * 100 : 0,
    }));

    // Sort by amount (highest first)
    categories.sort((a, b) => b.amount - a.amount);

    return {
      categories,
      totalAmount: totalExpenses,
      timePeriod,
      transactionCount: expenseTransactions.length,
    };
  }

  /**
   * Calculate income vs expense summary
   * @param {Array} transactions - Transaction data
   * @param {Object} timePeriod - Time period configuration
   * @returns {Object} Income vs expense summary with totals and net balance
   */
  static calculateIncomeVsExpenses(transactions, timePeriod) {
    const filteredTransactions = FilteringService.filterByTimePeriod(
      transactions,
      timePeriod
    ).filter(t => !t.isGhost);

    let totalIncome = 0;
    let totalExpenses = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    filteredTransactions.forEach(transaction => {
      const amount = Math.abs(transaction.amount || 0);

      switch (transaction.type) {
        case TRANSACTION_TYPES.INCOME:
          totalIncome += amount;
          incomeCount += 1;
          break;
        case TRANSACTION_TYPES.EXPENSE:
          totalExpenses += amount;
          expenseCount += 1;
          break;
        case TRANSACTION_TYPES.REFUND:
          // Refunds reduce expenses
          totalExpenses -= amount;
          expenseCount += 1;
          break;
        case TRANSACTION_TYPES.TRANSFER:
          // Transfers don't affect income/expense calculation
          break;
        default:
          // Handle unknown transaction types as expenses
          totalExpenses += amount;
          expenseCount += 1;
      }
    });

    // Ensure no negative values
    totalExpenses = Math.max(0, totalExpenses);

    const netBalance = totalIncome - totalExpenses;

    return {
      totalIncome,
      totalExpenses,
      netBalance,
      incomeCount,
      expenseCount,
      timePeriod,
      averageIncome: incomeCount > 0 ? totalIncome / incomeCount : 0,
      averageExpense: expenseCount > 0 ? totalExpenses / expenseCount : 0,
    };
  }

  /**
   * Calculate cost of living summary
   * @param {Array} transactions - Transaction data
   * @param {Object} timePeriod - Time period configuration
   * @returns {Object} Cost of living metrics
   */
  static calculateCostOfLiving(transactions, timePeriod) {
    const incomeVsExpenses = this.calculateIncomeVsExpenses(
      transactions,
      timePeriod
    );
    const categoryBreakdown = this.calculateCategoryBreakdown(
      transactions,
      timePeriod
    );

    // Calculate time period duration in days
    const startDate = new Date(timePeriod.startDate);
    const endDate = new Date(timePeriod.endDate);
    const durationDays =
      Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    // Calculate daily averages
    const dailySpending =
      durationDays > 0 ? incomeVsExpenses.totalExpenses / durationDays : 0;
    const dailyIncome =
      durationDays > 0 ? incomeVsExpenses.totalIncome / durationDays : 0;

    // Estimate monthly values (30-day month)
    const monthlySpending = dailySpending * 30;
    const monthlyIncome = dailyIncome * 30;

    // Identify top spending category
    const topCategory =
      categoryBreakdown.categories.length > 0
        ? categoryBreakdown.categories[0]
        : null;

    return {
      totalExpenditure: incomeVsExpenses.totalExpenses,
      dailySpending,
      monthlySpending,
      dailyIncome,
      monthlyIncome,
      durationDays,
      topSpendingCategory: topCategory,
      categoryCount: categoryBreakdown.categories.length,
      timePeriod,
      spendingRate:
        incomeVsExpenses.totalIncome > 0
          ? (incomeVsExpenses.totalExpenses / incomeVsExpenses.totalIncome) *
          100
          : 0,
    };
  }

  /**
   * Identify top spending categories with detailed analysis
   * @param {Array} transactions - Transaction data
   * @param {Object} timePeriod - Time period
   * @param {number} topN - Number of top categories to return
   * @returns {Object} Top categories analysis
   */
  static identifyTopCategories(transactions, timePeriod, topN = 5) {
    const categoryBreakdown = this.calculateCategoryBreakdown(
      transactions,
      timePeriod
    );

    // Get top N categories
    const topCategories = categoryBreakdown.categories.slice(0, topN);

    // Calculate additional metrics for top categories
    const enrichedCategories = topCategories.map(category => {
      const categoryTransactions = FilteringService.filterByTimePeriod(
        transactions,
        timePeriod
      ).filter(
        t =>
          !t.isGhost &&
          t.type === TRANSACTION_TYPES.EXPENSE &&
          (t.category || 'Uncategorized') === category.name
      );

      const amounts = categoryTransactions.map(t => Math.abs(t.amount || 0));
      const avgTransactionAmount =
        amounts.length > 0
          ? amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length
          : 0;

      const maxTransaction = Math.max(...amounts, 0);
      const minTransaction = Math.min(...amounts, Infinity);

      return {
        ...category,
        averageTransactionAmount: avgTransactionAmount,
        maxTransactionAmount: maxTransaction,
        minTransactionAmount: minTransaction === Infinity ? 0 : minTransaction,
        transactionFrequency: categoryTransactions.length,
        transactions: categoryTransactions.map(t => ({
          amount: t.amount,
          description: t.description,
          date: t.date || t.timestamp,
        })),
      };
    });

    return {
      topCategories: enrichedCategories,
      totalCategoriesAnalyzed: categoryBreakdown.categories.length,
      topCategoriesPercentage: topCategories.reduce(
        (sum, cat) => sum + cat.percentage,
        0
      ),
      timePeriod,
    };
  }
}
