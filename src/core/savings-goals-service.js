/**
 * Savings Goals Service
 *
 * Manages savings goals with progress tracking and visual indicators.
 * Integrates with budget tracking and financial planning.
 */

// StorageService methods are synchronous, so these wrappers are too. They were
// `async` over an `await import()` of a module GoalsSection already imports
// statically, which forced an artificial promise on every caller for no gain.
import { StorageService } from './storage.js';

export class SavingsGoalsService {
  /**
   * Get all savings goals from storage
   * @returns {Array} Array of savings goals
   */
  static getSavingsGoals() {
    return StorageService.getGoals() || [];
  }

  /**
   * Save a savings goal
   * @param {Object} goal - Goal object
   * @returns {Object} Saved goal
   */
  static saveSavingsGoal(goal) {
    return StorageService.addGoal(goal);
  }

  /**
   * Delete a savings goal
   * @param {string} goalId - Goal ID to delete
   */
  static deleteSavingsGoal(goalId) {
    return StorageService.deleteGoal(goalId);
  }

  /**
   * Calculate progress for all goals using their manually maintained balances.
   * @param {Array} [_transactions] - Legacy input; transactions are not goal funding
   * @returns {Array} Goals with progress data
   */
  static async calculateGoalProgress(_transactions = []) {
    const goals = await this.getSavingsGoals();

    return goals.map(goal => {
      const progress = this.calculateSingleGoalProgress(goal, _transactions);
      return {
        ...goal,
        progress,
      };
    });
  }

  /**
   * Calculate progress for a single goal
   * @param {Object} goal - Goal object
   * @param {Array} [_transactions] - Legacy input; transactions are not goal funding
   * @returns {Object} Progress data
   */
  static calculateSingleGoalProgress(goal, _transactions = []) {
    // Goal balances are manually maintained. Transaction history is not a
    // funding source unless a transaction-to-goal workflow is added.
    const totalSaved = Number(goal.currentSavings || 0);

    const percentage =
      goal.targetAmount > 0 ? (totalSaved / goal.targetAmount) * 100 : 0;
    const remaining = Math.max(0, goal.targetAmount - totalSaved);
    const isCompleted = percentage >= 100;

    return {
      currentAmount: totalSaved,
      targetAmount: goal.targetAmount,
      percentage: Math.min(percentage, 100),
      remaining,
      isCompleted,
      monthlySavingRate: null,
      estimatedMonthsToComplete: null,
      fundingModel: 'manual',
      fundingNote:
        'Manually maintained; not linked to account balances or transactions.',
      contributingTransactions: 0,
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
    const hasEmergencyFundGoal = this.getSavingsGoals().some(goal => {
      const name = goal.name?.trim().toLowerCase();
      return name === 'emergency fund' || name === 'build emergency fund';
    });

    if (emergencyFundTarget > 0 && !hasEmergencyFundGoal) {
      recommendations.push({
        type: 'emergency_fund',
        title: 'Build Emergency Fund',
        description: `Create a manually tracked goal with a target of ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(emergencyFundTarget)} (6 months of expenses)`,
        target: emergencyFundTarget,
        current: 0,
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
      (sum, goal) => sum + Number(goal.targetAmount || 0),
      0
    );
    const totalSaved = goalsWithProgress.reduce(
      (sum, goal) => sum + Number(goal.progress?.currentAmount ?? 0),
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
