/**
 * RecommendationService
 * Consolidated service for budget recommendations and optimization suggestions
 * Merges: BudgetRecommendationService (budgets) + optimization-engine.js
 */

import { MetricsService } from './MetricsService.js';
import { CustomCategoryService } from '../custom-category-service.js';
import { BudgetService } from '../budget-service.js';

const MIN_OPTIMIZATION_THRESHOLD = 50;
const DEFAULT_CATEGORY_REDUCTION_PERCENT = 0.15;

const SUBSTITUTION_PATTERNS = [
  {
    match: /заведения|ресторант|кафе|eating out|restaurant|dining|cafe/i,
    alternative: 'Храна',
    description: 'Cook at home instead of dining out',
    potentialSavingsPercent: 0.6,
    difficulty: 'medium',
  },
  {
    match: /забавления|хоби|entertainment|hobbies/i,
    alternative: null,
    description: 'Review subscriptions',
    potentialSavingsPercent: 0.3,
    difficulty: 'easy',
  },
  {
    match: /гориво|бензин|дизел|fuel|gasoline/i,
    alternative: 'Транспорт',
    description: 'Consider public transport',
    potentialSavingsPercent: 0.4,
    difficulty: 'hard',
  },
  {
    match: /дрехи|shopping|clothes/i,
    alternative: null,
    description: 'Shop during sales',
    potentialSavingsPercent: 0.35,
    difficulty: 'medium',
  },
  {
    match: /сметки|битови|utilities|bills/i,
    alternative: null,
    description: 'Compare providers',
    potentialSavingsPercent: 0.15,
    difficulty: 'medium',
  },
  {
    match: /телефон|mobile|phone/i,
    alternative: null,
    description: 'Switch to affordable plan',
    potentialSavingsPercent: 0.25,
    difficulty: 'easy',
  },
];

const REDUCTION_PATTERNS = [
  {
    match: /други|misc/i,
    maxReductionPercent: 0.3,
    description: 'Review miscellaneous',
  },
  {
    match: /заведения|ресторант|кафе|eating out|restaurant|dining|cafe/i,
    maxReductionPercent: 0.4,
    description: 'Limit dining out',
  },
  {
    match: /забавления|хоби|entertainment/i,
    maxReductionPercent: 0.25,
    description: 'Review streaming services',
  },
  {
    match: /гориво|бензин|fuel/i,
    maxReductionPercent: 0.2,
    description: 'Combine errands',
  },
];

const ELIMINATION_PATTERNS = [
  {
    match: /баланс|adjustment/i,
    description: 'Adjustment category',
    alternative: 'Review if transfer',
  },
  {
    match: /подаръци|gifts/i,
    description: 'Set a budget for gifts',
    alternative: 'Set fixed amount',
  },
];

export class RecommendationService {
  constructor() {
    this._loadPersistedData();
  }

  _loadPersistedData() {
    try {
      const data = localStorage.getItem('blinkbudget_recommendation_data');
      this.persistedData = data
        ? JSON.parse(data)
        : {
            dismissedInsights: [],
            lastAnalysisDate: null,
          };
    } catch (error) {
      console.warn(
        '[RecommendationService] Failed to load persisted data:',
        error
      );
      this.persistedData = {
        dismissedInsights: [],
        lastAnalysisDate: null,
      };
    }
  }

  _persistData() {
    try {
      this.persistedData.lastAnalysisDate = new Date().toISOString();
      localStorage.setItem(
        'blinkbudget_recommendation_data',
        JSON.stringify(this.persistedData)
      );
    } catch (err) {
      console.warn('[RecommendationService] Failed to persist data', err);
    }
  }

  // ========== Budget Recommendation Methods (from BudgetRecommendationService) ==========

  /**
   * Get historical periods for comparison
   */
  _getHistoricalPeriods(currentPeriod, monthsBack = 3) {
    const periods = [];
    const start = new Date(currentPeriod.startDate);
    const maxMonthsBack = Math.min(monthsBack, 12);

    for (let i = 1; i <= maxMonthsBack; i++) {
      const periodStart = new Date(start);
      periodStart.setMonth(periodStart.getMonth() - i);
      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      periodEnd.setDate(0);

      periods.push({
        startDate: periodStart.toISOString().split('T')[0],
        endDate: periodEnd.toISOString().split('T')[0],
        label: periodStart.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        }),
      });
    }

    return periods;
  }

  /**
   * Calculate average spending for a category across periods
   */
  _calculateCategoryAverage(transactions, category, periods) {
    const amounts = [];

    periods.forEach(period => {
      const periodTransactions = transactions.filter(t => {
        const tDate = t.date || t.timestamp;
        if (!tDate) return false;
        return (
          tDate >= period.startDate &&
          tDate <= period.endDate &&
          t.category === category &&
          t.type === 'expense'
        );
      });

      if (periodTransactions.length > 0) {
        const total = periodTransactions.reduce(
          (sum, t) => sum + (t.amount || 0),
          0
        );
        amounts.push(total);
      }
    });

    if (amounts.length === 0) return 0;
    return amounts.reduce((a, b) => a + b, 0) / amounts.length;
  }

  /**
   * Get percentile rankings for categories
   */
  getPercentileRankings(transactions, timePeriod) {
    if (!transactions || transactions.length === 0) {
      return [];
    }

    const categorySpending = MetricsService.getCategorySpending(
      transactions,
      timePeriod
    );

    const rankings = Object.entries(categorySpending).map(
      ([category, amounts]) => {
        const sorted = [...amounts].sort((a, b) => a - b);
        const sum = amounts.reduce((a, b) => a + b, 0);
        const avg = sum / amounts.length;

        let median = 0;
        if (sorted.length > 0) {
          const mid = Math.floor(sorted.length / 2);
          if (sorted.length % 2 === 0) {
            median = (sorted[mid - 1] + sorted[mid]) / 2;
          } else {
            median = sorted[mid];
          }
        }

        return {
          category,
          total: sum,
          average: Math.round(avg * 100) / 100,
          transactionCount: amounts.length,
          median: Math.round(median * 100) / 100,
          highest: amounts.length > 0 ? Math.max(...amounts) : null,
          lowest: amounts.length > 0 ? Math.min(...amounts) : null,
        };
      }
    );

    return rankings.sort((a, b) => b.total - a.total);
  }

  /**
   * Get budget recommendations based on historical spending
   * Includes all categories that have budgets set, plus categories with current spending
   */
  getBudgetRecommendations(transactions, timePeriod) {
    // Ensure transactions is at least an empty array
    const txs = transactions || [];

    const periods = this._getHistoricalPeriods(timePeriod, 3);

    // Get current spending breakdown
    const currentBreakdown = MetricsService.calculateCategoryBreakdown(
      txs,
      timePeriod
    );
    const currentSpending = {};
    currentBreakdown.categories.forEach(cat => {
      currentSpending[cat.name] = cat.amount;
    });

    // Get all categories that have budgets set
    const budgets = BudgetService.getAll();
    const budgetCategories = budgets.map(b => b.categoryName);

    // Merge: categories with budgets + categories with current spending
    const allCategories = [
      ...new Set([...budgetCategories, ...Object.keys(currentSpending)]),
    ];

    // If no categories at all (no budgets, no spending), return empty
    if (allCategories.length === 0) {
      return [];
    }

    const recommendations = [];

    allCategories.forEach(category => {
      const current = currentSpending[category] || 0;
      const historicalAverage = this._calculateCategoryAverage(
        txs,
        category,
        periods
      );

      // Get the budget amount if set
      const budget = budgets.find(b => b.categoryName === category);
      const budgetAmount = budget ? budget.amountLimit : 0;

      if (historicalAverage > 0 || budgetAmount > 0) {
        // Use historical average as base, or budget amount if no history
        const baseAmount =
          historicalAverage > 0 ? historicalAverage : budgetAmount;
        const recommended = Math.round(baseAmount * 1.1 * 100) / 100;

        // Calculate confidence based on historical data availability
        const confidence =
          historicalAverage > 0
            ? Math.min(
                100,
                Math.max(
                  0,
                  100 -
                    (Math.abs(current - historicalAverage) /
                      historicalAverage) *
                      50
                )
              )
            : 50; // Default confidence when only budget exists (no historical data)

        let reasoning;
        if (historicalAverage > 0) {
          if (current > historicalAverage * 1.2) {
            reasoning = `You're spending ${Math.round((current / historicalAverage - 1) * 100)}% more than usual. Consider reducing to stay on track.`;
          } else if (current < historicalAverage * 0.8) {
            reasoning = `Great job! You're spending ${Math.round((1 - current / historicalAverage) * 100)}% less than your average.`;
          } else {
            reasoning = `Your spending is within your normal range.`;
          }
        } else {
          reasoning = `Budget set but no historical spending data available. Start tracking to get personalized recommendations.`;
        }

        recommendations.push({
          id: `rec_${category.replace(/\s+/g, '_')}`,
          category,
          currentBudget: current,
          recommendedBudget: recommended,
          budgetAmount,
          historicalAverage,
          confidence: Math.round(confidence),
          reasoning,
          priority:
            historicalAverage > 0 &&
            Math.abs(current - historicalAverage) / historicalAverage > 0.3
              ? 'high'
              : 'normal',
        });
      }
    });

    return recommendations.sort((a, b) => {
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (b.priority === 'high' && a.priority !== 'high') return 1;
      return (
        Math.abs(b.currentBudget - b.recommendedBudget) -
        Math.abs(a.currentBudget - a.recommendedBudget)
      );
    });
  }

  /**
   * Get recommended amount for a specific category
   */
  getRecommendedAmount(categoryId, transactions) {
    if (!transactions || transactions.length === 0 || !categoryId) {
      return { recommended: 0, confidence: 0 };
    }

    const categoryTransactions = transactions.filter(
      t => t.type === 'expense' && t.category === categoryId
    );

    if (categoryTransactions.length === 0) {
      return { recommended: 0, confidence: 0 };
    }

    const amounts = categoryTransactions.map(t => t.amount || 0);
    const sum = amounts.reduce((a, b) => a + b, 0);
    const avg = sum / amounts.length;

    const confidence = Math.min(100, categoryTransactions.length * 10);
    const recommended = Math.round(avg * 1.1 * 100) / 100;

    return {
      recommended,
      average: Math.round(avg * 100) / 100,
      confidence,
      dataPoints: categoryTransactions.length,
    };
  }

  /**
   * Get seasonal adjustments for categories
   */
  getSeasonalAdjustments(categoryId, transactions) {
    if (!transactions || transactions.length === 0 || !categoryId) {
      return { adjustment: 1, factors: [] };
    }

    const monthlySpending = {};
    transactions.forEach(t => {
      if (t.type !== 'expense' || t.category !== categoryId) return;
      const tDate = t.date || t.timestamp;
      if (!tDate) return;

      const month = new Date(tDate).getMonth();
      if (!monthlySpending[month]) {
        monthlySpending[month] = [];
      }
      monthlySpending[month].push(t.amount || 0);
    });

    const monthlyAvg = {};
    Object.entries(monthlySpending).forEach(([month, amounts]) => {
      const sum = amounts.reduce((a, b) => a + b, 0);
      monthlyAvg[month] = sum / amounts.length;
    });

    const allAmounts = Object.values(monthlySpending).flat();
    let overallAvg = 0;
    if (allAmounts.length > 0) {
      overallAvg = allAmounts.reduce((a, b) => a + b, 0) / allAmounts.length;
    }

    const currentMonth = new Date().getMonth();
    const currentMonthAvg = monthlyAvg[currentMonth] || overallAvg;
    const adjustment =
      currentMonthAvg > 0 && overallAvg > 0 ? currentMonthAvg / overallAvg : 1;

    const factors = Object.entries(monthlyAvg)
      .map(([month, avg]) => ({
        month: parseInt(month, 10),
        label: new Date(0, parseInt(month, 10), 1).toLocaleDateString('en-US', {
          month: 'long',
        }),
        average: Math.round(avg * 100) / 100,
        factor: overallAvg > 0 ? Math.round((avg / overallAvg) * 100) / 100 : 1,
      }))
      .sort((a, b) => a.month - b.month);

    return {
      adjustment: Math.round(adjustment * 100) / 100,
      currentMonth: new Date().toLocaleDateString('en-US', { month: 'long' }),
      factors,
    };
  }

  // ========== Optimization Engine Methods ==========

  /**
   * Get optimization insights
   */
  getOptimizationInsights(transactions, timePeriod) {
    const insights = [];

    if (!transactions || transactions.length === 0) {
      return { insights, incomeVsExpenses: null };
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
    return { insights, incomeVsExpenses };
  }

  _generateSubstitutionInsights(categories, averageExpense) {
    const insights = [];
    categories.forEach(category => {
      const rec = SUBSTITUTION_PATTERNS.find(p => p.match.test(category.name));
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
    const allExpenseCategories =
      CustomCategoryService.getAllCategoryNames('expense') || [];

    categories.forEach(category => {
      const rec = REDUCTION_PATTERNS.find(p => p.match.test(category.name));

      if (rec && category.amount >= MIN_OPTIMIZATION_THRESHOLD) {
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
      } else if (
        category.amount >= MIN_OPTIMIZATION_THRESHOLD &&
        allExpenseCategories.includes(category.name)
      ) {
        const totalSavings =
          category.amount * DEFAULT_CATEGORY_REDUCTION_PERCENT;
        const id = `reduction_${category.name.toLowerCase()}`;

        if (!this.persistedData.dismissedInsights.includes(id)) {
          insights.push({
            id,
            type: 'reduction',
            category: category.name,
            currentSpending: category.amount,
            reductionPercent: DEFAULT_CATEGORY_REDUCTION_PERCENT * 100,
            potentialSavings: totalSavings,
            message: `Reducing ${category.name} by ${(DEFAULT_CATEGORY_REDUCTION_PERCENT * 100).toFixed(0)}% could save ${this._formatCurrency(totalSavings)}/month`,
            description: 'Review and optimize spending',
            difficulty: 'medium',
            actionable: true,
            priority: totalSavings > averageExpense * 0.15 ? 'high' : 'medium',
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
      const rec = ELIMINATION_PATTERNS.find(p => p.match.test(category.name));
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

    try {
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

  /**
   * Get total savings potential
   */
  getSavingsPotential(transactions, timePeriod) {
    const { insights, incomeVsExpenses } = this.getOptimizationInsights(
      transactions,
      timePeriod
    );

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

  /**
   * Get alternative suggestions for a category
   */
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

    const subRec = SUBSTITUTION_PATTERNS.find(p => p.match.test(categoryId));
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

    const redRec = REDUCTION_PATTERNS.find(p => p.match.test(categoryId));
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

    const elimRec = ELIMINATION_PATTERNS.find(p => p.match.test(categoryId));
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
      const genericReductionSavings =
        category.amount * DEFAULT_CATEGORY_REDUCTION_PERCENT;
      suggestions.push({
        type: 'reduction',
        category: categoryId,
        reductionPercent: DEFAULT_CATEGORY_REDUCTION_PERCENT * 100,
        description: `Review for ${(DEFAULT_CATEGORY_REDUCTION_PERCENT * 100).toFixed(0)}% reduction`,
        potentialSavings: genericReductionSavings,
        difficulty: 'easy',
      });
    }

    return suggestions;
  }

  /**
   * Dismiss an optimization insight
   */
  dismissInsight(insightId) {
    if (!this.persistedData.dismissedInsights.includes(insightId)) {
      this.persistedData.dismissedInsights.push(insightId);
      this._persistData();
    }
  }

  /**
   * Restore a dismissed insight
   */
  restoreInsight(insightId) {
    const idx = this.persistedData.dismissedInsights.indexOf(insightId);
    if (idx > -1) {
      this.persistedData.dismissedInsights.splice(idx, 1);
      this._persistData();
    }
  }

  /**
   * Clear all dismissed insights
   */
  clearDismissedInsights() {
    this.persistedData.dismissedInsights = [];
    this._persistData();
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      dismissedCount: this.persistedData.dismissedInsights.length,
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

export const recommendationService = new RecommendationService();
export default recommendationService;
