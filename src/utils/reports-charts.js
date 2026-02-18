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

  // Total amount display
  const totalAmount = document.createElement('div');
  totalAmount.style.display = 'flex';
  totalAmount.style.flexDirection = 'column';
  totalAmount.style.alignItems = 'flex-end';
  totalAmount.style.textAlign = 'right';

  const totalLabel = document.createElement('span');
  totalLabel.textContent = 'Total Spent';
  totalLabel.style.fontSize = '0.875rem';
  totalLabel.style.color = COLORS.TEXT_MUTED;
  totalLabel.style.marginBottom = '2px';

  const totalValue = document.createElement('span');
  const totalSpent = categoryData.categories.reduce(
    (sum, cat) => sum + cat.amount,
    0
  );
  totalValue.textContent = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(totalSpent);
  totalValue.style.fontSize = '1.25rem';
  totalValue.style.fontWeight = 'bold';
  totalValue.style.color = COLORS.PRIMARY;

  totalAmount.appendChild(totalLabel);
  totalAmount.appendChild(totalValue);

  header.appendChild(title);
  header.appendChild(totalAmount);
  section.appendChild(header);

  // Chart container
  const chartDiv = document.createElement('div');
  chartDiv.style.position = 'relative';
  chartDiv.style.height = '400px';
  chartDiv.style.marginBottom = SPACING.MD;

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

  // Create initial pie chart
  const currentChart = await chartRenderer.createPieChart(canvas, chartData, {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: window.innerWidth < 768 ? 'bottom' : 'right',
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
          'rgba(34, 197, 94, 1)',
          'rgba(239, 68, 68, 1)',
          incomeExpenseData.netBalance >= 0
            ? 'rgba(34, 197, 94, 1)'
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

  const monthsOfData = Math.floor(
    (new Date() - oldestTransaction) / (1000 * 60 * 60 * 24 * 30)
  );

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

  // Generate monthly data for top 3 categories
  const topCategories = currentData.categoryBreakdown.categories.slice(0, 3);
  const monthlyData = generateMonthlyTrendData(allTransactions, topCategories);

  const chartData = {
    labels: monthlyData.months,
    datasets: topCategories.map((category, index) => ({
      label: category.name,
      data: monthlyData.categoryData[category.name] || [],
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
  // Update map with colors for all categories
  categories.forEach(category => {
    if (!categoryColorMap.has(category.name)) {
      categoryColorMap.set(category.name, getColorForCategory(category.name));
    }
  });

  return categories.map(category => categoryColorMap.get(category.name));
}
