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
   * @returns {Array} Timing anomaly insights
   */
  static detectTimingAnomalies(expenseTransactions) {
    const insights = [];
    const dailySpending = Object.create(null);

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

    // Consistency fix: Use meanDaily * 2 for both detection and message
    const threshold = meanDaily * 2;

    if (maxDaily > threshold && maxDaily > 30) {
      const highSpendingDays = Object.entries(dailySpending).filter(
        ([_date, amount]) => amount > threshold
      ).length;

      insights.push({
        id: 'daily_spending_spike',
        type: 'anomaly',
        message: `Detected ${highSpendingDays} day${highSpendingDays > 1 ? 's' : ''} with unusually high spending (over ${formatCurrency(threshold)}).`,
        severity: 'medium',
        actionable: true,
        recommendation:
          'Review what caused the high spending on these days to better plan for similar situations.',
      });
    }

    return insights;
  }
}
