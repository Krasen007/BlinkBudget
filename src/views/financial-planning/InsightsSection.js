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
import { getAnalyticsEngine } from '../../core/analytics/AnalyticsInstance.js';
import { TrendAnalysisSection } from '../../components/TrendAnalysisSection.js';
import { BudgetRecommendationsSection } from '../../components/BudgetRecommendationsSection.js';
import { OptimizationInsights } from '../../components/OptimizationInsights.js';
import { getCurrentMonthPeriod } from '../../utils/reports-utils.js';

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

    // Pre-process transactions to handle refunds before passing to InsightsGenerator
    const processedTransactions = monthTransactions.map(t => {
      if (t.type === TRANSACTION_TYPES.REFUND) {
        // Convert refund to negative expense for proper calculation
        return {
          ...t,
          type: TRANSACTION_TYPES.EXPENSE,
          amount: -Math.abs(t.amount || 0),
        };
      }
      return t;
    });

    return {
      transactions: processedTransactions,
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

    const list = document.createElement('ul');
    list.className = 'top-movers-list';
    list.style.listStyle = 'none';
    list.style.padding = '0';
    list.style.margin = '0';
    list.style.display = 'grid';
    list.style.gridTemplateColumns = '1fr auto';
    list.style.gap = SPACING.SM;

    const currency = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    });

    topMovers.forEach(item => {
      const liLabel = document.createElement('li');
      liLabel.textContent = item.category;
      liLabel.style.fontWeight = '600';
      liLabel.style.color = COLORS.TEXT_MAIN;

      const liValue = document.createElement('li');
      liValue.textContent = currency.format(Math.abs(item.total));
      liValue.style.textAlign = 'right';
      liValue.style.color = COLORS.TEXT_MUTED;

      list.appendChild(liLabel);
      list.appendChild(liValue);
    });

    topContainer.appendChild(list);

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
 * Create timeline comparison section
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
  timelineTitle.textContent = 'Expenses Timeline';
  timelineTitle.style.margin = '0';
  timelineTitle.style.fontSize = '1rem';
  timelineTitle.style.fontWeight = '600';
  timelineHeader.appendChild(timelineTitle);

  // Toggle and navigation container
  const controlsContainer = document.createElement('div');
  controlsContainer.style.display = 'flex';
  controlsContainer.style.gap = SPACING.MD;
  controlsContainer.style.alignItems = 'center';

  // Track current mode for re-rendering
  let currentMode = 'monthly';
  let isRendering = false; // Prevent double rendering

  // Toggle control
  const toggleContainer = document.createElement('div');
  toggleContainer.style.display = 'flex';
  toggleContainer.style.gap = '2px';
  toggleContainer.style.background = COLORS.BORDER;
  toggleContainer.style.padding = '2px';
  toggleContainer.style.borderRadius = 'var(--radius-sm)';

  const createToggleBtn = (text, mode, initialActive) => {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.style.border = 'none';
    btn.style.background = initialActive ? COLORS.SURFACE : 'transparent';
    btn.style.color = initialActive ? COLORS.PRIMARY : COLORS.TEXT_MUTED;
    btn.style.fontWeight = initialActive ? '600' : 'normal';
    btn.style.padding = '4px 12px';
    btn.style.fontSize = '0.85rem';
    btn.style.borderRadius = 'var(--radius-sm)';
    btn.style.cursor = 'pointer';
    btn.style.transition = 'all 0.2s ease';

    btn.addEventListener('click', () => {
      // Update UI
      Array.from(toggleContainer.children).forEach(b => {
        b.style.background = 'transparent';
        b.style.color = COLORS.TEXT_MUTED;
        b.style.fontWeight = 'normal';
      });
      btn.style.background = COLORS.SURFACE;
      btn.style.color = COLORS.PRIMARY;
      btn.style.fontWeight = '600';

      // Update current mode and render
      currentMode = mode;
      sharedMonthState.offset = 0; // Reset to current month when switching modes

      // Use the shared callback to update all sections
      if (sharedMonthState.onNavigate) sharedMonthState.onNavigate();
    });

    return btn;
  };

  const monthlyBtn = createToggleBtn('Monthly', 'monthly', true);
  const dailyBtn = createToggleBtn('Daily', 'daily', false);

  toggleContainer.appendChild(monthlyBtn);
  toggleContainer.appendChild(dailyBtn);
  controlsContainer.appendChild(toggleContainer);

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
  controlsContainer.appendChild(navContainer);
  timelineHeader.appendChild(controlsContainer);
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

  function renderTimelineChart(mode) {
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

    let keys = [];
    const prevKeys = [];
    let labelFormat;
    let title;
    let sumFunction = null;

    if (mode === 'monthly') {
      title = 'Monthly Expenses: This Period vs Previous Period';
      labelFormat = { month: 'short', year: 'numeric' };
      const monthsBack = 6;
      for (let i = monthsBack - 1; i >= 0; i--) {
        const d = new Date(
          targetDate.getFullYear(),
          targetDate.getMonth() - i,
          1
        );
        keys.push(
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        );
      }

      sumFunction = (key, txs) => {
        const [y, m] = key.split('-').map(Number);
        const start = new Date(y, m - 1, 1);
        const end = new Date(y, m, 1); // First day of next month
        return txs.reduce((sum, t) => {
          if (t.isGhost) return sum;
          const ts = new Date(t.timestamp);
          if (ts >= start && ts < end) {
            return sum + getTransactionAmount(t);
          }
          return sum;
        }, 0);
      };
    } else {
      // Daily mode: show cumulative daily data comparing current month vs previous month
      title = 'Daily Expenses : Current Month vs Previous Month';
      labelFormat = { month: 'short', day: 'numeric' };
      // Show all days in target month
      const targetMonth = targetDate.getMonth();
      const targetYear = targetDate.getFullYear();
      const daysInTargetMonth = new Date(
        targetYear,
        targetMonth + 1,
        0
      ).getDate();

      // Get previous month's day count for comparison
      const prevMonth = new Date(targetYear, targetMonth - 1, 1);
      const daysInPrevMonth = new Date(
        prevMonth.getFullYear(),
        prevMonth.getMonth() + 1,
        0
      ).getDate();

      // Use the maximum of both months to show all days
      const maxDaysToShow = Math.max(daysInTargetMonth, daysInPrevMonth);

      // Generate keys for the target month only (don't extend into next month)
      const targetKeys = [];

      for (let day = 1; day <= maxDaysToShow; day++) {
        if (day <= daysInTargetMonth) {
          // Real days in target month
          targetKeys.push(
            `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          );
        } else {
          // Virtual days (beyond target month) - use last day of target month
          targetKeys.push(
            `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(daysInTargetMonth).padStart(2, '0')}`
          );
        }

        // For previous month, use actual days
        if (day <= daysInPrevMonth) {
          prevKeys.push(
            `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          );
        } else {
          // If previous month has fewer days, repeat the last day
          prevKeys.push(
            `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}-${String(daysInPrevMonth).padStart(2, '0')}`
          );
        }
      }

      keys = targetKeys;

      sumFunction = (key, txs, isCumulative = false) => {
        // key format YYYY-MM-DD
        if (!isCumulative) {
          // Single day sum
          return txs.reduce((sum, t) => {
            if (t.isGhost) return sum;
            const dateStr = t.timestamp.split('T')[0];
            if (dateStr === key) {
              return sum + getTransactionAmount(t);
            }
            return sum;
          }, 0);
        } else {
          // Cumulative sum from start of month to this day
          const [y, m, d] = key.split('-').map(Number);
          const targetDateCalc = new Date(y, m - 1, d);
          const monthStart = new Date(y, m - 1, 1);

          return txs.reduce((sum, t) => {
            if (t.isGhost) return sum;
            const ts = new Date(t.timestamp);
            if (ts >= monthStart && ts <= targetDateCalc) {
              return sum + getTransactionAmount(t);
            }
            return sum;
          }, 0);
        }
      };
    }

    // Update title with month
    const monthName = targetDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
    timelineTitle.textContent = `${title.split(':')[0]}: ${monthName}`;

    // Update navigation button text
    const prevBtn = timelineDiv.querySelector('.timeline-prev-btn');
    const nextBtn = timelineDiv.querySelector('.timeline-next-btn');
    if (prevBtn && nextBtn) {
      const prevMonth = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth() - 1,
        1
      );
      const nextMonth = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth() + 1,
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

    // Generate data series
    let currentSeries, previousSeries;
    let currentMonthLabel, previousMonthLabel;

    if (mode === 'daily') {
      // For daily mode, use cumulative sums
      currentSeries = keys.map(k => ({
        period: k,
        value: sumFunction(k, transactions, true), // true = cumulative
      }));

      previousSeries = keys.map((_k, index) => {
        // Use the pre-calculated previous month key
        const prevKey = prevKeys[index];
        return {
          period: prevKey,
          value: sumFunction(prevKey, transactions, true),
        }; // true = cumulative
      });

      // Get month names for labels
      currentMonthLabel = targetDate.toLocaleDateString('en-US', {
        month: 'long',
      });
      const prevMonth = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth() - 1,
        1
      );
      previousMonthLabel = prevMonth.toLocaleDateString('en-US', {
        month: 'long',
      });
    } else {
      // For monthly mode, use regular sums
      currentSeries = keys.map(k => ({
        period: k,
        value: sumFunction(k, transactions),
      }));

      previousSeries = keys.map(k => {
        // Calculate previous period (not previous year)
        const parts = k.split('-').map(Number); // [y, m]
        const y = parts[0];
        const m = parts[1];
        let prevKey;
        // Previous month: subtract 1 month
        if (m === 1) {
          // January -> December of previous year
          prevKey = `${y - 1}-12`;
        } else {
          prevKey = `${y}-${String(m - 1).padStart(2, '0')}`;
        }
        return { period: prevKey, value: sumFunction(prevKey, transactions) };
      });

      // For monthly mode, use generic labels since we're showing 6 months
      currentMonthLabel = 'This Period';
      previousMonthLabel = 'Previous Period';
    }

    const chartLabels = keys.map((k, _index) => {
      const parts = k.split('-').map(Number);
      // For monthly: parts=[y, m]. For daily: parts=[y, m, d]
      const d =
        parts.length === 3
          ? new Date(parts[0], parts[1] - 1, parts[2])
          : new Date(parts[0], parts[1] - 1, 1); // undefined if monthly

      // For daily mode, if we're showing virtual days (beyond the month),
      // show them with the actual day number (e.g., "Feb 29", "Feb 30", "Feb 31")
      if (mode === 'daily' && parts.length === 3) {
        const targetMonth = targetDate.getMonth();
        const targetYear = targetDate.getFullYear();
        const daysInTargetMonth = new Date(
          targetYear,
          targetMonth + 1,
          0
        ).getDate();
        const dayNum = parts[2];

        if (dayNum > daysInTargetMonth) {
          // Virtual day - show placeholder instead of invalid date
          return '—';
        }
      }

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
            { label: currentMonthLabel, data: currentData },
            { label: previousMonthLabel, data: previousData },
          ],
        },
        {
          title: mode === 'monthly' ? 'Monthly Trend' : 'Daily Trend',
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
        // Reset rendering flag after chart is created
        isRendering = false;
      });
  }

  // Initial render
  renderTimelineChart('monthly');

  // Return getCurrentMode function to access current mode from outside
  return {
    timelineDiv,
    timelineChartWrapper,
    renderTimelineChart,
    getCurrentMode: () => currentMode,
  };
}

/**
 * Render optimization insights with error handling
 */
function renderOptimizationInsights(section, planningData) {
  try {
    const analyticsEngine = getAnalyticsEngine();
    const currentTimePeriod = getCurrentMonthPeriod();

    const optInsights = analyticsEngine.getOptimizationInsights
      ? analyticsEngine.getOptimizationInsights(
          planningData.transactions,
          currentTimePeriod
        )
      : [];

    if (optInsights && optInsights.length > 0) {
      const optSection = OptimizationInsights(optInsights);
      optSection.style.setProperty(
        'margin-top',
        'var(--spacing-md)',
        'important'
      );
      section.appendChild(optSection);
    }
  } catch (error) {
    console.warn(
      '[InsightsSection] Failed to render optimization insights:',
      error
    );
  }
}

/**
 * Render trend analysis section with direction indicators, consistency scores, and MoM
 */
function renderTrendAnalysisSection(section, planningData) {
  try {
    const analyticsEngine = getAnalyticsEngine();

    const trends = analyticsEngine.getTrendAnalysis
      ? analyticsEngine.getTrendAnalysis(null, planningData.transactions)
      : { trends: [] };

    const consistency = analyticsEngine.getConsistencyScores
      ? analyticsEngine.getConsistencyScores(planningData.transactions)
      : {};

    if (trends.trends && trends.trends.length > 0) {
      const trendSection = TrendAnalysisSection({
        trends: trends.trends,
        consistencyScores: consistency,
        transactions: planningData.transactions,
      });
      trendSection.style.setProperty(
        'margin-top',
        'var(--spacing-md)',
        'important'
      );
      section.appendChild(trendSection);
    }
  } catch (error) {
    console.warn('[InsightsSection] Failed to render trend analysis:', error);
  }
}


/**
 * Render budget recommendations section - Feature 3.3.4 Predictive Budget
 */
function renderBudgetRecommendationsSection(section, planningData) {
  try {
    const analyticsEngine = getAnalyticsEngine();
    const currentTimePeriod = getCurrentMonthPeriod();

    const recommendationsData = analyticsEngine.getBudgetRecommendations
      ? analyticsEngine.getBudgetRecommendations(
          planningData.transactions,
          currentTimePeriod
        )
      : null;

    if (recommendationsData && recommendationsData.length > 0) {
      const recommendationsSection =
        BudgetRecommendationsSection(recommendationsData);
      recommendationsSection.style.setProperty(
        'margin-top',
        'var(--spacing-md)',
        'important'
      );
      section.appendChild(recommendationsSection);
    }
  } catch (recommendationsError) {
    console.warn(
      '[InsightsSection] Failed to render budget recommendations section:',
      recommendationsError
    );
  }
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
    return section;
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

  // Timeline comparison: monthly/daily expenses
  const { timelineDiv, renderTimelineChart, getCurrentMode } =
    createTimelineSection(
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

  // Optimization Insights - cost-saving recommendations
  renderOptimizationInsights(section, planningData);

  // Trend Analysis - spending direction, consistency scores, MoM
  renderTrendAnalysisSection(section, planningData);


  // Budget Recommendations - Feature 3.3.4 Predictive Budget
  renderBudgetRecommendationsSection(section, planningData);

  // Set up synchronized navigation - all sections update together
  sharedMonthState.onNavigate = () => {
    renderTopMovers();
    renderTimelineChart(getCurrentMode());
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
