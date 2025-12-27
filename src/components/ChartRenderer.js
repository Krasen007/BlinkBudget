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

    if (chart && chart.canvas) {
      const canvas = chart.canvas;
      
      // Clean up keyboard navigation handlers and accessibility elements
      if (canvas._keyboardHandlers) {
        canvas.removeEventListener('keydown', canvas._keyboardHandlers.keydown);
        canvas.removeEventListener('focus', canvas._keyboardHandlers.focus);
        canvas.removeEventListener('blur', canvas._keyboardHandlers.blur);
        
        // Remove description element
        if (canvas._keyboardHandlers.descriptionElement) {
          document.body.removeChild(canvas._keyboardHandlers.descriptionElement);
        }
        
        delete canvas._keyboardHandlers;
      }
      
      // Clean up touch event handlers
      if (canvas._touchHandlers) {
        canvas.removeEventListener('touchstart', canvas._touchHandlers.touchstart);
        canvas.removeEventListener('touchmove', canvas._touchHandlers.touchmove);
        canvas.removeEventListener('touchend', canvas._touchHandlers.touchend);
        delete canvas._touchHandlers;
      }
      
      // Remove accessibility attributes
      canvas.removeAttribute('aria-describedby');
      canvas.removeAttribute('aria-label');
      canvas.removeAttribute('role');
      canvas.removeAttribute('tabindex');
      
      // Reset touch styles
      canvas.style.touchAction = '';
      canvas.style.opacity = '';
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
    const isSmallMobile = window.innerWidth < 480;
    const isLandscape = window.innerHeight < window.innerWidth;
    const isShortLandscape = isLandscape && window.innerHeight < 500;
    
    if (isMobile) {
      // Mobile-specific chart options
      const mobileOptions = {
        // Reduce legend padding on mobile
        plugins: {
          legend: {
            position: isShortLandscape ? 'right' : 'bottom',
            labels: {
              padding: isSmallMobile ? 8 : 12,
              font: {
                size: isSmallMobile ? 10 : 11
              },
              boxWidth: isSmallMobile ? 12 : 15,
              boxHeight: isSmallMobile ? 12 : 15,
              usePointStyle: true
            }
          },
          tooltip: {
            // Larger tooltips for touch interaction
            padding: 16,
            titleFont: {
              size: 14
            },
            bodyFont: {
              size: 13
            },
            cornerRadius: 8,
            caretSize: 8,
            // Position tooltips to avoid screen edges
            position: 'nearest',
            xAlign: 'center',
            yAlign: 'top'
          }
        },
        
        // Optimize animations for mobile performance
        animation: {
          duration: isSmallMobile ? 300 : 400 // Faster animations on slower devices
        },
        
        // Enhanced interaction for touch
        interaction: {
          intersect: false,
          mode: 'index'
        },
        
        // Mobile-specific scales
        scales: chartInstance.config.type !== 'pie' && chartInstance.config.type !== 'doughnut' ? {
          x: {
            ticks: {
              font: {
                size: isSmallMobile ? 10 : 11
              },
              maxRotation: isSmallMobile ? 45 : 30,
              minRotation: 0,
              // Reduce number of ticks on small screens
              maxTicksLimit: isSmallMobile ? 5 : 8
            }
          },
          y: {
            ticks: {
              font: {
                size: isSmallMobile ? 10 : 11
              },
              // Shorter number formatting on mobile
              callback: function(value) {
                if (value >= 1000000) {
                  return '$' + (value / 1000000).toFixed(1) + 'M';
                } else if (value >= 1000) {
                  return '$' + (value / 1000).toFixed(1) + 'K';
                } else {
                  return '$' + value.toFixed(0);
                }
              }
            }
          }
        } : undefined
      };
      
      // Apply mobile optimizations
      Object.assign(chartInstance.options.plugins.legend, mobileOptions.plugins.legend);
      Object.assign(chartInstance.options.plugins.tooltip, mobileOptions.plugins.tooltip);
      chartInstance.options.animation.duration = mobileOptions.animation.duration;
      chartInstance.options.interaction = mobileOptions.interaction;
      
      if (mobileOptions.scales) {
        Object.assign(chartInstance.options.scales, mobileOptions.scales);
      }
      
      // Update the chart with mobile optimizations
      chartInstance.update('none'); // No animation for performance
      
      // Add touch-specific event handlers
      this.addTouchOptimizations(chartInstance);
    }
  }

  /**
   * Add touch-specific optimizations for mobile devices
   * @param {Chart} chartInstance - Chart.js instance
   */
  addTouchOptimizations(chartInstance) {
    const canvas = chartInstance.canvas;
    if (!canvas) return;

    // Prevent default touch behaviors that interfere with chart interaction
    canvas.style.touchAction = 'manipulation';
    
    // Add touch feedback
    let touchStartTime = 0;
    let touchMoved = false;
    
    const touchStartHandler = (event) => {
      touchStartTime = Date.now();
      touchMoved = false;
      
      // Add visual feedback for touch
      canvas.style.opacity = '0.9';
    };
    
    const touchMoveHandler = (event) => {
      touchMoved = true;
      canvas.style.opacity = '1';
    };
    
    const touchEndHandler = (event) => {
      const touchDuration = Date.now() - touchStartTime;
      canvas.style.opacity = '1';
      
      // Only trigger chart interaction for quick taps (not scrolls)
      if (!touchMoved && touchDuration < 300) {
        // Get touch position relative to canvas
        const rect = canvas.getBoundingClientRect();
        const touch = event.changedTouches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        // Create synthetic mouse event for Chart.js
        const syntheticEvent = {
          type: 'click',
          clientX: touch.clientX,
          clientY: touch.clientY,
          target: canvas,
          preventDefault: () => {},
          stopPropagation: () => {}
        };
        
        // Get elements at touch position
        const elements = chartInstance.getElementsAtEventForMode(
          syntheticEvent, 
          'nearest', 
          { intersect: true }, 
          false
        );
        
        if (elements.length > 0) {
          // Trigger click handler
          if (chartInstance.options.onClick) {
            chartInstance.options.onClick(syntheticEvent, elements, chartInstance);
          }
        }
      }
    };
    
    // Add touch event listeners
    canvas.addEventListener('touchstart', touchStartHandler, { passive: true });
    canvas.addEventListener('touchmove', touchMoveHandler, { passive: true });
    canvas.addEventListener('touchend', touchEndHandler, { passive: true });
    
    // Store handlers for cleanup
    if (!canvas._touchHandlers) {
      canvas._touchHandlers = {
        touchstart: touchStartHandler,
        touchmove: touchMoveHandler,
        touchend: touchEndHandler
      };
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
    
    // Make canvas focusable and add accessibility attributes
    canvas.setAttribute('tabindex', '0');
    canvas.setAttribute('role', 'img');
    
    // Generate comprehensive aria-label based on chart data
    const ariaLabel = this.generateChartAriaLabel(chart);
    canvas.setAttribute('aria-label', ariaLabel);
    
    // Add detailed description for screen readers
    const description = this.generateChartDescription(chart);
    const descriptionId = `chart-desc-${Date.now()}`;
    
    // Create description element
    const descElement = document.createElement('div');
    descElement.id = descriptionId;
    descElement.className = 'sr-only';
    descElement.textContent = description;
    document.body.appendChild(descElement);
    
    canvas.setAttribute('aria-describedby', descriptionId);
    
    let currentIndex = 0;
    const maxIndex = chart.data.labels.length - 1;
    
    // Enhanced keyboard event handling
    const keydownHandler = (event) => {
      let handled = false;
      
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          currentIndex = Math.min(currentIndex + 1, maxIndex);
          this.focusSegment(chart, currentIndex);
          handled = true;
          break;
          
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          currentIndex = Math.max(currentIndex - 1, 0);
          this.focusSegment(chart, currentIndex);
          handled = true;
          break;
          
        case 'Home':
          event.preventDefault();
          currentIndex = 0;
          this.focusSegment(chart, currentIndex);
          handled = true;
          break;
          
        case 'End':
          event.preventDefault();
          currentIndex = maxIndex;
          this.focusSegment(chart, currentIndex);
          handled = true;
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
          handled = true;
          break;
          
        case 'Escape':
          event.preventDefault();
          canvas.blur();
          handled = true;
          break;
      }
      
      if (handled) {
        // Announce keyboard navigation instructions
        this.announceKeyboardInstructions(chart, currentIndex);
      }
    };
    
    canvas.addEventListener('keydown', keydownHandler);
    
    // Enhanced focus/blur handlers
    const focusHandler = () => {
      canvas.style.outline = '3px solid var(--color-primary)';
      canvas.style.outlineOffset = '2px';
      this.focusSegment(chart, currentIndex);
      
      // Announce chart entry
      this.announceChartEntry(chart);
    };
    
    const blurHandler = () => {
      canvas.style.outline = 'none';
      canvas.style.outlineOffset = '0';
      chart.setActiveElements([]);
      chart.update('none');
    };
    
    canvas.addEventListener('focus', focusHandler);
    canvas.addEventListener('blur', blurHandler);
    
    // Store event handlers for cleanup
    canvas._keyboardHandlers = {
      keydown: keydownHandler,
      focus: focusHandler,
      blur: blurHandler,
      descriptionElement: descElement
    };
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
    
    // Announce to screen readers with enhanced information
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
      announcement += ` (${percentage}% of total)`;
    }
    
    // Add position information
    const totalItems = chart.data.labels.length;
    announcement += `. Item ${index + 1} of ${totalItems}`;
    
    // Create temporary element for screen reader announcement
    this.announceToScreenReader(announcement, 'polite');
  }

  /**
   * Generate comprehensive ARIA label for chart
   * @param {Chart} chart - Chart.js instance
   * @returns {string} ARIA label text
   */
  generateChartAriaLabel(chart) {
    const chartType = chart.config.type;
    const datasetCount = chart.data.datasets.length;
    const itemCount = chart.data.labels.length;
    
    let label = `${chartType} chart with ${itemCount} data point${itemCount !== 1 ? 's' : ''}`;
    
    if (datasetCount > 1) {
      label += ` across ${datasetCount} datasets`;
    }
    
    label += '. Use arrow keys to navigate, Enter to select, Escape to exit.';
    
    return label;
  }

  /**
   * Generate detailed description for screen readers
   * @param {Chart} chart - Chart.js instance
   * @returns {string} Detailed description
   */
  generateChartDescription(chart) {
    const chartType = chart.config.type;
    const labels = chart.data.labels;
    const dataset = chart.data.datasets[0];
    
    if (!dataset || !labels) return 'Chart data unavailable';
    
    let description = `This ${chartType} chart shows `;
    
    // Add summary based on chart type
    if (chartType === 'pie' || chartType === 'doughnut') {
      const total = dataset.data.reduce((sum, val) => sum + val, 0);
      description += `spending breakdown across ${labels.length} categories. `;
      
      // Add top categories
      const sortedData = labels.map((label, index) => ({
        label,
        value: dataset.data[index],
        percentage: ((dataset.data[index] / total) * 100).toFixed(1)
      })).sort((a, b) => b.value - a.value);
      
      description += `Top categories: `;
      sortedData.slice(0, 3).forEach((item, index) => {
        if (index > 0) description += ', ';
        description += `${item.label} at ${item.percentage}%`;
      });
      
    } else if (chartType === 'bar') {
      description += `comparison across ${labels.length} categories. `;
      const maxValue = Math.max(...dataset.data);
      const maxIndex = dataset.data.indexOf(maxValue);
      description += `Highest value is ${labels[maxIndex]} at ${new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(maxValue)}.`;
      
    } else if (chartType === 'line') {
      description += `trends over ${labels.length} time periods. `;
      const firstValue = dataset.data[0];
      const lastValue = dataset.data[dataset.data.length - 1];
      const trend = lastValue > firstValue ? 'increasing' : lastValue < firstValue ? 'decreasing' : 'stable';
      description += `Overall trend is ${trend}.`;
    }
    
    return description;
  }

  /**
   * Announce chart entry to screen readers
   * @param {Chart} chart - Chart.js instance
   */
  announceChartEntry(chart) {
    const announcement = `Entered ${chart.config.type} chart. Use arrow keys to navigate between data points, Enter to select, Escape to exit.`;
    this.announceToScreenReader(announcement, 'polite');
  }

  /**
   * Announce keyboard navigation instructions
   * @param {Chart} chart - Chart.js instance
   * @param {number} currentIndex - Current focused index
   */
  announceKeyboardInstructions(chart, currentIndex) {
    const totalItems = chart.data.labels.length;
    const announcement = `Navigating chart. Currently on item ${currentIndex + 1} of ${totalItems}. Use arrow keys to move, Enter to select.`;
    this.announceToScreenReader(announcement, 'polite');
  }

  /**
   * Announce text to screen readers using ARIA live regions
   * @param {string} text - Text to announce
   * @param {string} priority - 'polite' or 'assertive'
   */
  announceToScreenReader(text, priority = 'polite') {
    const liveRegionId = `chart-live-region-${priority}`;
    let liveRegion = document.getElementById(liveRegionId);
    
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = liveRegionId;
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
    }
    
    // Clear and set new text
    liveRegion.textContent = '';
    setTimeout(() => {
      liveRegion.textContent = text;
    }, 100);
  }

  /**
   * Clean up all active charts and accessibility elements
   * Call this when navigating away from reports view
   */
  destroyAllCharts() {
    for (const chart of this.activeCharts.values()) {
      this.destroyChart(chart);
    }
    this.activeCharts.clear();
    
    // Clean up any remaining ARIA live regions
    const liveRegions = document.querySelectorAll('[id^="chart-live-region"]');
    liveRegions.forEach(region => {
      if (region.parentNode) {
        region.parentNode.removeChild(region);
      }
    });
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