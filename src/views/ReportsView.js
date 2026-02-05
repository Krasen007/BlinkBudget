/**
 * Reports View - Beautiful Reports & Insights
 *
 * Main view component for displaying financial analytics and insights.
 * Provides interactive charts, time period selection, and actionable insights.
 *
 * Requirements: 7.5, 1.6, 5.5
 */

import { getAnalyticsEngine } from '../core/analytics/AnalyticsInstance.js';
import { ChartRenderer } from '../components/ChartRenderer.js';
import { ProgressiveDataLoader } from '../core/progressive-data-loader.js';
import { preloadChartJS } from '../core/chart-loader.js';
import { TimePeriodSelector } from '../components/TimePeriodSelector.js';
import { TransactionService } from '../core/transaction-service.js';
import { AccountService } from '../core/account-service.js';
import { Router } from '../core/router.js';
import { NavigationState } from '../core/navigation-state.js';
import { SettingsService } from '../core/settings-service.js';
import {
  COLORS,
  SPACING,
  BREAKPOINTS,
  TIMING,
  STORAGE_KEYS,
} from '../utils/constants.js';
import { debounce } from '../utils/touch-utils.js';
import { createNavigationButtons } from '../utils/navigation-helper.js';
import { AdvancedFilterPanel } from '../components/AdvancedFilterPanel.js';
import { FilteringService } from '../core/analytics/FilteringService.js';

// Import utility modules
import {
  getCurrentMonthPeriod,
  checkBrowserSupport,
  validateAnalyticsData,
  sanitizeAnalyticsData,
  createMinimalAnalyticsData,
  formatTimePeriod,
} from '../utils/reports-utils.js';

import {
  createLoadingState,
  updateLoadingProgress,
  createEmptyState,
  showEmptyState,
  createErrorState,
  showErrorState,
  showUnsupportedBrowserError,
  showBrowserWarning,
  showPerformanceWarning,
  showChartRenderingWarning,
} from '../utils/reports-ui.js';

import {
  createCategoryBreakdownChart,
  createIncomeExpenseChart,
  createCategoryTrendsChart,
  getCategoryColors,
} from '../utils/reports-charts.js';
import { CategorySelector } from '../components/CategorySelector.js';
import { InsightsSection } from '../components/InsightsSection.js';
import { PatternInsights } from '../components/PatternInsights.js';
import { BudgetSummaryCard } from '../components/BudgetSummaryCard.js';
import { BudgetPlanner } from '../core/budget-planner.js';
import { escapeHtml } from '../utils/security-utils.js';

export const ReportsView = () => {
  const container = document.createElement('div');
  container.className = 'view-reports view-container';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  // ... remaining state logic ...
  const handleGlobalError = (error, context = 'Unknown') => {
    console.error(`[ReportsView] Global error in ${context}:`, error);
    showErrorState(
      errorState,
      `Something went wrong while ${context.toLowerCase()}. Please try refreshing the page.`,
      () => loadReportData()
    );

    if (typeof window.gtag === 'function') {
      window.gtag('event', 'exception', {
        description: `ReportsView: ${context} - ${error.message}`,
        fatal: false,
      });
    }
  };

  // Set up global error handlers
  const originalOnError = window.onerror;
  const originalOnUnhandledRejection = window.onunhandledrejection;

  window.onerror = (message, source, lineno, colno, error) => {
    if (source && source.includes('ReportsView')) {
      handleGlobalError(error || new Error(message), 'JavaScript execution');
      return true;
    }
    return originalOnError
      ? originalOnError(message, source, lineno, colno, error)
      : false;
  };

  window.onunhandledrejection = event => {
    if (
      event.reason &&
      event.reason.stack &&
      event.reason.stack.includes('ReportsView')
    ) {
      handleGlobalError(event.reason, 'Promise rejection');
      event.preventDefault();
    } else if (originalOnUnhandledRejection) {
      originalOnUnhandledRejection(event);
    }
  };

  // ... (imports)

  // Initialize services
  const analyticsEngine = getAnalyticsEngine();
  const chartRenderer = new ChartRenderer();
  const progressiveLoader = new ProgressiveDataLoader();

  // Browser compatibility checks
  const browserSupport = checkBrowserSupport();
  if (!browserSupport.isSupported) {
    showUnsupportedBrowserError(container, browserSupport.missingFeatures);
    return container;
  }

  if (browserSupport.hasLimitedSupport) {
    showBrowserWarning(container, browserSupport.limitedFeatures);
  }

  // Preload Chart.js
  preloadChartJS().catch(error => {
    console.warn('[ReportsView] Chart.js preloading failed:', error);
  });

  // State management
  let currentTimePeriod =
    NavigationState.restoreTimePeriod() || getCurrentMonthPeriod();
  let currentAdvancedFilters = null;
  let isLoading = false;
  let currentData = null;
  const activeCharts = new Map();
  let timePeriodSelectorComponent = null;
  let advancedFilterPanelComponent = null;
  const categoryColorMap = new Map();

  // Main content area - match FinancialPlanningView structure
  const content = document.createElement('main');
  content.className = 'reports-content';
  content.id = 'reports-main-content';
  content.setAttribute('role', 'main');
  content.setAttribute('aria-labelledby', 'reports-title');
  content.style.flex = '1';
  content.style.display = 'flex';
  content.style.flexDirection = 'column';
  content.style.minHeight = '0';

  // State components
  const loadingState = createLoadingState();
  const emptyState = createEmptyState();
  const errorState = createErrorState();

  /**
   * Create header with title and back button - match FinancialPlanningView
   */
  function createHeader() {
    // Main header with back button and title
    const header = document.createElement('header');
    header.className = 'reports-header';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = SPACING.MD;
    header.style.flexShrink = '0';
    header.style.padding = `${SPACING.XS} 0`;

    // Left side with back button and title
    const leftSide = document.createElement('div');
    leftSide.style.display = 'flex';
    leftSide.style.alignItems = 'center';
    leftSide.style.gap = SPACING.MD;

    // Back button (always visible)
    const backButton = document.createElement('button');
    backButton.innerHTML = '← Back';
    backButton.className = 'btn btn-ghost reports-back-btn';
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
    title.id = 'reports-title';
    title.textContent = 'Reports';
    title.style.margin = '0';
    title.style.fontSize =
      window.innerWidth < BREAKPOINTS.MOBILE ? '1.25rem' : 'h2';
    title.style.fontWeight = 'bold';
    title.style.color = COLORS.TEXT_MAIN;

    leftSide.appendChild(backButton);
    leftSide.appendChild(title);

    // Right side: navigation buttons
    const rightSide = createNavigationButtons('reports');

    header.appendChild(leftSide);
    header.appendChild(rightSide);

    // Time period selector below header
    timePeriodSelectorComponent = TimePeriodSelector({
      initialPeriod: currentTimePeriod,
      onChange: handleTimePeriodChange,
      showCustomRange: true,
      className: 'reports-time-selector',
    });

    // Advanced Filter Panel (Conditional)
    const advancedFilteringEnabled =
      SettingsService.getSetting('advancedFilteringEnabled') !== false;
    if (advancedFilteringEnabled) {
      advancedFilterPanelComponent = AdvancedFilterPanel({
        onFiltersChange: filters => {
          currentAdvancedFilters = filters;
          loadReportData(true); // Fast reload
        },
      });
    }

    // Create header container that includes both header and time period selector
    const headerContainer = document.createElement('div');
    headerContainer.className = 'reports-header-container';
    headerContainer.style.background = COLORS.BACKGROUND;
    headerContainer.style.zIndex = '10';
    headerContainer.style.position = 'sticky'; // Sticky positioning
    headerContainer.style.top = '0'; // Stick to top
    headerContainer.style.width = '100%';
    headerContainer.style.display = 'flex';
    headerContainer.style.flexDirection = 'column';
    headerContainer.style.gap = SPACING.SM;
    headerContainer.style.flexShrink = '0';
    headerContainer.style.padding = `${SPACING.SM} 0`; // Vertical padding, horizontal handled by container

    headerContainer.appendChild(header);
    headerContainer.appendChild(timePeriodSelectorComponent);

    if (advancedFilterPanelComponent) {
      headerContainer.appendChild(advancedFilterPanelComponent);
    }

    return headerContainer;
  }

  /**
   * Handle category chart click - scroll to category details
   */
  function handleCategoryChartClick(label) {
    if (!label) return;

    const categoryCard = container.querySelector(`[data-category="${label}"]`);
    if (categoryCard) {
      categoryCard.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });

      // Brief highlight effect
      const originalBorder = categoryCard.style.borderColor;
      const originalShadow = categoryCard.style.boxShadow;

      categoryCard.style.borderColor = COLORS.PRIMARY;
      categoryCard.style.boxShadow = `0 0 15px ${COLORS.PRIMARY}44`;

      setTimeout(() => {
        categoryCard.style.borderColor = originalBorder;
        categoryCard.style.boxShadow = originalShadow;
      }, 1000);
    }
  }

  /**
   * Handle category card click - scroll back up to chart
   */
  function handleCategoryCardClick() {
    const chartSection = container.querySelector(
      '[data-chart-type="category-breakdown"]'
    );
    if (chartSection) {
      chartSection.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }

  /**
   * Handle time period changes
   */
  function handleTimePeriodChange(newTimePeriod, options = {}) {
    if (!newTimePeriod || !newTimePeriod.startDate || !newTimePeriod.endDate) {
      console.error('Invalid time period provided:', newTimePeriod);
      return;
    }

    currentTimePeriod = newTimePeriod;

    NavigationState.saveTimePeriod(newTimePeriod);

    analyticsEngine.invalidateCache('categoryBreakdown');
    analyticsEngine.invalidateCache('incomeVsExpenses');
    analyticsEngine.invalidateCache('costOfLiving');

    // If this is a navigation action, only reload data without recreating the header
    if (options.isNavigation) {
      loadReportData(true); // Skip header recreation
    } else {
      // Full recreation for other time period changes
      loadReportData(false);
    }
  }

  /**
   * Create chart container
   */
  function createChartContainer() {
    const chartContainer = document.createElement('section');
    chartContainer.setAttribute('role', 'region');
    chartContainer.setAttribute('aria-labelledby', 'chart-section-title');
    chartContainer.style.width = '100%';

    const sectionTitle = document.createElement('h2');
    sectionTitle.id = 'chart-section-title';
    sectionTitle.className = 'sr-only';
    sectionTitle.textContent = 'Financial Reports and Visualizations';
    chartContainer.appendChild(sectionTitle);

    return chartContainer;
  }

  /**
   * Load and display report data
   */
  async function loadReportData(skipHeaderRecreation = false) {
    if (isLoading) return;

    try {
      isLoading = true;

      // Add header (which now includes time period selector) to container (outside scrollable content)
      if (!skipHeaderRecreation) {
        container.innerHTML = '';
        const header = createHeader();
        container.appendChild(header);
        container.appendChild(content);
      }

      // Generate a stable cache key
      const startStr =
        currentTimePeriod.startDate instanceof Date
          ? currentTimePeriod.startDate.toISOString()
          : currentTimePeriod.startDate;
      const endStr =
        currentTimePeriod.endDate instanceof Date
          ? currentTimePeriod.endDate.toISOString()
          : currentTimePeriod.endDate;
      const cacheKey = `report_data_${startStr}_${endStr}`;

      // NEW: Check for cached data first to enable instant load
      const cachedData = analyticsEngine.cache.get(cacheKey);

      if (cachedData) {
        console.log('[ReportsView] Using full cached report data', {
          key: cacheKey,
        });
        currentData = cachedData;
        renderReports();
        isLoading = false;
        return;
      }

      console.log('[ReportsView] Cache miss', {
        key: cacheKey,
        stats: analyticsEngine.getCacheStats(),
      });

      showLoadingState();

      const startTime = Date.now();

      let transactions;
      try {
        const allTransactions = TransactionService.getAll();

        if (!Array.isArray(allTransactions)) {
          throw new Error('Invalid transaction data format - expected array');
        }

        // Apply advanced filters if they exist
        transactions = allTransactions;
        if (currentAdvancedFilters) {
          transactions = FilteringService.applyFilters(
            transactions,
            currentAdvancedFilters
          );
        }
      } catch (storageError) {
        console.error('Storage access error:', storageError);

        try {
          console.warn('[ReportsView] Attempting storage recovery...');
          localStorage.removeItem('blinkbudget_transactions');
          transactions = [];
        } catch (recoveryError) {
          console.error('Storage recovery failed:', recoveryError);
          throw new Error(
            'Unable to access transaction data. Please check your browser storage settings and try refreshing the page.'
          );
        }
      }

      let analyticsData;
      try {
        analyticsData = await progressiveLoader.loadTransactionData(
          transactions,
          currentTimePeriod,
          {
            onProgress: (progress, message) => {
              updateLoadingProgress(loadingState, progress, message);
            },
            onChunkProcessed: () => {
              // Chunk processed callback - currently unused
            },
            prioritizeCategories: true,
            enableCaching: !currentAdvancedFilters, // Disable caching if advanced filters are active
          }
        );
      } catch (analyticsError) {
        console.error('Progressive data loading error:', analyticsError);

        console.warn('[ReportsView] Attempting fallback strategies...');

        try {
          analyticsData = progressiveLoader.processDataDirectly(
            transactions,
            currentTimePeriod
          );
        } catch (directProcessingError) {
          console.error(
            'Direct processing fallback failed:',
            directProcessingError
          );

          try {
            analyticsData = createMinimalAnalyticsData(
              transactions,
              currentTimePeriod
            );
          } catch (minimalProcessingError) {
            console.error(
              'Minimal processing fallback failed:',
              minimalProcessingError
            );
            throw new Error(
              'Unable to process your financial data. This might be due to corrupted data or a browser compatibility issue.'
            );
          }
        }
      }

      try {
        validateAnalyticsData(analyticsData);
      } catch (validationError) {
        console.error('Analytics data validation failed:', validationError);

        analyticsData = sanitizeAnalyticsData(analyticsData);

        try {
          validateAnalyticsData(analyticsData);
        } catch (secondValidationError) {
          console.error(
            'Analytics data validation failed after sanitization:',
            secondValidationError
          );
          throw new Error(
            'The processed financial data appears to be invalid. Please try refreshing the page or contact support if the issue persists.'
          );
        }
      }

      if (
        !analyticsData.transactions ||
        analyticsData.transactions.length === 0
      ) {
        // Ensure loading state is removed
        if (container.contains(loadingState)) {
          container.removeChild(loadingState);
        }

        if (transactions.length === 0) {
          showEmptyState(
            emptyState,
            'no-transactions',
            currentTimePeriod,
            formatTimePeriod
          );
          if (!container.contains(emptyState))
            container.appendChild(emptyState);
          emptyState.style.display = 'flex';
        } else {
          showEmptyState(
            emptyState,
            'no-data-for-period',
            currentTimePeriod,
            formatTimePeriod
          );
          if (!container.contains(emptyState))
            container.appendChild(emptyState);
          emptyState.style.display = 'flex';
        }
        isLoading = false;
        return;
      }

      currentData = analyticsData;

      try {
        if (currentData.transactions && currentData.transactions.length > 0) {
          const insights = analyticsEngine.generateSpendingInsights(
            transactions,
            currentTimePeriod
          );
          currentData.insights = insights;

          const predictions = analyticsEngine.predictFutureSpending(
            transactions,
            3
          );
          if (predictions.hasEnoughData) {
            currentData.predictions = predictions;
          }
        }
      } catch (insightsError) {
        console.warn(
          '[ReportsView] Failed to generate insights:',
          insightsError
        );
      }

      // NEW: Cache the full report data
      analyticsEngine.cache.set(cacheKey, currentData);
      console.log('[ReportsView] Cached report data', { key: cacheKey });

      const processingTime = Date.now() - startTime;
      if (processingTime > 2000) {
        console.warn(
          `Report loading took ${processingTime}ms, exceeding 2-second target`
        );
        showPerformanceWarning(container, processingTime);
      }

      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(
        0,
        Math.min(500 - elapsedTime, 2000 - elapsedTime)
      );

      setTimeout(() => {
        renderReports();
        isLoading = false;
      }, remainingTime);
    } catch (error) {
      console.error('Error loading report data:', error);

      let userMessage =
        'An unexpected error occurred while loading your reports.';

      if (error.message.includes('storage')) {
        userMessage =
          'There was a problem accessing your stored data. Please check your browser settings and try again.';
      } else if (error.message.includes('browser')) {
        userMessage =
          'Your browser may not support all features required for reports. Please try updating your browser.';
      } else if (error.message.includes('network')) {
        userMessage =
          'Network connection issues detected. Please check your internet connection and try again.';
      } else if (error.message.includes('memory')) {
        userMessage =
          'Your device may be running low on memory. Please close other tabs and try again.';
      }

      showErrorState(errorState, userMessage, () => loadReportData());
      if (!container.contains(errorState)) container.appendChild(errorState);
      errorState.style.display = 'flex';
      isLoading = false;

      if (typeof window.gtag === 'function') {
        window.gtag('event', 'exception', {
          description: `ReportsView loadReportData: ${error.message}`,
          fatal: false,
        });
      }
    }
  }

  /**
   * Render the complete reports interface
   */
  async function renderReports() {
    try {
      // Clear content
      content.innerHTML = '';

      cleanupCharts();

      if (!currentData) {
        showErrorState(
          errorState,
          'No data available to display reports.',
          () => loadReportData()
        );
        if (!content.contains(errorState)) content.appendChild(errorState);
        errorState.style.display = 'flex';
        return;
      }

      if (!currentData.transactions || currentData.transactions.length === 0) {
        showEmptyState(
          emptyState,
          'no-data-for-period',
          currentTimePeriod,
          formatTimePeriod
        );
        if (!content.contains(emptyState)) content.appendChild(emptyState);
        emptyState.style.display = 'flex';
        return;
      }

      if (
        currentData.categoryBreakdown &&
        currentData.categoryBreakdown.categories
      ) {
        getCategoryColors(
          currentData.categoryBreakdown.categories,
          categoryColorMap
        );
      }

      const chartContainer = createChartContainer();
      content.appendChild(chartContainer);

      if (currentData.isFallback) {
        const fallbackWarning = document.createElement('div');
        fallbackWarning.style.padding = SPACING.SM;
        fallbackWarning.style.background = 'rgba(251, 191, 36, 0.1)';
        fallbackWarning.style.border = '1px solid rgba(251, 191, 36, 0.3)';
        fallbackWarning.style.borderRadius = 'var(--radius-md)';
        fallbackWarning.style.color = '#92400e';
        fallbackWarning.style.fontSize = '0.875rem';
        fallbackWarning.style.marginBottom = SPACING.MD;
        fallbackWarning.innerHTML = `
                    ⚠️ Using simplified calculations due to data processing issues. 
                    Some advanced insights may not be available.
                `;
        chartContainer.appendChild(fallbackWarning);
      }

      await renderCharts(chartContainer);

      showContentState();
    } catch (error) {
      console.error('Error rendering reports:', error);
      showErrorState(
        errorState,
        'Unable to display reports. Please try refreshing the page.',
        () => loadReportData()
      );
      if (!content.contains(errorState)) content.appendChild(errorState);
      errorState.style.display = 'flex';
    }
  }

  /**
   * Render beautiful charts
   */
  async function renderCharts(chartContainer) {
    try {
      const chartsSection = document.createElement('div');
      chartsSection.className = 'charts-section';
      chartsSection.style.display = 'flex';
      chartsSection.style.flexDirection = 'column';
      chartsSection.style.gap = SPACING.XL;
      chartsSection.style.position = 'relative';

      // Budget Summary
      try {
        const budgetsSummary = BudgetPlanner.getSummary(
          currentData.transactions,
          currentTimePeriod
        );
        if (budgetsSummary.totalBudgets > 0) {
          const summaryCard = BudgetSummaryCard(
            budgetsSummary,
            currentTimePeriod
          );
          summaryCard.style.marginBottom = SPACING.LG;
          chartsSection.appendChild(summaryCard);
        }
      } catch (budgetError) {
        console.warn(
          '[ReportsView] Failed to render budget summary:',
          budgetError
        );
      }

      const chartRenderResults = [];

      // Category Breakdown Chart
      try {
        const categoryResult = await createCategoryBreakdownChart(
          chartRenderer,
          currentData,
          categoryColorMap,
          categories => getCategoryColors(categories, categoryColorMap),
          handleCategoryChartClick
        );
        categoryResult.section.style.borderBottom = `2px solid ${COLORS.BORDER}`;
        categoryResult.section.style.paddingBottom = `calc(${SPACING.LG} * 1.5)`;
        categoryResult.section.style.marginBottom = `calc(${SPACING.XL} * 1.5)`;
        chartsSection.appendChild(categoryResult.section);
        if (categoryResult.chart)
          activeCharts.set('category-breakdown', categoryResult.chart);
        chartRenderResults.push({ name: 'Category Breakdown', success: true });
      } catch (categoryError) {
        console.error(
          'Failed to render category breakdown chart:',
          categoryError
        );
        chartRenderResults.push({
          name: 'Category Breakdown',
          success: false,
          error: categoryError,
        });
      }

      // Category Selector
      try {
        // Generate frequency analysis data
        const frequencyData = analyticsEngine.analyzeFrequencyPatterns(
          currentData.transactions,
          currentTimePeriod
        );

        const categorySelectorSection = CategorySelector(
          currentData,
          categoryColorMap,
          categories => getCategoryColors(categories, categoryColorMap),
          handleCategoryCardClick,
          frequencyData.categories
        );
        categorySelectorSection.style.marginTop = `calc(${SPACING.XL} * 2)`;
        categorySelectorSection.style.clear = 'both';
        categorySelectorSection.style.position = 'relative';
        categorySelectorSection.style.zIndex = '2';
        chartsSection.appendChild(categorySelectorSection);
        chartRenderResults.push({ name: 'Category Selector', success: true });
      } catch (selectorError) {
        console.error('Failed to render category selector:', selectorError);
        chartRenderResults.push({
          name: 'Category Selector',
          success: false,
          error: selectorError,
        });
      }

      // Income vs Expenses Chart
      try {
        const incomeExpenseContainer = document.createElement('div');
        incomeExpenseContainer.className = 'income-expense-container';
        incomeExpenseContainer.style.setProperty(
          'margin-top',
          SPACING.XL,
          'important'
        );
        incomeExpenseContainer.style.setProperty(
          'margin-bottom',
          SPACING.SM,
          'important'
        );
        incomeExpenseContainer.style.position = 'relative';
        incomeExpenseContainer.style.zIndex = '1';
        incomeExpenseContainer.style.clear = 'both';

        const incomeResult = await createIncomeExpenseChart(
          chartRenderer,
          currentData
        );
        incomeExpenseContainer.appendChild(incomeResult.section);
        chartsSection.appendChild(incomeExpenseContainer);
        if (incomeResult.chart)
          activeCharts.set('income-expense', incomeResult.chart);
        chartRenderResults.push({ name: 'Income vs Expenses', success: true });
      } catch (incomeExpenseError) {
        console.error(
          'Failed to render income vs expense chart:',
          incomeExpenseError
        );
        chartRenderResults.push({
          name: 'Income vs Expenses',
          success: false,
          error: incomeExpenseError,
        });
      }

      // Category Trends Chart
      try {
        const trendsResult = await createCategoryTrendsChart(
          chartRenderer,
          currentData,
          categoryColorMap
        );
        if (trendsResult) {
          chartsSection.appendChild(trendsResult.section);
          if (trendsResult.chart)
            activeCharts.set('category-trends', trendsResult.chart);
          chartRenderResults.push({ name: 'Category Trends', success: true });
        }
      } catch (trendsError) {
        console.error('Failed to render category trends chart:', trendsError);
        chartRenderResults.push({
          name: 'Category Trends',
          success: false,
          error: trendsError,
        });
      }

      // Spending Pattern Analysis Section
      try {
        const patternInsightsSection = PatternInsights(
          currentData.transactions,
          currentTimePeriod,
          null // previousPeriod - could be implemented later
        );
        patternInsightsSection.style.marginTop = `${SPACING.XL} !important`;
        patternInsightsSection.style.borderBottom = `2px solid ${COLORS.BORDER}`;
        patternInsightsSection.style.paddingBottom = `${SPACING.LG}`;
        chartsSection.appendChild(patternInsightsSection);
        chartRenderResults.push({
          name: 'Spending Pattern Analysis',
          success: true,
        });
      } catch (patternError) {
        console.error(
          'Failed to render pattern insights section:',
          patternError
        );
        chartRenderResults.push({
          name: 'Spending Pattern Analysis',
          success: false,
          error: patternError,
        });
      }

      // Financial Insights Section
      if (currentData.insights && currentData.insights.length > 0) {
        try {
          const insightsSection = InsightsSection(currentData);
          insightsSection.style.marginTop = `${SPACING.LG} !important`;
          chartsSection.appendChild(insightsSection);
          chartRenderResults.push({
            name: 'Financial Insights',
            success: true,
          });
        } catch (insightsError) {
          console.error('Failed to render insights section:', insightsError);
          chartRenderResults.push({
            name: 'Financial Insights',
            success: false,
            error: insightsError,
          });
        }
      }

      chartContainer.appendChild(chartsSection);

      const failedCharts = chartRenderResults.filter(result => !result.success);
      if (failedCharts.length > 0) {
        showChartRenderingWarning(container, failedCharts);
      }
    } catch (error) {
      console.error('Error rendering charts:', error);

      const fallback = document.createElement('div');
      fallback.style.padding = SPACING.LG;
      fallback.style.textAlign = 'center';
      fallback.style.background = COLORS.SURFACE;
      fallback.style.borderRadius = 'var(--radius-lg)';
      fallback.style.border = `1px solid ${COLORS.BORDER}`;

      // Sanitize financial data before display
      const totalExpenses = escapeHtml(
        currentData.incomeVsExpenses.totalExpenses.toFixed(2)
      );
      const totalIncome = escapeHtml(
        currentData.incomeVsExpenses.totalIncome.toFixed(2)
      );
      const netBalance = escapeHtml(
        currentData.incomeVsExpenses.netBalance.toFixed(2)
      );
      const transactionCount = escapeHtml(
        currentData.transactions.length.toString()
      );

      fallback.innerHTML = `
                <div style="margin-bottom: ${SPACING.LG};">
                    <h3 style="color: ${COLORS.ERROR}; margin-bottom: ${SPACING.MD};">⚠️ Chart Rendering Failed</h3>
                    <p style="color: ${COLORS.TEXT_MUTED}; margin-bottom: ${SPACING.LG};">
                        Unable to render interactive charts. Showing basic financial summary instead.
                    </p>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: ${SPACING.MD};">
                    <div style="padding: ${SPACING.MD}; background: ${COLORS.BACKGROUND}; border-radius: var(--radius-md);">
                        <div style="font-size: 0.875rem; color: ${COLORS.TEXT_MUTED}; margin-bottom: ${SPACING.XS};">Total Expenses</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: ${COLORS.ERROR};">€${totalExpenses}</div>
                    </div>
                    <div style="padding: ${SPACING.MD}; background: ${COLORS.BACKGROUND}; border-radius: var(--radius-md);">
                        <div style="font-size: 0.875rem; color: ${COLORS.TEXT_MUTED}; margin-bottom: ${SPACING.XS};">Total Income</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: ${COLORS.SUCCESS};">€${totalIncome}</div>
                    </div>
                    <div style="padding: ${SPACING.MD}; background: ${COLORS.BACKGROUND}; border-radius: var(--radius-md);">
                        <div style="font-size: 0.875rem; color: ${COLORS.TEXT_MUTED}; margin-bottom: ${SPACING.XS};">Net Balance</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: ${currentData.incomeVsExpenses.netBalance >= 0 ? COLORS.SUCCESS : COLORS.ERROR};">€${netBalance}</div>
                    </div>
                    <div style="padding: ${SPACING.MD}; background: ${COLORS.BACKGROUND}; border-radius: var(--radius-md);">
                        <div style="font-size: 0.875rem; color: ${COLORS.TEXT_MUTED}; margin-bottom: ${SPACING.XS};">Transactions</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: ${COLORS.PRIMARY};">${transactionCount}</div>
                    </div>
                </div>
                <div style="margin-top: ${SPACING.LG};">
                    <button onclick="location.reload()" style="padding: ${SPACING.MD} ${SPACING.LG}; background: ${COLORS.PRIMARY}; color: white; border: none; border-radius: var(--radius-md); cursor: pointer;">
                        Refresh Page
                    </button>
                </div>
            `;
      chartContainer.appendChild(fallback);
    }
  }

  /**
   * Show loading state
   */
  function showLoadingState() {
    content.style.display = 'none';
    if (content.contains(emptyState)) content.removeChild(emptyState);
    if (content.contains(errorState)) content.removeChild(errorState);
    if (!container.contains(loadingState)) {
      container.appendChild(loadingState);
    }
    loadingState.style.display = 'flex';
  }

  /**
   * Show content state
   */
  function showContentState() {
    if (container.contains(loadingState)) {
      container.removeChild(loadingState);
    }
    if (container.contains(emptyState)) {
      container.removeChild(emptyState);
    }
    if (container.contains(errorState)) {
      container.removeChild(errorState);
    }
    content.style.display = 'flex';
  }

  /**
   * Clean up chart instances
   */
  function cleanupCharts() {
    activeCharts.forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
    });
    activeCharts.clear();

    if (progressiveLoader.isCurrentlyLoading()) {
      progressiveLoader.cancelLoading();
    }
  }

  /**
   * Handle responsive layout updates
   */
  const updateResponsiveLayout = debounce(() => {
    const isMobile = window.innerWidth < BREAKPOINTS.MOBILE;
    const isTablet =
      window.innerWidth >= BREAKPOINTS.MOBILE && window.innerWidth < 1024;
    const isLandscape = window.innerHeight < window.innerWidth;
    const isShortLandscape = isLandscape && window.innerHeight < 500;

    const title = content.querySelector('h2');
    if (title) {
      if (isMobile) {
        title.style.fontSize = '1.5rem';
      } else if (isTablet) {
        title.style.fontSize = '1.75rem';
      } else {
        title.style.fontSize = '2rem';
      }
    }

    // Layout updates for mobile

    const headerContainer = container.querySelector(
      '.reports-header-container'
    );
    if (headerContainer) {
      // Padding removed - header container has no padding
    }

    content.style.maxWidth = '100%';
    content.style.boxSizing = 'border-box';
    content.style.gap = isMobile ? SPACING.MD : SPACING.LG;

    // Sync charts-section horizontal padding with header
    const chartsSections = content.querySelectorAll('.charts-section');
    chartsSections.forEach(cs => {
      if (isMobile) {
        cs.style.padding = isShortLandscape
          ? `${SPACING.XS} ${SPACING.SM}`
          : `${SPACING.SM} ${SPACING.SM}`;
      } else if (isTablet) {
        cs.style.padding = `${SPACING.MD} ${SPACING.LG}`;
      } else {
        cs.style.padding = `${SPACING.MD} ${SPACING.XL}`;
      }
    });

    activeCharts.forEach(chart => {
      if (chart && typeof chart.resize === 'function') {
        chart.resize();
      }
    });

    if (isMobile) {
      updateVisualViewportHeight();
    }
  }, TIMING.DEBOUNCE_RESIZE);

  /**
   * Update visual viewport height for mobile keyboard handling
   */
  function updateVisualViewportHeight() {
    if (window.visualViewport) {
      document.documentElement.style.setProperty(
        '--visual-viewport-height',
        `${window.visualViewport.height}px`
      );
    } else {
      document.documentElement.style.setProperty(
        '--visual-viewport-height',
        `${window.innerHeight}px`
      );
    }
  }

  /**
   * Handle orientation changes
   */
  const handleOrientationChange = debounce(() => {
    setTimeout(() => {
      updateResponsiveLayout();

      activeCharts.forEach(chart => {
        if (chart && typeof chart.resize === 'function') {
          chart.resize();
        }
      });
    }, 100);
  }, TIMING.DEBOUNCE_ORIENTATION);

  // Event listeners
  window.addEventListener('resize', updateResponsiveLayout);
  window.addEventListener('orientationchange', handleOrientationChange);

  if (window.visualViewport) {
    window.visualViewport.addEventListener(
      'resize',
      updateVisualViewportHeight
    );
  }

  updateResponsiveLayout();
  updateVisualViewportHeight();

  // Storage update handler
  const handleStorageUpdate = e => {
    if (
      e.detail.key === STORAGE_KEYS.TRANSACTIONS ||
      e.detail.key === STORAGE_KEYS.ACCOUNTS
    ) {
      analyticsEngine.invalidateCacheOnDataUpdate();

      clearTimeout(container._refreshTimeout);
      container._refreshTimeout = setTimeout(() => {
        loadReportData();
      }, 300);
    }
  };

  // Auth change handler
  const handleAuthChange = () => {
    analyticsEngine.clearCache();
    loadReportData();
  };

  // Navigation state change handler
  const handleNavigationStateChange = e => {
    if (e.detail.key === NavigationState.STATE_KEYS.REPORTS_TIME_PERIOD) {
      const restoredTimePeriod = NavigationState.restoreTimePeriod();
      if (restoredTimePeriod && restoredTimePeriod !== currentTimePeriod) {
        currentTimePeriod = restoredTimePeriod;

        if (
          timePeriodSelectorComponent &&
          timePeriodSelectorComponent.updatePeriod
        ) {
          timePeriodSelectorComponent.updatePeriod(restoredTimePeriod);
        }

        loadReportData();
      }
    }
  };

  // Keyboard shortcuts
  const handleKeyboardShortcuts = e => {
    if (e.key === 'Escape' || (e.ctrlKey && e.key === 'b')) {
      e.preventDefault();
      Router.navigate('dashboard');
    }

    if (e.ctrlKey && e.key === 'r') {
      e.preventDefault();
      refreshData();
    }
  };

  window.addEventListener('storage-updated', handleStorageUpdate);
  window.addEventListener('auth-state-changed', handleAuthChange);
  window.addEventListener(
    'navigation-state-changed',
    handleNavigationStateChange
  );
  window.addEventListener('keydown', handleKeyboardShortcuts);

  /**
   * Manual refresh function
   */
  function refreshData() {
    analyticsEngine.clearCache();
    loadReportData();
  }

  /**
   * Check data integrity
   */
  function checkDataIntegrity() {
    try {
      const transactions = TransactionService.getAll();
      const accounts = AccountService.getAccounts();

      const accountIds = new Set(accounts.map(acc => acc.id));
      const orphanedTransactions = transactions.filter(
        t => t.accountId && !accountIds.has(t.accountId)
      );

      if (orphanedTransactions.length > 0) {
        console.warn(
          `Found ${orphanedTransactions.length} transactions with invalid account references`
        );
      }

      return {
        transactionCount: transactions.length,
        accountCount: accounts.length,
        orphanedCount: orphanedTransactions.length,
        isHealthy: orphanedTransactions.length === 0,
      };
    } catch (error) {
      console.error('Data integrity check failed:', error);
      return {
        transactionCount: 0,
        accountCount: 0,
        orphanedCount: 0,
        isHealthy: false,
        error: error.message,
      };
    }
  }

  // Cleanup function
  container.cleanup = () => {
    window.removeEventListener('resize', updateResponsiveLayout);
    window.removeEventListener('orientationchange', handleOrientationChange);
    window.removeEventListener('storage-updated', handleStorageUpdate);
    window.removeEventListener('auth-state-changed', handleAuthChange);
    window.removeEventListener(
      'navigation-state-changed',
      handleNavigationStateChange
    );
    window.removeEventListener('keydown', handleKeyboardShortcuts);

    if (window.visualViewport) {
      window.visualViewport.removeEventListener(
        'resize',
        updateVisualViewportHeight
      );
    }

    if (container._refreshTimeout) {
      clearTimeout(container._refreshTimeout);
    }

    if (timePeriodSelectorComponent && timePeriodSelectorComponent.cleanup) {
      timePeriodSelectorComponent.cleanup();
    }

    cleanupCharts();

    document.documentElement.style.removeProperty('--visual-viewport-height');

    window.onerror = originalOnError;
    window.onunhandledrejection = originalOnUnhandledRejection;
  };

  // Expose useful methods
  container.refreshData = refreshData;
  container.checkDataIntegrity = checkDataIntegrity;
  container.getCurrentData = () => currentData;
  container.getCurrentTimePeriod = () => currentTimePeriod;

  // Initial data load
  loadReportData();

  return container;
};
