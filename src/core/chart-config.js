/**
 * Chart.js Configuration and Setup
 * 
 * This module provides modular Chart.js imports to minimize bundle size
 * and sets up the basic chart rendering infrastructure for BlinkBudget.
 * 
 * Only imports the components we actually need for the reports feature.
 */

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register only the Chart.js components we need
ChartJS.register(
  CategoryScale,    // For bar charts
  LinearScale,      // For line and bar charts
  PointElement,     // For line charts
  LineElement,      // For line charts
  ArcElement,       // For pie and doughnut charts
  BarElement,       // For bar charts
  Title,            // For chart titles
  Tooltip,          // For hover tooltips
  Legend            // For chart legends
);

/**
 * Default chart configuration that aligns with BlinkBudget's design system
 */
export const defaultChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        padding: 20,
        usePointStyle: true,
        font: {
          family: 'system-ui, -apple-system, sans-serif',
          size: 12
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: '#333333',
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true,
      padding: 12
    }
  },
  animation: {
    duration: 750,
    easing: 'easeInOutQuart'
  }
};

/**
 * BlinkBudget color palette for charts
 * Uses HSL color space for consistent theming
 */
export const chartColors = {
  primary: [
    'hsl(210, 100%, 60%)',   // Blue
    'hsl(150, 100%, 45%)',   // Green
    'hsl(30, 100%, 60%)',    // Orange
    'hsl(300, 100%, 60%)',   // Purple
    'hsl(0, 100%, 60%)',     // Red
    'hsl(60, 100%, 50%)',    // Yellow
    'hsl(180, 100%, 45%)',   // Cyan
    'hsl(270, 100%, 60%)',   // Violet
  ],
  income: 'hsl(150, 100%, 45%)',    // Green for income
  expense: 'hsl(0, 100%, 60%)',     // Red for expenses
  neutral: 'hsl(210, 10%, 60%)',    // Gray for neutral data
};

/**
 * Accessibility-compliant color variations
 * Ensures WCAG 2.1 AA contrast compliance
 */
export const accessibleColors = {
  high_contrast: [
    'hsl(210, 100%, 40%)',   // Darker blue
    'hsl(150, 100%, 35%)',   // Darker green
    'hsl(30, 100%, 45%)',    // Darker orange
    'hsl(300, 100%, 45%)',   // Darker purple
    'hsl(0, 100%, 45%)',     // Darker red
    'hsl(60, 100%, 35%)',    // Darker yellow
    'hsl(180, 100%, 35%)',   // Darker cyan
    'hsl(270, 100%, 45%)',   // Darker violet
  ]
};

/**
 * Export Chart.js for use in other modules
 */
export { ChartJS };

/**
 * Utility function to get colors for a dataset
 * @param {number} count - Number of colors needed
 * @param {boolean} highContrast - Whether to use high contrast colors
 * @returns {string[]} Array of color strings
 */
export function getChartColors(count, highContrast = false) {
  const colors = highContrast ? accessibleColors.high_contrast : chartColors.primary;
  const result = [];
  
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }
  
  return result;
}

/**
 * Utility function to create responsive chart options
 * @param {Object} customOptions - Custom options to merge
 * @returns {Object} Complete chart options
 */
export function createChartOptions(customOptions = {}) {
  return {
    ...defaultChartOptions,
    ...customOptions,
    plugins: {
      ...defaultChartOptions.plugins,
      ...customOptions.plugins
    }
  };
}