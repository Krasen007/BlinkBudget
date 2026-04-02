/**
 * Reports Chart Components
 *
 * Chart creation and rendering functions for reports view.
 */

import { COLORS, SPACING, CATEGORY_COLORS } from './constants.js';
import { getChartColors } from '../core/chart-config.js';
import { TransactionService } from '../core/transaction-service.js';
import { generateMonthlyTrendData } from './reports-utils.js';
import { escapeHtml } from './security-utils.js';

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
        detailsContainer.innerHTML = `
                    <div style="text-align: center; color: var(--color-text-muted); font-size: 0.9em;">
                        ${actionText} on a category slice to see details
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

        const formattedValue = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(value);

        // Create structured HTML for the details container
        detailsContainer.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-weight: 600; color: var(--color-text-main);">${escapeHtml(label)}</span>
                            <span style="font-weight: bold; color: var(--color-primary);">${escapeHtml(formattedValue)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px; font-size: 0.85em; color: var(--color-text-muted);">
                            <span>Percentage</span>
                            <span>${percentage}%</span>
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
        const formattedValue = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(value);

        return `${label}: ${formattedValue} (${percentage}%)`;
      },
    },
  };
}

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

  // Section header
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = SPACING.MD;

  const title = document.createElement('h3');
  title.textContent = 'Spending by Category';
  title.style.margin = '0';
  title.style.color = COLORS.TEXT_MAIN;

  // Prepare chart data first
  const categoryData = currentData.categoryBreakdown;

  // Total amounts display
  const totalsContainer = document.createElement('div');
  totalsContainer.style.display = 'flex';
  totalsContainer.style.flexDirection = 'row';
  totalsContainer.style.alignItems = 'flex-end';
  totalsContainer.style.justifyContent = 'space-between';
  totalsContainer.style.gap = SPACING.MD;
  totalsContainer.style.textAlign = 'right';

  // Total Income (Left side)
  const totalIncomeContainer = document.createElement('div');
  totalIncomeContainer.style.display = 'flex';
  totalIncomeContainer.style.flexDirection = 'column';
  totalIncomeContainer.style.alignItems = 'flex-start';

  const totalIncomeLabel = document.createElement('span');
  totalIncomeLabel.textContent = 'Total Income';
  totalIncomeLabel.style.fontSize = '0.875rem';
  totalIncomeLabel.style.color = COLORS.TEXT_MUTED;
  totalIncomeLabel.style.marginBottom = '2px';

  const totalIncomeValue = document.createElement('span');
  const totalIncome = currentData.incomeVsExpenses?.totalIncome || 0;
  totalIncomeValue.textContent = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
  }).format(totalIncome);
  totalIncomeValue.style.fontSize = '1.25rem';
  totalIncomeValue.style.fontWeight = 'bold';
  totalIncomeValue.style.color = COLORS.INCOME_COLOR; // Green color for income

  totalIncomeContainer.appendChild(totalIncomeLabel);
  totalIncomeContainer.appendChild(totalIncomeValue);

  // Total Spent (Right side)
  const totalSpentContainer = document.createElement('div');
  totalSpentContainer.style.display = 'flex';
  totalSpentContainer.style.flexDirection = 'column';
  totalSpentContainer.style.alignItems = 'flex-end';

  const totalSpentLabel = document.createElement('span');
  totalSpentLabel.textContent = 'Total Spent';
  totalSpentLabel.style.fontSize = '0.875rem';
  totalSpentLabel.style.color = COLORS.TEXT_MUTED;
  totalSpentLabel.style.marginBottom = '2px';

  const totalSpentValue = document.createElement('span');
  const totalSpent = (categoryData?.categories || []).reduce(
    (sum, cat) => sum + cat.amount,
    0
  );
  totalSpentValue.textContent = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(totalSpent);
  totalSpentValue.style.fontSize = '1.25rem';
  totalSpentValue.style.fontWeight = 'bold';
  totalSpentValue.style.color = COLORS.PRIMARY;

  totalSpentContainer.appendChild(totalSpentLabel);
  totalSpentContainer.appendChild(totalSpentValue);

  totalsContainer.appendChild(totalIncomeContainer);
  totalsContainer.appendChild(totalSpentContainer);

  header.appendChild(title);
  header.appendChild(totalsContainer);
  section.appendChild(header);

  // Chart container - fixed height
  const chartDiv = document.createElement('div');
  chartDiv.style.position = 'relative';
  chartDiv.style.height = '400px';
  chartDiv.style.marginBottom = SPACING.MD;
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
  detailsContainer.style.padding = SPACING.MD;
  detailsContainer.style.marginTop = SPACING.SM;
  detailsContainer.style.display = 'block'; // Always visible
  detailsContainer.style.minHeight = '60px'; // Prevent jumping
  detailsContainer.style.maxHeight = '60px'; // Prevent expansion
  detailsContainer.style.overflow = 'hidden'; // Hide overflow
  detailsContainer.style.transition = 'none'; // Remove any transitions that might cause expansion

  // Add default instruction text
  const initialAction = window.innerWidth < 768 ? 'Tap' : 'Hover';
  detailsContainer.innerHTML = `
        <div style="text-align: center; color: var(--color-text-muted); font-size: 0.9em;">
            ${initialAction} on a category slice to see details
        </div>
    `;

  section.appendChild(detailsContainer);

  // Get consistent colors for all categories
  const categoryColors = getCategoryColors(
    categoryData.categories,
    categoryColorMap
  );

  const chartData = {
    labels: categoryData.categories.map(cat => cat.name),
    datasets: [
      {
        data: categoryData.categories.map(cat => cat.amount),
        backgroundColor: categoryColors,
        borderColor: COLORS.SURFACE,
        borderWidth: 0,
      },
    ],
  };

  // Create initial pie chart with responsive legend
  const legendPosition = window.innerWidth < 768 ? 'bottom' : 'right';
  const categoryCount = categoryData.categories.length;

  // Adjust legend settings based on category count
  const legendFontSize = categoryCount > 15 ? 10 : categoryCount > 10 ? 11 : 12;
  const legendPadding = categoryCount > 15 ? 6 : categoryCount > 10 ? 8 : 10;
  const legendBoxWidth = categoryCount > 15 ? 12 : 15;

  const currentChart = await chartRenderer.createPieChart(canvas, chartData, {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 10,
        bottom: 10,
        left: legendPosition === 'right' ? 10 : 0,
        right: legendPosition === 'right' ? 10 : 0,
      },
    },
    plugins: {
      legend: {
        position: legendPosition,
        align: 'start',
        labels: {
          boxWidth: legendBoxWidth,
          padding: legendPadding,
          font: {
            size: legendFontSize,
          },
          generateLabels: chart => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const meta = chart.getDatasetMeta(0);
                const style = meta.controller.getStyle(i);
                return {
                  text: label,
                  fillStyle: style.backgroundColor,
                  strokeStyle: style.borderColor,
                  lineWidth: style.borderWidth,
                  hidden: !chart.getDataVisibility(i),
                  index: i,
                };
              });
            }
            return [];
          },
        },
        // Remove max height/width constraints to allow legend to expand naturally
        maxHeight: undefined,
        maxWidth: undefined,
      },
      tooltip: createCategoryTooltipConfig(detailsContainer),
    },
  });

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

  // Chart container
  const chartDiv = document.createElement('div');
  chartDiv.style.position = 'relative';
  chartDiv.style.width = '100%';
  chartDiv.style.height = '400px';
  chartDiv.style.marginBottom = '0';
  chartDiv.style.padding = SPACING.SM;
  chartDiv.style.paddingBottom = `calc(${SPACING.SM} + 20px)`;
  chartDiv.style.boxSizing = 'border-box';
  chartDiv.style.overflow = 'visible';

  const canvas = document.createElement('canvas');
  canvas.id = 'income-expense-chart';
  canvas.style.width = '100%';
  canvas.style.height = '400px';
  canvas.style.maxWidth = '100%';
  canvas.style.display = 'block';
  chartDiv.appendChild(canvas);
  section.appendChild(chartDiv);

  // Prepare chart data
  const incomeExpenseData = currentData.incomeVsExpenses;
  const chartData = {
    labels: ['Income', 'Expenses', 'Net Balance'],
    datasets: [
      {
        label: 'Amount (€)',
        data: [
          incomeExpenseData.totalIncome,
          incomeExpenseData.totalExpenses,
          Math.abs(incomeExpenseData.netBalance),
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          incomeExpenseData.netBalance >= 0
            ? 'rgba(34, 197, 94, 0.6)'
            : 'rgba(239, 68, 68, 0.6)',
        ],
        borderColor: [
          COLORS.INCOME_COLOR,
          'rgba(239, 68, 68, 1)',
          incomeExpenseData.netBalance >= 0
            ? COLORS.INCOME_COLOR
            : 'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chart = await chartRenderer.createBarChart(canvas, chartData, {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        position: 'nearest',
        yAlign: 'auto',
        padding: 20,
        caretSize: 8,
        caretPadding: 10,
      },
    },
  });

  return { section, chart };
}

/**
 * Create category trends over time chart
 */
export async function createCategoryTrendsChart(
  chartRenderer,
  currentData,
  categoryColorMap
) {
  // Get historical data for trends
  const allTransactions = TransactionService.getAll();

  // Check if we have enough historical data (at least 3 months)
  const oldestTransaction = allTransactions.reduce((oldest, transaction) => {
    const transactionDate = new Date(transaction.date || transaction.timestamp);
    return transactionDate < oldest ? transactionDate : oldest;
  }, new Date());

  // Calculate months more accurately using calendar months
  const now = new Date();
  const monthsOfData =
    (now.getFullYear() - oldestTransaction.getFullYear()) * 12 +
    (now.getMonth() - oldestTransaction.getMonth());

  if (monthsOfData < 3) {
    // Render informative message instead of null
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chart-section';
    messageDiv.style.cssText = `
      text-align: center;
      padding: ${SPACING.XL};
      color: ${COLORS.TEXT_MUTED};
      font-size: 0.875rem;
      line-height: 1.5;
      background: ${COLORS.SURFACE};
      border-radius: var(--radius-lg);
    `;

    const icon = document.createElement('div');
    icon.style.cssText = `
      font-size: 2rem;
      margin-bottom: ${SPACING.MD};
    `;
    icon.textContent = '📈';

    const title = document.createElement('h3');
    title.textContent = 'Category Trends';
    title.style.cssText = `
      margin: 0 0 ${SPACING.SM} 0;
      color: ${COLORS.TEXT_MAIN};
      font-weight: 600;
    `;

    const message = document.createElement('p');
    message.textContent = `Category trends will appear here after ${3 - monthsOfData} more month${3 - monthsOfData === 1 ? '' : 's'} of transaction data. Trends need at least 3 months of history to show meaningful patterns.`;
    message.style.cssText = `
      margin: 0;
      line-height: 1.6;
    `;

    messageDiv.appendChild(icon);
    messageDiv.appendChild(title);
    messageDiv.appendChild(message);

    return { section: messageDiv, chart: null };
  }

  const section = document.createElement('div');
  section.className = 'chart-section';
  section.style.background = COLORS.SURFACE;
  section.style.borderRadius = 'var(--radius-lg)';
  section.style.padding = SPACING.MD;

  const title = document.createElement('h3');
  title.textContent = 'Category Trends Over Time';
  title.style.margin = `0 0 ${SPACING.MD} 0`;
  title.style.color = COLORS.TEXT_MAIN;
  section.appendChild(title);

  const chartDiv = document.createElement('div');
  chartDiv.style.position = 'relative';
  chartDiv.style.height = '350px';

  const canvas = document.createElement('canvas');
  canvas.id = 'category-trends-chart';
  chartDiv.appendChild(canvas);
  section.appendChild(chartDiv);

  // Generate monthly data for top 6 categories
  const topCategories = currentData.categoryBreakdown.categories.slice(0, 99);
  const monthlyData = generateMonthlyTrendData(allTransactions, topCategories);

  // Filter out the current month to avoid incomplete data skewing the chart
  const currentMonthKey = now.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  const filteredMonths = monthlyData.months.filter(
    month => month !== currentMonthKey
  );
  const filteredCategoryData = {};

  topCategories.forEach(category => {
    filteredCategoryData[category.name] = (
      monthlyData.categoryData[category.name] || []
    ).filter((_value, index) => monthlyData.months[index] !== currentMonthKey);
  });

  const chartData = {
    labels: filteredMonths,
    datasets: topCategories.map((category, index) => ({
      label: category.name,
      data: filteredCategoryData[category.name] || [],
      borderColor:
        categoryColorMap.get(category.name) ||
        getChartColors(topCategories.length)[index],
      backgroundColor: (
        categoryColorMap.get(category.name) ||
        getChartColors(topCategories.length)[index]
      )
        .replace(')', ', 0.1)')
        .replace('hsl', 'hsla'),
      borderWidth: 3,
      fill: false,
      tension: 0.4,
      hidden: index >= 6, // Hide categories beyond the top 6 to prevent clutter, but keep in legend
    })),
  };

  const chart = await chartRenderer.createLineChart(canvas, chartData, {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  });

  return { section, chart };
}

/**
 * Helper functions for chart creation
 */
// function createToggleButton(text, active = false) {
//   const button = document.createElement('button');
//   button.textContent = text;
//   button.style.padding = `${SPACING.XS} ${SPACING.SM}`;
//   button.style.border = `1px solid ${COLORS.BORDER}`;
//   button.style.borderRadius = 'var(--radius-sm)';
//   button.style.background = active ? COLORS.PRIMARY : 'transparent';
//   button.style.color = active ? 'white' : COLORS.TEXT_MAIN;
//   button.style.cursor = 'pointer';
//   button.style.fontSize = '0.875rem';
//   button.style.transition = 'all 0.2s ease';

//   if (active) {
//     button.classList.add('active');
//   }

//   return button;
// }

// Migrated import to top

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
