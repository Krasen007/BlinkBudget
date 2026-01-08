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
} from '../utils/constants.js';
import { debounce } from '../utils/touch-utils.js';

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
  listContainer.style.overflow = 'hidden'; // Prevent container from scrolling

  const listTitle = document.createElement('h3');
  listTitle.textContent = 'Recent Transactions';
  listTitle.className = 'dashboard-transactions-title';
  listTitle.style.flexShrink = '0'; // Prevent title from shrinking
  const isMobile = window.innerWidth < BREAKPOINTS.MOBILE;
  Object.assign(listTitle.style, {
    marginBottom: SPACING.MD,
    textAlign: 'left',
    fontSize: isMobile ? FONT_SIZES.TITLE_MOBILE : FONT_SIZES.TITLE_DESKTOP,
    lineHeight: 'var(--line-height-tight)',
    fontWeight: '600',
  });

  listContainer.appendChild(listTitle);

  if (transactions.length === 0) {
    const emptyState = document.createElement('p');
    emptyState.textContent = 'No transactions yet.';
    emptyState.style.color = 'var(--color-text-muted)';
    listContainer.appendChild(emptyState);
  } else {
    const list = document.createElement('ul');
    list.className = 'dashboard-transactions-list';
    list.style.flex = '1';
    list.style.minHeight = '0'; // Allow flex child to shrink
    Object.assign(list.style, {
      listStyle: 'none',
      padding: 0,
      margin: 0,
      overflowY: 'auto',
      overflowX: 'hidden',
      borderTop: '1px solid var(--color-surface-hover)',
      webkitOverflowScrolling: 'touch',
      scrollBehavior: 'smooth',
      overscrollBehavior: 'contain',
      willChange: 'scroll-position',
      transform: 'translateZ(0)',
    });

    // Dynamic height calculation - use flex instead of maxHeight
    const calculateListHeight = () => {
      // List will use flex: 1, but we can still set a min-height for small screens
      const minHeight = DIMENSIONS.MIN_LIST_HEIGHT;
      list.style.minHeight = `${minHeight}px`;
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
