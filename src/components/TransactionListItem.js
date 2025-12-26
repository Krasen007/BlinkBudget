/**
 * Transaction List Item Component
 * Displays a single transaction in the dashboard list
 */

import { Router } from '../core/router.js';
import { StorageService } from '../core/storage.js';
import { formatDateForDisplay } from '../utils/date-utils.js';
import { COLORS, FONT_SIZES, SPACING, TOUCH_TARGETS, BREAKPOINTS, CURRENCY_SYMBOL } from '../utils/constants.js';
import { highlightTransactionSuccess } from '../utils/success-feedback.js';

export const TransactionListItem = ({ transaction, currentFilter, accounts, shouldHighlight = false }) => {
    const item = document.createElement('li');
    item.className = 'transaction-item';

    Object.assign(item.style, {
        display: 'flex',
        justifyContent: 'space-between',
        padding: SPACING.MD,
        borderBottom: `1px solid ${COLORS.SURFACE_HOVER}`,
        cursor: 'pointer',
        minHeight: TOUCH_TARGETS.MIN_HEIGHT,
        alignItems: 'center'
    });


    item.addEventListener('click', () => {
        Router.navigate('edit-expense', { id: transaction.id });
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
        minWidth: '0'
    });

    const cat = document.createElement('div');

    // Special Display for Transfers
    if (transaction.type === 'transfer') {
        const getAccName = (id) => accounts.find(a => a.id === id)?.name || 'Unknown';

        if (currentFilter === 'all') {
            cat.textContent = `Transfer: ${getAccName(transaction.accountId)} → ${getAccName(transaction.toAccountId)}`;
        } else if (transaction.accountId === currentFilter) {
            cat.textContent = `Transfer to ${getAccName(transaction.toAccountId)}`;
        } else {
            cat.textContent = `Transfer from ${getAccName(transaction.accountId)}`;
        }
    } else {
        cat.textContent = transaction.category;
    }

    cat.className = 'transaction-item-category';
    Object.assign(cat.style, {
        fontWeight: '500',
        fontSize: isMobile ? FONT_SIZES.BASE : FONT_SIZES.SM,
        lineHeight: 'var(--line-height-normal)',
        color: COLORS.TEXT_MAIN,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
    });

    const date = document.createElement('div');
    date.textContent = formatDateForDisplay(transaction.timestamp);
    date.className = 'transaction-item-date';
    Object.assign(date.style, {
        fontSize: isMobile ? FONT_SIZES.SM : '0.75rem',
        color: COLORS.TEXT_MUTED,
        display: 'flex',
        gap: SPACING.SM,
        lineHeight: 'var(--line-height-normal)',
        alignItems: 'center'
    });

    // Show Account Name if not transfer
    if (transaction.type !== 'transfer') {
        const accName = accounts.find(a => a.id === transaction.accountId)?.name || 'Unknown';
        const accBadge = document.createElement('span');
        accBadge.textContent = `• ${accName}`;
        date.appendChild(accBadge);
    }

    info.appendChild(cat);
    info.appendChild(date);

    const val = document.createElement('div');

    // Color Logic
    let isPositive = false;
    let color = 'inherit';

    if (transaction.type === 'income' || transaction.type === 'refund') {
        isPositive = true;
        color = COLORS.SUCCESS;
    } else if (transaction.type === 'transfer') {
        if (currentFilter !== 'all') {
            if (transaction.toAccountId === currentFilter) {
                isPositive = true;
                color = COLORS.SUCCESS;
            } else {
                isPositive = false;
                color = 'inherit';
            }
        } else {
            isPositive = true;
            color = COLORS.TEXT_MUTED;
        }
    }

    // Append sign
    let sign = isPositive ? '+' : '-';
    if (transaction.type === 'transfer' && currentFilter === 'all') sign = '';

    val.textContent = `${sign}${CURRENCY_SYMBOL}${Math.abs(transaction.amount).toFixed(2)}`;
    val.className = 'transaction-item-value';
    Object.assign(val.style, {
        fontWeight: '600',
        color,
        fontSize: isMobile ? FONT_SIZES.LG : FONT_SIZES.BASE,
        lineHeight: 'var(--line-height-tight)',
        textAlign: 'right',
        flexShrink: '0'
    });

    item.appendChild(info);
    item.appendChild(val);

    // Apply success highlight if this transaction should be highlighted
    if (shouldHighlight) {
        // Use a small delay to ensure the item is rendered before highlighting
        setTimeout(() => {
            highlightTransactionSuccess(item, 1500);
        }, 100);
    }

    return item;
};

