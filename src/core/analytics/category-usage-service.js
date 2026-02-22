/**
 * Category Usage Service
 *
 * Tracks and provides analytics for category usage statistics.
 * Feature 3.2.2 - Category Usage Analytics Foundation
 *
 * Provides methods to track category frequency, usage trends, and insights.
 */

import { TRANSACTION_TYPES } from '../../utils/constants.js';

const CATEGORY_USAGE_KEY = 'category_usage';

/**
 * CategoryUsageService
 * Provides methods to track and analyze category usage patterns
 */
export const CategoryUsageService = {
  /**
   * Get stored category usage data
   * @private
   * @returns {Object} Category usage data
   */
  _getStoredData() {
    try {
      const data = localStorage.getItem(CATEGORY_USAGE_KEY);
      return data ? JSON.parse(data) : { categories: {}, lastUpdated: null };
    } catch (error) {
      console.error('Error reading category usage:', error);
      return { categories: {}, lastUpdated: null };
    }
  },

  /**
   * Save category usage data
   * @private
   * @param {Object} data - Category usage data to save
   */
  _saveData(data) {
    try {
      data.lastUpdated = new Date().toISOString();
      localStorage.setItem(CATEGORY_USAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving category usage:', error);
    }
  },

  /**
   * Get usage statistics for all categories
   * @returns {Object} Category usage statistics
   */
  getCategoryUsageStats() {
    const data = this._getStoredData();

    const stats = Object.entries(data.categories).map(([category, info]) => ({
      category,
      transactionCount: info.transactionCount || 0,
      totalAmount: info.totalAmount || 0,
      averageAmount:
        info.transactionCount > 0
          ? info.totalAmount / info.transactionCount
          : 0,
      firstUsed: info.firstUsed || null,
      lastUsed: info.lastUsed || null,
    }));

    // Sort by transaction count descending
    stats.sort((a, b) => b.transactionCount - a.transactionCount);

    return {
      categories: stats,
      totalCategories: stats.length,
      totalTransactions: stats.reduce((sum, s) => sum + s.transactionCount, 0),
      lastUpdated: data.lastUpdated,
    };
  },

  /**
   * Get top N most frequently used categories
   * @param {number} limit - Number of categories to return
   * @returns {Array} Top categories by frequency
   */
  getMostFrequentCategories(limit = 5) {
    const stats = this.getCategoryUsageStats();
    return stats.categories.slice(0, limit);
  },

  /**
   * Get trend data for a specific category
   * @param {string} categoryId - Category name/ID
   * @returns {Object} Category trend data
   */
  getCategoryTrends(categoryId) {
    const data = this._getStoredData();
    const categoryInfo = data.categories[categoryId] || {};

    // Get recent usage (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTransactions = (categoryInfo.recentTransactions || []).filter(
      t => new Date(t.date) >= thirtyDaysAgo
    );

    // Calculate trend (comparing recent to previous period)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const previousTransactions = (categoryInfo.recentTransactions || []).filter(
      t => {
        const date = new Date(t.date);
        return date >= sixtyDaysAgo && date < thirtyDaysAgo;
      }
    );

    const recentCount = recentTransactions.length;
    const previousCount = previousTransactions.length;

    // Calculate trend percentage
    let trend = 0;
    if (previousCount > 0) {
      trend = ((recentCount - previousCount) / previousCount) * 100;
    } else if (recentCount > 0) {
      trend = 100; // New category usage
    }

    const isNew = !(categoryId in data.categories);
    const storedCategoryInfo = data.categories[categoryId] || {
      transactionCount: 0,
      totalAmount: 0,
      firstUsed: null,
      lastUsed: null,
      recentTransactions: [],
    };

    return {
      category: categoryId,
      currentPeriodCount: recentCount,
      previousPeriodCount: previousCount,
      trend: Math.round(trend * 10) / 10, // Round to 1 decimal
      totalTransactions: storedCategoryInfo.transactionCount || 0,
      totalAmount: storedCategoryInfo.totalAmount || 0,
      averageAmount:
        storedCategoryInfo.transactionCount > 0
          ? storedCategoryInfo.totalAmount / storedCategoryInfo.transactionCount
          : 0,
      isNew,
      lastUsed: storedCategoryInfo.lastUsed || null,
    };
  },

  /**
   * Update category usage from transactions
   * @param {Array} transactions - Array of transactions to process
   */
  updateFromTransactions(transactions) {
    const data = this._getStoredData();

    transactions.forEach(transaction => {
      // Only count expenses and income
      if (
        transaction.type !== TRANSACTION_TYPES.EXPENSE &&
        transaction.type !== TRANSACTION_TYPES.INCOME
      ) {
        return;
      }

      const category = transaction.category || 'Uncategorized';
      const amount = Math.abs(transaction.amount || 0);
      const date = transaction.date || transaction.timestamp;

      if (!data.categories[category]) {
        data.categories[category] = {
          transactionCount: 0,
          totalAmount: 0,
          firstUsed: date,
          lastUsed: date,
          recentTransactions: [],
        };
      }

      const catInfo = data.categories[category];
      catInfo.transactionCount += 1;
      catInfo.totalAmount += amount;

      // Update lastUsed only if this date is more recent
      const currentDate = new Date(date).getTime();
      const lastUsedDate = catInfo.lastUsed
        ? new Date(catInfo.lastUsed).getTime()
        : 0;
      if (currentDate > lastUsedDate) {
        catInfo.lastUsed = date;
      }

      if (
        !catInfo.firstUsed ||
        new Date(date).getTime() < new Date(catInfo.firstUsed).getTime()
      ) {
        catInfo.firstUsed = date;
      }

      // Keep last 100 transactions for trend analysis
      catInfo.recentTransactions = catInfo.recentTransactions || [];
      catInfo.recentTransactions.push({ date, amount });
      if (catInfo.recentTransactions.length > 100) {
        catInfo.recentTransactions.shift();
      }
    });

    this._saveData(data);
  },

  /**
   * Clear all category usage data
   */
  resetUsageData() {
    const emptyData = { categories: {}, lastUpdated: null };
    this._saveData(emptyData);
  },

  /**
   * Get category by transaction count ranking
   * @param {string} categoryId - Category to check
   * @returns {number} Rank (1-based), or -1 if not found
   */
  getCategoryRank(categoryId) {
    const stats = this.getCategoryUsageStats();
    const index = stats.categories.findIndex(c => c.category === categoryId);
    return index >= 0 ? index + 1 : -1;
  },
};

export default CategoryUsageService;
