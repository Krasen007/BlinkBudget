/**
 * Insights Chart Theme
 *
 * Shared Chart.js theming for the Financial Insights cards so every chart in
 * the section (Trend, Timeline, Top Movers, Net Balance) uses the same palette
 * and axis styling.
 *
 * Canvas rendering cannot resolve CSS custom properties — a CSS variable
 * reference string is silently ignored by the 2D context — so the palette below mirrors
 * the BlinkBudget design tokens in src/styles/tokens.css as literal HSL values,
 * exactly like src/core/chart-config.js does for its default scales.
 */

import { COLORS } from '../../utils/constants.js';

/** Palette mirroring the design tokens (canvas-safe, no CSS variables). */
export const INSIGHTS_CHART_COLORS = {
  income: 'hsl(150, 100%, 35%)', // --color-success
  incomeFill: `rgba(${COLORS.SUCCESS_RGB}, 0.65)`,
  expense: 'hsl(0, 85%, 60%)', // --color-error
  expenseFill: `rgba(${COLORS.ERROR_RGB}, 0.65)`,
  net: 'hsl(198, 93%, 60%)', // bright cyan so the Net line pops over the bars
  savingsRate: 'hsl(43, 96%, 53%)', // amber dashed line (secondary % axis)
  netBalance: 'hsl(150, 100%, 35%)', // monthly net balance line (income hue)
  netBalanceFill: 'hsla(150, 100%, 35%, 0.1)',
  netWorth: 'hsl(250, 84%, 60%)', // cumulative net worth line (unique hue)
  netWorthFill: 'hsla(250, 84%, 60%, 0.1)',
  previousPeriod: 'hsl(240, 5%, 55%)', // muted series for the prior period
  surface: 'hsl(240, 10%, 10%)', // --color-surface (donut slice separators)
  surfaceHover: 'hsl(240, 10%, 15%)', // --color-surface-hover (empty state)
  axisText: 'hsl(220, 10%, 75%)', // --color-text-muted
  grid: 'hsl(240, 5%, 20%)', // subtle grid lines (chart-config default)
};

/**
 * Currency tick formatting used by the insights axes.
 * @param {number} value
 * @returns {string} Formatted currency label (no decimals for compact axes)
 */
export const formatChartCurrency = value =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

/**
 * Standard responsive scales for the insights charts.
 * Keeps tick counts low so axes stay readable on small screens.
 * @param {Object} [options]
 * @param {boolean} [options.showXGrid=false] - Draw vertical grid lines
 * @param {boolean} [options.currency=true] - Format the y axis as currency
 * @returns {Object} Chart.js `scales` configuration
 */
export function createInsightsScales({
  showXGrid = false,
  currency = true,
} = {}) {
  return {
    x: {
      grid: { display: showXGrid },
      ticks: {
        color: INSIGHTS_CHART_COLORS.axisText,
        autoSkip: true,
        autoSkipPadding: 12,
        maxRotation: 0,
      },
    },
    y: {
      beginAtZero: true,
      grid: { color: INSIGHTS_CHART_COLORS.grid },
      ticks: {
        color: INSIGHTS_CHART_COLORS.axisText,
        maxTicksLimit: 5,
        callback: currency ? formatChartCurrency : value => String(value),
      },
    },
  };
}

/**
 * Tooltip callbacks shared by the insights charts. The default chart config
 * appends a "% of total" line which is meaningless for time series, so it is
 * cleared here.
 * @returns {Object} Chart.js tooltip callbacks
 */
export function createInsightsTooltipCallbacks() {
  return {
    afterBody: () => '',
  };
}
