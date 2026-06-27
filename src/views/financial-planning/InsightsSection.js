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
 * Create Financial Snapshot - Experimental Feature
 * Shows a monthly summary: "My monthly salary is $X, expenses are $Y, savings are $Z, and debts are $W"
 * Debt is manually entered by the user and persisted to localStorage.
 *
 * @param {Array} transactions - Array of transaction objects
 * @returns {HTMLElement} Financial snapshot card element
 */
function createFinancialSnapshotSection(transactions) {
  const snapshot = document.createElement('div');
  snapshot.className = 'insights-financial-snapshot';
  snapshot.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: ${SPACING.SM};
    padding: ${SPACING.MD};
    background: linear-gradient(135deg, var(--color-surface, ${COLORS.SURFACE}), var(--color-surface-hover, ${COLORS.SURFACE_HOVER}));
    border: 2px dashed var(--color-accent, ${COLORS.PRIMARY}33);
    border-radius: 14px;
    position: relative;
  `;

  // --- Experimental badge ---
  const badge = document.createElement('span');
  badge.textContent = 'Experimental';
  badge.style.cssText = `
    position: absolute;
    top: -8px;
    right: 12px;
    background: ${COLORS.PRIMARY};
    color: white;
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 2px 10px;
    border-radius: 20px;
  `;
  snapshot.appendChild(badge);

  // --- Header ---
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    align-items: center;
    gap: ${SPACING.SM};
    margin-bottom: ${SPACING.XS};
  `;
  const icon = document.createElement('span');
  icon.textContent = '🧪';
  icon.style.fontSize = '1.4rem';
  const title = document.createElement('h3');
  title.textContent = 'Financial Snapshot';
  title.style.cssText = `
    margin: 0;
    font-size: 1.15rem;
    font-weight: 600;
    color: ${COLORS.TEXT_MAIN};
  `;
  header.appendChild(icon);
  header.appendChild(title);
  snapshot.appendChild(header);

  // --- Calculations ---
  const now = new Date();
  const monthsLookback = 6;
  const rangeStart = new Date(
    now.getFullYear(),
    now.getMonth() - monthsLookback,
    1
  );
  const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // Group by month to calculate averages
  const monthBuckets = {};
  for (let i = -monthsLookback + 1; i <= 0; i++) {
    const m = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const key = `${m.getFullYear()}-${m.getMonth()}`;
    monthBuckets[key] = {
      label: m.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      income: 0,
      expenses: 0,
    };
  }

  transactions.forEach(t => {
    if (t.isGhost) return;
    const ts = new Date(t.timestamp);
    if (ts < rangeStart || ts >= rangeEnd) return;
    const key = `${ts.getFullYear()}-${ts.getMonth()}`;
    if (!monthBuckets[key]) return;

    const amount =
      typeof t.amount === 'number' ? t.amount : Number(t.amount) || 0;
    if (t.type === TRANSACTION_TYPES.INCOME) {
      monthBuckets[key].income += amount;
    } else if (t.type === TRANSACTION_TYPES.EXPENSE) {
      monthBuckets[key].expenses += amount;
    } else if (t.type === TRANSACTION_TYPES.REFUND) {
      monthBuckets[key].expenses -= amount;
    }
  });

  const filledMonths = Object.values(monthBuckets).filter(
    m => m.income > 0 || m.expenses > 0
  );
  const monthCount = Math.max(filledMonths.length, 1);

  const totalIncome = filledMonths.reduce((s, m) => s + m.income, 0);
  const totalExpenses = filledMonths.reduce((s, m) => s + m.expenses, 0);

  const monthlySalary = totalIncome / monthCount;
  const monthlyExpenses = totalExpenses / monthCount;
  const monthlySavings = monthlySalary - monthlyExpenses;

  // --- Manual debt input (persisted to localStorage) ---
  const DEBT_STORAGE_KEY = 'blinkbudget_financial_snapshot_debt';
  let totalDebt = 0;
  try {
    const saved = localStorage.getItem(DEBT_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      totalDebt = typeof parsed === 'number' && parsed >= 0 ? parsed : 0;
    }
  } catch {
    // storage unavailable or corrupt — treat as zero
  }

  // --- Format helpers ---
  const fmtUSD = value =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  // --- Render the sentence ---
  const sentence = document.createElement('p');
  sentence.style.cssText = `
    margin: 0;
    font-size: 1rem;
    line-height: 1.7;
    color: ${COLORS.TEXT_MAIN};
  `;

  // Build the sentence with styled spans for each value
  sentence.appendChild(document.createTextNode('My monthly salary is '));

  const salSpan = document.createElement('strong');
  salSpan.textContent = fmtUSD(monthlySalary);
  salSpan.style.color = '#22c55e';
  sentence.appendChild(salSpan);

  sentence.appendChild(document.createTextNode(', expenses are '));

  const expSpan = document.createElement('strong');
  expSpan.textContent = fmtUSD(monthlyExpenses);
  expSpan.style.color = '#ef4444';
  sentence.appendChild(expSpan);

  sentence.appendChild(document.createTextNode(', savings are '));

  const savSpan = document.createElement('strong');
  savSpan.textContent = fmtUSD(monthlySavings);
  savSpan.style.color = monthlySavings >= 0 ? '#22c55e' : '#ef4444';
  sentence.appendChild(savSpan);

  sentence.appendChild(document.createTextNode(', and debts are '));

  // --- Editable debt amount ---
  const debtContainer = document.createElement('span');
  debtContainer.style.display = 'inline-flex';
  debtContainer.style.alignItems = 'center';
  debtContainer.style.gap = '4px';
  debtContainer.style.cursor = 'pointer';

  const debtValueSpan = document.createElement('strong');
  debtValueSpan.textContent = fmtUSD(totalDebt);
  debtValueSpan.style.color = totalDebt > 0 ? '#ef4444' : '#22c55e';
  debtContainer.appendChild(debtValueSpan);

  // Edit icon (pencil)
  const editIcon = document.createElement('span');
  editIcon.textContent = '\u270F\uFE0F';
  editIcon.style.fontSize = '0.75rem';
  editIcon.style.opacity = '0.5';
  editIcon.style.transition = 'opacity 0.2s';
  debtContainer.appendChild(editIcon);

  // Info tooltip
  const infoIcon = document.createElement('span');
  infoIcon.textContent = '\u24D8';
  infoIcon.style.fontSize = '0.75rem';
  infoIcon.style.opacity = '0.4';
  infoIcon.style.cursor = 'help';
  infoIcon.title =
    'Your total outstanding debt (mortgage, car loans, credit cards, student loans, etc.). Click the amount or edit icon to set your total debt.';
  debtContainer.appendChild(infoIcon);

  // Input field (hidden by default)
  const debtInput = document.createElement('input');
  debtInput.type = 'number';
  debtInput.min = '0';
  debtInput.step = '100';
  debtInput.value = totalDebt;
  debtInput.style.cssText = `
    display: none;
    width: 140px;
    padding: 2px 8px;
    font-size: 0.9rem;
    border: 1px solid ${COLORS.PRIMARY};
    border-radius: 4px;
    background: var(--color-surface, ${COLORS.SURFACE});
    color: ${COLORS.TEXT_MAIN};
    outline: none;
  `;
  debtContainer.appendChild(debtInput);

  function enterEditMode() {
    debtValueSpan.style.display = 'none';
    editIcon.style.display = 'none';
    infoIcon.style.display = 'none';
    debtInput.style.display = 'inline-block';
    debtInput.focus();
    debtInput.select();
  }

  function exitEditMode(save) {
    const rawVal = debtInput.value.trim();
    const parsed = rawVal === '' ? 0 : Number(rawVal);
    const newDebt = !isNaN(parsed) && parsed >= 0 ? parsed : totalDebt;

    if (save !== false && newDebt !== totalDebt) {
      totalDebt = newDebt;
      try {
        localStorage.setItem(DEBT_STORAGE_KEY, JSON.stringify(totalDebt));
      } catch {
        /* storage unavailable */
      }
    }

    debtValueSpan.textContent = fmtUSD(totalDebt);
    debtValueSpan.style.color = totalDebt > 0 ? '#ef4444' : '#22c55e';
    debtValueSpan.style.display = 'inline';
    editIcon.style.display = 'inline';
    infoIcon.style.display = 'inline';
    debtInput.style.display = 'none';
    debtInput.value = totalDebt;
  }

  debtContainer.addEventListener('click', e => {
    if (e.target === infoIcon) return;
    if (debtInput.style.display === 'none') {
      enterEditMode();
    }
  });

  debtInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      exitEditMode(true);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      exitEditMode(false);
    }
  });

  debtInput.addEventListener('blur', () => {
    exitEditMode(true);
  });

  debtContainer.addEventListener('mouseenter', () => {
    editIcon.style.opacity = '1';
  });
  debtContainer.addEventListener('mouseleave', () => {
    if (debtInput.style.display === 'none') {
      editIcon.style.opacity = '0.5';
    }
  });

  sentence.appendChild(debtContainer);

  sentence.appendChild(document.createTextNode('.'));

  snapshot.appendChild(sentence);

  // --- Detail row (smaller, muted) ---
  const detail = document.createElement('div');
  detail.style.cssText = `
    display: flex;
    gap: ${SPACING.MD};
    flex-wrap: wrap;
    font-size: 0.8rem;
    color: ${COLORS.TEXT_MUTED};
    margin-top: ${SPACING.XS};
  `;

  const periodSpan = document.createElement('span');
  const firstMonth =
    filledMonths.length > 0
      ? filledMonths[0].label
      : monthBuckets[Object.keys(monthBuckets)[0]]?.label || '';
  const lastMonth =
    filledMonths.length > 0 ? filledMonths[filledMonths.length - 1].label : '';
  periodSpan.textContent = `Based on ${monthCount} month${monthCount !== 1 ? 's' : ''} (${firstMonth}${lastMonth && lastMonth !== firstMonth ? ` \u2013 ${lastMonth}` : ''})`;
  detail.appendChild(periodSpan);

  // Savings rate
  if (monthlySalary > 0) {
    const rateSpan = document.createElement('span');
    const savingsRate = (monthlySavings / monthlySalary) * 100;
    rateSpan.textContent = `Savings rate: ${savingsRate.toFixed(1)}%`;
    detail.appendChild(rateSpan);
  }

  snapshot.appendChild(detail);

  return snapshot;
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

  // Financial Snapshot - Experimental feature
  const snapshotSection = createFinancialSnapshotSection(transactions);
  section.appendChild(snapshotSection);

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
