/**
 * TrendBarChartCard Component
 *
 * Displays:
 * - Header: "ТЕНДЕНЦИЯ • ДОХОД vs РАЗХОД" with grain selector ("МЕСЕЦ" default / "ГОДИНА") and export button
 * - Single-column diverging Bar Chart with:
 *   - Green bar pointing UP for Income and red/coral bar pointing DOWN for
 *     Expenses sharing the same column per period (stacked on one stack so
 *     both stay centered on the zero line)
 *   - Cyan line overlay for Net (Income - Expense)
 */

import { formatMetricNumber } from './InsightsSummaryBar.js';
import {
  INSIGHTS_CHART_COLORS,
  createInsightsScales,
  createInsightsTooltipCallbacks,
} from './insights-chart-theme.js';

/**
 * Aggregate trend data by year or month
 * @param {Array} transactions
 * @param {'year' | 'month'} grain
 * @returns {{ labels: string[], income: number[], expense: number[], net: number[] }}
 */
export function aggregateTrendData(transactions = [], grain = 'year') {
  const buckets = new Map();

  transactions.forEach(t => {
    if (t.isGhost) return;
    const date = new Date(t.date || t.timestamp);
    if (isNaN(date.getTime())) return;

    let key;
    let sortKey;
    if (grain === 'year') {
      const yr = date.getFullYear();
      key = String(yr);
      sortKey = yr;
    } else {
      const yr = date.getFullYear();
      const mo = date.getMonth();
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      key = `${monthNames[mo]} ${String(yr).slice(-2)}`;
      sortKey = yr * 100 + mo;
    }

    if (!buckets.has(key)) {
      buckets.set(key, { sortKey, label: key, income: 0, expense: 0 });
    }

    const item = buckets.get(key);
    const amt = typeof t.amount === 'number' ? t.amount : Number(t.amount) || 0;

    if (t.type === 'income') {
      item.income += amt;
    } else if (t.type === 'expense') {
      item.expense += amt;
    } else if (t.type === 'refund') {
      item.expense -= amt;
    }
  });

  const sorted = Array.from(buckets.values()).sort(
    (a, b) => a.sortKey - b.sortKey
  );

  // If in month grain, limit to the last 12 months so the axis stays readable
  // on mobile widths.
  const data =
    grain === 'month' && sorted.length > 12 ? sorted.slice(-12) : sorted;

  const labels = data.map(d => d.label);
  const income = data.map(d => Math.round(d.income * 100) / 100);
  const expense = data.map(d => Math.round(Math.max(0, d.expense) * 100) / 100);
  const net = data.map(
    (d, i) => Math.round((income[i] - expense[i]) * 100) / 100
  );

  return { labels, income, expense, net };
}

/**
 * TrendBarChartCard Component
 * @param {Object} props
 * @param {Array} props.transactions
 * @param {Object} props.chartRenderer
 * @returns {{ element: HTMLElement, update: Function, cleanup: Function }}
 */
export const TrendBarChartCard = ({ transactions = [], chartRenderer }) => {
  const card = document.createElement('div');
  card.className = 'card insights-card trend-bar-card';

  // Defaults to the current month so the card opens on "this month"
  let currentGrain = 'month';
  let currentTransactions = transactions;
  let chartInstance = null;

  // Header
  const header = document.createElement('div');
  header.className = 'insights-card-header';

  const titleGroup = document.createElement('div');
  titleGroup.className = 'insights-card-title-group';
  const title = document.createElement('h3');
  title.className = 'insights-card-title';
  title.innerHTML = `
    <span class="trend-title-prefix">ТЕНДЕНЦИЯ • </span>
    <span class="trend-title-income">ДОХОД</span>
    <span class="trend-title-vs"> vs </span>
    <span class="trend-title-expense">РАЗХОД</span>
  `;
  titleGroup.appendChild(title);
  header.appendChild(titleGroup);

  const actions = document.createElement('div');
  actions.className = 'insights-card-actions';

  // Grain Selector — МЕСЕЦ (this month) is the default
  // Grain toggle — compact variant of the global .view-select
  const grainSelect = document.createElement('select');
  grainSelect.className = 'insights-select view-select';
  grainSelect.setAttribute('aria-label', 'Select trend grouping grain');
  grainSelect.innerHTML = `
    <option value="month">МЕСЕЦ</option>
    <option value="year">ГОДИНА</option>
  `;
  grainSelect.value = currentGrain;
  grainSelect.addEventListener('change', () => {
    currentGrain = grainSelect.value;
    render();
  });
  actions.appendChild(grainSelect);

  // Export Button
  const exportBtn = document.createElement('button');
  exportBtn.className = 'insights-icon-btn';
  exportBtn.setAttribute('title', 'Export chart image');
  exportBtn.setAttribute('aria-label', 'Export chart as PNG image');
  exportBtn.innerHTML = `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  `;
  exportBtn.addEventListener('click', () => {
    if (chartInstance) {
      exportChartAsImage(chartInstance, `trend-${currentGrain}.png`);
    }
  });
  actions.appendChild(exportBtn);

  header.appendChild(actions);
  card.appendChild(header);

  // Chart Wrapper — fills the card and never exceeds the app width
  const chartWrapper = document.createElement('div');
  chartWrapper.className = 'insights-chart-area';

  const canvas = document.createElement('canvas');
  canvas.id = 'insights-trend-bar-chart';
  chartWrapper.appendChild(canvas);
  card.appendChild(chartWrapper);

  // No-data overlay (sibling of the canvas so the canvas survives re-renders)
  const emptyState = document.createElement('div');
  emptyState.className = 'insights-chart-empty';
  emptyState.textContent = 'No transactions recorded to show the trend.';

  function setEmptyState(isEmpty) {
    if (isEmpty && !emptyState.isConnected) {
      chartWrapper.appendChild(emptyState);
    } else if (!isEmpty && emptyState.isConnected) {
      emptyState.remove();
    }
  }

  function render() {
    const { labels, income, expense, net } = aggregateTrendData(
      currentTransactions,
      currentGrain
    );

    if (!chartRenderer) return;

    if (labels.length === 0) {
      setEmptyState(true);
      return;
    }

    setEmptyState(false);

    const chartData = {
      labels,
      datasets: [
        {
          type: 'line',
          label: 'Нетно',
          data: net,
          borderColor: INSIGHTS_CHART_COLORS.net,
          backgroundColor: 'transparent',
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 2.5,
          pointHoverRadius: 5,
          pointBackgroundColor: INSIGHTS_CHART_COLORS.net,
          order: 1,
        },
        {
          type: 'bar',
          label: 'Доход',
          data: income,
          stack: 'trend',
          backgroundColor: INSIGHTS_CHART_COLORS.incomeFill,
          borderColor: INSIGHTS_CHART_COLORS.income,
          borderWidth: 1,
          borderRadius: {
            topLeft: 4,
            topRight: 4,
            bottomLeft: 0,
            bottomRight: 0,
          },
          order: 2,
        },
        {
          type: 'bar',
          label: 'Разход',
          data: expense.map(v => -v),
          stack: 'trend',
          backgroundColor: INSIGHTS_CHART_COLORS.expenseFill,
          borderColor: INSIGHTS_CHART_COLORS.expense,
          borderWidth: 1,
          borderRadius: {
            topLeft: 0,
            topRight: 0,
            bottomLeft: 4,
            bottomRight: 4,
          },
          order: 3,
        },
      ],
    };

    const baseScales = createInsightsScales();

    chartRenderer
      .createMixedChart(canvas, chartData, {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          ...baseScales,
          x: {
            ...baseScales.x,
            stacked: true,
          },
          y: {
            ...baseScales.y,
            stacked: true,
          },
        },
        plugins: {
          legend: {
            display: false, // the styled card title acts as the legend
          },
          tooltip: {
            callbacks: {
              ...createInsightsTooltipCallbacks(),
              label: context => {
                const rawVal = context.raw || 0;
                const absFormatted = formatMetricNumber(Math.abs(rawVal));
                if (context.dataset.label === 'Доход') {
                  return ` Доход: + ${absFormatted}`;
                }
                if (context.dataset.label === 'Разход') {
                  return ` Разход: - ${absFormatted}`;
                }
                const sign = rawVal >= 0 ? '+' : '-';
                return ` Нетно: ${sign} ${absFormatted}`;
              },
            },
          },
        },
      })
      .then(chart => {
        chartInstance = chart;
      })
      .catch(err => {
        console.error('[TrendBarChartCard] Failed to create chart:', err);
        showChartFallback(
          chartWrapper,
          'Unable to display the trend chart. Please try refreshing this section.'
        );
      });
  }

  render();

  return {
    element: card,
    update: newTransactions => {
      if (newTransactions) currentTransactions = newTransactions;
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
