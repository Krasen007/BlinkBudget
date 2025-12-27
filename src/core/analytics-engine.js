/**
 * Analytics Engine for BlinkBudget Reports & Insights
 * 
 * Processes raw transaction data to generate insights, calculations, and analytics.
 * Handles data filtering, aggregation, and analysis for the reports feature.
 * 
 * Requirements: 2.1, 2.2, 2.3, 3.1, 3.2
 */

import { TRANSACTION_TYPES } from '../utils/constants.js';

export class AnalyticsEngine {
    constructor() {
        this.cache = new Map();
        this.cacheTimestamps = new Map();
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
        this.cacheStats = {
            hits: 0,
            misses: 0,
            invalidations: 0
        };
    }

    /**
     * Filter transactions by time period
     * @param {Array} transactions - Raw transaction data
     * @param {Object} timePeriod - Time period configuration
     * @param {Date} timePeriod.startDate - Start date
     * @param {Date} timePeriod.endDate - End date
     * @returns {Array} Filtered transactions
     */
    filterTransactionsByTimePeriod(transactions, timePeriod) {
        if (!transactions || !Array.isArray(transactions)) {
            return [];
        }

        if (!timePeriod || !timePeriod.startDate || !timePeriod.endDate) {
            return transactions;
        }

        const startDate = new Date(timePeriod.startDate);
        const endDate = new Date(timePeriod.endDate);
        
        // Set time to start/end of day for accurate filtering
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        return transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date || transaction.timestamp);
            return transactionDate >= startDate && transactionDate <= endDate;
        });
    }

    /**
     * Calculate category breakdown for expenses
     * @param {Array} transactions - Filtered transaction data
     * @param {Object} timePeriod - Time period configuration
     * @returns {Object} Category breakdown with amounts and percentages
     */
    calculateCategoryBreakdown(transactions, timePeriod) {
        const cacheKey = `categoryBreakdown_${JSON.stringify(timePeriod)}`;
        const cached = this.getCachedResult(cacheKey);
        if (cached) return cached;

        const filteredTransactions = this.filterTransactionsByTimePeriod(transactions, timePeriod);
        
        // Only process expense transactions for category breakdown
        const expenseTransactions = filteredTransactions.filter(t => 
            t.type === TRANSACTION_TYPES.EXPENSE
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
                    transactionCount: 0
                };
            }
            
            categoryTotals[category].amount += amount;
            categoryTotals[category].transactionCount += 1;
            totalExpenses += amount;
        });

        // Convert to array and calculate percentages
        const categories = Object.values(categoryTotals).map(category => ({
            ...category,
            percentage: totalExpenses > 0 ? (category.amount / totalExpenses) * 100 : 0
        }));

        // Sort by amount (highest first)
        categories.sort((a, b) => b.amount - a.amount);

        const result = {
            categories,
            totalAmount: totalExpenses,
            timePeriod,
            transactionCount: expenseTransactions.length
        };

        this.setCachedResult(cacheKey, result);
        return result;
    }

    /**
     * Calculate income vs expense summary
     * @param {Array} transactions - Filtered transaction data
     * @param {Object} timePeriod - Time period configuration
     * @returns {Object} Income vs expense summary with totals and net balance
     */
    calculateIncomeVsExpenses(transactions, timePeriod) {
        const cacheKey = `incomeVsExpenses_${JSON.stringify(timePeriod)}`;
        const cached = this.getCachedResult(cacheKey);
        if (cached) return cached;

        const filteredTransactions = this.filterTransactionsByTimePeriod(transactions, timePeriod);
        
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

        const result = {
            totalIncome,
            totalExpenses,
            netBalance,
            incomeCount,
            expenseCount,
            timePeriod,
            averageIncome: incomeCount > 0 ? totalIncome / incomeCount : 0,
            averageExpense: expenseCount > 0 ? totalExpenses / expenseCount : 0
        };

        this.setCachedResult(cacheKey, result);
        return result;
    }

    /**
     * Calculate cost of living summary
     * @param {Array} transactions - Filtered transaction data
     * @param {Object} timePeriod - Time period configuration
     * @returns {Object} Cost of living metrics
     */
    calculateCostOfLiving(transactions, timePeriod) {
        const cacheKey = `costOfLiving_${JSON.stringify(timePeriod)}`;
        const cached = this.getCachedResult(cacheKey);
        if (cached) return cached;

        const incomeVsExpenses = this.calculateIncomeVsExpenses(transactions, timePeriod);
        const categoryBreakdown = this.calculateCategoryBreakdown(transactions, timePeriod);
        
        // Calculate time period duration in days
        const startDate = new Date(timePeriod.startDate);
        const endDate = new Date(timePeriod.endDate);
        const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        
        // Calculate daily averages
        const dailySpending = durationDays > 0 ? incomeVsExpenses.totalExpenses / durationDays : 0;
        const dailyIncome = durationDays > 0 ? incomeVsExpenses.totalIncome / durationDays : 0;
        
        // Estimate monthly values (30-day month)
        const monthlySpending = dailySpending * 30;
        const monthlyIncome = dailyIncome * 30;

        // Identify top spending category
        const topCategory = categoryBreakdown.categories.length > 0 
            ? categoryBreakdown.categories[0] 
            : null;

        const result = {
            totalExpenditure: incomeVsExpenses.totalExpenses,
            dailySpending,
            monthlySpending,
            dailyIncome,
            monthlyIncome,
            durationDays,
            topSpendingCategory: topCategory,
            categoryCount: categoryBreakdown.categories.length,
            timePeriod,
            spendingRate: incomeVsExpenses.totalIncome > 0 
                ? (incomeVsExpenses.totalExpenses / incomeVsExpenses.totalIncome) * 100 
                : 0
        };

        this.setCachedResult(cacheKey, result);
        return result;
    }

    /**
     * Generate spending insights based on transaction patterns
     * @param {Array} transactions - All transaction data (for historical comparison)
     * @param {Object} currentPeriod - Current time period
     * @param {Object} previousPeriod - Previous time period for comparison
     * @returns {Array} Array of insight objects
     */
    generateSpendingInsights(transactions, currentPeriod, previousPeriod = null) {
        const insights = [];
        
        const currentData = this.calculateIncomeVsExpenses(transactions, currentPeriod);
        const currentCategories = this.calculateCategoryBreakdown(transactions, currentPeriod);
        
        // Basic insights about current period
        if (currentData.netBalance > 0) {
            insights.push({
                id: 'positive_balance',
                type: 'positive',
                message: `You saved ${Math.abs(currentData.netBalance).toFixed(2)} this period with a positive balance.`,
                severity: 'low',
                actionable: false
            });
        } else if (currentData.netBalance < 0) {
            insights.push({
                id: 'negative_balance',
                type: 'warning',
                message: `You spent ${Math.abs(currentData.netBalance).toFixed(2)} more than you earned this period.`,
                severity: 'high',
                actionable: true,
                recommendation: 'Consider reviewing your spending in top categories to identify areas for reduction.'
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
                recommendation: topCategory.percentage > 40 
                    ? `Consider if ${topCategory.percentage.toFixed(1)}% spending on "${topCategory.name}" aligns with your financial goals.`
                    : null
            });
        }

        // Compare with previous period if provided
        if (previousPeriod) {
            const previousData = this.calculateIncomeVsExpenses(transactions, previousPeriod);
            const previousCategories = this.calculateCategoryBreakdown(transactions, previousPeriod);
            
            // Income comparison
            const incomeChange = currentData.totalIncome - previousData.totalIncome;
            const incomeChangePercent = previousData.totalIncome > 0 
                ? (incomeChange / previousData.totalIncome) * 100 
                : 0;
                
            if (Math.abs(incomeChangePercent) > 10) {
                insights.push({
                    id: 'income_change',
                    type: incomeChange > 0 ? 'increase' : 'decrease',
                    message: `Your income ${incomeChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(incomeChangePercent).toFixed(1)}% compared to the previous period.`,
                    severity: Math.abs(incomeChangePercent) > 25 ? 'high' : 'medium',
                    actionable: incomeChange < 0
                });
            }
            
            // Expense comparison
            const expenseChange = currentData.totalExpenses - previousData.totalExpenses;
            const expenseChangePercent = previousData.totalExpenses > 0 
                ? (expenseChange / previousData.totalExpenses) * 100 
                : 0;
                
            if (Math.abs(expenseChangePercent) > 15) {
                insights.push({
                    id: 'expense_change',
                    type: expenseChange > 0 ? 'increase' : 'decrease',
                    message: `Your expenses ${expenseChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(expenseChangePercent).toFixed(1)}% compared to the previous period.`,
                    severity: expenseChange > 0 && expenseChangePercent > 25 ? 'high' : 'medium',
                    actionable: expenseChange > 0,
                    recommendation: expenseChange > 0 
                        ? 'Review your recent spending to identify what drove the increase.'
                        : null
                });
            }
        }

        return insights;
    }

    /**
     * Get cached result if still valid
     * @param {string} key - Cache key
     * @returns {*} Cached result or null
     */
    getCachedResult(key) {
        const timestamp = this.cacheTimestamps.get(key);
        if (timestamp && (Date.now() - timestamp) < this.CACHE_DURATION) {
            this.cacheStats.hits++;
            return this.cache.get(key);
        }
        
        // Clean up expired cache entry
        this.cache.delete(key);
        this.cacheTimestamps.delete(key);
        this.cacheStats.misses++;
        return null;
    }

    /**
     * Set cached result with timestamp
     * @param {string} key - Cache key
     * @param {*} result - Result to cache
     */
    setCachedResult(key, result) {
        this.cache.set(key, result);
        this.cacheTimestamps.set(key, Date.now());
        
        // Prevent memory leaks by limiting cache size
        if (this.cache.size > 100) {
            this.cleanupOldestCacheEntries(20);
        }
    }

    /**
     * Clean up oldest cache entries
     * @param {number} count - Number of entries to remove
     */
    cleanupOldestCacheEntries(count) {
        const entries = Array.from(this.cacheTimestamps.entries())
            .sort((a, b) => a[1] - b[1]) // Sort by timestamp (oldest first)
            .slice(0, count);
            
        entries.forEach(([key]) => {
            this.cache.delete(key);
            this.cacheTimestamps.delete(key);
        });
    }

    /**
     * Clear all cached results
     */
    clearCache() {
        this.cache.clear();
        this.cacheTimestamps.clear();
        this.cacheStats.invalidations++;
    }

    /**
     * Invalidate cache entries that match a pattern
     * @param {string} pattern - Pattern to match against cache keys
     */
    invalidateCache(pattern) {
        const keysToDelete = [];
        
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                keysToDelete.push(key);
            }
        }
        
        keysToDelete.forEach(key => {
            this.cache.delete(key);
            this.cacheTimestamps.delete(key);
        });
        
        if (keysToDelete.length > 0) {
            this.cacheStats.invalidations++;
        }
    }

    /**
     * Invalidate cache when new transactions are added
     * This should be called whenever transaction data changes
     */
    invalidateCacheOnDataUpdate() {
        // Invalidate all calculation caches since transaction data changed
        this.invalidateCache('categoryBreakdown');
        this.invalidateCache('incomeVsExpenses');
        this.invalidateCache('costOfLiving');
    }

    /**
     * Get cache statistics for performance monitoring
     * @returns {Object} Cache performance stats
     */
    getCacheStats() {
        return {
            ...this.cacheStats,
            size: this.cache.size,
            hitRate: this.cacheStats.hits + this.cacheStats.misses > 0 
                ? (this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses)) * 100 
                : 0
        };
    }

    /**
     * Reset cache statistics
     */
    resetCacheStats() {
        this.cacheStats = {
            hits: 0,
            misses: 0,
            invalidations: 0
        };
    }
}