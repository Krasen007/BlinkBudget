/**
 * Reports Utilities
 *
 * Utility functions for reports view including time period calculations,
 * browser support checks, and data validation.
 */

import { formatDateForDisplay } from './date-utils.js';

/**
 * Get today's time period
 */
export function getTodayPeriod() {
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  return {
    type: 'daily',
    startDate: startOfDay,
    endDate: endOfDay,
    label: 'Today',
  };
}

/**
 * Get current month time period
 */
export function getCurrentMonthPeriod() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now);
  endOfMonth.setHours(23, 59, 59, 999);

  return {
    type: 'monthly',
    startDate: startOfMonth,
    endDate: endOfMonth,
    label: 'This Month',
  };
}

/**
 * Get current quarter time period
 */
export function getCurrentQuarterPeriod() {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3);
  const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
  const endOfQuarter = new Date(now.getFullYear(), quarter * 3 + 3, 0);
  endOfQuarter.setHours(23, 59, 59, 999);

  return {
    type: 'quarterly',
    startDate: startOfQuarter,
    endDate: endOfQuarter,
    label: 'This Quarter',
  };
}

/**
 * Get a specific quarter period (for navigation)
 */
export function getSpecificQuarterPeriod(quartersOffset = 0) {
  const now = new Date();
  const currentQuarter = Math.floor(now.getMonth() / 3);
  const targetQuarter = currentQuarter + quartersOffset;

  // Calculate the year and quarter
  const targetYear = now.getFullYear() + Math.floor(targetQuarter / 4);
  const quarterInYear = ((targetQuarter % 4) + 4) % 4; // Handle negative quarters

  const startOfQuarter = new Date(targetYear, quarterInYear * 3, 1);
  const endOfQuarter = new Date(targetYear, quarterInYear * 3 + 3, 0);
  endOfQuarter.setHours(23, 59, 59, 999);

  const quarterLabels = ['Q1', 'Q2', 'Q3', 'Q4'];

  return {
    type: 'quarterly',
    startDate: startOfQuarter,
    endDate: endOfQuarter,
    label: `${quarterLabels[quarterInYear]} ${targetYear}`,
  };
}

/**
 * Format time period for display
 */
export function formatTimePeriod(timePeriod) {
  if (!timePeriod || !timePeriod.startDate || !timePeriod.endDate) {
    throw new Error('Invalid time period object');
  }
  const startDate = formatDateForDisplay(timePeriod.startDate);
  const endDate = formatDateForDisplay(timePeriod.endDate);
  return `${startDate} - ${endDate}`;
}
/**
 * Check browser support for required features
 * Returns object with support status and missing/limited features
 */
export function checkBrowserSupport() {
  const requiredFeatures = {
    'ES6 Classes': () => {
      // Test ES6 class support
      return typeof class {} === 'function';
    },
    Promises: () => typeof Promise !== 'undefined',
    'Fetch API': () => typeof fetch !== 'undefined',
    Canvas: () => {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext && canvas.getContext('2d'));
    },
    'Local Storage': () => {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
      } catch {
        return false;
      }
    },
    'CSS Grid': () => {
      const div = document.createElement('div');
      return 'grid' in div.style;
    },
  };

  const optionalFeatures = {
    'Web Workers': () => typeof Worker !== 'undefined',
    'Intersection Observer': () => typeof IntersectionObserver !== 'undefined',
    'CSS Custom Properties': () => {
      const div = document.createElement('div');
      div.style.setProperty('--test', 'test');
      return div.style.getPropertyValue('--test') === 'test';
    },
    'Performance API': () =>
      typeof performance !== 'undefined' &&
      typeof performance.now === 'function',
  };

  const missingFeatures = [];
  const limitedFeatures = [];

  // Check required features
  for (const [feature, check] of Object.entries(requiredFeatures)) {
    if (!check()) {
      missingFeatures.push(feature);
    }
  }

  // Check optional features
  for (const [feature, check] of Object.entries(optionalFeatures)) {
    if (!check()) {
      limitedFeatures.push(feature);
    }
  }

  return {
    isSupported: missingFeatures.length === 0,
    hasLimitedSupport: limitedFeatures.length > 0,
    missingFeatures,
    limitedFeatures,
  };
}

/**
 * Validate analytics data structure
 */
export function validateAnalyticsData(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Analytics data is not an object');
  }

  if (!Array.isArray(data.transactions)) {
    throw new Error('Analytics data missing transactions array');
  }

  if (
    !data.categoryBreakdown ||
    !Array.isArray(data.categoryBreakdown.categories)
  ) {
    throw new Error('Analytics data missing category breakdown');
  }

  if (
    !data.incomeVsExpenses ||
    typeof data.incomeVsExpenses.totalIncome !== 'number'
  ) {
    throw new Error('Analytics data missing income vs expenses');
  }

  // Check for NaN values
  const numericFields = [
    data.incomeVsExpenses.totalIncome,
    data.incomeVsExpenses.totalExpenses,
    data.incomeVsExpenses.netBalance,
  ];

  if (numericFields.some(field => isNaN(field))) {
    throw new Error('Analytics data contains invalid numeric values');
  }
}

/**
 * Sanitize analytics data to fix common issues
 */
export function sanitizeAnalyticsData(data) {
  // Create a deep copy to avoid modifying original
  const sanitized = JSON.parse(JSON.stringify(data));

  // Fix NaN values
  if (isNaN(sanitized.incomeVsExpenses.totalIncome)) {
    sanitized.incomeVsExpenses.totalIncome = 0;
  }
  if (isNaN(sanitized.incomeVsExpenses.totalExpenses)) {
    sanitized.incomeVsExpenses.totalExpenses = 0;
  }
  if (isNaN(sanitized.incomeVsExpenses.netBalance)) {
    sanitized.incomeVsExpenses.netBalance =
      sanitized.incomeVsExpenses.totalIncome -
      sanitized.incomeVsExpenses.totalExpenses;
  }

  // Fix category breakdown
  if (!sanitized.categoryBreakdown.categories) {
    sanitized.categoryBreakdown.categories = [];
  }

  sanitized.categoryBreakdown.categories =
    sanitized.categoryBreakdown.categories.filter(
      cat => cat && typeof cat.amount === 'number' && !isNaN(cat.amount)
    );

  return sanitized;
}

/**
 * Create minimal analytics data as last resort fallback
 */
export function createMinimalAnalyticsData(transactions, timePeriod) {
  const filteredTransactions = transactions.filter(t => {
    if (t.isGhost) return false;
    const transactionDate = new Date(t.date || t.timestamp);
    const startDate = new Date(timePeriod.startDate);
    const endDate = new Date(timePeriod.endDate);
    return transactionDate >= startDate && transactionDate <= endDate;
  });

  let totalIncome = 0;
  let totalExpenses = 0;

  filteredTransactions.forEach(t => {
    const amount = Math.abs(t.amount || 0);
    if (t.type === 'income') {
      totalIncome += amount;
    } else {
      totalExpenses += amount;
    }
  });

  return {
    transactions: filteredTransactions,
    categoryBreakdown: {
      categories: [
        {
          name: 'All Expenses',
          amount: totalExpenses,
          percentage: 100,
          transactionCount: filteredTransactions.filter(
            t => t.type !== 'income'
          ).length,
        },
      ],
      totalAmount: totalExpenses,
      transactionCount: filteredTransactions.filter(t => t.type !== 'income')
        .length,
    },
    incomeVsExpenses: {
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      timePeriod,
    },
    costOfLiving: {
      totalExpenditure: totalExpenses,
      dailySpending: totalExpenses / 30,
      timePeriod,
    },
    isMinimal: true,
  };
}
