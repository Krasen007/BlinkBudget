/**
 * AnomalyService
 * Detects spending anomalies and unusual patterns.
 */

import { TRANSACTION_TYPES } from '../../utils/constants.js';
import { FilteringService } from './FilteringService.js';

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

    // Detect spending spikes
    insights.push(...this.detectSpendingSpikes(expenseTransactions));

    // Detect unusual category concentrations
    insights.push(...this.detectCategoryConcentration(expenseTransactions));

    // Detect unusual timing patterns
    insights.push(...this.detectTimingAnomalies(expenseTransactions));

    return insights;
  }

  /**
   * Detect spending spikes using statistical analysis
   * @param {Array} expenseTransactions - Expense transactions
   * @returns {Array} Spike detection insights
   */
  static detectSpendingSpikes(expenseTransactions) {
    const insights = [];
    const amounts = expenseTransactions.map(t => Math.abs(t.amount || 0));

    if (amounts.length < 5) {
      return insights;
    }

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
      const totalSpikeAmount = spikes.reduce(
        (sum, t) => sum + Math.abs(t.amount || 0),
        0
      );
      const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);
      const spikePercentage = (totalSpikeAmount / totalAmount) * 100;

      insights.push({
        id: 'spending_spikes',
        type: 'anomaly',
        message: `Detected ${spikes.length} unusually large transaction${spikes.length > 1 ? 's' : ''} (over ${spikeThreshold.toFixed(2)}) totaling ${totalSpikeAmount.toFixed(2)} (${spikePercentage.toFixed(1)}% of total spending).`,
        severity: spikePercentage > 30 ? 'high' : 'medium',
        actionable: true,
        recommendation:
          'Review these large transactions to ensure they align with your budget and financial goals.',
        metadata: {
          spikeTransactions: spikes.map(t => ({
            amount: t.amount,
            category: t.category,
            description: t.description,
            date: t.date || t.timestamp,
          })),
          threshold: spikeThreshold,
        },
      });
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
   * @returns {Array} Timing anomaly insights
   */
  static detectTimingAnomalies(expenseTransactions) {
    const insights = [];
    const dailySpending = {};

    expenseTransactions.forEach(transaction => {
      const date = new Date(transaction.date || transaction.timestamp);
      const dateKey = date.toISOString().split('T')[0];
      const amount = Math.abs(transaction.amount || 0);

      if (!dailySpending[dateKey]) {
        dailySpending[dateKey] = 0;
      }
      dailySpending[dateKey] += amount;
    });

    const dailyAmounts = Object.values(dailySpending);
    if (dailyAmounts.length < 3) return insights;

    const meanDaily =
      dailyAmounts.reduce((sum, amount) => sum + amount, 0) /
      dailyAmounts.length;
    const maxDaily = Math.max(...dailyAmounts);

    if (maxDaily > meanDaily * 2 && maxDaily > 30) {
      const highSpendingDays = Object.entries(dailySpending).filter(
        ([_date, amount]) => amount > meanDaily * 2
      ).length;

      insights.push({
        id: 'daily_spending_spike',
        type: 'anomaly',
        message: `Detected ${highSpendingDays} day${highSpendingDays > 1 ? 's' : ''} with unusually high spending (over ${(meanDaily * 3).toFixed(2)}).`,
        severity: 'medium',
        actionable: true,
        recommendation:
          'Review what caused the high spending on these days to better plan for similar situations.',
      });
    }

    return insights;
  }
}
