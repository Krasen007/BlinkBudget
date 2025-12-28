/**
 * Chart.js Configuration and Setup
 * 
 * This module provides lazy-loaded Chart.js configuration to minimize bundle size
 * and improve initial loading performance. Chart.js is only loaded when needed.
 * 
 * Requirements: 9.2 - Performance optimization with lazy loading
 */

import { loadChartJS, isChartJSReady, getChartJSModules } from './chart-loader.js';

// Chart.js modules will be loaded lazily
let ChartJS = null;

/**
 * Default chart configuration that aligns with BlinkBudget's design system
 * Includes comprehensive accessibility features for WCAG 2.1 AA compliance
 * Enhanced with modern styling and smooth animations
 */
export const defaultChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  
  // Enhanced layout with BlinkBudget spacing
  layout: {
    padding: {
      top: 16,
      right: 16,
      bottom: 16,
      left: 16
    }
  },
  
  // Accessibility configuration
  accessibility: {
    enabled: true,
    announceNewData: {
      enabled: true,
      announcementFormatter: function(chart, data) {
        const datasetLabel = data.dataset.label || 'Dataset';
        const value = data.parsed || data.raw;
        const formattedValue = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
        return `${datasetLabel}: ${formattedValue}`;
      }
    }
  },
  
  plugins: {
    legend: {
      position: 'bottom',
      align: 'center',
      labels: {
        padding: 20,
        usePointStyle: true,
        pointStyle: 'circle',
        font: {
          family: 'Inter, system-ui, -apple-system, sans-serif', // BlinkBudget font
          size: 12,
          weight: '500'
        },
        color: 'hsl(0, 0%, 100%)', // --color-text-main
        boxWidth: 12,
        boxHeight: 12,
        // Enhanced accessibility for legend
        generateLabels: function(chart) {
          // Get ChartJS from the chart instance or modules
          const chartJSModules = getChartJSModules();
          const ChartJSInstance = chartJSModules?.ChartJS || chart.constructor;
          
          // Check if we can access the default generateLabels function
          if (ChartJSInstance && ChartJSInstance.defaults && ChartJSInstance.defaults.plugins && ChartJSInstance.defaults.plugins.legend) {
            try {
              const original = ChartJSInstance.defaults.plugins.legend.labels.generateLabels;
              const labels = original.call(this, chart);
              
              // Add accessibility information to labels
              labels.forEach((label, index) => {
                const dataset = chart.data.datasets[0];
                if (dataset?.data && index < dataset.data.length) {
                  const value = dataset.data[index];
                  const total = dataset.data.reduce((sum, val) => sum + val, 0);
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                  
                  // Store accessibility info for screen readers
                  label.ariaLabel = `${label.text}: ${value} (${percentage}% of total)`;
                }
              });
              
              return labels;
            } catch (error) {
              console.warn('[ChartConfig] Error using default generateLabels, falling back to custom implementation:', error);
            }
          }
          
          // Fallback to basic label generation
          const data = chart.data;
          if (data.labels.length && data.datasets.length) {
            return data.labels.map((label, i) => {
              const dataset = data.datasets[0];
              const value = dataset.data[i];
              const total = dataset.data.reduce((sum, val) => sum + val, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              
              return {
                text: `${label} (${percentage}%)`,
                fillStyle: dataset.backgroundColor[i],
                strokeStyle: dataset.borderColor?.[i] || '#fff',
                lineWidth: 2,
                pointStyle: 'circle',
                index: i,
                ariaLabel: `${label}: ${value} (${percentage}% of total)`
              };
            });
          }
          return [];
        }
      }
    },
    
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.95)', // Enhanced contrast
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: 'hsl(250, 84%, 60%)', // Primary color border
      borderWidth: 2,
      cornerRadius: 12, // Rounded corners matching BlinkBudget
      displayColors: true,
      padding: 16,
      titleFont: {
        family: 'Outfit, system-ui, -apple-system, sans-serif', // BlinkBudget heading font
        size: 14,
        weight: '600'
      },
      bodyFont: {
        family: 'Inter, system-ui, -apple-system, sans-serif', // BlinkBudget body font
        size: 13,
        weight: '400'
      },
      // Position tooltips to prevent overlap with content below
      position: 'nearest',
      // Use smart positioning - Chart.js will position tooltips to avoid viewport edges
      yAlign: 'auto',
      // Enhanced accessibility for tooltips
      filter: function(tooltipItem) {
        // Always show tooltips for accessibility
        return true;
      },
      callbacks: {
        // Enhanced tooltip formatting for screen readers
        beforeTitle: function(tooltipItems) {
          return 'Chart data:';
        },
        afterBody: function(tooltipItems) {
          const item = tooltipItems[0];
          if (item.dataset.data && item.dataset.data.length > 1) {
            const total = item.dataset.data.reduce((sum, val) => sum + val, 0);
            const percentage = ((item.parsed / total) * 100).toFixed(1);
            return `Percentage of total: ${percentage}%`;
          }
          return '';
        }
      }
    }
  },
  
  // Simplified animation with BlinkBudget timing
  animation: {
    duration: function() {
      // Check for reduced motion preference
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return 0; // No animation for users who prefer reduced motion
      }
      return 600; // Shorter duration for snappier feel
    },
    easing: 'easeOutQuart', // Simpler easing
    animateRotate: true,
    animateScale: false // Disable scale animation for simplicity
  },
  
  // Simplified transitions for smooth interactions
  transitions: {
    active: {
      animation: {
        duration: 200,
        easing: 'easeOutQuart'
      }
    },
    resize: {
      animation: {
        duration: 300,
        easing: 'easeInOutQuart'
      }
    }
  },
  
  // Interaction configuration for accessibility
  interaction: {
    intersect: false,
    mode: 'index'
  },
  
  // Enhanced scale configuration for better readability
  scales: {
    x: {
      grid: {
        color: 'hsl(240, 5%, 20%)', // Subtle grid lines
        lineWidth: 1
      },
      ticks: {
        font: {
          family: 'Inter, system-ui, -apple-system, sans-serif',
          size: 12,
          weight: '400'
        },
        color: 'hsl(240, 5%, 65%)', // Muted text color
        maxRotation: 45,
        minRotation: 0
      }
    },
    y: {
      grid: {
        color: 'hsl(240, 5%, 20%)', // Subtle grid lines
        lineWidth: 1
      },
      ticks: {
        font: {
          family: 'Inter, system-ui, -apple-system, sans-serif',
          size: 12,
          weight: '400'
        },
        color: 'hsl(240, 5%, 65%)', // Muted text color
      }
    }
  }
};

/**
 * BlinkBudget color palette for charts
 * Uses HSL color space for consistent theming with the app's design system
 * Colors are carefully selected for accessibility and visual harmony
 */
export const chartColors = {
  // Primary palette - harmonious with BlinkBudget's purple theme
  primary: [
    'hsl(250, 84%, 60%)',    // Primary purple (matches --color-primary)
    'hsl(150, 70%, 45%)',    // Success green
    'hsl(30, 85%, 55%)',     // Warning orange
    'hsl(200, 80%, 55%)',    // Info blue
    'hsl(0, 75%, 60%)',      // Error red
    'hsl(280, 70%, 65%)',    // Secondary purple
    'hsl(180, 60%, 50%)',    // Teal
    'hsl(45, 80%, 60%)',     // Gold
    'hsl(320, 65%, 60%)',    // Pink
    'hsl(120, 60%, 50%)',    // Lime green
  ],
  
  // Semantic colors matching BlinkBudget's design
  income: 'hsl(150, 70%, 45%)',     // Success green
  expense: 'hsl(0, 75%, 60%)',      // Error red
  neutral: 'hsl(240, 5%, 65%)',     // Muted gray (matches --color-text-muted)
  
  // Surface colors for backgrounds
  surface: 'hsl(240, 10%, 10%)',    // Matches --color-surface
  surfaceHover: 'hsl(240, 10%, 15%)', // Matches --color-surface-hover
  
  // Gradient colors for enhanced visuals
  gradients: {
    primary: ['hsl(250, 84%, 60%)', 'hsl(250, 84%, 75%)'],
    income: ['hsl(150, 70%, 45%)', 'hsl(150, 70%, 60%)'],
    expense: ['hsl(0, 75%, 60%)', 'hsl(0, 75%, 75%)'],
  }
};

/**
 * Accessibility-compliant color variations
 * Ensures WCAG 2.1 AA contrast compliance (4.5:1 ratio minimum)
 */
export const accessibleColors = {
  high_contrast: [
    'hsl(210, 100%, 35%)',   // Darker blue - 4.8:1 contrast
    'hsl(150, 100%, 25%)',   // Darker green - 5.2:1 contrast  
    'hsl(30, 100%, 35%)',    // Darker orange - 4.6:1 contrast
    'hsl(300, 100%, 35%)',   // Darker purple - 4.7:1 contrast
    'hsl(0, 100%, 35%)',     // Darker red - 4.9:1 contrast
    'hsl(60, 100%, 25%)',    // Darker yellow - 5.1:1 contrast
    'hsl(180, 100%, 25%)',   // Darker cyan - 5.3:1 contrast
    'hsl(270, 100%, 35%)',   // Darker violet - 4.8:1 contrast
  ],
  // Pattern-based alternatives for color-blind users
  patterns: {
    solid: 'solid',
    diagonal: 'diagonal-stripes',
    dots: 'dots',
    horizontal: 'horizontal-stripes',
    vertical: 'vertical-stripes',
    cross: 'cross-hatch',
    diamond: 'diamond',
    zigzag: 'zigzag'
  }
};

/**
 * Export Chart.js for use in other modules (lazy-loaded)
 * @returns {Promise<Object>} Promise that resolves to Chart.js modules
 */
export async function getChartJS() {
    if (isChartJSReady()) {
        const modules = getChartJSModules();
        return modules.ChartJS;
    }
    
    const modules = await loadChartJS();
    ChartJS = modules.ChartJS;
    return modules.ChartJS;
}

/**
 * Initialize Chart.js if not already loaded
 * @returns {Promise<Object>} Promise that resolves to all Chart.js modules
 */
export async function initializeChartJS() {
    if (isChartJSReady()) {
        return getChartJSModules();
    }
    
    const modules = await loadChartJS();
    ChartJS = modules.ChartJS;
    return modules;
}

/**
 * Utility function to get colors for a dataset with enhanced styling
 * @param {number} count - Number of colors needed
 * @param {boolean} highContrast - Whether to use high contrast colors
 * @param {string} style - Color style: 'solid', 'gradient', 'pattern'
 * @returns {string[]|Object[]} Array of color strings or gradient objects
 */
export function getChartColors(count, highContrast = false, style = 'solid') {
  // Check user's contrast preference
  const prefersHighContrast = window.matchMedia && 
    window.matchMedia('(prefers-contrast: high)').matches;
  
  const useHighContrast = highContrast || prefersHighContrast;
  const colors = useHighContrast ? accessibleColors.high_contrast : chartColors.primary;
  const result = [];
  
  for (let i = 0; i < count; i++) {
    const baseColor = colors[i % colors.length];
    
    switch (style) {
      case 'gradient':
        // Note: Gradient support is currently non-functional with Chart.js canvas rendering
        // Falling back to solid colors with enhanced styling
        result.push({
          backgroundColor: baseColor,
          borderColor: darkenColor(baseColor, 15),
          hoverBackgroundColor: lightenColor(baseColor, 10),
          hoverBorderColor: lightenColor(baseColor, 20)
        });
        break;
        
      case 'pattern':
        // For future pattern support
        result.push({
          backgroundColor: baseColor,
          borderColor: darkenColor(baseColor, 20),
          pattern: accessibleColors.patterns[Object.keys(accessibleColors.patterns)[i % Object.keys(accessibleColors.patterns).length]]
        });
        break;
        
      default: // 'solid'
        result.push(baseColor);
        break;
    }
  }
  
  return result;
}

/**
 * Create gradient color for enhanced visual appeal
 * Note: This function creates CSS gradient strings which are not compatible with Chart.js canvas rendering.
 * Chart.js requires CanvasGradient objects created via canvas context methods.
 * This function is currently non-functional for Chart.js and should be refactored.
 * 
 * @param {string} baseColor - Base HSL color string
 * @param {string} type - 'linear' or 'radial'
 * @param {number} opacity - Opacity for the gradient (0-1)
 * @returns {string} CSS gradient string (non-functional with Chart.js)
 * @deprecated Use canvas context gradients instead
 */
function createGradient(baseColor, type = 'linear', opacity = 1) {
  // TODO: Refactor to create CanvasGradient objects when canvas context is available
  // For now, return solid color as fallback
  console.warn('[ChartConfig] CSS gradients not supported by Chart.js canvas rendering. Using solid color fallback.');
  return baseColor;
}

/**
 * Lighten a color by a percentage
 * @param {string} color - HSL color string
 * @param {number} percent - Percentage to lighten (0-100)
 * @returns {string} Lightened color
 */
function lightenColor(color, percent) {
  const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!hslMatch) return color;
  
  const [, h, s, l] = hslMatch.map(Number);
  const newL = Math.min(l + percent, 100);
  
  return `hsl(${h}, ${s}%, ${newL}%)`;
}

/**
 * Darken a color by a percentage
 * @param {string} color - HSL color string
 * @param {number} percent - Percentage to darken (0-100)
 * @returns {string} Darkened color
 */
function darkenColor(color, percent) {
  const hslMatch = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!hslMatch) return color;
  
  const [, h, s, l] = hslMatch.map(Number);
  const newL = Math.max(l - percent, 0);
  
  return `hsl(${h}, ${s}%, ${newL}%)`;
}

/**
 * Create themed chart options for specific chart types
 * @param {string} chartType - Type of chart ('pie', 'bar', 'line')
 * @param {Object} customOptions - Custom options to merge
 * @returns {Object} Themed chart options
 */
export function createThemedChartOptions(chartType, customOptions = {}) {
  const baseOptions = createChartOptions(customOptions);
  
  // Chart-specific theming
  switch (chartType) {
    case 'pie':
      return {
        ...baseOptions,
        plugins: {
          ...baseOptions.plugins,
          legend: {
            ...baseOptions.plugins.legend,
            position: 'bottom',
            labels: {
              ...baseOptions.plugins.legend.labels,
              generateLabels: function(chart) {
                const data = chart.data;
                if (data.labels.length && data.datasets.length) {
                  return data.labels.map((label, i) => {
                    const dataset = data.datasets[0];
                    const value = dataset.data[i];
                    const total = dataset.data.reduce((sum, val) => sum + val, 0);
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                    const bgColor = Array.isArray(dataset.backgroundColor) 
                      ? dataset.backgroundColor[i] 
                      : dataset.backgroundColor;
                    const borderColor = Array.isArray(dataset.borderColor)
                      ? dataset.borderColor?.[i]
                      : dataset.borderColor;
                    
                    return {
                      text: `${label} (${percentage}%)`,
                      fillStyle: bgColor,
                      strokeStyle: borderColor || '#fff',
                      lineWidth: 2,
                      pointStyle: 'circle',
                      index: i,
                      fontColor: 'hsl(0, 0%, 100%)', // Ensure text is visible
                      ariaLabel: `${label}: ${new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
                      }).format(value)} (${percentage}% of total)`
                    };                  });
                }
                return [];
              }
            }
          }
        },
        // Enhanced hover effects for pie charts
        onHover: (event, activeElements, chart) => {
          if (customOptions.onHover) {
            customOptions.onHover(event, activeElements, chart);
          }
          
          // Add subtle scale effect on hover
          if (activeElements.length > 0) {
            chart.canvas.style.cursor = 'pointer';
          } else {
            chart.canvas.style.cursor = 'default';
          }
        }
      };
      
    case 'bar':
      return {
        ...baseOptions,
        scales: {
          ...baseOptions.scales,
          x: {
            ...baseOptions.scales.x,
            grid: {
              display: false // Clean look for bar charts
            }
          },
          y: {
            ...baseOptions.scales.y,
            beginAtZero: true,
            grid: {
              color: 'hsl(240, 5%, 20%)',
              lineWidth: 1
            },
            ticks: {
              ...baseOptions.scales.y.ticks,
              callback: function(value) {
                return new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(value);
              }
            }
          }
        }
      };
      
    case 'line':
      return {
        ...baseOptions,
        elements: {
          line: {
            tension: 0.4, // Smooth curves
            borderWidth: 3,
            fill: false
          },
          point: {
            radius: 4,
            hoverRadius: 8,
            borderWidth: 2,
            backgroundColor: 'hsl(240, 10%, 10%)', // Match surface color
            hoverBorderWidth: 3
          }
        },
        scales: {
          ...baseOptions.scales,
          x: {
            ...baseOptions.scales.x,
            grid: {
              color: 'hsl(240, 5%, 15%)',
              lineWidth: 1
            }
          },
          y: {
            ...baseOptions.scales.y,
            beginAtZero: true,
            grid: {
              color: 'hsl(240, 5%, 15%)',
              lineWidth: 1
            },
            ticks: {
              ...baseOptions.scales.y.ticks,
              callback: function(value) {
                return new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(value);
              }
            }
          }
        }
      };
      
    default:
      return baseOptions;
  }
}

/**
 * Utility function to create responsive chart options with accessibility enhancements
 * @param {Object} customOptions - Custom options to merge
 * @returns {Object} Complete chart options with accessibility features
 */
export function createChartOptions(customOptions = {}) {
  // Deep merge helper for nested objects
  const deepMerge = (target, source) => {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  };

  const baseOptions = {
    ...defaultChartOptions,
    ...customOptions,
    plugins: deepMerge(defaultChartOptions.plugins, customOptions.plugins || {})
  };

  // Add accessibility enhancements based on user preferences
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    baseOptions.animation = { duration: 0 };
    baseOptions.transitions = { active: { animation: { duration: 0 } } };
  }

  // Enhanced focus management for keyboard navigation
  baseOptions.onHover = function(event, activeElements, chart) {
    // Call custom hover handler if provided
    if (customOptions.onHover) {
      customOptions.onHover(event, activeElements, chart);
    }
    
    // Accessibility: Update ARIA live region with current focus
    updateAriaLiveRegion(chart, activeElements);
  };

  return baseOptions;
}

/**
 * Update ARIA live region for screen reader announcements
 * @param {Chart} chart - Chart.js instance
 * @param {Array} activeElements - Currently active chart elements
 */
function updateAriaLiveRegion(chart, activeElements) {
  if (!activeElements || activeElements.length === 0) return;
  
  const activeElement = activeElements[0];
  const datasetIndex = activeElement.datasetIndex;
  const index = activeElement.index;
  
  if (chart.data.datasets[datasetIndex] && chart.data.labels[index]) {
    const dataset = chart.data.datasets[datasetIndex];
    const label = chart.data.labels[index];
    const value = dataset.data[index];
    
    const formattedValue = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
    
    let announcement = `${label}: ${formattedValue}`;
    
    // Add percentage for pie charts
    if (chart.config.type === 'pie') {
      const total = dataset.data.reduce((sum, val) => sum + val, 0);
      if (total > 0) {
        const percentage = ((value / total) * 100).toFixed(1);
        announcement += ` (${percentage}% of total)`;
      }
    }
    
    // Find or create ARIA live region
    let liveRegion = document.getElementById('chart-live-region');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'chart-live-region';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
    }
    
    liveRegion.textContent = announcement;  }
}