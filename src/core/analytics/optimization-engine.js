/**
 * OptimizationEngine
 * Feature 3.3.1 - Advanced Actionable Insights
 *
 * Provides optimization suggestions based on spending patterns.
 */

import { MetricsService } from './MetricsService.js';

const SUBSTITUTION_RECOMMENDATIONS = {
  Заведения: {
    alternative: 'Храна',
    description: 'Cook at home instead of dining out',
    potentialSavingsPercent: 0.6,
    difficulty: 'medium',
  },
  Забавления: {
    alternative: null,
    description: 'Review subscriptions',
    potentialSavingsPercent: 0.3,
    difficulty: 'easy',
  },
  Гориво: {
    alternative: 'Транспорт',
    description: 'Consider public transport',
    potentialSavingsPercent: 0.4,
    difficulty: 'hard',
  },
  Дрехи: {
    alternative: null,
    description: 'Shop during sales',
    potentialSavingsPercent: 0.35,
    difficulty: 'medium',
  },
  Сметки: {
    alternative: null,
    description: 'Compare providers',
    potentialSavingsPercent: 0.15,
    difficulty: 'medium',
  },
  Телефон: {
    alternative: null,
    description: 'Switch to affordable plan',
    potentialSavingsPercent: 0.25,
    difficulty: 'easy',
  },
};

const REDUCTION_RECOMMENDATIONS = {
  Други: {
    minThreshold: 50,
    maxReductionPercent: 0.3,
    description: 'Review miscellaneous',
  },
  Заведения: {
    minThreshold: 30,
    maxReductionPercent: 0.4,
    description: 'Limit dining out',
  },
  Забавления: {
    minThreshold: 20,
    maxReductionPercent: 0.25,
    description: 'Review streaming services',
  },
  Гориво: {
    minThreshold: 40,
    maxReductionPercent: 0.2,
    description: 'Combine errands',
  },
};

const ELIMINATION_RECOMMENDATIONS = {
  Баланс: {
    description: 'Adjustment category',
    alternative: 'Review if transfer',
  },
  Подаръци: {
    description: 'Set a budget for gifts',
    alternative: 'Set fixed amount',
  },
};

export class OptimizationEngine {
  constructor() {
    this._loadPersistedData();
  }

  _loadPersistedData() {
    try {
      const data = localStorage.getItem('blinkbudget_optimization_data');
      this.persistedData = data
        ? JSON.parse(data)
        : {
            savingsGoals: [],
            customRecommendations: [],
            dismissedInsights: [],
            lastAnalysisDate: null,
          };
    } catch {
      this.persistedData = {
        savingsGoals: [],
        customRecommendations: [],
        dismissedInsights: [],
        lastAnalysisDate: null,
      };
    }
  }

  _persistData() {
    try {
      this.persistedData.lastAnalysisDate = new Date().toISOString();
      localStorage.setItem(
        'blinkbudget_optimization_data',
        JSON.stringify(this.persistedData)
      );
    } catch {
      console.warn('[OptimizationEngine] Failed to persist data');
    }
  }

  getOptimizationInsights(transactions, timePeriod) {
    const insights = [];

    if (!transactions || transactions.length === 0) {
      return insights;
    }

    const categoryBreakdown = MetricsService.calculateCategoryBreakdown(
      transactions,
      timePeriod
    );
    const incomeVsExpenses = MetricsService.calculateIncomeVsExpenses(
      transactions,
      timePeriod
    );

    if (
      categoryBreakdown &&
      categoryBreakdown.categories &&
      incomeVsExpenses &&
      typeof incomeVsExpenses.averageExpense !== 'undefined'
    ) {
      insights.push(
        ...this._generateSubstitutionInsights(
          categoryBreakdown.categories,
          incomeVsExpenses.averageExpense
        )
      );
      insights.push(
        ...this._generateReductionInsights(
          categoryBreakdown.categories,
          incomeVsExpenses.averageExpense
        )
      );
      insights.push(
        ...this._generateEliminationInsights(
          categoryBreakdown.categories,
          incomeVsExpenses.averageExpense
        )
      );
    }

    insights.push(...this._generateBudgetInsights(transactions, timePeriod));
    insights.sort((a, b) => b.potentialSavings - a.potentialSavings);
    return insights;
  }

  _generateSubstitutionInsights(categories, averageExpense) {
    const insights = [];
    categories.forEach(category => {
      const rec = SUBSTITUTION_RECOMMENDATIONS[category.name];
      if (rec && category.amount > averageExpense * 0.5) {
        const savings = category.amount * rec.potentialSavingsPercent;
        const id = `substitution_${category.name.toLowerCase()}`;
        if (!this.persistedData.dismissedInsights.includes(id)) {
          insights.push({
            id,
            type: 'substitution',
            category: category.name,
            currentSpending: category.amount,
            potentialSavings: savings,
            message: `Switching from ${category.name} to ${rec.alternative || 'alternatives'} could save ${this._formatCurrency(savings)}/month`,
            description: rec.description,
            difficulty: rec.difficulty,
            actionable: true,
            priority: savings > averageExpense * 0.2 ? 'high' : 'medium',
          });
        }
      }
    });
    return insights;
  }

  _generateReductionInsights(categories, averageExpense) {
    const insights = [];
    categories.forEach(category => {
      const rec = REDUCTION_RECOMMENDATIONS[category.name];
      if (rec && category.amount >= rec.minThreshold) {
        const savings = category.amount * rec.maxReductionPercent;
        const id = `reduction_${category.name.toLowerCase()}`;
        if (!this.persistedData.dismissedInsights.includes(id)) {
          insights.push({
            id,
            type: 'reduction',
            category: category.name,
            currentSpending: category.amount,
            reductionPercent: rec.maxReductionPercent * 100,
            potentialSavings: savings,
            message: `Reducing ${category.name} by ${(rec.maxReductionPercent * 100).toFixed(0)}% could save ${this._formatCurrency(savings)}/month`,
            description: rec.description,
            difficulty: 'medium',
            actionable: true,
            priority: savings > averageExpense * 0.15 ? 'high' : 'medium',
          });
        }
      }
    });
    return insights;
  }

  _generateEliminationInsights(categories, averageExpense) {
    const insights = [];
    const essential = ['Храна', 'Сметки', 'Кредит', 'Лекар', 'Застраховки'];
    categories.forEach(category => {
      const rec = ELIMINATION_RECOMMENDATIONS[category.name];
      if (rec) {
        const id = `elimination_${category.name.toLowerCase()}`;
        if (!this.persistedData.dismissedInsights.includes(id)) {
          insights.push({
            id,
            type: 'elimination',
            category: category.name,
            currentSpending: category.amount,
            potentialSavings: category.amount,
            message: `Consider eliminating ${category.name} to save ${this._formatCurrency(category.amount)}/month`,
            description: rec.description,
            difficulty: 'hard',
            recommendation: rec.alternative,
            actionable: true,
            priority: 'low',
          });
        }
      } else if (
        !essential.includes(category.name) &&
        category.amount < averageExpense * 0.1 &&
        category.transactionCount < 3
      ) {
        const id = `elimination_${category.name.toLowerCase()}`;
        if (!this.persistedData.dismissedInsights.includes(id)) {
          insights.push({
            id,
            type: 'elimination',
            category: category.name,
            currentSpending: category.amount,
            potentialSavings: category.amount,
            message: `Consider if ${category.name} is necessary - savings of ${this._formatCurrency(category.amount)}/month`,
            description: 'Small, infrequent expenses',
            difficulty: 'easy',
            actionable: true,
            priority: 'low',
          });
        }
      }
    });
    return insights;
  }

  _generateBudgetInsights(transactions, _timePeriod) {
    const insights = [];

    // Try to get BudgetPlanner if available
    try {
      // Check if BudgetPlanner is available globally
      if (typeof window !== 'undefined' && window.BudgetPlanner) {
        const statuses = window.BudgetPlanner.getBudgetsStatus(transactions);
        if (statuses && Array.isArray(statuses)) {
          statuses.forEach(status => {
            if (status.isExceeded) {
              const excess = Math.abs(status.amountLimit - status.actual);
              insights.push({
                id: `budget_exceeded_${status.categoryName.toLowerCase().replace(/\s+/g, '_')}`,
                type: 'budget',
                category: status.categoryName,
                currentSpending: status.actual,
                budgetLimit: status.amountLimit,
                potentialSavings: excess,
                message: `Exceeded ${status.categoryName} budget by ${this._formatCurrency(excess)}`,
                description: 'Review transactions to find savings',
                difficulty: 'medium',
                actionable: true,
                priority: 'high',
              });
            } else if (status.isWarning && status.utilization > 80) {
              insights.push({
                id: `budget_warning_${status.categoryName.toLowerCase().replace(/\s+/g, '_')}`,
                type: 'budget',
                category: status.categoryName,
                currentSpending: status.actual,
                budgetLimit: status.amountLimit,
                potentialSavings: status.remaining,
                message: `${status.categoryName} at ${status.utilization.toFixed(0)}% - ${this._formatCurrency(status.remaining)} remaining`,
                description: 'Act now to stay within budget',
                difficulty: 'easy',
                actionable: true,
                priority: 'medium',
              });
            }
          });
        }
      }
    } catch {
      // Budget insights are optional, silently skip
    }

    return insights;
  }

  getSavingsPotential(transactions, timePeriod) {
    const insights = this.getOptimizationInsights(transactions, timePeriod);

    const sub = insights
      .filter(i => i.type === 'substitution')
      .reduce((s, i) => s + i.potentialSavings, 0);
    const red = insights
      .filter(i => i.type === 'reduction')
      .reduce((s, i) => s + i.potentialSavings, 0);
    const elim = insights
      .filter(i => i.type === 'elimination')
      .reduce((s, i) => s + i.potentialSavings, 0);
    const budg = insights
      .filter(i => i.type === 'budget')
      .reduce((s, i) => s + i.potentialSavings, 0);
    const incomeVsExpenses = MetricsService.calculateIncomeVsExpenses(
      transactions,
      timePeriod
    );

    const total = sub + red + elim + budg;

    return {
      substitutionSavings: sub,
      reductionSavings: red,
      eliminationSavings: elim,
      budgetSavings: budg,
      totalPotential: sub + red + elim,
      totalWithBudget: total,
      totalIncome: incomeVsExpenses.totalIncome,
      totalExpenses: incomeVsExpenses.totalExpenses,
      potentialSavingsRate:
        incomeVsExpenses.totalIncome > 0
          ? (total / incomeVsExpenses.totalIncome) * 100
          : 0,
      insightCount: {
        substitution: insights.filter(i => i.type === 'substitution').length,
        reduction: insights.filter(i => i.type === 'reduction').length,
        elimination: insights.filter(i => i.type === 'elimination').length,
        budget: insights.filter(i => i.type === 'budget').length,
        total: insights.length,
      },
      timePeriod,
    };
  }

  getAlternativeSuggestions(categoryId, transactions, timePeriod) {
    const suggestions = [];
    const breakdown = MetricsService.calculateCategoryBreakdown(
      transactions,
      timePeriod
    );

    if (!breakdown || !breakdown.categories) {
      return suggestions;
    }

    const category = breakdown.categories.find(
      c =>
        c.name === categoryId ||
        c.name.toLowerCase() === categoryId.toLowerCase()
    );

    if (!category) return suggestions;

    const subRec = SUBSTITUTION_RECOMMENDATIONS[categoryId];
    if (subRec) {
      suggestions.push({
        type: 'substitution',
        category: categoryId,
        alternative: subRec.alternative || 'Alternative options',
        description: subRec.description,
        potentialSavings: category.amount * subRec.potentialSavingsPercent,
        difficulty: subRec.difficulty,
      });
    }

    const redRec = REDUCTION_RECOMMENDATIONS[categoryId];
    if (redRec) {
      suggestions.push({
        type: 'reduction',
        category: categoryId,
        reductionPercent: redRec.maxReductionPercent * 100,
        description: redRec.description,
        potentialSavings: category.amount * redRec.maxReductionPercent,
        difficulty: 'medium',
      });
    }

    const elimRec = ELIMINATION_RECOMMENDATIONS[categoryId];
    if (elimRec) {
      suggestions.push({
        type: 'elimination',
        category: categoryId,
        description: elimRec.description,
        potentialSavings: category.amount,
        alternative: elimRec.alternative,
        difficulty: 'hard',
      });
    }

    if (suggestions.length === 0) {
      suggestions.push({
        type: 'reduction',
        category: categoryId,
        reductionPercent: 10,
        description: 'Review for 10% reduction',
        potentialSavings: category.amount * 0.1,
        difficulty: 'easy',
      });
    }

    return suggestions;
  }

  dismissInsight(insightId) {
    if (!this.persistedData.dismissedInsights.includes(insightId)) {
      this.persistedData.dismissedInsights.push(insightId);
      this._persistData();
    }
  }

  restoreInsight(insightId) {
    const idx = this.persistedData.dismissedInsights.indexOf(insightId);
    if (idx > -1) {
      this.persistedData.dismissedInsights.splice(idx, 1);
      this._persistData();
    }
  }

  clearDismissedInsights() {
    this.persistedData.dismissedInsights = [];
    this._persistData();
  }

  getStats() {
    return {
      dismissedCount: this.persistedData.dismissedInsights.length,
      savingsGoalsCount: this.persistedData.savingsGoals.length,
      customRecommendationsCount:
        this.persistedData.customRecommendations.length,
      lastAnalysisDate: this.persistedData.lastAnalysisDate,
    };
  }

  _formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
}

export const optimizationEngine = new OptimizationEngine();

export default optimizationEngine;
