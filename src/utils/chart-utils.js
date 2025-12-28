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
    maximumFractionDigits: 2
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
 * Prepare data for pie/doughnut charts from category breakdown
 * @param {Array} categoryData - Array of {category, amount} objects
 * @returns {Object} Chart.js compatible data structure
 */
export function preparePieChartData(categoryData) {
  if (!categoryData || categoryData.length === 0) {
    return {
      labels: ['No data'],
      datasets: [{
        data: [1],
        backgroundColor: ['#e0e0e0'],
        borderColor: ['#ffffff'],
        borderWidth: 2
      }]
    };
  }

  const labels = categoryData.map(item => item.category || 'Uncategorized');
  const data = categoryData.map(item => Math.abs(item.amount || 0));

  return {
    labels,
    datasets: [{
      data,
      borderWidth: 2
      // Colors will be added by ChartRenderer
    }]
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
export function prepareBarChartData(data, labelKey, valueKey, datasetLabel = 'Amount') {
  if (!data || data.length === 0) {
    return {
      labels: ['No data'],
      datasets: [{
        label: datasetLabel,
        data: [0],
        backgroundColor: ['#e0e0e0']
      }]
    };
  }

  const labels = data.map(item => item[labelKey] ?? 'Unknown');
  const values = data.map(item => {
    const val = item[valueKey];
    return typeof val === 'number' ? Math.abs(val) : 0;
  });
  return {
    labels,
    datasets: [{
      label: datasetLabel,
      data: values
      // Colors will be added by ChartRenderer
    }]
  };
}

/**
 * Prepare data for line charts from time series data
 * @param {Array} timeSeriesData - Array of {date, value} objects
 * @param {string} label - Dataset label
 * @returns {Object} Chart.js compatible data structure
 */
export function prepareLineChartData(timeSeriesData, label = 'Amount') {
  if (!timeSeriesData || timeSeriesData.length === 0) {
    return {
      labels: ['No data'],
      datasets: [{
        label,
        data: [0],
        fill: false
      }]
    };
  }

  const labels = timeSeriesData.map(item => {
    const date = new Date(item.date);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  });
  
  const data = timeSeriesData.map(item => item.value || 0);

  return {
    labels,
    datasets: [{
      label,
      data,
      fill: false
      // Colors and styling will be added by ChartRenderer
    }]
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

  const total = categoryData.reduce((sum, item) => sum + Math.abs(item.amount || 0), 0);
  
  if (total === 0) {
    return categoryData.map(item => ({
      ...item,
      percentage: 0
    }));
  }

  return categoryData.map(item => ({
    ...item,
    percentage: Math.abs(item.amount || 0) / total
  }));
}

/**
 * Sort category data by amount (descending)
 * @param {Array} categoryData - Array of category objects
 * @returns {Array} Sorted array
 */
export function sortByAmount(categoryData) {
  if (!categoryData || categoryData.length === 0) {
    return [];
  }

  return [...categoryData].sort((a, b) => Math.abs(b.amount || 0) - Math.abs(a.amount || 0));
}

/**
 * Group small categories into "Other" category
 * @param {Array} categoryData - Array of category objects
 * @param {number} threshold - Minimum percentage to show separately (default: 0.05 = 5%)
 * @param {number} maxCategories - Maximum number of categories to show (default: 8)
export function groupSmallCategories(categoryData, threshold = 0.05, maxCategories = 8) {
  if (!categoryData || categoryData.length === 0) {
    return [];
  }

  const dataWithPercentages = calculatePercentages(categoryData);
  const sorted = sortByAmount(dataWithPercentages);
  
  // Separate categories above and below threshold
  const aboveThreshold = sorted.filter(item => item.percentage >= threshold);
  const belowThreshold = sorted.filter(item => item.percentage < threshold);

  // If categories above threshold fit within limit, return them with grouped below-threshold
  if (aboveThreshold.length <= maxCategories - 1) {
    if (belowThreshold.length > 0) {
      const otherTotal = belowThreshold.reduce((sum, item) => sum + Math.abs(item.amount || 0), 0);
      const total = sorted.reduce((sum, item) => sum + Math.abs(item.amount || 0), 0);
      aboveThreshold.push({
        category: 'Other',
        amount: otherTotal,
        percentage: otherTotal / total,
        count: belowThreshold.length
      });
    }
    return aboveThreshold;
  }

  // Take the top categories
  const topCategories = aboveThreshold.slice(0, maxCategories - 1);
  const otherCategories = [...aboveThreshold.slice(maxCategories - 1), ...belowThreshold];

  // Group remaining categories into "Other"
  if (otherCategories.length > 0) {
    const otherTotal = otherCategories.reduce((sum, item) => sum + Math.abs(item.amount || 0), 0);
    const total = sorted.reduce((sum, item) => sum + Math.abs(item.amount || 0), 0);
    
    topCategories.push({
      category: 'Other',
      amount: otherTotal,
      percentage: otherTotal / total,
      count: otherCategories.length
    });
  }

  return topCategories;
}  return topCategories;
}

/**
 * Create empty state data for charts when no data is available
 * @param {string} message - Message to display
 * @returns {Object} Chart.js compatible empty state data
 */
export function createEmptyStateData(message = 'No data available') {
  return {
    labels: [message],
    datasets: [{
      data: [1],
      backgroundColor: ['#f0f0f0'],
      borderColor: ['#d0d0d0'],
      borderWidth: 1
    }]
  };
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
  return data.datasets.every(dataset => 
    dataset && Array.isArray(dataset.data) && dataset.data.length > 0
  );
}