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

            // Category-specific insights
            const categoryInsights = this.generateCategoryComparisonInsights(currentCategories, previousCategories);
            insights.push(...categoryInsights);
        }

        // Add spending pattern insights
        const patternInsights = this.analyzeSpendingPatterns(transactions, currentPeriod);
        insights.push(...patternInsights);

        // Add anomaly detection insights
        const anomalyInsights = this.detectSpendingAnomalies(transactions, currentPeriod);
        insights.push(...anomalyInsights);

        return insights;
    }

    /**
     * Analyze spending patterns and generate insights
     * @param {Array} transactions - All transaction data
     * @param {Object} timePeriod - Current time period
     * @returns {Array} Array of pattern-based insights
     */
    analyzeSpendingPatterns(transactions, timePeriod) {
        const insights = [];
        const filteredTransactions = this.filterTransactionsByTimePeriod(transactions, timePeriod);
        const expenseTransactions = filteredTransactions.filter(t => t.type === TRANSACTION_TYPES.EXPENSE);

        if (expenseTransactions.length === 0) {
            return insights;
        }

        // Analyze spending frequency patterns
        const frequencyInsights = this.analyzeSpendingFrequency(expenseTransactions, timePeriod);
        insights.push(...frequencyInsights);

        // Analyze timing patterns (day of week, time of day)
        const timingInsights = this.analyzeSpendingTiming(expenseTransactions);
        insights.push(...timingInsights);

        // Analyze transaction size patterns
        const sizeInsights = this.analyzeTransactionSizes(expenseTransactions);
        insights.push(...sizeInsights);

        return insights;
    }

    /**
     * Analyze spending frequency patterns
     * @param {Array} expenseTransactions - Expense transactions
     * @param {Object} timePeriod - Time period
     * @returns {Array} Frequency-based insights
     */
    analyzeSpendingFrequency(expenseTransactions, timePeriod) {
        const insights = [];
        
        // Calculate average transactions per day
        const startDate = new Date(timePeriod.startDate);
        const endDate = new Date(timePeriod.endDate);
        const durationDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        const avgTransactionsPerDay = expenseTransactions.length / durationDays;

        if (avgTransactionsPerDay > 5) {
            insights.push({
                id: 'high_frequency_spending',
                type: 'pattern',
                message: `You're making ${avgTransactionsPerDay.toFixed(1)} expense transactions per day on average. This suggests frequent small purchases.`,
                severity: 'medium',
                actionable: true,
                recommendation: 'Consider consolidating purchases or setting daily spending limits to reduce transaction frequency.'
            });
        } else if (avgTransactionsPerDay < 1) {
            insights.push({
                id: 'low_frequency_spending',
                type: 'pattern',
                message: `You're making ${avgTransactionsPerDay.toFixed(1)} expense transactions per day on average. This suggests infrequent, larger purchases.`,
                severity: 'low',
                actionable: false
            });
        }

        return insights;
    }

    /**
     * Analyze spending timing patterns
     * @param {Array} expenseTransactions - Expense transactions
     * @returns {Array} Timing-based insights
     */
    analyzeSpendingTiming(expenseTransactions) {
        const insights = [];
        
        // Analyze day of week patterns
        const dayOfWeekCounts = {};
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
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

        // Find the day with highest spending
        const sortedDays = Object.entries(dayOfWeekCounts)
            .sort((a, b) => b[1].amount - a[1].amount);

        if (sortedDays.length > 0) {
            const [topDay, topDayData] = sortedDays[0];
            const totalAmount = Object.values(dayOfWeekCounts).reduce((sum, day) => sum + day.amount, 0);
            const dayPercentage = (topDayData.amount / totalAmount) * 100;

            if (dayPercentage > 30) {
                insights.push({
                    id: 'day_spending_pattern',
                    type: 'pattern',
                    message: `${dayPercentage.toFixed(1)}% of your spending happens on ${topDay}s. This suggests a strong weekly spending pattern.`,
                    severity: 'low',
                    actionable: true,
                    recommendation: `Consider if your ${topDay} spending aligns with your budget goals.`
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
    analyzeTransactionSizes(expenseTransactions) {
        const insights = [];
        
        if (expenseTransactions.length < 3) {
            return insights;
        }

        const amounts = expenseTransactions.map(t => Math.abs(t.amount || 0)).sort((a, b) => a - b);
        const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);
        const averageAmount = totalAmount / amounts.length;
        
        // Calculate median
        const median = amounts.length % 2 === 0
            ? (amounts[amounts.length / 2 - 1] + amounts[amounts.length / 2]) / 2
            : amounts[Math.floor(amounts.length / 2)];

        // Identify small vs large transaction patterns
        const smallTransactions = amounts.filter(amount => amount < averageAmount * 0.5);
        const largeTransactions = amounts.filter(amount => amount > averageAmount * 2);

        if (smallTransactions.length > amounts.length * 0.7) {
            insights.push({
                id: 'small_transaction_pattern',
                type: 'pattern',
                message: `${((smallTransactions.length / amounts.length) * 100).toFixed(1)}% of your transactions are small purchases under ${(averageAmount * 0.5).toFixed(2)}.`,
                severity: 'low',
                actionable: true,
                recommendation: 'Small frequent purchases can add up. Consider tracking these more closely or setting daily limits.'
            });
        }

        if (largeTransactions.length > 0) {
            const largeTransactionTotal = largeTransactions.reduce((sum, amount) => sum + amount, 0);
            const largeTransactionPercentage = (largeTransactionTotal / totalAmount) * 100;
            
            insights.push({
                id: 'large_transaction_pattern',
                type: 'pattern',
                message: `${largeTransactions.length} large transactions (over ${(averageAmount * 2).toFixed(2)}) account for ${largeTransactionPercentage.toFixed(1)}% of your total spending.`,
                severity: 'medium',
                actionable: true,
                recommendation: 'Large transactions have significant impact. Consider if these align with your financial priorities.'
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
    generateCategoryComparisonInsights(currentCategories, previousCategories) {
        const insights = [];
        
        // Create maps for easier comparison
        const currentCategoryMap = new Map();
        const previousCategoryMap = new Map();
        
        currentCategories.categories.forEach(cat => {
            currentCategoryMap.set(cat.name, cat);
        });
        
        previousCategories.categories.forEach(cat => {
            previousCategoryMap.set(cat.name, cat);
        });

        // Find categories with significant changes
        for (const [categoryName, currentCat] of currentCategoryMap) {
            const previousCat = previousCategoryMap.get(categoryName);
            
            if (previousCat) {
                const amountChange = currentCat.amount - previousCat.amount;
                const percentChange = previousCat.amount > 0 
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
                        recommendation: amountChange > 0 
                            ? `Review your recent "${categoryName}" purchases to understand what drove the increase.`
                            : null
                    });
                }
            } else if (currentCat.amount > 20) {
                // New category with significant spending
                insights.push({
                    id: `new_category_${categoryName.toLowerCase().replace(/\s+/g, '_')}`,
                    type: 'pattern',
                    category: categoryName,
                    message: `You started spending in a new category "${categoryName}" with ${currentCat.amount.toFixed(2)} this period.`,
                    severity: 'low',
                    actionable: false
                });
            }
        }

        return insights;
    }

    /**
     * Detect spending anomalies and unusual patterns
     * @param {Array} transactions - All transaction data
     * @param {Object} currentPeriod - Current time period
     * @returns {Array} Anomaly-based insights
     */
    detectSpendingAnomalies(transactions, currentPeriod) {
        const insights = [];
        const filteredTransactions = this.filterTransactionsByTimePeriod(transactions, currentPeriod);
        const expenseTransactions = filteredTransactions.filter(t => t.type === TRANSACTION_TYPES.EXPENSE);

        if (expenseTransactions.length < 5) {
            return insights; // Need sufficient data for anomaly detection
        }

        // Detect spending spikes
        const spikeInsights = this.detectSpendingSpikes(expenseTransactions);
        insights.push(...spikeInsights);

        // Detect unusual category concentrations
        const concentrationInsights = this.detectCategoryConcentration(expenseTransactions);
        insights.push(...concentrationInsights);

        // Detect unusual timing patterns
        const timingAnomalies = this.detectTimingAnomalies(expenseTransactions);
        insights.push(...timingAnomalies);

        return insights;
    }

    /**
     * Detect spending spikes using statistical analysis
     * @param {Array} expenseTransactions - Expense transactions
     * @returns {Array} Spike detection insights
     */
    detectSpendingSpikes(expenseTransactions) {
        const insights = [];
        const amounts = expenseTransactions.map(t => Math.abs(t.amount || 0));
        
        if (amounts.length < 5) {
            return insights;
        }

        // Calculate statistical measures
        const mean = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
        const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / amounts.length;
        const standardDeviation = Math.sqrt(variance);
        
        // Define spike threshold (2 standard deviations above mean)
        const spikeThreshold = mean + (2 * standardDeviation);
        
        // Find transactions that exceed the spike threshold
        const spikes = expenseTransactions.filter(t => Math.abs(t.amount || 0) > spikeThreshold);
        
        if (spikes.length > 0) {
            const totalSpikeAmount = spikes.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
            const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);
            const spikePercentage = (totalSpikeAmount / totalAmount) * 100;
            
            insights.push({
                id: 'spending_spikes',
                type: 'anomaly',
                message: `Detected ${spikes.length} unusually large transaction${spikes.length > 1 ? 's' : ''} totaling ${totalSpikeAmount.toFixed(2)} (${spikePercentage.toFixed(1)}% of total spending).`,
                severity: spikePercentage > 30 ? 'high' : 'medium',
                actionable: true,
                recommendation: 'Review these large transactions to ensure they align with your budget and financial goals.',
                metadata: {
                    spikeTransactions: spikes.map(t => ({
                        amount: t.amount,
                        category: t.category,
                        description: t.description,
                        date: t.date || t.timestamp
                    })),
                    threshold: spikeThreshold
                }
            });
        }

        return insights;
    }

    /**
     * Detect unusual category concentration
     * @param {Array} expenseTransactions - Expense transactions
     * @returns {Array} Category concentration insights
     */
    detectCategoryConcentration(expenseTransactions) {
        const insights = [];
        
        // Calculate category distribution
        const categoryTotals = {};
        let totalAmount = 0;
        
        expenseTransactions.forEach(transaction => {
            const category = transaction.category || 'Uncategorized';
            const amount = Math.abs(transaction.amount || 0);
            
            if (!categoryTotals[category]) {
                categoryTotals[category] = 0;
            }
            categoryTotals[category] += amount;
            totalAmount += amount;
        });

        // Find categories with unusually high concentration
        for (const [category, amount] of Object.entries(categoryTotals)) {
            const percentage = (amount / totalAmount) * 100;
            
            if (percentage > 60) {
                insights.push({
                    id: `high_concentration_${category.toLowerCase().replace(/\s+/g, '_')}`,
                    type: 'anomaly',
                    category: category,
                    message: `Unusually high spending concentration: ${percentage.toFixed(1)}% of your expenses are in "${category}".`,
                    severity: 'high',
                    actionable: true,
                    recommendation: `Consider diversifying your spending or reviewing if this level of "${category}" spending is sustainable.`
                });
            }
        }

        return insights;
    }

    /**
     * Detect unusual timing patterns
     * @param {Array} expenseTransactions - Expense transactions
     * @returns {Array} Timing anomaly insights
     */
    detectTimingAnomalies(expenseTransactions) {
        const insights = [];
        
        // Group transactions by date
        const dailySpending = {};
        
        expenseTransactions.forEach(transaction => {
            const date = new Date(transaction.date || transaction.timestamp);
            const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
            const amount = Math.abs(transaction.amount || 0);
            
            if (!dailySpending[dateKey]) {
                dailySpending[dateKey] = 0;
            }
            dailySpending[dateKey] += amount;
        });

        const dailyAmounts = Object.values(dailySpending);
        
        if (dailyAmounts.length < 3) {
            return insights;
        }

        // Calculate daily spending statistics
        const meanDaily = dailyAmounts.reduce((sum, amount) => sum + amount, 0) / dailyAmounts.length;
        const maxDaily = Math.max(...dailyAmounts);
        
        // Detect days with unusually high spending (more than 3x average)
        if (maxDaily > meanDaily * 3 && maxDaily > 50) {
            const highSpendingDays = Object.entries(dailySpending)
                .filter(([date, amount]) => amount > meanDaily * 3)
                .length;
                
            insights.push({
                id: 'daily_spending_spike',
                type: 'anomaly',
                message: `Detected ${highSpendingDays} day${highSpendingDays > 1 ? 's' : ''} with unusually high spending (over ${(meanDaily * 3).toFixed(2)}).`,
                severity: 'medium',
                actionable: true,
                recommendation: 'Review what caused the high spending on these days to better plan for similar situations.'
            });
        }

        return insights;
    }

    /**
     * Identify top spending categories with detailed analysis
     * @param {Array} transactions - Transaction data
     * @param {Object} timePeriod - Time period
     * @param {number} topN - Number of top categories to return (default: 5)
     * @returns {Object} Top categories analysis
     */
    identifyTopSpendingCategories(transactions, timePeriod, topN = 5) {
        const cacheKey = `topCategories_${JSON.stringify(timePeriod)}_${topN}`;
        const cached = this.getCachedResult(cacheKey);
        if (cached) return cached;

        const categoryBreakdown = this.calculateCategoryBreakdown(transactions, timePeriod);
        
        // Get top N categories
        const topCategories = categoryBreakdown.categories.slice(0, topN);
        
        // Calculate additional metrics for top categories
        const enrichedCategories = topCategories.map(category => {
            const categoryTransactions = this.filterTransactionsByTimePeriod(transactions, timePeriod)
                .filter(t => t.type === TRANSACTION_TYPES.EXPENSE && (t.category || 'Uncategorized') === category.name);
            
            const amounts = categoryTransactions.map(t => Math.abs(t.amount || 0));
            const avgTransactionAmount = amounts.length > 0 
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
                    date: t.date || t.timestamp
                }))
            };
        });

        const result = {
            topCategories: enrichedCategories,
            totalCategoriesAnalyzed: categoryBreakdown.categories.length,
            topCategoriesPercentage: topCategories.reduce((sum, cat) => sum + cat.percentage, 0),
            timePeriod
        };

        this.setCachedResult(cacheKey, result);
        return result;
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