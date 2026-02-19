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

import { COLORS, SPACING } from '../../utils/constants.js';
import {
  createSectionContainer,
  createPlaceholder,
  createUsageNote,
} from '../../utils/financial-planning-helpers.js';
import { InsightsGenerator } from '../../core/insights-generator.js';

/**
 * Create top movers analysis
 */
function createTopMoversSection(planningData, chartRenderer, activeCharts) {
  const topMovers = InsightsGenerator.topMovers(planningData.transactions, 6);

  const topContainer = document.createElement('div');
  topContainer.className = 'insights-top-movers';
  topContainer.style.display = 'flex';
  topContainer.style.flexDirection = 'column';
  topContainer.style.gap = SPACING.MD;

  const topTitle = document.createElement('h3');
  topTitle.textContent = 'Top Movers';
  topTitle.style.margin = '0';
  topTitle.style.fontSize = '1rem';
  topTitle.style.fontWeight = '600';
  topContainer.appendChild(topTitle);

  const list = document.createElement('ul');
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
  topChartDiv.style.marginTop = SPACING.MD;
  topChartDiv.style.position = 'relative';
  topChartDiv.style.height = '220px';
  const topCanvas = document.createElement('canvas');
  topCanvas.id = `insights-top-movers-${Date.now()}`;
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

  return { topContainer, topChartDiv };
}

/**
 * Create timeline comparison section
 */
function createTimelineSection(transactions, chartRenderer, activeCharts) {
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

      // Render chart
      renderTimelineChart(mode);
    });

    return btn;
  };

  const monthlyBtn = createToggleBtn('Monthly', 'monthly', true);
  const dailyBtn = createToggleBtn('Daily', 'daily', false);

  toggleContainer.appendChild(monthlyBtn);
  toggleContainer.appendChild(dailyBtn);
  timelineHeader.appendChild(toggleContainer);
  timelineDiv.appendChild(timelineHeader);

  const timelineChartWrapper = document.createElement('div');
  timelineChartWrapper.style.position = 'relative';
  timelineChartWrapper.style.height = '300px';
  const timelineCanvas = document.createElement('canvas');
  timelineCanvas.id = `insights-timeline-${Date.now()}`;
  timelineCanvas.style.width = '100%';
  timelineCanvas.style.maxHeight = '100%';
  timelineChartWrapper.appendChild(timelineCanvas);
  timelineDiv.appendChild(timelineChartWrapper);

  let currentTimelineChart = null;

  function renderTimelineChart(mode) {
    if (currentTimelineChart) {
      currentTimelineChart.destroy();
      currentTimelineChart = null;
    }

    const now = new Date();
    const keys = [];
    let labelFormat;
    let title;
    let sumFunction = null;

    if (mode === 'monthly') {
      title = 'Monthly Expenses: This Period vs Previous Period';
      labelFormat = { month: 'short', year: 'numeric' };
      const monthsBack = 6;
      for (let i = monthsBack - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        keys.push(
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        );
      }

      sumFunction = (key, txs) => {
        const [y, m] = key.split('-').map(Number);
        const start = new Date(y, m - 1, 1);
        const end = new Date(y, m, 1); // First day of next month
        return txs.reduce((sum, t) => {
          const ts = new Date(t.timestamp);
          if (ts >= start && ts < end && t.type === 'expense') {
            return (
              sum +
              (typeof t.amount === 'number' ? t.amount : Number(t.amount) || 0)
            );
          }
          return sum;
        }, 0);
      };
    } else {
      // Daily mode: show daily data comparing current month vs previous month
      title = 'Daily Expenses: Current Month vs Previous Month';
      labelFormat = { month: 'short', day: 'numeric' };
      // Show all days in current month
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const daysInCurrentMonth = new Date(
        currentYear,
        currentMonth + 1,
        0
      ).getDate();

      for (let day = 1; day <= daysInCurrentMonth; day++) {
        keys.push(
          `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        );
      }

      sumFunction = (key, txs) => {
        // key format YYYY-MM-DD
        return txs.reduce((sum, t) => {
          const dateStr = t.timestamp.split('T')[0];
          if (dateStr === key && t.type === 'expense') {
            return (
              sum +
              (typeof t.amount === 'number' ? t.amount : Number(t.amount) || 0)
            );
          }
          return sum;
        }, 0);
      };
    }

    timelineTitle.textContent = title;

    // Generate data series
    const currentSeries = keys.map(k => ({
      period: k,
      value: sumFunction(k, transactions),
    }));

    const previousSeries = keys.map(k => {
      // Calculate previous period (not previous year)
      const parts = k.split('-').map(Number); // [y, m, d?]
      const y = parts[0];
      const m = parts[1];
      const d = parts[2]; // undefined if monthly
      let prevKey;
      if (mode === 'monthly') {
        // Previous month: subtract 1 month
        if (m === 1) {
          // January -> December of previous year
          prevKey = `${y - 1}-12`;
        } else {
          prevKey = `${y}-${String(m - 1).padStart(2, '0')}`;
        }
      } else {
        // Daily mode: compare same day in previous month
        const currentDate = new Date(y, m - 1, d);
        // Go to same day in previous month
        currentDate.setMonth(currentDate.getMonth() - 1);
        prevKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      }
      return { period: prevKey, value: sumFunction(prevKey, transactions) };
    });

    const chartLabels = keys.map(k => {
      const parts = k.split('-').map(Number);
      // For monthly: parts=[y, m]. For daily: parts=[y, m, d]
      const d =
        parts.length === 3
          ? new Date(parts[0], parts[1] - 1, parts[2])
          : new Date(parts[0], parts[1] - 1, 1); // undefined if monthly
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
            { label: 'This Period', data: currentData },
            { label: 'Previous Period', data: previousData },
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
          currentTimelineChart = chart;
          activeCharts.set('insights-timeline', chart);
        }
      })
      .catch(err => console.error('Timeline chart error', err));
  }

  // Initial render
  renderTimelineChart('monthly');

  return { timelineDiv, timelineChartWrapper };
}

/**
 * Insights Section Component
 * @param {Object} planningData - Financial planning data including transactions
 * @param {Object} chartRenderer - Chart renderer service instance
 * @param {Map} activeCharts - Map to track active chart instances
 * @returns {HTMLElement} DOM element containing insights section content
 */
export const InsightsSection = (planningData, chartRenderer, activeCharts) => {
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
  const { topContainer } = createTopMoversSection(
    planningData,
    chartRenderer,
    activeCharts
  );
  section.appendChild(topContainer);

  // Timeline comparison: monthly/daily expenses
  const { timelineDiv } = createTimelineSection(
    transactions,
    chartRenderer,
    activeCharts
  );
  section.appendChild(timelineDiv);

  return section;
};
