import { ButtonComponent } from '../components/Button.js';
import { DashboardStatsCard } from '../components/DashboardStatsCard.js';
import { TransactionList } from '../components/TransactionList.js';
import { createQuickAmountPresets } from '../components/QuickAmountPresets.js';
import { AccountService } from '../core/Account/account-service.js';
import { TransactionService } from '../core/transaction-service.js';
import { AuthService } from '../core/auth-service.js';
import { Router } from '../core/router.js';
import { NavigationState } from '../core/navigation-state.js';
import { COLORS, SPACING, STORAGE_KEYS } from '../utils/constants.js';
import { getAnalyticsEngine } from '../core/analytics/AnalyticsInstance.js';
import { getCurrentMonthPeriod } from '../utils/reports-utils.js';

import { getTransactionToHighlight } from '../utils/success-feedback.js';
import { createNavigationButtons } from '../utils/navigation-helper.js';

// Track if we've already preloaded reports in this session
let hasPreloadedReports = false;
let hasPreloadedFinancialPlanning = false;

// Preload reports data in background when user is on dashboard
const preloadReportsData = () => {
  try {
    console.log('[Dashboard] Pre-loading reports data in background...');

    const transactions = TransactionService.getAll();
    const analyticsEngine = getAnalyticsEngine();
    const currentTimePeriod = getCurrentMonthPeriod();

    // Skip if already preloaded in this session
    if (hasPreloadedReports) {
      console.log('[Dashboard] Reports already preloaded this session');
      return;
    }

    // Check if already cached
    const cacheKey = `blinkbudget_reports_cache_${currentTimePeriod.startDate}_${currentTimePeriod.endDate}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { timestamp } = JSON.parse(cached);
      const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
      if (Date.now() - timestamp < CACHE_TTL_MS) {
        console.log('[Dashboard] Reports data already cached and fresh');
        hasPreloadedReports = true;
        return;
      }
    }

    // Calculate and cache analytics data
    const insights = analyticsEngine.generateSpendingInsights(
      transactions,
      currentTimePeriod
    );
    const categoryBreakdown = analyticsEngine.calculateCategoryBreakdown(
      transactions,
      currentTimePeriod
    );
    const incomeVsExpenses = analyticsEngine.calculateIncomeVsExpenses(
      transactions,
      currentTimePeriod
    );
    const costOfLiving = analyticsEngine.calculateCostOfLiving(
      transactions,
      currentTimePeriod
    );

    const cacheEntry = {
      data: {
        timePeriod: currentTimePeriod,
        insights,
        categoryBreakdown,
        incomeVsExpenses,
        costOfLiving,
        transactions,
      },
      timestamp: Date.now(),
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
    hasPreloadedReports = true;

    console.log('[Dashboard] Reports data pre-loaded and cached');
  } catch (error) {
    console.warn('[Dashboard] Failed to pre-load reports data:', error);
    // Don't block dashboard if preloading fails
  }
};

// Preload financial planning data in background when user is on dashboard
const preloadFinancialPlanningData = async () => {
  try {
    console.log(
      '[Dashboard] Pre-loading financial planning data in background...'
    );

    // Skip if already preloaded in this session
    if (hasPreloadedFinancialPlanning) {
      console.log(
        '[Dashboard] Financial planning already preloaded this session'
      );
      return;
    }

    // Check if already cached
    const cacheKey = 'blinkbudget_financial_planning_cache';
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { timestamp } = JSON.parse(cached);
      const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
      if (Date.now() - timestamp < CACHE_TTL_MS) {
        console.log(
          '[Dashboard] Financial planning data already cached and fresh'
        );
        hasPreloadedFinancialPlanning = true;
        return;
      }
    }

    // Import dynamically to avoid circular dependencies
    const { planningDataManager } =
      await import('../core/financial-planning/PlanningDataManager.js');

    // Load and cache planning data
    const planningData = await planningDataManager.loadData();
    const cacheEntry = {
      data: planningData,
      timestamp: Date.now(),
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
    hasPreloadedFinancialPlanning = true;

    console.log('[Dashboard] Financial planning data pre-loaded and cached');
  } catch (error) {
    console.warn(
      '[Dashboard] Failed to pre-load financial planning data:',
      error
    );
    // Don't block dashboard if preloading fails
  }
};

export const DashboardView = (params = {}) => {
  const container = document.createElement('div');
  container.className = 'view-dashboard view-container';

  // Header with sticky positioning
  const header = document.createElement('div');
  header.className = 'view-header view-sticky view-header-container';

  const topRow = document.createElement('div');
  topRow.className = 'view-header-row';

  // Left side with title and category manager button
  const leftSide = document.createElement('div');
  leftSide.style.display = 'flex';
  leftSide.style.alignItems = 'center';
  leftSide.style.gap = SPACING.XS;

  // Title and filter status container
  const titleContainer = document.createElement('div');
  titleContainer.style.display = 'flex';
  titleContainer.style.alignItems = 'center';
  titleContainer.style.gap = SPACING.XS;

  const title = document.createElement('h2');
  const updateTitle = userObj => {
    const u = userObj || AuthService.user;
    const name = u?.displayName || u?.email?.split('@')[0];
    /* global __APP_VERSION__ */
    const version =
      typeof __APP_VERSION__ !== 'undefined' ? ` v${__APP_VERSION__}` : '';

    title.textContent = name
      ? `Hi, ${name}!${version}`
      : `Welcome back!${version}`;
  };
  updateTitle();
  titleContainer.appendChild(title);
  title.className = 'view-title';

  leftSide.appendChild(titleContainer);

  // Right side controls - use navigation helper
  const rightControls = createNavigationButtons('dashboard');

  topRow.appendChild(leftSide);
  topRow.appendChild(rightControls);

  header.appendChild(topRow);

  // Account Selector
  const leftHeader = document.createElement('div');

  const accountSelect = document.createElement('select');
  accountSelect.id = 'account-filter-select';
  accountSelect.name = 'account-filter';
  accountSelect.className = 'view-select';
  accountSelect.style.marginTop = '0';
  accountSelect.style.marginBottom = SPACING.XS;
  accountSelect.style.width = '100%';

  // Account Options Logic
  let currentAccountFilter =
    sessionStorage.getItem(STORAGE_KEYS.DASHBOARD_FILTER) || 'all';
  let currentDateFilter =
    sessionStorage.getItem(STORAGE_KEYS.DASHBOARD_DATE_FILTER) || null;
  let currentCategoryFilter =
    sessionStorage.getItem(STORAGE_KEYS.DASHBOARD_CATEGORY_FILTER) || null;
  let currentMonthFilter =
    sessionStorage.getItem(STORAGE_KEYS.DASHBOARD_MONTH_FILTER) || null;
  let currentTypeFilter = NavigationState.restoreDashboardTypeFilter() || null;

  // Track current filter state for display purposes
  let currentDashboardFilter = null;

  // Helper to ensure date is a Date object
  function ensureDate(value) {
    return value instanceof Date ? value : new Date(value);
  }

  // Check for dashboard filter state from Reports view
  const dashboardFilter = NavigationState.restoreDashboardFilter();
  if (dashboardFilter && dashboardFilter.source === 'reports') {
    // Update current filter state for display
    currentDashboardFilter = dashboardFilter;

    // Apply category filter from Reports
    currentCategoryFilter = dashboardFilter.category;
    sessionStorage.setItem(
      STORAGE_KEYS.DASHBOARD_CATEGORY_FILTER,
      dashboardFilter.category
    );

    // Apply time period filter if available
    if (dashboardFilter.timePeriod) {
      // For month filtering, we need the first day of the month in YYYY-MM-DD format
      const startDate = ensureDate(dashboardFilter.timePeriod.startDate);

      // Format as YYYY-MM-01 for proper month filtering using local time to match the reports view
      const monthFilter = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-01`;
      currentMonthFilter = monthFilter;
      sessionStorage.setItem(STORAGE_KEYS.DASHBOARD_MONTH_FILTER, monthFilter);
    }

    // Clear the navigation state after applying
    NavigationState.clearDashboardFilter();
  }

  // Check for time period filter from type filter (e.g., clicking Income in reports)
  if (currentTypeFilter) {
    const timePeriod = NavigationState.restoreDashboardTimePeriod();
    if (timePeriod) {
      const startDate = ensureDate(timePeriod.startDate);
      const monthFilter = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-01`;
      currentMonthFilter = monthFilter;
      sessionStorage.setItem(STORAGE_KEYS.DASHBOARD_MONTH_FILTER, monthFilter);
      // Clear the time period after applying
      NavigationState.clearDashboardFilter();
    }
  }

  // Initialize title after all variables are set
  updateTitle();

  const accounts = AccountService.getAccounts();

  const allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.textContent = 'All Accounts';
  allOption.selected = currentAccountFilter === 'all';
  accountSelect.appendChild(allOption);

  accounts.forEach(acc => {
    const opt = document.createElement('option');
    opt.value = acc.id;
    opt.textContent = acc.name;
    if (acc.id === currentAccountFilter) opt.selected = true;
    accountSelect.appendChild(opt);
  });

  leftHeader.appendChild(accountSelect);
  header.appendChild(leftHeader);
  container.appendChild(header);

  const refreshAccountOptions = () => {
    const accounts = AccountService.getAccounts();
    const currentVal = accountSelect.value;
    // Security: Clearing select options, no user input involved
    accountSelect.innerHTML = '';

    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'All Accounts';
    accountSelect.appendChild(allOption);

    accounts.forEach(acc => {
      const opt = document.createElement('option');
      opt.value = acc.id;
      opt.textContent = acc.name;
      accountSelect.appendChild(opt);
    });

    accountSelect.value = currentVal;
  };

  // Main Content Area
  const content = document.createElement('div');
  content.className = 'view-content';
  content.id = 'dashboard-content';
  container.appendChild(content);

  const renderDashboard = () => {
    // Security: Clearing content, no user input involved
    content.innerHTML = '';

    // Always get fresh data
    const allTransactions = TransactionService.getAll();
    const currentAccounts = AccountService.getAccounts();

    // Apply filters (Account, Quick Date, Quick Month, Quick Category, Type)
    const transactions = allTransactions
      .filter(t => {
        // Account Filter
        if (
          currentAccountFilter !== 'all' &&
          t.accountId !== currentAccountFilter &&
          t.toAccountId !== currentAccountFilter
        ) {
          return false;
        }

        // Quick Date Filter (from clicking date in list)
        if (currentDateFilter) {
          const tDate = t.timestamp.split('T')[0];
          if (tDate !== currentDateFilter) return false;
        }

        // Quick Category Filter (from clicking category in list)
        if (currentCategoryFilter) {
          if (t.category !== currentCategoryFilter) return false;
        }

        // Quick Month Filter (from clicking arrows in category bar)
        if (currentMonthFilter) {
          const tDate = new Date(t.timestamp);
          const filterDate = new Date(currentMonthFilter);
          if (
            tDate.getMonth() !== filterDate.getMonth() ||
            tDate.getFullYear() !== filterDate.getFullYear()
          ) {
            return false;
          }
        }

        // Type Filter (from clicking Income/Expense in reports)
        if (currentTypeFilter) {
          if (t.type !== currentTypeFilter) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Filter out ghost transactions for totals calculation
    // We want them in the list but not affecting the balance/stats
    const validTransactionsForStats = transactions.filter(t => !t.isGhost);

    // Check if any filters are active
    const hasActiveFilters =
      currentAccountFilter !== 'all' ||
      currentDateFilter !== null ||
      currentCategoryFilter !== null ||
      currentMonthFilter !== null ||
      currentTypeFilter !== null;

    // Calculate ALL TIME net worth for Total Available
    let allTimeIncome = 0;
    let allTimeExpense = 0;

    validTransactionsForStats.forEach(t => {
      if (currentAccountFilter === 'all') {
        if (t.type === 'income') allTimeIncome += t.amount;
        if (t.type === 'expense') allTimeExpense += t.amount;
        if (t.type === 'refund') allTimeExpense -= t.amount;
      } else {
        const isSource = t.accountId === currentAccountFilter;
        const isDest = t.toAccountId === currentAccountFilter;

        if (t.type === 'income' && isSource) allTimeIncome += t.amount;
        if (t.type === 'expense' && isSource) allTimeExpense += t.amount;
        if (t.type === 'refund' && isSource) allTimeExpense -= t.amount;

        if (t.type === 'transfer') {
          if (isSource) allTimeExpense += t.amount;
          if (isDest) allTimeIncome += t.amount;
        }
      }
    });

    const totalAvailableBalance = allTimeIncome - allTimeExpense;

    // Calculate FILTERED net worth if filters are active
    let filteredAvailableBalance = totalAvailableBalance;
    if (hasActiveFilters) {
      let filteredIncome = 0;
      let filteredExpense = 0;

      validTransactionsForStats.forEach(t => {
        const isSource =
          currentAccountFilter === 'all' ||
          t.accountId === currentAccountFilter;

        if (t.type === 'income' && isSource) filteredIncome += t.amount;
        if (t.type === 'expense' && isSource) filteredExpense += t.amount;
        if (t.type === 'refund' && isSource) filteredExpense -= t.amount;

        if (t.type === 'transfer') {
          if (
            t.accountId === currentAccountFilter ||
            currentAccountFilter === 'all'
          ) {
            filteredExpense += t.amount;
          }
          if (
            t.toAccountId === currentAccountFilter ||
            currentAccountFilter === 'all'
          ) {
            filteredIncome += t.amount;
          }
        }
      });

      filteredAvailableBalance = filteredIncome - filteredExpense;
    }

    // Filter for selected month for Monthly Spent calculation
    let filterMonth, filterYear;
    if (currentMonthFilter) {
      const filterDate = new Date(currentMonthFilter);
      filterMonth = filterDate.getMonth();
      filterYear = filterDate.getFullYear();
    } else {
      const now = new Date();
      filterMonth = now.getMonth();
      filterYear = now.getFullYear();
    }

    const selectedMonthTransactions = validTransactionsForStats.filter(t => {
      const transactionDate = new Date(t.timestamp);
      return (
        transactionDate.getMonth() === filterMonth &&
        transactionDate.getFullYear() === filterYear
      );
    });

    // Calculate monthly expense for the monthly spent card
    let totalExpense = 0;

    selectedMonthTransactions.forEach(t => {
      if (currentAccountFilter === 'all') {
        if (t.type === 'expense') totalExpense += t.amount;
        if (t.type === 'refund') totalExpense -= t.amount;
      } else {
        const isSource = t.accountId === currentAccountFilter;

        if (t.type === 'expense' && isSource) totalExpense += t.amount;
        if (t.type === 'refund' && isSource) totalExpense -= t.amount;

        if (t.type === 'transfer') {
          if (isSource) totalExpense += t.amount;
        }
      }
    });

    // Statistics Cards Container
    const statsContainer = document.createElement('div');
    statsContainer.className = 'view-stats-container';

    // Get selected month name for the label
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const selectedMonthName = monthNames[filterMonth];

    statsContainer.appendChild(
      DashboardStatsCard({
        label: 'Total Available',
        value: hasActiveFilters
          ? filteredAvailableBalance
          : totalAvailableBalance,
        color: COLORS.PRIMARY_LIGHT,
        showResetButton: true,
        isFiltered: hasActiveFilters,
        onReset: () => {
          // Reset all filters
          currentAccountFilter = 'all';
          currentDateFilter = null;
          currentCategoryFilter = null;
          currentMonthFilter = null;
          currentTypeFilter = null;

          sessionStorage.removeItem(STORAGE_KEYS.DASHBOARD_FILTER);
          sessionStorage.removeItem(STORAGE_KEYS.DASHBOARD_DATE_FILTER);
          sessionStorage.removeItem(STORAGE_KEYS.DASHBOARD_CATEGORY_FILTER);
          sessionStorage.removeItem(STORAGE_KEYS.DASHBOARD_MONTH_FILTER);
          NavigationState.clearDashboardTypeFilter();

          // Reset account select
          accountSelect.value = 'all';

          renderDashboard();
        },
      })
    );
    statsContainer.appendChild(
      DashboardStatsCard({
        label: `${selectedMonthName} Spent`,
        value: totalExpense,
        color: COLORS.ERROR,
        showMonthNavigation: true,
        currentMonthFilter,
        onMonthChange: monthDate => {
          currentMonthFilter = monthDate;

          if (monthDate) {
            sessionStorage.setItem(
              STORAGE_KEYS.DASHBOARD_MONTH_FILTER,
              monthDate
            );
          } else {
            sessionStorage.removeItem(STORAGE_KEYS.DASHBOARD_MONTH_FILTER);
          }

          renderDashboard();
        },
      })
    );

    content.appendChild(statsContainer);

    // Quick Amount Presets (Feature 3.4.1)
    const {
      container: quickAmountPresetsContainer,
      destroy: destroyQuickPresets,
    } = createQuickAmountPresets(amount => {
      const params =
        currentAccountFilter !== 'all'
          ? { accountId: currentAccountFilter, amount: amount.toString() }
          : { amount: amount.toString() };
      Router.navigate('add-expense', params);
    });

    // Add a small container for quick amount presets with no spacing
    const quickPresetsWrapper = document.createElement('div');
    quickPresetsWrapper.style.margin = '0';
    quickPresetsWrapper.style.padding = '0';
    quickPresetsWrapper.appendChild(quickAmountPresetsContainer);
    content.appendChild(quickPresetsWrapper);

    // Store destroy function for cleanup when view is destroyed
    if (!content._cleanupFunctions) {
      content._cleanupFunctions = [];
    }
    content._cleanupFunctions.push(destroyQuickPresets);

    // Action Button
    const addBtn = ButtonComponent({
      text: '+ Add Transaction',
      onClick: () => {
        const params =
          currentAccountFilter !== 'all'
            ? { accountId: currentAccountFilter }
            : {};
        Router.navigate('add-expense', params);
      },
      variant: 'primary',
      disabled: false, // Explicitly set to false
    });

    if (addBtn) {
      addBtn.style.width = '100%';
      addBtn.style.margin = '0';
      addBtn.style.marginBottom = SPACING.XS;
      addBtn.style.flexShrink = '0'; // Prevent button from shrinking
      content.appendChild(addBtn);
    } else {
      console.warn('Add Transaction button failed to render', {
        addBtn,
        currentAccountFilter,
        isMobile: Boolean(window.mobileUtils && window.mobileUtils.isMobile()),
      });
      // Create a fallback disabled button
      const fallbackBtn = document.createElement('button');
      fallbackBtn.textContent = '+ Add Transaction';
      fallbackBtn.disabled = true;
      fallbackBtn.className = 'btn btn-primary btn-disabled';
      fallbackBtn.style.width = '100%';
      fallbackBtn.style.margin = '0';
      fallbackBtn.style.marginBottom = SPACING.XS;
      fallbackBtn.style.flexShrink = '0';
      content.appendChild(fallbackBtn);
    }

    // Add clear filter button if filter is active from Reports
    if (
      (currentCategoryFilter && currentCategoryFilter !== 'all') ||
      currentTypeFilter
    ) {
      const clearFilterButton = ButtonComponent({
        text: 'Clear Filter',
        variant: 'primary',
        onClick: () => {
          // Clear all filters
          currentCategoryFilter = null;
          sessionStorage.removeItem(STORAGE_KEYS.DASHBOARD_CATEGORY_FILTER);
          currentMonthFilter = null;
          sessionStorage.removeItem(STORAGE_KEYS.DASHBOARD_MONTH_FILTER);
          currentTypeFilter = null;
          NavigationState.clearDashboardTypeFilter();
          currentDashboardFilter = null;

          // Update title and re-render
          updateTitle();
          renderDashboard();
        },
      });
      clearFilterButton.style.width = '100%';
      clearFilterButton.style.margin = '0';
      clearFilterButton.style.marginBottom = SPACING.XS;
      clearFilterButton.style.flexShrink = '0'; // Prevent button from shrinking
      content.appendChild(clearFilterButton);

      // Add filter status indicator
      const filterStatus = document.createElement('div');
      filterStatus.style.cssText = `
        text-align: center;
        color: var(--color-text-muted);
        font-size: var(--font-size-sm);
        margin-top: ${SPACING.XS};
        margin-bottom: ${SPACING.XS};
        padding: ${SPACING.SM};
        background: var(--color-surface);
        border-radius: var(--radius-md);
        border: 1px solid var(--color-border);
        cursor: pointer;
        transition: all 0.2s ease;
        user-select: none;
      `;

      // Add hover effect
      filterStatus.addEventListener('mouseenter', () => {
        filterStatus.style.color = 'var(--color-primary)';
        filterStatus.style.borderColor = 'var(--color-primary)';
        filterStatus.style.background = 'var(--color-surface-elevated)';
      });

      filterStatus.addEventListener('mouseleave', () => {
        filterStatus.style.color = 'var(--color-text-muted)';
        filterStatus.style.borderColor = 'var(--color-border)';
        filterStatus.style.background = 'var(--color-surface)';
      });

      // Add click handler to navigate back to reports
      filterStatus.addEventListener('click', () => {
        // Save the current filter state to return to reports with same context
        if (currentDashboardFilter && currentDashboardFilter.timePeriod) {
          // Convert dates to Date objects if they're strings
          const timePeriod = {
            ...currentDashboardFilter.timePeriod,
            startDate: ensureDate(currentDashboardFilter.timePeriod.startDate),
            endDate: ensureDate(currentDashboardFilter.timePeriod.endDate),
          };
          NavigationState.saveTimePeriod(timePeriod);
        }

        // Save the category filter to highlight it in reports view
        if (currentCategoryFilter && currentCategoryFilter !== 'all') {
          NavigationState.saveReportsCategoryFilter(currentCategoryFilter);
        }

        // Navigate back to reports view
        Router.navigate('reports');
      });

      filterStatus.textContent =
        currentCategoryFilter && currentCategoryFilter !== 'all'
          ? `Currently filtered by: ${currentCategoryFilter}${currentDashboardFilter && currentDashboardFilter.timePeriod ? ` (${currentDashboardFilter.timePeriod.label || 'selected period'})` : ''}`
          : currentTypeFilter
            ? `Currently filtered by: ${currentTypeFilter === 'income' ? 'Income' : currentTypeFilter === 'expense' ? 'Expenses' : currentTypeFilter} transactions`
            : 'No active filters';

      // Add title attribute for accessibility
      filterStatus.title = 'Click to return to Reports view';

      content.appendChild(filterStatus);
    }

    // Recent Transactions
    const highlightTransactionIds = getTransactionToHighlight() || [];
    // Add highlight transaction ID from params if provided
    if (params.highlightTransactionId) {
      highlightTransactionIds.push(params.highlightTransactionId);
    }
    const transactionList = TransactionList({
      transactions,
      currentAccountFilter,
      accounts: currentAccounts,
      highlightTransactionIds,
      // Pass date filter props
      currentDateFilter,
      onDateClick: date => {
        // Toggle filter: if clicking same date, clear it. Otherwise set it.
        const newDate = currentDateFilter === date ? null : date;
        currentDateFilter = newDate;

        if (newDate) {
          sessionStorage.setItem(STORAGE_KEYS.DASHBOARD_DATE_FILTER, newDate);
        } else {
          sessionStorage.removeItem(STORAGE_KEYS.DASHBOARD_DATE_FILTER);
        }

        renderDashboard();
      },
      // Pass category filter props
      currentCategoryFilter,
      onCategoryClick: category => {
        const newCategory =
          currentCategoryFilter === category ? null : category;
        currentCategoryFilter = newCategory;

        if (newCategory) {
          sessionStorage.setItem(
            STORAGE_KEYS.DASHBOARD_CATEGORY_FILTER,
            newCategory
          );
        } else {
          sessionStorage.removeItem(STORAGE_KEYS.DASHBOARD_CATEGORY_FILTER);
        }

        // Clear month filter when category changes
        currentMonthFilter = null;
        sessionStorage.removeItem(STORAGE_KEYS.DASHBOARD_MONTH_FILTER);

        renderDashboard();
      },
    });
    content.appendChild(transactionList);

    // Scroll to highlighted transaction if provided
    if (params.highlightTransactionId) {
      setTimeout(() => {
        const transactionItems = content.querySelectorAll(
          '.transaction-list-item'
        );
        transactionItems.forEach(item => {
          if (item.dataset.transactionId === params.highlightTransactionId) {
            item.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
      }, 100); // Small delay to ensure DOM is ready
    }
  };

  renderDashboard();

  // Preload data in background after dashboard renders
  setTimeout(() => {
    preloadReportsData();
  }, 1000); // Delay to avoid blocking dashboard render

  setTimeout(() => {
    preloadFinancialPlanningData();
  }, 2000); // Delay to avoid blocking dashboard render, staggered after reports

  const handleStorageUpdate = e => {
    if (e.detail.key === STORAGE_KEYS.ACCOUNTS) {
      refreshAccountOptions();
    }
    renderDashboard();
  };

  const handleAuthChange = e => {
    updateTitle(e.detail.user);
  };

  window.addEventListener('storage-updated', handleStorageUpdate);
  window.addEventListener('auth-state-changed', handleAuthChange);

  accountSelect.addEventListener('change', e => {
    currentAccountFilter = e.target.value;
    // Use localStorage directly to avoid syncing this preference
    sessionStorage.setItem(STORAGE_KEYS.DASHBOARD_FILTER, currentAccountFilter);
    // Remove focus from select to eliminate persistent border
    e.target.blur();
    renderDashboard();
  });

  // Cleanup function for event listeners
  container.cleanup = () => {
    window.removeEventListener('storage-updated', handleStorageUpdate);
    window.removeEventListener('auth-state-changed', handleAuthChange);
  };

  return container;
};
