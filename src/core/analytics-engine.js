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

    // ============================================================================
    // PREDICTIVE ANALYTICS SYSTEM
    // Requirements: 6.1, 6.2, 6.3, 6.4, 6.6
    // ============================================================================

    /**
     * Predict future spending based on historical patterns
     * @param {Array} transactions - All historical transaction data
     * @param {number} monthsToPredict - Number of months to predict (default: 3)
     * @param {Object} options - Prediction options
     * @returns {Object} Future spending predictions
     */
    predictFutureSpending(transactions, monthsToPredict = 3, options = {}) {
        const cacheKey = `predictFutureSpending_${monthsToPredict}_${JSON.stringify(options)}`;
        const cached = this.getCachedResult(cacheKey);
        if (cached) return cached;

        // Analyze historical patterns
        const historicalAnalysis = this.analyzeHistoricalPatterns(transactions);
        
        if (!historicalAnalysis.hasEnoughData) {
            return {
                predictions: [],
                confidence: 'low',
                message: 'Insufficient historical data for reliable predictions. Need at least 3 months of transaction history.',
                monthsAnalyzed: historicalAnalysis.monthsAnalyzed,
                hasEnoughData: false
            };
        }

        const predictions = [];
        const currentDate = new Date();

        for (let i = 1; i <= monthsToPredict; i++) {
            const futureDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
            const monthPrediction = this.predictMonthlySpending(historicalAnalysis, futureDate, options);
            predictions.push(monthPrediction);
        }

        // Calculate overall prediction confidence
        const confidence = this.calculatePredictionConfidence(historicalAnalysis, predictions);

        const result = {
            predictions,
            confidence,
            historicalAnalysis: {
                monthsAnalyzed: historicalAnalysis.monthsAnalyzed,
                averageMonthlySpending: historicalAnalysis.averageMonthlySpending,
                spendingTrend: historicalAnalysis.trend,
                seasonalPatterns: historicalAnalysis.seasonalPatterns
            },
            hasEnoughData: true,
            generatedAt: new Date().toISOString()
        };

        this.setCachedResult(cacheKey, result);
        return result;
    }

    /**
     * Analyze historical spending patterns for prediction
     * @param {Array} transactions - All transaction data
     * @returns {Object} Historical pattern analysis
     */
    analyzeHistoricalPatterns(transactions) {
        const expenseTransactions = transactions.filter(t => t.type === TRANSACTION_TYPES.EXPENSE);
        
        if (expenseTransactions.length === 0) {
            return { hasEnoughData: false, monthsAnalyzed: 0 };
        }

        // Group transactions by month
        const monthlyData = this.groupTransactionsByMonth(expenseTransactions);
        const monthsAnalyzed = Object.keys(monthlyData).length;

        if (monthsAnalyzed < 3) {
            return { hasEnoughData: false, monthsAnalyzed };
        }

        // Calculate monthly spending totals
        const monthlySpending = Object.entries(monthlyData).map(([monthKey, transactions]) => {
            const totalSpending = transactions.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
            const [year, month] = monthKey.split('-').map(Number);
            
            return {
                year,
                month,
                monthKey,
                totalSpending,
                transactionCount: transactions.length,
                categoryBreakdown: this.calculateMonthlyCategories(transactions)
            };
        }).sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
        });

        // Calculate trend analysis
        const trend = this.calculateSpendingTrend(monthlySpending);
        
        // Calculate seasonal patterns
        const seasonalPatterns = this.detectSeasonalPatterns(monthlySpending);
        
        // Calculate average monthly spending
        const totalSpending = monthlySpending.reduce((sum, month) => sum + month.totalSpending, 0);
        const averageMonthlySpending = totalSpending / monthlySpending.length;

        // Calculate spending volatility
        const variance = monthlySpending.reduce((sum, month) => {
            return sum + Math.pow(month.totalSpending - averageMonthlySpending, 2);
        }, 0) / monthlySpending.length;
        const volatility = Math.sqrt(variance);

        return {
            hasEnoughData: true,
            monthsAnalyzed,
            monthlySpending,
            averageMonthlySpending,
            volatility,
            trend,
            seasonalPatterns,
            categoryPatterns: this.analyzeCategoryPatterns(monthlySpending)
        };
    }

    /**
     * Group transactions by month (YYYY-MM format)
     * @param {Array} transactions - Transaction data
     * @returns {Object} Transactions grouped by month
     */
    groupTransactionsByMonth(transactions) {
        const monthlyData = {};

        transactions.forEach(transaction => {
            const date = new Date(transaction.date || transaction.timestamp);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = [];
            }
            monthlyData[monthKey].push(transaction);
        });

        return monthlyData;
    }

    /**
     * Calculate monthly category breakdown
     * @param {Array} transactions - Monthly transactions
     * @returns {Object} Category breakdown for the month
     */
    calculateMonthlyCategories(transactions) {
        const categoryTotals = {};
        let totalAmount = 0;

        transactions.forEach(transaction => {
            const category = transaction.category || 'Uncategorized';
            const amount = Math.abs(transaction.amount || 0);
            
            if (!categoryTotals[category]) {
                categoryTotals[category] = 0;
            }
            categoryTotals[category] += amount;
            totalAmount += amount;
        });

        // Convert to percentages
        const categoryBreakdown = {};
        for (const [category, amount] of Object.entries(categoryTotals)) {
            categoryBreakdown[category] = {
                amount,
                percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0
            };
        }

        return categoryBreakdown;
    }

    /**
     * Calculate spending trend using linear regression
     * @param {Array} monthlySpending - Monthly spending data
     * @returns {Object} Trend analysis
     */
    calculateSpendingTrend(monthlySpending) {
        if (monthlySpending.length < 2) {
            return { slope: 0, direction: 'stable', confidence: 'low' };
        }

        // Simple linear regression
        const n = monthlySpending.length;
        const x = monthlySpending.map((_, index) => index);
        const y = monthlySpending.map(month => month.totalSpending);
        
        const sumX = x.reduce((sum, val) => sum + val, 0);
        const sumY = y.reduce((sum, val) => sum + val, 0);
        const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
        const sumXX = x.reduce((sum, val) => sum + val * val, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // Calculate R-squared for trend confidence
        const yMean = sumY / n;
        const totalSumSquares = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
        const residualSumSquares = y.reduce((sum, val, i) => {
            const predicted = slope * x[i] + intercept;
            return sum + Math.pow(val - predicted, 2);
        }, 0);
        
        const rSquared = totalSumSquares > 0 ? 1 - (residualSumSquares / totalSumSquares) : 0;
        
        // Determine trend direction and confidence
        let direction = 'stable';
        if (Math.abs(slope) > 10) { // Significant change threshold
            direction = slope > 0 ? 'increasing' : 'decreasing';
        }
        
        let confidence = 'low';
        if (rSquared > 0.7) confidence = 'high';
        else if (rSquared > 0.4) confidence = 'medium';

        return {
            slope,
            intercept,
            rSquared,
            direction,
            confidence,
            monthlyChange: slope,
            projectedChange: slope * 12 // Annual change projection
        };
    }

    /**
     * Detect seasonal spending patterns
     * @param {Array} monthlySpending - Monthly spending data
     * @returns {Object} Seasonal pattern analysis
     */
    detectSeasonalPatterns(monthlySpending) {
        const seasonalData = {
            spring: [], // Mar, Apr, May
            summer: [], // Jun, Jul, Aug
            fall: [],   // Sep, Oct, Nov
            winter: []  // Dec, Jan, Feb
        };

        monthlySpending.forEach(monthData => {
            const month = monthData.month;
            let season;
            
            if (month >= 3 && month <= 5) season = 'spring';
            else if (month >= 6 && month <= 8) season = 'summer';
            else if (month >= 9 && month <= 11) season = 'fall';
            else season = 'winter';
            
            seasonalData[season].push(monthData.totalSpending);
        });

        // Calculate seasonal averages
        const seasonalAverages = {};
        const seasonalPatterns = {};
        
        for (const [season, amounts] of Object.entries(seasonalData)) {
            if (amounts.length > 0) {
                const average = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
                const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - average, 2), 0) / amounts.length;
                
                seasonalAverages[season] = average;
                seasonalPatterns[season] = {
                    average,
                    variance: variance,
                    standardDeviation: Math.sqrt(variance),
                    dataPoints: amounts.length
                };
            }
        }

        // Find the season with highest/lowest spending
        const seasons = Object.entries(seasonalAverages);
        if (seasons.length === 0) {
            return { hasPatterns: false };
        }

        const highestSeason = seasons.reduce((max, [season, avg]) => 
            avg > max.average ? { season, average: avg } : max, 
            { season: seasons[0][0], average: seasons[0][1] }
        );
        
        const lowestSeason = seasons.reduce((min, [season, avg]) => 
            avg < min.average ? { season, average: avg } : min,
            { season: seasons[0][0], average: seasons[0][1] }
        );

        return {
            hasPatterns: seasons.length >= 2,
            seasonalAverages,
            seasonalPatterns,
            highestSpendingSeason: highestSeason,
            lowestSpendingSeason: lowestSeason,
            seasonalVariation: highestSeason.average - lowestSeason.average
        };
    }

    /**
     * Analyze category spending patterns over time
     * @param {Array} monthlySpending - Monthly spending data
     * @returns {Object} Category pattern analysis
     */
    analyzeCategoryPatterns(monthlySpending) {
        const categoryTrends = {};
        
        // Collect category data across months
        monthlySpending.forEach((monthData, monthIndex) => {
            for (const [category, data] of Object.entries(monthData.categoryBreakdown)) {
                if (!categoryTrends[category]) {
                    categoryTrends[category] = [];
                }
                categoryTrends[category].push({
                    month: monthIndex,
                    amount: data.amount,
                    percentage: data.percentage
                });
            }
        });

        // Calculate trends for each category
        const categoryAnalysis = {};
        for (const [category, data] of Object.entries(categoryTrends)) {
            if (data.length >= 2) {
                const amounts = data.map(d => d.amount);
                const avgAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
                
                // Simple trend calculation
                const firstHalf = amounts.slice(0, Math.ceil(amounts.length / 2));
                const secondHalf = amounts.slice(Math.floor(amounts.length / 2));
                
                const firstHalfAvg = firstHalf.reduce((sum, amount) => sum + amount, 0) / firstHalf.length;
                const secondHalfAvg = secondHalf.reduce((sum, amount) => sum + amount, 0) / secondHalf.length;
                
                const trendDirection = secondHalfAvg > firstHalfAvg * 1.1 ? 'increasing' :
                                     secondHalfAvg < firstHalfAvg * 0.9 ? 'decreasing' : 'stable';

                categoryAnalysis[category] = {
                    averageAmount: avgAmount,
                    trendDirection,
                    dataPoints: data.length,
                    volatility: this.calculateCategoryVolatility(amounts)
                };
            }
        }

        return categoryAnalysis;
    }

    /**
     * Calculate volatility for a category
     * @param {Array} amounts - Category amounts over time
     * @returns {number} Volatility measure
     */
    calculateCategoryVolatility(amounts) {
        if (amounts.length < 2) return 0;
        
        const mean = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
        const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / amounts.length;
        
        return mean > 0 ? Math.sqrt(variance) / mean : 0; // Coefficient of variation
    }

    /**
     * Predict spending for a specific month
     * @param {Object} historicalAnalysis - Historical pattern analysis
     * @param {Date} targetDate - Target month to predict
     * @param {Object} options - Prediction options
     * @returns {Object} Monthly prediction
     */
    predictMonthlySpending(historicalAnalysis, targetDate, options = {}) {
        const targetMonth = targetDate.getMonth() + 1;
        const targetYear = targetDate.getFullYear();
        
        // Base prediction on trend
        const monthsFromNow = this.calculateMonthsFromNow(targetDate);
        let basePrediction = historicalAnalysis.averageMonthlySpending + 
                           (historicalAnalysis.trend.slope * monthsFromNow);

        // Apply seasonal adjustment if patterns exist
        if (historicalAnalysis.seasonalPatterns.hasPatterns) {
            const seasonalAdjustment = this.getSeasonalAdjustment(targetMonth, historicalAnalysis.seasonalPatterns);
            basePrediction = basePrediction * seasonalAdjustment;
        }

        // Ensure prediction is not negative
        basePrediction = Math.max(0, basePrediction);

        // Calculate prediction range based on historical volatility
        const confidenceInterval = historicalAnalysis.volatility * 1.96; // 95% confidence interval
        const lowerBound = Math.max(0, basePrediction - confidenceInterval);
        const upperBound = basePrediction + confidenceInterval;

        // Predict category breakdown
        const categoryPredictions = this.predictCategoryBreakdown(historicalAnalysis, basePrediction);

        return {
            year: targetYear,
            month: targetMonth,
            monthName: new Date(targetYear, targetMonth - 1).toLocaleString('default', { month: 'long' }),
            predictedAmount: Math.round(basePrediction * 100) / 100,
            lowerBound: Math.round(lowerBound * 100) / 100,
            upperBound: Math.round(upperBound * 100) / 100,
            confidence: this.calculateMonthlyPredictionConfidence(historicalAnalysis, monthsFromNow),
            categoryPredictions,
            factors: {
                baseTrend: historicalAnalysis.trend.slope * monthsFromNow,
                seasonalAdjustment: historicalAnalysis.seasonalPatterns.hasPatterns,
                historicalAverage: historicalAnalysis.averageMonthlySpending
            }
        };
    }

    /**
     * Calculate months from current date
     * @param {Date} targetDate - Target date
     * @returns {number} Number of months from now
     */
    calculateMonthsFromNow(targetDate) {
        const now = new Date();
        const yearDiff = targetDate.getFullYear() - now.getFullYear();
        const monthDiff = targetDate.getMonth() - now.getMonth();
        return yearDiff * 12 + monthDiff;
    }

    /**
     * Get seasonal adjustment factor
     * @param {number} month - Target month (1-12)
     * @param {Object} seasonalPatterns - Seasonal pattern data
     * @returns {number} Adjustment factor
     */
    getSeasonalAdjustment(month, seasonalPatterns) {
        let season;
        if (month >= 3 && month <= 5) season = 'spring';
        else if (month >= 6 && month <= 8) season = 'summer';
        else if (month >= 9 && month <= 11) season = 'fall';
        else season = 'winter';

        const overallAverage = Object.values(seasonalPatterns.seasonalAverages)
            .reduce((sum, avg) => sum + avg, 0) / Object.keys(seasonalPatterns.seasonalAverages).length;

        const seasonalAverage = seasonalPatterns.seasonalAverages[season];
        
        return seasonalAverage && overallAverage > 0 ? seasonalAverage / overallAverage : 1.0;
    }

    /**
     * Predict category breakdown for a month
     * @param {Object} historicalAnalysis - Historical analysis
     * @param {number} totalPredictedAmount - Total predicted spending
     * @returns {Array} Category predictions
     */
    predictCategoryBreakdown(historicalAnalysis, totalPredictedAmount) {
        const categoryPatterns = historicalAnalysis.categoryPatterns;
        const predictions = [];

        for (const [category, pattern] of Object.entries(categoryPatterns)) {
            let predictedAmount = pattern.averageAmount;
            
            // Apply trend adjustment
            if (pattern.trendDirection === 'increasing') {
                predictedAmount *= 1.1; // 10% increase
            } else if (pattern.trendDirection === 'decreasing') {
                predictedAmount *= 0.9; // 10% decrease
            }

            const predictedPercentage = totalPredictedAmount > 0 
                ? (predictedAmount / totalPredictedAmount) * 100 
                : 0;

            predictions.push({
                category,
                predictedAmount: Math.round(predictedAmount * 100) / 100,
                predictedPercentage: Math.round(predictedPercentage * 100) / 100,
                trend: pattern.trendDirection,
                confidence: pattern.volatility < 0.3 ? 'high' : pattern.volatility < 0.6 ? 'medium' : 'low'
            });
        }

        // Sort by predicted amount
        predictions.sort((a, b) => b.predictedAmount - a.predictedAmount);

        return predictions;
    }

    /**
     * Calculate prediction confidence for a specific month
     * @param {Object} historicalAnalysis - Historical analysis
     * @param {number} monthsFromNow - Months into the future
     * @returns {string} Confidence level
     */
    calculateMonthlyPredictionConfidence(historicalAnalysis, monthsFromNow) {
        let confidence = 'medium';
        
        // Factors that increase confidence
        const hasGoodTrend = historicalAnalysis.trend.confidence === 'high';
        const hasSeasonalData = historicalAnalysis.seasonalPatterns.hasPatterns;
        const hasEnoughData = historicalAnalysis.monthsAnalyzed >= 6;
        const lowVolatility = historicalAnalysis.volatility < historicalAnalysis.averageMonthlySpending * 0.3;
        
        // Factors that decrease confidence
        const farIntoFuture = monthsFromNow > 6;
        const highVolatility = historicalAnalysis.volatility > historicalAnalysis.averageMonthlySpending * 0.5;
        
        const positiveFactors = [hasGoodTrend, hasSeasonalData, hasEnoughData, lowVolatility].filter(Boolean).length;
        const negativeFactors = [farIntoFuture, highVolatility].filter(Boolean).length;
        
        if (positiveFactors >= 3 && negativeFactors === 0) {
            confidence = 'high';
        } else if (positiveFactors <= 1 || negativeFactors >= 2) {
            confidence = 'low';
        }
        
        return confidence;
    }

    // ============================================================================
    // HISTORICAL DATA COMPARISON SYSTEM
    // Requirements: 5.1, 5.2, 5.3, 5.4
    // ============================================================================

    /**
     * Compare spending patterns between different time periods
     * @param {Array} transactions - All transaction data
     * @param {Object} currentPeriod - Current time period
     * @param {Object} comparisonPeriod - Period to compare against
     * @param {Object} options - Comparison options
     * @returns {Object} Detailed period comparison
     */
    comparePeriodsSpending(transactions, currentPeriod, comparisonPeriod, options = {}) {
        const cacheKey = `comparePeriodsSpending_${JSON.stringify(currentPeriod)}_${JSON.stringify(comparisonPeriod)}`;
        const cached = this.getCachedResult(cacheKey);
        if (cached) return cached;

        // Get data for both periods
        const currentData = {
            incomeVsExpenses: this.calculateIncomeVsExpenses(transactions, currentPeriod),
            categoryBreakdown: this.calculateCategoryBreakdown(transactions, currentPeriod),
            costOfLiving: this.calculateCostOfLiving(transactions, currentPeriod)
        };

        const comparisonData = {
            incomeVsExpenses: this.calculateIncomeVsExpenses(transactions, comparisonPeriod),
            categoryBreakdown: this.calculateCategoryBreakdown(transactions, comparisonPeriod),
            costOfLiving: this.calculateCostOfLiving(transactions, comparisonPeriod)
        };

        // Calculate overall financial metrics comparison
        const overallComparison = this.calculateOverallComparison(currentData, comparisonData);
        
        // Calculate category-level comparisons
        const categoryComparison = this.calculateCategoryComparison(
            currentData.categoryBreakdown, 
            comparisonData.categoryBreakdown
        );

        // Calculate spending behavior changes
        const behaviorChanges = this.analyzeBehaviorChanges(transactions, currentPeriod, comparisonPeriod);

        // Generate comparison insights
        const comparisonInsights = this.generateComparisonInsights(
            overallComparison, 
            categoryComparison, 
            behaviorChanges
        );

        const result = {
            currentPeriod,
            comparisonPeriod,
            overallComparison,
            categoryComparison,
            behaviorChanges,
            insights: comparisonInsights,
            summary: this.generateComparisonSummary(overallComparison, categoryComparison),
            generatedAt: new Date().toISOString()
        };

        this.setCachedResult(cacheKey, result);
        return result;
    }

    /**
     * Calculate overall financial metrics comparison
     * @param {Object} currentData - Current period data
     * @param {Object} comparisonData - Comparison period data
     * @returns {Object} Overall comparison metrics
     */
    calculateOverallComparison(currentData, comparisonData) {
        const current = currentData.incomeVsExpenses;
        const comparison = comparisonData.incomeVsExpenses;

        // Income comparison
        const incomeChange = current.totalIncome - comparison.totalIncome;
        const incomeChangePercent = comparison.totalIncome > 0 
            ? (incomeChange / comparison.totalIncome) * 100 
            : 0;

        // Expense comparison
        const expenseChange = current.totalExpenses - comparison.totalExpenses;
        const expenseChangePercent = comparison.totalExpenses > 0 
            ? (expenseChange / comparison.totalExpenses) * 100 
            : 0;

        // Net balance comparison
        const balanceChange = current.netBalance - comparison.netBalance;
        const balanceChangePercent = comparison.netBalance !== 0 
            ? (balanceChange / Math.abs(comparison.netBalance)) * 100 
            : 0;

        // Transaction count comparison
        const transactionCountChange = current.expenseCount - comparison.expenseCount;
        const transactionCountChangePercent = comparison.expenseCount > 0 
            ? (transactionCountChange / comparison.expenseCount) * 100 
            : 0;

        // Average transaction size comparison
        const avgTransactionChange = current.averageExpense - comparison.averageExpense;
        const avgTransactionChangePercent = comparison.averageExpense > 0 
            ? (avgTransactionChange / comparison.averageExpense) * 100 
            : 0;

        return {
            income: {
                current: current.totalIncome,
                comparison: comparison.totalIncome,
                change: incomeChange,
                changePercent: incomeChangePercent,
                trend: incomeChange > 0 ? 'increased' : incomeChange < 0 ? 'decreased' : 'stable'
            },
            expenses: {
                current: current.totalExpenses,
                comparison: comparison.totalExpenses,
                change: expenseChange,
                changePercent: expenseChangePercent,
                trend: expenseChange > 0 ? 'increased' : expenseChange < 0 ? 'decreased' : 'stable'
            },
            netBalance: {
                current: current.netBalance,
                comparison: comparison.netBalance,
                change: balanceChange,
                changePercent: balanceChangePercent,
                trend: balanceChange > 0 ? 'improved' : balanceChange < 0 ? 'worsened' : 'stable'
            },
            transactionCount: {
                current: current.expenseCount,
                comparison: comparison.expenseCount,
                change: transactionCountChange,
                changePercent: transactionCountChangePercent,
                trend: transactionCountChange > 0 ? 'increased' : transactionCountChange < 0 ? 'decreased' : 'stable'
            },
            averageTransaction: {
                current: current.averageExpense,
                comparison: comparison.averageExpense,
                change: avgTransactionChange,
                changePercent: avgTransactionChangePercent,
                trend: avgTransactionChange > 0 ? 'increased' : avgTransactionChange < 0 ? 'decreased' : 'stable'
            }
        };
    }

    /**
     * Calculate category-level comparison
     * @param {Object} currentCategories - Current period categories
     * @param {Object} comparisonCategories - Comparison period categories
     * @returns {Object} Category comparison analysis
     */
    calculateCategoryComparison(currentCategories, comparisonCategories) {
        const currentCategoryMap = new Map();
        const comparisonCategoryMap = new Map();

        // Create maps for easier lookup
        currentCategories.categories.forEach(cat => {
            currentCategoryMap.set(cat.name, cat);
        });

        comparisonCategories.categories.forEach(cat => {
            comparisonCategoryMap.set(cat.name, cat);
        });

        // Get all unique categories
        const allCategories = new Set([
            ...currentCategoryMap.keys(),
            ...comparisonCategoryMap.keys()
        ]);

        const categoryChanges = [];
        const newCategories = [];
        const disappearedCategories = [];

        for (const categoryName of allCategories) {
            const currentCat = currentCategoryMap.get(categoryName);
            const comparisonCat = comparisonCategoryMap.get(categoryName);

            if (currentCat && comparisonCat) {
                // Category exists in both periods
                const amountChange = currentCat.amount - comparisonCat.amount;
                const amountChangePercent = comparisonCat.amount > 0 
                    ? (amountChange / comparisonCat.amount) * 100 
                    : 0;

                const percentagePointChange = currentCat.percentage - comparisonCat.percentage;

                categoryChanges.push({
                    category: categoryName,
                    current: {
                        amount: currentCat.amount,
                        percentage: currentCat.percentage,
                        transactionCount: currentCat.transactionCount
                    },
                    comparison: {
                        amount: comparisonCat.amount,
                        percentage: comparisonCat.percentage,
                        transactionCount: comparisonCat.transactionCount
                    },
                    changes: {
                        amount: amountChange,
                        amountPercent: amountChangePercent,
                        percentagePoints: percentagePointChange,
                        transactionCount: currentCat.transactionCount - comparisonCat.transactionCount
                    },
                    trend: amountChange > 0 ? 'increased' : amountChange < 0 ? 'decreased' : 'stable',
                    significance: Math.abs(amountChangePercent) > 25 ? 'high' : 
                                 Math.abs(amountChangePercent) > 10 ? 'medium' : 'low'
                });
            } else if (currentCat && !comparisonCat) {
                // New category in current period
                newCategories.push({
                    category: categoryName,
                    amount: currentCat.amount,
                    percentage: currentCat.percentage,
                    transactionCount: currentCat.transactionCount
                });
            } else if (!currentCat && comparisonCat) {
                // Category disappeared in current period
                disappearedCategories.push({
                    category: categoryName,
                    amount: comparisonCat.amount,
                    percentage: comparisonCat.percentage,
                    transactionCount: comparisonCat.transactionCount
                });
            }
        }

        // Sort category changes by significance
        categoryChanges.sort((a, b) => {
            const significanceOrder = { high: 3, medium: 2, low: 1 };
            if (significanceOrder[a.significance] !== significanceOrder[b.significance]) {
                return significanceOrder[b.significance] - significanceOrder[a.significance];
            }
            return Math.abs(b.changes.amountPercent) - Math.abs(a.changes.amountPercent);
        });

        return {
            categoryChanges,
            newCategories,
            disappearedCategories,
            totalCategoriesCompared: categoryChanges.length,
            significantChanges: categoryChanges.filter(c => c.significance === 'high').length
        };
    }

    /**
     * Analyze spending behavior changes between periods
     * @param {Array} transactions - All transaction data
     * @param {Object} currentPeriod - Current period
     * @param {Object} comparisonPeriod - Comparison period
     * @returns {Object} Behavior change analysis
     */
    analyzeBehaviorChanges(transactions, currentPeriod, comparisonPeriod) {
        const currentTransactions = this.filterTransactionsByTimePeriod(transactions, currentPeriod)
            .filter(t => t.type === TRANSACTION_TYPES.EXPENSE);
        const comparisonTransactions = this.filterTransactionsByTimePeriod(transactions, comparisonPeriod)
            .filter(t => t.type === TRANSACTION_TYPES.EXPENSE);

        // Analyze spending frequency patterns
        const frequencyChanges = this.analyzeFrequencyChanges(currentTransactions, comparisonTransactions, currentPeriod, comparisonPeriod);
        
        // Analyze spending timing patterns
        const timingChanges = this.analyzeTimingChanges(currentTransactions, comparisonTransactions);
        
        // Analyze transaction size patterns
        const sizeChanges = this.analyzeSizeChanges(currentTransactions, comparisonTransactions);

        return {
            frequencyChanges,
            timingChanges,
            sizeChanges,
            summary: this.generateBehaviorChangeSummary(frequencyChanges, timingChanges, sizeChanges)
        };
    }

    /**
     * Analyze changes in spending frequency
     * @param {Array} currentTransactions - Current period transactions
     * @param {Array} comparisonTransactions - Comparison period transactions
     * @param {Object} currentPeriod - Current period
     * @param {Object} comparisonPeriod - Comparison period
     * @returns {Object} Frequency change analysis
     */
    analyzeFrequencyChanges(currentTransactions, comparisonTransactions, currentPeriod, comparisonPeriod) {
        // Calculate days in each period
        const currentDays = Math.ceil((new Date(currentPeriod.endDate) - new Date(currentPeriod.startDate)) / (1000 * 60 * 60 * 24)) + 1;
        const comparisonDays = Math.ceil((new Date(comparisonPeriod.endDate) - new Date(comparisonPeriod.startDate)) / (1000 * 60 * 60 * 24)) + 1;

        const currentFrequency = currentTransactions.length / currentDays;
        const comparisonFrequency = comparisonTransactions.length / comparisonDays;
        
        const frequencyChange = currentFrequency - comparisonFrequency;
        const frequencyChangePercent = comparisonFrequency > 0 
            ? (frequencyChange / comparisonFrequency) * 100 
            : 0;

        return {
            current: {
                transactionsPerDay: currentFrequency,
                totalTransactions: currentTransactions.length,
                totalDays: currentDays
            },
            comparison: {
                transactionsPerDay: comparisonFrequency,
                totalTransactions: comparisonTransactions.length,
                totalDays: comparisonDays
            },
            change: frequencyChange,
            changePercent: frequencyChangePercent,
            trend: frequencyChange > 0 ? 'more_frequent' : frequencyChange < 0 ? 'less_frequent' : 'stable',
            significance: Math.abs(frequencyChangePercent) > 25 ? 'high' : 
                         Math.abs(frequencyChangePercent) > 10 ? 'medium' : 'low'
        };
    }

    /**
     * Analyze changes in spending timing patterns
     * @param {Array} currentTransactions - Current period transactions
     * @param {Array} comparisonTransactions - Comparison period transactions
     * @returns {Object} Timing change analysis
     */
    analyzeTimingChanges(currentTransactions, comparisonTransactions) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        // Analyze day of week patterns
        const currentDayPattern = this.calculateDayOfWeekPattern(currentTransactions);
        const comparisonDayPattern = this.calculateDayOfWeekPattern(comparisonTransactions);

        const dayOfWeekChanges = {};
        for (const day of dayNames) {
            const currentPercent = currentDayPattern[day] || 0;
            const comparisonPercent = comparisonDayPattern[day] || 0;
            const change = currentPercent - comparisonPercent;

            dayOfWeekChanges[day] = {
                current: currentPercent,
                comparison: comparisonPercent,
                change: change,
                trend: change > 5 ? 'increased' : change < -5 ? 'decreased' : 'stable'
            };
        }

        // Find the most significant day changes
        const significantDayChanges = Object.entries(dayOfWeekChanges)
            .filter(([day, data]) => Math.abs(data.change) > 10)
            .sort((a, b) => Math.abs(b[1].change) - Math.abs(a[1].change));

        return {
            dayOfWeekChanges,
            significantDayChanges: significantDayChanges.map(([day, data]) => ({
                day,
                ...data
            })),
            hasSignificantTimingChanges: significantDayChanges.length > 0
        };
    }

    /**
     * Calculate day of week spending pattern
     * @param {Array} transactions - Transactions to analyze
     * @returns {Object} Day of week percentages
     */
    calculateDayOfWeekPattern(transactions) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayCounts = {};
        
        transactions.forEach(transaction => {
            const date = new Date(transaction.date || transaction.timestamp);
            const dayName = dayNames[date.getDay()];
            dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
        });

        const total = transactions.length;
        const dayPercentages = {};
        
        for (const day of dayNames) {
            dayPercentages[day] = total > 0 ? ((dayCounts[day] || 0) / total) * 100 : 0;
        }

        return dayPercentages;
    }

    /**
     * Analyze changes in transaction size patterns
     * @param {Array} currentTransactions - Current period transactions
     * @param {Array} comparisonTransactions - Comparison period transactions
     * @returns {Object} Size change analysis
     */
    analyzeSizeChanges(currentTransactions, comparisonTransactions) {
        const currentAmounts = currentTransactions.map(t => Math.abs(t.amount || 0));
        const comparisonAmounts = comparisonTransactions.map(t => Math.abs(t.amount || 0));

        if (currentAmounts.length === 0 || comparisonAmounts.length === 0) {
            return { hasData: false };
        }

        // Calculate statistics for both periods
        const currentStats = this.calculateTransactionSizeStats(currentAmounts);
        const comparisonStats = this.calculateTransactionSizeStats(comparisonAmounts);

        // Calculate changes
        const averageChange = currentStats.average - comparisonStats.average;
        const averageChangePercent = comparisonStats.average > 0 
            ? (averageChange / comparisonStats.average) * 100 
            : 0;

        const medianChange = currentStats.median - comparisonStats.median;
        const medianChangePercent = comparisonStats.median > 0 
            ? (medianChange / comparisonStats.median) * 100 
            : 0;

        return {
            hasData: true,
            current: currentStats,
            comparison: comparisonStats,
            changes: {
                average: averageChange,
                averagePercent: averageChangePercent,
                median: medianChange,
                medianPercent: medianChangePercent
            },
            trends: {
                average: averageChange > 0 ? 'increased' : averageChange < 0 ? 'decreased' : 'stable',
                median: medianChange > 0 ? 'increased' : medianChange < 0 ? 'decreased' : 'stable'
            },
            significance: Math.abs(averageChangePercent) > 20 ? 'high' : 
                         Math.abs(averageChangePercent) > 10 ? 'medium' : 'low'
        };
    }

    /**
     * Calculate transaction size statistics
     * @param {Array} amounts - Transaction amounts
     * @returns {Object} Size statistics
     */
    calculateTransactionSizeStats(amounts) {
        if (amounts.length === 0) {
            return { average: 0, median: 0, min: 0, max: 0, count: 0 };
        }

        const sortedAmounts = [...amounts].sort((a, b) => a - b);
        const total = amounts.reduce((sum, amount) => sum + amount, 0);
        const average = total / amounts.length;
        
        const median = amounts.length % 2 === 0
            ? (sortedAmounts[amounts.length / 2 - 1] + sortedAmounts[amounts.length / 2]) / 2
            : sortedAmounts[Math.floor(amounts.length / 2)];

        return {
            average,
            median,
            min: Math.min(...amounts),
            max: Math.max(...amounts),
            count: amounts.length,
            total
        };
    }

    /**
     * Generate behavior change summary
     * @param {Object} frequencyChanges - Frequency change data
     * @param {Object} timingChanges - Timing change data
     * @param {Object} sizeChanges - Size change data
     * @returns {Object} Behavior change summary
     */
    generateBehaviorChangeSummary(frequencyChanges, timingChanges, sizeChanges) {
        const changes = [];

        // Frequency changes
        if (frequencyChanges.significance !== 'low') {
            changes.push({
                type: 'frequency',
                description: `Spending frequency ${frequencyChanges.trend.replace('_', ' ')} by ${Math.abs(frequencyChanges.changePercent).toFixed(1)}%`,
                significance: frequencyChanges.significance
            });
        }

        // Timing changes
        if (timingChanges.hasSignificantTimingChanges) {
            const topTimingChange = timingChanges.significantDayChanges[0];
            changes.push({
                type: 'timing',
                description: `${topTimingChange.day} spending ${topTimingChange.trend} by ${Math.abs(topTimingChange.change).toFixed(1)} percentage points`,
                significance: 'medium'
            });
        }

        // Size changes
        if (sizeChanges.hasData && sizeChanges.significance !== 'low') {
            changes.push({
                type: 'transaction_size',
                description: `Average transaction size ${sizeChanges.trends.average} by ${Math.abs(sizeChanges.changes.averagePercent).toFixed(1)}%`,
                significance: sizeChanges.significance
            });
        }

        return {
            changes,
            hasSignificantChanges: changes.length > 0,
            changeCount: changes.length
        };
    }

    /**
     * Generate comparison insights
     * @param {Object} overallComparison - Overall comparison data
     * @param {Object} categoryComparison - Category comparison data
     * @param {Object} behaviorChanges - Behavior change data
     * @returns {Array} Comparison insights
     */
    generateComparisonInsights(overallComparison, categoryComparison, behaviorChanges) {
        const insights = [];

        // Overall financial health insights
        if (Math.abs(overallComparison.netBalance.changePercent) > 15) {
            insights.push({
                id: 'net_balance_change',
                type: overallComparison.netBalance.trend === 'improved' ? 'positive' : 'warning',
                message: `Your net balance ${overallComparison.netBalance.trend} by ${Math.abs(overallComparison.netBalance.changePercent).toFixed(1)}% compared to the previous period.`,
                severity: Math.abs(overallComparison.netBalance.changePercent) > 30 ? 'high' : 'medium',
                actionable: overallComparison.netBalance.trend === 'worsened'
            });
        }

        // Expense trend insights
        if (Math.abs(overallComparison.expenses.changePercent) > 10) {
            insights.push({
                id: 'expense_trend',
                type: overallComparison.expenses.trend === 'increased' ? 'warning' : 'positive',
                message: `Your total expenses ${overallComparison.expenses.trend} by ${Math.abs(overallComparison.expenses.changePercent).toFixed(1)}% (${Math.abs(overallComparison.expenses.change).toFixed(2)}).`,
                severity: overallComparison.expenses.trend === 'increased' && overallComparison.expenses.changePercent > 25 ? 'high' : 'medium',
                actionable: overallComparison.expenses.trend === 'increased'
            });
        }

        // Category-specific insights
        const significantCategoryChanges = categoryComparison.categoryChanges.filter(c => c.significance === 'high');
        significantCategoryChanges.slice(0, 3).forEach(categoryChange => {
            insights.push({
                id: `category_change_${categoryChange.category.toLowerCase().replace(/\s+/g, '_')}`,
                type: categoryChange.trend === 'increased' ? 'warning' : 'positive',
                category: categoryChange.category,
                message: `"${categoryChange.category}" spending ${categoryChange.trend} significantly by ${Math.abs(categoryChange.changes.amountPercent).toFixed(1)}% (${Math.abs(categoryChange.changes.amount).toFixed(2)}).`,
                severity: 'high',
                actionable: categoryChange.trend === 'increased',
                recommendation: categoryChange.trend === 'increased' 
                    ? `Review your recent "${categoryChange.category}" purchases to understand what drove this increase.`
                    : null
            });
        });

        // New category insights
        const significantNewCategories = categoryComparison.newCategories.filter(c => c.amount > 50);
        significantNewCategories.slice(0, 2).forEach(newCategory => {
            insights.push({
                id: `new_category_${newCategory.category.toLowerCase().replace(/\s+/g, '_')}`,
                type: 'pattern',
                category: newCategory.category,
                message: `You started spending in "${newCategory.category}" with ${newCategory.amount.toFixed(2)} (${newCategory.percentage.toFixed(1)}% of expenses).`,
                severity: 'low',
                actionable: false
            });
        });

        // Behavior change insights
        if (behaviorChanges.summary.hasSignificantChanges) {
            behaviorChanges.summary.changes.forEach(change => {
                insights.push({
                    id: `behavior_${change.type}`,
                    type: 'pattern',
                    message: change.description,
                    severity: change.significance === 'high' ? 'medium' : 'low',
                    actionable: change.type === 'frequency' && change.description.includes('increased')
                });
            });
        }

        return insights;
    }

    /**
     * Generate comparison summary
     * @param {Object} overallComparison - Overall comparison data
     * @param {Object} categoryComparison - Category comparison data
     * @returns {Object} Comparison summary
     */
    generateComparisonSummary(overallComparison, categoryComparison) {
        const summary = {
            financialHealth: 'stable',
            keyChanges: [],
            recommendations: []
        };

        // Determine overall financial health
        const balanceChange = overallComparison.netBalance.changePercent;
        if (balanceChange > 15) {
            summary.financialHealth = 'improved';
        } else if (balanceChange < -15) {
            summary.financialHealth = 'declined';
        }

        // Key changes
        if (Math.abs(overallComparison.expenses.changePercent) > 10) {
            summary.keyChanges.push(`Expenses ${overallComparison.expenses.trend} by ${Math.abs(overallComparison.expenses.changePercent).toFixed(1)}%`);
        }

        if (Math.abs(overallComparison.income.changePercent) > 10) {
            summary.keyChanges.push(`Income ${overallComparison.income.trend} by ${Math.abs(overallComparison.income.changePercent).toFixed(1)}%`);
        }

        const topCategoryChange = categoryComparison.categoryChanges[0];
        if (topCategoryChange && topCategoryChange.significance === 'high') {
            summary.keyChanges.push(`${topCategoryChange.category} spending ${topCategoryChange.trend} by ${Math.abs(topCategoryChange.changes.amountPercent).toFixed(1)}%`);
        }

        // Recommendations
        if (overallComparison.expenses.trend === 'increased' && overallComparison.expenses.changePercent > 20) {
            summary.recommendations.push('Consider reviewing your spending patterns to identify areas for reduction');
        }

        if (categoryComparison.significantChanges > 0) {
            summary.recommendations.push('Focus on categories with the largest spending increases');
        }

        if (summary.keyChanges.length === 0) {
            summary.keyChanges.push('Spending patterns remained relatively stable');
        }

        return summary;
    }

    /**
     * Get historical insights for preservation and review
     * @param {Array} transactions - All transaction data
     * @param {Array} historicalPeriods - Array of historical periods to analyze
     * @returns {Object} Historical insights data
     */
    getHistoricalInsights(transactions, historicalPeriods) {
        const cacheKey = `historicalInsights_${JSON.stringify(historicalPeriods)}`;
        const cached = this.getCachedResult(cacheKey);
        if (cached) return cached;

        const historicalInsights = [];

        for (const period of historicalPeriods) {
            const periodInsights = this.generateSpendingInsights(transactions, period);
            const periodData = {
                period,
                insights: periodInsights,
                summary: {
                    totalInsights: periodInsights.length,
                    highSeverityInsights: periodInsights.filter(i => i.severity === 'high').length,
                    actionableInsights: periodInsights.filter(i => i.actionable).length
                },
                generatedAt: new Date().toISOString()
            };

            historicalInsights.push(periodData);
        }

        const result = {
            historicalInsights,
            totalPeriods: historicalPeriods.length,
            overallTrends: this.analyzeOverallHistoricalTrends(historicalInsights),
            preservedAt: new Date().toISOString()
        };

        this.setCachedResult(cacheKey, result);
        return result;
    }

    /**
     * Analyze overall trends across historical periods
     * @param {Array} historicalInsights - Historical insights data
     * @returns {Object} Overall trend analysis
     */
    analyzeOverallHistoricalTrends(historicalInsights) {
        if (historicalInsights.length < 2) {
            return { hasEnoughData: false };
        }

        const trends = {
            insightCount: [],
            severityTrends: [],
            actionableInsightTrends: []
        };

        historicalInsights.forEach((periodData, index) => {
            trends.insightCount.push({
                period: index,
                count: periodData.summary.totalInsights
            });

            trends.severityTrends.push({
                period: index,
                highSeverity: periodData.summary.highSeverityInsights
            });

            trends.actionableInsightTrends.push({
                period: index,
                actionable: periodData.summary.actionableInsights
            });
        });

        return {
            hasEnoughData: true,
            trends,
            overallDirection: this.calculateOverallTrendDirection(trends)
        };
    }

    /**
     * Calculate overall trend direction
     * @param {Object} trends - Trend data
     * @returns {Object} Trend direction analysis
     */
    calculateOverallTrendDirection(trends) {
        const insightCountTrend = this.calculateSimpleTrend(trends.insightCount.map(t => t.count));
        const severityTrend = this.calculateSimpleTrend(trends.severityTrends.map(t => t.highSeverity));
        const actionableTrend = this.calculateSimpleTrend(trends.actionableInsightTrends.map(t => t.actionable));

        return {
            insightCount: insightCountTrend,
            severity: severityTrend,
            actionable: actionableTrend
        };
    }

    /**
     * Calculate simple trend direction
     * @param {Array} values - Array of values
     * @returns {string} Trend direction
     */
    calculateSimpleTrend(values) {
        if (values.length < 2) return 'stable';

        const firstHalf = values.slice(0, Math.ceil(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));

        const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

        const change = ((secondAvg - firstAvg) / firstAvg) * 100;

        if (change > 10) return 'increasing';
        if (change < -10) return 'decreasing';
        return 'stable';
    }

    /**
     * Calculate overall prediction confidence
     * @param {Object} historicalAnalysis - Historical analysis
     * @param {Array} predictions - Monthly predictions
     * @returns {string} Overall confidence level
     */
    calculatePredictionConfidence(historicalAnalysis, predictions) {
        const confidenceLevels = predictions.map(p => p.confidence);
        const highConfidence = confidenceLevels.filter(c => c === 'high').length;
        const lowConfidence = confidenceLevels.filter(c => c === 'low').length;
        
        if (highConfidence >= predictions.length * 0.7) {
            return 'high';
        } else if (lowConfidence >= predictions.length * 0.5) {
            return 'low';
        } else {
            return 'medium';
        }
    }
}