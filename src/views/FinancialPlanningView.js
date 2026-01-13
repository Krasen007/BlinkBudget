/**
 * Financial Planning View - Advanced Financial Planning & Forecasting
 *
 * Main view component for comprehensive financial planning features including:
 * - Financial forecasting and predictions
 * - Investment portfolio tracking
 * - Long-term goal planning
 * - Advanced insights and analytics
 * - Risk assessment and warnings
 * - Scenario planning and modeling
 *
 * Requirements: 1.1-1.6, 2.1-2.6, 3.1-3.7, 4.1-4.7, 5.1-5.6, 6.1-6.6, 7.1-7.6, 8.1-8.6, 9.1-9.6, 10.1-10.6, 11.1-11.6
 */

import { Router } from '../core/router.js';
import { TransactionService } from '../core/transaction-service.js';
import { AccountService } from '../core/account-service.js';
import { ForecastEngine } from '../core/forecast-engine.js';
import { AccountBalancePredictor } from '../core/account-balance-predictor.js';
import { RiskAssessor } from '../core/risk-assessor.js';
import { GoalPlanner } from '../core/goal-planner.js';
import { StorageService } from '../core/storage.js';
import { ChartRenderer } from '../components/ChartRenderer.js';
import { InsightsGenerator } from '../core/insights-generator.js';
import {
  createProjectedBalanceChart,
} from '../utils/financial-planning-charts.js';
import {
  COLORS,
  SPACING,
  BREAKPOINTS,
  TIMING,
  STORAGE_KEYS,
} from '../utils/constants.js';
import { debounce } from '../utils/touch-utils.js';
import {
  createUsageNote,
  createPlaceholder,
  createSectionContainer,
} from '../utils/financial-planning-helpers.js';
import { OverviewSection } from './financial-planning/OverviewSection.js';
import { ForecastsSection } from './financial-planning/ForecastsSection.js';
import { InvestmentsSection } from './financial-planning/InvestmentsSection.js';
import { GoalsSection } from './financial-planning/GoalsSection.js';

export const FinancialPlanningView = () => {
  const container = document.createElement('div');
  container.className = 'view-financial-planning view-container view-fixed';

  // State management
  let currentSection = 'overview';
  let isLoading = false;
  let planningData = null;

  // Initialize calculation engines
  const forecastEngine = new ForecastEngine();
  const balancePredictor = new AccountBalancePredictor();
  const riskAssessor = new RiskAssessor();
  const goalPlanner = new GoalPlanner();
  const chartRenderer = new ChartRenderer();

  // Track active charts for cleanup
  const activeCharts = new Map();

  /**
   * Clean up chart instances created by this view
   */
  function cleanupCharts() {
    activeCharts.forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        try {
          chart.destroy();
        } catch (e) {
          // ignore individual chart cleanup errors
          console.warn('Error destroying chart:', e);
        }
      }
    });
    activeCharts.clear();
  }

  // Create header
  const header = createHeader();
  container.appendChild(header);

  // Create navigation tabs
  const navigation = createNavigation();
  container.appendChild(navigation);

  // Helper functions now imported from financial-planning-helpers.js

  // Main content area
  const content = document.createElement('main');
  content.className = 'financial-planning-content';
  content.id = 'financial-planning-main-content';
  content.setAttribute('role', 'main');
  content.setAttribute('aria-labelledby', 'financial-planning-title');
  content.style.flex = '1';
  content.style.display = 'flex';
  content.style.flexDirection = 'column';
  content.style.minHeight = '0';
  content.style.overflow = 'auto';
  content.style.gap = SPACING.LG;
  container.appendChild(content);

  /**
   * Create header with title and back button
   */
  function createHeader() {
    const header = document.createElement('header');
    header.className = 'financial-planning-header';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = SPACING.LG;
    header.style.flexShrink = '0';

    // Left side with back button and title
    const leftSide = document.createElement('div');
    leftSide.style.display = 'flex';
    leftSide.style.alignItems = 'center';
    leftSide.style.gap = SPACING.MD;

    // Back button (always visible)
    const backButton = document.createElement('button');
    backButton.innerHTML = '← Back';
    backButton.className = 'btn btn-ghost financial-planning-back-btn';
    backButton.style.fontSize = '1rem';
    backButton.style.padding = `${SPACING.SM} ${SPACING.MD}`;
    backButton.style.border = `1px solid ${COLORS.BORDER}`;
    backButton.style.borderRadius = 'var(--radius-md)';
    backButton.style.background = COLORS.SURFACE;
    backButton.style.color = COLORS.TEXT_MAIN;
    backButton.style.cursor = 'pointer';
    backButton.style.fontWeight = '500';
    backButton.style.transition = 'all 0.2s ease';
    backButton.title = 'Back to Dashboard';

    // Hover effects
    backButton.addEventListener('mouseenter', () => {
      backButton.style.background = COLORS.SURFACE_HOVER;
      backButton.style.borderColor = COLORS.PRIMARY;
    });

    backButton.addEventListener('mouseleave', () => {
      backButton.style.background = COLORS.SURFACE;
      backButton.style.borderColor = COLORS.BORDER;
    });

    backButton.addEventListener('click', () => Router.navigate('dashboard'));

    // Title
    const title = document.createElement('h2');
    title.id = 'financial-planning-title';
    title.textContent = 'Financial Planning';
    title.style.margin = '0';
    title.style.fontSize =
      window.innerWidth < BREAKPOINTS.MOBILE ? '1.25rem' : 'h2';
    title.style.fontWeight = 'bold';
    title.style.color = COLORS.TEXT_MAIN;

    leftSide.appendChild(backButton);
    leftSide.appendChild(title);

    // Right side: add sync status indicator
    const rightSide = document.createElement('div');
    rightSide.style.display = 'flex';
    rightSide.style.alignItems = 'center';
    rightSide.style.gap = SPACING.SM;

    const syncStatus = document.createElement('div');
    syncStatus.className = 'sync-status';
    syncStatus.style.padding = `${SPACING.XS} ${SPACING.SM}`;
    syncStatus.style.borderRadius = 'var(--radius-sm)';
    syncStatus.style.background = COLORS.SURFACE;
    syncStatus.style.color = COLORS.TEXT_MUTED;
    syncStatus.style.fontSize = '0.875rem';
    syncStatus.textContent = navigator.onLine
      ? 'Sync: online'
      : 'Sync: offline';
    rightSide.appendChild(syncStatus);

    header.appendChild(leftSide);
    header.appendChild(rightSide);

    return header;
  }

  /**
   * Create navigation tabs for different planning sections
   */
  function createNavigation() {
    const nav = document.createElement('nav');
    nav.className = 'financial-planning-nav';
    nav.setAttribute('role', 'tablist');
    nav.style.display = 'flex';
    nav.style.gap = SPACING.SM;
    nav.style.marginBottom = SPACING.LG;
    nav.style.flexWrap = 'wrap'; // Allow wrapping
    nav.style.maxWidth = '100%';

    // Hide scrollbar for webkit browsers
    const style = document.createElement('style');
    style.textContent = `
      .financial-planning-nav::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.appendChild(style);

    const sections = [
      { id: 'overview', label: 'Overview', icon: '📊' },
      { id: 'forecasts', label: 'Forecasts', icon: '🔮' },
      { id: 'investments', label: 'Investments', icon: '💰' },
      { id: 'goals', label: 'Goals', icon: '🎯' },
      { id: 'insights', label: 'Insights', icon: '💡' },
      { id: 'scenarios', label: 'Scenarios', icon: '🔄' },
    ];

    sections.forEach(section => {
      const tab = document.createElement('button');
      tab.className = 'financial-planning-tab';
      tab.setAttribute('role', 'tab');
      tab.setAttribute(
        'aria-selected',
        section.id === currentSection ? 'true' : 'false'
      );
      tab.setAttribute('aria-controls', `${section.id}-panel`);
      tab.id = `${section.id}-tab`;

      tab.innerHTML = `
        <span class="tab-icon">${section.icon}</span>
        <span class="tab-label">${section.label}</span>
      `;

      // Tab styling - use btn-primary sized padding
      Object.assign(tab.style, {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.XS,
        padding: `${SPACING.MD} ${SPACING.XL}`,
        minHeight: 'var(--touch-target-min)',
        minWidth: 'var(--touch-target-min)',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        background:
          section.id === currentSection ? COLORS.PRIMARY : COLORS.SURFACE,
        color: section.id === currentSection ? 'white' : COLORS.TEXT_MAIN,
        cursor: 'pointer',
        fontSize: 'var(--font-size-md)',
        fontWeight: '500',
        whiteSpace: 'nowrap',
        transition: 'all 0.2s ease',
        flex: '1 0 auto', // Grow to fill space, but respect content size
      });

      // Hover effects
      tab.addEventListener('mouseenter', () => {
        if (section.id !== currentSection) {
          tab.style.background = COLORS.SURFACE_HOVER;
        }
      });

      tab.addEventListener('mouseleave', () => {
        if (section.id !== currentSection) {
          tab.style.background = COLORS.SURFACE;
        }
      });

      // Click handler
      tab.addEventListener('click', () => {
        switchSection(section.id);
      });

      nav.appendChild(tab);
    });

    return nav;
  }

  /**
   * Switch between different planning sections
   */
  function switchSection(sectionId) {
    if (sectionId === currentSection) return;

    // Clean up charts from previous section
    cleanupCharts();

    currentSection = sectionId;

    // Update tab states
    const tabs = navigation.querySelectorAll('.financial-planning-tab');
    tabs.forEach(tab => {
      const isActive = tab.id === `${sectionId}-tab`;
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
      tab.style.background = isActive ? COLORS.PRIMARY : COLORS.SURFACE;
      tab.style.color = isActive ? 'white' : COLORS.TEXT_MAIN;
    });

    // Render the selected section
    renderSection(sectionId);
  }

  /**
   * Render the content for the selected section
   */
  function renderSection(sectionId) {
    content.innerHTML = '';

    // Add section panel attributes
    content.setAttribute('role', 'tabpanel');
    content.setAttribute('aria-labelledby', `${sectionId}-tab`);
    content.id = `${sectionId}-panel`;

    switch (sectionId) {
      case 'overview':
        renderOverviewSection();
        break;
      case 'forecasts':
        renderForecastsSection();
        break;
      case 'investments':
        renderInvestmentsSection();
        break;
      case 'goals':
        renderGoalsSection();
        break;
      case 'insights':
        renderInsightsSection();
        break;
      case 'scenarios':
        renderScenariosSection();
        break;
      default:
        renderOverviewSection();
    }
  }

  /**
   * Render Overview section - Financial health summary
   */
  function renderOverviewSection() {
    const overviewElement = OverviewSection(planningData, riskAssessor);
    content.appendChild(overviewElement);
  }

  /**
   * Render Forecasts section - Income/expense predictions
   */
  function renderForecastsSection() {
    const forecastsElement = ForecastsSection(
      planningData,
      forecastEngine,
      balancePredictor,
      chartRenderer,
      activeCharts
    );
    content.appendChild(forecastsElement);
  }

  /**
   * Render Investments section - Portfolio tracking
   */
  function renderInvestmentsSection() {
    const investmentsElement = InvestmentsSection(chartRenderer, activeCharts);
    content.appendChild(investmentsElement);
  }

  /**
   * Render Goals section - Long-term planning
   */
  function renderGoalsSection() {
    const goalsElement = GoalsSection(chartRenderer, activeCharts);
    content.appendChild(goalsElement);
  }

  /**
   * Render Insights section - Advanced analytics
   */
  function renderInsightsSection() {
    const section = createSectionContainer(
      'insights',
      'Financial Insights',
      '💡'
    );
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
      content.appendChild(section);
      return;
    }

    const transactions = planningData.transactions;

    // Top Movers (by absolute spend/amount per category)
    const topMovers = InsightsGenerator.topMovers(transactions, 6);

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

    section.appendChild(topContainer);

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

    // Timeline comparison: monthly/daily expenses
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

    section.appendChild(timelineDiv);

    let currentTimelineChart = null;

    function renderTimelineChart(mode) {
      if (currentTimelineChart) {
        currentTimelineChart.destroy();
        currentTimelineChart = null;
      }

      const now = new Date();
      const keys = [];
      let labelFormat = {};
      let title = '';
      let sumFunction = null;

      if (mode === 'monthly') {
        title = 'Monthly Expenses: This Period vs Previous Year';
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
                (typeof t.amount === 'number'
                  ? t.amount
                  : Number(t.amount) || 0)
              );
            }
            return sum;
          }, 0);
        };
      } else {
        // Daily mode
        title = 'Daily Expenses: Last 30 Days vs Previous Year';
        labelFormat = { month: 'short', day: 'numeric' };
        const daysBack = 30;
        for (let i = daysBack - 1; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          keys.push(
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
          );
        }

        sumFunction = (key, txs) => {
          // key format YYYY-MM-DD
          return txs.reduce((sum, t) => {
            const dateStr = t.timestamp.split('T')[0];
            if (dateStr === key && t.type === 'expense') {
              return (
                sum +
                (typeof t.amount === 'number'
                  ? t.amount
                  : Number(t.amount) || 0)
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
        // Shift year back by 1
        const parts = k.split('-').map(Number); // [y, m, d?]
        const y = parts[0];
        const m = parts[1];
        const d = parts[2]; // undefined if monthly

        let prevKey = '';
        if (mode === 'monthly') {
          prevKey = `${y - 1}-${String(m).padStart(2, '0')}`;
        } else {
          // Handle leap years etc by using Date logic if needed, but simple subtraction works for display alignment
          // Actually, exact date matching for year-over-year:
          // If today is 2024-02-28, prev year is 2023-02-28.
          prevKey = `${y - 1}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }
        return { period: prevKey, value: sumFunction(prevKey, transactions) };
      });

      const chartLabels = keys.map(k => {
        const parts = k.split('-').map(Number);
        // For monthly: parts=[y, m]. For daily: parts=[y, m, d]
        // Note: Date constructor uses 0-indexed months
        const d =
          parts.length === 3
            ? new Date(parts[0], parts[1] - 1, parts[2])
            : new Date(parts[0], parts[1] - 1, 1);
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
              { label: 'Previous Year', data: previousData },
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

    content.appendChild(section);
  }

  /**
   * Render Scenarios section - What-if modeling
   */
  function renderScenariosSection() {
    const section = createSectionContainer(
      'scenarios',
      'Scenario Planning',
      '🔄'
    );
    section.appendChild(
      createUsageNote(
        'Run what-if scenarios by adjusting savings, income or expenses. Compare scenarios side-by-side to see impact on goals and projected balances.'
      )
    );

    const form = document.createElement('div');
    form.className = 'scenario-form';
    form.style.display = 'grid';
    form.style.gridTemplateColumns = '1fr 1fr';
    form.style.gap = SPACING.MD;

    const monthlyLabel = document.createElement('label');
    monthlyLabel.textContent = 'Monthly Savings (€)';
    monthlyLabel.htmlFor = 'scenario-monthly-savings';
    const monthlyInput = document.createElement('input');
    monthlyInput.id = 'scenario-monthly-savings';
    monthlyInput.name = 'monthlySavings';
    monthlyInput.type = 'number';
    monthlyInput.value = '200';
    monthlyInput.style.padding = SPACING.SM;

    const returnLabel = document.createElement('label');
    returnLabel.textContent = 'Annual Return (%)';
    returnLabel.htmlFor = 'scenario-annual-return';
    const returnInput = document.createElement('input');
    returnInput.id = 'scenario-annual-return';
    returnInput.name = 'annualReturn';
    returnInput.type = 'number';
    returnInput.value = '5';
    returnInput.style.padding = SPACING.SM;

    const yearsLabel = document.createElement('label');
    yearsLabel.textContent = 'Years';
    yearsLabel.htmlFor = 'scenario-years';
    const yearsInput = document.createElement('input');
    yearsInput.id = 'scenario-years';
    yearsInput.name = 'years';
    yearsInput.type = 'number';
    yearsInput.value = '10';
    yearsInput.style.padding = SPACING.SM;

    const initialLabel = document.createElement('label');
    initialLabel.textContent = 'Initial Amount (€)';
    initialLabel.htmlFor = 'scenario-initial-amount';
    const initialInput = document.createElement('input');
    initialInput.id = 'scenario-initial-amount';
    initialInput.name = 'initialAmount';
    initialInput.type = 'number';
    initialInput.value = '1000';
    initialInput.style.padding = SPACING.SM;

    const runBtn = document.createElement('button');
    runBtn.textContent = 'Run Scenario';
    runBtn.className = 'btn btn-primary';
    runBtn.style.gridColumn = '1 / -1';
    runBtn.style.padding = `${SPACING.SM} ${SPACING.MD}`;

    form.appendChild(monthlyLabel);
    form.appendChild(monthlyInput);
    form.appendChild(returnLabel);
    form.appendChild(returnInput);
    form.appendChild(yearsLabel);
    form.appendChild(yearsInput);
    form.appendChild(initialLabel);
    form.appendChild(initialInput);
    form.appendChild(runBtn);

    section.appendChild(form);

    const outputContainer = document.createElement('div');
    outputContainer.className = 'scenario-output';
    outputContainer.style.marginTop = SPACING.LG;
    section.appendChild(outputContainer);

    runBtn.addEventListener('click', () => {
      const monthly = Number(monthlyInput.value) || 0;
      const yearlyReturn = (Number(returnInput.value) || 0) / 100;
      const years = Math.max(1, Number(yearsInput.value) || 1);
      const initial = Number(initialInput.value) || 0;

      // Use GoalPlanner projection utility to generate yearly projections
      const projections = goalPlanner.projectWealthAccumulation(
        monthly,
        yearlyReturn,
        years,
        initial
      );

      // Convert to series for chart helper
      const now = new Date();
      const series = projections.map(p => {
        const d = new Date(now);
        d.setFullYear(d.getFullYear() + p.year);
        return {
          period: d,
          projectedBalance: p.projectedWealth,
        };
      });

      // Cleanup previous scenario chart
      if (activeCharts.has('scenario-chart')) {
        const existing = activeCharts.get('scenario-chart');
        if (existing && typeof existing.destroy === 'function')
          existing.destroy();
        activeCharts.delete('scenario-chart');
      }

      createProjectedBalanceChart(chartRenderer, series)
        .then(({ section: chartSection, chart }) => {
          // Replace output
          outputContainer.innerHTML = '';
          outputContainer.appendChild(chartSection);
          if (chart) activeCharts.set('scenario-chart', chart);
        })
        .catch(err => console.error('Scenario chart error', err));
    });

    content.appendChild(section);
  }

  // createStatsCard is now imported from StatsCard.js component

  // createPlaceholder is now imported from financial-planning-helpers.js

  /**
   * Load planning data from various services
   */
  async function loadPlanningData() {
    if (isLoading) return;

    try {
      isLoading = true;

      // Get transaction and account data
      const transactions = TransactionService.getAll();
      const accounts = AccountService.getAccounts();

      // Load investment data and goals (prefer local cache first)
      const investmentsKey = STORAGE_KEYS.INVESTMENTS;
      const goalsKey = STORAGE_KEYS.GOALS;

      const investmentsCacheRaw = localStorage.getItem(investmentsKey);
      if (investmentsCacheRaw)
        console.log(`[Sync] ${investmentsKey} loaded from cache`);
      const goalsCacheRaw = localStorage.getItem(goalsKey);
      if (goalsCacheRaw) console.log(`[Sync] ${goalsKey} loaded from cache`);

      const investments = StorageService.getInvestments
        ? StorageService.getInvestments()
        : [];
      const goals = StorageService.getGoals ? StorageService.getGoals() : [];

      planningData = {
        transactions,
        accounts,
        investments,
        goals,
        lastUpdated: new Date(),
      };

      // Re-render current section with new data
      renderSection(currentSection);
    } catch (error) {
      console.error('Error loading planning data:', error);
    } finally {
      isLoading = false;
    }
  }
  const updateResponsiveLayout = debounce(() => {
    const isMobile = window.innerWidth < BREAKPOINTS.MOBILE;

    // Update container padding
    container.style.padding = isMobile ? `0 ${SPACING.SM}` : `0 ${SPACING.MD}`;

    // Update header layout for mobile
    const header = container.querySelector('.financial-planning-header');
    if (header) {
      const leftSide = header.querySelector('div:first-child');
      const title = header.querySelector('h1');
      const backButton = header.querySelector('.financial-planning-back-btn');

      if (isMobile) {
        // Mobile: smaller title, more compact back button
        if (title) title.style.fontSize = '1.5rem';
        if (backButton) {
          backButton.style.padding = `${SPACING.XS} ${SPACING.SM}`;
          backButton.style.fontSize = '0.875rem';
        }
        if (leftSide) leftSide.style.gap = SPACING.SM;
      } else {
        // Desktop: larger title, normal back button
        if (title) title.style.fontSize = '2rem';
        if (backButton) {
          backButton.style.padding = `${SPACING.SM} ${SPACING.MD}`;
          backButton.style.fontSize = '1rem';
        }
        if (leftSide) leftSide.style.gap = SPACING.MD;
      }
    }

    // Update stats grid for mobile
    const statsGrid = content.querySelector('.stats-grid');
    if (statsGrid) {
      statsGrid.style.gridTemplateColumns = isMobile
        ? 'repeat(2, 1fr)'
        : 'repeat(auto-fit, minmax(250px, 1fr))';
    }

    // Update quick actions for mobile
    const actionsContainer = content.querySelector('.quick-actions');
    if (actionsContainer) {
      actionsContainer.style.flexDirection = isMobile ? 'column' : 'row';
    }
  }, TIMING.DEBOUNCE_RESIZE);

  // Event listeners
  window.addEventListener('resize', updateResponsiveLayout);

  // Storage update handler
  const handleStorageUpdate = e => {
    if (
      e.detail.key === STORAGE_KEYS.TRANSACTIONS ||
      e.detail.key === STORAGE_KEYS.ACCOUNTS ||
      e.detail.key === STORAGE_KEYS.INVESTMENTS ||
      e.detail.key === STORAGE_KEYS.GOALS
    ) {
      loadPlanningData();
    }
  };

  // Listen for forecast invalidation requests from CacheInvalidator
  const handleForecastInvalidate = _e => {
    try {
      if (forecastEngine && typeof forecastEngine.clearCache === 'function') {
        forecastEngine.clearCache();
        // Also re-render current section if forecasts are visible
        if (currentSection === 'forecasts' || currentSection === 'overview') {
          renderSection(currentSection);
        }
      }
    } catch (error) {
      console.warn('Error clearing forecast cache:', error);
    }
  };

  // Sync state handler for UI
  const handleSyncState = e => {
    const detail = e.detail || {};
    const right = container.querySelector('.sync-status');
    if (!right) return;
    if (detail.state === 'syncing') {
      right.textContent = `Syncing ${detail.dataType}...`;
      right.style.background = COLORS.SURFACE_HOVER;
      right.style.color = COLORS.TEXT_MAIN;
    } else if (detail.state === 'synced') {
      right.textContent = `Synced ${detail.dataType} ${new Date(detail.timestamp).toLocaleTimeString()}`;
      right.style.background = COLORS.SURFACE;
      right.style.color = COLORS.TEXT_MUTED;
    } else if (detail.state === 'error') {
      right.textContent = `Sync error (${detail.dataType})`;
      right.style.background = COLORS.ERROR;
      right.style.color = 'white';
    }
  };

  // Keyboard shortcuts
  const handleKeyboardShortcuts = e => {
    if (e.key === 'Escape') {
      e.preventDefault();
      Router.navigate('dashboard');
    }
  };

  window.addEventListener('storage-updated', handleStorageUpdate);
  window.addEventListener('sync-state', handleSyncState);
  window.addEventListener('forecast-invalidate', handleForecastInvalidate);
  window.addEventListener('keydown', handleKeyboardShortcuts);

  // Cleanup function
  container.cleanup = () => {
    window.removeEventListener('resize', updateResponsiveLayout);
    window.removeEventListener('storage-updated', handleStorageUpdate);
    window.removeEventListener('sync-state', handleSyncState);
    window.removeEventListener('forecast-invalidate', handleForecastInvalidate);
    window.removeEventListener('keydown', handleKeyboardShortcuts);
  };

  // Initialize
  updateResponsiveLayout();
  loadPlanningData();
  renderSection(currentSection);

  return container;
};
