/**
 * Inflation Trends Component
 *
 * Displays personal inflation trends for top spending categories.
 * Shows how individual prices are changing over time for the user.
 * Includes actionable suggestions based on inflation analysis.
 *
 * Features:
 * - Chart type toggle (line vs bar)
 * - Calculation method toggle (average vs median)
 * - Time period selector (1, 3, 6, 12 months)
 * - Visual trend indicators
 * - Personal inflation rate with category breakdown
 * - Actionable suggestions to offset inflation
 */

import {
  prepareChartData,
  getChartOptions,
  validateChartData,
} from '../utils/inflation-chart-utils.js';
import { InsightsGenerator } from '../core/insights-generator.js';
import { generateId } from '../utils/id-utils.js';
import { trendService } from '../core/analytics/TrendService.js';

export const InflationTrends = (
  data,
  chartRenderer,
  activeCharts,
  sharedMonthState = null
) => {
  const container = document.createElement('div');
  container.className = 'inflation-trends card';

  const instanceId = generateId();

  // State management
  let currentChartType = 'line';
  let currentCalcMethod = 'average';
  let currentPeriod = 6;
  let currentChart = null;
  let renderVersion = 0;

  // Chart type toggle
  const chartTypeSelector = createChartTypeSelector(instanceId);

  // Calculation method toggle
  const calcMethodSelector = createCalcMethodSelector(instanceId);

  // Time period selector
  const periodSelector = createPeriodSelector();

  // Chart container
  const chartContainer = document.createElement('div');
  chartContainer.className = 'inflation-chart';
  chartContainer.style.position = 'relative';
  chartContainer.style.height = '300px';

  // Create canvas element with unique ID
  const canvasId = `inflation-trends-chart-${instanceId}`;
  const canvas = document.createElement('canvas');
  canvas.id = canvasId;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  chartContainer.appendChild(canvas);

  // Personal inflation summary container (actionable section)
  const inflationSummaryContainer = document.createElement('div');
  inflationSummaryContainer.className = 'inflation-summary';
  inflationSummaryContainer.style.marginBottom = 'var(--spacing-lg)';
  inflationSummaryContainer.style.display = 'none'; // Hidden by default, shown when data available

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
   * Render personal inflation summary with actionable suggestions
   */
  const renderInflationSummary = () => {
    if (!data.transactions || data.transactions.length < 30) {
      inflationSummaryContainer.style.display = 'none';
      return;
    }

    const inflationData = trendService.calculatePersonalInflation(
      data.transactions,
      currentPeriod
    );

    if (!inflationData || inflationData.overallRate === 0) {
      inflationSummaryContainer.style.display = 'none';
      return;
    }

    inflationSummaryContainer.style.display = 'block';

    // Clear previous content
    inflationSummaryContainer.innerHTML = '';

    // Overall rate header
    const header = document.createElement('div');
    header.className = 'inflation-summary-header';
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.gap = 'var(--spacing-md)';
    header.style.marginBottom = 'var(--spacing-md)';

    const rateBadge = document.createElement('div');
    rateBadge.className = `inflation-rate-badge ${inflationData.overallRate > 5 ? 'badge-error' : inflationData.overallRate > 0 ? 'badge-warning' : 'badge-success'}`;
    rateBadge.style.padding = 'var(--spacing-sm) var(--spacing-md)';
    rateBadge.style.borderRadius = 'var(--radius-full)';
    rateBadge.style.fontWeight = '600';
    rateBadge.style.fontSize = '1.25rem';
    rateBadge.textContent = `${inflationData.overallRate > 0 ? '+' : ''}${inflationData.overallRate}%`;

    const title = document.createElement('div');
    title.innerHTML = `<strong>Your Personal Inflation Rate</strong><br><span style="font-size: 0.875rem; color: var(--color-text-muted)">Based on ${inflationData.analyzedMonths} months of spending</span>`;

    header.appendChild(rateBadge);
    header.appendChild(title);
    inflationSummaryContainer.appendChild(header);

    // Top drivers section
    if (inflationData.topDrivers && inflationData.topDrivers.length > 0) {
      const driversSection = document.createElement('div');
      driversSection.className = 'inflation-drivers';
      driversSection.style.marginBottom = 'var(--spacing-md)';

      const driversTitle = document.createElement('h4');
      driversTitle.textContent = 'Top Inflation Drivers';
      driversTitle.style.fontSize = '0.875rem';
      driversTitle.style.fontWeight = '600';
      driversTitle.style.color = 'var(--color-text-muted)';
      driversTitle.style.marginBottom = 'var(--spacing-sm)';
      driversSection.appendChild(driversTitle);

      inflationData.topDrivers.forEach(driver => {
        const driverItem = document.createElement('div');
        driverItem.className = 'inflation-driver-item';
        driverItem.style.display = 'flex';
        driverItem.style.justifyContent = 'space-between';
        driverItem.style.alignItems = 'center';
        driverItem.style.padding = 'var(--spacing-sm) 0';
        driverItem.style.borderBottom = '1px solid var(--color-border)';

        const driverInfo = document.createElement('div');
        driverInfo.innerHTML = `<strong>${driver.category}</strong><br><span style="font-size: 0.75rem; color: var(--color-text-muted)">Spending: €${driver.spending.toFixed(0)}</span>`;

        const driverRate = document.createElement('span');
        driverRate.className = 'badge badge-error';
        driverRate.textContent = `+${driver.rate}%`;
        driverRate.style.fontWeight = '600';

        driverItem.appendChild(driverInfo);
        driverItem.appendChild(driverRate);
        driversSection.appendChild(driverItem);
      });

      inflationSummaryContainer.appendChild(driversSection);
    }

    // Actionable suggestions section
    if (inflationData.suggestions && inflationData.suggestions.length > 0) {
      const suggestionsSection = document.createElement('div');
      suggestionsSection.className = 'inflation-suggestions';

      const suggestionsTitle = document.createElement('h4');
      suggestionsTitle.textContent = 'Suggestions to Offset';
      suggestionsTitle.style.fontSize = '0.875rem';
      suggestionsTitle.style.fontWeight = '600';
      suggestionsTitle.style.color = 'var(--color-text-muted)';
      suggestionsTitle.style.marginBottom = 'var(--spacing-sm)';
      suggestionsSection.appendChild(suggestionsTitle);

      inflationData.suggestions.forEach(suggestion => {
        if (!suggestion.actionable) return;

        const suggestionCard = document.createElement('div');
        suggestionCard.className = 'inflation-suggestion-card';
        suggestionCard.style.background = 'var(--color-surface-alt)';
        suggestionCard.style.border = '1px solid var(--color-border)';
        suggestionCard.style.borderRadius = 'var(--radius-md)';
        suggestionCard.style.padding = 'var(--spacing-md)';
        suggestionCard.style.marginBottom = 'var(--spacing-sm)';

        const message = document.createElement('div');
        message.style.fontSize = '0.875rem';
        message.style.marginBottom = 'var(--spacing-sm)';
        message.textContent = suggestion.message;

        const action = document.createElement('div');
        action.style.fontSize = '0.875rem';
        action.style.color = 'var(--color-success)';
        action.innerHTML = `<strong>💡 ${suggestion.suggestion}</strong>`;

        const savings = document.createElement('div');
        savings.style.fontSize = '0.75rem';
        savings.style.color = 'var(--color-text-muted)';
        savings.style.marginTop = 'var(--spacing-sm)';
        savings.textContent = `Est. savings: €${suggestion.estimatedSavings}/month`;

        suggestionCard.appendChild(message);
        suggestionCard.appendChild(action);
        suggestionCard.appendChild(savings);
        suggestionsSection.appendChild(suggestionCard);
      });

      inflationSummaryContainer.appendChild(suggestionsSection);
    }
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
      // If the calculated reference date is in the current month, use end of previous month instead
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
        fill: currentChartType === 'line' ? false : true,
      }));

      const newChart = await chartRenderer[
        `create${currentChartType === 'line' ? 'Line' : 'Bar'}Chart`
      ](canvas, { labels, datasets }, getChartOptions(currentChartType));

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

      // Also render the personal inflation summary
      renderInflationSummary();
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

  // Header with title and controls
  const header = document.createElement('div');
  header.className = 'inflation-header';

  const title = document.createElement('h3');
  title.textContent = 'Personal Inflation Trends';
  title.className = 'inflation-title';
  header.appendChild(title);

  const controls = document.createElement('div');
  controls.className = 'inflation-controls';

  // Group 1: Data View (Type & Method)
  const viewGroup = document.createElement('div');
  viewGroup.className = 'selector-group';
  viewGroup.appendChild(chartTypeSelector);
  viewGroup.appendChild(calcMethodSelector);

  // Group 2: Time period
  const timeGroup = document.createElement('div');
  timeGroup.className = 'selector-group';
  timeGroup.appendChild(periodSelector);

  controls.appendChild(viewGroup);
  controls.appendChild(timeGroup);

  // Handle changes - store listener functions for cleanup
  const handleChartTypeChange = e => {
    if (e.target.tagName === 'INPUT') {
      currentChartType = e.target.value;
      renderChart();
    }
  };

  const handleCalcMethodChange = e => {
    if (e.target.tagName === 'INPUT') {
      currentCalcMethod = e.target.value;
      renderChart();
    }
  };

  const handlePeriodClick = e => {
    const btn = e.target.closest('button');
    if (btn) {
      periodSelector
        .querySelectorAll('button')
        .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPeriod = parseInt(btn.value, 10);
      renderChart();
    }
  };

  chartTypeSelector.addEventListener('change', handleChartTypeChange);
  calcMethodSelector.addEventListener('change', handleCalcMethodChange);
  periodSelector.addEventListener('click', handlePeriodClick);

  // Assemble component
  container.appendChild(header);
  container.appendChild(controls);
  container.appendChild(inflationSummaryContainer);
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
      chartTypeSelector.removeEventListener('change', handleChartTypeChange);
      calcMethodSelector.removeEventListener('change', handleCalcMethodChange);
      periodSelector.removeEventListener('click', handlePeriodClick);
    },
  };
};

/**
 * Create chart type selector
 */
const createChartTypeSelector = instanceId => {
  const container = document.createElement('div');
  container.className = 'chart-type-selector segmented-control';

  const types = [
    { value: 'line', label: 'Trend Line' },
    { value: 'bar', label: 'Monthly Bars' },
  ];

  types.forEach(type => {
    const wrapper = document.createElement('label');
    wrapper.className = 'radio-wrapper';

    const input = document.createElement('input');
    input.type = 'radio';
    input.name = `inflation-chart-type-${instanceId}`;
    input.value = type.value;
    input.checked = type.value === 'line';

    const span = document.createElement('span');
    span.textContent = type.label;

    wrapper.append(input, span);
    container.appendChild(wrapper);
  });

  return container;
};

/**
 * Create calculation method selector
 */
const createCalcMethodSelector = instanceId => {
  const container = document.createElement('div');
  container.className = 'calc-method-selector segmented-control';

  const methods = [{ value: 'average', label: 'Average' }];

  methods.forEach(method => {
    const wrapper = document.createElement('label');
    wrapper.className = 'radio-wrapper';

    const input = document.createElement('input');
    input.type = 'radio';
    input.name = `inflation-calc-method-${instanceId}`;
    input.value = method.value;
    input.checked = method.value === 'average';

    const span = document.createElement('span');
    span.textContent = method.label;

    wrapper.append(input, span);
    container.appendChild(wrapper);
  });

  return container;
};

/**
 * Create period selector
 */
const createPeriodSelector = () => {
  const container = document.createElement('div');
  container.className = 'period-selector segmented-control';

  const periods = [
    { value: 3, label: '3 months' },
    { value: 6, label: '6 months' },
    { value: 12, label: '12 months' },
  ];

  periods.forEach(period => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = period.label;
    button.value = period.value;
    button.className = period.value === 6 ? 'active' : '';

    container.appendChild(button);
  });

  return container;
};
