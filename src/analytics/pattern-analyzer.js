/**
 * Pattern Analyzer for BlinkBudget
 *
 * Analyzes spending patterns including:
 * - Weekday vs weekend spending analysis
 * - Time-of-day spending patterns
 * - Frequency analysis for categories
 * - Trend alerts and warnings
 *
 * Requirements: Task 2.2 Spending Pattern Analytics
 */

import { TRANSACTION_TYPES } from '../utils/constants.js';
import { FilteringService } from '../core/analytics/FilteringService.js';

export class PatternAnalyzer {
  /**
   * Analyze weekday vs weekend spending patterns
   * @param {Array} transactions - Transaction data
   * @param {Object} timePeriod - Time period configuration
   * @returns {Object} Weekday vs weekend analysis
   */
  static analyzeWeekdayVsWeekend(transactions, timePeriod) {
    const filteredTransactions = FilteringService.filterByTimePeriod(
      transactions,
      timePeriod
    ).filter(t => !t.isGhost && t.type === TRANSACTION_TYPES.EXPENSE);

    const weekdaySpending = {
      total: 0,
      count: 0,
      dailyAverage: 0,
      categories: Object.create(null),
    };

    const weekendSpending = {
      total: 0,
      count: 0,
      dailyAverage: 0,
      categories: Object.create(null),
    };

    const weekdayDays = new Set();
    const weekendDays = new Set();

    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.timestamp);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
      const amount = Math.abs(transaction.amount || 0);
      const category = transaction.category || 'Uncategorized';
      const dateKey = date.toDateString();

      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const target = isWeekend ? weekendSpending : weekdaySpending;
      const daysSet = isWeekend ? weekendDays : weekdayDays;

      // Track unique days
      daysSet.add(dateKey);

      // Update totals
      target.total += amount;
      target.count += 1;

      // Track category spending
      if (!target.categories[category]) {
        target.categories[category] = { amount: 0, count: 0 };
      }
      target.categories[category].amount += amount;
      target.categories[category].count += 1;
    });

    // Calculate daily averages
    weekdaySpending.dailyAverage =
      weekdayDays.size > 0 ? weekdaySpending.total / weekdayDays.size : 0;
    weekendSpending.dailyAverage =
      weekendDays.size > 0 ? weekendSpending.total / weekendDays.size : 0;

    // Calculate percentage difference
    const totalDays = weekdayDays.size + weekendDays.size;
    const weekdayPercentage =
      totalDays > 0
        ? (weekdaySpending.total /
          (weekdaySpending.total + weekendSpending.total)) *
        100
        : 0;
    const weekendPercentage =
      totalDays > 0
        ? (weekendSpending.total /
          (weekdaySpending.total + weekendSpending.total)) *
        100
        : 0;

    const dailyAverageDiff =
      weekdaySpending.dailyAverage > 0
        ? ((weekendSpending.dailyAverage - weekdaySpending.dailyAverage) /
          weekdaySpending.dailyAverage) *
        100
        : 0;

    return {
      weekday: {
        ...weekdaySpending,
        uniqueDays: weekdayDays.size,
        percentage: weekdayPercentage,
      },
      weekend: {
        ...weekendSpending,
        uniqueDays: weekendDays.size,
        percentage: weekendPercentage,
      },
      comparison: {
        weekendPremium:
          weekendSpending.dailyAverage - weekdaySpending.dailyAverage,
        weekendPremiumPercentage: dailyAverageDiff,
        totalDays,
        insights: this.generateWeekendInsights(
          dailyAverageDiff,
          weekdaySpending,
          weekendSpending
        ),
      },
    };
  }

  /**
   * Analyze time-of-day spending patterns
   * @param {Array} transactions - Transaction data
   * @param {Object} timePeriod - Time period configuration
   * @returns {Object} Time-of-day analysis
   */
  static analyzeTimeOfDayPatterns(transactions, timePeriod) {
    const filteredTransactions = FilteringService.filterByTimePeriod(
      transactions,
      timePeriod
    ).filter(t => !t.isGhost && t.type === TRANSACTION_TYPES.EXPENSE);

    // Define time periods
    const timePeriods = {
      earlyMorning: { start: 5, end: 8, label: 'Early Morning (5-8)' },
      morning: { start: 8, end: 12, label: 'Morning (8-12)' },
      afternoon: { start: 12, end: 17, label: 'Afternoon (12-17)' },
      evening: { start: 17, end: 21, label: 'Evening (17-21)' },
      night: { start: 21, end: 5, label: 'Night (21-5)' },
    };

    const periodAnalysis = {};

    Object.keys(timePeriods).forEach(period => {
      periodAnalysis[period] = {
        total: 0,
        count: 0,
        categories: Object.create(null),
        hourlyBreakdown: Object.create(null),
      };
    });

    filteredTransactions.forEach(transaction => {
      const date = new Date(transaction.timestamp);
      const hour = date.getHours();
      const amount = Math.abs(transaction.amount || 0);
      const category = transaction.category || 'Uncategorized';

      // Find which time period this transaction belongs to
      let targetPeriod = null;
      for (const [periodName, periodConfig] of Object.entries(timePeriods)) {
        if (periodConfig.start <= periodConfig.end) {
          // Normal case (e.g., 8-12)
          if (hour >= periodConfig.start && hour < periodConfig.end) {
            targetPeriod = periodName;
            break;
          }
        } else {
          // Overnight case (e.g., 21-5)
          if (hour >= periodConfig.start || hour < periodConfig.end) {
            targetPeriod = periodName;
            break;
          }
        }
      }

      if (targetPeriod) {
        const target = periodAnalysis[targetPeriod];
        target.total += amount;
        target.count += 1;

        // Track category spending
        if (!target.categories[category]) {
          target.categories[category] = { amount: 0, count: 0 };
        }
        target.categories[category].amount += amount;
        target.categories[category].count += 1;

        // Track hourly breakdown
        if (!target.hourlyBreakdown[hour]) {
          target.hourlyBreakdown[hour] = { amount: 0, count: 0 };
        }
        target.hourlyBreakdown[hour].amount += amount;
        target.hourlyBreakdown[hour].count += 1;
      }
    });

    // Calculate averages and find peak spending times
    let peakSpendingPeriod = null;
    let peakSpendingAmount = 0;

    Object.keys(periodAnalysis).forEach(period => {
      const data = periodAnalysis[period];
      data.averageTransaction = data.count > 0 ? data.total / data.count : 0;

      if (data.total > peakSpendingAmount) {
        peakSpendingAmount = data.total;
        peakSpendingPeriod = period;
      }
    });

    return {
      periods: periodAnalysis,
      peakSpendingPeriod,
      peakSpendingAmount,
      insights: this.generateTimeOfDayInsights(
        periodAnalysis,
        peakSpendingPeriod
      ),
    };
  }

  /**
   * Analyze frequency patterns for specific categories
   * @param {Array} transactions - Transaction data
   * @param {Object} timePeriod - Time period configuration
   * @param {Array} targetCategories - Categories to analyze (defaults to common ones)
   * @returns {Object} Frequency analysis
   */
  static analyzeFrequencyPatterns(
    transactions,
    timePeriod,
    targetCategories = null
  ) {
    const filteredTransactions = FilteringService.filterByTimePeriod(
      transactions,
      timePeriod
    ).filter(t => !t.isGhost && t.type === TRANSACTION_TYPES.EXPENSE);

    // Extract actual categories from transactions if none provided
    const actualCategories = [
      ...new Set(filteredTransactions.map(t => t.category || 'Uncategorized')),
    ];
    const categoriesToAnalyze = targetCategories || actualCategories;

    const frequencyAnalysis = Object.create(null);

    categoriesToAnalyze.forEach(category => {
      const categoryTransactions = filteredTransactions.filter(
        t => (t.category || 'Uncategorized') === category
      );

      // Visit frequency analysis
      const visitDates = new Set();
      const visitsByDayOfWeek = Object.create(null);
      const visitsByHour = Object.create(null);

      categoryTransactions.forEach(transaction => {
        const date = new Date(transaction.timestamp);
        const dateKey = date.toDateString();
        const dayOfWeek = date.getDay();
        const hour = date.getHours();

        visitDates.add(dateKey);

        // Track by day of week
        if (!visitsByDayOfWeek[dayOfWeek]) {
          visitsByDayOfWeek[dayOfWeek] = 0;
        }
        visitsByDayOfWeek[dayOfWeek]++;

        // Track by hour
        if (!visitsByHour[hour]) {
          visitsByHour[hour] = 0;
        }
        visitsByHour[hour]++;
      });

      // Calculate frequency metrics
      const totalDays = timePeriod ? this.calculatePeriodDays(timePeriod) : 30;
      const visitFrequency = visitDates.size;
      const averageVisitsPerWeek =
        totalDays > 0 ? (visitFrequency / totalDays) * 7 : 0;

      // Find most common day and time
      let mostCommonDay = null;
      let mostCommonDayCount = 0;
      let mostCommonHour = null;
      let mostCommonHourCount = 0;

      Object.entries(visitsByDayOfWeek).forEach(([day, count]) => {
        if (count > mostCommonDayCount) {
          mostCommonDayCount = count;
          mostCommonDay = parseInt(day);
        }
      });

      Object.entries(visitsByHour).forEach(([hour, count]) => {
        if (count > mostCommonHourCount) {
          mostCommonHourCount = count;
          mostCommonHour = parseInt(hour);
        }
      });

      // Calculate spending patterns
      const totalSpent = categoryTransactions.reduce(
        (sum, t) => sum + Math.abs(t.amount || 0),
        0
      );
      const averageSpentPerVisit =
        visitFrequency > 0 ? totalSpent / visitFrequency : 0;

      frequencyAnalysis[category] = {
        totalVisits: visitFrequency,
        totalSpent,
        averageSpentPerVisit,
        averageVisitsPerWeek,
        mostCommonDay,
        mostCommonDayCount,
        mostCommonHour,
        mostCommonHourCount,
        visitDates: Array.from(visitDates),
        insights: this.generateFrequencyInsights({
          visitFrequency,
          averageVisitsPerWeek,
          totalSpent,
          averageSpentPerVisit,
        }),
      };
    });

    return {
      categories: frequencyAnalysis,
      overall: this.calculateOverallFrequencyInsights(frequencyAnalysis),
    };
  }

  /**
   * Generate trend alerts and warnings based on spending patterns
   * @param {Array} transactions - Transaction data
   * @param {Object} timePeriod - Current time period
   * @param {Object} previousPeriod - Previous time period for comparison
   * @returns {Object} Trend alerts and warnings
   */
  static generateTrendAlerts(transactions, timePeriod, previousPeriod = null) {
    const alerts = {
      warnings: [],
      insights: [],
      trends: [],
    };

    const currentAnalysis = this.analyzeWeekdayVsWeekend(
      transactions,
      timePeriod
    );
    const timeAnalysis = this.analyzeTimeOfDayPatterns(
      transactions,
      timePeriod
    );

    // Weekend spending warning
    if (currentAnalysis.comparison.weekendPremiumPercentage > 50) {
      alerts.warnings.push({
        type: 'weekend_spending_spike',
        severity: 'medium',
        title: 'High Weekend Spending',
        message: `Your weekend spending is ${currentAnalysis.comparison.weekendPremiumPercentage.toFixed(0)}% higher than weekdays`,
        recommendation:
          'Consider setting weekend spending limits or finding cheaper alternatives',
        data: currentAnalysis.comparison,
      });
    }

    // Late night spending alert
    const nightSpending = timeAnalysis.periods.night;
    if (nightSpending.total > 100) {
      alerts.warnings.push({
        type: 'late_night_spending',
        severity: 'low',
        title: 'Late Night Spending Detected',
        message: `You spent $${nightSpending.total.toFixed(2)} during late night hours (9PM-5AM)`,
        recommendation:
          'Track if this is impulsive spending and consider setting evening spending limits',
        data: nightSpending,
      });
    }

    // Frequency alerts (if previous period data available)
    if (previousPeriod) {
      const previousFrequency = this.analyzeFrequencyPatterns(
        transactions,
        previousPeriod
      );
      const currentFrequency = this.analyzeFrequencyPatterns(
        transactions,
        timePeriod
      );

      Object.keys(currentFrequency.categories).forEach(category => {
        const current = currentFrequency.categories[category];
        const previous = previousFrequency.categories[category];

        if (previous) {
          const visitIncrease =
            current.averageVisitsPerWeek - previous.averageVisitsPerWeek;
          const spendingIncrease = current.totalSpent - previous.totalSpent;

          if (visitIncrease > 2) {
            alerts.warnings.push({
              type: 'frequency_increase',
              severity: 'medium',
              title: `${category} Visit Frequency Increased`,
              message: `You're visiting ${category} ${visitIncrease.toFixed(1)} more times per week`,
              recommendation:
                'Consider if this increased frequency aligns with your budget goals',
              data: { current, previous, increase: visitIncrease },
            });
          }

          if (spendingIncrease > 50) {
            alerts.trends.push({
              type: 'spending_increase',
              severity: 'medium',
              title: `${category} Spending Increased`,
              message: `Your ${category} spending increased by $${spendingIncrease.toFixed(2)}`,
              recommendation:
                'Review your recent transactions to understand the increase',
              data: { current, previous, increase: spendingIncrease },
            });
          }
        }
      });
    }

    // Positive insights
    if (
      currentAnalysis.weekday.dailyAverage > 0 &&
      currentAnalysis.weekend.dailyAverage > 0
    ) {
      const weekdayControl =
        currentAnalysis.weekend.dailyAverage <
        currentAnalysis.weekday.dailyAverage * 1.2;
      if (weekdayControl) {
        alerts.insights.push({
          type: 'good_weekend_control',
          title: 'Good Weekend Spending Control',
          message:
            'Your weekend spending is well-controlled compared to weekdays',
          data: currentAnalysis.comparison,
        });
      }
    }

    return alerts;
  }

  /**
   * Helper method to calculate number of days in a time period
   */
  static calculatePeriodDays(timePeriod) {
    if (!timePeriod || !timePeriod.startDate || !timePeriod.endDate) return 30;

    const start = new Date(timePeriod.startDate);
    const end = new Date(timePeriod.endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  }

  /**
   * Generate insights for weekend spending patterns
   */
  static generateWeekendInsights(premiumPercentage, weekday, weekend) {
    const insights = [];

    if (premiumPercentage > 50) {
      insights.push('Significant weekend spending premium detected');
    } else if (premiumPercentage > 20) {
      insights.push('Moderate weekend spending increase');
    } else {
      insights.push('Weekend spending is well controlled');
    }

    if (weekend.dailyAverage > weekday.dailyAverage * 2) {
      insights.push(
        'Weekend daily spending is more than double weekday spending'
      );
    }

    return insights;
  }

  /**
   * Generate insights for time-of-day patterns
   */
  static generateTimeOfDayInsights(periodAnalysis, peakPeriod) {
    const insights = [];
    const periodLabels = {
      earlyMorning: 'Early Morning',
      morning: 'Morning',
      afternoon: 'Afternoon',
      evening: 'Evening',
      night: 'Night',
    };

    if (peakPeriod && periodAnalysis[peakPeriod]) {
      const peakData = periodAnalysis[peakPeriod];
      insights.push(
        `Peak spending occurs during ${periodLabels[peakPeriod]} ($${peakData.total.toFixed(2)})`
      );
    }

    // Check for unusual night spending
    if (periodAnalysis.night && periodAnalysis.night.total > 50) {
      insights.push('Notable late-night spending detected');
    }

    return insights;
  }

  /**
   * Generate insights for frequency patterns
   */
  static generateFrequencyInsights(metrics) {
    const insights = [];

    if (metrics.averageVisitsPerWeek > 5) {
      insights.push(
        `High frequency for - ${metrics.averageVisitsPerWeek.toFixed(1)} visits per week`
      );
    }

    if (metrics.averageSpentPerVisit > 20) {
      insights.push(
        `High average spending per visit (€${metrics.averageSpentPerVisit.toFixed(2)})`
      );
    }

    return insights;
  }

  /**
   * Calculate overall frequency insights across all categories
   */
  static calculateOverallFrequencyInsights(frequencyAnalysis) {
    const categories = Object.keys(frequencyAnalysis);
    const totalWeeklyVisits = categories.reduce(
      (sum, cat) => sum + frequencyAnalysis[cat].averageVisitsPerWeek,
      0
    );
    const totalSpending = categories.reduce(
      (sum, cat) => sum + frequencyAnalysis[cat].totalSpent,
      0
    );

    return {
      totalWeeklyVisits,
      totalSpending,
      mostFrequentCategory: categories.reduce(
        (most, cat) =>
          frequencyAnalysis[cat].averageVisitsPerWeek >
            (frequencyAnalysis[most]?.averageVisitsPerWeek || 0)
            ? cat
            : most,
        categories[0]
      ),
      highestSpendingCategory: categories.reduce(
        (highest, cat) =>
          frequencyAnalysis[cat].totalSpent >
            (frequencyAnalysis[highest]?.totalSpent || 0)
            ? cat
            : highest,
        categories[0]
      ),
    };
  }
}
