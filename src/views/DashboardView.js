import { Button } from '../components/Button.js';
import { DashboardStatsCard } from '../components/DashboardStatsCard.js';
import { TransactionList } from '../components/TransactionList.js';
import { AccountService } from '../core/account-service.js';
import { TransactionService } from '../core/transaction-service.js';
import { AuthService } from '../core/auth-service.js';
import { Router } from '../core/router.js';
import {
  COLORS,
  SPACING,
  BREAKPOINTS,
  TIMING,
  STORAGE_KEYS,
} from '../utils/constants.js';

import { debounce } from '../utils/touch-utils.js';
import { getTransactionToHighlight } from '../utils/success-feedback.js';
import { createNavigationButtons } from '../utils/navigation-helper.js';

export const DashboardView = () => {
  const container = document.createElement('div');
  container.className = 'view-dashboard view-container';
  container.setAttribute('data-tutorial-target', 'dashboard');

  // Header with sticky positioning
  const header = document.createElement('div');
  header.style.marginBottom = SPACING.MD;
  header.style.flexShrink = '0';
  header.style.position = 'sticky'; // Sticky positioning
  header.style.top = '0'; // Stick to top
  header.style.width = '100%';
  header.style.background = COLORS.BACKGROUND; // Ensure background covers content
  header.style.zIndex = '10'; // Above content
  header.style.padding = `${SPACING.SM} 0`; // Vertical padding, horizontal handled by container

  const topRow = document.createElement('div');
  topRow.style.display = 'flex';
  topRow.style.justifyContent = 'space-between';
  topRow.style.alignItems = 'center';

  // Left side with title only
  const leftSide = document.createElement('div');
  leftSide.style.display = 'flex';
  leftSide.style.alignItems = 'center';
  leftSide.style.gap = SPACING.MD;

  // Title
  const title = document.createElement('h2');
  const updateTitle = userObj => {
    const u = userObj || AuthService.user;
    const uName = u ? u.displayName || u.email : '';
    title.textContent = `Dashboard 1.18 ${uName}`;
  };
  updateTitle();
  title.style.margin = '0';
  title.style.fontSize =
    window.innerWidth < BREAKPOINTS.MOBILE ? '1.25rem' : 'h2';
  title.style.fontWeight = 'bold';
  title.style.color = COLORS.TEXT_MAIN;

  leftSide.appendChild(title);

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
  Object.assign(accountSelect.style, {
    padding: `${SPACING.SM} ${SPACING.MD}`,
    borderRadius: 'var(--radius-md)',
    background: COLORS.SURFACE,
    color: COLORS.TEXT_MAIN,
    border: `1px solid ${COLORS.BORDER}`,
    outline: 'none',
    minWidth: '150px',
    appearance: 'auto',
    width: '100%',
    marginTop: SPACING.SM,
  });
  accountSelect.className = 'input-select';

  // Account Options Logic
  let currentFilter =
    sessionStorage.getItem(STORAGE_KEYS.DASHBOARD_FILTER) || 'all';
  let currentDateFilter =
    sessionStorage.getItem(STORAGE_KEYS.DASHBOARD_DATE_FILTER) || null;
  let currentCategoryFilter =
    sessionStorage.getItem(STORAGE_KEYS.DASHBOARD_CATEGORY_FILTER) || null;

  const accounts = AccountService.getAccounts();

  const allOption = document.createElement('option');
  allOption.value = 'all';
  allOption.textContent = 'All Accounts';
  allOption.selected = currentFilter === 'all';
  accountSelect.appendChild(allOption);

  accounts.forEach(acc => {
    const opt = document.createElement('option');
    opt.value = acc.id;
    opt.textContent = acc.name;
    if (acc.id === currentFilter) opt.selected = true;
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

  // Main Content Wrapper
  const content = document.createElement('div');
  content.style.flex = '1';
  content.style.display = 'flex';
  content.style.flexDirection = 'column';
  content.style.minHeight = '0'; // Allow flex child to shrink below content size
  content.style.overflow = 'visible'; // Allow child to scroll
  content.style.position = 'relative'; // For proper overflow handling

  container.appendChild(content);

  const renderDashboard = () => {
    content.innerHTML = '';

    // Always get fresh data
    const allTransactions = TransactionService.getAll();
    const currentAccounts = AccountService.getAccounts();

    // Filter Transactions
    const transactions = allTransactions
      .filter(t => {
        // Account Filter
        if (
          currentFilter !== 'all' &&
          t.accountId !== currentFilter &&
          t.toAccountId !== currentFilter
        ) {
          return false;
        }

        // Date Filter
        if (currentDateFilter) {
          const tDate = t.timestamp.split('T')[0];
          if (tDate !== currentDateFilter) return false;
        }

        // Category Filter
        if (currentCategoryFilter) {
          if (t.category !== currentCategoryFilter) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Filter out ghost transactions for totals calculation
    // We want them in the list but not affecting the balance/stats
    const validTransactionsForStats = transactions.filter(t => !t.isGhost);

    // Calculate ALL TIME net worth for Total Available
    let allTimeIncome = 0;
    let allTimeExpense = 0;

    validTransactionsForStats.forEach(t => {
      if (currentFilter === 'all') {
        if (t.type === 'income') allTimeIncome += t.amount;
        if (t.type === 'expense') allTimeExpense += t.amount;
        if (t.type === 'refund') allTimeExpense -= t.amount;
      } else {
        const isSource = t.accountId === currentFilter;
        const isDest = t.toAccountId === currentFilter;

        if (t.type === 'income' && isSource) allTimeIncome += t.amount;
        if (t.type === 'expense' && isSource) allTimeExpense += t.amount;
        if (t.type === 'refund' && isSource) allTimeExpense -= t.amount;

        if (t.type === 'transfer') {
          if (isSource) allTimeExpense += t.amount;
          if (isDest) allTimeIncome += t.amount;
        }
      }
    });

    const availableBalance = allTimeIncome - allTimeExpense;

    // Filter for current month only for Monthly Spent calculation
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthTransactions = validTransactionsForStats.filter(t => {
      const transactionDate = new Date(t.timestamp);
      return (
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear
      );
    });

    // Calculate monthly expense for the monthly spent card
    let totalExpense = 0;

    currentMonthTransactions.forEach(t => {
      if (currentFilter === 'all') {
        if (t.type === 'expense') totalExpense += t.amount;
        if (t.type === 'refund') totalExpense -= t.amount;
      } else {
        const isSource = t.accountId === currentFilter;

        if (t.type === 'expense' && isSource) totalExpense += t.amount;
        if (t.type === 'refund' && isSource) totalExpense -= t.amount;

        if (t.type === 'transfer') {
          if (isSource) totalExpense += t.amount;
        }
      }
    });

    // Statistics Cards Container
    const statsContainer = document.createElement('div');
    statsContainer.className = 'dashboard-stats-container';
    statsContainer.style.flexShrink = '0'; // Prevent stats from shrinking
    const isMobile = window.innerWidth < BREAKPOINTS.MOBILE;
    Object.assign(statsContainer.style, {
      display: 'grid',
      gap: SPACING.MD,
      marginBottom: SPACING.XL,
      gridTemplateColumns: isMobile
        ? '1fr 1fr'
        : 'repeat(auto-fit, minmax(250px, 1fr))',
    });

    // Get current month name for the label
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
    const currentMonthName = monthNames[currentMonth];

    statsContainer.appendChild(
      DashboardStatsCard({
        label: 'Total Available',
        value: availableBalance,
        color: COLORS.PRIMARY_LIGHT,
      })
    );
    statsContainer.appendChild(
      DashboardStatsCard({
        label: `${currentMonthName} Spent`,
        value: totalExpense,
        color: COLORS.ERROR,
      })
    );

    content.appendChild(statsContainer);

    // Action Button
    const addBtn = Button({
      text: '+ Add Transaction',
      onClick: () => {
        const params =
          currentFilter !== 'all' ? { accountId: currentFilter } : {};
        Router.navigate('add-expense', params);
      },
      variant: 'primary',
    });
    addBtn.style.width = '100%';
    addBtn.style.margin = '0';
    addBtn.style.marginBottom = SPACING.XL;
    addBtn.style.flexShrink = '0'; // Prevent button from shrinking
    content.appendChild(addBtn);

    // Recent Transactions
    const highlightTransactionIds = getTransactionToHighlight();
    const transactionList = TransactionList({
      transactions,
      currentFilter,
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

        renderDashboard();
      },
    });
    content.appendChild(transactionList);
  };

  // Cache DOM element references to prevent excessive queries
  let statsContainer = null;

  // Responsive layout updates
  const updateResponsiveLayout = debounce(() => {
    const isMobile = window.innerWidth < BREAKPOINTS.MOBILE;
    if (!statsContainer) {
      statsContainer = document.querySelector('.dashboard-stats-container');
    }
    if (!statsContainer) return;
    statsContainer.style.gridTemplateColumns = isMobile
      ? '1fr 1fr'
      : 'repeat(auto-fit, minmax(250px, 1fr))';
  }, TIMING.DEBOUNCE_RESIZE);

  window.addEventListener('resize', updateResponsiveLayout);
  window.addEventListener('orientationchange', () => {
    setTimeout(updateResponsiveLayout, TIMING.DEBOUNCE_ORIENTATION);
  });

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
    currentFilter = e.target.value;
    // Use localStorage directly to avoid syncing this preference
    sessionStorage.setItem(STORAGE_KEYS.DASHBOARD_FILTER, currentFilter);
    renderDashboard();
  });

  // Cleanup function for event listeners
  container.cleanup = () => {
    window.removeEventListener('resize', updateResponsiveLayout);
    window.removeEventListener('orientationchange', updateResponsiveLayout);
    window.removeEventListener('storage-updated', handleStorageUpdate);
    window.removeEventListener('auth-state-changed', handleAuthChange);
  };

  return container;
};
