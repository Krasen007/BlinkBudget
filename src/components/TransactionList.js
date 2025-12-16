/**
 * Transaction List Component
 * Displays a scrollable list of transactions
 */

import { TransactionListItem } from './TransactionListItem.js';
import { StorageService } from '../core/storage.js';
import { formatDateForDisplay } from '../utils/date-utils.js';
import { SPACING, DIMENSIONS, BREAKPOINTS, TIMING, FONT_SIZES } from '../utils/constants.js';
import { debounce } from '../utils/touch-utils.js';

export const TransactionList = ({ transactions, currentFilter, accounts }) => {
    const listContainer = document.createElement('div');
    listContainer.className = 'dashboard-transactions-container';
    
    const listTitle = document.createElement('h3');
    listTitle.textContent = 'Recent Transactions';
    listTitle.className = 'dashboard-transactions-title';
    const isMobile = window.innerWidth < BREAKPOINTS.MOBILE;
    Object.assign(listTitle.style, {
        marginBottom: SPACING.MD,
        textAlign: 'left',
        fontSize: isMobile ? FONT_SIZES.TITLE_MOBILE : FONT_SIZES.TITLE_DESKTOP,
        lineHeight: 'var(--line-height-tight)',
        fontWeight: '600'
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
        Object.assign(list.style, {
            listStyle: 'none',
            padding: 0,
            overflowY: 'auto',
            borderTop: '1px solid var(--color-surface-hover)',
            webkitOverflowScrolling: 'touch',
            scrollBehavior: 'smooth',
            overscrollBehavior: 'contain',
            willChange: 'scroll-position',
            transform: 'translateZ(0)'
        });
        
        // Dynamic height calculation
        const calculateMaxHeight = () => {
            const viewportHeight = window.visualViewport?.height || window.innerHeight;
            const containerRect = listContainer.getBoundingClientRect();
            const listTitleRect = listTitle.getBoundingClientRect();
            const usedSpace = listTitleRect.bottom - containerRect.top;
            const mobileNav = document.querySelector('.mobile-nav');
            const mobileNavHeight = mobileNav ? mobileNav.offsetHeight : 0;
            const padding = 40;
            const availableHeight = viewportHeight - usedSpace - mobileNavHeight - padding;
            const minHeight = DIMENSIONS.MIN_LIST_HEIGHT;
            const maxHeight = Math.max(minHeight, availableHeight);
            return `${maxHeight}px`;
        };
        
        list.style.maxHeight = calculateMaxHeight();
        
        // Update height on resize
        const updateListHeight = debounce(() => {
            requestAnimationFrame(() => {
                list.style.maxHeight = calculateMaxHeight();
            });
        }, TIMING.DEBOUNCE_RESIZE);
        
        window.addEventListener('resize', updateListHeight);
        window.addEventListener('orientationchange', () => {
            setTimeout(updateListHeight, TIMING.DEBOUNCE_ORIENTATION);
        });
        
        // Recalculate after content loads
        setTimeout(updateListHeight, TIMING.INITIAL_LOAD_DELAY);
        
        transactions.forEach(transaction => {
            const item = TransactionListItem({
                transaction,
                currentFilter,
                accounts
            });
            list.appendChild(item);
        });
        
        listContainer.appendChild(list);
    }
    
    return listContainer;
};

