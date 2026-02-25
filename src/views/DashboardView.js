import { Button } from '../components/Button.js';
import { DashboardStatsCard } from '../components/DashboardStatsCard.js';
import { TransactionList } from '../components/TransactionList.js';
import { QuickAmountPresets } from '../components/QuickAmountPresets.js';
import { AccountService } from '../core/Account/account-service.js';
import { TransactionService } from '../core/transaction-service.js';
import { FilteringService } from '../core/analytics/FilteringService.js';
import { AuthService } from '../core/auth-service.js';
import { SettingsService } from '../core/settings-service.js';
import { Router } from '../core/router.js';
import { COLORS, SPACING, STORAGE_KEYS } from '../utils/constants.js';

import { getTransactionToHighlight } from '../utils/success-feedback.js';
import { createNavigationButtons } from '../utils/navigation-helper.js';
import { AdvancedFilterPanel } from '../components/AdvancedFilterPanel.js';

export const DashboardView = () => {
  const container = document.createElement('div');
  container.className = 'view-dashboard view-container';
  container.setAttribute('data-tutorial-target', 'dashboard');

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

  // Title
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
  leftSide.appendChild(title);
  title.className = 'view-title';

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
  let advancedFilters = null;

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

  // Advanced Filter Panel (Conditional)
  const advancedFilteringEnabled =
    SettingsService.getSetting('advancedFilteringEnabled') === true;
  let filterPanel;

  if (advancedFilteringEnabled) {
    filterPanel = AdvancedFilterPanel({
      onFiltersChange: filters => {
        console.log('Dashboard filters applied:', filters);
        advancedFilters = filters;
        renderDashboard();
      },
    });
    container.appendChild(filterPanel);
  }

  const renderDashboard = () => {
    content.innerHTML = '';

    // Always get fresh data
    const allTransactions = TransactionService.getAll();
    const currentAccounts = AccountService.getAccounts();

    // 1. First apply advanced filters if they exist
    let transactions = allTransactions;
    if (advancedFilters) {
      // Include ghosts in filtering because list wants them
      transactions = FilteringService.applyFilters(transactions, {
        ...advancedFilters,
        includeGhosts: true,
      });
    }

    // 2. Then apply legacy filters (Account, Quick Date, Quick Category)
    transactions = transactions
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
            tDate.getUTCMonth() !== filterDate.getUTCMonth() ||
            tDate.getUTCFullYear() !== filterDate.getUTCFullYear()
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Filter out ghost transactions for totals calculation
    // We want them in the list but not affecting the balance/stats
    const validTransactionsForStats = transactions.filter(t => !t.isGhost);

    // Check if any filters are active
    const hasActiveFilters = currentAccountFilter !== 'all' ||
      currentDateFilter !== null ||
      currentCategoryFilter !== null ||
      currentMonthFilter !== null ||
      advancedFilters !== null;

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
        const isSource = (currentAccountFilter === 'all') || (t.accountId === currentAccountFilter);

        if (t.type === 'income' && isSource) filteredIncome += t.amount;
        if (t.type === 'expense' && isSource) filteredExpense += t.amount;
        if (t.type === 'refund' && isSource) filteredExpense -= t.amount;

        if (t.type === 'transfer') {
          if (t.accountId === currentAccountFilter || currentAccountFilter === 'all') {
            filteredExpense += t.amount;
          }
          if (t.toAccountId === currentAccountFilter || currentAccountFilter === 'all') {
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
        value: hasActiveFilters ? filteredAvailableBalance : totalAvailableBalance,
        color: COLORS.PRIMARY_LIGHT,
        showResetButton: true,
        isFiltered: hasActiveFilters,
        onReset: () => {
          // Reset all filters
          currentAccountFilter = 'all';
          currentDateFilter = null;
          currentCategoryFilter = null;
          currentMonthFilter = null;

          sessionStorage.removeItem(STORAGE_KEYS.DASHBOARD_FILTER);
          sessionStorage.removeItem(STORAGE_KEYS.DASHBOARD_DATE_FILTER);
          sessionStorage.removeItem(STORAGE_KEYS.DASHBOARD_CATEGORY_FILTER);
          sessionStorage.removeItem(STORAGE_KEYS.DASHBOARD_MONTH_FILTER);

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
    const quickAmountPresets = QuickAmountPresets({
      onPresetSelect: amount => {
        const params =
          currentAccountFilter !== 'all'
            ? { accountId: currentAccountFilter, amount: amount.toString() }
            : { amount: amount.toString() };
        Router.navigate('add-expense', params);
      },
    });

    // Add a small container for quick amount presets with no spacing
    const quickPresetsWrapper = document.createElement('div');
    quickPresetsWrapper.style.margin = '0';
    quickPresetsWrapper.style.padding = '0';
    quickPresetsWrapper.appendChild(quickAmountPresets);
    content.appendChild(quickPresetsWrapper);

    // Action Button
    const addBtn = Button({
      text: '+ Add Transaction',
      onClick: () => {
        const params =
          currentAccountFilter !== 'all'
            ? { accountId: currentAccountFilter }
            : {};
        Router.navigate('add-expense', params);
      },
      variant: 'primary',
    });
    addBtn.style.width = '100%';
    addBtn.style.margin = '0';
    addBtn.style.marginBottom = SPACING.XS;
    addBtn.style.flexShrink = '0'; // Prevent button from shrinking
    content.appendChild(addBtn);

    // Recent Transactions
    const highlightTransactionIds = getTransactionToHighlight();
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
  };

  renderDashboard();

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
