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
import { preloadChartJS } from '../core/chart-loader.js';
import { TimePeriodSelector } from '../components/TimePeriodSelector.js';
import { TransactionService } from '../core/transaction-service.js';
import { AccountService } from '../core/Account/account-service.js';
import { Router } from '../core/router.js';
import { NavigationState } from '../core/navigation-state.js';
import {
  COLORS,
  SPACING,
  BREAKPOINTS,
  TIMING,
  STORAGE_KEYS,
} from '../utils/constants.js';
import { debounce } from '../utils/touch-utils.js';
import { createNavigationButtons } from '../utils/navigation-helper.js';

// Import utility modules
import {
  getCurrentMonthPeriod,
  checkBrowserSupport,
  validateAnalyticsData,
  sanitizeAnalyticsData,
  createMinimalAnalyticsData,
  formatTimePeriod,
} from '../utils/reports-utils.js';

// Simple cache helpers for instant report loading
const CACHE_KEY_PREFIX = 'blinkbudget_reports_cache_';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCacheKey(timePeriod) {
  const startStr =
    timePeriod.startDate instanceof Date
      ? timePeriod.startDate.toISOString()
      : timePeriod.startDate;
  const endStr =
    timePeriod.endDate instanceof Date
      ? timePeriod.endDate.toISOString()
      : timePeriod.endDate;
  return `${CACHE_KEY_PREFIX}${startStr}_${endStr}`;
}

function getCachedAnalytics(timePeriod) {
  try {
    const cacheKey = getCacheKey(timePeriod);
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still fresh
    if (now - timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    console.log('[ReportsView] Using cached analytics data');
    return data;
  } catch (error) {
    console.warn('[ReportsView] Failed to read cache:', error);
    return null;
  }
}

function setCachedAnalytics(timePeriod, data) {
  try {
    const cacheKey = getCacheKey(timePeriod);
    const cacheEntry = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
  } catch (error) {
    console.warn('[ReportsView] Failed to write cache:', error);
  }
}

import {
  createLoadingState,
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
  getCategoryColors,
} from '../utils/reports-charts.js';
import { CategorySelector } from '../components/CategorySelector.js';
import { InsightsSection } from '../components/BudgetInsightsSection.js';
import { BudgetSummaryCard } from '../components/BudgetSummaryCard.js';
import { BudgetPlanner } from '../core/budget-planner.js';

export const ReportsView = () => {
  const container = document.createElement('div');
  container.className = 'view-reports view-container';

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
  let isLoading = false;
  let currentData = null;
  const activeCharts = new Map();
  let timePeriodSelectorComponent = null;
  const categoryColorMap = new Map();

  // Helper function to highlight a category card
  function highlightCategoryCard(categoryCard, duration = 1500) {
    const originalBorder = categoryCard.style.borderColor;
    const originalShadow = categoryCard.style.boxShadow;

    categoryCard.style.borderColor = COLORS.PRIMARY;
    categoryCard.style.boxShadow = `0 0 15px ${COLORS.PRIMARY}44`;

    const timeoutId = setTimeout(() => {
      categoryCard.style.borderColor = originalBorder;
      categoryCard.style.boxShadow = originalShadow;
    }, duration);

    return timeoutId;
  }

  // Create header Container
  const headerContainer = createHeader();
  container.appendChild(headerContainer);

  // Main content area
  const content = document.createElement('div');
  content.className = 'view-content';
  content.id = 'reports-content';
  container.appendChild(content);

  // Persistent section containers for incremental rendering
  const sectionContainers = {
    budgetSummary: null,
    categoryBreakdown: null,
    categorySelector: null,
    financialInsights: null,
    incomeExpense: null,
  };

  // Skeleton loading states
  const skeletonStates = {
    budgetSummary: null,
    categoryBreakdown: null,
    categorySelector: null,
    financialInsights: null,
    incomeExpense: null,
  };

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
    header.className = 'view-header-row';

    // Left side with back button and title
    const leftSide = document.createElement('div');
    leftSide.style.display = 'flex';
    leftSide.style.alignItems = 'center';
    leftSide.style.gap = SPACING.XS;

    // Back button (always visible)
    const backButton = document.createElement('button');
    backButton.textContent = '← Back';
    backButton.className = 'view-back-btn';
    backButton.title = 'Back to Dashboard';

    backButton.addEventListener('click', () => Router.navigate('dashboard'));

    // Title
    const title = document.createElement('h2');
    title.id = 'reports-title';
    title.textContent = 'Reports';
    title.className = 'view-title';

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

    // Create header container that includes both header and time period selector
    const headerContainer = document.createElement('div');
    headerContainer.className = 'view-header view-sticky view-header-container';

    headerContainer.appendChild(header);
    headerContainer.appendChild(timePeriodSelectorComponent);

    return headerContainer;
  }

  /**
   * Handle category chart click - scroll to category details
   */
  function handleCategoryChartClick(label) {
    if (!label) return;

    // Safe selector lookup using iteration to prevent injection
    const allCategoryCards = container.querySelectorAll('[data-category]');
    let targetCard = null;
    for (const card of allCategoryCards) {
      if (card.getAttribute('data-category') === label) {
        targetCard = card;
        break;
      }
    }

    if (targetCard) {
      targetCard.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });

      // Brief highlight effect
      const highlightTimeoutId = highlightCategoryCard(targetCard, 1000);

      // Store timeout ID for cleanup
      if (!container.cleanupTimeouts) {
        container.cleanupTimeouts = [];
      }
      container.cleanupTimeouts.push(highlightTimeoutId);
    }
  }

  /**
   * Handle category card click - navigate to dashboard with category filter
   */
  function handleCategoryCardClick(category) {
    // Defensive guard - return early if category is null/undefined
    if (!category || !category.name) {
      return;
    }

    // Save filter state for dashboard
    const filterData = {
      category: category.name,
      timePeriod: currentTimePeriod,
      source: 'reports',
    };

    NavigationState.saveDashboardFilter(filterData);

    // Navigate to dashboard
    Router.navigate('dashboard');
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

    // Clear cache when time period changes to ensure fresh data
    const oldCacheKey = getCacheKey(currentTimePeriod);
    localStorage.removeItem(oldCacheKey);

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
        // Security: Clearing container content, no user input involved
        container.innerHTML = '';
        const header = createHeader();
        container.appendChild(header);
        container.appendChild(content);
      }

      // Check for cached analytics data for instant loading
      const cachedAnalytics = getCachedAnalytics(currentTimePeriod);
      if (cachedAnalytics) {
        // Use cached data instantly
        currentData = {
          ...cachedAnalytics,
          transactions: TransactionService.getAll(), // Always get fresh transactions
        };
        renderReports();
        isLoading = false;
        return;
      }

      showLoadingState();

      const startTime = Date.now();

      let transactions;
      try {
        const allTransactions = TransactionService.getAll();

        if (!Array.isArray(allTransactions)) {
          throw new Error('Invalid transaction data format - expected array');
        }

        transactions = allTransactions;
      } catch (storageError) {
        console.error('Storage access error:', storageError);

        try {
          console.warn('[ReportsView] Attempting storage recovery...');
          localStorage.removeItem('blinkbudget_transactions');
          transactions = [];
        } catch (recoveryError) {
          console.error('Storage recovery failed:', recoveryError);
          throw new Error(
            'Unable to access transaction data. Please check your browser storage settings and try refreshing the page.',
            { cause: recoveryError }
          );
        }
      }

      let analyticsData;
      try {
        // Use analytics engine directly
        analyticsData = {
          transactions,
          timePeriod: currentTimePeriod,
          insights: analyticsEngine.generateSpendingInsights(
            transactions,
            currentTimePeriod
          ),
          categoryBreakdown: analyticsEngine.calculateCategoryBreakdown(
            transactions,
            currentTimePeriod
          ),
          incomeVsExpenses: analyticsEngine.calculateIncomeVsExpenses(
            transactions,
            currentTimePeriod
          ),
          costOfLiving: analyticsEngine.calculateCostOfLiving(
            transactions,
            currentTimePeriod
          ),
        };
      } catch (analyticsError) {
        console.error('Progressive data loading error:', analyticsError);

        console.warn(
          '[ReportsView] Attempting fallback to minimal analytics data...'
        );

        try {
          analyticsData = createMinimalAnalyticsData(
            transactions,
            currentTimePeriod
          );
        } catch (minimalDataError) {
          console.error('Minimal data fallback failed:', minimalDataError);
          throw analyticsError;
        }
      }

      try {
        validateAnalyticsData(analyticsData);
      } catch (validationError) {
        console.error('Analytics data validation failed:', validationError);

        analyticsData = sanitizeAnalyticsData(analyticsData);

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
              'The processed financial data appears to be invalid. Please try refreshing the page or contact support if the issue persists.',
              { cause: secondValidationError }
            );
          }
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

      // Cache the analytics data for instant loading next time
      setCachedAnalytics(currentTimePeriod, currentData);

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
   * Create skeleton loader for a section
   */
  function createSkeletonLoader(sectionName, height = '200px') {
    const skeleton = document.createElement('div');
    skeleton.className = `skeleton-loader skeleton-${sectionName}`;
    skeleton.style.height = height;
    skeleton.style.background =
      'linear-gradient(90deg, var(--color-surface) 25%, var(--color-border) 50%, var(--color-surface) 75%)';
    skeleton.style.backgroundSize = '200% 100%';
    skeleton.style.animation = 'skeleton-loading 1.5s ease-in-out infinite';
    skeleton.style.borderRadius = 'var(--radius-md)';
    skeleton.style.marginBottom = SPACING.XS;

    // Add animation keyframes if not already present
    if (!document.querySelector('#skeleton-animations')) {
      const style = document.createElement('style');
      style.id = 'skeleton-animations';
      style.textContent = `
        @keyframes skeleton-loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `;
      document.head.appendChild(style);
    }

    return skeleton;
  }

  /**
   * Show skeleton loaders for all sections
   */
  function showSkeletonLoaders(chartContainer) {
    // Create skeleton for each section
    if (!skeletonStates.budgetSummary) {
      skeletonStates.budgetSummary = createSkeletonLoader(
        'budget-summary',
        '120px'
      );
      chartContainer.appendChild(skeletonStates.budgetSummary);
    }

    if (!skeletonStates.categoryBreakdown) {
      skeletonStates.categoryBreakdown = createSkeletonLoader(
        'category-breakdown',
        '300px'
      );
      chartContainer.appendChild(skeletonStates.categoryBreakdown);
    }

    if (!skeletonStates.categorySelector) {
      skeletonStates.categorySelector = createSkeletonLoader(
        'category-selector',
        '400px'
      );
      chartContainer.appendChild(skeletonStates.categorySelector);
    }

    if (!skeletonStates.financialInsights) {
      skeletonStates.financialInsights = createSkeletonLoader(
        'financial-insights',
        '150px'
      );
      chartContainer.appendChild(skeletonStates.financialInsights);
    }

    if (!skeletonStates.incomeExpense) {
      skeletonStates.incomeExpense = createSkeletonLoader(
        'income-expense',
        '250px'
      );
      chartContainer.appendChild(skeletonStates.incomeExpense);
    }
  }

  /**
   * Hide skeleton loader for a specific section
   */
  function hideSkeletonLoader(sectionName) {
    if (skeletonStates[sectionName]) {
      skeletonStates[sectionName].style.display = 'none';
    }
  }

  /**
   * Render the complete reports interface
   */
  async function renderReports() {
    try {
      // Use requestAnimationFrame for smooth rendering
      requestAnimationFrame(async () => {
        try {
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

          if (
            !currentData.transactions ||
            currentData.transactions.length === 0
          ) {
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

          // Create or get chart container
          let chartContainer = content.querySelector(
            '.reports-chart-container'
          );
          if (!chartContainer) {
            chartContainer = createChartContainer();
            chartContainer.className = 'reports-chart-container';
            content.appendChild(chartContainer);
          }

          // Add fallback warning if needed
          if (
            currentData.isFallback &&
            !chartContainer.querySelector('.fallback-warning')
          ) {
            const fallbackWarning = document.createElement('div');
            fallbackWarning.className = 'fallback-warning';
            fallbackWarning.style.padding = SPACING.SM;
            fallbackWarning.style.background = 'rgba(251, 191, 36, 0.1)';
            fallbackWarning.style.border = '1px solid rgba(251, 191, 36, 0.3)';
            fallbackWarning.style.borderRadius = 'var(--radius-xs)';
            fallbackWarning.style.color = '#92400e';
            fallbackWarning.style.fontSize = '0.875rem';
            fallbackWarning.style.marginBottom = SPACING.XS;
            // Security: Static string, not user input
            fallbackWarning.textContent =
              '⚠️ Using simplified calculations due to data processing issues. Some advanced insights may not be available.';
            chartContainer.insertBefore(
              fallbackWarning,
              chartContainer.firstChild
            );
          }

          // Show skeleton loaders initially
          showSkeletonLoaders(chartContainer);

          // Incrementally update sections instead of full re-render
          await updateSectionsIncrementally(chartContainer);

          // Update time period selector if we have a custom time period
          if (
            currentTimePeriod &&
            timePeriodSelectorComponent &&
            timePeriodSelectorComponent.setPeriod
          ) {
            timePeriodSelectorComponent.setPeriod(currentTimePeriod);
          }

          // Check for saved category filter and scroll to it
          const savedCategory = NavigationState.restoreReportsCategoryFilter();
          if (savedCategory) {
            // Use setTimeout to ensure DOM is fully rendered
            const scrollTimeoutId = setTimeout(() => {
              if (!container) return;

              // Safe selector lookup using iteration to prevent injection
              const allCategoryCards =
                container.querySelectorAll('[data-category]');
              let targetCard = null;
              for (const card of allCategoryCards) {
                if (card.getAttribute('data-category') === savedCategory) {
                  targetCard = card;
                  break;
                }
              }

              if (targetCard) {
                targetCard.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center',
                });

                // Highlight effect
                const highlightTimeoutId = highlightCategoryCard(
                  targetCard,
                  1500
                );

                // Store timeout ID for cleanup
                if (container.cleanupTimeouts) {
                  container.cleanupTimeouts.push(highlightTimeoutId);
                }
              }

              // Clear the saved filter after use
              NavigationState.clearReportsCategoryFilter();
            }, 300);

            // Store timeout ID for cleanup
            if (!container.cleanupTimeouts) {
              container.cleanupTimeouts = [];
            }
            container.cleanupTimeouts.push(scrollTimeoutId);
          }

          // Note: We don't clear the saved time period to allow persistence across navigations
          // Users can manually change the time period if needed

          showContentState();
        } catch (error) {
          console.error('Error in requestAnimationFrame callback:', error);
          showErrorState(
            errorState,
            'Failed to render reports. Please try again.',
            () => loadReportData()
          );
          if (!content.contains(errorState)) content.appendChild(errorState);
          errorState.style.display = 'flex';
        }
      });
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
   * Update sections incrementally instead of full re-render
   */
  async function updateSectionsIncrementally(chartContainer) {
    const chartRenderResults = [];

    // Update each section independently and concurrently
    await Promise.all([
      updateBudgetSummary(chartContainer, chartRenderResults),
      updateCategoryBreakdown(chartContainer, chartRenderResults),
      updateCategorySelector(chartContainer, chartRenderResults),
      updateFinancialInsights(chartContainer, chartRenderResults),
      updateIncomeExpense(chartContainer, chartRenderResults),
    ]);

    const failedCharts = chartRenderResults.filter(result => !result.success);
    if (failedCharts.length > 0) {
      showChartRenderingWarning(container, failedCharts);
    }
  }

  /******************* UI OF APP ***********************************
   * Render beautiful charts with progressive loading
   */

  /**
   * Update budget summary section incrementally
   */
  async function updateBudgetSummary(chartContainer, chartRenderResults) {
    try {
      // Check if container exists, create if not
      let section = sectionContainers.budgetSummary;
      if (!section) {
        section = document.createElement('div');
        section.className = 'budget-summary-section';
        section.id = 'budget-summary-section';
        chartContainer.appendChild(section);
        sectionContainers.budgetSummary = section;
      }

      // Clear existing content
      section.innerHTML = '';

      const budgetsSummary = BudgetPlanner.getSummary(
        currentData.transactions,
        currentTimePeriod
      );
      if (budgetsSummary.totalBudgets > 0) {
        const summaryCard = BudgetSummaryCard(
          budgetsSummary,
          currentTimePeriod
        );
        summaryCard.style.marginBottom = SPACING.XS;
        section.appendChild(summaryCard);
      }
      // Hide skeleton loader when content is loaded
      hideSkeletonLoader('budgetSummary');
      chartRenderResults.push({ name: 'Budget Summary', success: true });
    } catch (budgetError) {
      console.warn(
        '[ReportsView] Failed to update budget summary:',
        budgetError
      );
      hideSkeletonLoader('budgetSummary');
      chartRenderResults.push({
        name: 'Budget Summary',
        success: false,
        error: budgetError,
      });
    }
  }

  /**
   * Update category breakdown section incrementally
   */
  async function updateCategoryBreakdown(chartContainer, chartRenderResults) {
    try {
      // Check if container exists, create if not
      let section = sectionContainers.categoryBreakdown;
      if (!section) {
        section = document.createElement('div');
        section.className = 'category-breakdown-section';
        section.id = 'category-breakdown-section';
        chartContainer.appendChild(section);
        sectionContainers.categoryBreakdown = section;
      }

      // Clear existing content and destroy old chart
      section.innerHTML = '';
      const oldChart = activeCharts.get('category-breakdown');
      if (oldChart && typeof oldChart.destroy === 'function') {
        oldChart.destroy();
      }

      const categoryResult = await createCategoryBreakdownChart(
        chartRenderer,
        currentData,
        categoryColorMap,
        categories => getCategoryColors(categories, categoryColorMap),
        handleCategoryChartClick
      );
      section.appendChild(categoryResult.section);
      if (categoryResult.chart)
        activeCharts.set('category-breakdown', categoryResult.chart);
      // Hide skeleton loader when content is loaded
      hideSkeletonLoader('categoryBreakdown');
      chartRenderResults.push({ name: 'Category Breakdown', success: true });
    } catch (categoryError) {
      console.error(
        'Failed to update category breakdown chart:',
        categoryError
      );
      hideSkeletonLoader('categoryBreakdown');
      chartRenderResults.push({
        name: 'Category Breakdown',
        success: false,
        error: categoryError,
      });
    }
  }

  /**
   * Update category selector section incrementally
   */
  async function updateCategorySelector(chartContainer, chartRenderResults) {
    try {
      // Check if container exists, create if not
      let section = sectionContainers.categorySelector;
      if (!section) {
        section = document.createElement('div');
        section.className = 'category-selector-section';
        section.id = 'category-selector-section';
        section.style.clear = 'both';
        section.style.position = 'relative';
        section.style.zIndex = '2';
        section.style.marginTop = SPACING.XS;
        section.style.marginBottom = SPACING.XS;
        chartContainer.appendChild(section);
        sectionContainers.categorySelector = section;
      }

      // Clear existing content
      section.innerHTML = '';

      // Generate frequency analysis data
      const frequencyData = analyticsEngine.analyzeFrequencyPatterns(
        currentData.transactions,
        currentTimePeriod
      );

      // Get budget status for each category
      const budgetStatus = BudgetPlanner.getBudgetsStatus(
        currentData.transactions,
        currentTimePeriod
      );

      // Create budget status map for easy lookup
      const budgetStatusMap = {};
      if (budgetStatus && Array.isArray(budgetStatus)) {
        budgetStatus.forEach(budget => {
          budgetStatusMap[budget.categoryName] = budget;
        });
      }

      const categorySelectorSection = CategorySelector(
        currentData,
        categoryColorMap,
        categories => getCategoryColors(categories, categoryColorMap),
        handleCategoryCardClick,
        frequencyData.categories,
        budgetStatusMap
      );
      section.appendChild(categorySelectorSection);
      // Hide skeleton loader when content is loaded
      hideSkeletonLoader('categorySelector');
      chartRenderResults.push({ name: 'Category Selector', success: true });
    } catch (selectorError) {
      console.error('Failed to update category selector:', selectorError);
      hideSkeletonLoader('categorySelector');
      chartRenderResults.push({
        name: 'Category Selector',
        success: false,
        error: selectorError,
      });
    }
  }

  /**
   * Update financial insights section incrementally
   */
  async function updateFinancialInsights(chartContainer, chartRenderResults) {
    try {
      // Check if container exists, create if not
      let section = sectionContainers.financialInsights;
      if (!section) {
        section = document.createElement('div');
        section.className = 'financial-insights-section';
        section.id = 'financial-insights-section';
        chartContainer.appendChild(section);
        sectionContainers.financialInsights = section;
      }

      // Clear existing content
      section.innerHTML = '';

      if (currentData.insights && currentData.insights.length > 0) {
        const insightsSection = InsightsSection(currentData);
        insightsSection.style.setProperty('margin-top', '0', 'important');
        section.appendChild(insightsSection);
      }
      // Hide skeleton loader when content is loaded
      hideSkeletonLoader('financialInsights');
      chartRenderResults.push({ name: 'Financial Insights', success: true });
    } catch (insightsError) {
      console.error('Failed to update insights section:', insightsError);
      hideSkeletonLoader('financialInsights');
      chartRenderResults.push({
        name: 'Financial Insights',
        success: false,
        error: insightsError,
      });
    }
  }

  /**
   * Update income vs expense section incrementally
   */
  async function updateIncomeExpense(chartContainer, chartRenderResults) {
    try {
      // Check if container exists, create if not
      let section = sectionContainers.incomeExpense;
      if (!section) {
        section = document.createElement('div');
        section.className = 'income-expense-section';
        section.id = 'income-expense-section';
        section.style.position = 'relative';
        section.style.zIndex = '1';
        section.style.clear = 'both';
        section.style.marginTop = SPACING.XS;
        section.style.marginBottom = SPACING.XS;
        chartContainer.appendChild(section);
        sectionContainers.incomeExpense = section;
      }

      // Clear existing content and destroy old chart
      section.innerHTML = '';
      const oldChart = activeCharts.get('income-expense');
      if (oldChart && typeof oldChart.destroy === 'function') {
        oldChart.destroy();
      }

      const incomeResult = await createIncomeExpenseChart(
        chartRenderer,
        currentData
      );
      section.appendChild(incomeResult.section);
      if (incomeResult.chart)
        activeCharts.set('income-expense', incomeResult.chart);
      // Hide skeleton loader when content is loaded
      hideSkeletonLoader('incomeExpense');
      chartRenderResults.push({ name: 'Income vs Expenses', success: true });
    } catch (incomeExpenseError) {
      console.error(
        'Failed to update income vs expense chart:',
        incomeExpenseError
      );
      hideSkeletonLoader('incomeExpense');
      chartRenderResults.push({
        name: 'Income vs Expenses',
        success: false,
        error: incomeExpenseError,
      });
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

    // Reset skeleton states for new load
    Object.keys(skeletonStates).forEach(key => {
      skeletonStates[key] = null;
    });
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
    updateResponsiveLayout();
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

    // No progressive loader to cancel
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
    content.style.gap = SPACING.XS;

    // Sync charts-section horizontal padding with header
    const chartsSections = content.querySelectorAll('.charts-section');
    chartsSections.forEach(cs => {
      if (isMobile) {
        cs.style.padding = isShortLandscape
          ? `${SPACING.XS} ${SPACING.SM}`
          : `${SPACING.SM} ${SPACING.SM}`;
      } else if (isTablet) {
        // Vertical and horizontal padding removed to rely on container gaps and match app width
        cs.style.padding = '0';
      } else {
        // Vertical and horizontal padding removed to rely on container gaps and match app width
        cs.style.padding = '0';
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
      // Clear cache when data changes to ensure fresh analytics
      const cacheKey = getCacheKey(currentTimePeriod);
      localStorage.removeItem(cacheKey);

      clearTimeout(container._refreshTimeout);

      // Use requestIdleCallback for background updates when available
      if ('requestIdleCallback' in window) {
        container._refreshTimeout = setTimeout(() => {
          window.requestIdleCallback(
            () => {
              loadReportData(true); // Skip header recreation for incremental updates
            },
            { timeout: 2000 }
          );
        }, 500); // Longer debounce for background updates
      } else {
        // Fallback for browsers without requestIdleCallback
        container._refreshTimeout = setTimeout(() => {
          loadReportData(true); // Skip header recreation for incremental updates
        }, 500);
      }
    }
  };

  // Auth change handler
  const handleAuthChange = () => {
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

    // Remove skeleton elements from DOM
    Object.values(skeletonStates).forEach(skeleton => {
      if (skeleton && skeleton.parentNode) {
        skeleton.parentNode.removeChild(skeleton);
      }
    });

    // Reset skeleton states
    Object.keys(skeletonStates).forEach(key => {
      skeletonStates[key] = null;
    });

    // Remove skeleton animation styles
    const skeletonStyles = document.querySelector('#skeleton-animations');
    if (skeletonStyles) {
      skeletonStyles.remove();
    }

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

  // Cleanup function to clear timeouts on unmount
  container.cleanup = () => {
    if (container.cleanupTimeouts) {
      container.cleanupTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
      container.cleanupTimeouts = [];
    }
  };

  return container;
};
