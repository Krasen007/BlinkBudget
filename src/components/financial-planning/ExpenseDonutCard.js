/**
 * ExpenseDonutCard Component
 *
 * Displays:
 * - Card header with title "EXPENSE" and period selector ("THIS MONTH" default)
 * - Donut chart with category breakdown and center total amount
 * - Category/Tag list with colored swatches, amounts, and "1 - 5 of N  SEE ALL ›" toggle
 */

import { CATEGORY_COLORS } from '../../utils/constants.js';
import {
  filterTransactionsByPeriod,
  formatMetricNumber,
} from './InsightsSummaryBar.js';
import {
  INSIGHTS_CHART_COLORS,
  createInsightsTooltipCallbacks,
} from './insights-chart-theme.js';

// Fallback palette if category doesn't have an explicit color
const FALLBACK_PALETTE = [
  '#f19317',
  '#22c55e',
  '#3b82f6',
  '#a855f7',
  '#f97316',
  '#ef4444',
  '#8b5cf6',
  '#0ea5e9',
  '#10b981',
  '#06b6d4',
  '#fb923c',
  '#ec4899',
  '#eab308',
  '#6366f1',
];

/**
 * Aggregate expenses by category for a list of transactions
 * @param {Array} transactions
 * @returns {Array<{ name: string, amount: number, color: string }>}
 */
export function aggregateCategoryExpenses(transactions = []) {
  const categoryMap = new Map();

  transactions.forEach(t => {
    if (t.isGhost) return;
    const cat = t.category || t.tag || 'Други';
    const amt = typeof t.amount === 'number' ? t.amount : Number(t.amount) || 0;

    let delta = 0;
    if (t.type === 'expense') delta = amt;
    else if (t.type === 'refund') delta = -amt;

    if (delta !== 0) {
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + delta);
    }
  });

  const categories = [];
  categoryMap.forEach((amt, name) => {
    if (amt > 0) {
      categories.push({ name, amount: amt });
    }
  });

  categories.sort((a, b) => b.amount - a.amount);

  return categories.map((cat, idx) => ({
    ...cat,
    color:
      CATEGORY_COLORS[cat.name] ||
      FALLBACK_PALETTE[idx % FALLBACK_PALETTE.length],
  }));
}

/**
 * ExpenseDonutCard Component
 * @param {Object} props
 * @param {Array} props.transactions
 * @param {Object} props.chartRenderer
 * @param {string} [props.initialPeriod='this-month']
 * @param {Function} [props.onPeriodChange]
 * @returns {{ element: HTMLElement, update: Function, cleanup: Function }}
 */
export const ExpenseDonutCard = ({
  transactions = [],
  chartRenderer,
  initialPeriod = 'this-month',
  onPeriodChange = null,
}) => {
  const card = document.createElement('div');
  card.className = 'card insights-card expense-donut-card';

  let currentPeriod = initialPeriod;
  let currentTransactions = transactions;
  let isExpanded = false;
  let chartInstance = null;
  const PAGE_SIZE = 5;

  // Header
  const header = document.createElement('div');
  header.className = 'insights-card-header';

  const titleGroup = document.createElement('div');
  titleGroup.className = 'insights-card-title-group';
  const title = document.createElement('h3');
  title.className = 'insights-card-title';
  title.textContent = 'EXPENSE';
  titleGroup.appendChild(title);
  header.appendChild(titleGroup);

  const actions = document.createElement('div');
  actions.className = 'insights-card-actions';

  // Period Selector Dropdown (compact variant of the global .view-select)
  const periodSelect = document.createElement('select');
  periodSelect.className = 'insights-select view-select';
  periodSelect.setAttribute('aria-label', 'Select expense time period');
  periodSelect.innerHTML = `
    <option value="this-month">📅 THIS MONTH</option>
    <option value="this-year">📅 THIS YEAR</option>
    <option value="last-month">📅 LAST MONTH</option>
    <option value="last-year">📅 LAST YEAR</option>
    <option value="all-time">📅 ALL TIME</option>
  `;
  periodSelect.value = currentPeriod;
  periodSelect.addEventListener('change', () => {
    currentPeriod = periodSelect.value;
    render();
    if (onPeriodChange) onPeriodChange(currentPeriod);
  });
  actions.appendChild(periodSelect);

  header.appendChild(actions);
  card.appendChild(header);

  // Donut Chart Container
  const donutWrapper = document.createElement('div');
  donutWrapper.className = 'donut-wrapper';

  const canvas = document.createElement('canvas');
  canvas.id = 'insights-expense-donut-chart';
  donutWrapper.appendChild(canvas);

  const centerOverlay = document.createElement('div');
  centerOverlay.className = 'donut-center-total';
  const centerAmount = document.createElement('div');
  centerAmount.className = 'donut-center-amount';
  centerOverlay.appendChild(centerAmount);
  donutWrapper.appendChild(centerOverlay);

  card.appendChild(donutWrapper);

  // Category List Container
  const tableContainer = document.createElement('div');
  tableContainer.className = 'expense-tag-table';
  card.appendChild(tableContainer);

  function renderCategoryList(categories, totalExpense) {
    tableContainer.innerHTML = '';

    const listHeader = document.createElement('div');
    listHeader.className = 'expense-tag-header';
    listHeader.innerHTML = `
      <span>TAG</span>
      <span>Expense</span>
    `;
    tableContainer.appendChild(listHeader);

    if (categories.length === 0) {
      const emptyRow = document.createElement('div');
      emptyRow.className = 'expense-tag-row expense-tag-row--empty';
      emptyRow.textContent = 'No expenses for this period';
      tableContainer.appendChild(emptyRow);
      return;
    }

    const visibleItems = isExpanded
      ? categories
      : categories.slice(0, PAGE_SIZE);

    visibleItems.forEach(cat => {
      const row = document.createElement('div');
      row.className = 'expense-tag-row';

      const info = document.createElement('div');
      info.className = 'tag-info';

      const dot = document.createElement('span');
      dot.className = 'tag-color-dot';
      dot.style.backgroundColor = cat.color;

      const name = document.createElement('span');
      name.className = 'tag-name';
      name.textContent = cat.name;

      info.appendChild(dot);
      info.appendChild(name);

      const amount = document.createElement('span');
      amount.className = 'tag-amount';
      amount.textContent = `- ${formatMetricNumber(cat.amount)}`;

      row.appendChild(info);
      row.appendChild(amount);
      tableContainer.appendChild(row);
    });

    if (categories.length > PAGE_SIZE) {
      const footer = document.createElement('div');
      footer.className = 'expense-tag-footer';

      const count = document.createElement('span');
      const shownCount = isExpanded ? categories.length : PAGE_SIZE;
      count.textContent = `1 - ${shownCount} of ${categories.length}`;

      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'see-all-btn';
      toggleBtn.textContent = isExpanded ? 'SHOW LESS ‹' : 'SEE ALL ›';
      toggleBtn.addEventListener('click', () => {
        isExpanded = !isExpanded;
        renderCategoryList(categories, totalExpense);
      });

      footer.appendChild(count);
      footer.appendChild(toggleBtn);
      tableContainer.appendChild(footer);
    }
  }

  function render() {
    const periodTx = filterTransactionsByPeriod(
      currentTransactions,
      currentPeriod
    );
    const categories = aggregateCategoryExpenses(periodTx);
    const totalExpense = categories.reduce((sum, c) => sum + c.amount, 0);

    centerAmount.textContent = formatMetricNumber(totalExpense);
    renderCategoryList(categories, totalExpense);

    if (chartRenderer) {
      const labels = categories.map(c => c.name);
      const data = categories.map(c => c.amount);
      const bgColors = categories.map(c => c.color);

      const chartData = {
        labels: labels.length > 0 ? labels : ['No Data'],
        datasets: [
          {
            data: data.length > 0 ? data : [1],
            backgroundColor:
              bgColors.length > 0
                ? bgColors
                : [INSIGHTS_CHART_COLORS.surfaceHover],
            borderWidth: 2,
            borderColor: INSIGHTS_CHART_COLORS.surface,
            hoverBorderWidth: 3,
            hoverOffset: 4,
          },
        ],
      };

      chartRenderer
        .createDoughnutChart(canvas, chartData, {
          cutout: '68%',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }, // the tag list below acts as the legend
            tooltip: {
              enabled: categories.length > 0,
              callbacks: {
                ...createInsightsTooltipCallbacks(),
                label: context => {
                  const val = context.raw || 0;
                  const pct =
                    totalExpense > 0
                      ? ((val / totalExpense) * 100).toFixed(1)
                      : '0';
                  return ` ${context.label}: - ${formatMetricNumber(val)} (${pct}%)`;
                },
              },
            },
          },
        })
        .then(chart => {
          chartInstance = chart;
        })
        .catch(err => {
          console.error('[ExpenseDonutCard] Chart creation failed:', err);
        });
    }
  }

  render();

  return {
    element: card,
    update: (newPeriod, newTransactions) => {
      if (newPeriod) {
        currentPeriod = newPeriod;
        periodSelect.value = newPeriod;
      }
      if (newTransactions) {
        currentTransactions = newTransactions;
      }
      render();
    },
    cleanup: () => {
      if (chartRenderer && chartInstance) {
        chartRenderer.destroyChart(canvas.id);
        chartInstance = null;
      }
    },
  };
};
