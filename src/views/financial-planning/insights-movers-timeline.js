/**
 * Top Movers and Daily Expenses Timeline legacy sections
 * Extracted from InsightsSection.js to maintain file size constraints (<500 lines)
 */

import { TRANSACTION_TYPES } from '../../utils/constants.js';
import { InsightsGenerator } from '../../core/insights-generator.js';
import { showChartFallback } from '../../components/ChartRenderer.js';
import { INSIGHTS_CHART_COLORS } from '../../components/financial-planning/insights-chart-theme.js';

/**
 * Helper function to get transaction amount with consistent refund handling
 * @param {Object} t - Transaction object
 * @returns {number} Normalized amount (negative for refunds, positive for expenses)
 */
export const getTransactionAmount = t => {
  const amount =
    typeof t.amount === 'number' ? t.amount : Number(t.amount) || 0;
  if (t.type === TRANSACTION_TYPES.REFUND) {
    return -Math.abs(amount);
  } else if (t.type === TRANSACTION_TYPES.EXPENSE) {
    return amount;
  }
  return 0;
};

/**
 * Create top movers analysis
 */
export function createTopMoversSection(
  planningData,
  chartRenderer,
  activeCharts,
  sharedMonthState
) {
  const topContainer = document.createElement('div');
  topContainer.className = 'card insights-card insights-top-movers';

  function getMonthData(offset) {
    const now = new Date();
    const targetDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const currentMonth = targetDate.getMonth();
    const currentYear = targetDate.getFullYear();
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 1);

    const monthTransactions = planningData.transactions.filter(t => {
      if (t.isGhost) return false;
      const ts = new Date(t.timestamp);
      return ts >= startOfMonth && ts < endOfMonth;
    });

    return {
      transactions: monthTransactions,
      startOfMonth,
      endOfMonth,
      displayMonth: targetDate,
    };
  }

  function renderTopMovers() {
    const monthOffset = sharedMonthState.offset;
    const monthData = getMonthData(monthOffset);
    const topMovers = InsightsGenerator.topMovers(monthData.transactions, 6);

    const existingList = topContainer.querySelector('.top-movers-list');
    const existingChart = topContainer.querySelector('.top-movers-chart');
    if (existingList) existingList.remove();
    if (existingChart) {
      chartRenderer.destroyChart('insights-top-movers');
      existingChart.remove();
    }

    const monthName = monthData.displayMonth.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
    topTitle.textContent = `Top Movers - ${monthName}`;

    const prevBtn = topContainer.querySelector('.top-movers-prev-btn');
    const nextBtn = topContainer.querySelector('.top-movers-next-btn');
    if (prevBtn && nextBtn) {
      const prevMonth = new Date(
        monthData.displayMonth.getFullYear(),
        monthData.displayMonth.getMonth() - 1,
        1
      );
      const nextMonth = new Date(
        monthData.displayMonth.getFullYear(),
        monthData.displayMonth.getMonth() + 1,
        1
      );
      const prevMonthName = prevMonth.toLocaleDateString('en-US', {
        month: 'short',
      });
      const nextMonthName = nextMonth.toLocaleDateString('en-US', {
        month: 'short',
      });
      prevBtn.textContent = `← ${prevMonthName}`;
      nextBtn.textContent = `${nextMonthName} →`;
    }

    const topChartDiv = document.createElement('div');
    topChartDiv.className =
      'top-movers-chart insights-chart-area insights-chart-area--compact';
    const topCanvas = document.createElement('canvas');
    topCanvas.id = 'insights-top-movers-chart';
    topChartDiv.appendChild(topCanvas);
    topContainer.appendChild(topChartDiv);

    const topLabels = topMovers.map(t => t.category);
    const topData = topMovers.map(t => Math.abs(t.total));

    chartRenderer
      .createBarChart(topCanvas, {
        labels: topLabels,
        datasets: [{ label: 'Amount', data: topData }],
      })
      .then(chart => {
        if (chart) {
          activeCharts.set('insights-top-movers', chart);
        } else {
          showChartFallback(
            topChartDiv,
            'Unable to display the top movers chart. Please try refreshing this section.'
          );
        }
      })
      .catch(error => {
        console.error(
          '[InsightsSection] Failed to create top movers chart:',
          error
        );
        showChartFallback(
          topChartDiv,
          'Unable to display the top movers chart. Please try refreshing this section.'
        );
      });
  }

  const topHeader = document.createElement('div');
  topHeader.className = 'insights-card-header';

  const topTitleWrapper = document.createElement('div');
  topTitleWrapper.className = 'insights-card-title-group';

  const topTitle = document.createElement('h3');
  topTitle.className = 'insights-card-title';
  topTitle.textContent = 'Top Movers';

  const topSubtitle = document.createElement('p');
  topSubtitle.className = 'insights-card-subtitle';
  topSubtitle.textContent = 'Categories with the highest spending this month';

  topTitleWrapper.appendChild(topTitle);
  topTitleWrapper.appendChild(topSubtitle);
  topHeader.appendChild(topTitleWrapper);

  const navButton = document.createElement('div');
  navButton.className = 'insights-nav-group';

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'top-movers-prev-btn insights-nav-btn';
  prevBtn.textContent = '← Previous';
  prevBtn.setAttribute('aria-label', 'Show the previous month');

  prevBtn.addEventListener('click', () => {
    sharedMonthState.offset--;
    if (sharedMonthState.onNavigate) sharedMonthState.onNavigate();
  });

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'top-movers-next-btn insights-nav-btn';
  nextBtn.textContent = 'Next →';
  nextBtn.setAttribute('aria-label', 'Show the next month');

  nextBtn.addEventListener('click', () => {
    if (sharedMonthState.offset < 0) {
      sharedMonthState.offset++;
      if (sharedMonthState.onNavigate) sharedMonthState.onNavigate();
    }
  });

  navButton.appendChild(prevBtn);
  navButton.appendChild(nextBtn);
  topHeader.appendChild(navButton);
  topContainer.appendChild(topHeader);

  renderTopMovers();

  return { topContainer, renderTopMovers };
}

/**
 * Create timeline comparison section — daily mode only
 */
export function createTimelineSection(
  transactions,
  chartRenderer,
  activeCharts,
  sharedMonthState
) {
  const timelineDiv = document.createElement('div');
  timelineDiv.className = 'card insights-card insights-daily-timeline';

  const timelineHeader = document.createElement('div');
  timelineHeader.className = 'insights-card-header';

  const timelineTitleWrapper = document.createElement('div');
  timelineTitleWrapper.className = 'insights-card-title-group';

  const timelineTitle = document.createElement('h3');
  timelineTitle.className = 'insights-card-title';
  timelineTitle.textContent = 'Daily Expenses';

  const timelineSubtitle = document.createElement('p');
  timelineSubtitle.className = 'insights-card-subtitle';
  timelineSubtitle.textContent = 'Track your daily spending patterns over time';

  timelineTitleWrapper.appendChild(timelineTitle);
  timelineTitleWrapper.appendChild(timelineSubtitle);
  timelineHeader.appendChild(timelineTitleWrapper);

  let isRendering = false;

  const navContainer = document.createElement('div');
  navContainer.className = 'insights-nav-group';

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'timeline-prev-btn insights-nav-btn';
  prevBtn.textContent = '← Previous';
  prevBtn.setAttribute('aria-label', 'Show the previous month');

  prevBtn.addEventListener('click', () => {
    sharedMonthState.offset--;
    if (sharedMonthState.onNavigate) sharedMonthState.onNavigate();
  });

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'timeline-next-btn insights-nav-btn';
  nextBtn.textContent = 'Next →';
  nextBtn.setAttribute('aria-label', 'Show the next month');

  nextBtn.addEventListener('click', () => {
    if (sharedMonthState.offset < 0) {
      sharedMonthState.offset++;
      if (sharedMonthState.onNavigate) sharedMonthState.onNavigate();
    }
  });

  navContainer.appendChild(prevBtn);
  navContainer.appendChild(nextBtn);
  timelineHeader.appendChild(navContainer);
  timelineDiv.appendChild(timelineHeader);

  const timelineChartWrapper = document.createElement('div');
  timelineChartWrapper.className = 'insights-chart-area';
  const timelineCanvas = document.createElement('canvas');
  timelineCanvas.id = 'insights-timeline-chart';
  timelineChartWrapper.appendChild(timelineCanvas);
  timelineDiv.appendChild(timelineChartWrapper);

  function renderTimelineChart() {
    if (isRendering) return;
    isRendering = true;

    const existingChart = activeCharts.get('insights-timeline');
    if (existingChart) {
      chartRenderer.destroyChart(existingChart);
      activeCharts.delete('insights-timeline');
    }

    const now = new Date();
    const monthOffset = sharedMonthState.offset;
    const targetDate = new Date(
      now.getFullYear(),
      now.getMonth() + monthOffset,
      1
    );

    const keys = [];
    const prevKeys = [];
    const isPadding = [];
    const isPrevPadding = [];
    const labelFormat = { month: 'short', day: 'numeric' };

    const targetMonth = targetDate.getMonth();
    const targetYear = targetDate.getFullYear();
    const daysInTargetMonth = new Date(
      targetYear,
      targetMonth + 1,
      0
    ).getDate();

    const prevMonthDate = new Date(targetYear, targetMonth - 1, 1);
    const daysInPrevMonth = new Date(
      prevMonthDate.getFullYear(),
      prevMonthDate.getMonth() + 1,
      0
    ).getDate();

    const maxDaysToShow = Math.max(daysInTargetMonth, daysInPrevMonth);

    for (let day = 1; day <= maxDaysToShow; day++) {
      if (day <= daysInTargetMonth) {
        keys.push(
          `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        );
        isPadding.push(false);
      } else {
        keys.push(
          `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(daysInTargetMonth).padStart(2, '0')}`
        );
        isPadding.push(true);
      }

      if (day <= daysInPrevMonth) {
        prevKeys.push(
          `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        );
        isPrevPadding.push(false);
      } else {
        prevKeys.push(
          `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}-${String(daysInPrevMonth).padStart(2, '0')}`
        );
        isPrevPadding.push(true);
      }
    }

    const currentDayTotals = new Map();
    const prevDayTotals = new Map();

    const currentStart = new Date(targetYear, targetMonth, 1);
    const currentEnd = new Date(targetYear, targetMonth + 1, 1);
    const prevStart = new Date(
      prevMonthDate.getFullYear(),
      prevMonthDate.getMonth(),
      1
    );
    const prevEnd = new Date(
      prevMonthDate.getFullYear(),
      prevMonthDate.getMonth() + 1,
      1
    );

    for (const t of transactions) {
      if (t.isGhost) return;
      const amount = getTransactionAmount(t);
      if (!amount) continue;
      const ts = new Date(t.timestamp);
      if (ts >= currentStart && ts < currentEnd) {
        const key = `${ts.getFullYear()}-${String(ts.getMonth() + 1).padStart(2, '0')}-${String(ts.getDate()).padStart(2, '0')}`;
        currentDayTotals.set(key, (currentDayTotals.get(key) || 0) + amount);
      } else if (ts >= prevStart && ts < prevEnd) {
        const key = `${ts.getFullYear()}-${String(ts.getMonth() + 1).padStart(2, '0')}-${String(ts.getDate()).padStart(2, '0')}`;
        prevDayTotals.set(key, (prevDayTotals.get(key) || 0) + amount);
      }
    }

    const monthName = targetDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
    timelineTitle.textContent = `Daily Expenses: ${monthName}`;

    const prevMonthNav = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth() - 1,
      1
    );
    const nextMonthNav = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth() + 1,
      1
    );
    prevBtn.textContent = `← ${prevMonthNav.toLocaleDateString('en-US', { month: 'short' })}`;
    nextBtn.textContent = `${nextMonthNav.toLocaleDateString('en-US', { month: 'short' })} →`;

    const currentMonthLabel = targetDate.toLocaleDateString('en-US', {
      month: 'long',
    });
    const previousMonthLabel = prevMonthDate.toLocaleDateString('en-US', {
      month: 'long',
    });

    let currentRunning = 0;
    const currentSeries = keys.map((k, index) => {
      if (!isPadding[index]) {
        currentRunning += currentDayTotals.get(k) || 0;
      }
      return {
        period: k,
        value: currentRunning,
      };
    });

    let prevRunning = 0;
    const previousSeries = prevKeys.map((k, index) => {
      if (!isPrevPadding[index]) {
        prevRunning += prevDayTotals.get(k) || 0;
      }
      return {
        period: k,
        value: prevRunning,
      };
    });

    const chartLabels = keys.map((k, index) => {
      if (isPadding[index]) return '—';
      const parts = k.split('-').map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString('en-US', labelFormat);
    });

    const currentData = currentSeries.map(s => s.value);
    const previousData = previousSeries.map(s => s.value);

    chartRenderer
      .createLineChart(
        timelineCanvas,
        {
          labels: chartLabels,
          datasets: [
            {
              label: currentMonthLabel,
              data: currentData,
              borderColor: INSIGHTS_CHART_COLORS.expense,
              backgroundColor: INSIGHTS_CHART_COLORS.expenseFill,
              borderWidth: 2.5,
              tension: 0.25,
              fill: false,
            },
            {
              label: previousMonthLabel,
              data: previousData,
              borderColor: INSIGHTS_CHART_COLORS.previousPeriod,
              backgroundColor: 'transparent',
              borderWidth: 2,
              tension: 0.25,
              fill: false,
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
        }
      )
      .then(chart => {
        if (chart) {
          activeCharts.set('insights-timeline', chart);
        }
      })
      .catch(err => console.error('Timeline chart error', err))
      .finally(() => {
        isRendering = false;
      });
  }

  renderTimelineChart();

  return {
    timelineDiv,
    timelineChartWrapper,
    renderTimelineChart,
    getCurrentMode: () => 'daily',
  };
}
