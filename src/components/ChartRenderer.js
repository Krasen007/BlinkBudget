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
        },
        tooltip: {
          ...defaultChartOptions.plugins.tooltip,
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.parsed;
              const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              const formattedValue = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(value);
              
              return `${label}: ${formattedValue} (${percentage}%)`;
            }
          }
        }
      },
      onHover: (event, activeElements, chart) => {
        this.handleChartHover(event, activeElements, chart);
      },
      onClick: (event, activeElements, chart) => {
        this.handleChartClick(event, activeElements, chart, 'pie');
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

    // Add keyboard navigation for accessibility
    this.addKeyboardNavigation(chart);

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
      },
      plugins: {
        ...options.plugins,
        tooltip: {
          ...defaultChartOptions.plugins.tooltip,
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              const formattedValue = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(value);
              
              return `${label}: ${formattedValue}`;
            }
          }
        }
      },
      onHover: (event, activeElements, chart) => {
        this.handleChartHover(event, activeElements, chart);
      },
      onClick: (event, activeElements, chart) => {
        this.handleChartClick(event, activeElements, chart, 'bar');
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

    // Add keyboard navigation for accessibility
    this.addKeyboardNavigation(chart);

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
      },
      plugins: {
        ...options.plugins,
        tooltip: {
          ...defaultChartOptions.plugins.tooltip,
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              const formattedValue = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(value);
              
              return `${label}: ${formattedValue}`;
            }
          }
        }
      },
      onHover: (event, activeElements, chart) => {
        this.handleChartHover(event, activeElements, chart);
      },
      onClick: (event, activeElements, chart) => {
        this.handleChartClick(event, activeElements, chart, 'line');
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

    // Add keyboard navigation for accessibility
    this.addKeyboardNavigation(chart);

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
        },
        tooltip: {
          ...defaultChartOptions.plugins.tooltip,
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.parsed;
              const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              const formattedValue = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(value);
              
              return `${label}: ${formattedValue} (${percentage}%)`;
            }
          }
        }
      },
      onHover: (event, activeElements, chart) => {
        this.handleChartHover(event, activeElements, chart);
      },
      onClick: (event, activeElements, chart) => {
        this.handleChartClick(event, activeElements, chart, 'doughnut');
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

    // Add keyboard navigation for accessibility
    this.addKeyboardNavigation(chart);

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
   * Handle chart hover interactions
   * @param {Event} event - Mouse event
   * @param {Array} activeElements - Active chart elements
   * @param {Chart} chart - Chart.js instance
   */
  handleChartHover(event, activeElements, chart) {
    // Change cursor to pointer when hovering over chart segments
    const canvas = chart.canvas;
    if (activeElements && activeElements.length > 0) {
      canvas.style.cursor = 'pointer';
      
      // Add visual feedback by slightly scaling the hovered element
      const activeElement = activeElements[0];
      if (chart.config.type === 'pie' || chart.config.type === 'doughnut') {
        // For pie/doughnut charts, we can add a subtle hover effect
        chart.setActiveElements(activeElements);
        chart.update('none');
      }
    } else {
      canvas.style.cursor = 'default';
      chart.setActiveElements([]);
      chart.update('none');
    }
  }

  /**
   * Handle chart click interactions
   * @param {Event} event - Click event
   * @param {Array} activeElements - Active chart elements
   * @param {Chart} chart - Chart.js instance
   * @param {string} chartType - Type of chart (pie, bar, line, doughnut)
   */
  handleChartClick(event, activeElements, chart, chartType) {
    if (!activeElements || activeElements.length === 0) return;

    const activeElement = activeElements[0];
    const datasetIndex = activeElement.datasetIndex;
    const index = activeElement.index;
    
    // Get the clicked data
    const dataset = chart.data.datasets[datasetIndex];
    const label = chart.data.labels[index];
    const value = dataset.data[index];
    
    // Create click event data
    const clickData = {
      chartType,
      label,
      value,
      datasetIndex,
      index,
      dataset: dataset.label || 'Dataset',
      formattedValue: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value)
    };

    // For pie and doughnut charts, calculate percentage
    if (chartType === 'pie' || chartType === 'doughnut') {
      const total = dataset.data.reduce((sum, val) => sum + val, 0);
      clickData.percentage = ((value / total) * 100).toFixed(1);
    }

    // Dispatch custom event for other components to listen to
    const customEvent = new CustomEvent('chartSegmentClick', {
      detail: clickData,
      bubbles: true
    });
    
    chart.canvas.dispatchEvent(customEvent);

    // Optional: Log click for debugging
    console.log('Chart segment clicked:', clickData);

    // Visual feedback: briefly highlight the clicked segment
    this.highlightSegment(chart, activeElement, chartType);
  }

  /**
   * Provide visual feedback when a chart segment is clicked
   * @param {Chart} chart - Chart.js instance
   * @param {Object} activeElement - The clicked element
   * @param {string} chartType - Type of chart
   */
  highlightSegment(chart, activeElement, chartType) {
    const originalBorderWidth = chart.data.datasets[activeElement.datasetIndex].borderWidth;
    
    // Temporarily increase border width for visual feedback
    chart.data.datasets[activeElement.datasetIndex].borderWidth = 
      Array.isArray(originalBorderWidth) 
        ? originalBorderWidth.map((width, i) => i === activeElement.index ? width + 2 : width)
        : originalBorderWidth + 2;
    
    chart.update('none');
    
    // Reset after a short delay
    setTimeout(() => {
      chart.data.datasets[activeElement.datasetIndex].borderWidth = originalBorderWidth;
      chart.update('none');
    }, 200);
  }

  /**
   * Add keyboard navigation support to a chart
   * @param {Chart} chart - Chart.js instance
   */
  addKeyboardNavigation(chart) {
    const canvas = chart.canvas;
    
    // Guard against null canvas (e.g., in test environments)
    if (!canvas) return;
    
    // Make canvas focusable
    canvas.setAttribute('tabindex', '0');
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Interactive chart. Use arrow keys to navigate.');
    
    let currentIndex = 0;
    const maxIndex = chart.data.labels.length - 1;
    
    canvas.addEventListener('keydown', (event) => {
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          currentIndex = Math.min(currentIndex + 1, maxIndex);
          this.focusSegment(chart, currentIndex);
          break;
          
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          currentIndex = Math.max(currentIndex - 1, 0);
          this.focusSegment(chart, currentIndex);
          break;
          
        case 'Enter':
        case ' ':
          event.preventDefault();
          // Simulate click on focused segment
          const activeElements = [{
            datasetIndex: 0,
            index: currentIndex
          }];
          this.handleChartClick(event, activeElements, chart, chart.config.type);
          break;
      }
    });
    
    // Add focus/blur handlers
    canvas.addEventListener('focus', () => {
      canvas.style.outline = '2px solid #007bff';
      this.focusSegment(chart, currentIndex);
    });
    
    canvas.addEventListener('blur', () => {
      canvas.style.outline = 'none';
      chart.setActiveElements([]);
      chart.update('none');
    });
  }

  /**
   * Focus a specific segment for keyboard navigation
   * @param {Chart} chart - Chart.js instance
   * @param {number} index - Index of segment to focus
   */
  focusSegment(chart, index) {
    const activeElements = [{
      datasetIndex: 0,
      index: index
    }];
    
    chart.setActiveElements(activeElements);
    chart.update('none');
    
    // Announce to screen readers
    const label = chart.data.labels[index];
    const value = chart.data.datasets[0].data[index];
    const formattedValue = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
    
    let announcement = `${label}: ${formattedValue}`;
    
    // Add percentage for pie/doughnut charts
    if (chart.config.type === 'pie' || chart.config.type === 'doughnut') {
      const total = chart.data.datasets[0].data.reduce((sum, val) => sum + val, 0);
      const percentage = ((value / total) * 100).toFixed(1);
      announcement += ` (${percentage}%)`;
    }
    
    // Create temporary element for screen reader announcement
    const announcement_element = document.createElement('div');
    announcement_element.setAttribute('aria-live', 'polite');
    announcement_element.setAttribute('aria-atomic', 'true');
    announcement_element.style.position = 'absolute';
    announcement_element.style.left = '-10000px';
    announcement_element.textContent = announcement;
    
    document.body.appendChild(announcement_element);
    setTimeout(() => {
      document.body.removeChild(announcement_element);
    }, 1000);
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