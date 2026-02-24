/**
 * Transaction List Item Component
 * Displays a single transaction in the dashboard list
 */

import { Router } from '../core/router.js';
import { TransactionService } from '../core/transaction-service.js';
import { formatDateForDisplay } from '../utils/date-utils.js';
import {
  COLORS,
  FONT_SIZES,
  SPACING,
  TOUCH_TARGETS,
  BREAKPOINTS,
  CURRENCY_SYMBOL,
} from '../utils/constants.js';
import { highlightTransactionSuccess } from '../utils/success-feedback.js';

export const TransactionListItem = ({
  transaction,
  currentFilter,
  accounts,
  shouldHighlight = false,
  currentDateFilter = null,
  onDateClick = () => { },
  currentCategoryFilter = null,
  onCategoryClick = () => { },
}) => {
  const item = document.createElement('li');
  item.className = 'transaction-item';
  item.setAttribute('role', 'listitem');

  Object.assign(item.style, {
    display: 'flex',
    justifyContent: 'space-between',
    padding: SPACING.MD,
    borderBottom: `1px solid ${COLORS.SURFACE_HOVER}`,
    cursor: 'pointer',
    minHeight: TOUCH_TARGETS.MIN_HEIGHT,
    alignItems: 'center',
    opacity: transaction.isGhost ? '0.6' : '1',
  });

  // Long press to split, instant click to edit
  let pressTimer = null;
  let longPressed = false;

  const handleSplitTransaction = () => {
    const result = TransactionService.split(transaction.id);
    if (!result) return;

    const { first, second } = result;

    // Mark both transactions for highlighting
    // Store both IDs as comma-separated string
    sessionStorage.setItem(
      'highlightTransactionId',
      `${first.id},${second.id}`
    );

    // Trigger UI update
    window.dispatchEvent(
      new CustomEvent('storage-updated', {
        detail: { key: 'transactions' },
      })
    );
  };

  const startPress = () => {
    longPressed = false;
    pressTimer = setTimeout(() => {
      longPressed = true;
      handleSplitTransaction();
    }, 500); // 500ms for long press
  };

  const cancelPress = () => {
    clearTimeout(pressTimer);
  };

  // Bind events for long press detection
  item.addEventListener('mousedown', startPress);
  item.addEventListener('touchstart', startPress, { passive: true });

  item.addEventListener('mouseup', cancelPress);
  item.addEventListener('mouseleave', cancelPress);
  item.addEventListener('touchend', cancelPress);
  item.addEventListener('touchcancel', cancelPress);

  // Cancel on scroll
  item.addEventListener('touchmove', cancelPress, { passive: true });
  /// seems to be only for windows where we do not have this problem
  // window.addEventListener('scroll', cancelPress, { passive: true });

  // Prevent context menu during long press
  item.addEventListener('contextmenu', e => {
    if (longPressed) e.preventDefault();
  });

  // Instant click for navigation
  item.addEventListener('click', _e => {
    if (!longPressed) {
      Router.navigate('edit-expense', { id: transaction.id });
    }
  });

  const info = document.createElement('div');
  info.className = 'transaction-item-info';
  const isMobile = window.innerWidth < BREAKPOINTS.MOBILE;
  Object.assign(info.style, {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: isMobile ? SPACING.XS : '2px',
    textAlign: 'left',
    flex: '1',
    minWidth: '0',
  });

  const cat = document.createElement('div');

  // Special Display for Transfers
  if (transaction.type === 'transfer') {
    const getAccName = id => accounts.find(a => a.id === id)?.name || 'Unknown';
    cat.textContent = `Transfer: ${getAccName(transaction.accountId)} → ${getAccName(transaction.toAccountId)}`;
  } else {
    cat.textContent = transaction.category;
  }

  cat.className = 'transaction-item-category';
  Object.assign(cat.style, {
    fontSize: isMobile ? FONT_SIZES.BASE : FONT_SIZES.SM,
    lineHeight: 'var(--line-height-normal)',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    color:
      transaction.type === 'transfer'
        ? COLORS.TEXT_MUTED
        : currentCategoryFilter === transaction.category
          ? COLORS.PRIMARY
          : COLORS.TEXT_MAIN,
    fontWeight:
      currentCategoryFilter === transaction.category ||
        transaction.type === 'transfer'
        ? '700'
        : '500',
  });

  if (transaction.type !== 'transfer') {
    cat.addEventListener('click', e => {
      e.stopPropagation();
      onCategoryClick(transaction.category);
    });
  }

  const date = document.createElement('div');
  date.textContent = formatDateForDisplay(transaction.timestamp);
  date.className = 'transaction-item-date';
  Object.assign(date.style, {
    fontSize: isMobile ? FONT_SIZES.SM : '0.75rem',
    color:
      currentDateFilter === transaction.timestamp.split('T')[0]
        ? COLORS.PRIMARY_LIGHT
        : COLORS.TEXT_MUTED,
    display: 'flex',
    gap: SPACING.SM,
    lineHeight: 'var(--line-height-normal)',
    alignItems: 'center',
    cursor: 'pointer', // Add pointer to indicate clickable
    flexWrap: 'wrap', // Allow wrapping for long metadata (moved/original info)
  });

  // Date click handler
  date.addEventListener('click', e => {
    e.stopPropagation(); // Prevent item click
    const dateStr = transaction.timestamp.split('T')[0];
    onDateClick(dateStr);
  });

  // Show Account Name if not transfer
  if (transaction.type !== 'transfer') {
    const accName =
      accounts.find(a => a.id === transaction.accountId)?.name || 'Unknown';
    const accBadge = document.createElement('span');
    accBadge.textContent = `• ${accName}`;
    date.appendChild(accBadge);
  }

  // Ghost/Moved Indicator (Inline with date)
  if (transaction.isGhost && transaction.movedToDate) {
    const movedSpan = document.createElement('span');
    movedSpan.textContent = ` • Moved to ${formatDateForDisplay(transaction.movedToDate)}`;
    movedSpan.style.fontStyle = 'italic';
    movedSpan.style.whiteSpace = 'nowrap';
    date.appendChild(movedSpan);
  } else if (!transaction.isGhost && transaction.originalDate) {
    const originalSpan = document.createElement('span');
    originalSpan.textContent = ` • Original: ${formatDateForDisplay(transaction.originalDate)}`;
    originalSpan.style.fontStyle = 'italic';
    originalSpan.style.whiteSpace = 'nowrap';
    date.appendChild(originalSpan);
  }

  info.appendChild(cat);
  info.appendChild(date);

  // Add description/notes if available
  if (transaction.description && transaction.description.trim()) {
    const description = document.createElement('div');
    description.textContent = transaction.description;
    description.className = 'transaction-item-description';
    Object.assign(description.style, {
      fontSize: isMobile ? FONT_SIZES.XS : '0.7rem',
      color: COLORS.TEXT_MUTED,
      fontStyle: 'italic',
      marginTop: '2px',
      maxWidth: '200px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    });
    info.appendChild(description);
  }

  const val = document.createElement('div');

  // Color Logic
  let isPositive = false;
  let color = 'inherit';

  if (transaction.type === 'income' || transaction.type === 'refund') {
    isPositive = true;
    color = COLORS.SUCCESS;
  } else if (transaction.type === 'transfer') {
    color = COLORS.TEXT_MUTED;
    if (currentFilter !== 'all') {
      if (transaction.toAccountId === currentFilter) {
        isPositive = true;
      } else {
        isPositive = false;
      }
    } else {
      isPositive = true;
    }
  }

  // Append sign - use arrow for refunds and transfers
  let sign = isPositive ? '+' : '-';
  if (transaction.type === 'refund') {
    sign = '⮎'; // Up arrow for refund (money coming back)
  } else if (transaction.type === 'transfer') {
    sign = '⇆ '; // Horizontal arrow for transfer
  }

  val.textContent = `${sign}${CURRENCY_SYMBOL}${Math.abs(transaction.amount).toFixed(2)}`;
  val.className = 'transaction-item-value';
  Object.assign(val.style, {
    fontWeight: '600',
    color,
    fontSize: isMobile ? FONT_SIZES.LG : FONT_SIZES.BASE,
    lineHeight: 'var(--line-height-tight)',
    textAlign: 'right',
    flexShrink: '0',
  });

  item.appendChild(info);
  item.appendChild(val);

  // Apply success highlight if this transaction should be highlighted
  if (shouldHighlight) {
    // Add new transaction animation class
    item.classList.add('transaction-item-new');

    // Use a small delay to ensure the item is rendered before highlighting
    setTimeout(() => {
      highlightTransactionSuccess(item, 1500);
    }, 100);
  }

  return item;
};
