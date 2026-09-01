/**
 * Inflation Trends Component
 *
 * Displays personal inflation trends for top spending categories.
 * Shows how individual prices are changing over time for the user.
 * Includes actionable suggestions based on inflation analysis.
 *
 * Design:
 * - Statistical default: Median (outlier-resistant)
 * - Time window: 6 months
 * - Visualization: Trend line
 * - Zero toggles (tasteful defaults)
 */

import {
  prepareChartData,
  getChartOptions,
  validateChartData,
} from '../utils/inflation-chart-utils.js';
import { InsightsGenerator } from '../core/insights-generator.js';
import { generateId } from '../utils/id-utils.js';
import { SPACING } from '../utils/constants.js';

export const InflationTrends = (
  data,
  chartRenderer,
  activeCharts,
  sharedMonthState = null
) => {
  const container = document.createElement('div');
  container.className = 'inflation-trends';
  // Matches the NetBalanceChart card style exactly (background / radius / padding / margins / gap / border)
  container.style.background = 'var(--color-surface)';
  container.style.borderRadius = 'var(--radius-md)';
  container.style.padding = SPACING.MD;
  container.style.marginTop = SPACING.MD;
  container.style.marginBottom = SPACING.MD;
  container.style.gap = SPACING.MD;
  container.style.border = '1px solid var(--color-border)';

  const instanceId = generateId();

  // Tasteful defaults: median (statistically robust), 6 months, line chart
  const currentChartType = 'line';
  const currentCalcMethod = 'median';
  const currentPeriod = 6;
  let currentChart = null;
  let renderVersion = 0;

  // Chart container — top spacing is provided by the card header (like NetBalanceChart)
  const chartContainer = document.createElement('div');
  chartContainer.className = 'inflation-chart';
  chartContainer.style.position = 'relative';
  chartContainer.style.width = '100%';
  chartContainer.style.height = '300px';
  chartContainer.style.marginTop = '0';

  // Create canvas element with unique ID
  const canvasId = `inflation-trends-chart-${instanceId}`;
  const canvas = document.createElement('canvas');
  canvas.id = canvasId;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  chartContainer.appendChild(canvas);

  /**
   * Helper to get transactions for the selected month in sharedState
   */
  const getSelectedMonthTransactions = () => {
    if (!sharedMonthState) {
      // Exclude current month transactions when not using sharedMonthState
      const now = new Date();
      const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      return data.transactions.filter(t => {
        if (t.isGhost) return false;
        const ts = new Date(t.timestamp);
        return ts <= endOfPreviousMonth;
      });
    }

    const now = new Date();
    const targetDate = new Date(
      now.getFullYear(),
      now.getMonth() + sharedMonthState.offset,
      1
    );
    const currentMonth = targetDate.getMonth();
    const currentYear = targetDate.getFullYear();
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 1);

    return data.transactions.filter(t => {
      if (t.isGhost) return false;
      const ts = new Date(t.timestamp);
      return ts >= startOfMonth && ts < endOfMonth;
    });
  };

  /**
   * Render the chart with current settings
   */
  const renderChart = async () => {
    renderVersion++;
    const myVersion = renderVersion;

    try {
      // Calculate reference date based on sharedMonthState (end of selected month)
      const now = new Date();
      const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      const referenceDate = sharedMonthState
        ? new Date(
            now.getFullYear(),
            now.getMonth() + sharedMonthState.offset + 1,
            0
          )
        : endOfPreviousMonth; // End of previous month to exclude current incomplete month

      // Ensure reference date never includes current incomplete month
      if (
        referenceDate.getMonth() === now.getMonth() &&
        referenceDate.getFullYear() === now.getFullYear()
      ) {
        referenceDate.setTime(endOfPreviousMonth.getTime());
      }

      // Get categories from Top Movers for the selected month
      const monthTransactions = getSelectedMonthTransactions();
      const topMoveItems = InsightsGenerator.topMovers(monthTransactions, 6);
      const categoriesToShow = topMoveItems.map(item => item.category);

      // If no top movers (empty month), fall back to top inflation categories in main data
      const chartData = prepareChartData(
        data.transactions,
        currentPeriod,
        currentCalcMethod,
        currentChartType,
        categoriesToShow.length > 0 ? categoriesToShow : null,
        referenceDate
      );

      if (chartData.length === 0) {
        showNoDataMessage(chartContainer);
        return;
      }

      // Validate chart data
      const validation = validateChartData(chartData);
      if (!validation.isValid) {
        showErrorMessage(chartContainer, validation.reason);
        return;
      }

      // Convert to Chart.js format
      const { labels, datasets: normalizedDatasets } =
        normalizeAndExtractLabels(chartData);
      const datasets = normalizedDatasets.map(dataset => ({
        label: dataset.label,
        data: dataset.data.map(point => point.y),
        backgroundColor: dataset.backgroundColor,
        borderColor: dataset.borderColor,
        borderWidth: 2,
        tension: 0.4,
        fill: false,
      }));

      const newChart = await chartRenderer.createLineChart(
        canvas,
        { labels, datasets },
        getChartOptions(currentChartType)
      );

      if (myVersion !== renderVersion) {
        if (newChart) chartRenderer.destroyChart(newChart);
        return;
      }

      if (currentChart && currentChart !== newChart) {
        chartRenderer.destroyChart(currentChart);
      }
      currentChart = newChart;

      if (currentChart) {
        activeCharts.set(instanceId, currentChart);
      }
    } catch (error) {
      console.error('Error rendering inflation trends chart:', error);
      showErrorMessage(chartContainer, 'Failed to load inflation data');
    }
  };

  /**
   * Normalize chart data and extract labels (pure function)
   * Returns both sorted labels and normalized datasets without mutating input
   */
  const normalizeAndExtractLabels = chartData => {
    if (chartData.length === 0) return { labels: [], datasets: [] };

    // Get all unique months from all datasets
    const allMonths = new Set();
    chartData.forEach(dataset => {
      dataset.data.forEach(point => {
        allMonths.add(point.x);
      });
    });

    // Sort months
    const sortedMonths = Array.from(allMonths).sort();

    // Create normalized datasets without mutating original
    const normalizedDatasets = chartData.map(dataset => {
      // Deep copy dataset data
      const dataCopy = [...dataset.data];
      const existingMonths = new Set(dataCopy.map(point => point.x));
      const missingMonths = sortedMonths.filter(
        month => !existingMonths.has(month)
      );

      // Add null data points for missing months
      missingMonths.forEach(month => {
        dataCopy.push({ x: month, y: null });
      });

      // Sort data points by month
      dataCopy.sort((a, b) => a.x.localeCompare(b.x));

      // Return normalized dataset with original properties
      return {
        ...dataset,
        data: dataCopy,
        category: dataset.category,
        inflationRate: dataset.inflationRate,
      };
    });

    // Format labels
    const labels = sortedMonths.map(month => {
      const [year, monthNum] = month.split('-');
      const date = new Date(year, monthNum - 1);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      });
    });

    return { labels, datasets: normalizedDatasets };
  };

  /**
   * Show no data message
   */
  const showNoDataMessage = container => {
    Array.from(container.childNodes).forEach(c => {
      if (c.nodeName !== 'CANVAS') c.remove();
    });

    const wrapper = document.createElement('div');
    wrapper.className = 'inflation-message-wrapper inflation-message-muted';

    const icon = document.createElement('div');
    icon.className = 'inflation-message-icon';
    icon.textContent = '📊';

    const title = document.createElement('div');
    title.textContent = 'Not enough data for inflation analysis';

    const subtitle = document.createElement('div');
    subtitle.className = 'inflation-message-subtitle';
    subtitle.textContent = 'Need at least 2 months of spending data';

    wrapper.append(icon, title, subtitle);
    container.appendChild(wrapper);
  };

  /**
   * Show error message
   */
  const showErrorMessage = (container, message) => {
    Array.from(container.childNodes).forEach(c => {
      if (c.nodeName !== 'CANVAS') c.remove();
    });

    const wrapper = document.createElement('div');
    wrapper.className = 'inflation-message-wrapper inflation-message-error';

    const icon = document.createElement('div');
    icon.className = 'inflation-message-icon';
    icon.textContent = '⚠️';

    const text = document.createElement('div');
    text.textContent = message;

    wrapper.append(icon, text);
    container.appendChild(wrapper);
  };

  // Header with title
  const header = document.createElement('div');
  header.className = 'inflation-header';

  const titleWrapper = document.createElement('div');

  const title = document.createElement('h3');
  title.textContent = 'Personal Inflation Trends';
  title.className = 'inflation-title';
  title.style.margin = '0 0 4px 0';

  const subtitle = document.createElement('p');
  subtitle.textContent = 'See how your personal spending prices are changing';
  subtitle.style.margin = '0';
  subtitle.style.fontSize = '0.8125rem';
  subtitle.style.color = 'var(--color-text-muted)';

  titleWrapper.appendChild(title);
  titleWrapper.appendChild(subtitle);
  header.appendChild(titleWrapper);

  // Assemble component
  container.appendChild(header);
  container.appendChild(chartContainer);

  // Initial render
  renderChart();

  // Return cleanup and update functions
  return {
    element: container,
    render: renderChart,
    cleanup: () => {
      if (currentChart) {
        chartRenderer.destroyChart(currentChart);
        activeCharts.delete(instanceId);
      }
    },
  };
};
