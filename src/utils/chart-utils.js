/**
 * Chart Utilities
 *
 * Helper functions for chart data preparation, formatting, and manipulation.
 * These utilities support the ChartRenderer component and ensure consistent
 * data formatting across all chart types.
 */

/**
 * Format currency values for display in charts
 * @param {number} value - Numeric value to format
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format percentage values for display
 * @param {number} value - Decimal value (0.15 = 15%)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export function formatPercentage(value, decimals = 1) {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Prepare data for pie charts from category breakdown
 * @param {Array} categoryData - Array of {category, amount} objects
 * @returns {Object} Chart.js compatible data structure
 */
export function preparePieChartData(categoryData) {
  if (!categoryData || categoryData.length === 0) {
    return {
      labels: ['No data'],
      datasets: [
        {
          data: [1],
          backgroundColor: ['#e0e0e0'],
          borderColor: ['#ffffff'],
          borderWidth: 2,
        },
      ],
    };
  }

  const labels = categoryData.map(item => item.category || 'Uncategorized');
  const data = categoryData.map(item => Math.abs(item.amount || 0));

  return {
    labels,
    datasets: [
      {
        data,
        borderWidth: 2,
        // Colors will be added by ChartRenderer
      },
    ],
  };
}

/**
 * Prepare data for bar charts from time series or category data
 * @param {Array} data - Array of data points
 * @param {string} labelKey - Key for labels (x-axis)
 * @param {string} valueKey - Key for values (y-axis)
 * @param {string} datasetLabel - Label for the dataset
 * @returns {Object} Chart.js compatible data structure
 */
export function prepareBarChartData(
  data,
  labelKey,
  valueKey,
  datasetLabel = 'Amount'
) {
  if (!data || data.length === 0) {
    return {
      labels: ['No data'],
      datasets: [
        {
          label: datasetLabel,
          data: [0],
          backgroundColor: ['#e0e0e0'],
        },
      ],
    };
  }

  const labels = data.map(item => item[labelKey] ?? 'Unknown');
  const values = data.map(item => {
    const val = item[valueKey];
    return typeof val === 'number' ? Math.abs(val) : 0;
  });

  return {
    labels,
    datasets: [
      {
        label: datasetLabel,
        data: values,
        // Colors will be added by ChartRenderer
      },
    ],
  };
}

/**
 * Calculate percentage breakdown for category data
 * @param {Array} categoryData - Array of {category, amount} objects
 * @returns {Array} Array with percentage calculations added
 */
export function calculatePercentages(categoryData) {
  if (!categoryData || categoryData.length === 0) {
    return [];
  }

  const total = categoryData.reduce(
    (sum, item) => sum + Math.abs(item.amount || 0),
    0
  );

  if (total === 0) {
    return categoryData.map(item => ({
      ...item,
      percentage: 0,
    }));
  }

  return categoryData.map(item => ({
    ...item,
    percentage: Math.abs(item.amount || 0) / total,
  }));
}

/**
 * Validate chart data structure
 * @param {Object} data - Chart data to validate
 * @returns {boolean} True if data is valid
 */
export function validateChartData(data) {
  if (!data || typeof data !== 'object') {
    return false;
  }

  if (!Array.isArray(data.labels) || !Array.isArray(data.datasets)) {
    return false;
  }

  if (data.labels.length === 0 || data.datasets.length === 0) {
    return false;
  }

  // Check that each dataset has data array
  return data.datasets.every(
    dataset => dataset && Array.isArray(dataset.data) && dataset.data.length > 0
  );
}
