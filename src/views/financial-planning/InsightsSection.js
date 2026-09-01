/**
 * Insights Section - Advanced Analytics
 *
 * Extracted from FinancialPlanningView.js for better maintainability.
 * Displays financial insights with top movers and timeline comparisons.
 *
 * Responsibilities:
 * - Top movers analysis and visualization
 * - Timeline comparisons (monthly/daily expenses)
 * - Chart rendering and management
 * - Data analysis and insights generation
 */

import { COLORS, SPACING, TRANSACTION_TYPES } from '../../utils/constants.js';
import {
  createSectionContainer,
  createPlaceholder,
  createUsageNote,
} from '../../utils/financial-planning-helpers.js';
import { InsightsGenerator } from '../../core/insights-generator.js';
import { InflationTrends } from '../../components/InflationTrends.js';
import { createNetBalanceChart } from '../../components/NetBalanceChart.js';
import { ProgressiveEmptyState } from '../../components/ProgressiveEmptyState.js';

/**
 * Helper function to get transaction amount with consistent refund handling
 * @param {Object} t - Transaction object
 * @returns {number} Normalized amount (negative for refunds, positive for expenses)
 */
const getTransactionAmount = t => {
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
function createTopMoversSection(
  planningData,
  chartRenderer,
  activeCharts,
  sharedMonthState
) {
  const topContainer = document.createElement('div');
  topContainer.className = 'insights-top-movers';
  topContainer.style.display = 'flex';
  topContainer.style.flexDirection = 'column';
  topContainer.style.gap = SPACING.MD;

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

    // Clear previous content except header
    const existingList = topContainer.querySelector('.top-movers-list');
    const existingChart = topContainer.querySelector('.top-movers-chart');
    if (existingList) existingList.remove();
    if (existingChart) {
      // Destroy existing chart using the chart ID
      chartRenderer.destroyChart('insights-top-movers');
      existingChart.remove();
    }

    // Update title with month
    const monthName = monthData.displayMonth.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
    topTitle.textContent = `Top Movers - ${monthName}`;

    // Update navigation button text
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

    // Chart for Top Movers
    const topChartDiv = document.createElement('div');
    topChartDiv.className = 'top-movers-chart';
    topChartDiv.style.marginTop = SPACING.MD;
    topChartDiv.style.position = 'relative';
    topChartDiv.style.height = '220px';
    const topCanvas = document.createElement('canvas');
    topCanvas.id = 'insights-top-movers-chart'; // Fixed ID for consistent tracking
    topCanvas.style.width = '100%';
    topCanvas.style.maxHeight = '100%';
    topChartDiv.appendChild(topCanvas);
    topContainer.appendChild(topChartDiv);

    // Render bar chart for top movers
    const topLabels = topMovers.map(t => t.category);
    const topData = topMovers.map(t => Math.abs(t.total));

    chartRenderer
      .createBarChart(
        topCanvas,
        {
          labels: topLabels,
          datasets: [{ label: 'Amount', data: topData }],
        },
        { title: 'Top Movers' }
      )
      .then(chart => {
        if (chart) activeCharts.set('insights-top-movers', chart);
      })
      .catch(err => console.error('Top movers chart error', err));
  }

  // Header with title and navigation
  const topHeader = document.createElement('div');
  topHeader.style.display = 'flex';
  topHeader.style.justifyContent = 'space-between';
  topHeader.style.alignItems = 'center';
  topHeader.style.marginBottom = SPACING.MD;

  const topTitle = document.createElement('h3');
  topTitle.textContent = 'Top Movers';
  topTitle.style.margin = '0';
  topTitle.style.fontSize = '1rem';
  topTitle.style.fontWeight = '600';
  topHeader.appendChild(topTitle);

  // Navigation button (single combined button)
  const navButton = document.createElement('div');
  navButton.style.display = 'flex';
  navButton.style.gap = SPACING.SM;
  navButton.style.alignItems = 'center';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'top-movers-prev-btn';
  prevBtn.textContent = '← Previous';
  prevBtn.style.padding = '6px 12px';
  prevBtn.style.fontSize = '0.85rem';
  prevBtn.style.border = `1px solid ${COLORS.BORDER}`;
  prevBtn.style.background = COLORS.SURFACE;
  prevBtn.style.color = COLORS.TEXT_MAIN;
  prevBtn.style.borderRadius = 'var(--radius-sm)';
  prevBtn.style.cursor = 'pointer';
  prevBtn.style.transition = 'all 0.2s ease';

  prevBtn.addEventListener('mouseover', () => {
    prevBtn.style.background = COLORS.SURFACE_HOVER;
  });
  prevBtn.addEventListener('mouseout', () => {
    prevBtn.style.background = COLORS.SURFACE;
  });
  prevBtn.addEventListener('click', () => {
    sharedMonthState.offset--;
    if (sharedMonthState.onNavigate) sharedMonthState.onNavigate();
  });

  const nextBtn = document.createElement('button');
  nextBtn.className = 'top-movers-next-btn';
  nextBtn.textContent = 'Next →';
  nextBtn.style.padding = '6px 12px';
  nextBtn.style.fontSize = '0.85rem';
  nextBtn.style.border = `1px solid ${COLORS.BORDER}`;
  nextBtn.style.background = COLORS.SURFACE;
  nextBtn.style.color = COLORS.TEXT_MAIN;
  nextBtn.style.borderRadius = 'var(--radius-sm)';
  nextBtn.style.cursor = 'pointer';
  nextBtn.style.transition = 'all 0.2s ease';

  nextBtn.addEventListener('mouseover', () => {
    nextBtn.style.background = COLORS.SURFACE_HOVER;
  });
  nextBtn.addEventListener('mouseout', () => {
    nextBtn.style.background = COLORS.SURFACE;
  });
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

  // Initial render
  renderTopMovers();

  return { topContainer, renderTopMovers };
}

/**
 * Create timeline comparison section — daily mode only
 */
function createTimelineSection(
  transactions,
  chartRenderer,
  activeCharts,
  sharedMonthState
) {
  const timelineDiv = document.createElement('div');
  timelineDiv.style.marginTop = SPACING.LG;

  const timelineHeader = document.createElement('div');
  timelineHeader.style.display = 'flex';
  timelineHeader.style.justifyContent = 'space-between';
  timelineHeader.style.alignItems = 'center';
  timelineHeader.style.marginBottom = SPACING.MD;

  const timelineTitle = document.createElement('h3');
  timelineTitle.textContent = 'Daily Expenses';
  timelineTitle.style.margin = '0';
  timelineTitle.style.fontSize = '1rem';
  timelineTitle.style.fontWeight = '600';
  timelineHeader.appendChild(timelineTitle);

  let isRendering = false; // Prevent double rendering

  // Navigation buttons
  const navContainer = document.createElement('div');
  navContainer.style.display = 'flex';
  navContainer.style.gap = SPACING.SM;
  navContainer.style.alignItems = 'center';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'timeline-prev-btn';
  prevBtn.textContent = '← Previous';
  prevBtn.style.padding = '6px 12px';
  prevBtn.style.fontSize = '0.85rem';
  prevBtn.style.border = `1px solid ${COLORS.BORDER}`;
  prevBtn.style.background = COLORS.SURFACE;
  prevBtn.style.color = COLORS.TEXT_MAIN;
  prevBtn.style.borderRadius = 'var(--radius-sm)';
  prevBtn.style.cursor = 'pointer';
  prevBtn.style.transition = 'all 0.2s ease';

  prevBtn.addEventListener('mouseover', () => {
    prevBtn.style.background = COLORS.SURFACE_HOVER;
  });
  prevBtn.addEventListener('mouseout', () => {
    prevBtn.style.background = COLORS.SURFACE;
  });
  prevBtn.addEventListener('click', () => {
    sharedMonthState.offset--;
    if (sharedMonthState.onNavigate) sharedMonthState.onNavigate();
  });

  const nextBtn = document.createElement('button');
  nextBtn.className = 'timeline-next-btn';
  nextBtn.textContent = 'Next →';
  nextBtn.style.padding = '6px 12px';
  nextBtn.style.fontSize = '0.85rem';
  nextBtn.style.border = `1px solid ${COLORS.BORDER}`;
  nextBtn.style.background = COLORS.SURFACE;
  nextBtn.style.color = COLORS.TEXT_MAIN;
  nextBtn.style.borderRadius = 'var(--radius-sm)';
  nextBtn.style.cursor = 'pointer';
  nextBtn.style.transition = 'all 0.2s ease';

  nextBtn.addEventListener('mouseover', () => {
    nextBtn.style.background = COLORS.SURFACE_HOVER;
  });
  nextBtn.addEventListener('mouseout', () => {
    nextBtn.style.background = COLORS.SURFACE;
  });
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
  timelineChartWrapper.style.position = 'relative';
  timelineChartWrapper.style.height = '300px';
  const timelineCanvas = document.createElement('canvas');
  timelineCanvas.id = 'insights-timeline-chart'; // Fixed ID for consistent tracking
  timelineCanvas.style.width = '100%';
  timelineCanvas.style.maxHeight = '100%';
  timelineChartWrapper.appendChild(timelineCanvas);
  timelineDiv.appendChild(timelineChartWrapper);

  function renderTimelineChart() {
    // Prevent double rendering
    if (isRendering) return;
    isRendering = true;

    // Destroy existing chart using the activeCharts key
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

    // Daily mode: cumulative daily data comparing current month vs previous month
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

    // Single-pass transaction aggregation by day
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
      if (t.isGhost) continue;
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

    // Update title with month
    const monthName = targetDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
    timelineTitle.textContent = `Daily Expenses: ${monthName}`;

    // Update navigation button text
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
              borderColor: 'hsl(150, 70%, 45%)',
              backgroundColor: 'hsla(150, 70%, 45%, 0.1)',
              borderWidth: 3,
              fill: false,
            },
            {
              label: previousMonthLabel,
              data: previousData,
              borderColor: 'hsl(250, 84%, 60%)',
              backgroundColor: 'hsla(250, 84%, 60%, 0.1)',
              borderWidth: 3,
              fill: false,
            },
          ],
        },
        {
          title: 'Daily Trend',
          responsive: true,
          maintainAspectRatio: false,
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

  // Initial render
  renderTimelineChart();

  return {
    timelineDiv,
    timelineChartWrapper,
    renderTimelineChart,
    getCurrentMode: () => 'daily',
  };
}

/**
 * Insights Section Component
 * @param {Object} planningData - Financial planning data including transactions
 * @param {Object} chartRenderer - Chart renderer service instance
 * @param {Map} activeCharts - Map to track active chart instances
 * @returns {HTMLElement} DOM element containing insights section content
 */
export const InsightsSection = (planningData, chartRenderer, activeCharts) => {
  // Shared month state for synchronized navigation
  const sharedMonthState = {
    offset: 0, // 0 = current month, -1 = last month, etc.
    onNavigate: null, // Callback to notify other sections of navigation
  };

  const section = createSectionContainer(
    'insights',
    'Financial Insights',
    '💡'
  );
  section.className += ' insights-section';

  section.appendChild(
    createUsageNote(
      'Insights highlight Top Movers and timeline comparisons. Use these to find categories driving changes and drill into transactions for details.'
    )
  );

  const txCount = (planningData?.transactions || []).length;
  const unlockCard = ProgressiveEmptyState({
    section: 'insights',
    transactionCount: txCount,
    minTransactions: 30,
  });
  if (unlockCard) {
    section.appendChild(unlockCard);
  }

  if (
    !planningData ||
    !planningData.transactions ||
    planningData.transactions.length === 0
  ) {
    const placeholder = createPlaceholder(
      'Advanced Insights Coming Soon',
      'Discover spending patterns, top movers analysis, and timeline comparisons.',
      '💡'
    );
    section.appendChild(placeholder);
    // Ensure a consistent return shape so callers can always use `.element`.
    return { element: section, cleanup: () => {} };
  }

  const transactions = planningData.transactions;

  // Top Movers (by absolute spend/amount per category)
  const { topContainer, renderTopMovers } = createTopMoversSection(
    planningData,
    chartRenderer,
    activeCharts,
    sharedMonthState
  );
  section.appendChild(topContainer);

  // Timeline comparison: daily expenses
  const { timelineDiv, renderTimelineChart } = createTimelineSection(
    transactions,
    chartRenderer,
    activeCharts,
    sharedMonthState
  );
  section.appendChild(timelineDiv);

  // Personal Inflation Trends - now linked to shared navigation
  const inflationTrendsComponent = InflationTrends(
    planningData,
    chartRenderer,
    activeCharts,
    sharedMonthState
  );
  section.appendChild(inflationTrendsComponent.element);

  // Net Balance Over Time chart — appended async after the rest of the section
  createNetBalanceChart().then(netBalanceChart => {
    section.appendChild(netBalanceChart);
  });

  // Set up synchronized navigation - all sections update together
  sharedMonthState.onNavigate = () => {
    renderTopMovers();
    renderTimelineChart();
    if (inflationTrendsComponent.render) {
      inflationTrendsComponent.render();
    }
  };

  // Store references for cleanup
  sharedMonthState.cleanup = () => {
    sharedMonthState.onNavigate = null;
    if (inflationTrendsComponent.cleanup) {
      inflationTrendsComponent.cleanup();
    }
  };

  return { element: section, cleanup: sharedMonthState.cleanup };
};
