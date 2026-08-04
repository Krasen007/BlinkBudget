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

    // Create Map for O(1) budget lookups instead of O(n²) find operations
    const budgetMap = new Map();
    let budgets;
    try {
      const result = BudgetService.getAll();
      budgets = Array.isArray(result) ? result : [];
      // Only build budgetMap when budgets is a valid array
      budgets.forEach(b => budgetMap.set(b.categoryName, b.amountLimit));
    } catch (err) {
      console.error('[RecommendationService] Failed to load budgets:', err);
      // Ensure budgets is always an array even on error
      budgets = [];
    }

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

      // Get budget amount if set - O(1) lookup using Map
      const budgetAmount = budgetMap.get(category) || 0;

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
   * Enhanced to detect year-over-year patterns and suggest preemptive savings
   * @param {string} categoryId - Category to analyze
   * @param {Array} transactions - All transactions
   * @returns {Object} Seasonal adjustment data with year-over-year patterns
   */
  getSeasonalAdjustments(categoryId, transactions) {
    if (!transactions || transactions.length === 0 || !categoryId) {
      return { adjustment: 1, factors: [], yoyPatterns: [] };
    }

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    oneYearAgo.setMonth(oneYearAgo.getMonth() + 1); // Look back 13 months to have a full year

    // Current year transactions (last 12 months)
    const currentYearTransactions = transactions.filter(t => {
      const tDate = t.date || t.timestamp;
      if (!tDate) return false;
      const date = new Date(tDate);
      return (
        t.category === categoryId && t.type === 'expense' && date >= oneYearAgo
      );
    });

    // Previous year transactions (13-24 months ago)
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const previousYearTransactions = transactions.filter(t => {
      const tDate = t.date || t.timestamp;
      if (!tDate) return false;
      const date = new Date(tDate);
      return (
        t.category === categoryId &&
        t.type === 'expense' &&
        date >= twoYearsAgo &&
        date < oneYearAgo
      );
    });

    // Group by month for both periods
    const currentYearByMonth = this._groupTransactionsByMonth(
      currentYearTransactions
    );
    const previousYearByMonth = this._groupTransactionsByMonth(
      previousYearTransactions
    );

    // Calculate year-over-year patterns
    const yoyPatterns = this._analyzeYearOverYearPatterns(
      currentYearByMonth,
      previousYearByMonth,
      categoryId
    );

    // Calculate overall monthly adjustment
    const currentMonth = new Date().getMonth();
    const currentMonthData = currentYearByMonth[currentMonth] || [];
    const previousMonthData = previousYearByMonth[currentMonth] || [];

    const currentAvg =
      currentMonthData.length > 0
        ? currentMonthData.reduce((a, b) => a + b, 0) / currentMonthData.length
        : 0;
    const previousAvg =
      previousMonthData.length > 0
        ? previousMonthData.reduce((a, b) => a + b, 0) /
          previousMonthData.length
        : 0;

    const adjustment =
      currentAvg > 0 && previousAvg > 0 ? currentAvg / previousAvg : 1;

    // Generate factors with YOY context
    const factors = this._generateMonthlyFactors(
      currentYearByMonth,
      previousYearByMonth
    );

    return {
      adjustment: Math.round(adjustment * 100) / 100,
      currentMonth: new Date().toLocaleDateString('en-US', { month: 'long' }),
      factors,
      yoyPatterns,
      suggestion: this._generateSeasonalSuggestion(yoyPatterns, categoryId),
    };
  }

  /**
   * Group transactions by month (0-11)
   * @param {Array} transactions - Transactions to group
   * @returns {Object} Month-indexed amounts
   */
  _groupTransactionsByMonth(transactions) {
    const grouped = Object.create(null);
    for (let i = 0; i < 12; i++) {
      grouped[i] = [];
    }

    transactions.forEach(t => {
      const month = new Date(t.date || t.timestamp).getMonth();
      if (grouped[month]) {
        grouped[month].push(Math.abs(t.amount || 0));
      }
    });

    return grouped;
  }

  /**
   * Analyze year-over-year spending patterns
   * @param {Object} currentYearByMonth - Current year spending by month
   * @param {Object} previousYearByMonth - Previous year spending by month
   * @param {string} categoryId - Category name
   * @returns {Array} Year-over-year patterns
   */
  _analyzeYearOverYearPatterns(
    currentYearByMonth,
    previousYearByMonth,
    _categoryId
  ) {
    const patterns = [];
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    for (let i = 0; i < 12; i++) {
      const currentMonthData = currentYearByMonth[i] || [];
      const previousMonthData = previousYearByMonth[i] || [];

      const currentTotal = currentMonthData.reduce((a, b) => a + b, 0);
      const previousTotal = previousMonthData.reduce((a, b) => a + b, 0);

      if (previousTotal > 0) {
        const change = ((currentTotal - previousTotal) / previousTotal) * 100;

        // Detect significant YOY patterns (20%+ change)
        if (Math.abs(change) >= 20) {
          const pattern = {
            month: monthNames[i],
            monthIndex: i,
            previousYearAmount: Math.round(previousTotal * 100) / 100,
            currentYearAmount: Math.round(currentTotal * 100) / 100,
            changePercent: Math.round(change),
            isIncrease: change > 0,
            predictable: Math.abs(change) >= 30, // High confidence pattern
          };

          // Generate preemptive savings suggestion
          if (pattern.isIncrease && pattern.predictable) {
            const monthlySetAside = Math.round(pattern.previousYearAmount / 10); // 10 months to save
            pattern.suggestion = `Set aside €${monthlySetAside}/month starting ${monthNames[i]} to cover €${Math.round(pattern.previousYearAmount)} in ${monthNames[i]}.`;
            pattern.estimatedSavings = monthlySetAside * 10;
          }

          patterns.push(pattern);
        }
      }
    }

    return patterns.sort(
      (a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)
    );
  }

  /**
   * Generate monthly factors with YOY context
   * @param {Object} currentYearByMonth - Current year spending
   * @param {Object} previousYearByMonth - Previous year spending
   * @returns {Array} Monthly factors
   */
  _generateMonthlyFactors(currentYearByMonth, previousYearByMonth) {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    return Object.entries(currentYearByMonth)
      .map(([month, amounts]) => {
        const monthIndex = parseInt(month);
        const previousAmounts = previousYearByMonth[month] || [];

        const currentTotal = amounts.reduce((a, b) => a + b, 0);
        const previousTotal = previousAmounts.reduce((a, b) => a + b, 0);

        let factor = 1;
        if (previousTotal > 0) {
          factor = Math.round((currentTotal / previousTotal) * 100) / 100;
        }

        const avgCurrent =
          amounts.length > 0 ? currentTotal / amounts.length : 0;

        return {
          month: monthNames[monthIndex],
          monthIndex,
          average: Math.round(avgCurrent * 100) / 100,
          factor,
          hasYoyData: previousAmounts.length > 0,
        };
      })
      .sort((a, b) => a.monthIndex - b.monthIndex);
  }

  /**
   * Generate seasonal suggestion based on YOY patterns
   * @param {Array} yoyPatterns - Year-over-year patterns
   * @param {string} _categoryId - Category name (unused, kept for API consistency)
   * @returns {Object|null} Suggestion or null
   */
  _generateSeasonalSuggestion(yoyPatterns, _categoryId) {
    if (yoyPatterns.length === 0) return null;

    // Find upcoming month with high spending pattern
    const currentMonth = new Date().getMonth();
    const upcomingPattern = yoyPatterns.find(p => {
      // Suggest starting 1-2 months before the high-spending month
      const leadTime = (p.monthIndex - currentMonth + 12) % 12;
      return leadTime > 0 && leadTime <= 2 && p.isIncrease && p.predictable;
    });

    if (upcomingPattern) {
      const monthlySetAside = Math.round(
        upcomingPattern.previousYearAmount / 10
      );
      return {
        type: 'preemptive_savings',
        category: _categoryId,
        targetMonth: upcomingPattern.month,
        suggestion: `Start setting aside €${monthlySetAside}/month now for your ${upcomingPattern.month} expenses (€${Math.round(upcomingPattern.previousYearAmount)} expected).`,
        monthlyAmount: monthlySetAside,
        totalTarget: Math.round(upcomingPattern.previousYearAmount),
        monthsToSave: 10,
      };
    }

    // Find biggest pattern as fallback
    const biggestPattern = yoyPatterns[0];
    if (
      biggestPattern &&
      biggestPattern.isIncrease &&
      biggestPattern.predictable
    ) {
      const monthlySetAside = Math.round(
        biggestPattern.previousYearAmount / 10
      );
      return {
        type: 'historical_pattern',
        category: _categoryId,
        targetMonth: biggestPattern.month,
        suggestion: `Last ${biggestPattern.month} you spent €${Math.round(biggestPattern.previousYearAmount)} on ${_categoryId}. Consider setting aside €${monthlySetAside}/month to prepare.`,
        monthlyAmount: monthlySetAside,
        totalTarget: Math.round(biggestPattern.previousYearAmount),
        monthsToSave: 10,
      };
    }

    return null;
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
