/**
 * Transaction List Item Component
 * Displays a single transaction in the dashboard list
 */

import { Router } from '../core/router.js';
import { TransactionService } from '../core/transaction-service.js';
import { CustomCategoryService } from '../core/custom-category-service.js';
import { getTransactionTagName } from '../utils/form-utils/transaction-tags.js';
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
  onDateClick = () => {},
  currentCategoryFilter = null,
  onCategoryClick = () => {},
  currentTagFilter = null,
  onTagClick = () => {},
  // Multi-select support
  selectionMode = false,
  isSelected = false,
  onToggleSelect = null,
  onSelectMultiple = null,
}) => {
  const item = document.createElement('li');
  item.className = 'transaction-item transaction-list-item';
  item.setAttribute('role', 'listitem');
  item.dataset.transactionId = transaction.id;

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

  // Long press shows action menu; instant click navigates to edit or toggles selection
  let pressTimer = null;
  let longPressed = false;

  // --- Checkbox for selection mode ---
  if (selectionMode && typeof onToggleSelect === 'function') {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = isSelected;
    checkbox.style.marginRight = SPACING.SM;
    checkbox.style.flexShrink = '0';
    checkbox.style.width = '20px';
    checkbox.style.height = '20px';
    checkbox.style.accentColor = 'var(--color-primary)';
    checkbox.addEventListener('click', e => {
      e.stopPropagation();
      onToggleSelect(transaction.id);
    });
    item.insertBefore(checkbox, item.firstChild);
  }

  // Apply selected visual styling
  if (isSelected) {
    item.style.background = 'var(--color-primary-light)';
    item.style.borderLeft = '3px solid var(--color-primary)';
  }

  const handleSplitTransaction = () => {
    // Import ConfirmDialog dynamically
    import('./ConfirmDialog.js')
      .then(({ ConfirmDialog }) => {
        ConfirmDialog({
          title: 'Split Transaction',
          message: `Split this transaction of ${CURRENCY_SYMBOL}${(Number(transaction.amount) || 0).toFixed(2)}?`,
          confirmText: 'Split',
          variant: 'primary',
          onConfirm: () => {
            let result;
            try {
              result = TransactionService.split(transaction.id);
              if (!result) {
                import('../utils/toast-notifications.js')
                  .then(({ showErrorToast }) => {
                    showErrorToast('Failed to split transaction');
                  })
                  .catch(() => {
                    console.error(
                      'Failed to split transaction and toast system unavailable'
                    );
                  });
                return;
              }
            } catch (error) {
              import('../utils/toast-notifications.js')
                .then(({ showErrorToast }) => {
                  showErrorToast(
                    `Failed to split transaction: ${error.message}`
                  );
                })
                .catch(() => {
                  console.error(
                    'Failed to split transaction and toast system unavailable'
                  );
                });
              return;
            }

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
          },
        });
      })
      .catch(error => {
        console.error('Failed to load ConfirmDialog:', error);
        import('../utils/toast-notifications.js')
          .then(({ showErrorToast }) => {
            showErrorToast(
              'Could not open confirmation dialog. Please try again.'
            );
          })
          .catch(() => {
            // Fallback if toast system fails to load
            // At this point both ConfirmDialog and toast failed, log and accept failure
            console.error(
              'Toast system also failed to load - cannot show error to user'
            );
          });
      });
  };

  const showActionMenu = () => {
    // Create a simple action menu overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.4); z-index: 1000;
      display: flex; align-items: flex-end; justify-content: center;
    `;

    const menu = document.createElement('div');
    menu.style.cssText = `
      background: var(--color-surface);
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
      padding: ${SPACING.MD};
      width: 100%; max-width: 400px;
      box-shadow: 0 -4px 12px rgba(0,0,0,0.15);
    `;

    const menuTitle = document.createElement('div');
    menuTitle.textContent = `${transaction.category} — ${CURRENCY_SYMBOL}${Math.abs(transaction.amount).toFixed(2)}`;
    menuTitle.style.cssText = `
      font-weight: 600; margin-bottom: ${SPACING.MD};
      color: var(--color-text-main); text-align: center;
    `;
    menu.appendChild(menuTitle);

    // Split Transaction button
    const splitBtn = document.createElement('button');
    splitBtn.textContent = '✂️ Split Transaction';
    splitBtn.style.cssText = `
      display: block; width: 100%; padding: ${SPACING.MD};
      background: var(--color-surface-hover); border: none;
      border-radius: var(--radius-md); margin-bottom: ${SPACING.SM};
      font-size: 1rem; cursor: pointer; color: var(--color-text-main);
    `;
    splitBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
      handleSplitTransaction();
    });
    menu.appendChild(splitBtn);

    // Select Multiple Transactions button
    const multiBtn = document.createElement('button');
    multiBtn.textContent = '☑️ Select Multiple Transactions';
    multiBtn.style.cssText = `
      display: block; width: 100%; padding: ${SPACING.MD};
      background: var(--color-surface-hover); border: none;
      border-radius: var(--radius-md); margin-bottom: ${SPACING.MD};
      font-size: 1rem; cursor: pointer; color: var(--color-text-main);
    `;
    multiBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
      if (typeof onSelectMultiple === 'function') {
        onSelectMultiple();
      }
    });
    menu.appendChild(multiBtn);

    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = `
      display: block; width: 100%; padding: ${SPACING.SM};
      background: transparent; border: 1px solid var(--color-border);
      border-radius: var(--radius-md); font-size: 0.9rem;
      cursor: pointer; color: var(--color-text-muted);
    `;
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
    });
    menu.appendChild(cancelBtn);

    overlay.appendChild(menu);
    overlay.addEventListener('click', e => {
      if (e.target === overlay) document.body.removeChild(overlay);
    });
    document.body.appendChild(overlay);
  };

  const startPress = () => {
    if (selectionMode) return; // No long-press in selection mode
    longPressed = false;
    pressTimer = setTimeout(() => {
      longPressed = true;
      showActionMenu();
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

  const catRow = document.createElement('div');
  catRow.className = 'transaction-item-category-row';

  const cat = document.createElement('span');

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

  catRow.appendChild(cat);

  const tagName = getTransactionTagName(transaction);
  const flagCategory =
    tagName && transaction.type === 'expense'
      ? CustomCategoryService.getCheckboxCategories().find(
          c => c.name === tagName
        )
      : null;

  if (flagCategory) {
    const tagColor = flagCategory.color || COLORS.PRIMARY;

    const tagBadge = document.createElement('span');
    tagBadge.className = 'transaction-item-tag';
    tagBadge.textContent = tagName.toUpperCase();

    const isIncluded = currentTagFilter === tagName;
    const isExcluded = currentTagFilter === `exclude:${tagName}`;

    if (isExcluded) {
      tagBadge.classList.add('transaction-item-tag--excluded');
      tagBadge.title = `Clear filter for ${tagName}`;
    } else if (isIncluded) {
      tagBadge.title = `Exclude ${tagName}`;
    } else {
      tagBadge.title = `Filter by ${tagName}`;
    }

    Object.assign(tagBadge.style, {
      color: tagColor,
      background: isExcluded ? `${tagColor}11` : `${tagColor}22`,
      borderColor: isIncluded || isExcluded ? tagColor : 'transparent',
      outline: isIncluded ? `1px solid ${tagColor}` : 'none',
      textDecoration: isExcluded ? 'line-through' : 'none',
    });

    tagBadge.addEventListener('click', e => {
      e.stopPropagation();
      onTagClick(tagName);
    });

    catRow.appendChild(tagBadge);
  }

  const catContainer = catRow;

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

  info.appendChild(catContainer);
  info.appendChild(date);

  // Add description/notes if available (hidden by default)
  if (transaction.description && transaction.description.trim()) {
    const description = document.createElement('div');
    description.textContent = transaction.description;
    description.className = 'transaction-item-description';
    description.style.display = 'none'; // Hidden by default
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

  // Click — in selection mode toggle selection, otherwise navigate to edit
  item.addEventListener('click', _e => {
    if (!longPressed) {
      if (selectionMode && typeof onToggleSelect === 'function') {
        onToggleSelect(transaction.id);
      } else {
        Router.navigate('edit-expense', { id: transaction.id });
      }
    }
  });

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
    sign = '↪ '; // Return arrow for refund (money coming back)
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
