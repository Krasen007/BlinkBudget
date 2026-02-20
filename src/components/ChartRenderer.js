/**
 * ChartRenderer Component
 *
 * Handles all chart creation, updates, and interactions using lazy-loaded Chart.js library.
 * Provides a consistent interface for rendering different chart types with
 * BlinkBudget's design system and accessibility features.
 *
 * Requirements: 9.2 - Lazy loading and performance optimization
 */

import {
  initializeChartJS,
  defaultChartOptions,
  getChartColors,
  createChartOptions,
  createThemedChartOptions,
} from '../core/chart-config.js';

export class ChartRenderer {
  constructor() {
    this.activeCharts = new Map(); // Track active chart instances for cleanup
    this.chartJSModules = null; // Cache for Chart.js modules
    this.isInitialized = false;
    this._initPromise = null;
  }

  /**
   * Initialize Chart.js if not already loaded
   * @returns {Promise<Object>} Chart.js modules
   */
  async ensureChartJSLoaded() {
    if (this.isInitialized && this.chartJSModules) {
      return this.chartJSModules;
    }

    // Return existing promise if initialization is in progress
    if (this._initPromise) {
      return this._initPromise;
    }

    try {
      this._initPromise = initializeChartJS();
      this.chartJSModules = await this._initPromise;
      this.isInitialized = true;

      return this.chartJSModules;
    } catch (error) {
      this._initPromise = null; // Allow retry on failure
      console.error('[ChartRenderer] Failed to initialize Chart.js:', error);

      // Enhanced error handling with specific error types
      let errorMessage = 'Chart rendering unavailable';
      if (error.message.includes('network')) {
        errorMessage = 'Network error loading chart library';
      } else if (error.message.includes('module')) {
        errorMessage = 'Chart library module loading failed';
      } else if (error.message.includes('browser')) {
        errorMessage = 'Browser compatibility issue with chart library';
      }

      throw new Error(`${errorMessage}: ${error.message}`, { cause: error });
    }
  }

  /**
   * Create a pie chart for category breakdowns with enhanced BlinkBudget styling
   * @param {HTMLCanvasElement} canvasElement - Canvas element to render chart
   * @param {Object} data - Chart data in Chart.js format
   * @param {Object} options - Custom chart options
   * @returns {Promise<Chart>} Chart.js instance
   */
  async createPieChart(canvasElement, data, options = {}) {
    const { ChartJS } = await this.ensureChartJSLoaded();
    const chartOptions = createThemedChartOptions('pie', {
      ...options,
      onHover: (event, activeElements, chart) => {
        this.handleChartHover(event, activeElements, chart);
      },
      onClick: (event, activeElements, chart) => {
        this.handleChartClick(event, activeElements, chart, 'pie');
      },
    });

    // Ensure data has proper colors with enhanced styling
    if (
      data.datasets &&
      data.datasets[0] &&
      !data.datasets[0].backgroundColor
    ) {
      const colors = getChartColors(data.labels.length, false, 'solid');
      data.datasets[0].backgroundColor = colors;
      data.datasets[0].borderColor = '#ffffff';
      data.datasets[0].borderWidth = 3;
      data.datasets[0].hoverBorderWidth = 4;
      data.datasets[0].hoverBorderColor = 'hsl(250, 84%, 60%)'; // Primary color

      // Add subtle hover effects
      data.datasets[0].hoverBackgroundColor = colors.map(color => {
        // Lighten colors on hover
        const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (hslMatch) {
          const [, h, s, l] = hslMatch.map(Number);
          return `hsl(${h}, ${s}%, ${Math.min(l + 10, 90)}%)`;
        }
        return color;
      });
    }

    try {
      const chart = new ChartJS(canvasElement, {
        type: 'pie',
        data,
        options: chartOptions,
      });

      // Add keyboard navigation for accessibility
      this.addKeyboardNavigation(chart);

      // Add chart title styling
      this.addChartTitle(canvasElement, options.title || 'Expense Breakdown');

      // Add entrance animation
      this.addEntranceAnimation(chart, 'pie');

      this.activeCharts.set(canvasElement.id, chart);
      return chart;
    } catch (error) {
      console.error('Failed to create chart:', error.message);
      return null;
    }
  }

  /**
   * Create a bar chart for comparisons with enhanced BlinkBudget styling
   * @param {HTMLCanvasElement} canvasElement - Canvas element to render chart
   * @param {Object} data - Chart data in Chart.js format
   * @param {Object} options - Custom chart options
   * @returns {Promise<Chart>} Chart.js instance
   */
  async createBarChart(canvasElement, data, options = {}) {
    const { ChartJS } = await this.ensureChartJSLoaded();
    const chartOptions = createThemedChartOptions('bar', {
      ...options,
      onHover: (event, activeElements, chart) => {
        this.handleChartHover(event, activeElements, chart);
      },
      onClick: (event, activeElements, chart) => {
        this.handleChartClick(event, activeElements, chart, 'bar');
      },
    });

    // Ensure data has proper colors with enhanced styling
    if (data.datasets) {
      data.datasets.forEach((dataset, _index) => {
        if (!dataset.backgroundColor) {
          const colors = getChartColors(data.labels.length, false, 'solid');
          dataset.backgroundColor = colors;
          dataset.borderColor = colors.map(color => {
            // Darken border colors slightly
            const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
            if (hslMatch) {
              const [, h, s, l] = hslMatch.map(Number);
              return `hsl(${h}, ${s}%, ${Math.max(l - 15, 10)}%)`;
            }
            return color;
          });
          dataset.borderWidth = 2;
          dataset.borderRadius = 8; // Rounded corners
          dataset.borderSkipped = false;

          // Enhanced hover effects
          dataset.hoverBackgroundColor = colors.map(color => {
            const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
            if (hslMatch) {
              const [, h, s, l] = hslMatch.map(Number);
              return `hsl(${h}, ${s}%, ${Math.min(l + 8, 85)}%)`;
            }
            return color;
          });
          dataset.hoverBorderWidth = 3;
        }
      });
    }

    try {
      const chart = new ChartJS(canvasElement, {
        type: 'bar',
        data,
        options: chartOptions,
      });

      // Add keyboard navigation for accessibility
      this.addKeyboardNavigation(chart);

      // Add chart title styling (only if title is explicitly provided, not default)
      if (options.title !== undefined) {
        this.addChartTitle(canvasElement, options.title);
      }

      // Add entrance animation
      this.addEntranceAnimation(chart, 'bar');

      this.activeCharts.set(canvasElement.id, chart);
      return chart;
    } catch (error) {
      console.error('Failed to create chart:', error.message);
      return null;
    }
  }

  /**
   * Create a line chart for trends over time
   * @param {HTMLCanvasElement} canvasElement - Canvas element to render chart
   * @param {Object} data - Chart data in Chart.js format
   * @param {Object} options - Custom chart options
   * @returns {Promise<Chart>} Chart.js instance
   */
  async createLineChart(canvasElement, data, options = {}) {
    const { ChartJS } = await this.ensureChartJSLoaded();
    const chartOptions = createChartOptions({
      ...options,
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
          },
          ticks: {
            callback: function (value) {
              return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
              }).format(value);
            },
          },
        },
        x: {
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
          },
        },
      },
      elements: {
        line: {
          tension: 0.4, // Smooth curves
        },
        point: {
          radius: 4,
          hoverRadius: 6,
        },
      },
      plugins: {
        ...options.plugins,
        tooltip: {
          ...defaultChartOptions().plugins.tooltip,
          callbacks: {
            label: context => {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              const formattedValue = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(value);

              return `${label}: ${formattedValue}`;
            },
          },
        },
      },
      onHover: (event, activeElements, chart) => {
        this.handleChartHover(event, activeElements, chart);
      },
      onClick: (event, activeElements, chart) => {
        this.handleChartClick(event, activeElements, chart, 'line');
      },
    });

    // Ensure data has proper colors and styling
    if (data.datasets) {
      data.datasets.forEach((dataset, _index) => {
        const colors = getChartColors(data.datasets.length);
        if (!dataset.borderColor) {
          dataset.borderColor = colors[_index];
          // Convert to HSLA with alpha, handling HSL format
          const color = colors[_index];
          if (color.startsWith('hsl(')) {
            dataset.backgroundColor = color
              .replace('hsl(', 'hsla(')
              .replace(')', ', 0.1)');
          } else {
            // Fallback for other formats - use transparent version or keep original
            dataset.backgroundColor = 'transparent';
          }
          dataset.borderWidth = 3;
          dataset.fill = false;
        }
      });
    }

    try {
      const chart = new ChartJS(canvasElement, {
        type: 'line',
        data,
        options: chartOptions,
      });

      // Add keyboard navigation for accessibility
      this.addKeyboardNavigation(chart);

      this.activeCharts.set(canvasElement.id, chart);
      return chart;
    } catch (error) {
      console.error('Failed to create chart:', error.message);
      return null;
    }
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

      // Clean up keyboard event handlers
      if (canvas._keyboardHandlers) {
        canvas.removeEventListener('keydown', canvas._keyboardHandlers.keydown);
        canvas.removeEventListener('focus', canvas._keyboardHandlers.focus);
        canvas.removeEventListener('blur', canvas._keyboardHandlers.blur);

        // Remove description element
        if (canvas._keyboardHandlers.descriptionElement) {
          canvas._keyboardHandlers.descriptionElement.remove();
        }

        delete canvas._keyboardHandlers;
      }

      // Clean up touch event handlers
      if (canvas._touchHandlers) {
        canvas.removeEventListener(
          'touchstart',
          canvas._touchHandlers.touchstart
        );
        canvas.removeEventListener(
          'touchmove',
          canvas._touchHandlers.touchmove
        );
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
   * Add touch-specific optimizations for mobile devices
   * @param {Chart} chartInstance - Chart.js instance
   */
  addTouchOptimizations(chartInstance) {
    const canvas = chartInstance.canvas;
    if (!canvas) return;

    // Allow scrolling while preventing zoom and other gestures that interfere with chart interaction
    canvas.style.touchAction = 'pan-y';

    // Add touch feedback
    let touchStartTime = 0;
    let touchMoved = false;

    const touchStartHandler = _event => {
      touchStartTime = Date.now();
      touchMoved = false;

      // Add visual feedback for touch
      canvas.style.opacity = '0.9';
    };

    const touchMoveHandler = _event => {
      touchMoved = true;
      canvas.style.opacity = '1';

      // Clear tooltips immediately when scrolling/moving interaction starts
      if (chartInstance) {
        chartInstance.setActiveElements([]);
        chartInstance.update('none');
      }
    };

    const touchEndHandler = event => {
      const touchDuration = Date.now() - touchStartTime;
      canvas.style.opacity = '1';

      // Only trigger chart interaction for quick taps (not scrolls)
      if (!touchMoved && touchDuration < 300) {
        // Get touch position relative to canvas
        const touch = event.changedTouches[0];

        // Create synthetic mouse event for Chart.js
        const syntheticEvent = {
          type: 'click',
          clientX: touch.clientX,
          clientY: touch.clientY,
          target: canvas,
          preventDefault: () => { },
          stopPropagation: () => { },
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
            chartInstance.options.onClick(
              syntheticEvent,
              elements,
              chartInstance
            );
          }
        }
      }
    };

    // Add touch event listeners
    // Remove existing handlers first to prevent duplicates
    if (canvas._touchHandlers) {
      canvas.removeEventListener(
        'touchstart',
        canvas._touchHandlers.touchstart
      );
      canvas.removeEventListener('touchmove', canvas._touchHandlers.touchmove);
      canvas.removeEventListener('touchend', canvas._touchHandlers.touchend);
    }

    canvas.addEventListener('touchstart', touchStartHandler, { passive: true });
    canvas.addEventListener('touchmove', touchMoveHandler, { passive: true });
    canvas.addEventListener('touchend', touchEndHandler, { passive: true });

    // Store handlers for cleanup
    canvas._touchHandlers = {
      touchstart: touchStartHandler,
      touchmove: touchMoveHandler,
      touchend: touchEndHandler,
    };
  }

  /**
   * Handle chart hover interactions with simplified micro-interactions
   * @param {Event} event - Mouse event
   * @param {Array} activeElements - Active chart elements
   * @param {Chart} chart - Chart.js instance
   */
  handleChartHover(event, activeElements, chart) {
    const canvas = chart.canvas;

    if (activeElements && activeElements.length > 0) {
      // Change cursor
      canvas.style.cursor = 'pointer';
    } else {
      canvas.style.cursor = 'default';
    }

    // Simplified canvas hover animation
    this.addSimpleCanvasHoverAnimation(canvas, activeElements.length > 0);
  }

  /**
   * Handle chart click interactions with enhanced feedback animations
   * @param {Event} event - Click event
   * @param {Array} activeElements - Active chart elements
   * @param {Chart} chart - Chart.js instance
   * @param {string} chartType - Type of chart (pie, bar, line)
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
        currency: 'USD',
      }).format(value),
    };

    // For pie charts, calculate percentage
    if (chartType === 'pie') {
      const total = dataset.data.reduce((sum, val) => sum + val, 0);
      clickData.percentage = ((value / total) * 100).toFixed(1);
    }

    // Add enhanced click animations
    this.addClickAnimation(chart, activeElement, chartType);

    // Add haptic feedback for mobile devices
    this.addHapticFeedback();

    // Dispatch custom event for other components to listen to
    const customEvent = new CustomEvent('chartSegmentClick', {
      detail: clickData,
      bubbles: true,
    });

    chart.canvas.dispatchEvent(customEvent);
  }

  /**
   * Add simplified click animation with subtle effects
   * @param {Chart} chart - Chart.js instance
   * @param {Object} activeElement - The clicked element
   * @param {string} chartType - Type of chart
   */
  addClickAnimation(chart, activeElement, chartType) {
    const canvas = chart.canvas;

    // Simple pulse animation for the entire canvas
    canvas.style.transform = 'scale(0.99)';
    canvas.style.transition = 'transform 0.1s ease-out';

    setTimeout(() => {
      canvas.style.transform = 'scale(1)';
      canvas.style.transition = 'transform 0.15s ease-out';
    }, 100);

    // Simplified chart-specific animations
    if (chartType === 'pie') {
      this.addSimplePieClickAnimation(chart, activeElement);
    }
  }

  /**
   * Add simplified pie chart click animation
   * @param {Chart} chart - Chart.js instance
   * @param {Object} activeElement - The clicked element
   */
  addSimplePieClickAnimation(chart, activeElement) {
    const dataset = chart.data.datasets[activeElement.datasetIndex];
    const originalOffset = dataset.hoverOffset || 0;

    // Brief segment separation
    dataset.hoverOffset = 10;
    chart.update('active');

    setTimeout(() => {
      dataset.hoverOffset = originalOffset;
      chart.update('active');
    }, 200);
  }

  /**
   * Add simplified canvas hover animation
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {boolean} isHovering - Whether currently hovering
   */
  addSimpleCanvasHoverAnimation(canvas, isHovering) {
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return; // Skip animations for users who prefer reduced motion
    }

    if (isHovering) {
      canvas.style.opacity = '0.95';
      canvas.style.transition = 'opacity 0.2s ease-out';
    } else {
      canvas.style.opacity = '1';
      canvas.style.transition = 'opacity 0.2s ease-out';
    }
  }

  /**
   * Add haptic feedback for mobile devices
   */
  addHapticFeedback() {
    // Haptic feedback disabled
  }

  /**
   * Provide visual feedback when a chart segment is clicked (legacy method, enhanced)
   * @param {Chart} chart - Chart.js instance
   * @param {Object} activeElement - The clicked element
   * @param {string} chartType - Type of chart
   */
  highlightSegment(chart, activeElement, _chartType) {
    const originalBorderWidth =
      chart.data.datasets[activeElement.datasetIndex].borderWidth;

    // Temporarily increase border width for visual feedback
    chart.data.datasets[activeElement.datasetIndex].borderWidth = Array.isArray(
      originalBorderWidth
    )
      ? originalBorderWidth.map((width, i) =>
        i === activeElement.index ? width + 2 : width
      )
      : originalBorderWidth + 2;

    chart.update('none');

    // Reset after a short delay
    setTimeout(() => {
      chart.data.datasets[activeElement.datasetIndex].borderWidth =
        originalBorderWidth;
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
    const keydownHandler = event => {
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
          {
            const activeElements = [
              {
                datasetIndex: 0,
                index: currentIndex,
              },
            ];
            this.handleChartClick(
              event,
              activeElements,
              chart,
              chart.config.type
            );
          }
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
      canvas.style.outline = 'none';
      canvas.style.outlineOffset = '0px';
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
      descriptionElement: descElement,
    };
  }

  /**
   * Focus a specific segment for keyboard navigation
   * @param {Chart} chart - Chart.js instance
   * @param {number} index - Index of segment to focus
   */
  focusSegment(chart, index) {
    const activeElements = [
      {
        datasetIndex: 0,
        index: index,
      },
    ];

    chart.setActiveElements(activeElements);
    chart.update('none');

    // Announce to screen readers with enhanced information
    const label = chart.data.labels[index];
    const value = chart.data.datasets[0].data[index];
    const formattedValue = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);

    let announcement = `${label}: ${formattedValue}`;

    // Add percentage for pie charts
    if (chart.config.type === 'pie') {
      const total = chart.data.datasets[0].data.reduce(
        (sum, val) => sum + val,
        0
      );
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
    if (chartType === 'pie') {
      const total = dataset.data.reduce((sum, val) => sum + val, 0);
      description += `spending breakdown across ${labels.length} categories. `;

      // Add top categories
      const sortedData = labels
        .map((label, index) => ({
          label,
          value: dataset.data[index],
          percentage: ((dataset.data[index] / total) * 100).toFixed(1),
        }))
        .sort((a, b) => b.value - a.value);

      description += `Top categories: `;
      sortedData.slice(0, 3).forEach((item, index) => {
        if (index > 0) description += ', ';
        description += `${item.label} at ${item.percentage}%`;
      });
    } else if (chartType === 'bar') {
      description += `comparison across ${labels.length} categories. `;
      const maxValue = Math.max(...dataset.data);
      const maxIndex = dataset.data.indexOf(maxValue);
      description += `Highest value is ${labels[maxIndex]} at ${new Intl.NumberFormat(
        'en-US',
        {
          style: 'currency',
          currency: 'USD',
        }
      ).format(maxValue)}.`;
    } else if (chartType === 'line') {
      description += `trends over ${labels.length} time periods. `;
      const firstValue = dataset.data[0];
      const lastValue = dataset.data[dataset.data.length - 1];
      const trend =
        lastValue > firstValue
          ? 'increasing'
          : lastValue < firstValue
            ? 'decreasing'
            : 'stable';
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
   * Add styled chart title above the canvas
   * @param {HTMLCanvasElement} canvasElement - Canvas element
   * @param {string} title - Chart title
   */
  addChartTitle(canvasElement, title) {
    // Skip if no title provided or canvas has no parent
    if (!title || !canvasElement.parentElement) return;

    // Check if title already exists
    const existingTitle =
      canvasElement.parentElement.querySelector('.chart-title');
    if (existingTitle) {
      existingTitle.textContent = title;
      return;
    }

    const titleElement = document.createElement('h3');
    titleElement.className = 'chart-title';
    titleElement.textContent = title;
    titleElement.setAttribute('id', `chart-title-${canvasElement.id}`);
    titleElement.style.marginTop = '0';
    titleElement.style.marginBottom = 'var(--spacing-md)';

    // Insert title before canvas
    canvasElement.parentElement.insertBefore(titleElement, canvasElement);

    // Update canvas aria-labelledby
    canvasElement.setAttribute('aria-labelledby', titleElement.id);
  }

  /**
   * Add simplified loading animation to chart container
   * @param {HTMLElement} container - Chart container element
   * @param {string} message - Loading message
   */
  addLoadingAnimation(container, _message = 'Loading chart...') {
    if (!container) return;

    // Add loading class for CSS animations
    container.classList.add('loading');

    return null; // Simplified - no overlay needed
  }

  /**
   * Remove loading animation from chart container
   * @param {HTMLElement} container - Chart container element
   */
  removeLoadingAnimation(container) {
    if (!container) return;

    container.classList.remove('loading');
  }

  /**
   * Add simplified entrance animation to newly created charts
   * @param {Chart} chart - Chart.js instance
   * @param {string} chartType - Type of chart
   */
  addEntranceAnimation(chart, chartType) {
    if (!chart.canvas) return;

    const canvas = chart.canvas;
    const container = canvas.parentElement;

    // Set chart type data attribute for CSS animations
    if (container) {
      container.setAttribute('data-chart-type', chartType);
    }
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
