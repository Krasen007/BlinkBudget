/**
 * Inflation Chart Utilities
 *
 * Helper functions for preparing inflation trend chart data
 * and creating visual indicators for personal inflation analysis.
 */

import { PersonalInflationService } from '../core/personal-inflation-service.js';
import { getChartColors } from '../core/chart-config.js';

/**
 * Prepare chart data for inflation trends visualization
 * @param {Array} transactions - All transactions
 * @param {number} period - Number of months to analyze (default: 6)
 * @param {string} calcMethod - Calculation method: 'average' or 'median' (default: 'average')
 * @param {string} chartType - Chart type: 'line' or 'bar' (default: 'line')
 * @param {Array} categories - Optional specific categories to show (e.g. from Top Movers)
 * @param {Date} referenceDate - Reference date for analysis (default: now)
 * @returns {Array} Chart data in Chart.js format
 */
export const prepareChartData = (
  transactions,
  period = 6,
  calcMethod = 'average',
  _chartType = 'line',
  categories = null,
  referenceDate = new Date()
) => {
  let topCategories;

  if (categories && categories.length > 0) {
    // If specific categories provided (e.g. from Top Movers), calculate inflation for them
    topCategories = categories.map(catName => {
      const inflationRate = PersonalInflationService.calculateCategoryInflation(
        transactions,
        catName,
        period,
        calcMethod,
        referenceDate
      );
      return {
        category: catName,
        inflationRate,
        trend: PersonalInflationService.getTrendDirection(inflationRate),
      };
    });
  } else {
    // Fall back to top categories by inflation impact
    topCategories = PersonalInflationService.getTopInflationCategories(
      transactions,
      6, // Default to 6 categories
      period,
      calcMethod,
      referenceDate
    );
  }

  if (topCategories.length === 0) {
    return [];
  }

  // Use sequential colors to match Top Movers chart style
  const categoryColors = getChartColors(topCategories.length, false, 'solid');

  return topCategories.map((category, index) => {
    const monthlyData = PersonalInflationService.getMonthlySpendingData(
      transactions,
      category.category,
      period,
      referenceDate
    );

    const chartData = monthlyData.map(month => ({
      x: month.month,
      y: month.amount,
    }));

    const color = categoryColors[index % categoryColors.length];

    return {
      label: `${category.category} (${(category.inflationRate * 100).toFixed(1)}% personal inflation)`,
      data: chartData,
      backgroundColor: color,
      borderColor: color,
      trend: category.trend,
      inflationRate: category.inflationRate,
      category: category.category,
    };
  });
};

/**
 * Calculate monthly spending for a specific category
 * @param {Array} transactions - All transactions
 * @param {string} category - Category to analyze
 * @param {number} monthsBack - Number of months to analyze
 * @returns {Array} Monthly spending data
 */
export const calculateMonthlySpending = (
  transactions,
  category,
  monthsBack
) => {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - monthsBack);

  const monthlySpending = {};

  transactions
    .filter(
      t =>
        t.category === category &&
        t.type === 'expense' &&
        new Date(t.timestamp) >= cutoff
    )
    .forEach(t => {
      const d = new Date(t.timestamp);
      if (isNaN(d.getTime())) return;
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlySpending[month] = (monthlySpending[month] || 0) + t.amount;
    });

  return Object.entries(monthlySpending)
    .map(([month, amount]) => ({
      month,
      amount,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
};

// createTrendIndicator uses CSS classes for trend coloring, so getTrendColor is no longer needed here.

/**
 * Create trend indicator element
 * @param {string} trend - Trend direction: 'up', 'down', or 'stable'
 * @param {number} inflationRate - Inflation rate as decimal
 * @returns {HTMLElement} Trend indicator element
 */
export const createTrendIndicator = (trend, inflationRate) => {
  const indicator = document.createElement('span');
  const badgeClass =
    trend === 'up'
      ? 'badge-error'
      : trend === 'down'
        ? 'badge-success'
        : 'badge-muted';
  indicator.className = `trend-indicator badge ${badgeClass}`;

  const arrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  const percentage = `${(inflationRate * 100).toFixed(1)}%`;

  indicator.innerHTML = `${arrow} ${percentage}`;
  indicator.title = `${trend === 'up' ? 'Prices increasing' : trend === 'down' ? 'Prices decreasing' : 'Prices stable'}`;

  return indicator;
};

/**
 * Format chart labels for better readability
 * @param {Array} monthlyData - Monthly spending data
 * @returns {Array} Formatted labels
 */
export const formatChartLabels = monthlyData => {
  return monthlyData.map(item => {
    const [year, month] = item.month.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: '2-digit',
    });
  });
};

/**
 * Create chart options for inflation trends
 * @param {string} chartType - Chart type: 'line' or 'bar'
 * @returns {Object} Chart.js options
 */
export const getChartOptions = (chartType = 'line') => {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            const formattedValue = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(value);

            // Extract full inflation suffix to prevent garbled labels
            const inflationMatch = label.match(/\([^)]*% personal inflation\)/);
            const fullSuffix = inflationMatch ? inflationMatch[0] : '';

            return `${label.replace(fullSuffix, '').trim()}: ${formattedValue} ${fullSuffix}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(value);
          },
          color: 'hsl(220, 10%, 75%)', // --color-text-muted
        },
        grid: {
          color: 'hsl(240, 5%, 30%)', // --color-border
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'hsl(220, 10%, 75%)', // --color-text-muted
        },
      },
    },
  };

  // Add chart-type specific options
  if (chartType === 'line') {
    baseOptions.elements = {
      line: {
        tension: 0.4,
        borderWidth: 2,
      },
      point: {
        radius: 4,
        hoverRadius: 6,
      },
    };
  } else if (chartType === 'bar') {
    baseOptions.datasets = {
      bar: {
        borderRadius: 6,
        borderSkipped: false,
      },
    };
  }

  return baseOptions;
};

/**
 * Validate chart data before rendering
 * @param {Array} chartData - Chart data to validate
 * @returns {Object} Validation result
 */
export const validateChartData = chartData => {
  if (!Array.isArray(chartData)) {
    return { isValid: false, reason: 'Chart data must be an array' };
  }

  if (chartData.length === 0) {
    return { isValid: false, reason: 'No data available for chart' };
  }

  for (const dataset of chartData) {
    if (!dataset.data || !Array.isArray(dataset.data)) {
      return { isValid: false, reason: 'Each dataset must have data array' };
    }

    if (dataset.data.length === 0) {
      return { isValid: false, reason: 'Dataset has no data points' };
    }
  }

  return { isValid: true };
};
