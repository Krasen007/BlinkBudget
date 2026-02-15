/**
 * Simple Insights Service - Focused on Actionable Insights
 *
 * Provides 3-4 key insights per month instead of overwhelming analytics.
 * Focuses on actionable information users can actually use.
 */

export class SimpleInsightsService {
  /**
   * Generate simple, actionable insights
   */
  static generateSimpleInsights(transactions, currentPeriod) {
    const insights = [];

    try {
      // 1. Top spending category
      const topCategory = this.getTopSpendingCategory(transactions);
      if (topCategory) {
        insights.push({
          type: 'top_category',
          title: 'Top Spending Category',
          description: `You spent the most on ${topCategory.category} this month`,
          amount: topCategory.amount,
          percentage: topCategory.percentage,
          action: 'View transactions',
          priority: 'high'
        });
      }

      // 2. Spending trend
      const trend = this.getSpendingTrend(transactions);
      if (trend) {
        insights.push({
          type: 'spending_trend',
          title: 'Spending Trend',
          description: trend.description,
          amount: trend.change,
          percentage: trend.percentage,
          direction: trend.direction,
          priority: 'medium'
        });
      }

      // 3. Budget alert
      const budgetAlert = this.getBudgetAlert(transactions, currentPeriod);
      if (budgetAlert) {
        insights.push({
          type: 'budget_alert',
          title: 'Budget Alert',
          description: budgetAlert.description,
          amount: budgetAlert.amount,
          percentage: budgetAlert.percentage,
          severity: budgetAlert.severity,
          action: 'Adjust budget',
          priority: 'high'
        });
      }

      // 4. Unusual spending
      const unusualSpending = this.getUnusualSpending(transactions);
      if (unusualSpending) {
        insights.push({
          type: 'unusual_spending',
          title: 'Unusual Spending',
          description: unusualSpending.description,
          amount: unusualSpending.amount,
          category: unusualSpending.category,
          priority: 'medium'
        });
      }

    } catch (error) {
      console.error('Error generating simple insights:', error);
    }

    // Return only 3-4 most important insights
    return insights
      .filter(Boolean)
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 4);
  }

  /**
   * Get top spending category
   */
  static getTopSpendingCategory(transactions) {
    if (!transactions || transactions.length === 0) return null;

    const categoryTotals = {};
    let totalSpending = 0;

    transactions
      .filter(t => t.amount < 0) // Only expenses
      .forEach(transaction => {
        const category = transaction.category || 'Uncategorized';
        const amount = Math.abs(transaction.amount);
        categoryTotals[category] = (categoryTotals[category] || 0) + amount;
        totalSpending += amount;
      });

    if (totalSpending === 0) return null;

    const topCategory = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])[0];

    if (!topCategory) return null;

    return {
      category: topCategory[0],
      amount: topCategory[1],
      percentage: Math.round((topCategory[1] / totalSpending) * 100)
    };
  }

  /**
   * Get spending trend compared to previous period
   */
  static getSpendingTrend(transactions) {
    if (!transactions || transactions.length === 0) return null;

    // Get current period spending
    const currentSpending = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Simplified approach: just compare to a basic threshold or average
    // Since we don't have currentPeriod, we'll use a simple comparison
    const monthlyThreshold = 1000; // Simple threshold for comparison

    const change = currentSpending - monthlyThreshold;
    const percentage = Math.round((change / monthlyThreshold) * 100);
    const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';

    let description = '';
    if (direction === 'up') {
      description = `Spending increased by ${Math.abs(percentage)}% compared to average`;
    } else if (direction === 'down') {
      description = `Spending decreased by ${Math.abs(percentage)}% compared to average`;
    } else {
      description = 'Spending remained stable this month';
    }

    return {
      description,
      change,
      percentage,
      direction
    };
  }

  /**
   * Get budget alert if overspending
   */
  static getBudgetAlert(transactions, _currentPeriod) {
    // This would integrate with BudgetService
    // For now, return a simple alert if spending is high
    const currentSpending = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Simple threshold - alert if spending > €2000
    if (currentSpending > 2000) {
      return {
        description: `High spending detected: €${currentSpending.toFixed(2)} this month`,
        amount: currentSpending,
        percentage: Math.round((currentSpending / 2000) * 100),
        severity: 'warning'
      };
    }

    return null;
  }

  /**
   * Get unusual spending patterns
   */
  static getUnusualSpending(transactions) {
    if (!transactions || transactions.length === 0) return null;

    // Find transactions that are unusually large
    const expenses = transactions.filter(t => t.amount < 0);
    const amounts = expenses.map(t => Math.abs(t.amount));
    const average = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
    const threshold = average * 3; // 3x average is unusual

    const unusualTransactions = expenses.filter(t => Math.abs(t.amount) > threshold);

    if (unusualTransactions.length > 0) {
      const unusual = unusualTransactions[0]; // Get first unusual transaction
      return {
        description: `Unusual expense: €${Math.abs(unusual.amount).toFixed(2)} for ${unusual.category || 'Uncategorized'}`,
        amount: Math.abs(unusual.amount),
        category: unusual.category || 'Uncategorized'
      };
    }

    return null;
  }

  /**
   * Helper to get previous period
   */
  static getPreviousPeriod(currentPeriod) {
    // Simplified - just subtract one month
    const date = new Date(currentPeriod.startDate);
    date.setMonth(date.getMonth() - 1);
    return {
      startDate: date,
      endDate: new Date(date.getFullYear(), date.getMonth() + 1, 0)
    };
  }

  /**
   * Helper to get transactions for a period
   */
  static getTransactionsForPeriod(transactions, period) {
    if (!transactions || !period) return [];

    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= period.startDate && transactionDate <= period.endDate;
    });
  }
}
