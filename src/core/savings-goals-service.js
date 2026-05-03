/**
 * Savings Goals Service
 *
 * Manages savings goals with progress tracking and visual indicators.
 * Integrates with budget tracking and financial planning.
 */

export class SavingsGoalsService {
  /**
   * Get all savings goals from storage
   * @returns {Array} Array of savings goals
   */
  static async getSavingsGoals() {
    const { StorageService } = await import('./storage.js');
    return StorageService.getGoals() || [];
  }

  /**
   * Save a savings goal
   * @param {Object} goal - Goal object
   * @returns {Object} Saved goal
   */
  static async saveSavingsGoal(goal) {
    const { StorageService } = await import('./storage.js');
    return StorageService.addGoal(goal);
  }

  /**
   * Delete a savings goal
   * @param {string} goalId - Goal ID to delete
   */
  static async deleteSavingsGoal(goalId) {
    const { StorageService } = await import('./storage.js');
    return StorageService.deleteGoal(goalId);
  }

  /**
   * Calculate progress for all goals based on transactions
   * @param {Array} transactions - Transaction array
   * @returns {Array} Goals with progress data
   */
  static async calculateGoalProgress(transactions = []) {
    const goals = await this.getSavingsGoals();

    return goals.map(goal => {
      const progress = this.calculateSingleGoalProgress(goal, transactions);
      return {
        ...goal,
        progress,
      };
    });
  }

  /**
   * Calculate progress for a single goal
   * @param {Object} goal - Goal object
   * @param {Array} transactions - Transaction array
   * @returns {Object} Progress data
   */
  static calculateSingleGoalProgress(goal, transactions = []) {
    // Filter transactions that contribute to this goal
    // This could be based on category, tags, or specific savings transactions
    const relevantTransactions = transactions.filter(t => {
      // For now, assume income transactions and specific "savings" category
      return t.type === 'income' || t.category === 'Savings';
    });

    const totalSaved = relevantTransactions.reduce((sum, t) => {
      return sum + (t.amount || 0);
    }, 0);

    const percentage =
      goal.targetAmount > 0 ? (totalSaved / goal.targetAmount) * 100 : 0;
    const remaining = Math.max(0, goal.targetAmount - totalSaved);
    const isCompleted = percentage >= 100;

    // Calculate estimated completion date based on recent saving rate
    const recentTransactions = relevantTransactions.filter(t => {
      const transactionDate = new Date(t.timestamp);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      return transactionDate >= threeMonthsAgo;
    });

    const monthlySavingRate =
      recentTransactions.length > 0
        ? recentTransactions.reduce((sum, t) => sum + (t.amount || 0), 0) / 3
        : 0;

    let estimatedMonthsToComplete = null;
    if (monthlySavingRate > 0 && !isCompleted) {
      estimatedMonthsToComplete = Math.ceil(remaining / monthlySavingRate);
    }

    return {
      currentAmount: totalSaved,
      targetAmount: goal.targetAmount,
      percentage: Math.min(percentage, 100),
      remaining,
      isCompleted,
      monthlySavingRate,
      estimatedMonthsToComplete,
      contributingTransactions: relevantTransactions.length,
    };
  }

  /**
   * Get goal recommendations based on spending patterns
   * @param {Array} transactions - Transaction array
   * @param {Array} budgets - Budget array
   * @returns {Array} Goal recommendations
   */
  static async getGoalRecommendations(transactions = [], _budgets = []) {
    const recommendations = [];

    // Calculate monthly income and expenses
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.timestamp);
      return (
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear
      );
    });

    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const monthlySavings = monthlyIncome - monthlyExpenses;

    // Emergency fund recommendation
    const emergencyFundTarget = monthlyExpenses * 6; // 6 months expenses
    const currentEmergencyFund = transactions
      .filter(t => t.category === 'Emergency Fund' || t.category === 'Savings')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    if (currentEmergencyFund < emergencyFundTarget) {
      recommendations.push({
        type: 'emergency_fund',
        title: 'Build Emergency Fund',
        description: `Save ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(emergencyFundTarget - currentEmergencyFund)} to reach 6 months of expenses`,
        target: emergencyFundTarget,
        current: currentEmergencyFund,
        priority: 'high',
        category: 'Emergency Fund',
      });
    }

    // Retirement savings recommendation (10% of income)
    const retirementMonthlyTarget = monthlyIncome * 0.1;
    if (monthlySavings > retirementMonthlyTarget) {
      recommendations.push({
        type: 'retirement',
        title: 'Retirement Savings',
        description: `Consider saving ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(retirementMonthlyTarget)} monthly for retirement`,
        target: null, // Ongoing goal
        current: 0,
        priority: 'medium',
        category: 'Retirement',
      });
    }

    // Vacation fund suggestion
    const vacationTarget = 2000; // Default vacation target
    recommendations.push({
      type: 'vacation',
      title: 'Vacation Fund',
      description: 'Save for your next vacation',
      target: vacationTarget,
      current: 0,
      priority: 'low',
      category: 'Vacation',
    });

    return recommendations;
  }

  /**
   * Get savings goals summary for dashboard
   * @param {Array} transactions - Transaction array
   * @returns {Object} Summary data
   */
  static async getSavingsSummary(transactions = []) {
    const goalsWithProgress = await this.calculateGoalProgress(transactions);

    const totalTarget = goalsWithProgress.reduce(
      (sum, goal) => sum + goal.targetAmount,
      0
    );
    const totalSaved = goalsWithProgress.reduce(
      (sum, goal) => sum + goal.progress.currentAmount,
      0
    );
    const completedGoals = goalsWithProgress.filter(
      goal => goal.progress.isCompleted
    ).length;
    const activeGoals = goalsWithProgress.length - completedGoals;

    return {
      totalGoals: goalsWithProgress.length,
      activeGoals,
      completedGoals,
      totalTarget,
      totalSaved,
      overallProgress: totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0,
      goalsWithProgress,
    };
  }
}
