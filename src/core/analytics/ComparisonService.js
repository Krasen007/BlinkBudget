/**
 * ComparisonService
 * Compares spending patterns between different time periods.
 */

import { TRANSACTION_TYPES } from '../../utils/constants.js';
import { FilteringService } from './FilteringService.js';
import { MetricsService } from './MetricsService.js';
import { InsightsService } from './InsightsService.js';

export class ComparisonService {
    /**
     * Compare spending patterns between different time periods
     * @param {Array} transactions - All transaction data
     * @param {Object} currentPeriod - Current time period
     * @param {Object} comparisonPeriod - Period to compare against
     * @returns {Object} Detailed period comparison
     */
    static comparePeriodsSpending(transactions, currentPeriod, comparisonPeriod) {
        const currentData = {
            incomeVsExpenses: MetricsService.calculateIncomeVsExpenses(transactions, currentPeriod),
            categoryBreakdown: MetricsService.calculateCategoryBreakdown(transactions, currentPeriod),
            costOfLiving: MetricsService.calculateCostOfLiving(transactions, currentPeriod)
        };

        const comparisonData = {
            incomeVsExpenses: MetricsService.calculateIncomeVsExpenses(transactions, comparisonPeriod),
            categoryBreakdown: MetricsService.calculateCategoryBreakdown(transactions, comparisonPeriod),
            costOfLiving: MetricsService.calculateCostOfLiving(transactions, comparisonPeriod)
        };

        const overallComparison = this.calculateOverallComparison(currentData, comparisonData);
        const categoryComparison = this.calculateCategoryComparison(
            currentData.categoryBreakdown,
            comparisonData.categoryBreakdown
        );
        const behaviorChanges = this.analyzeBehaviorChanges(transactions, currentPeriod, comparisonPeriod);
        const comparisonInsights = this.generateComparisonInsights(
            overallComparison,
            categoryComparison,
            behaviorChanges
        );

        return {
            currentPeriod,
            comparisonPeriod,
            overallComparison,
            categoryComparison,
            behaviorChanges,
            insights: comparisonInsights,
            summary: this.generateComparisonSummary(overallComparison, categoryComparison),
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Calculate overall financial metrics comparison
     * @param {Object} currentData - Current period data
     * @param {Object} comparisonData - Comparison period data
     * @returns {Object} Overall comparison metrics
     */
    static calculateOverallComparison(currentData, comparisonData) {
        const current = currentData.incomeVsExpenses;
        const comparison = comparisonData.incomeVsExpenses;

        const incomeChange = current.totalIncome - comparison.totalIncome;
        const incomeChangePercent = comparison.totalIncome > 0 ? (incomeChange / comparison.totalIncome) * 100 : 0;

        const expenseChange = current.totalExpenses - comparison.totalExpenses;
        const expenseChangePercent = comparison.totalExpenses > 0 ? (expenseChange / comparison.totalExpenses) * 100 : 0;

        const balanceChange = current.netBalance - comparison.netBalance;
        const balanceChangePercent = comparison.netBalance !== 0 ? (balanceChange / Math.abs(comparison.netBalance)) * 100 : 0;

        const transactionCountChange = current.expenseCount - comparison.expenseCount;
        const transactionCountChangePercent = comparison.expenseCount > 0 ? (transactionCountChange / comparison.expenseCount) * 100 : 0;

        const avgTransactionChange = current.averageExpense - comparison.averageExpense;
        const avgTransactionChangePercent = comparison.averageExpense > 0 ? (avgTransactionChange / comparison.averageExpense) * 100 : 0;

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
    static calculateCategoryComparison(currentCategories, comparisonCategories) {
        const currentCategoryMap = new Map();
        const comparisonCategoryMap = new Map();

        currentCategories.categories.forEach(cat => currentCategoryMap.set(cat.name, cat));
        comparisonCategories.categories.forEach(cat => comparisonCategoryMap.set(cat.name, cat));

        const allCategories = new Set([...currentCategoryMap.keys(), ...comparisonCategoryMap.keys()]);
        const categoryChanges = [];
        const newCategories = [];
        const disappearedCategories = [];

        for (const categoryName of allCategories) {
            const currentCat = currentCategoryMap.get(categoryName);
            const comparisonCat = comparisonCategoryMap.get(categoryName);

            if (currentCat && comparisonCat) {
                const amountChange = currentCat.amount - comparisonCat.amount;
                const amountChangePercent = comparisonCat.amount > 0 ? (amountChange / comparisonCat.amount) * 100 : 0;
                const percentagePointChange = currentCat.percentage - comparisonCat.percentage;

                categoryChanges.push({
                    category: categoryName,
                    current: { amount: currentCat.amount, percentage: currentCat.percentage, transactionCount: currentCat.transactionCount },
                    comparison: { amount: comparisonCat.amount, percentage: comparisonCat.percentage, transactionCount: comparisonCat.transactionCount },
                    changes: { amount: amountChange, amountPercent: amountChangePercent, percentagePoints: percentagePointChange, transactionCount: currentCat.transactionCount - comparisonCat.transactionCount },
                    trend: amountChange > 0 ? 'increased' : amountChange < 0 ? 'decreased' : 'stable',
                    significance: Math.abs(amountChangePercent) > 25 ? 'high' : Math.abs(amountChangePercent) > 10 ? 'medium' : 'low'
                });
            } else if (currentCat && !comparisonCat) {
                newCategories.push({ category: categoryName, amount: currentCat.amount, percentage: currentCat.percentage, transactionCount: currentCat.transactionCount });
            } else if (!currentCat && comparisonCat) {
                disappearedCategories.push({ category: categoryName, amount: comparisonCat.amount, percentage: comparisonCat.percentage, transactionCount: comparisonCat.transactionCount });
            }
        }

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
    static analyzeBehaviorChanges(transactions, currentPeriod, comparisonPeriod) {
        const currentTransactions = FilteringService.filterByTimePeriod(transactions, currentPeriod)
            .filter(t => t.type === TRANSACTION_TYPES.EXPENSE);
        const comparisonTransactions = FilteringService.filterByTimePeriod(transactions, comparisonPeriod)
            .filter(t => t.type === TRANSACTION_TYPES.EXPENSE);

        const frequencyChanges = this.analyzeFrequencyChanges(currentTransactions, comparisonTransactions, currentPeriod, comparisonPeriod);
        const timingChanges = this.analyzeTimingChanges(currentTransactions, comparisonTransactions);
        const sizeChanges = this.analyzeSizeChanges(currentTransactions, comparisonTransactions);

        return {
            frequencyChanges,
            timingChanges,
            sizeChanges,
            summary: this.generateBehaviorChangeSummary(frequencyChanges, timingChanges, sizeChanges)
        };
    }

    static analyzeFrequencyChanges(currentTransactions, comparisonTransactions, currentPeriod, comparisonPeriod) {
        const currentDays = Math.ceil((new Date(currentPeriod.endDate) - new Date(currentPeriod.startDate)) / (1000 * 60 * 60 * 24)) + 1;
        const comparisonDays = Math.ceil((new Date(comparisonPeriod.endDate) - new Date(comparisonPeriod.startDate)) / (1000 * 60 * 60 * 24)) + 1;

        const currentFrequency = currentTransactions.length / currentDays;
        const comparisonFrequency = comparisonTransactions.length / comparisonDays;

        const frequencyChange = currentFrequency - comparisonFrequency;
        const frequencyChangePercent = comparisonFrequency > 0 ? (frequencyChange / comparisonFrequency) * 100 : 0;

        return {
            current: { transactionsPerDay: currentFrequency, totalTransactions: currentTransactions.length, totalDays: currentDays },
            comparison: { transactionsPerDay: comparisonFrequency, totalTransactions: comparisonTransactions.length, totalDays: comparisonDays },
            change: frequencyChange,
            changePercent: frequencyChangePercent,
            trend: frequencyChange > 0 ? 'more_frequent' : frequencyChange < 0 ? 'less_frequent' : 'stable',
            significance: Math.abs(frequencyChangePercent) > 25 ? 'high' : Math.abs(frequencyChangePercent) > 10 ? 'medium' : 'low'
        };
    }

    static analyzeTimingChanges(currentTransactions, comparisonTransactions) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
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

        const significantDayChanges = Object.entries(dayOfWeekChanges)
            .filter(([day, data]) => Math.abs(data.change) > 10)
            .sort((a, b) => Math.abs(b[1].change) - Math.abs(a[1].change));

        return {
            dayOfWeekChanges,
            significantDayChanges: significantDayChanges.map(([day, data]) => ({ day, ...data })),
            hasSignificantTimingChanges: significantDayChanges.length > 0
        };
    }

    static calculateDayOfWeekPattern(transactions) {
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

    static analyzeSizeChanges(currentTransactions, comparisonTransactions) {
        const currentAmounts = currentTransactions.map(t => Math.abs(t.amount || 0));
        const comparisonAmounts = comparisonTransactions.map(t => Math.abs(t.amount || 0));

        if (currentAmounts.length === 0 || comparisonAmounts.length === 0) return { hasData: false };

        const currentStats = this.calculateTransactionSizeStats(currentAmounts);
        const comparisonStats = this.calculateTransactionSizeStats(comparisonAmounts);

        const averageChange = currentStats.average - comparisonStats.average;
        const averageChangePercent = comparisonStats.average > 0 ? (averageChange / comparisonStats.average) * 100 : 0;
        const medianChange = currentStats.median - comparisonStats.median;
        const medianChangePercent = comparisonStats.median > 0 ? (medianChange / comparisonStats.median) * 100 : 0;

        return {
            hasData: true,
            current: currentStats,
            comparison: comparisonStats,
            changes: { average: averageChange, averagePercent: averageChangePercent, median: medianChange, medianPercent: medianChangePercent },
            trends: {
                average: averageChange > 0 ? 'increased' : averageChange < 0 ? 'decreased' : 'stable',
                median: medianChange > 0 ? 'increased' : medianChange < 0 ? 'decreased' : 'stable'
            },
            significance: Math.abs(averageChangePercent) > 20 ? 'high' : Math.abs(averageChangePercent) > 10 ? 'medium' : 'low'
        };
    }

    static calculateTransactionSizeStats(amounts) {
        if (amounts.length === 0) return { average: 0, median: 0, min: 0, max: 0, count: 0 };
        const sortedAmounts = [...amounts].sort((a, b) => a - b);
        const total = amounts.reduce((sum, amount) => sum + amount, 0);
        const average = total / amounts.length;
        const median = amounts.length % 2 === 0
            ? (sortedAmounts[amounts.length / 2 - 1] + sortedAmounts[amounts.length / 2]) / 2
            : sortedAmounts[Math.floor(amounts.length / 2)];

        return { average, median, min: Math.min(...amounts), max: Math.max(...amounts), count: amounts.length, total };
    }

    static generateBehaviorChangeSummary(frequencyChanges, timingChanges, sizeChanges) {
        const changes = [];
        if (frequencyChanges.significance !== 'low') {
            changes.push({ type: 'frequency', description: `Spending frequency ${frequencyChanges.trend.replace('_', ' ')} by ${Math.abs(frequencyChanges.changePercent).toFixed(1)}%`, significance: frequencyChanges.significance });
        }
        if (timingChanges.hasSignificantTimingChanges) {
            const topTimingChange = timingChanges.significantDayChanges[0];
            changes.push({ type: 'timing', description: `${topTimingChange.day} spending ${topTimingChange.trend} by ${Math.abs(topTimingChange.change).toFixed(1)} percentage points`, significance: 'medium' });
        }
        if (sizeChanges.hasData && sizeChanges.significance !== 'low') {
            changes.push({ type: 'transaction_size', description: `Average transaction size ${sizeChanges.trends.average} by ${Math.abs(sizeChanges.changes.averagePercent).toFixed(1)}%`, significance: sizeChanges.significance });
        }
        return { changes, hasSignificantChanges: changes.length > 0, changeCount: changes.length };
    }

    static generateComparisonInsights(overallComparison, categoryComparison, behaviorChanges) {
        const insights = [];
        if (Math.abs(overallComparison.netBalance.changePercent) > 15) {
            insights.push({ id: 'net_balance_change', type: overallComparison.netBalance.trend === 'improved' ? 'positive' : 'warning', message: `Your net balance ${overallComparison.netBalance.trend} by ${Math.abs(overallComparison.netBalance.changePercent).toFixed(1)}% compared to the previous period.`, severity: Math.abs(overallComparison.netBalance.changePercent) > 30 ? 'high' : 'medium', actionable: overallComparison.netBalance.trend === 'worsened' });
        }
        if (Math.abs(overallComparison.expenses.changePercent) > 10) {
            insights.push({ id: 'expense_trend', type: overallComparison.expenses.trend === 'increased' ? 'warning' : 'positive', message: `Your total expenses ${overallComparison.expenses.trend} by ${Math.abs(overallComparison.expenses.changePercent).toFixed(1)}% (${Math.abs(overallComparison.expenses.change).toFixed(2)}).`, severity: overallComparison.expenses.trend === 'increased' && overallComparison.expenses.changePercent > 25 ? 'high' : 'medium', actionable: overallComparison.expenses.trend === 'increased' });
        }
        categoryComparison.categoryChanges.filter(c => c.significance === 'high').slice(0, 3).forEach(categoryChange => {
            insights.push({ id: `category_change_${categoryChange.category.toLowerCase().replace(/\s+/g, '_')}`, type: categoryChange.trend === 'increased' ? 'warning' : 'positive', category: categoryChange.category, message: `"${categoryChange.category}" spending ${categoryChange.trend} significantly by ${Math.abs(categoryChange.changes.amountPercent).toFixed(1)}% (${Math.abs(categoryChange.changes.amount).toFixed(2)}).`, severity: 'high', actionable: categoryChange.trend === 'increased', recommendation: categoryChange.trend === 'increased' ? `Review your recent "${categoryChange.category}" purchases to understand what drove this increase.` : null });
        });
        categoryComparison.newCategories.filter(c => c.amount > 50).slice(0, 2).forEach(newCategory => {
            insights.push({ id: `new_category_${newCategory.category.toLowerCase().replace(/\s+/g, '_')}`, type: 'pattern', category: newCategory.category, message: `You started spending in "${newCategory.category}" with ${newCategory.amount.toFixed(2)} (${newCategory.percentage.toFixed(1)}% of expenses).`, severity: 'low', actionable: false });
        });
        if (behaviorChanges.summary.hasSignificantChanges) {
            behaviorChanges.summary.changes.forEach(change => {
                insights.push({ id: `behavior_${change.type}`, type: 'pattern', message: change.description, severity: change.significance === 'high' ? 'medium' : 'low', actionable: change.type === 'frequency' && change.description.includes('increased') });
            });
        }
        return insights;
    }

    static generateComparisonSummary(overallComparison, categoryComparison) {
        const summary = { financialHealth: 'stable', keyChanges: [], recommendations: [] };
        const balanceChange = overallComparison.netBalance.changePercent;
        if (balanceChange > 15) summary.financialHealth = 'improved';
        else if (balanceChange < -15) summary.financialHealth = 'declined';

        if (Math.abs(overallComparison.expenses.changePercent) > 10) summary.keyChanges.push(`Expenses ${overallComparison.expenses.trend} by ${Math.abs(overallComparison.expenses.changePercent).toFixed(1)}%`);
        if (Math.abs(overallComparison.income.changePercent) > 10) summary.keyChanges.push(`Income ${overallComparison.income.trend} by ${Math.abs(overallComparison.income.changePercent).toFixed(1)}%`);
        const topCategoryChange = categoryComparison.categoryChanges[0];
        if (topCategoryChange && topCategoryChange.significance === 'high') summary.keyChanges.push(`${topCategoryChange.category} spending ${topCategoryChange.trend} by ${Math.abs(topCategoryChange.changes.amountPercent).toFixed(1)}%`);

        if (overallComparison.expenses.trend === 'increased' && overallComparison.expenses.changePercent > 20) summary.recommendations.push('Consider reviewing your spending patterns to identify areas for reduction');
        if (categoryComparison.significantChanges > 0) summary.recommendations.push('Focus on categories with the largest spending increases');
        if (summary.keyChanges.length === 0) summary.keyChanges.push('Spending patterns remained relatively stable');

        return summary;
    }

    /**
     * Get historical insights for preservation and review
     * @param {Array} transactions - All transaction data
     * @param {Array} historicalPeriods - Array of historical periods to analyze
     * @returns {Object} Historical insights data
     */
    static getHistoricalInsights(transactions, historicalPeriods) {
        const historicalInsights = historicalPeriods.map(period => {
            const periodInsights = InsightsService.generateSpendingInsights(transactions, period);
            return {
                period,
                insights: periodInsights,
                summary: {
                    totalInsights: periodInsights.length,
                    highSeverityInsights: periodInsights.filter(i => i.severity === 'high').length,
                    actionableInsights: periodInsights.filter(i => i.actionable).length
                },
                generatedAt: new Date().toISOString()
            };
        });

        return {
            historicalInsights,
            totalPeriods: historicalPeriods.length,
            overallTrends: this.analyzeOverallHistoricalTrends(historicalInsights),
            preservedAt: new Date().toISOString()
        };
    }

    /**
     * Analyze overall trends across historical periods
     * @param {Array} historicalInsights - Historical insights data
     * @returns {Object} Overall trend analysis
     */
    static analyzeOverallHistoricalTrends(historicalInsights) {
        if (historicalInsights.length < 2) return { hasEnoughData: false };

        const trends = { insightCount: [], severityTrends: [], actionableInsightTrends: [] };
        historicalInsights.forEach((periodData, index) => {
            trends.insightCount.push({ period: index, count: periodData.summary.totalInsights });
            trends.severityTrends.push({ period: index, highSeverity: periodData.summary.highSeverityInsights });
            trends.actionableInsightTrends.push({ period: index, actionable: periodData.summary.actionableInsights });
        });

        return {
            hasEnoughData: true,
            trends,
            overallDirection: this.calculateOverallTrendDirection(trends)
        };
    }

    static calculateOverallTrendDirection(trends) {
        const calculateSimpleTrend = (values) => {
            if (values.length < 2) return 'stable';
            const firstHalf = values.slice(0, Math.ceil(values.length / 2));
            const secondHalf = values.slice(Math.floor(values.length / 2));
            const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
            const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
            const change = firstAvg !== 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
            if (change > 10) return 'increasing';
            if (change < -10) return 'decreasing';
            return 'stable';
        };

        return {
            insightCount: calculateSimpleTrend(trends.insightCount.map(t => t.count)),
            severity: calculateSimpleTrend(trends.severityTrends.map(t => t.highSeverity)),
            actionable: calculateSimpleTrend(trends.actionableInsightTrends.map(t => t.actionable))
        };
    }
}
