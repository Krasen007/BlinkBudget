/**
 * NetBalanceChart Component
 *
 * Displays a line chart showing the net balance at the end of each month
 * and the net worth at the start of each month for the last 6 months.
 * This is rendered under the Financial Planning section in Insights.
 *
 * Requirements: 7.5 - Financial insights and visualizations
 */

import { COLORS, SPACING } from '../utils/constants.js';
import { TransactionService } from '../core/transaction-service.js';
import { ChartRenderer } from './ChartRenderer.js';

/**
 * Get the start of a month for a given date
 * @param {Date} date
 * @returns {Date}
 */
function getMonthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

/**
 * Get the end of a month for a given date
 * @param {Date} date
 * @returns {Date}
 */
function getMonthEnd(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * Format a month label for display
 * @param {number} year
 * @param {number} month (0-based)
 * @returns {string}
 */
function formatMonthLabel(year, month) {
  const date = new Date(year, month, 1);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Calculate net balance for a given time period
 * Matches MetricsService.calculateIncomeVsExpenses logic exactly:
 * - Income: sum of all income amounts
 * - Expenses: sum of expense amounts minus refund amounts (per category)
 * - Transfers are excluded
 * - Ghost transactions are excluded
 * @param {Array} transactions
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {number}
 */
function calculateNetBalance(transactions, startDate, endDate) {
  const filtered = transactions.filter(t => {
    if (t.isGhost) return false;
    const tDate = new Date(t.date || t.timestamp);
    return tDate >= startDate && tDate <= endDate;
  });

  let totalIncome = 0;

  // Build per-category expense totals (same logic as MetricsService)
  const categoryTotals = Object.create(null);

  filtered.forEach(t => {
    const amount = Math.abs(t.amount || 0);

    switch (t.type) {
      case 'income':
        totalIncome += amount;
        break;
      case 'expense': {
        const cat = t.category || 'Uncategorized';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + amount;
        break;
      }
      case 'refund': {
        const cat = t.category || 'Uncategorized';
        categoryTotals[cat] = (categoryTotals[cat] || 0) - amount;
        break;
      }
      case 'transfer':
        // Transfers don't affect income/expense calculation
        break;
      default:
        // Unknown types treated as expenses
        categoryTotals['Uncategorized'] =
          (categoryTotals['Uncategorized'] || 0) + amount;
    }
  });

  // Sum all per-category net amounts
  const totalExpenses = Object.values(categoryTotals).reduce(
    (sum, net) => sum + net,
    0
  );

  return totalIncome - totalExpenses;
}

/**
 * Calculate cumulative net worth up to and including a given date
 * Net Worth = Sum of all income - sum of all net expenses from all time up to endDate
 * Matches the Dashboard's "Total Available" calculation exactly:
 * - Uses t.amount directly (not Math.abs) to match how amounts are stored
 * - Income: adds t.amount
 * - Expense: adds t.amount (deducted from total)
 * - Refund: subtracts t.amount (reduces deduction)
 * - Transfers: excluded (they net to zero across all accounts)
 * - Ghost transactions: excluded
 * @param {Array} transactions
 * @param {Date} endDate - inclusive upper bound
 * @returns {number}
 */
function calculateNetWorth(transactions, endDate) {
  const filtered = transactions.filter(t => {
    if (t.isGhost) return false;
    const tDate = new Date(t.date || t.timestamp);
    return tDate <= endDate;
  });

  let totalIncome = 0;
  let totalExpense = 0;

  filtered.forEach(t => {
    // Match Dashboard's exact logic: use t.amount directly
    if (t.type === 'income') totalIncome += t.amount;
    if (t.type === 'expense') totalExpense += t.amount;
    if (t.type === 'refund') totalExpense -= t.amount;
    // Transfers are excluded (they net to zero across all accounts)
  });

  return totalIncome - totalExpense;
}

/**
 * Create the Net Balance over time chart section
 * Shows last 6 months of net balance (end of month) and net worth (start of month)
 * @returns {Promise<HTMLElement>} The chart section element
 */
export async function createNetBalanceChart() {
  const section = document.createElement('div');
  section.className = 'chart-section net-balance-chart-section';
  section.setAttribute('data-chart-type', 'net-balance');
  section.style.background = COLORS.SURFACE;
  section.style.borderRadius = 'var(--radius-lg)';
  section.style.padding = SPACING.MD;
  section.style.marginTop = SPACING.LG;

  // Section header
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = SPACING.MD;

  const titleWrapper = document.createElement('div');

  const title = document.createElement('h3');
  title.textContent = 'Net Balance Over Time';
  title.style.margin = '0 0 4px 0';
  title.style.color = COLORS.TEXT_MAIN;

  const subtitle = document.createElement('p');
  subtitle.textContent =
    'Last 6 months — Net balance earned vs net worth accumulated by month end';
  subtitle.style.margin = '0';
  subtitle.style.fontSize = '0.8125rem';
  subtitle.style.color = COLORS.TEXT_MUTED;

  titleWrapper.appendChild(title);
  titleWrapper.appendChild(subtitle);
  header.appendChild(titleWrapper);
  section.appendChild(header);

  // Get all transactions
  const allTransactions = TransactionService.getAll();

  if (!allTransactions || allTransactions.length === 0) {
    // Show empty state
    const emptyState = document.createElement('div');
    emptyState.style.textAlign = 'center';
    emptyState.style.padding = SPACING.XL;
    emptyState.style.color = COLORS.TEXT_MUTED;
    emptyState.style.fontSize = '0.875rem';
    emptyState.textContent =
      'Add transactions to see your net balance trend over time.';
    section.appendChild(emptyState);
    return section;
  }

  // Generate last 6 months of data
  const now = new Date();
  const months = [];
  const netBalanceData = [];
  const netWorthData = [];
  const labels = [];

  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = getMonthStart(monthDate);
    const monthEnd = getMonthEnd(monthDate);

    labels.push(
      formatMonthLabel(monthDate.getFullYear(), monthDate.getMonth())
    );

    // Net balance at end of this month
    const netBalance = calculateNetBalance(
      allTransactions,
      monthStart,
      monthEnd
    );
    netBalanceData.push(netBalance);

    // Net worth at end of this month (cumulative up to and including month end)
    const netWorth = calculateNetWorth(allTransactions, monthEnd);
    netWorthData.push(netWorth);

    months.push(monthDate);
  }

  // Chart container
  const chartDiv = document.createElement('div');
  chartDiv.style.position = 'relative';
  chartDiv.style.width = '100%';
  chartDiv.style.height = '300px';

  const canvas = document.createElement('canvas');
  canvas.id = 'net-balance-chart';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  chartDiv.appendChild(canvas);
  section.appendChild(chartDiv);

  // Legend
  const legendContainer = document.createElement('div');
  legendContainer.style.display = 'flex';
  legendContainer.style.justifyContent = 'center';
  legendContainer.style.gap = SPACING.XL;
  legendContainer.style.marginTop = SPACING.SM;
  legendContainer.style.flexWrap = 'wrap';

  // Net Balance legend item
  const netBalanceLegend = createLegendItem(
    'Net Balance (End of Month)',
    'hsl(150, 70%, 45%)'
  );
  legendContainer.appendChild(netBalanceLegend);

  // Net Worth legend item
  const netWorthLegend = createLegendItem(
    'Net Worth (End of Month)',
    'hsl(250, 84%, 60%)'
  );
  legendContainer.appendChild(netWorthLegend);

  section.appendChild(legendContainer);

  // Create the chart
  const chartRenderer = new ChartRenderer();

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Net Balance (End of Month)',
        data: netBalanceData,
        borderColor: 'hsl(150, 70%, 45%)',
        backgroundColor: 'hsla(150, 70%, 45%, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: 'hsl(150, 70%, 45%)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
      {
        label: 'Net Worth (End of Month)',
        data: netWorthData,
        borderColor: 'hsl(250, 84%, 60%)',
        backgroundColor: 'hsla(250, 84%, 60%, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: 'hsl(250, 84%, 60%)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  };

  try {
    const chart = await chartRenderer.createLineChart(canvas, chartData, {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'hsla(240, 5%, 65%, 0.15)',
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
            display: false,
          },
        },
      },
      plugins: {
        legend: {
          display: false, // Using custom legend
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              const formattedValue = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'EUR',
              }).format(value);
              return `${label}: ${formattedValue}`;
            },
          },
        },
      },
    });

    // Store chart reference for cleanup
    section._chart = chart;
  } catch (error) {
    console.error('[NetBalanceChart] Failed to create chart:', error);
    const errorMsg = document.createElement('div');
    errorMsg.style.textAlign = 'center';
    errorMsg.style.padding = SPACING.MD;
    errorMsg.style.color = COLORS.ERROR;
    errorMsg.textContent = 'Unable to render net balance chart.';
    section.appendChild(errorMsg);
  }

  return section;
}

/**
 * Create a legend item element
 * @param {string} label
 * @param {string} color
 * @returns {HTMLElement}
 */
function createLegendItem(label, color) {
  const item = document.createElement('div');
  item.style.display = 'flex';
  item.style.alignItems = 'center';
  item.style.gap = '8px';
  item.style.fontSize = '0.8125rem';
  item.style.color = COLORS.TEXT_MUTED;

  const dot = document.createElement('span');
  dot.style.width = '10px';
  dot.style.height = '10px';
  dot.style.borderRadius = '50%';
  dot.style.backgroundColor = color;
  dot.style.flexShrink = '0';

  const text = document.createElement('span');
  text.textContent = label;

  item.appendChild(dot);
  item.appendChild(text);

  return item;
}
