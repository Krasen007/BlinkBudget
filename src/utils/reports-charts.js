/**
 * Reports Chart Components
 *
 * Chart creation and rendering functions for reports view.
 */

import { COLORS, SPACING, DIMENSIONS, CATEGORY_COLORS } from './constants.js';
import { getChartColors } from '../core/chart-config.js';
import { escapeHtml } from './security-utils.js';
import { formatCurrency } from './financial-planning-helpers.js';
import { Router } from '../core/router.js';
import { NavigationState } from '../core/navigation-state.js';

// Resolve CSS custom properties to computed color strings usable by Canvas/Chart.js
function resolveCssVarColor(varName, alpha) {
  try {
    const root = getComputedStyle(document.documentElement);
    const raw = root.getPropertyValue(varName).trim();
    if (!raw) return null;

    // If token is stored as 'r, g, b' components
    if (/^\d+\s*,\s*\d+\s*,\s*\d+/.test(raw)) {
      return `rgba(${raw}, ${alpha ?? 1})`;
    }

    // rgb(...) -> rgba(..., alpha)
    if (raw.startsWith('rgb(')) {
      if (alpha === undefined) return raw;
      return raw.replace(/^rgb\(/, 'rgba(').replace(/\)$/, `, ${alpha})`);
    }

    // hsl(...) -> hsla(..., alpha)
    if (raw.startsWith('hsl(')) {
      if (alpha === undefined) return raw;
      return raw.replace(/^hsl\(/, 'hsla(').replace(/\)$/, `, ${alpha})`);
    }

    // Already a hex or named color
    return raw;
  } catch {
    return null;
  }
}

/**
 * Create tooltip configuration for category charts
 */
function createCategoryTooltipConfig(detailsContainer) {
  return {
    enabled: false, // Disable default tooltip
    external: function (context) {
      const tooltip = context.tooltip;

      if (!detailsContainer) return;

      // Handle opacity = 0 (tooltip hidden/mouseout)
      if (tooltip.opacity === 0) {
        const actionText = window.innerWidth < 768 ? 'Tap' : 'Hover';
        // deepcode ignore DOMXSS: actionText is a static string and escapeHtml() sanitizes any dynamic content
        // snyk:disable-next-line javascript/DomBasedXss
        detailsContainer.innerHTML = `
                    <div style="text-align: center; color: var(--color-text-muted); font-size: 0.9em;">
                        ${escapeHtml(actionText)} on a category slice to see details
                    </div>
                `;
        return;
      }

      // Show details in fixed container
      if (tooltip.body && tooltip.body.length > 0) {
        // Parse the label and value from the data
        const dataPoint =
          context.chart.data.datasets[tooltip.dataPoints[0].datasetIndex];
        const index = tooltip.dataPoints[0].dataIndex;
        const value = dataPoint.data[index];
        const label = context.chart.data.labels[index];
        const total = dataPoint.data.reduce((sum, val) => sum + val, 0);
        const percentage =
          total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';

        const formattedValue = formatCurrency(value);

        // Create structured HTML for the details container
        // Security: All dynamic values are escaped using escapeHtml()
        // deepcode ignore DOMXSS: All dynamic values (label, formattedValue, percentage) are escaped using escapeHtml()
        // snyk:disable-next-line javascript/DomBasedXss
        detailsContainer.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-weight: 600; color: var(--color-text-main);">${escapeHtml(label)}</span>
                            <span style="font-weight: bold; color: var(--color-primary);">${escapeHtml(formattedValue)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; font-size: 0.85em; color: var(--color-text-muted);">
                            <span>Percentage</span>
                            <span>${escapeHtml(String(percentage))}%</span>
                        </div>
                    `;
      }
    },
    callbacks: {
      label: function (context) {
        const label = context.label || '';
        const value = context.parsed;
        const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
        const percentage =
          total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
        const formattedValue = formatCurrency(value);

        return `${label}: ${formattedValue} (${percentage}%)`;
      },
    },
  };
}

/**
 * Create a clickable stat card that filters the dashboard.
 * Shared by the category-breakdown totals and the income/expense summary.
 */
const createClickableStat = ({
  label,
  formattedValue,
  color,
  align = null,
  labelMargin = SPACING.XXS,
  valueSize = '1.25rem',
  ariaLabel,
  title,
  onClick,
}) => {
  const container = document.createElement('div');
  container.setAttribute('role', 'button');
  container.setAttribute('tabindex', '0');
  container.setAttribute('aria-label', ariaLabel);
  if (align) {
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = align;
  }
  container.style.cursor = 'pointer';
  container.style.transition = 'opacity 0.2s ease';
  container.title = title;

  const labelEl = document.createElement('div');
  labelEl.textContent = label;
  labelEl.style.fontSize = '0.875rem';
  labelEl.style.color = COLORS.TEXT_MUTED;
  labelEl.style.marginBottom = labelMargin;
  container.appendChild(labelEl);

  const valueEl = document.createElement('div');
  valueEl.textContent = formattedValue;
  valueEl.style.fontSize = valueSize;
  valueEl.style.fontWeight = 'bold';
  valueEl.style.color = color;
  container.appendChild(valueEl);

  container.addEventListener('mouseenter', () => {
    container.style.opacity = '0.7';
  });
  container.addEventListener('mouseleave', () => {
    container.style.opacity = '1';
  });

  container.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      container.click();
    }
  });

  container.addEventListener('click', onClick);
  return container;
};

/**
 * Create interactive category breakdown pie chart
 */
export async function createCategoryBreakdownChart(
  chartRenderer,
  currentData,
  categoryColorMap,
  getCategoryColors,
  onCategoryClick
) {
  const section = document.createElement('div');
  section.className = 'chart-section category-breakdown-section';
  section.setAttribute('data-chart-type', 'category-breakdown');
  section.style.background = COLORS.SURFACE;
  section.style.borderRadius = 'var(--radius-lg)';
  section.style.padding = SPACING.MD;

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = SPACING.XS;

  const title = document.createElement('h3');
  title.textContent = 'Spending by Category';
  title.style.margin = '0';
  title.style.color = COLORS.TEXT_MAIN;

  // Prepare chart data first — pie slices need non-negative values, so only
  // positive-net categories go in the chart (refunds still show in Explore
  // Categories cards below).
  const categoryData = currentData.categoryBreakdown;
  const allCategories = [...(categoryData?.categories || [])];
  const sortedCategories = allCategories
    .filter(cat => cat.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const totalsContainer = document.createElement('div');
  totalsContainer.style.display = 'flex';
  totalsContainer.style.flexDirection = 'row';
  totalsContainer.style.alignItems = 'flex-end';
  totalsContainer.style.justifyContent = 'space-between';
  totalsContainer.style.gap = SPACING.MD;
  totalsContainer.style.textAlign = 'right';

  const totalIncome = currentData.incomeVsExpenses?.totalIncome || 0;
  const totalSpent = allCategories.reduce((sum, cat) => sum + cat.amount, 0);
  const savePeriodAndGo = () => {
    if (currentData.timePeriod) {
      NavigationState.saveDashboardTimePeriod(currentData.timePeriod);
    }
    Router.navigate('dashboard');
  };

  const totalIncomeContainer = createClickableStat({
    label: 'Total Income',
    formattedValue: formatCurrency(totalIncome),
    color: COLORS.INCOME_COLOR,
    align: 'flex-start',
    ariaLabel: 'Filter dashboard by income transactions',
    title: 'Click to filter dashboard by income transactions',
    onClick: () => {
      NavigationState.saveDashboardTypeFilter('income');
      savePeriodAndGo();
    },
  });

  // Total Spent (Right side) - clickable to filter dashboard by expenses
  // Note: no type filter — total spent includes refunds, so filtering by
  // type='expense' would exclude refunds and disagree with this total.
  const totalSpentContainer = createClickableStat({
    label: 'Total Spent',
    formattedValue: formatCurrency(totalSpent),
    color: COLORS.PRIMARY,
    align: 'flex-end',
    ariaLabel: 'Filter dashboard to the selected period (includes refunds)',
    title: 'Click to filter dashboard to this period (includes refunds)',
    onClick: savePeriodAndGo,
  });

  totalsContainer.appendChild(totalIncomeContainer);
  totalsContainer.appendChild(totalSpentContainer);

  header.appendChild(title);
  header.appendChild(totalsContainer);
  section.appendChild(header);

  // Chart container - fixed height
  const chartDiv = document.createElement('div');
  chartDiv.style.position = 'relative';
  chartDiv.style.width = '100%';

  const canvas = document.createElement('canvas');
  canvas.id = 'category-breakdown-chart';
  canvas.style.maxHeight = '100%';
  chartDiv.appendChild(canvas);

  section.appendChild(chartDiv);

  // Mobile details container (fixed text below chart)
  const detailsContainer = document.createElement('div');
  detailsContainer.className = 'chart-mobile-details';
  detailsContainer.style.background = 'var(--color-background)';
  detailsContainer.style.borderRadius = 'var(--radius-md)';
  detailsContainer.style.padding = `${SPACING.XS} ${SPACING.MD}`; // Compact padding
  detailsContainer.style.marginTop = SPACING.XS;
  detailsContainer.style.display = 'block'; // Always visible
  detailsContainer.style.overflow = 'auto'; // Allow scrolling if needed
  detailsContainer.style.width = '100%';
  detailsContainer.style.boxSizing = 'border-box';

  // Add default instruction text
  const initialAction = window.innerWidth < 768 ? 'Tap' : 'Hover';
  // Security: initialAction is a static string, not user input
  // deepcode ignore DOMXSS: initialAction is a static string and escapeHtml() sanitizes any dynamic content
  // snyk:disable-next-line javascript/DomBasedXss
  detailsContainer.innerHTML = `
        <div style="text-align: center; color: var(--color-text-muted); font-size: 0.9em;">
            ${escapeHtml(initialAction)} on a category slice to see details
        </div>
    `;

  // Get consistent colors for all categories
  const categoryColors = getCategoryColors(sortedCategories, categoryColorMap);

  const chartData = {
    labels: sortedCategories.map(cat => cat.name),
    datasets: [
      {
        data: sortedCategories.map(cat => cat.amount),
        backgroundColor: categoryColors,
        borderColor: COLORS.SURFACE,
        borderWidth: 0,
      },
    ],
  };

  chartDiv.style.height = DIMENSIONS.CHART_HEIGHT_PIE; // More compact to avoid empty space
  chartDiv.style.marginBottom = SPACING.XS;

  const currentChart = await chartRenderer.createPieChart(canvas, chartData, {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: window.innerWidth < 768 ? 1.5 : 2, // Wider aspect ratio for better legend placement
    layout: {
      padding: 10,
    },
    plugins: {
      legend: {
        display: false, // Use custom HTML legend below
      },
      tooltip: createCategoryTooltipConfig(detailsContainer),
    },
  });

  const legendContainer = document.createElement('div');
  legendContainer.className = 'chartjs-legend';
  legendContainer.style.marginTop = SPACING.XS;
  legendContainer.style.display = 'flex';
  legendContainer.style.flexWrap = 'wrap';
  legendContainer.style.justifyContent = 'center';
  legendContainer.style.gap = SPACING.XS;

  const labels = chartData.labels;
  const datasets = chartData.datasets[0];
  const total = datasets.data.reduce((a, b) => a + b, 0);

  labels.forEach((label, i) => {
    const value = datasets.data[i];
    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';

    const item = document.createElement('div');
    item.className = 'legend-item';
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', `Toggle visibility for ${label}`);
    item.style.display = 'flex';
    item.style.alignItems = 'center';
    item.style.gap = SPACING.SM;
    item.style.padding = DIMENSIONS.LEGEND_ITEM_PADDING;
    item.style.background =
      'color-mix(in srgb, var(--color-text-main) 5%, transparent)';
    item.style.borderRadius = 'var(--radius-md)';
    item.style.cursor = 'pointer';
    item.style.fontSize = '0.8125rem';
    item.style.transition = 'all 0.2s ease';

    const colorBox = document.createElement('span');
    colorBox.style.width = DIMENSIONS.LEGEND_SWATCH_SIZE;
    colorBox.style.height = DIMENSIONS.LEGEND_SWATCH_SIZE;
    colorBox.style.borderRadius = '50%';
    colorBox.style.backgroundColor = datasets.backgroundColor[i];

    const text = document.createElement('span');
    // Security: All dynamic values are escaped using escapeHtml()
    // deepcode ignore DOMXSS: All dynamic values (label, percentage) are escaped using escapeHtml()
    // snyk:disable-next-line javascript/DomBasedXss
    text.innerHTML = `<span style="color: var(--color-text-main); font-weight: 500;">${escapeHtml(label)}</span> <span style="color: var(--color-text-muted); opacity: 0.8;">${escapeHtml(String(percentage))}%</span>`;

    item.appendChild(colorBox);
    item.appendChild(text);

    const toggleVisibility = () => {
      const isVisible = currentChart.getDataVisibility(i);
      currentChart.toggleDataVisibility(i);
      currentChart.update();
      item.style.opacity = isVisible ? '0.4' : '1';
      item.style.textDecoration = isVisible ? 'line-through' : 'none';
    };

    item.addEventListener('click', toggleVisibility);
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleVisibility();
      }
    });

    legendContainer.appendChild(item);
  });

  // Append legend above details
  section.appendChild(legendContainer);
  section.appendChild(detailsContainer);

  // Add click handler for category selection
  canvas.addEventListener('chartSegmentClick', event => {
    const clickData = event.detail;
    if (onCategoryClick) {
      onCategoryClick(clickData.label, clickData.value, clickData.percentage);
    }
  });

  return { section, chart: currentChart };
}

/**
 * Create income vs expenses bar chart
 */
export async function createIncomeExpenseChart(chartRenderer, currentData) {
  const section = document.createElement('div');
  section.className = 'chart-section income-expense-section';
  section.setAttribute('data-chart-type', 'income-expense');
  section.style.background = COLORS.SURFACE;
  section.style.borderRadius = 'var(--radius-lg)';
  section.style.padding = SPACING.MD;
  section.style.marginBottom = '0 !important';
  section.style.paddingBottom = `calc(${SPACING.MD}) !important`;
  section.style.position = 'relative';
  section.style.zIndex = '2';
  section.style.display = 'block';
  section.style.width = '100%';
  section.style.boxSizing = 'border-box';
  section.style.contain = 'layout';
  section.style.overflow = 'visible';

  const title = document.createElement('h3');
  title.textContent = 'Income vs Expenses';
  title.style.margin = `0 0 ${SPACING.MD} 0`;
  title.style.color = COLORS.TEXT_MAIN;
  section.appendChild(title);

  // Prepare chart data first
  const incomeExpenseData = currentData.incomeVsExpenses;

  // Create details content as part of the section
  const detailsContent = document.createElement('div');
  detailsContent.style.display = 'grid';
  detailsContent.style.gridTemplateColumns =
    'repeat(auto-fit, minmax(150px, 1fr))';
  detailsContent.style.gap = SPACING.XS;
  detailsContent.style.textAlign = 'center';
  detailsContent.style.marginBottom = SPACING.XS;

  const savePeriodAndGoIncome = () => {
    NavigationState.saveDashboardTypeFilter('income');
    if (currentData.timePeriod) {
      NavigationState.saveDashboardTimePeriod(currentData.timePeriod);
    }
    Router.navigate('dashboard');
  };
  const savePeriodAndGoExpenses = () => {
    // No type filter — expenses include refunds, so type='expense'
    // would disagree with this total.
    if (currentData.timePeriod) {
      NavigationState.saveDashboardTimePeriod(currentData.timePeriod);
    }
    Router.navigate('dashboard');
  };

  // Income div - clickable to filter dashboard by income
  const incomeDiv = createClickableStat({
    label: 'Income',
    formattedValue: formatCurrency(incomeExpenseData.totalIncome),
    color: COLORS.INCOME_COLOR,
    labelMargin: SPACING.XS,
    valueSize: '1.125rem',
    ariaLabel: 'Filter dashboard by income transactions',
    title: 'Click to filter dashboard by income transactions',
    onClick: savePeriodAndGoIncome,
  });

  detailsContent.appendChild(incomeDiv);

  // Expenses div - clickable to filter dashboard by expenses
  const expensesDiv = createClickableStat({
    label: 'Expenses',
    formattedValue: formatCurrency(incomeExpenseData.totalExpenses),
    color: 'var(--color-error)',
    labelMargin: SPACING.XS,
    valueSize: '1.125rem',
    ariaLabel: 'Filter dashboard to the selected period (includes refunds)',
    title: 'Click to filter dashboard to this period (includes refunds)',
    onClick: savePeriodAndGoExpenses,
  });

  detailsContent.appendChild(expensesDiv);

  // Net Balance div
  const netBalanceDiv = document.createElement('div');
  const netBalanceLabel = document.createElement('div');
  netBalanceLabel.textContent = 'Net Balance';
  netBalanceLabel.style.fontSize = '0.875rem';
  netBalanceLabel.style.color = 'var(--color-text-muted)';
  netBalanceLabel.style.marginBottom = SPACING.XS;
  netBalanceDiv.appendChild(netBalanceLabel);

  const netBalanceValue = document.createElement('div');
  netBalanceValue.textContent = formatCurrency(incomeExpenseData.netBalance);
  netBalanceValue.style.fontSize = '1.125rem';
  netBalanceValue.style.fontWeight = 'bold';
  netBalanceValue.style.color =
    incomeExpenseData.netBalance >= 0
      ? COLORS.INCOME_COLOR
      : 'var(--color-error)';
  netBalanceDiv.appendChild(netBalanceValue);

  detailsContent.appendChild(netBalanceDiv);

  section.appendChild(detailsContent);

  const chartDiv = document.createElement('div');
  chartDiv.style.position = 'relative';
  chartDiv.style.width = '100%';
  chartDiv.style.marginBottom = '0';
  chartDiv.style.padding = SPACING.SM;
  chartDiv.style.boxSizing = 'border-box';
  chartDiv.style.overflow = 'visible';

  const canvas = document.createElement('canvas');
  canvas.id = 'income-expense-chart';
  canvas.style.width = '100%';
  canvas.style.height = DIMENSIONS.CHART_HEIGHT_BAR;
  canvas.style.maxWidth = '100%';
  canvas.style.display = 'block';
  chartDiv.appendChild(canvas);
  section.appendChild(chartDiv);

  // Resolve theme variables to concrete colors for Canvas rendering
  const incomeBg = `rgba(${COLORS.SUCCESS_RGB}, 0.8)`;
  const expensesBg = `rgba(${COLORS.ERROR_RGB}, 0.8)`;
  const netBg =
    incomeExpenseData.netBalance >= 0
      ? `rgba(${COLORS.SUCCESS_RGB}, 0.6)`
      : `rgba(${COLORS.ERROR_RGB}, 0.6)`;

  const incomeBorder =
    resolveCssVarColor('--color-success', 1) || 'hsl(150, 100%, 35%)';
  const expensesBorder =
    resolveCssVarColor('--color-error', 1) || 'hsl(0, 85%, 60%)';
  const netBorder =
    incomeExpenseData.netBalance >= 0 ? incomeBorder : expensesBorder;

  const chartData = {
    labels: ['Income', 'Expenses', 'Net Balance'],
    datasets: [
      {
        label: 'Amount (€)',
        data: [
          incomeExpenseData.totalIncome,
          incomeExpenseData.totalExpenses,
          incomeExpenseData.netBalance,
        ],
        backgroundColor: [incomeBg, expensesBg, netBg],
        borderColor: [incomeBorder, expensesBorder, netBorder],
        borderWidth: 1,
      },
    ],
  };

  const chart = await chartRenderer.createBarChart(canvas, chartData, {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: false,
      },
    },
    interaction: {
      mode: null,
      intersect: false,
    },
    hover: {
      mode: null,
    },
    plugins: {
      tooltip: {
        enabled: false, // Disable tooltip
      },
      legend: {
        display: false,
      },
    },
    events: [], // Disable all chart events
    onHover: null, // Disable hover events
    onClick: null, // Disable click events
  });

  return { section, chart };
}

/**
 * Get a deterministic color for a category
 * Checks predefined colors first, then falls back to a consistent hash-based color
 */
export function getColorForCategory(categoryName) {
  if (!categoryName) return COLORS.TEXT_MUTED;

  // 1. Check predefined colors
  if (CATEGORY_COLORS[categoryName]) {
    return CATEGORY_COLORS[categoryName];
  }

  // 2. Fallback: Deterministic hash to select from strict palette
  const totalColors = 12; // Use standard size palette
  const colors = getChartColors(totalColors);

  // Simple string hash
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

/**
 * Get consistent colors for categories across all charts and UI elements
 */
export function getCategoryColors(categories, categoryColorMap) {
  // Ensure categories is an array
  if (!Array.isArray(categories)) {
    console.warn('getCategoryColors: categories is not an array', categories);
    return [];
  }

  // Update map with colors for all categories
  categories.forEach(category => {
    if (!categoryColorMap.has(category.name)) {
      categoryColorMap.set(category.name, getColorForCategory(category.name));
    }
  });

  return categories.map(category => categoryColorMap.get(category.name));
}
