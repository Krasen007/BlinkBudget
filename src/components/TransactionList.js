/**
 * Transaction List Component
 * Displays a scrollable list of transactions
 */

import { TransactionListItem } from './TransactionListItem.js';
import {
  SPACING,
  BREAKPOINTS,
  FONT_SIZES,
  COLORS,
} from '../utils/constants.js';
import { ClickTracker } from '../core/click-tracking-service.js';
import {
  createEnhancedEmptyState,
  EMPTY_STATE_SCENARIOS,
} from '../utils/enhanced-empty-states.js';
import { Router } from '../core/router.js';

export const TransactionList = ({
  transactions,
  currentFilter,
  accounts,
  highlightTransactionIds = null,
  currentDateFilter = null,
  onDateClick = () => {},
  currentCategoryFilter = null,
  onCategoryClick = () => {},
  currentMonthFilter = null,
  onMonthChange = () => {},
  onFilterClear = () => {}, // New callback for clearing general filter
}) => {
  const listContainer = document.createElement('div');
  listContainer.className = 'dashboard-transactions-container';
  listContainer.setAttribute('role', 'region');
  listContainer.setAttribute('aria-label', 'Recent Transactions');

  listContainer.style.display = 'flex';
  listContainer.style.flexDirection = 'column';

  // Title container with metrics
  const titleContainer = document.createElement('div');
  titleContainer.style.display = 'flex';
  titleContainer.style.justifyContent = 'space-between';
  titleContainer.style.alignItems = 'center';
  titleContainer.style.marginBottom = SPACING.SM;
  titleContainer.style.flexShrink = '0';

  const listTitle = document.createElement('h3');
  listTitle.textContent = 'Recent Transactions';
  listTitle.className = 'dashboard-transactions-title';
  const isMobile = window.innerWidth < BREAKPOINTS.MOBILE;
  Object.assign(listTitle.style, {
    textAlign: 'left',
    fontSize: isMobile ? FONT_SIZES.TITLE_MOBILE : FONT_SIZES.TITLE_DESKTOP,
    lineHeight: 'var(--line-height-tight)',
    fontWeight: '600',
    margin: '0',
  });

  // Click metrics display
  const metrics = ClickTracker.getAverageMetrics();
  const metricsDisplay = document.createElement('div');
  metricsDisplay.className = 'click-metrics';
  metricsDisplay.style.display = 'flex';
  metricsDisplay.style.flexDirection = 'column';
  metricsDisplay.style.alignItems = 'flex-end';
  metricsDisplay.style.fontSize = isMobile ? FONT_SIZES.SM : FONT_SIZES.BASE;
  metricsDisplay.style.color = COLORS.TEXT_MUTED || '#6b7280';
  metricsDisplay.style.textAlign = 'right';
  metricsDisplay.style.cursor = 'pointer';
  metricsDisplay.title = 'Click to clear tracking history';

  const clicksText = document.createElement('span');
  clicksText.textContent = `${metrics.averageClicks} clicks avg`;
  clicksText.style.fontWeight = '500';

  const timeText = document.createElement('span');
  timeText.textContent = `${metrics.averageDuration}s avg`;
  timeText.style.fontSize = isMobile ? FONT_SIZES.XS : FONT_SIZES.SM;
  timeText.style.marginTop = '2px';

  metricsDisplay.appendChild(clicksText);
  metricsDisplay.appendChild(timeText);

  // Add click handler to clear tracking history
  metricsDisplay.addEventListener('click', async e => {
    e.preventDefault();
    e.stopPropagation();

    ClickTracker.clearHistory();

    // Update display immediately
    const newMetrics = ClickTracker.getAverageMetrics();
    clicksText.textContent = `${newMetrics.averageClicks} clicks avg`;
    timeText.textContent = `${newMetrics.averageDuration}s avg`;

    // Visual feedback
    metricsDisplay.style.color = COLORS.SUCCESS || '#10b981';
    setTimeout(() => {
      metricsDisplay.style.color = COLORS.TEXT_MUTED || '#6b7280';
    }, 1000);
  });

  titleContainer.appendChild(listTitle);
  titleContainer.appendChild(metricsDisplay);
  listContainer.appendChild(titleContainer);

  // Category filter bar with month navigation
  if (currentCategoryFilter) {
    const categoryBar = document.createElement('div');
    categoryBar.className = 'category-filter-bar';
    categoryBar.style.display = 'flex';
    categoryBar.style.alignItems = 'center';
    categoryBar.style.justifyContent = 'space-between';
    categoryBar.style.padding = `${SPACING.SM} ${SPACING.MD}`;
    categoryBar.style.marginBottom = SPACING.SM;
    categoryBar.style.backgroundColor =
      COLORS.SURFACE_HOVER || 'var(--color-surface-hover)';
    categoryBar.style.borderRadius = '8px';
    categoryBar.style.flexShrink = '0';

    // Category name display
    const categoryLabel = document.createElement('span');
    categoryLabel.className = 'category-filter-label';
    categoryLabel.style.fontWeight = '600';
    categoryLabel.style.fontSize = FONT_SIZES.SM;
    categoryLabel.style.color = COLORS.TEXT_MAIN || 'var(--color-text-main)';

    // Month navigation controls
    const monthNav = document.createElement('div');
    monthNav.className = 'month-navigation';
    monthNav.style.display = 'flex';
    monthNav.style.alignItems = 'center';
    monthNav.style.gap = SPACING.SM;

    // Left arrow button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'month-nav-btn prev-month';
    prevBtn.textContent = '◀';
    prevBtn.style.background = 'none';
    prevBtn.style.border = 'none';
    prevBtn.style.cursor = 'pointer';
    prevBtn.style.padding = SPACING.XS;
    prevBtn.style.fontSize = '12px';
    prevBtn.style.color = COLORS.TEXT_MUTED || 'var(--color-text-muted)';
    prevBtn.style.transition = 'color 0.2s';

    // Right arrow button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'month-nav-btn next-month';
    nextBtn.textContent = '▶';
    nextBtn.style.background = 'none';
    nextBtn.style.border = 'none';
    nextBtn.style.cursor = 'pointer';
    nextBtn.style.padding = SPACING.XS;
    nextBtn.style.fontSize = '12px';
    nextBtn.style.color = COLORS.TEXT_MUTED || 'var(--color-text-muted)';
    nextBtn.style.transition = 'color 0.2s';

    // Add hover effects
    prevBtn.addEventListener('mouseenter', () => {
      prevBtn.style.color = COLORS.PRIMARY || 'var(--color-primary)';
    });
    prevBtn.addEventListener('mouseleave', () => {
      prevBtn.style.color = COLORS.TEXT_MUTED || 'var(--color-text-muted)';
    });
    nextBtn.addEventListener('mouseenter', () => {
      nextBtn.style.color = COLORS.PRIMARY || 'var(--color-primary)';
    });
    nextBtn.addEventListener('mouseleave', () => {
      nextBtn.style.color = COLORS.TEXT_MUTED || 'var(--color-text-muted)';
    });

    // Month display
    const monthDisplay = document.createElement('span');
    monthDisplay.className = 'month-display';
    monthDisplay.style.fontSize = FONT_SIZES.SM;
    monthDisplay.style.fontWeight = '500';
    monthDisplay.style.color = COLORS.TEXT_MAIN || 'var(--color-text-main)';
    monthDisplay.style.minWidth = '100px';
    monthDisplay.style.textAlign = 'center';

    // All Months button
    const allMonthsBtn = document.createElement('button');
    allMonthsBtn.className = 'all-months-btn';
    allMonthsBtn.textContent = 'All Months';
    allMonthsBtn.style.background = 'none';
    allMonthsBtn.style.border = 'none';
    allMonthsBtn.style.cursor = 'pointer';
    allMonthsBtn.style.padding = `${SPACING.XS} ${SPACING.SM}`;
    allMonthsBtn.style.fontSize = FONT_SIZES.XS || '12px';
    allMonthsBtn.style.color = COLORS.TEXT_MUTED || 'var(--color-text-muted)';
    allMonthsBtn.style.textDecoration = 'underline';
    allMonthsBtn.style.transition = 'color 0.2s';

    allMonthsBtn.addEventListener('mouseenter', () => {
      allMonthsBtn.style.color = COLORS.PRIMARY || 'var(--color-primary)';
    });
    allMonthsBtn.addEventListener('mouseleave', () => {
      allMonthsBtn.style.color = COLORS.TEXT_MUTED || 'var(--color-text-muted)';
    });

    allMonthsBtn.addEventListener('click', () => {
      if (typeof onMonthChange === 'function') {
        onMonthChange(null);
      }
    });

    monthNav.appendChild(prevBtn);
    monthNav.appendChild(monthDisplay);
    monthNav.appendChild(nextBtn);

    categoryBar.appendChild(categoryLabel);
    categoryBar.appendChild(monthNav);
    categoryBar.appendChild(allMonthsBtn);

    // Update the display based on current month filter
    const updateMonthDisplay = () => {
      if (currentMonthFilter) {
        const date = new Date(currentMonthFilter);
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
        monthDisplay.textContent = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        categoryLabel.textContent = `${currentCategoryFilter} - `;
      } else {
        monthDisplay.textContent = 'All Months';
        categoryLabel.textContent = currentCategoryFilter;
      }
    };

    // Arrow click handlers - navigate months
    const navigateMonth = direction => {
      let currentDate;
      if (currentMonthFilter) {
        currentDate = new Date(currentMonthFilter);
      } else {
        // Default to current month if no filter
        currentDate = new Date();
      }

      // Navigate to previous/next month
      currentDate.setMonth(currentDate.getMonth() + direction);

      if (typeof onMonthChange === 'function') {
        onMonthChange(currentDate.toISOString());
      }
    };

    prevBtn.addEventListener('click', () => navigateMonth(-1));
    nextBtn.addEventListener('click', () => navigateMonth(1));

    updateMonthDisplay();

    listContainer.appendChild(categoryBar);
  }

  if (transactions.length === 0) {
    // Determine empty state scenario
    let scenario = EMPTY_STATE_SCENARIOS.NO_TRANSACTIONS;
    if (currentDateFilter || currentCategoryFilter || currentFilter) {
      scenario = EMPTY_STATE_SCENARIOS.FILTER_NO_RESULTS;
    }

    const emptyState = createEnhancedEmptyState(scenario, {
      onAction: action => {
        switch (action) {
          case 'add-transaction':
            // Navigate to add transaction
            if (Router && typeof Router.navigate === 'function') {
              Router.navigate('add-expense');
            } else {
              console.warn('Router.navigate not available');
            }
            break;
          case 'clear-filters':
            // Clear all filters - date, category, and general filter
            if (typeof onFilterClear === 'function') {
              onFilterClear();
            }
            if (typeof onDateClick === 'function') {
              onDateClick(null);
            }
            if (typeof onCategoryClick === 'function') {
              onCategoryClick(null);
            }
            break;
          case 'show-tutorial':
            // Show tutorial using the global tutorial manager
            if (window.tutorialManager) {
              window.tutorialManager.restart();
            } else {
              console.warn('Tutorial manager not available');
            }
            break;
        }
      },
      showTips: true,
      compact: false,
    });

    listContainer.appendChild(emptyState);
  } else {
    const list = document.createElement('ul');
    list.className = 'dashboard-transactions-list';
    list.setAttribute('role', 'list');

    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    Object.assign(list.style, {
      listStyle: 'none',
      padding: 0,
      margin: 0,
      borderTop: '1px solid var(--color-surface-hover)',
    });

    transactions.forEach(transaction => {
      const shouldHighlight =
        highlightTransactionIds &&
        highlightTransactionIds.includes(transaction.id);
      const item = TransactionListItem({
        transaction,
        currentFilter,
        accounts,
        shouldHighlight,
        currentDateFilter,
        onDateClick,
        currentCategoryFilter,
        onCategoryClick,
      });
      list.appendChild(item);
    });

    listContainer.appendChild(list);
  }

  return listContainer;
};
