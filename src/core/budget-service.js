/**
 * BudgetService
 *
 * Handles all budget-related operations and persistence.
 */

import { STORAGE_KEYS } from '../utils/constants.js';
import { AuthService } from './auth-service.js';
import { generateId } from '../utils/id-utils.js';
import { safeJsonParse } from '../utils/security-utils.js';

const BUDGETS_KEY = STORAGE_KEYS.BUDGETS;

export const BudgetService = {
  /**
   * Get all budgets
   * @returns {Array} List of budgets
   */
  getAll() {
    const data = localStorage.getItem(BUDGETS_KEY);
    const budgets = data ? safeJsonParse(data) : [];

    // IDOR Protection: Filter by current userId
    const currentUserId = AuthService.getUserId();
    if (!currentUserId) return [];

    return budgets.filter(b => !b.userId || b.userId === currentUserId);
  },

  /**
   * Add or update a budget
   * @param {Object} budgetData - Budget data
   * @returns {Object} Added/updated budget
   */
  save(budgetData) {
    const budgets = this.getAll();
    const index = budgets.findIndex(
      b => b.categoryName === budgetData.categoryName
    );

    let budget;
    if (index !== -1) {
      // Update existing
      budget = {
        ...budgets[index],
        ...budgetData,
        updatedAt: new Date().toISOString(),
      };
      budgets[index] = budget;
    } else {
      // Add new
      budget = {
        id: generateId(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: AuthService.getUserId(),
        period: 'monthly',
        ...budgetData,
      };
      budgets.push(budget);
    }

    this._persist(budgets);
    return budget;
  },

  /**
   * Delete a budget
   * @param {string} id - Budget ID
   */
  delete(id) {
    let budgets = this.getAll();
    budgets = budgets.filter(b => b.id !== id);
    this._persist(budgets);
  },

  /**
   * Get budget for a specific category
   * @param {string} categoryName - Category name
   * @returns {Object|null} Budget or null
   */
  getByCategory(categoryName) {
    const budgets = this.getAll();
    return budgets.find(b => b.categoryName === categoryName) || null;
  },

  /**
   * Suggest budget amounts based on historical spending
   * @param {Array} transactions - Array of transactions
   * @param {number} daysBack - Number of days to analyze (default 90)
   * @returns {Promise<Array>} Array of suggested budgets with category, amount, and source count
   */
  async suggestBudgets(transactions, daysBack = 90) {
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
  },

  /**
   * Private helper to persist budgets
   */
  _persist(budgets) {
    localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
  },
};
