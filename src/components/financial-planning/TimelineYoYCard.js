/**
 * TimelineYoYCard Component
 *
 * Cumulative spending timeline for the Financial Insights dashboard.
 * The grain is selectable and defaults to MONTH so the card opens on the month
 * the user is tracking right now:
 * - MONTH (default): selected month vs the previous month, day by day
 * - YEAR: year of the selected month vs the previous year, month by month
 *
 * In MONTH grain the card also renders the shared month navigation, so every
 * month-based insights chart (Top Movers, Daily Expenses, Inflation Trends)
 * stays in sync when the user browses months.
 */

import { INSIGHTS_CHART_COLORS } from './insights-chart-theme.js';

const MONTH_LABELS = [
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

const GRAINS = {
  MONTH: 'month',
  YEAR: 'year',
};

/**
 * Resolve the first day of the month currently selected in the shared state.
 * @param {Object|null} sharedMonthState - Shared state with a month `offset`
 * @returns {Date} First day of the selected month (defaults to this month)
 */
export function getSelectedMonth(sharedMonthState = null) {
  const offset = Number(sharedMonthState?.offset) || 0;
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + offset, 1);
}

/**
 * Net expense delta of a transaction (refunds reduce spending).
 * @param {Object} t - Transaction
 * @returns {number}
 */
function getExpenseDelta(t) {
  const amt = typeof t.amount === 'number' ? t.amount : Number(t.amount) || 0;
  if (t.type === 'expense') return amt;
  if (t.type === 'refund') return -amt;
  return 0;
}

/**
 * Turn period totals into a clamped cumulative series.
 * @param {number[]} values - Totals per day (or per month)
 * @returns {number[]} Running totals
 */
function toCumulative(values) {
  let running = 0;
  return values.map(value => {
    running += Math.max(0, value);
    return Math.round(running * 100) / 100;
  });
}

/**
 * Short label for a month ("Aug 2026").
 * @param {Date} date
 * @returns {string}
 */
function formatMonthLabel(date) {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/**
 * Calculate cumulative expenses by month for two comparison years
 * @param {Array} transactions
 * @param {number} [targetYear]
 * @returns {{ targetYear: number, priorYear: number, priorCumulative: number[], currentCumulative: (number|null)[] }}
 */
export function calculateYoYCumulative(transactions = [], targetYear = null) {
  const valid = transactions.filter(t => !t.isGhost);

  const now = new Date();
  const currentActualYear = now.getFullYear();
  const currentActualMonth = now.getMonth();

  // Find the primary year to display: default to current actual year or latest transaction year
  let yr = targetYear;
  if (!yr) {
    let maxYear = currentActualYear;
    valid.forEach(t => {
      const d = new Date(t.date || t.timestamp);
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        if (y > maxYear) maxYear = y;
      }
    });
    yr = maxYear;
  }

  const priorYear = yr - 1;

  // Monthly totals (12 months)
  const currentMonthly = new Array(12).fill(0);
  const priorMonthly = new Array(12).fill(0);

  let latestMonthWithTx = yr === currentActualYear ? currentActualMonth : -1;

  valid.forEach(t => {
    const d = new Date(t.date || t.timestamp);
    if (isNaN(d.getTime())) return;

    const tYear = d.getFullYear();
    const tMonth = d.getMonth();
    const delta = getExpenseDelta(t);

    if (tYear === yr) {
      currentMonthly[tMonth] += delta;
      if (tMonth > latestMonthWithTx) {
        latestMonthWithTx = tMonth;
      }
    } else if (tYear === priorYear) {
      priorMonthly[tMonth] += delta;
    }
  });

  // Calculate cumulative curves
  const priorCumulative = toCumulative(priorMonthly);

  const currentCumulative = [];
  let currentRun = 0;
  const cutOffMonth = Math.max(0, Math.min(11, latestMonthWithTx));

  for (let m = 0; m < 12; m++) {
    if (m <= cutOffMonth) {
      currentRun += Math.max(0, currentMonthly[m]);
      currentCumulative.push(Math.round(currentRun * 100) / 100);
    } else {
      currentCumulative.push(null); // Line stops at current active month
    }
  }

  return {
    targetYear: yr,
    priorYear,
    priorCumulative,
    currentCumulative,
  };
}

/**
 * Calculate cumulative expenses day by day for a month vs the month before it.
 * The previous month is aligned on the same day axis, so shorter months simply
 * end their line early (nulls).
 * @param {Array} transactions
 * @param {Date} [targetMonth] - Any date inside the target month
 * @returns {{ labels: string[], targetLabel: string, priorLabel: string, targetCumulative: number[], priorCumulative: (number|null)[], hasData: boolean }}
 */
export function calculateMonthlyComparison(
  transactions = [],
  targetMonth = new Date()
) {
  const valid = transactions.filter(t => !t.isGhost);

  const targetStart = new Date(
    targetMonth.getFullYear(),
    targetMonth.getMonth(),
    1
  );
  const daysInTarget = new Date(
    targetStart.getFullYear(),
    targetStart.getMonth() + 1,
    0
  ).getDate();

  const priorStart = new Date(
    targetStart.getFullYear(),
    targetStart.getMonth() - 1,
    1
  );
  const daysInPrior = new Date(
    priorStart.getFullYear(),
    priorStart.getMonth() + 1,
    0
  ).getDate();

  const targetDaily = new Array(daysInTarget).fill(0);
  const priorDaily = new Array(daysInPrior).fill(0);

  valid.forEach(t => {
    const date = new Date(t.date || t.timestamp);
    if (isNaN(date.getTime())) return;

    const delta = getExpenseDelta(t);
    if (delta === 0) return;

    const dayIndex = date.getDate() - 1;
    if (
      date.getFullYear() === targetStart.getFullYear() &&
      date.getMonth() === targetStart.getMonth()
    ) {
      targetDaily[dayIndex] += delta;
    } else if (
      date.getFullYear() === priorStart.getFullYear() &&
      date.getMonth() === priorStart.getMonth()
    ) {
      priorDaily[dayIndex] += delta;
    }
  });

  const targetCumulative = toCumulative(targetDaily);
  const priorCumulative = toCumulative(priorDaily);

  // Align both series on the target month's day axis for a fair comparison
  const labels = targetCumulative.map((_value, index) => String(index + 1));
  const priorAligned = labels.map((_label, index) =>
    index < priorCumulative.length ? priorCumulative[index] : null
  );

  return {
    labels,
    targetLabel: formatMonthLabel(targetStart),
    priorLabel: formatMonthLabel(priorStart),
    targetCumulative,
    priorCumulative: priorAligned,
    hasData:
      targetCumulative[targetCumulative.length - 1] > 0 ||
      priorCumulative[priorCumulative.length - 1] > 0,
  };
}

/**
 * TimelineYoYCard Component
 * @param {Object} props
 * @param {Array} props.transactions
 * @param {Object} props.chartRenderer
 * @param {Object} [props.sharedMonthState] - Shared month navigation state
 * @returns {{ element: HTMLElement, render: Function, update: Function, cleanup: Function }}
 */
export const TimelineYoYCard = ({
  transactions = [],
  chartRenderer,
  sharedMonthState = null,
}) => {
  const card = document.createElement('div');
  card.className = 'card insights-card timeline-yoy-card';

  let currentGrain = GRAINS.MONTH;
  let currentTransactions = transactions;
  let chartInstance = null;

  // Header
  const header = document.createElement('div');
  header.className = 'insights-card-header';

  const titleGroup = document.createElement('div');
  titleGroup.className = 'insights-card-title-group';

  const title = document.createElement('h3');
  title.className = 'insights-card-title';
  title.textContent = 'TIMELINE';

  const subtitle = document.createElement('p');
  subtitle.className = 'timeline-subtitle';

  titleGroup.appendChild(title);
  titleGroup.appendChild(subtitle);
  header.appendChild(titleGroup);

  const actions = document.createElement('div');
  actions.className = 'insights-card-actions';

  // Grain selector — MONTH (this month) by default like the other insights cards
  // Grain toggle — compact variant of the global .view-select
  const grainSelect = document.createElement('select');
  grainSelect.className = 'insights-select view-select';
  grainSelect.setAttribute('aria-label', 'Select timeline granularity');
  grainSelect.innerHTML = `
    <option value="month">МЕСЕЦ</option>
    <option value="year">ГОДИНА</option>
  `;
  grainSelect.value = currentGrain;
  grainSelect.addEventListener('change', () => {
    currentGrain =
      grainSelect.value === GRAINS.YEAR ? GRAINS.YEAR : GRAINS.MONTH;
    render();
  });

  // Shared month navigation (month grain only)
  const navGroup = document.createElement('div');
  navGroup.className = 'insights-nav-group';

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'insights-nav-btn';
  prevBtn.setAttribute('aria-label', 'Show the previous month');

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'insights-nav-btn';
  nextBtn.setAttribute('aria-label', 'Show the next month');

  prevBtn.addEventListener('click', () => navigateMonth(-1));
  nextBtn.addEventListener('click', () => navigateMonth(1));

  navGroup.appendChild(prevBtn);
  navGroup.appendChild(nextBtn);

  // Export button
  const exportBtn = document.createElement('button');
  exportBtn.type = 'button';
  exportBtn.className = 'insights-icon-btn';
  exportBtn.setAttribute('title', 'Export chart image');
  exportBtn.setAttribute('aria-label', 'Export timeline chart as PNG image');
  exportBtn.innerHTML = `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
  `;
  exportBtn.addEventListener('click', () => {
    if (chartInstance) {
      exportChartAsImage(chartInstance, `timeline-${currentGrain}.png`);
    }
  });

  if (sharedMonthState) {
    actions.appendChild(navGroup);
  }
  actions.appendChild(grainSelect);
  actions.appendChild(exportBtn);
  header.appendChild(actions);
  card.appendChild(header);

  // Chart wrapper — fills the card width and never exceeds the app width
  const chartWrapper = document.createElement('div');
  chartWrapper.className = 'insights-chart-area';

  const canvas = document.createElement('canvas');
  canvas.id = 'insights-timeline-yoy-chart';
  chartWrapper.appendChild(canvas);
  card.appendChild(chartWrapper);

  /**
   * Toggle the month navigation (only meaningful in month grain).
   */
  function updateNavVisibility() {
    if (!sharedMonthState) return;
    const shouldShow = currentGrain === GRAINS.MONTH;
    if (shouldShow && !navGroup.isConnected) {
      actions.insertBefore(navGroup, grainSelect);
    } else if (!shouldShow && navGroup.isConnected) {
      navGroup.remove();
    }
  }

  /**
   * Render the comparison subtitle (acts as the chart legend).
   * @param {string} currentLabel
   * @param {string} priorLabel
   */
  function renderSubtitle(currentLabel, priorLabel) {
    const currentEl = document.createElement('span');
    currentEl.className = 'timeline-current-period';
    currentEl.textContent = currentLabel;

    const vsEl = document.createElement('span');
    vsEl.className = 'timeline-vs';
    vsEl.textContent = 'vs';

    const priorEl = document.createElement('span');
    priorEl.className = 'timeline-prior-period';
    priorEl.textContent = priorLabel;

    subtitle.replaceChildren(currentEl, vsEl, priorEl);
  }

  /**
   * Update the month navigation labels and state.
   * @param {Date} referenceDate
   */
  function updateNavLabels(referenceDate) {
    if (!sharedMonthState) return;

    const prevMonth = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth() - 1,
      1
    );
    const nextMonth = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth() + 1,
      1
    );
    const shortMonth = date =>
      date.toLocaleDateString('en-US', { month: 'short' });

    prevBtn.textContent = `← ${shortMonth(prevMonth)}`;
    nextBtn.textContent = `${shortMonth(nextMonth)} →`;
    nextBtn.disabled = !(Number(sharedMonthState.offset) < 0);
  }

  /**
   * Show or clear the no-data overlay (canvas stays mounted so later renders
   * can reuse it).
   * @param {string|null} message
   */
  function setEmptyState(message) {
    if (!message) {
      if (emptyState.isConnected) emptyState.remove();
      return;
    }
    emptyState.textContent = message;
    if (!emptyState.isConnected) chartWrapper.appendChild(emptyState);
  }

  /**
   * Draw the cumulative line comparison.
   * @param {Object} series
   */
  function drawChart({
    labels,
    currentData,
    priorData,
    currentLabel,
    priorLabel,
  }) {
    if (!chartRenderer) return;

    chartRenderer
      .createLineChart(
        canvas,
        {
          labels,
          datasets: [
            {
              label: priorLabel,
              data: priorData,
              borderColor: INSIGHTS_CHART_COLORS.previousPeriod,
              backgroundColor: 'transparent',
              borderWidth: 2,
              tension: 0.25,
              pointRadius: 0,
              pointHoverRadius: 4,
              pointBackgroundColor: INSIGHTS_CHART_COLORS.previousPeriod,
            },
            {
              label: currentLabel,
              data: currentData,
              borderColor: INSIGHTS_CHART_COLORS.expense,
              backgroundColor: 'transparent',
              borderWidth: 2.5,
              tension: 0.25,
              pointRadius: 2,
              pointHoverRadius: 5,
              pointBackgroundColor: INSIGHTS_CHART_COLORS.expense,
            },
          ],
        },
        {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          plugins: {
            legend: {
              display: false, // the styled subtitle acts as the legend
            },
          },
        }
      )
      .then(chart => {
        chartInstance = chart;
      })
      .catch(error => {
        console.error('[TimelineYoYCard] Failed to create chart:', error);
        showChartFallback(
          chartWrapper,
          'Unable to display the timeline chart. Please try refreshing this section.'
        );
      });
  }

  // No-data overlay (kept as a sibling of the canvas, added only when needed)
  const emptyState = document.createElement('div');
  emptyState.className = 'insights-chart-empty';

  /**
   * Step the shared month state (never into the future) and re-render every
   * month-based insights chart through the shared navigate handler.
   * @param {number} step - Months to move (-1 previous, 1 next)
   */
  function navigateMonth(step) {
    if (!sharedMonthState) return;

    const nextOffset = (Number(sharedMonthState.offset) || 0) + step;
    if (nextOffset > 0) return; // the future has no data

    sharedMonthState.offset = nextOffset;
    if (sharedMonthState.onNavigate) {
      sharedMonthState.onNavigate();
    } else {
      render();
    }
  }

  /**
   * Render the timeline for the active grain.
   */
  function render() {
    const referenceDate = getSelectedMonth(sharedMonthState);
    updateNavVisibility();

    if (currentGrain === GRAINS.MONTH) {
      const {
        labels,
        targetLabel,
        priorLabel,
        targetCumulative,
        priorCumulative,
        hasData,
      } = calculateMonthlyComparison(currentTransactions, referenceDate);

      renderSubtitle(targetLabel, priorLabel);
      updateNavLabels(referenceDate);

      if (!hasData) {
        setEmptyState(
          'No expenses recorded for this month or the month before it.'
        );
        return;
      }

      setEmptyState(null);
      drawChart({
        labels,
        currentData: targetCumulative,
        priorData: priorCumulative,
        currentLabel: targetLabel,
        priorLabel,
      });
      return;
    }

    const { targetYear, priorYear, priorCumulative, currentCumulative } =
      calculateYoYCumulative(currentTransactions, referenceDate.getFullYear());

    const hasData =
      priorCumulative.some(value => value > 0) ||
      currentCumulative.some(value => value !== null && value > 0);

    renderSubtitle(String(targetYear), String(priorYear));

    if (!hasData) {
      setEmptyState(
        'No expenses recorded for this year or the year before it.'
      );
      return;
    }

    setEmptyState(null);
    drawChart({
      labels: MONTH_LABELS,
      currentData: currentCumulative,
      priorData: priorCumulative,
      currentLabel: String(targetYear),
      priorLabel: String(priorYear),
    });
  }

  render();

  return {
    element: card,
    render,
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
