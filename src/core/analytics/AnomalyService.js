/**
 * AnomalyService
 * Detects spending anomalies and unusual patterns.
 */

import { TRANSACTION_TYPES } from '../../utils/constants.js';
import { FilteringService } from './FilteringService.js';
import { formatCurrency } from '../../utils/financial-planning-helpers.js';

export class AnomalyService {
  /**
   * Detect spending anomalies and unusual patterns
   * @param {Array} transactions - All transaction data
   * @param {Object} currentPeriod - Current time period
   * @returns {Array} Anomaly-based insights
   */
  static detectAnomalies(transactions, currentPeriod) {
    const insights = [];
    const filteredTransactions = FilteringService.filterByTimePeriod(
      transactions.filter(t => !t.isGhost),
      currentPeriod
    );
    const expenseTransactions = filteredTransactions.filter(
      t => t.type === TRANSACTION_TYPES.EXPENSE
    );

    if (expenseTransactions.length < 5) {
      return insights; // Need sufficient data for anomaly detection
    }

    // Detect spending spikes (pass all filtered transactions so refunds can offset expenses)
    insights.push(
      ...this.detectSpendingSpikes(expenseTransactions, filteredTransactions)
    );

    // Detect unusual category concentrations
    insights.push(...this.detectCategoryConcentration(expenseTransactions));

    // Detect unusual timing patterns
    insights.push(...this.detectTimingAnomalies(expenseTransactions));

    return insights;
  }

  /**
   * Detect spending spikes using statistical analysis
   * @param {Array} expenseTransactions - Expense transactions
   * @param {Array} allTransactions - All transactions in the period (used to net out refunds)
   * @returns {Array} Spike detection insights
   */
  static detectSpendingSpikes(expenseTransactions, allTransactions = []) {
    const insights = [];
    const amounts = expenseTransactions.map(t => Math.abs(t.amount || 0));

    if (amounts.length < 5) {
      return insights;
    }

    // Build a map of refund amounts per category so we can net them out
    const refundsByCategory = Object.create(null);
    allTransactions
      .filter(t => t.type === TRANSACTION_TYPES.REFUND)
      .forEach(t => {
        const cat = t.category || 'Uncategorized';
        refundsByCategory[cat] =
          (refundsByCategory[cat] || 0) + Math.abs(t.amount || 0);
      });

    const mean =
      amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const variance =
      amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) /
      amounts.length;
    const standardDeviation = Math.sqrt(variance);

    const spikeThreshold = mean + 1.5 * standardDeviation;
    const spikes = expenseTransactions.filter(
      t => Math.abs(t.amount || 0) > spikeThreshold
    );

    if (spikes.length > 0) {
      // Group spikes by category so we can apply per-category refund netting
      const categorySpikes = Object.create(null);
      spikes.forEach(t => {
        const cat = t.category || 'Uncategorized';
        if (!categorySpikes[cat]) categorySpikes[cat] = [];
        categorySpikes[cat].push(t);
      });

      // Filter out categories where refunds fully offset the spike amount
      const effectiveCategorySpikes = Object.create(null);
      for (const [category, catSpikes] of Object.entries(categorySpikes)) {
        const catSpikeAmount = catSpikes.reduce(
          (sum, t) => sum + Math.abs(t.amount || 0),
          0
        );
        const refundAmount = refundsByCategory[category] || 0;
        const netSpikeAmount = catSpikeAmount - refundAmount;

        // Only flag if the net amount after refunds still exceeds the threshold
        if (netSpikeAmount > spikeThreshold) {
          effectiveCategorySpikes[category] = {
            spikes: catSpikes,
            netAmount: netSpikeAmount,
          };
        }
      }

      if (Object.keys(effectiveCategorySpikes).length === 0) {
        return insights; // All spikes were offset by refunds
      }

      // Rebuild a flat list of effective spikes for the global summary
      const effectiveSpikes = Object.values(effectiveCategorySpikes).flatMap(
        v => v.spikes
      );

      const totalSpikeAmount = effectiveSpikes.reduce(
        (sum, t) => sum + Math.abs(t.amount || 0),
        0
      );
      const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);
      const spikePercentage = (totalSpikeAmount / totalAmount) * 100;

      // Add category-specific spike insights
      for (const [category, { spikes: catSpikes, netAmount }] of Object.entries(
        effectiveCategorySpikes
      )) {
        const categoryTransactions = (
          allTransactions || expenseTransactions
        ).filter(t => (t.category || 'Uncategorized') === category);
        const catTotalAmount = categoryTransactions.reduce((sum, t) => {
          const amount = Math.abs(t.amount || 0);
          return sum + (t.type === TRANSACTION_TYPES.REFUND ? -amount : amount);
        }, 0);
        const catSpikePercentage =
          catTotalAmount !== 0 ? (netAmount / catTotalAmount) * 100 : 0;

        insights.push({
          id: `spending_spike_${category.toLowerCase().replace(/\s+/g, '_')}`,
          type: 'anomaly',
          category: category,
          message: `Detected ${catSpikes.length} unusually large transaction${catSpikes.length > 1 ? 's' : ''} in "${category}" totaling ${formatCurrency(netAmount)} (${catSpikePercentage.toFixed(1)}% of category spending).`,
          severity: catSpikePercentage > 50 ? 'high' : 'medium',
          actionable: true,
          recommendation: `Review these large "${category}" purchases to ensure they align with your financial goals.`,
          metadata: {
            spikeTransactions: catSpikes.map(t => ({
              id: t.id,
              amount: t.amount,
              category: t.category,
              description: t.description,
              date: t.date || t.timestamp,
            })),
            threshold: spikeThreshold,
          },
        });
      }

      // Add a global summary insight if there are multiple categories involved
      if (Object.keys(effectiveCategorySpikes).length > 1) {
        const MAX_DISPLAY_TRANSACTIONS = 5;
        const sortedSpikes = [...effectiveSpikes].sort(
          (a, b) => Math.abs(b.amount || 0) - Math.abs(a.amount || 0)
        );
        const displaySpikes = sortedSpikes.slice(0, MAX_DISPLAY_TRANSACTIONS);
        const transactionDetails = displaySpikes
          .map(
            t =>
              `${t.category || 'Uncategorized'}: ${formatCurrency(Math.abs(t.amount || 0))}`
          )
          .join(', ');

        const remainingCount =
          effectiveSpikes.length - MAX_DISPLAY_TRANSACTIONS;
        const detailsText =
          remainingCount > 0
            ? `${transactionDetails}, and ${remainingCount} more...`
            : transactionDetails;

        insights.push({
          id: 'spending_spikes_summary',
          type: 'anomaly',
          message: `Detected ${effectiveSpikes.length} unusually large transactions across ${Object.keys(effectiveCategorySpikes).length} categories: ${detailsText}. Total: ${formatCurrency(totalSpikeAmount)} (${spikePercentage.toFixed(1)}% of total spending).`,
          severity: spikePercentage > 30 ? 'high' : 'medium',
          actionable: true,
          recommendation:
            'Review these large transactions to ensure they align with your budget and financial goals.',
          metadata: {
            spikeTransactions: effectiveSpikes.map(t => ({
              id: t.id,
              amount: t.amount,
              category: t.category,
              description: t.description,
              date: t.date || t.timestamp,
            })),
            threshold: spikeThreshold,
          },
        });
      }
    }

    return insights;
  }

  /**
   * Detect unusual category concentration
   * @param {Array} expenseTransactions - Expense transactions
   * @returns {Array} Category concentration insights
   */
  static detectCategoryConcentration(expenseTransactions) {
    const insights = [];
    const categoryTotals = Object.create(null);
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

    for (const [category, amount] of Object.entries(categoryTotals)) {
      const percentage = (amount / totalAmount) * 100;

      if (percentage > 40) {
        insights.push({
          id: `high_concentration_${category.toLowerCase().replace(/\s+/g, '_')}`,
          type: 'anomaly',
          category: category,
          message: `Unusually high spending concentration: ${percentage.toFixed(1)}% of your expenses are in "${category}".`,
          severity: 'high',
          actionable: true,
          recommendation: `Consider diversifying your spending or reviewing if this level of "${category}" spending is sustainable.`,
        });
      }
    }

    return insights;
  }

  /**
   * Detect unusual timing patterns
   * @param {Array} expenseTransactions - Expense transactions
   * @returns {Array} Timing anomaly insights with actions
   */
  static detectTimingAnomalies(expenseTransactions) {
    const insights = [];
    const dailySpending = Object.create(null);

    expenseTransactions.forEach(transaction => {
      const date = new Date(transaction.date || transaction.timestamp);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      const amount = Math.abs(transaction.amount || 0);

      // Group by day of week for pattern detection
      const dayKey = `day_${dayOfWeek}`;
      if (!dailySpending[dayKey]) {
        dailySpending[dayKey] = {
          total: 0,
          count: 0,
          categories: Object.create(null),
        };
      }
      dailySpending[dayKey].total += amount;
      dailySpending[dayKey].count += 1;

      // Track categories per day of week
      const cat = transaction.category || 'Uncategorized';
      if (!dailySpending[dayKey].categories[cat]) {
        dailySpending[dayKey].categories[cat] = 0;
      }
      dailySpending[dayKey].categories[cat] += amount;
    });

    // Calculate overall average spending per day
    const dayKeys = Object.keys(dailySpending);
    const overallTotal = dayKeys.reduce(
      (sum, k) => sum + dailySpending[k].total,
      0
    );
    const overallAvg = dayKeys.length > 0 ? overallTotal / dayKeys.length : 0;

    // Find days with significantly higher spending
    const highSpendingDays = dayKeys.filter(key => {
      const dayData = dailySpending[key];
      const spendingRatio = dayData.total / (overallAvg || 1);
      return spendingRatio > 1.4 && dayData.total > 30; // 40%+ above average
    });

    if (highSpendingDays.length > 0) {
      highSpendingDays.forEach(dayKey => {
        const dayData = dailySpending[dayKey];
        const spendingRatio = dayData.total / (overallAvg || 1);
        const excessAmount = dayData.total - overallAvg;
        const dayName = this._getDayName(parseInt(dayKey.split('_')[1]));

        // Find the category contributing most to the excess
        const sortedCategories = Object.entries(dayData.categories).sort(
          (a, b) => b[1] - a[1]
        );
        const topCategory = sortedCategories[0];
        const categoryExcess = topCategory
          ? (topCategory[1] / dayData.total) * excessAmount
          : 0;

        // Generate actionable suggestion based on category
        const suggestion = this._generateTimingAnomalySuggestion(
          topCategory,
          dayName,
          categoryExcess
        );

        const dayIndex = parseInt(dayKey.split('_')[1]);
        insights.push({
          id: `timing_anomaly_day_${dayIndex}`,
          type: 'timing_anomaly',
          pattern: `weekend`,
          message: `You spend ${((spendingRatio - 1) * 100).toFixed(0)}% more on ${dayName}s`,
          description: `You spend ${((spendingRatio - 1) * 100).toFixed(0)}% more on ${dayName}s`,
          contributingCategory: topCategory ? topCategory[0] : null,
          suggestion: suggestion.text,
          estimatedSavings: Math.round(categoryExcess * 0.2), // 20% reduction estimate
          severity: spendingRatio > 2 ? 'high' : 'medium',
          actionable: true,
          metadata: {
            dayOfWeek: dayIndex,
            dayName,
            averageSpending: overallAvg,
            actualSpending: dayData.total,
            excessAmount,
            topCategories: sortedCategories.slice(0, 3),
          },
        });
      });
    }

    // Detect monthly timing patterns (e.g., spending spikes at month end)
    const monthlyPatterns = this._detectMonthlyPatterns(expenseTransactions);
    if (monthlyPatterns) {
      insights.push(monthlyPatterns);
    }

    return insights;
  }

  /**
   * Get day name from day index
   * @param {number} dayIndex - Day of week (0-6)
   * @returns {string} Day name
   */
  static _getDayName(dayIndex) {
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    return days[dayIndex] || 'Day';
  }

  /**
   * Generate actionable suggestion for timing anomaly
   * @param {Array} topCategory - Top contributing category [name, amount]
   * @param {string} dayName - Day name
   * @param {number} excessAmount - Excess amount for this pattern
   * @returns {Object} Suggestion object
   */
  static _generateTimingAnomalySuggestion(topCategory, dayName, excessAmount) {
    const categoryName = topCategory ? topCategory[0].toLowerCase() : '';
    const savings = Math.round(excessAmount * 0.2);

    if (
      /\b(restaurant|dining|food|cafe|eating out|groceries)\b/.test(
        categoryName
      )
    ) {
      return {
        text: `Consider meal prepping on ${dayName}s to reduce dining costs.`,
        estimatedSavings: savings,
        difficulty: 'medium',
      };
    }
    if (/\b(entertainment|shopping|bar|nightlife)\b/.test(categoryName)) {
      return {
        text: `Plan ${dayName} activities in advance to stick to your budget.`,
        estimatedSavings: savings,
        difficulty: 'easy',
      };
    }
    if (/\b(fuel|transport|uber|taxi)\b/.test(categoryName)) {
      return {
        text: `Consider consolidating ${dayName} errands to save on transportation.`,
        estimatedSavings: savings,
        difficulty: 'hard',
      };
    }

    return {
      text: `Review your ${dayName} spending habits for potential savings.`,
      estimatedSavings: savings,
      difficulty: 'medium',
    };
  }

  /**
   * Detect monthly timing patterns (e.g., spending at month end)
   * @param {Array} expenseTransactions - Expense transactions
   * @returns {Object|null} Monthly pattern insight or null
   */
  static _detectMonthlyPatterns(expenseTransactions) {
    const dayOfMonthSpending = Object.create(null);

    expenseTransactions.forEach(transaction => {
      const date = new Date(transaction.date || transaction.timestamp);
      const dayOfMonth = date.getDate();
      const amount = Math.abs(transaction.amount || 0);

      if (!dayOfMonthSpending[dayOfMonth]) {
        dayOfMonthSpending[dayOfMonth] = 0;
      }
      dayOfMonthSpending[dayOfMonth] += amount;
    });

    // Check for month-end spike (days 25-31 vs rest of month)
    const monthEndDays = [25, 26, 27, 28, 29, 30, 31];
    const monthEndTotal = monthEndDays.reduce(
      (sum, d) => sum + (dayOfMonthSpending[d] || 0),
      0
    );
    const otherDaysTotal = Object.entries(dayOfMonthSpending)
      .filter(([d]) => !monthEndDays.includes(parseInt(d)))
      .reduce((sum, [, v]) => sum + v, 0);

    const otherDaysCount = Object.keys(dayOfMonthSpending).filter(
      d => !monthEndDays.includes(parseInt(d))
    ).length;
    const monthEndDaysCount = monthEndDays.filter(
      d => dayOfMonthSpending[d]
    ).length;

    const avgOtherDays =
      otherDaysCount > 0 ? otherDaysTotal / otherDaysCount : 0;
    const avgMonthEnd =
      monthEndDaysCount > 0 ? monthEndTotal / monthEndDaysCount : 0;
    const hasBaseline = otherDaysCount > 0 && avgOtherDays > 0;

    if (
      hasBaseline &&
      monthEndDaysCount > 0 &&
      avgMonthEnd > avgOtherDays * 1.5 &&
      avgMonthEnd > 50
    ) {
      const excess = avgMonthEnd - avgOtherDays;
      const percentageAbove = ((avgMonthEnd / avgOtherDays - 1) * 100).toFixed(
        0
      );

      return {
        id: 'month_end_spending_spike',
        type: 'timing_anomaly',
        pattern: 'month_end',
        message: `Spending spikes at month-end (days 25-31) - ${percentageAbove}% above average`,
        description: `Spending spikes at month-end (days 25-31) - ${percentageAbove}% above average`,
        contributingCategory: null,
        suggestion: `Plan ahead for month-end expenses. Consider setting aside budget earlier in the month.`,
        estimatedSavings: Math.round(excess * 0.15),
        severity: 'medium',
        actionable: true,
        metadata: {
          avgOtherDays,
          avgMonthEnd,
          excess,
        },
      };
    }

    return null;
  }
}
