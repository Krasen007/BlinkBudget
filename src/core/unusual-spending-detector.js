/**
 * Unusual Spending Detector
 *
 * Detects unusual spending patterns and outliers in transactions.
 * Can be used to flag transactions in lists and provide budget recommendations.
 */

export class UnusualSpendingDetector {
  /**
   * Detect unusual transactions based on statistical analysis
   * @param {Array} transactions - Array of transaction objects
   * @param {Object} options - Detection options
   * @param {number} [options.multiplier=3] - Standard deviation multiplier for outlier detection
   * @param {number} [options.minTransactions=5] - Minimum transactions needed for analysis
   * @param {string} [options.category] - Specific category to analyze (optional)
   * @returns {Array} Array of unusual transactions with metadata
   */
  static detectUnusualTransactions(transactions, options = {}) {
    const { multiplier = 3, minTransactions = 5, category = null } = options;

    if (!transactions || transactions.length < minTransactions) {
      return [];
    }

    // Filter by category if specified
    const relevantTransactions = category
      ? transactions.filter(
          t => t.category === category && t.type === 'expense'
        )
      : transactions.filter(t => t.type === 'expense');

    if (relevantTransactions.length < minTransactions) {
      return [];
    }

    // Calculate statistics
    const amounts = relevantTransactions.map(t => t.amount ?? 0);
    const mean = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
    const variance =
      amounts.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) /
      amounts.length;
    const standardDeviation = Math.sqrt(variance);

    // Calculate threshold (mean + multiplier * standard deviation)
    const threshold = mean + multiplier * standardDeviation;

    // Find outliers
    const unusualTransactions = relevantTransactions.filter(
      t => t.amount > threshold
    );

    // Return with additional metadata
    return unusualTransactions.map(transaction => ({
      ...transaction,
      unusualSpending: {
        averageAmount: mean,
        standardDeviation,
        threshold,
        multiplier:
          mean !== 0 && Number.isFinite(mean)
            ? (transaction.amount / mean).toFixed(1)
            : 'N/A',
        deviation:
          standardDeviation !== 0 && Number.isFinite(standardDeviation)
            ? ((transaction.amount - mean) / standardDeviation).toFixed(2)
            : 'N/A',
      },
    }));
  }

  /**
   * Get category-specific unusual spending analysis
   * @param {Array} transactions - Array of transaction objects
   * @returns {Object} Analysis by category
   */
  static getCategoryAnalysis(transactions) {
    if (!transactions || transactions.length === 0) {
      return {};
    }

    // Group transactions by category
    const categoryGroups = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        const category = transaction.category || 'Uncategorized';
        if (!categoryGroups[category]) {
          categoryGroups[category] = [];
        }
        categoryGroups[category].push(transaction);
      });

    // Analyze each category
    const analysis = {};
    Object.entries(categoryGroups).forEach(
      ([category, categoryTransactions]) => {
        if (categoryTransactions.length >= 5) {
          // Minimum for meaningful analysis - consistent with detectUnusualTransactions default
          const unusual = this.detectUnusualTransactions(categoryTransactions, {
            category,
            minTransactions: 5, // Explicitly pass minTransactions for consistency
          });
          const amounts = categoryTransactions.map(t => t.amount ?? 0);
          const mean = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;

          analysis[category] = {
            totalTransactions: categoryTransactions.length,
            unusualTransactions: unusual,
            unusualCount: unusual.length,
            averageAmount: mean,
            totalSpent: amounts.reduce((sum, a) => sum + a, 0),
            unusualPercentage:
              (unusual.length / categoryTransactions.length) * 100,
          };
        }
      }
    );

    return analysis;
  }

  /**
   * Get budget recommendations based on unusual spending patterns
   * @param {Array} transactions - Array of transaction objects
   * @param {Array} budgets - Array of budget objects
   * @returns {Array} Budget recommendations
   */
  static getBudgetRecommendations(transactions, budgets = []) {
    const categoryAnalysis = this.getCategoryAnalysis(transactions);
    const recommendations = [];

    Object.entries(categoryAnalysis).forEach(([category, analysis]) => {
      // High unusual spending percentage recommendation
      if (analysis.unusualPercentage >= 20) {
        recommendations.push({
          type: 'unusual_spending_alert',
          category,
          priority: 'high',
          title: `Unusual Spending in ${category}`,
          description: `${analysis.unusualCount} unusual transactions detected (${analysis.unusualPercentage.toFixed(1)}% of spending)`,
          suggestion:
            'Review recent transactions in this category and consider adjusting your budget',
          data: analysis,
        });
      }

      // Budget vs actual spending comparison
      const budget = budgets.find(b => b.categoryName === category);
      if (budget && analysis.totalSpent > budget.amountLimit) {
        const overBudget = analysis.totalSpent - budget.amountLimit;
        recommendations.push({
          type: 'budget_exceeded',
          category,
          priority: 'high',
          title: `Budget Exceeded in ${category}`,
          description: `Spent ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(overBudget)} over budget`,
          suggestion: `Consider increasing budget or reducing spending in ${category}`,
          data: {
            ...analysis,
            budgetLimit: budget.amountLimit,
            overBudget,
          },
        });
      }

      // High variance recommendation
      const amounts = transactions
        .filter(t => t.type === 'expense' && t.category === category)
        .map(t => t.amount ?? 0);

      if (amounts.length >= 5) {
        const mean = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;

        // Guard against division by zero
        if (mean === 0) {
          return; // Skip this category if mean is zero
        }

        const variance =
          amounts.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) /
          amounts.length;
        const coefficientOfVariation = Math.sqrt(variance) / mean;

        if (coefficientOfVariation > 0.5) {
          // High variance threshold
          recommendations.push({
            type: 'high_variance',
            category,
            priority: 'medium',
            title: `Variable Spending in ${category}`,
            description:
              'Spending in this category varies significantly month to month',
            suggestion:
              'Consider building a buffer in your budget for this category',
            data: {
              ...analysis,
              coefficientOfVariation: (coefficientOfVariation * 100).toFixed(1),
            },
          });
        }
      }
    });

    // Sort by priority
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Check if a single transaction is unusual
   * @param {Object} transaction - Transaction to check
   * @param {Array} allTransactions - All transactions for comparison
   * @returns {Object|null} Unusual spending data or null if not unusual
   */
  static isTransactionUnusual(transaction, allTransactions) {
    if (transaction.type !== 'expense') {
      return null;
    }

    const categoryTransactions = allTransactions.filter(
      t =>
        t.type === 'expense' &&
        t.category === transaction.category &&
        t.id !== transaction.id
    );

    if (categoryTransactions.length < 5) {
      return null;
    }

    const amounts = categoryTransactions.map(t => t.amount ?? 0);

    const mean = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
    const variance =
      amounts.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) /
      amounts.length;
    const standardDeviation = Math.sqrt(variance);
    const threshold = mean + 3 * standardDeviation;

    if (transaction.amount > threshold) {
      // Compute safe values to avoid division by zero
      let multiplier = 'N/A';
      let deviation = 'N/A';

      if (mean !== 0 && Number.isFinite(mean)) {
        multiplier = (transaction.amount / mean).toFixed(1);
      }

      if (standardDeviation !== 0 && Number.isFinite(standardDeviation)) {
        deviation = ((transaction.amount - mean) / standardDeviation).toFixed(
          2
        );
      }

      return {
        isUnusual: true,
        averageAmount: mean,
        threshold,
        multiplier,
        deviation,
      };
    }

    return null;
  }
}
