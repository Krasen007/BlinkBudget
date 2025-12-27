/**
 * ChartRenderer Component
 * 
 * Handles all chart creation, updates, and interactions using Chart.js library.
 * Provides a consistent interface for rendering different chart types with
 * BlinkBudget's design system and accessibility features.
 */

import { ChartJS, defaultChartOptions, getChartColors, createChartOptions } from '../core/chart-config.js';

export class ChartRenderer {
  constructor() {
    this.activeCharts = new Map(); // Track active chart instances for cleanup
  }

  /**
   * Create a pie chart for category breakdowns
   * @param {HTMLCanvasElement} canvasElement - Canvas element to render chart
   * @param {Object} data - Chart data in Chart.js format
   * @param {Object} options - Custom chart options
   * @returns {Chart} Chart.js instance
   */
  createPieChart(canvasElement, data, options = {}) {
    const chartOptions = createChartOptions({
      ...options,
      plugins: {
        ...options.plugins,
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
            generateLabels: (chart) => {
              const data = chart.data;
              if (data.labels.length && data.datasets.length) {
                return data.labels.map((label, i) => {
                  const dataset = data.datasets[0];
                  const value = dataset.data[i];
                  const total = dataset.data.reduce((sum, val) => sum + val, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  
                  return {
                    text: `${label} (${percentage}%)`,
                    fillStyle: dataset.backgroundColor[i],
                    strokeStyle: dataset.borderColor?.[i] || '#fff',
                    lineWidth: 2,
                    pointStyle: 'circle',
                    index: i
                  };
                });
              }
              return [];
            }
          }
        }
      }
    });

    // Ensure data has proper colors
    if (data.datasets && data.datasets[0] && !data.datasets[0].backgroundColor) {
      data.datasets[0].backgroundColor = getChartColors(data.labels.length);
      data.datasets[0].borderColor = '#ffffff';
      data.datasets[0].borderWidth = 2;
    }

    const chart = new ChartJS(canvasElement, {
      type: 'pie',
      data,
      options: chartOptions
    });

    this.activeCharts.set(canvasElement.id, chart);
    return chart;
  }

  /**
   * Create a bar chart for comparisons
   * @param {HTMLCanvasElement} canvasElement - Canvas element to render chart
   * @param {Object} data - Chart data in Chart.js format
   * @param {Object} options - Custom chart options
   * @returns {Chart} Chart.js instance
   */
  createBarChart(canvasElement, data, options = {}) {
    const chartOptions = createChartOptions({
      ...options,
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          },
          ticks: {
            callback: function(value) {
              return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0
              }).format(value);
            }
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    });

    // Ensure data has proper colors
    if (data.datasets) {
      data.datasets.forEach((dataset, index) => {
        if (!dataset.backgroundColor) {
          dataset.backgroundColor = getChartColors(data.labels.length);
          dataset.borderColor = getChartColors(data.labels.length);
          dataset.borderWidth = 1;
        }
      });
    }

    const chart = new ChartJS(canvasElement, {
      type: 'bar',
      data,
      options: chartOptions
    });

    this.activeCharts.set(canvasElement.id, chart);
    return chart;
  }

  /**
   * Create a line chart for trends over time
   * @param {HTMLCanvasElement} canvasElement - Canvas element to render chart
   * @param {Object} data - Chart data in Chart.js format
   * @param {Object} options - Custom chart options
   * @returns {Chart} Chart.js instance
   */
  createLineChart(canvasElement, data, options = {}) {
    const chartOptions = createChartOptions({
      ...options,
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          },
          ticks: {
            callback: function(value) {
              return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0
              }).format(value);
            }
          }
        },
        x: {
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        }
      },
      elements: {
        line: {
          tension: 0.4 // Smooth curves
        },
        point: {
          radius: 4,
          hoverRadius: 6
        }
      }
    });

    // Ensure data has proper colors and styling
    if (data.datasets) {
      data.datasets.forEach((dataset, index) => {
        const colors = getChartColors(data.datasets.length);
        if (!dataset.borderColor) {
          dataset.borderColor = colors[index];
          dataset.backgroundColor = colors[index].replace(')', ', 0.1)').replace('hsl', 'hsla');
          dataset.borderWidth = 3;
          dataset.fill = false;
        }
      });
    }

    const chart = new ChartJS(canvasElement, {
      type: 'line',
      data,
      options: chartOptions
    });

    this.activeCharts.set(canvasElement.id, chart);
    return chart;
  }

  /**
   * Create a doughnut chart (similar to pie but with center hole)
   * @param {HTMLCanvasElement} canvasElement - Canvas element to render chart
   * @param {Object} data - Chart data in Chart.js format
   * @param {Object} options - Custom chart options
   * @returns {Chart} Chart.js instance
   */
  createDoughnutChart(canvasElement, data, options = {}) {
    const chartOptions = createChartOptions({
      ...options,
      cutout: '60%', // Size of center hole
      plugins: {
        ...options.plugins,
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true
          }
        }
      }
    });

    // Ensure data has proper colors
    if (data.datasets && data.datasets[0] && !data.datasets[0].backgroundColor) {
      data.datasets[0].backgroundColor = getChartColors(data.labels.length);
      data.datasets[0].borderColor = '#ffffff';
      data.datasets[0].borderWidth = 2;
    }

    const chart = new ChartJS(canvasElement, {
      type: 'doughnut',
      data,
      options: chartOptions
    });

    this.activeCharts.set(canvasElement.id, chart);
    return chart;
  }

  /**
   * Update an existing chart with new data
   * @param {Chart} chartInstance - Chart.js instance to update
   * @param {Object} newData - New data to display
   */
  updateChart(chartInstance, newData) {
    if (!chartInstance) return;

    // Update data
    chartInstance.data = newData;
    
    // Trigger re-render with animation
    chartInstance.update('active');
  }

  /**
   * Destroy a chart instance and clean up resources
   * @param {Chart|string} chartInstanceOrId - Chart instance or canvas ID
   */
  destroyChart(chartInstanceOrId) {
    let chart;
    
    if (typeof chartInstanceOrId === 'string') {
      chart = this.activeCharts.get(chartInstanceOrId);
      this.activeCharts.delete(chartInstanceOrId);
    } else {
      chart = chartInstanceOrId;
      // Find and remove from active charts
      for (const [id, activeChart] of this.activeCharts.entries()) {
        if (activeChart === chart) {
          this.activeCharts.delete(id);
          break;
        }
      }
    }

    if (chart) {
      chart.destroy();
    }
  }

  /**
   * Resize a chart to fit its container
   * @param {Chart} chartInstance - Chart.js instance to resize
   */
  resizeChart(chartInstance) {
    if (chartInstance) {
      chartInstance.resize();
    }
  }

  /**
   * Apply mobile-specific optimizations to a chart
   * @param {Chart} chartInstance - Chart.js instance to optimize
   */
  applyMobileOptimizations(chartInstance) {
    if (!chartInstance) return;

    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
      // Reduce legend padding on mobile
      chartInstance.options.plugins.legend.labels.padding = 10;
      
      // Smaller font sizes
      chartInstance.options.plugins.legend.labels.font.size = 10;
      
      // Reduce animation duration for better performance
      chartInstance.options.animation.duration = 400;
      
      // Update the chart
      chartInstance.update('none'); // No animation for performance
    }
  }

  /**
   * Clean up all active charts
   * Call this when navigating away from reports view
   */
  destroyAllCharts() {
    for (const chart of this.activeCharts.values()) {
      chart.destroy();
    }
    this.activeCharts.clear();
  }

  /**
   * Get all active chart instances
   * @returns {Map} Map of canvas IDs to chart instances
   */
  getActiveCharts() {
    return new Map(this.activeCharts);
  }
}

// Export a singleton instance for use across the application
export const chartRenderer = new ChartRenderer();