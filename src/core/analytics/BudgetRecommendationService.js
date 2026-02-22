/**
 * BudgetRecommendationService - Feature 3.3.3 & 3.3.4
 *
 * Provides comparative analytics (personal benchmarking) and predictive budget recommendations.
 *
 * @module analytics/BudgetRecommendationService
 */

/**
 * Get historical periods for comparison - works with 1+ months
 */
function getHistoricalPeriods(currentPeriod, monthsBack = 3) {
  const periods = [];
  const start = new Date(currentPeriod.startDate);

  // Adjust monthsBack based on available data
  const maxMonthsBack = Math.min(monthsBack, 12); // Max 1 year back

  for (let i = 1; i <= maxMonthsBack; i++) {
    const periodStart = new Date(start);
    periodStart.setMonth(periodStart.getMonth() - i);
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    periodEnd.setDate(0); // Last day of month

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
function calculateCategoryAverage(transactions, category, periods) {
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

// Note: calculateStandardDeviation is available for future use
// function calculateStandardDeviation(amounts) {
//     if (amounts.length < 2) return 0;
//     const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
//     const squaredDiffs = amounts.map(amount => Math.pow(amount - mean, 2));
//     const variance = squaredDiffs.reduce((a, b) => a + b, 0) / amounts.length;
//     return Math.sqrt(variance);
// }

/**
 * Get personal benchmarking data - compare current period vs last month
 * Simpler direct comparison: This Month vs Last Month
 */
export function getPersonalBenchmarking(transactions, timePeriod) {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  // Get the previous month date range
  const currentStart = new Date(timePeriod.startDate);
  const lastMonthStart = new Date(currentStart);
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
  const lastMonthEnd = new Date(lastMonthStart);
  lastMonthEnd.setMonth(lastMonthEnd.getMonth() + 1);
  lastMonthEnd.setDate(0); // Last day of month

  const lastMonthStartStr = lastMonthStart.toISOString().split('T')[0];
  const lastMonthEndStr = lastMonthEnd.toISOString().split('T')[0];
  const lastMonthLabel = lastMonthStart.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  // Get current period spending by category
  const currentSpending = {};
  transactions.forEach(t => {
    if (t.type !== 'expense') return;
    const tDate = t.date || t.timestamp;
    if (!tDate || tDate < timePeriod.startDate || tDate > timePeriod.endDate)
      return;

    if (!currentSpending[t.category]) {
      currentSpending[t.category] = 0;
    }
    currentSpending[t.category] += t.amount || 0;
  });

  // Get last month spending by category
  const lastMonthSpending = {};
  transactions.forEach(t => {
    if (t.type !== 'expense') return;
    const tDate = t.date || t.timestamp;
    if (!tDate || tDate < lastMonthStartStr || tDate > lastMonthEndStr) return;

    if (!lastMonthSpending[t.category]) {
      lastMonthSpending[t.category] = 0;
    }
    lastMonthSpending[t.category] += t.amount || 0;
  });

  // Calculate benchmarking comparing current vs last month
  const benchmarking = [];
  const categories = new Set([
    ...Object.keys(currentSpending),
    ...Object.keys(lastMonthSpending),
  ]);

  categories.forEach(category => {
    const current = currentSpending[category] || 0;
    const lastMonth = lastMonthSpending[category] || 0;

    if (current > 0 || lastMonth > 0) {
      let change = 0;
      let trend = 'stable';

      if (lastMonth > 0) {
        change = ((current - lastMonth) / lastMonth) * 100;
        trend =
          change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable';
      } else if (current > 0) {
        // No last month data but has current - new category
        change = 0;
        trend = 'new';
      }

      benchmarking.push({
        category,
        current,
        lastMonth,
        change: Math.round(change * 10) / 10,
        trend,
        period: `vs ${lastMonthLabel}`,
      });
    }
  });

  // Sort by absolute change (biggest changes first)
  return benchmarking.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
}

/**
 * Get percentile rankings for categories
 */
export function getPercentileRankings(transactions, timePeriod) {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  // Get all category spending for the period
  const categorySpending = {};
  transactions.forEach(t => {
    if (t.type !== 'expense') return;
    const tDate = t.date || t.timestamp;
    if (!tDate || tDate < timePeriod.startDate || tDate > timePeriod.endDate)
      return;

    if (!categorySpending[t.category]) {
      categorySpending[t.category] = [];
    }
    categorySpending[t.category].push(t.amount || 0);
  });

  // Calculate percentiles
  const rankings = Object.entries(categorySpending).map(
    ([category, amounts]) => {
      const sorted = [...amounts].sort((a, b) => a - b);
      const sum = amounts.reduce((a, b) => a + b, 0);
      const avg = sum / amounts.length;

      // Calculate true median
      let median = 0;
      if (sorted.length > 0) {
        const mid = Math.floor(sorted.length / 2);
        if (sorted.length % 2 === 0) {
          // Even length: average of two middle values
          median = (sorted[mid - 1] + sorted[mid]) / 2;
        } else {
          // Odd length: middle value
          median = sorted[mid];
        }
      }

      return {
        category,
        total: sum,
        average: Math.round(avg * 100) / 100,
        transactionCount: amounts.length,
        median: Math.round(median * 100) / 100,
        highest: Math.max(...amounts),
        lowest: Math.min(...amounts),
      };
    }
  );

  return rankings.sort((a, b) => b.total - a.total);
}

/**
 * Get budget recommendations based on historical spending
 */
export function getBudgetRecommendations(transactions, timePeriod) {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  const periods = getHistoricalPeriods(timePeriod, 3);

  // Get current period spending by category
  const currentSpending = {};
  transactions.forEach(t => {
    if (t.type !== 'expense') return;
    const tDate = t.date || t.timestamp;
    if (!tDate || tDate < timePeriod.startDate || tDate > timePeriod.endDate)
      return;

    if (!currentSpending[t.category]) {
      currentSpending[t.category] = 0;
    }
    currentSpending[t.category] += t.amount || 0;
  });

  // Generate recommendations
  const recommendations = [];
  const categories = Object.keys(currentSpending);

  categories.forEach(category => {
    const current = currentSpending[category];
    const historicalAverage = calculateCategoryAverage(
      transactions,
      category,
      periods
    );

    if (historicalAverage > 0) {
      // Calculate recommended budget with 10% buffer
      const recommended = Math.round(historicalAverage * 1.1 * 100) / 100;
      const confidence = Math.min(
        100,
        Math.max(
          0,
          100 - (Math.abs(current - historicalAverage) / historicalAverage) * 50
        )
      );

      let reasoning;
      if (current > historicalAverage * 1.2) {
        reasoning = `You're spending ${Math.round((current / historicalAverage - 1) * 100)}% more than usual. Consider reducing to stay on track.`;
      } else if (current < historicalAverage * 0.8) {
        reasoning = `Great job! You're spending ${Math.round((1 - current / historicalAverage) * 100)}% less than your average.`;
      } else {
        reasoning = `Your spending is within your normal range.`;
      }

      recommendations.push({
        id: `rec_${category.replace(/\s+/g, '_')}`,
        category,
        currentBudget: current,
        recommendedBudget: recommended,
        historicalAverage,
        confidence: Math.round(confidence),
        reasoning,
        priority:
          Math.abs(current - historicalAverage) / historicalAverage > 0.3
            ? 'high'
            : 'normal',
      });
    }
  });

  // Sort by priority then by amount
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
export function getRecommendedAmount(categoryId, transactions) {
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

  // Calculate confidence based on data points
  const confidence = Math.min(100, categoryTransactions.length * 10);

  // Apply 10% buffer
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
export function getSeasonalAdjustments(categoryId, transactions) {
  if (!transactions || transactions.length === 0 || !categoryId) {
    return { adjustment: 1, factors: [] };
  }

  // Group transactions by month
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

  // Calculate average for each month
  const monthlyAvg = {};
  Object.entries(monthlySpending).forEach(([month, amounts]) => {
    const sum = amounts.reduce((a, b) => a + b, 0);
    monthlyAvg[month] = sum / amounts.length;
  });

  // Calculate overall average
  const allAmounts = Object.values(monthlySpending).flat();
  let overallAvg = 0;
  if (allAmounts.length > 0) {
    overallAvg = allAmounts.reduce((a, b) => a + b, 0) / allAmounts.length;
  }

  // Calculate adjustment factors
  const currentMonth = new Date().getMonth();
  const currentMonthAvg = monthlyAvg[currentMonth] || overallAvg;
  const adjustment =
    currentMonthAvg > 0 && overallAvg > 0 ? currentMonthAvg / overallAvg : 1;

  const factors = Object.entries(monthlyAvg)
    .map(([month, avg]) => ({
      month: parseInt(month),
      label: new Date(2024, parseInt(month), 1).toLocaleDateString('en-US', {
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

// Export as a service object for consistency
export const budgetRecommendationService = {
  getPersonalBenchmarking,
  getPercentileRankings,
  getBudgetRecommendations,
  getRecommendedAmount,
  getSeasonalAdjustments,
};

export default budgetRecommendationService;
