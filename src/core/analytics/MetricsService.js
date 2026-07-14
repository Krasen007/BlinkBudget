/**
 * MetricsService
 * Handles financial calculations and metric generation.
 */

import { TRANSACTION_TYPES } from '../../utils/constants.js';
import { FilteringService } from './FilteringService.js';
import { CustomCategoryService } from '../custom-category-service.js';

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

    // Process expense and refund transactions for category breakdown
    const relevantTransactions = filteredTransactions.filter(
      t =>
        t.type === TRANSACTION_TYPES.EXPENSE ||
        t.type === TRANSACTION_TYPES.REFUND
    );

    const categoryTotals = Object.create(null);

    relevantTransactions.forEach(transaction => {
      const category = transaction.category || 'Uncategorized';
      const rawAmount = Math.abs(transaction.amount || 0);
      const isRefund = transaction.type === TRANSACTION_TYPES.REFUND;
      const amount = isRefund ? -rawAmount : rawAmount;

      if (!categoryTotals[category]) {
        categoryTotals[category] = {
          name: category,
          amount: 0,
          transactionCount: 0,
        };
      }

      categoryTotals[category].amount += amount;
      // Only count expense transactions — refunds reduce the net but are not
      // spending events, matching calculateIncomeVsExpenses behaviour.
      if (!isRefund) {
        categoryTotals[category].transactionCount += 1;
      }
    });

    // Include all categories, even those with zero or negative net amounts
    // (e.g. a category that has only refunds, or where refunds exceeded expenses).
    // This ensures they appear in Explore Categories and their negative amounts
    // correctly reduce the Total Spent figure.
    const allCategories = Object.values(categoryTotals);

    // Total is the net of all category amounts (refunds reduce it)
    const validTotal = allCategories.reduce((sum, cat) => sum + cat.amount, 0);

    // Recalculate transaction count from all categories to match calculateIncomeVsExpenses
    const validTransactionCount = allCategories.reduce(
      (sum, cat) => sum + cat.transactionCount,
      0
    );

    // Gross positive total used for percentage calculation so each expense
    // category's share is relative to actual spending (not net of refunds).
    const grossExpenseTotal = allCategories.reduce(
      (sum, cat) => sum + Math.max(0, cat.amount),
      0
    );

    // Convert to array and calculate percentages
    const categories = allCategories.map(category => ({
      ...category,
      percentage:
        grossExpenseTotal > 0
          ? (Math.max(0, category.amount) / grossExpenseTotal) * 100
          : 0,
    }));

    // Sort by user-defined sortOrder first (respecting the order set in
    // Category Manager), falling back to amount descending as a tiebreaker
    // for categories that have no explicit order set.
    const userCategories = CustomCategoryService.getAll();
    const sortOrderMap = new Map(
      userCategories.map((cat, i) => [
        cat.name,
        cat.sortOrder ?? Number.MAX_SAFE_INTEGER,
      ])
    );
    categories.sort((a, b) => {
      const orderA = sortOrderMap.get(a.name) ?? Number.MAX_SAFE_INTEGER;
      const orderB = sortOrderMap.get(b.name) ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      // Same sort order (or both unknown) → fall back to amount descending
      return b.amount - a.amount;
    });

    return {
      categories,
      totalAmount: validTotal,
      timePeriod,
      transactionCount: validTransactionCount,
    };
  }

  /**
   * Calculate income vs expense summary
   * @param {Array} transactions - Transaction data
   * @param {Object} timePeriod - Time period configuration
   * @returns {Object} Income vs expense summary with totals and net balance
   */
  // Calculate income vs expense summary
  // Counting rule: expenseCount counts transactions that contribute to the
  // net expense totals. Pure refunds reduce totalExpenses but are NOT counted
  // as expense transactions so that counts align with category breakdowns.
  static calculateIncomeVsExpenses(transactions, timePeriod) {
    const filteredTransactions = FilteringService.filterByTimePeriod(
      transactions,
      timePeriod
    ).filter(t => !t.isGhost);

    let totalIncome = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    // Build per-category expense totals (same logic as calculateCategoryBreakdown)
    // so that totalExpenses is always identical to the sum shown in the pie chart.
    const categoryTotals = Object.create(null);

    filteredTransactions.forEach(transaction => {
      const amount = Math.abs(transaction.amount || 0);

      switch (transaction.type) {
        case TRANSACTION_TYPES.INCOME:
          totalIncome += amount;
          incomeCount += 1;
          break;
        case TRANSACTION_TYPES.EXPENSE: {
          expenseCount += 1;
          const cat = transaction.category || 'Uncategorized';
          categoryTotals[cat] = (categoryTotals[cat] || 0) + amount;
          break;
        }
        case TRANSACTION_TYPES.REFUND: {
          // Subtract per-category — mirrors calculateCategoryBreakdown exactly.
          const cat = transaction.category || 'Uncategorized';
          categoryTotals[cat] = (categoryTotals[cat] || 0) - amount;
          break;
        }
        case TRANSACTION_TYPES.TRANSFER:
          // Transfers don't affect income/expense calculation
          break;
        default:
          // Handle unknown transaction types as expenses
          expenseCount += 1;
          categoryTotals['Uncategorized'] =
            (categoryTotals['Uncategorized'] || 0) + amount;
      }
    });

    // Sum all per-category net amounts (can be negative if refunds exceed expenses)
    const totalExpenses = Object.values(categoryTotals).reduce(
      (sum, net) => sum + net,
      0
    );

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
    const durationDays = Math.ceil(
      (endDate - startDate) / (1000 * 60 * 60 * 24)
    );

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
