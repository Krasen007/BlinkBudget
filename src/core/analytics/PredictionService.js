/**
 * PredictionService
 * Predicts future spending based on historical patterns.
 */

import { TRANSACTION_TYPES } from '../../utils/constants.js';

export class PredictionService {
    /**
     * Predict future spending based on historical patterns
     * @param {Array} transactions - All historical transaction data
     * @param {number} monthsToPredict - Number of months to predict
     * @param {Object} options - Prediction options
     * @returns {Object} Future spending predictions
     */
    static predictFutureSpending(transactions, monthsToPredict = 3, options = {}) {
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

        const confidence = this.calculateOverallConfidence(historicalAnalysis, predictions);

        return {
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
    }

    /**
     * Analyze historical spending patterns for prediction
     * @param {Array} transactions - All transaction data
     * @returns {Object} Historical pattern analysis
     */
    static analyzeHistoricalPatterns(transactions) {
        const expenseTransactions = transactions.filter(t => t.type === TRANSACTION_TYPES.EXPENSE);

        if (expenseTransactions.length === 0) {
            return { hasEnoughData: false, monthsAnalyzed: 0 };
        }

        const monthlyData = this.groupTransactionsByMonth(expenseTransactions);
        const monthsAnalyzed = Object.keys(monthlyData).length;

        if (monthsAnalyzed < 3) {
            return { hasEnoughData: false, monthsAnalyzed };
        }

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

        const trend = this.calculateSpendingTrend(monthlySpending);
        const seasonalPatterns = this.detectSeasonalPatterns(monthlySpending);

        const totalSpending = monthlySpending.reduce((sum, month) => sum + month.totalSpending, 0);
        const averageMonthlySpending = totalSpending / monthlySpending.length;

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

    static groupTransactionsByMonth(transactions) {
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

    static calculateMonthlyCategories(transactions) {
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

        const categoryBreakdown = {};
        for (const [category, amount] of Object.entries(categoryTotals)) {
            categoryBreakdown[category] = {
                amount,
                percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0
            };
        }
        return categoryBreakdown;
    }

    static calculateSpendingTrend(monthlySpending) {
        if (monthlySpending.length < 2) {
            return { slope: 0, direction: 'stable', confidence: 'low' };
        }

        const n = monthlySpending.length;
        const x = monthlySpending.map((_, index) => index);
        const y = monthlySpending.map(month => month.totalSpending);

        const sumX = x.reduce((sum, val) => sum + val, 0);
        const sumY = y.reduce((sum, val) => sum + val, 0);
        const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
        const sumXX = x.reduce((sum, val) => sum + val * val, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        const yMean = sumY / n;
        const totalSumSquares = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
        const residualSumSquares = y.reduce((sum, val, i) => {
            const predicted = slope * x[i] + intercept;
            return sum + Math.pow(val - predicted, 2);
        }, 0);

        const rSquared = totalSumSquares > 0 ? 1 - (residualSumSquares / totalSumSquares) : 0;

        let direction = 'stable';
        if (Math.abs(slope) > 10) {
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
            projectedChange: slope * 12
        };
    }

    static detectSeasonalPatterns(monthlySpending) {
        const seasonalData = { spring: [], summer: [], fall: [], winter: [] };

        monthlySpending.forEach(monthData => {
            const month = monthData.month;
            let season;
            if (month >= 3 && month <= 5) season = 'spring';
            else if (month >= 6 && month <= 8) season = 'summer';
            else if (month >= 9 && month <= 11) season = 'fall';
            else season = 'winter';
            seasonalData[season].push(monthData.totalSpending);
        });

        const seasonalAverages = {};
        const seasonalPatterns = {};

        for (const [season, amounts] of Object.entries(seasonalData)) {
            if (amounts.length > 0) {
                const average = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
                const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - average, 2), 0) / amounts.length;

                seasonalAverages[season] = average;
                seasonalPatterns[season] = {
                    average,
                    variance,
                    standardDeviation: Math.sqrt(variance),
                    dataPoints: amounts.length
                };
            }
        }

        const seasons = Object.entries(seasonalAverages);
        if (seasons.length === 0) return { hasPatterns: false };

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

    static analyzeCategoryPatterns(monthlySpending) {
        const categoryTrends = {};
        monthlySpending.forEach((monthData, monthIndex) => {
            for (const [category, data] of Object.entries(monthData.categoryBreakdown)) {
                if (!categoryTrends[category]) categoryTrends[category] = [];
                categoryTrends[category].push({
                    month: monthIndex,
                    amount: data.amount,
                    percentage: data.percentage
                });
            }
        });

        const categoryAnalysis = {};
        for (const [category, data] of Object.entries(categoryTrends)) {
            if (data.length >= 2) {
                const amounts = data.map(d => d.amount);
                const avgAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;

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

    static calculateCategoryVolatility(amounts) {
        if (amounts.length < 2) return 0;
        const mean = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
        const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / amounts.length;
        return mean > 0 ? Math.sqrt(variance) / mean : 0;
    }

    static predictMonthlySpending(historicalAnalysis, targetDate, options = {}) {
        const targetMonth = targetDate.getMonth() + 1;
        const targetYear = targetDate.getFullYear();

        const monthsFromNow = this.calculateMonthsFromNow(targetDate);
        let basePrediction = historicalAnalysis.averageMonthlySpending +
            (historicalAnalysis.trend.slope * monthsFromNow);

        if (historicalAnalysis.seasonalPatterns.hasPatterns) {
            const seasonalAdjustment = this.getSeasonalAdjustment(targetMonth, historicalAnalysis.seasonalPatterns);
            basePrediction = basePrediction * seasonalAdjustment;
        }

        basePrediction = Math.max(0, basePrediction);

        const confidenceInterval = historicalAnalysis.volatility * 1.96;
        const lowerBound = Math.max(0, basePrediction - confidenceInterval);
        const upperBound = basePrediction + confidenceInterval;

        const categoryPredictions = this.predictCategoryBreakdown(historicalAnalysis, basePrediction);

        return {
            year: targetYear,
            month: targetMonth,
            monthName: new Date(targetYear, targetMonth - 1).toLocaleString('default', { month: 'long' }),
            predictedAmount: Math.round(basePrediction * 100) / 100,
            lowerBound: Math.round(lowerBound * 100) / 100,
            upperBound: Math.round(upperBound * 100) / 100,
            confidence: this.calculateMonthlyConfidence(historicalAnalysis, monthsFromNow),
            categoryPredictions,
            factors: {
                baseTrend: historicalAnalysis.trend.slope * monthsFromNow,
                seasonalAdjustment: historicalAnalysis.seasonalPatterns.hasPatterns,
                historicalAverage: historicalAnalysis.averageMonthlySpending
            }
        };
    }

    static calculateMonthsFromNow(targetDate) {
        const now = new Date();
        const yearDiff = targetDate.getFullYear() - now.getFullYear();
        const monthDiff = targetDate.getMonth() - now.getMonth();
        return yearDiff * 12 + monthDiff;
    }

    static getSeasonalAdjustment(month, seasonalPatterns) {
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

    static predictCategoryBreakdown(historicalAnalysis, totalPredictedAmount) {
        const categoryPatterns = historicalAnalysis.categoryPatterns;
        const predictions = [];

        for (const [category, pattern] of Object.entries(categoryPatterns)) {
            let predictedAmount = pattern.averageAmount;
            if (pattern.trendDirection === 'increasing') predictedAmount *= 1.1;
            else if (pattern.trendDirection === 'decreasing') predictedAmount *= 0.9;

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
        predictions.sort((a, b) => b.predictedAmount - a.predictedAmount);
        return predictions;
    }

    static calculateMonthlyConfidence(historicalAnalysis, monthsFromNow) {
        let confidence = 'medium';
        const hasGoodTrend = historicalAnalysis.trend.confidence === 'high';
        const hasSeasonalData = historicalAnalysis.seasonalPatterns.hasPatterns;
        const hasEnoughData = historicalAnalysis.monthsAnalyzed >= 6;
        const lowVolatility = historicalAnalysis.volatility < historicalAnalysis.averageMonthlySpending * 0.3;

        const farIntoFuture = monthsFromNow > 6;
        const highVolatility = historicalAnalysis.volatility > historicalAnalysis.averageMonthlySpending * 0.5;

        const positiveFactors = [hasGoodTrend, hasSeasonalData, hasEnoughData, lowVolatility].filter(Boolean).length;
        const negativeFactors = [farIntoFuture, highVolatility].filter(Boolean).length;

        if (positiveFactors >= 3 && negativeFactors === 0) confidence = 'high';
        else if (positiveFactors <= 1 || negativeFactors >= 2) confidence = 'low';

        return confidence;
    }

    static calculateOverallConfidence(historicalAnalysis, predictions) {
        const confidenceLevels = predictions.map(p => p.confidence);
        const highConfidence = confidenceLevels.filter(c => c === 'high').length;
        const lowConfidence = confidenceLevels.filter(c => c === 'low').length;

        if (highConfidence >= predictions.length * 0.7) return 'high';
        else if (lowConfidence >= predictions.length * 0.5) return 'low';
        else return 'medium';
    }
}
