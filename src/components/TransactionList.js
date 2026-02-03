/**
 * Transaction List Component
 * Displays a scrollable list of transactions
 */

import { TransactionListItem } from './TransactionListItem.js';
import {
  SPACING,
  DIMENSIONS,
  BREAKPOINTS,
  TIMING,
  FONT_SIZES,
  COLORS,
} from '../utils/constants.js';
import { debounce } from '../utils/touch-utils.js';
import { ClickTracker } from '../core/click-tracking-service.js';

export const TransactionList = ({
  transactions,
  currentFilter,
  accounts,
  highlightTransactionIds = null,
  currentDateFilter = null,
  onDateClick = () => {},
  currentCategoryFilter = null,
  onCategoryClick = () => {},
}) => {
  const listContainer = document.createElement('div');
  listContainer.className = 'dashboard-transactions-container';
  listContainer.style.flex = '1';
  listContainer.style.display = 'flex';
  listContainer.style.flexDirection = 'column';
  listContainer.style.minHeight = '0'; // Allow flex child to shrink
  listContainer.style.overflow = 'visible'; // Allow child to scroll
  listContainer.style.position = 'relative'; // For proper overflow handling

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

  if (transactions.length === 0) {
    const emptyState = document.createElement('p');
    emptyState.textContent = 'No transactions yet.';
    emptyState.style.color = 'var(--color-text-muted)';
    listContainer.appendChild(emptyState);
  } else {
    const list = document.createElement('ul');
    list.className = 'dashboard-transactions-list';
    list.style.flex = '1';
    list.style.overflowY = 'auto'; // Enable vertical scrolling
    list.style.overflowX = 'hidden'; // Prevent horizontal scrolling
    list.style.webkitOverflowScrolling = 'touch'; // Smooth scrolling on iOS
    list.style.overscrollBehavior = 'contain'; // Prevent bounce scrolling on mobile
    list.style.touchAction = 'pan-y'; // Allow only vertical panning on touch
    Object.assign(list.style, {
      listStyle: 'none',
      padding: 0,
      margin: 0,
      borderTop: '1px solid var(--color-surface-hover)',
      // Ensure proper height on mobile
      height: 'auto',
      maxHeight: 'none',
    });

    // Dynamic height calculation - ensure proper scrolling
    const calculateListHeight = () => {
      // Set a reasonable minimum height for scrolling
      const minHeight = DIMENSIONS.MIN_LIST_HEIGHT;
      list.style.minHeight = `${minHeight}px`;
      // Ensure the list can grow to fill available space
      list.style.flex = '1';
      list.style.height = 'auto';
      // Remove any max-height restrictions
      list.style.maxHeight = 'none';
    };

    calculateListHeight();

    // Update height on resize (for min-height)
    const updateListHeight = debounce(() => {
      requestAnimationFrame(() => {
        calculateListHeight();
      });
    }, TIMING.DEBOUNCE_RESIZE);

    window.addEventListener('resize', updateListHeight);
    window.addEventListener('orientationchange', () => {
      setTimeout(updateListHeight, TIMING.DEBOUNCE_ORIENTATION);
    });

    // Recalculate after content loads
    setTimeout(updateListHeight, TIMING.INITIAL_LOAD_DELAY);

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
