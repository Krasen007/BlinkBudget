/**
 * Goal Planner - Long-term Financial Goal Management
 *
 * Manages long-term financial goals and tracks progress toward achievement.
 * Provides wealth projections, savings calculations, and goal feasibility analysis.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */

import { generateId } from '../utils/id-utils.js';
import { safeJsonParse } from '../utils/security-utils.js';

export class GoalPlanner {
  constructor() {
    this.storageKey = 'blinkbudget_goals';
    this.goals = this._loadGoals();

    // Default assumptions for different goal types
    this.goalDefaults = {
      retirement: {
        expectedReturn: 0.07, // 7% annual return
        inflationRate: 0.03, // 3% inflation
        withdrawalRate: 0.04, // 4% safe withdrawal rate
      },
      house: {
        expectedReturn: 0.05, // 5% annual return (conservative)
        inflationRate: 0.03,
        downPaymentPercent: 0.2, // 20% down payment
      },
      education: {
        expectedReturn: 0.06, // 6% annual return
        inflationRate: 0.05, // Higher inflation for education costs
        costGrowthRate: 0.06, // Education costs grow faster than general inflation
      },
      emergency_fund: {
        expectedReturn: 0.02, // 2% annual return (high-yield savings)
        inflationRate: 0.03,
        monthsOfExpenses: 6, // 6 months of expenses
      },
      custom: {
        expectedReturn: 0.06, // 6% annual return
        inflationRate: 0.03,
      },
    };
  }

  /**
   * Create a new financial goal
   * @param {string} name - Goal name
   * @param {number} targetAmount - Target amount to save
   * @param {Date} targetDate - Target completion date
   * @param {number} currentSavings - Current amount saved (default: 0)
   * @param {Object} options - Additional goal options
   * @returns {Object} Created goal object
   */
  createGoal(name, targetAmount, targetDate, currentSavings = 0, options = {}) {
    try {
      // Validate inputs
      if (!name || typeof name !== 'string') {
        throw new Error('Goal name is required and must be a string');
      }
      if (
        !targetAmount ||
        typeof targetAmount !== 'number' ||
        targetAmount <= 0
      ) {
        throw new Error('Target amount must be a positive number');
      }
      if (!targetDate || !(targetDate instanceof Date)) {
        throw new Error('Target date must be a valid Date object');
      }
      if (targetDate <= new Date()) {
        throw new Error('Target date must be in the future');
      }
      if (typeof currentSavings !== 'number' || currentSavings < 0) {
        throw new Error('Current savings must be a non-negative number');
      }

      const goalType = options.type || 'custom';
      const defaults = this.goalDefaults[goalType] || this.goalDefaults.custom;

      const goal = {
        id: generateId(),
        name: name.trim(),
        type: goalType,
        targetAmount: Math.round(targetAmount * 100) / 100,
        targetDate: new Date(targetDate),
        currentSavings: Math.round(currentSavings * 100) / 100,
        monthlyContribution: options.monthlyContribution || 0,
        priority: options.priority || 'medium',
        expectedReturn: options.expectedReturn || defaults.expectedReturn,
        inflationRate: options.inflationRate || defaults.inflationRate,
        description: options.description || '',
        createdDate: new Date(),
        updatedDate: new Date(),
      };

      // Calculate required monthly savings
      goal.requiredMonthlySavings = this.calculateRequiredMonthlySavings(goal);

      this.goals.push(goal);
      this._saveGoals();

      return goal;
    } catch (error) {
      console.error('Error creating goal:', error);
      throw error;
    }
  }

  /**
   * Update goal progress with new savings amount
   * @param {string} goalId - Goal ID
   * @param {number} newSavings - New current savings amount
   * @returns {Object|null} Updated goal or null if not found
   */
  updateGoalProgress(goalId, newSavings) {
    try {
      if (typeof newSavings !== 'number' || newSavings < 0) {
        throw new Error('New savings amount must be a non-negative number');
      }

      const goal = this.goals.find(g => g.id === goalId);
      if (!goal) {
        return null;
      }

      goal.currentSavings = Math.round(newSavings * 100) / 100;
      goal.updatedDate = new Date();

      // Recalculate required monthly savings
      goal.requiredMonthlySavings = this.calculateRequiredMonthlySavings(goal);

      this._saveGoals();
      return goal;
    } catch (error) {
      console.error('Error updating goal progress:', error);
      throw error;
    }
  }

  /**
   * Delete a goal
   * @param {string} goalId - Goal ID to delete
   * @returns {boolean} True if deleted, false if not found
   */
  deleteGoal(goalId) {
    try {
      const index = this.goals.findIndex(g => g.id === goalId);
      if (index === -1) {
        return false;
      }

      this.goals.splice(index, 1);
      this._saveGoals();
      return true;
    } catch (error) {
      console.error('Error deleting goal:', error);
      throw error;
    }
  }

  /**
   * Update goal properties
   * @param {string} goalId
   * @param {Object} updates - fields to update (name, targetAmount, targetDate, currentSavings, monthlyContribution, priority, expectedReturn, inflationRate, description)
   * @returns {Object|null} Updated goal or null if not found
   */
  updateGoal(goalId, updates = {}) {
    try {
      const goal = this.goals.find(g => g.id === goalId);
      if (!goal) return null;

      const allowed = [
        'name',
        'targetAmount',
        'targetDate',
        'currentSavings',
        'monthlyContribution',
        'priority',
        'expectedReturn',
        'inflationRate',
        'description',
      ];
      allowed.forEach(key => {
        if (updates[key] !== undefined) {
          if (key === 'targetDate') {
            goal[key] = new Date(updates[key]);
          } else if (typeof updates[key] === 'number') {
            goal[key] = Math.round(updates[key] * 100) / 100;
          } else {
            goal[key] = updates[key];
          }
        }
      });

      // Recalculate derived fields
      goal.requiredMonthlySavings = this.calculateRequiredMonthlySavings(goal);
      goal.updatedDate = new Date();
      this._saveGoals();
      return goal;
    } catch (error) {
      console.error('Error updating goal:', error);
      throw error;
    }
  }

  /**
   * Get all goals
   * @returns {Array} Array of goal objects
   */
  getAllGoals() {
    return [...this.goals];
  }

  /**
   * Get goal by ID
   * @param {string} goalId - Goal ID
   * @returns {Object|null} Goal object or null if not found
   */
  getGoal(goalId) {
    return this.goals.find(g => g.id === goalId) || null;
  }

  /**
   * Calculate required monthly savings to reach a goal
   * @param {Object} goal - Goal object
   * @returns {number} Required monthly savings amount
   */
  calculateRequiredMonthlySavings(goal) {
    try {
      const now = new Date();
      const monthsRemaining = this._calculateMonthsRemaining(
        now,
        goal.targetDate
      );

      if (monthsRemaining <= 0) {
        return 0; // Goal date has passed
      }

      const remainingAmount = goal.targetAmount - goal.currentSavings;

      if (remainingAmount <= 0) {
        return 0; // Goal already achieved
      }

      // If no expected return, use simple division
      if (goal.expectedReturn <= 0) {
        return Math.round((remainingAmount / monthsRemaining) * 100) / 100;
      }

      // Calculate with compound interest
      const monthlyReturn = goal.expectedReturn / 12;
      const futureValueOfCurrentSavings =
        goal.currentSavings * Math.pow(1 + monthlyReturn, monthsRemaining);
      const adjustedTarget = goal.targetAmount - futureValueOfCurrentSavings;

      if (adjustedTarget <= 0) {
        return 0; // Current savings will grow to meet the goal
      }

      // Calculate required monthly payment using future value of annuity formula
      const monthlyPayment =
        adjustedTarget /
        ((Math.pow(1 + monthlyReturn, monthsRemaining) - 1) / monthlyReturn);

      return Math.round(Math.max(0, monthlyPayment) * 100) / 100;
    } catch (error) {
      console.error('Error calculating required monthly savings:', error);
      return 0;
    }
  }

  /**
   * Calculate goal progress percentage
   * @param {Object} goal - Goal object
   * @returns {number} Progress percentage (0-100)
   */
  calculateGoalProgress(goal) {
    if (goal.targetAmount <= 0) return 0;
    const progress = (goal.currentSavings / goal.targetAmount) * 100;
    return Math.min(100, Math.max(0, Math.round(progress * 100) / 100));
  }

  /**
   * Assess goal feasibility based on projected income and expenses
   * @param {Object} goal - Goal object
   * @param {number} projectedMonthlyIncome - Projected monthly income
   * @param {number} projectedMonthlyExpenses - Projected monthly expenses
   * @returns {Object} Feasibility assessment
   */
  assessGoalFeasibility(
    goal,
    projectedMonthlyIncome,
    projectedMonthlyExpenses
  ) {
    try {
      const availableMonthlyIncome =
        projectedMonthlyIncome - projectedMonthlyExpenses;
      const requiredMonthlySavings = this.calculateRequiredMonthlySavings(goal);
      const savingsRate =
        projectedMonthlyIncome > 0
          ? (requiredMonthlySavings / projectedMonthlyIncome) * 100
          : 0;

      let feasibility, message, recommendation;

      if (requiredMonthlySavings <= 0) {
        feasibility = 'achieved';
        message =
          'Goal is already achieved or will be met with current savings growth';
        recommendation = 'Consider setting a new, more ambitious goal';
      } else if (availableMonthlyIncome <= 0) {
        feasibility = 'not_feasible';
        message =
          'Current expenses exceed income - goal cannot be achieved without changes';
        recommendation =
          'Reduce expenses or increase income before pursuing this goal';
      } else if (requiredMonthlySavings <= availableMonthlyIncome * 0.5) {
        feasibility = 'easily_achievable';
        message = `Goal requires ${savingsRate.toFixed(1)}% of income - very achievable`;
        recommendation =
          'Consider increasing the goal amount or setting additional goals';
      } else if (requiredMonthlySavings <= availableMonthlyIncome * 0.8) {
        feasibility = 'achievable';
        message = `Goal requires ${savingsRate.toFixed(1)}% of income - achievable with discipline`;
        recommendation =
          'Create a detailed budget to ensure consistent savings';
      } else if (requiredMonthlySavings <= availableMonthlyIncome) {
        feasibility = 'challenging';
        message = `Goal requires ${savingsRate.toFixed(1)}% of income - very challenging`;
        recommendation =
          'Consider extending the timeline or reducing the target amount';
      } else {
        feasibility = 'not_feasible';
        message = `Goal requires more than available income (${savingsRate.toFixed(1)}% of income)`;
        recommendation =
          'Extend the timeline, reduce the target, or increase income';
      }

      return {
        feasibility,
        message,
        recommendation,
        requiredMonthlySavings,
        availableMonthlyIncome,
        savingsRate: Math.round(savingsRate * 100) / 100,
        monthsRemaining: this._calculateMonthsRemaining(
          new Date(),
          goal.targetDate
        ),
      };
    } catch (error) {
      console.error('Error assessing goal feasibility:', error);
      return {
        feasibility: 'error',
        message: 'Error assessing goal feasibility',
        recommendation: 'Please check goal parameters and try again',
        requiredMonthlySavings: 0,
        availableMonthlyIncome: 0,
        savingsRate: 0,
        monthsRemaining: 0,
      };
    }
  }

  /**
   * Project wealth accumulation over time
   * @param {number} monthlySavingsRate - Monthly savings amount
   * @param {number} annualInvestmentReturn - Expected annual return (decimal)
   * @param {number} years - Number of years to project
   * @param {number} initialAmount - Starting amount (default: 0)
   * @returns {Array} Array of yearly wealth projections
   */
  projectWealthAccumulation(
    monthlySavingsRate,
    annualInvestmentReturn,
    years,
    initialAmount = 0
  ) {
    try {
      const projections = [];
      const monthlyReturn = annualInvestmentReturn / 12;
      let currentWealth = initialAmount;

      for (let year = 1; year <= years; year++) {
        // Calculate wealth growth for this year
        for (let month = 1; month <= 12; month++) {
          // Add monthly savings
          currentWealth += monthlySavingsRate;
          // Apply monthly return
          currentWealth *= 1 + monthlyReturn;
        }

        const yearlyContribution = monthlySavingsRate * 12;
        const investmentGrowth =
          currentWealth - (initialAmount + yearlyContribution * year);

        projections.push({
          year,
          projectedWealth: Math.round(currentWealth * 100) / 100,
          totalContributions:
            Math.round((initialAmount + yearlyContribution * year) * 100) / 100,
          investmentGrowth: Math.round(investmentGrowth * 100) / 100,
          annualContribution: yearlyContribution,
        });
      }

      return projections;
    } catch (error) {
      console.error('Error projecting wealth accumulation:', error);
      return [];
    }
  }

  /**
   * Model retirement needs based on current age and desired retirement lifestyle
   * @param {number} currentAge - Current age
   * @param {number} retirementAge - Desired retirement age
   * @param {number} desiredMonthlyIncome - Desired monthly income in retirement
   * @param {Object} options - Additional options
   * @returns {Object} Retirement planning analysis
   */
  modelRetirementNeeds(
    currentAge,
    retirementAge,
    desiredMonthlyIncome,
    options = {}
  ) {
    try {
      if (currentAge >= retirementAge) {
        throw new Error('Retirement age must be greater than current age');
      }

      const yearsToRetirement = retirementAge - currentAge;
      const retirementYears = options.retirementYears || 85 - retirementAge; // Assume living to 85
      const inflationRate =
        options.inflationRate || this.goalDefaults.retirement.inflationRate;
      const expectedReturn =
        options.expectedReturn || this.goalDefaults.retirement.expectedReturn;
      const withdrawalRate =
        options.withdrawalRate || this.goalDefaults.retirement.withdrawalRate;

      // Adjust desired income for inflation
      const inflationAdjustedIncome =
        desiredMonthlyIncome * Math.pow(1 + inflationRate, yearsToRetirement);
      const annualIncomeNeeded = inflationAdjustedIncome * 12;

      // Calculate required retirement fund using withdrawal rate
      const requiredRetirementFund = annualIncomeNeeded / withdrawalRate;

      // Calculate required monthly savings
      const monthlyReturn = expectedReturn / 12;
      const monthsToRetirement = yearsToRetirement * 12;
      const requiredMonthlySavings =
        requiredRetirementFund /
        ((Math.pow(1 + monthlyReturn, monthsToRetirement) - 1) / monthlyReturn);

      return {
        currentAge,
        retirementAge,
        yearsToRetirement,
        retirementYears,
        desiredMonthlyIncome,
        inflationAdjustedIncome:
          Math.round(inflationAdjustedIncome * 100) / 100,
        annualIncomeNeeded: Math.round(annualIncomeNeeded * 100) / 100,
        requiredRetirementFund: Math.round(requiredRetirementFund * 100) / 100,
        requiredMonthlySavings: Math.round(requiredMonthlySavings * 100) / 100,
        assumptions: {
          inflationRate: inflationRate * 100,
          expectedReturn: expectedReturn * 100,
          withdrawalRate: withdrawalRate * 100,
        },
      };
    } catch (error) {
      console.error('Error modeling retirement needs:', error);
      throw error;
    }
  }

  /**
   * Get goals summary with progress and priorities
   * @returns {Object} Goals summary
   */
  getGoalsSummary() {
    const totalGoals = this.goals.length;
    const completedGoals = this.goals.filter(
      g => this.calculateGoalProgress(g) >= 100
    ).length;
    const totalTargetAmount = this.goals.reduce(
      (sum, g) => sum + g.targetAmount,
      0
    );
    const totalCurrentSavings = this.goals.reduce(
      (sum, g) => sum + g.currentSavings,
      0
    );
    const totalRequiredMonthlySavings = this.goals.reduce(
      (sum, g) => sum + g.requiredMonthlySavings,
      0
    );

    const goalsByPriority = {
      high: this.goals.filter(g => g.priority === 'high').length,
      medium: this.goals.filter(g => g.priority === 'medium').length,
      low: this.goals.filter(g => g.priority === 'low').length,
    };

    const goalsByType = {};
    this.goals.forEach(goal => {
      goalsByType[goal.type] = (goalsByType[goal.type] || 0) + 1;
    });

    return {
      totalGoals,
      completedGoals,
      activeGoals: totalGoals - completedGoals,
      totalTargetAmount: Math.round(totalTargetAmount * 100) / 100,
      totalCurrentSavings: Math.round(totalCurrentSavings * 100) / 100,
      totalRequiredMonthlySavings:
        Math.round(totalRequiredMonthlySavings * 100) / 100,
      overallProgress:
        totalTargetAmount > 0
          ? Math.round((totalCurrentSavings / totalTargetAmount) * 10000) / 100
          : 0,
      goalsByPriority,
      goalsByType,
    };
  }

  /**
   * Calculate months remaining until target date
   * @param {Date} fromDate - Starting date
   * @param {Date} toDate - Target date
   * @returns {number} Months remaining
   */
  _calculateMonthsRemaining(fromDate, toDate) {
    const yearDiff = toDate.getFullYear() - fromDate.getFullYear();
    const monthDiff = toDate.getMonth() - fromDate.getMonth();
    return Math.max(0, yearDiff * 12 + monthDiff);
  }

  /**
   * Load goals from localStorage
   * @returns {Array} Array of goals
   */
  _loadGoals() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];

      const goals = safeJsonParse(stored);

      // Convert date strings back to Date objects
      return goals.map(goal => ({
        ...goal,
        targetDate: new Date(goal.targetDate),
        createdDate: new Date(goal.createdDate),
        updatedDate: new Date(goal.updatedDate),
      }));
    } catch (error) {
      console.error('Error loading goals:', error);
      return [];
    }
  }

  /**
   * Save goals to localStorage
   */
  _saveGoals() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.goals));

      // Dispatch storage update event
      window.dispatchEvent(
        new CustomEvent('storage-updated', {
          detail: { key: this.storageKey, data: this.goals },
        })
      );
    } catch (error) {
      console.error('Error saving goals:', error);
      throw error;
    }
  }

  /**
   * Clear all goals (for testing/reset)
   */
  clearAllGoals() {
    this.goals = [];
    this._saveGoals();
  }
}
