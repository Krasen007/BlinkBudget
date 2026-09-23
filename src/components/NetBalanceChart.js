/**
 * NetBalanceChart Component
 *
 * Displays a line chart showing the net balance at the end of each month
 * and the net worth at the start of each month for the last 6 months.
 * This is rendered under the Financial Planning section in Insights.
 *
 * Requirements: 7.5 - Financial insights and visualizations
 */

import { TransactionService } from '../core/transaction-service.js';
import { ChartRenderer, showChartFallback } from './ChartRenderer.js';
import { formatCurrency } from '../utils/financial-planning-helpers.js';
import {
  INSIGHTS_CHART_COLORS,
  createInsightsScales,
  createInsightsTooltipCallbacks,
} from './financial-planning/insights-chart-theme.js';

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
 * Shows the last 5 completed months of net balance (end of month) and net
 * worth (end of month).
 * @param {Array} [transactions=null] - Transactions to chart; falls back to
 *   TransactionService when omitted
 * @param {Object} [renderer=null] - Chart renderer; falls back to a private one
 * @returns {Promise<{ element: HTMLElement, cleanup: Function }>}
 */
export async function createNetBalanceChart(
  transactions = null,
  renderer = null
) {
  const section = document.createElement('div');
  // Shared insights card shell (background / border / radius from .card)
  section.className = 'card insights-card net-balance-card';
  section.setAttribute('data-chart-type', 'net-balance');

  const chartRenderer = renderer || new ChartRenderer();
  let chartInstance = null;

  const cleanup = () => {
    if (chartInstance) {
      chartRenderer.destroyChart(chartInstance);
      chartInstance = null;
    }
  };

  // Section header — shared insights card markup
  const header = document.createElement('div');
  header.className = 'insights-card-header';

  const titleWrapper = document.createElement('div');
  titleWrapper.className = 'insights-card-title-group';

  const title = document.createElement('h3');
  title.className = 'insights-card-title';
  title.textContent = 'Net Balance Over Time';

  const subtitle = document.createElement('p');
  subtitle.className = 'insights-card-subtitle';
  subtitle.textContent =
    'Last 5 completed months — net earned vs net worth accumulated by month end';

  titleWrapper.appendChild(title);
  titleWrapper.appendChild(subtitle);
  header.appendChild(titleWrapper);
  section.appendChild(header);

  // Prefer the section's cached transactions; fall back to storage
  const allTransactions = Array.isArray(transactions)
    ? transactions
    : TransactionService.getAll();

  if (!allTransactions || allTransactions.length === 0) {
    // Show empty state
    const emptyState = document.createElement('p');
    emptyState.className = 'insights-empty-note';
    emptyState.textContent =
      'Add transactions to see your net balance trend over time.';
    section.appendChild(emptyState);
    return { element: section, cleanup };
  }

  // Generate last 6 months of data
  const now = new Date();
  const months = [];
  const netBalanceData = [];
  const netWorthData = [];
  const labels = [];

  // Start from i=5 to i=1 (exclude current month — data is incomplete)
  for (let i = 5; i >= 1; i--) {
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

  // Chart container — fluid height + canvas sizing from insights-charts.css
  const chartDiv = document.createElement('div');
  chartDiv.className = 'insights-chart-area';

  const canvas = document.createElement('canvas');
  canvas.id = 'net-balance-chart';
  chartDiv.appendChild(canvas);
  section.appendChild(chartDiv);

  // Legend
  const legendContainer = document.createElement('div');
  legendContainer.className = 'insights-legend';

  // Net Balance legend item
  const netBalanceLegend = createLegendItem(
    'Net Balance (End of Month)',
    INSIGHTS_CHART_COLORS.netBalance
  );
  legendContainer.appendChild(netBalanceLegend);

  // Net Worth legend item
  const netWorthLegend = createLegendItem(
    'Net Worth (End of Month)',
    INSIGHTS_CHART_COLORS.netWorth
  );
  legendContainer.appendChild(netWorthLegend);

  section.appendChild(legendContainer);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Net Balance (End of Month)',
        data: netBalanceData,
        borderColor: INSIGHTS_CHART_COLORS.netBalance,
        backgroundColor: INSIGHTS_CHART_COLORS.netBalanceFill,
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: INSIGHTS_CHART_COLORS.netBalance,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
      {
        label: 'Net Worth (End of Month)',
        data: netWorthData,
        borderColor: INSIGHTS_CHART_COLORS.netWorth,
        backgroundColor: INSIGHTS_CHART_COLORS.netWorthFill,
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: INSIGHTS_CHART_COLORS.netWorth,
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
      scales: createInsightsScales(),
      plugins: {
        legend: {
          display: false, // Using custom legend
        },
        tooltip: {
          callbacks: {
            ...createInsightsTooltipCallbacks(),
            label: context => {
              const label = context.dataset.label || '';
              return ` ${label}: ${formatCurrency(context.parsed.y)}`;
            },
          },
        },
      },
    });

    // Keep the instance for cleanup()
    chartInstance = chart;
  } catch (error) {
    console.error('[NetBalanceChart] Failed to create chart:', error);
    legendContainer.remove();
    showChartFallback(
      chartDiv,
      'Unable to render net balance chart. Please try refreshing this section.'
    );
  }

  return { element: section, cleanup };
}

/**
 * Create a legend item element
 * @param {string} label - Legend text
 * @param {string} color - Dot color
 * @returns {HTMLElement}
 */
function createLegendItem(label, color) {
  const item = document.createElement('div');
  item.className = 'insights-legend-item';

  const dot = document.createElement('span');
  dot.className = 'insights-legend-dot';
  dot.setAttribute('aria-hidden', 'true');
  dot.style.backgroundColor = color; // dynamic palette value → inline is fine

  const text = document.createElement('span');
  text.className = 'insights-legend-text';
  text.textContent = label;

  item.append(dot, text);

  return item;
}
