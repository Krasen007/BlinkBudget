// Detailed chart implementations follow below.
/**
 * Financial Planning Chart Components
 *
 * Chart creation and rendering functions for financial planning visualizations.
 * Includes projected balance charts, portfolio composition charts, and goal progress charts.
 */

import { COLORS, SPACING } from './constants.js';
import { getChartColors } from '../core/chart-config.js';
import { escapeHtml } from './security-utils.js';

/**
 * Create projected balance line chart showing future account balances
 * @param {Object} chartRenderer - ChartRenderer instance
 * @param {Array} balanceProjections - Array of balance projections with dates and amounts
 * @param {Object} options - Chart configuration options
 * @returns {Promise<Object>} Chart section and instance
 */
export async function createProjectedBalanceChart(
  chartRenderer,
  balanceProjections,
  options = {}
) {
  const section = document.createElement('div');
  section.className = 'chart-section projected-balance-section';
  section.setAttribute('data-chart-type', 'projected-balance');
  section.style.background = COLORS.SURFACE;
  section.style.borderRadius = 'var(--radius-lg)';
  section.style.border = `1px solid ${COLORS.BORDER}`;
  section.style.padding = SPACING.LG;
  section.style.marginBottom = SPACING.LG;

  // Section header
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = SPACING.MD;

  const title = document.createElement('h3');
  title.textContent = options.title || 'Projected Account Balance';
  title.style.margin = '0';
  title.style.color = COLORS.TEXT_MAIN;
  title.style.fontSize = '1.125rem';
  title.style.fontWeight = '600';

  header.appendChild(title);
  section.appendChild(header);

  // Chart container
  const chartDiv = document.createElement('div');
  chartDiv.style.position = 'relative';
  chartDiv.style.height = '350px';
  chartDiv.style.marginBottom = SPACING.MD;

  const canvas = document.createElement('canvas');
  canvas.id = 'projected-balance-chart';
  canvas.style.maxHeight = '100%';
  chartDiv.appendChild(canvas);

  section.appendChild(chartDiv);

  // Prepare chart data
  const labels = balanceProjections.map(projection => {
    const date = new Date(projection.period);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  });

  const balanceData = balanceProjections.map(
    projection => projection.projectedBalance
  );

  // Create datasets for current balance line and projected balance line
  const datasets = [
    {
      label: 'Projected Balance',
      data: balanceData,
      borderColor: COLORS.PRIMARY,
      backgroundColor: COLORS.PRIMARY.replace(')', ', 0.1)').replace(
        'hsl',
        'hsla'
      ),
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: COLORS.PRIMARY,
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
    },
  ];

  // Add warning line if balance goes negative
  const hasNegativeBalance = balanceData.some(balance => balance < 0);
  if (hasNegativeBalance) {
    datasets.push({
      label: 'Zero Line',
      data: new Array(labels.length).fill(0),
      borderColor: COLORS.ERROR,
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderDash: [5, 5],
      fill: false,
      pointRadius: 0,
      pointHoverRadius: 0,
    });
  }

  const chartData = {
    labels,
    datasets,
  };

  // Create chart with financial-specific options
  const chart = await chartRenderer.createLineChart(canvas, chartData, {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function (context) {
            const value = context.parsed.y;
            const formattedValue = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'EUR',
            }).format(value);
            return `${context.dataset.label}: ${formattedValue}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function (value) {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'EUR',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
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
    interaction: {
      mode: 'index',
      intersect: false,
    },
  });

  // Add summary statistics below chart
  const summaryContainer = createBalanceSummary(balanceProjections);
  section.appendChild(summaryContainer);

  return { section, chart };
}

/**
 * Create portfolio composition pie chart showing asset allocation
 * @param {Object} chartRenderer - ChartRenderer instance
 * @param {Object} portfolioData - Portfolio composition data
 * @param {Object} options - Chart configuration options
 * @returns {Promise<Object>} Chart section and instance
 */
export async function createPortfolioCompositionChart(
  chartRenderer,
  portfolioData,
  options = {}
) {
  const section = document.createElement('div');
  section.className = 'chart-section portfolio-composition-section';
  section.setAttribute('data-chart-type', 'portfolio-composition');
  section.style.background = COLORS.SURFACE;
  section.style.borderRadius = 'var(--radius-lg)';
  section.style.border = `1px solid ${COLORS.BORDER}`;
  section.style.padding = SPACING.LG;
  section.style.marginBottom = SPACING.LG;

  // Section header
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = SPACING.MD;

  const title = document.createElement('h3');
  title.textContent = options.title || 'Portfolio Composition';
  title.style.margin = '0';
  title.style.color = COLORS.TEXT_MAIN;
  title.style.fontSize = '1.125rem';
  title.style.fontWeight = '600';

  header.appendChild(title);
  section.appendChild(header);

  // Chart container
  const chartDiv = document.createElement('div');
  chartDiv.style.position = 'relative';
  chartDiv.style.height = '400px';
  chartDiv.style.marginBottom = SPACING.MD;

  const canvas = document.createElement('canvas');
  canvas.id = 'portfolio-composition-chart';
  canvas.style.maxHeight = '100%';
  chartDiv.appendChild(canvas);

  section.appendChild(chartDiv);

  // Details container for hover information
  const detailsContainer = document.createElement('div');
  detailsContainer.className = 'chart-details';
  detailsContainer.style.background = 'var(--color-background)';
  detailsContainer.style.borderRadius = 'var(--radius-md)';
  detailsContainer.style.padding = SPACING.MD;
  detailsContainer.style.marginTop = SPACING.SM;
  detailsContainer.style.border = '1px solid var(--color-border)';
  detailsContainer.style.minHeight = '60px';

  const initialAction = window.innerWidth < 768 ? 'Tap' : 'Hover';
  detailsContainer.innerHTML = `
    <div style="text-align: center; color: var(--color-text-muted); font-size: 0.9em;">
      ${initialAction} on an asset class to see details
    </div>
  `;

  section.appendChild(detailsContainer);

  // Prepare chart data
  const assetClasses = Object.keys(portfolioData.assetAllocation);
  const values = Object.values(portfolioData.assetAllocation);
  const colors = getChartColors(assetClasses.length, false, 'solid');

  const chartData = {
    labels: assetClasses.map(
      asset => asset.charAt(0).toUpperCase() + asset.slice(1)
    ),
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        borderColor: '#ffffff',
        borderWidth: 3,
        hoverBorderWidth: 4,
        hoverBorderColor: COLORS.PRIMARY,
      },
    ],
  };

  // Create pie chart with custom tooltip
  const chart = await chartRenderer.createPieChart(canvas, chartData, {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: window.innerWidth < 768 ? 'bottom' : 'right',
        labels: {
          usePointStyle: true,
          padding: 15,
        },
      },
      tooltip: {
        enabled: false, // Use custom tooltip
        external: function (context) {
          const tooltip = context.tooltip;

          if (tooltip.opacity === 0) {
            const actionText = window.innerWidth < 768 ? 'Tap' : 'Hover';
            detailsContainer.innerHTML = `
              <div style="text-align: center; color: var(--color-text-muted); font-size: 0.9em;">
                ${actionText} on an asset class to see details
              </div>
            `;
            return;
          }

          if (tooltip.body && tooltip.body.length > 0) {
            const dataPoint =
              context.chart.data.datasets[tooltip.dataPoints[0].datasetIndex];
            const index = tooltip.dataPoints[0].dataIndex;
            const value = dataPoint.data[index];
            const label = context.chart.data.labels[index];
            const total = dataPoint.data.reduce((sum, val) => sum + val, 0);
            const percentage =
              total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';

            const formattedValue = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'EUR',
            }).format(value);

            detailsContainer.innerHTML = `
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 600; color: var(--color-text-main);">${escapeHtml(label)}</span>
                <span style="font-weight: bold; color: var(--color-primary);">${escapeHtml(formattedValue)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; font-size: 0.85em; color: var(--color-text-muted);">
                <span>Allocation</span>
                <span>${percentage}%</span>
              </div>
            `;
          }
        },
      },
    },
  });

  // Add click handler for asset class selection
  canvas.addEventListener('chartSegmentClick', event => {
    const clickData = event.detail;
    console.log('Asset class clicked:', clickData);
    // Could trigger detailed view or filtering
  });

  return { section, chart };
}

/**
 * Create goal progress chart showing progress toward financial goals
 * @param {Object} chartRenderer - ChartRenderer instance
 * @param {Array} goals - Array of financial goals with progress data
 * @param {Object} options - Chart configuration options
 * @returns {Promise<Object>} Chart section and instance
 */
export async function createGoalProgressChart(
  chartRenderer,
  goals,
  options = {}
) {
  const section = document.createElement('div');
  section.className = 'chart-section goal-progress-section';
  section.setAttribute('data-chart-type', 'goal-progress');
  section.style.background = COLORS.SURFACE;
  section.style.borderRadius = 'var(--radius-lg)';
  section.style.border = `1px solid ${COLORS.BORDER}`;
  section.style.padding = SPACING.LG;
  section.style.marginBottom = SPACING.LG;

  // Section header
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = SPACING.MD;

  const title = document.createElement('h3');
  title.textContent = options.title || 'Goal Progress';
  title.style.margin = '0';
  title.style.color = COLORS.TEXT_MAIN;
  title.style.fontSize = '1.125rem';
  title.style.fontWeight = '600';

  header.appendChild(title);
  section.appendChild(header);

  // Chart container
  const chartDiv = document.createElement('div');
  chartDiv.style.position = 'relative';
  chartDiv.style.height = '350px';
  chartDiv.style.marginBottom = SPACING.MD;

  const canvas = document.createElement('canvas');
  canvas.id = 'goal-progress-chart';
  canvas.style.maxHeight = '100%';
  chartDiv.appendChild(canvas);

  section.appendChild(chartDiv);

  // Prepare chart data - horizontal bar chart showing progress
  const goalNames = goals.map(goal => goal.name);
  const progressPercentages = goals.map(goal => {
    const progress =
      goal.targetAmount > 0
        ? (goal.currentSavings / goal.targetAmount) * 100
        : 0;
    return Math.min(progress, 100); // Cap at 100%
  });

  const colors = progressPercentages.map(progress => {
    if (progress >= 80) return COLORS.SUCCESS;
    if (progress >= 50) return COLORS.WARNING;
    return COLORS.ERROR;
  });

  const chartData = {
    labels: goalNames,
    datasets: [
      {
        label: 'Progress (%)',
        data: progressPercentages,
        backgroundColor: colors,
        borderColor: colors.map(color =>
          color.replace(')', ', 0.8)').replace('hsl', 'hsla')
        ),
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  // Create horizontal bar chart
  const chart = await chartRenderer.createBarChart(canvas, chartData, {
    indexAxis: 'y', // Horizontal bars
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hide legend for progress chart
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const goalIndex = context.dataIndex;
            const goal = goals[goalIndex];
            const progress = context.parsed.x;
            const currentAmount = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'EUR',
            }).format(goal.currentSavings);
            const targetAmount = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'EUR',
            }).format(goal.targetAmount);

            return [
              `Progress: ${progress.toFixed(1)}%`,
              `Current: ${currentAmount}`,
              `Target: ${targetAmount}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function (value) {
            return `${value}%`;
          },
        },
      },
      y: {
        grid: {
          display: false,
        },
      },
    },
  });

  // Add goal details below chart
  const goalsContainer = createGoalDetails(goals);
  section.appendChild(goalsContainer);

  return { section, chart };
}

/**
 * Create forecast comparison chart showing income vs expenses over time
 * @param {Object} chartRenderer - ChartRenderer instance
 * @param {Array} incomeForecasts - Income forecast data
 * @param {Array} expenseForecasts - Expense forecast data
 * @param {Object} options - Chart configuration options
 * @returns {Promise<Object>} Chart section and instance
 */
export async function createForecastComparisonChart(
  chartRenderer,
  incomeForecasts,
  expenseForecasts,
  options = {}
) {
  const section = document.createElement('div');
  section.className = 'chart-section forecast-comparison-section';
  section.setAttribute('data-chart-type', 'forecast-comparison');
  section.style.background = COLORS.SURFACE;
  section.style.borderRadius = 'var(--radius-lg)';
  section.style.border = `1px solid ${COLORS.BORDER}`;
  section.style.padding = SPACING.LG;
  section.style.marginBottom = SPACING.LG;

  // Section header
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = SPACING.MD;

  const title = document.createElement('h3');
  title.textContent = options.title || 'Income vs Expense Forecast';
  title.style.margin = '0';
  title.style.color = COLORS.TEXT_MAIN;
  title.style.fontSize = '1.125rem';
  title.style.fontWeight = '600';

  header.appendChild(title);
  section.appendChild(header);

  // Chart container
  const chartDiv = document.createElement('div');
  chartDiv.style.position = 'relative';
  chartDiv.style.height = '350px';
  chartDiv.style.marginBottom = SPACING.MD;

  const canvas = document.createElement('canvas');
  canvas.id = 'forecast-comparison-chart';
  canvas.style.maxHeight = '100%';
  chartDiv.appendChild(canvas);

  section.appendChild(chartDiv);

  // Prepare chart data
  const maxLength = Math.max(incomeForecasts.length, expenseForecasts.length);
  const labels = [];

  for (let i = 0; i < maxLength; i++) {
    const forecast = incomeForecasts[i] || expenseForecasts[i];
    if (forecast && forecast.period) {
      labels.push(
        forecast.period.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        })
      );
    } else {
      labels.push(`Month ${i + 1}`);
    }
  }

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Forecasted Income',
        data: incomeForecasts.map(f => f.predictedAmount),
        borderColor: COLORS.SUCCESS,
        backgroundColor: COLORS.SUCCESS.replace(')', ', 0.1)').replace(
          'hsl',
          'hsla'
        ),
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Forecasted Expenses',
        data: expenseForecasts.map(f => f.predictedAmount),
        borderColor: COLORS.ERROR,
        backgroundColor: COLORS.ERROR.replace(')', ', 0.1)').replace(
          'hsl',
          'hsla'
        ),
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  // Create line chart
  const chart = await chartRenderer.createLineChart(canvas, chartData, {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function (context) {
            const value = context.parsed.y;
            const formattedValue = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'EUR',
            }).format(value);
            return `${context.dataset.label}: ${formattedValue}`;
          },
        },
      },
    },
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
              currency: 'EUR',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
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
    interaction: {
      mode: 'index',
      intersect: false,
    },
  });

  return { section, chart };
}

/**
 * Helper function to create balance summary statistics
 * @param {Array} balanceProjections - Balance projection data
 * @returns {HTMLElement} Summary container element
 */
function createBalanceSummary(balanceProjections) {
  const container = document.createElement('div');
  container.className = 'balance-summary';
  container.style.display = 'grid';
  container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(150px, 1fr))';
  container.style.gap = SPACING.MD;
  container.style.padding = SPACING.MD;
  container.style.background = 'var(--color-background)';
  container.style.borderRadius = 'var(--radius-md)';
  container.style.border = '1px solid var(--color-border)';

  const currentBalance = balanceProjections[0]?.projectedBalance || 0;
  const finalBalance =
    balanceProjections[balanceProjections.length - 1]?.projectedBalance || 0;
  const change = finalBalance - currentBalance;
  const lowestBalance = Math.min(
    ...balanceProjections.map(p => p.projectedBalance)
  );

  const stats = [
    {
      label: 'Current Balance',
      value: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR',
      }).format(currentBalance),
      color: currentBalance >= 0 ? COLORS.SUCCESS : COLORS.ERROR,
    },
    {
      label: 'Projected Change',
      value: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR',
      }).format(change),
      color: change >= 0 ? COLORS.SUCCESS : COLORS.ERROR,
    },
    {
      label: 'Lowest Point',
      value: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR',
      }).format(lowestBalance),
      color: lowestBalance >= 0 ? COLORS.SUCCESS : COLORS.ERROR,
    },
  ];

  stats.forEach(stat => {
    const statDiv = document.createElement('div');
    statDiv.style.textAlign = 'center';

    const label = document.createElement('div');
    label.textContent = stat.label;
    label.style.fontSize = '0.75rem';
    label.style.color = COLORS.TEXT_MUTED;
    label.style.marginBottom = SPACING.XS;

    const value = document.createElement('div');
    value.textContent = stat.value;
    value.style.fontSize = '1rem';
    value.style.fontWeight = '600';
    value.style.color = stat.color;

    statDiv.appendChild(label);
    statDiv.appendChild(value);
    container.appendChild(statDiv);
  });

  return container;
}

/**
 * Helper function to create goal details
 * @param {Array} goals - Array of financial goals
 * @returns {HTMLElement} Goals container element
 */
function createGoalDetails(goals) {
  const container = document.createElement('div');
  container.className = 'goal-details';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = SPACING.SM;
  container.style.padding = SPACING.MD;
  container.style.background = 'var(--color-background)';
  container.style.borderRadius = 'var(--radius-md)';
  container.style.border = '1px solid var(--color-border)';

  goals.forEach(goal => {
    const goalDiv = document.createElement('div');
    goalDiv.style.display = 'flex';
    goalDiv.style.justifyContent = 'space-between';
    goalDiv.style.alignItems = 'center';
    goalDiv.style.padding = SPACING.SM;
    goalDiv.style.background = COLORS.SURFACE;
    goalDiv.style.borderRadius = 'var(--radius-sm)';

    const leftSide = document.createElement('div');

    const goalName = document.createElement('div');
    goalName.textContent = goal.name;
    goalName.style.fontWeight = '600';
    goalName.style.color = COLORS.TEXT_MAIN;
    goalName.style.marginBottom = '2px';

    const targetDate = document.createElement('div');
    targetDate.textContent = `Target: ${new Date(goal.targetDate).toLocaleDateString()}`;
    targetDate.style.fontSize = '0.75rem';
    targetDate.style.color = COLORS.TEXT_MUTED;

    leftSide.appendChild(goalName);
    leftSide.appendChild(targetDate);

    const rightSide = document.createElement('div');
    rightSide.style.textAlign = 'right';

    const progress =
      goal.targetAmount > 0
        ? (goal.currentSavings / goal.targetAmount) * 100
        : 0;
    const progressText = document.createElement('div');
    progressText.textContent = `${progress.toFixed(1)}%`;
    progressText.style.fontWeight = '600';
    progressText.style.color =
      progress >= 80
        ? COLORS.SUCCESS
        : progress >= 50
          ? COLORS.WARNING
          : COLORS.ERROR;
    progressText.style.marginBottom = '2px';

    const amounts = document.createElement('div');
    const currentFormatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(goal.currentSavings);
    const targetFormatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(goal.targetAmount);
    amounts.textContent = `${currentFormatted} / ${targetFormatted}`;
    amounts.style.fontSize = '0.75rem';
    amounts.style.color = COLORS.TEXT_MUTED;

    rightSide.appendChild(progressText);
    rightSide.appendChild(amounts);

    goalDiv.appendChild(leftSide);
    goalDiv.appendChild(rightSide);
    container.appendChild(goalDiv);
  });

  return container;
}
