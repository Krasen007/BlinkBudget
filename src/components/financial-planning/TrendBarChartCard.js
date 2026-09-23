/**
 * TrendBarChartCard Component
 *
 * Displays:
 * - Header: "Trend Income vs Expense" with grain selector ("Month" default / "Year") and export button
 * - Single-column diverging Bar Chart with:
 *   - Green bar pointing UP for Income and red/coral bar pointing DOWN for
 *     Expenses sharing the same column per period (stacked on one stack so
 *     both stay centered on the zero line)
 *   - Cyan line overlay for Net (Income - Expense)
 *   - Amber dashed line (right axis) for Savings Rate (Net ÷ Income)
 *     with anomaly flags for statistically unusual expenses in tooltips
 */

import { formatMetricNumber } from '../../utils/financial-planning-helpers.js';
import { showChartFallback } from '../ChartRenderer.js';
import {
  INSIGHTS_CHART_COLORS,
  createInsightsScales,
  createInsightsTooltipCallbacks,
} from './insights-chart-theme.js';
import { AnomalyService } from '../../core/analytics/AnomalyService.js';

/**
 * Aggregate trend data by year or month
 * @param {Array} transactions
 * @param {'year' | 'month'} grain
 * @returns {{ labels: string[], income: number[], expense: number[],
 *   net: number[], rate: (number|null)[], periodKeys: string[] }}
 */
export function aggregateTrendData(transactions = [], grain = 'year') {
  const buckets = new Map();

  transactions.forEach(t => {
    if (t.isGhost) return;
    const date = new Date(t.date || t.timestamp);
    if (isNaN(date.getTime())) return;

    let key;
    let sortKey;
    let periodKey;
    if (grain === 'year') {
      const yr = date.getFullYear();
      key = String(yr);
      sortKey = yr;
      periodKey = String(yr);
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
      periodKey = `${yr}-${String(mo + 1).padStart(2, '0')}`;
    }

    if (!buckets.has(key)) {
      buckets.set(key, {
        sortKey,
        label: key,
        periodKey,
        income: 0,
        expense: 0,
      });
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
  // Savings rate per bucket (% of income kept); null when there is no income
  const rate = data.map((d, i) =>
    income[i] > 0 ? Math.round((net[i] / income[i]) * 100) : null
  );
  const periodKeys = data.map(d => d.periodKey);

  return { labels, income, expense, net, rate, periodKeys };
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
    <span class="trend-title-prefix">Trend </span>
    <span class="trend-title-income">Income</span>
    <span class="trend-title-vs"> vs </span>
    <span class="trend-title-expense">Expense</span>
  `;
  titleGroup.appendChild(title);
  header.appendChild(titleGroup);

  const actions = document.createElement('div');
  actions.className = 'insights-card-actions';

  // Grain Selector — Month (this month) is the default
  // Grain toggle — compact variant of the global .view-select
  const grainSelect = document.createElement('select');
  grainSelect.className = 'insights-select view-select';
  grainSelect.setAttribute('aria-label', 'Select trend grouping grain');
  grainSelect.innerHTML = `
    <option value="month">Month</option>
    <option value="year">Year</option>
  `;
  grainSelect.value = currentGrain;
  grainSelect.addEventListener('change', () => {
    currentGrain = grainSelect.value;
    render();
  });
  actions.appendChild(grainSelect);

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
    const { labels, income, expense, net, rate, periodKeys } =
      aggregateTrendData(currentTransactions, currentGrain);
    const markers = AnomalyService.buildPeriodMarkers(currentTransactions);

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
          label: 'Savings Rate',
          data: rate,
          yAxisID: 'rate',
          borderColor: INSIGHTS_CHART_COLORS.savingsRate,
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [6, 4],
          tension: 0.3,
          pointRadius: 2,
          pointHoverRadius: 5,
          pointBackgroundColor: INSIGHTS_CHART_COLORS.savingsRate,
          order: 0,
        },
        {
          type: 'line',
          label: 'Net',
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
          label: 'Income',
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
          label: 'Expense',
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
          // Secondary axis for the savings-rate line (percent)
          rate: {
            position: 'right',
            beginAtZero: true,
            grid: {
              drawOnChartArea: false,
            },
            ticks: {
              color: INSIGHTS_CHART_COLORS.axisText,
              maxTicksLimit: 5,
              callback: value => `${value}%`,
            },
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
                if (context.dataset.label === 'Savings Rate') {
                  return ` Savings Rate: ${Math.round(rawVal)}%`;
                }
                const absFormatted = formatMetricNumber(Math.abs(rawVal));
                if (context.dataset.label === 'Income') {
                  return ` Income: + ${absFormatted}`;
                }
                if (context.dataset.label === 'Expense') {
                  return ` Expense: - ${absFormatted}`;
                }
                const sign = rawVal >= 0 ? '+' : '-';
                return ` Net: ${sign} ${absFormatted}`;
              },
              // Replaces the default "% of total" line (meaningless for time
              // series) with an anomaly flag for the hovered period
              afterBody: items => {
                const index = items && items.length ? items[0].dataIndex : -1;
                const periodKey = periodKeys[index];
                if (!periodKey || !markers.count) return '';
                const count =
                  currentGrain === 'month'
                    ? markers.byMonth.get(periodKey)
                    : markers.byYear.get(periodKey);
                if (!count) return '';
                return `⚠ ${count} unusual expense${count > 1 ? 's' : ''}`;
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
