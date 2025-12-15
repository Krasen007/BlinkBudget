import { Button } from '../components/Button.js';
import { StorageService } from '../core/storage.js';
import { Router } from '../core/router.js';

export const DashboardView = () => {
    const container = document.createElement('div');
    container.className = 'view-dashboard';
    container.style.width = '100%';
    container.style.maxWidth = '600px';

    // 0. Header (Account Selector & Settings)
    const header = document.createElement('div');
    header.style.marginBottom = 'var(--spacing-md)';

    // Title
    const title = document.createElement('h2');
    title.textContent = 'Dashboard 1.0';
    title.style.margin = '0';
    title.style.marginRight = 'var(--spacing-md)';

    // Settings Button
    const settingsBtn = document.createElement('button');
    settingsBtn.innerHTML = '⚙️';
    settingsBtn.className = 'btn btn-ghost';
    settingsBtn.style.fontSize = '1.5rem';
    settingsBtn.style.padding = 'var(--spacing-xs)';
    settingsBtn.style.border = 'none';
    settingsBtn.title = 'Settings';
    settingsBtn.addEventListener('click', () => Router.navigate('settings'));

    // Group Title and Selector for easier layout
    header.innerHTML = '';
    header.style.flexDirection = 'column';
    header.style.alignItems = 'stretch';
    header.style.gap = 'var(--spacing-md)';

    const topRow = document.createElement('div');
    topRow.style.display = 'flex';
    topRow.style.justifyContent = 'space-between';
    topRow.style.alignItems = 'center';

    topRow.appendChild(title);
    topRow.appendChild(settingsBtn);

    header.appendChild(topRow);

    // Account Selector Definition
    const leftHeader = document.createElement('div');
    // leftHeader.style.flex = '1'; // No longer needed

    const accountSelect = document.createElement('select');
    accountSelect.style.padding = 'var(--spacing-sm) var(--spacing-md)';
    accountSelect.style.borderRadius = 'var(--radius-md)';
    accountSelect.style.background = 'var(--color-surface)';
    accountSelect.style.color = 'var(--color-text-main)';
    accountSelect.style.border = '1px solid var(--color-border)';
    accountSelect.style.fontSize = '1rem';
    accountSelect.style.cursor = 'pointer';
    accountSelect.style.outline = 'none';
    accountSelect.style.minWidth = '150px';
    accountSelect.style.appearance = 'auto';
    accountSelect.className = 'input-select';

    // Account Options Logic
    let currentFilter = 'all'; // Re-added variable
    const accounts = StorageService.getAccounts();
    // const defaultAccount = StorageService.getDefaultAccount(); // Unused

    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = 'All Accounts';
    allOption.selected = true;
    accountSelect.appendChild(allOption);

    accounts.forEach(acc => {
        const opt = document.createElement('option');
        opt.value = acc.id;
        opt.textContent = acc.name;
        accountSelect.appendChild(opt);
    });

    // Make selector full width
    accountSelect.style.width = '100%';
    leftHeader.appendChild(accountSelect);

    header.appendChild(leftHeader);

    container.appendChild(header);

    // Filter Logic - Already initialized above logic, but need to remove this line if it re-declares
    // let currentFilter = accountSelect.value; <-- REMOVE THIS LINE

    // Main Content Wrapper to allow re-rendering
    const content = document.createElement('div');
    container.appendChild(content);

    const renderDashboard = () => {
        content.innerHTML = ''; // Clear prev content

        const allTransactions = StorageService.getAll();

        // Filter Transactions
        const transactions = allTransactions.filter(t => {
            if (currentFilter === 'all') return true;
            return t.accountId === currentFilter || t.toAccountId === currentFilter;
        }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const dateFormat = StorageService.getSetting('dateFormat') || 'US';

        const formatDate = (isoString) => {
            const d = new Date(isoString);
            if (dateFormat === 'ISO') return d.toISOString().split('T')[0];
            if (dateFormat === 'EU') return d.toLocaleDateString('en-GB');
            return d.toLocaleDateString('en-US');
        };

        // Calculate Totals (Respecting Filter)
        let totalIncome = 0;
        let totalExpense = 0;

        transactions.forEach(t => {
            // Logic differs if viewing "All" vs Specific Account due to transfers
            if (currentFilter === 'all') {
                if (t.type === 'income') totalIncome += t.amount;
                if (t.type === 'expense') totalExpense += t.amount;
                if (t.type === 'refund') totalExpense -= t.amount;
                // Transfers cancel out in "All" view (money moved, not lost/gained)
            } else {
                // Specific Account View
                const isSource = t.accountId === currentFilter;
                const isDest = t.toAccountId === currentFilter;

                if (t.type === 'income' && isSource) totalIncome += t.amount;
                if (t.type === 'expense' && isSource) totalExpense += t.amount;
                if (t.type === 'refund' && isSource) totalExpense -= t.amount;

                if (t.type === 'transfer') {
                    if (isSource) totalExpense += t.amount; // Money leaving
                    if (isDest) totalIncome += t.amount;   // Money entering
                }
            }
        });

        const availableBalance = totalIncome - totalExpense;

        // 2. Statistics Cards - Mobile-optimized layout
        const statsContainer = document.createElement('div');
        statsContainer.className = 'dashboard-stats-container';
        statsContainer.style.display = 'grid';
        statsContainer.style.gap = 'var(--spacing-md)';
        statsContainer.style.marginBottom = 'var(--spacing-xl)';

        // Mobile-first responsive grid: single column on mobile, multi-column on larger screens
        statsContainer.style.gridTemplateColumns = '1fr'; // Single column on mobile

        // Add responsive behavior via media query classes
        if (window.innerWidth >= 768) {
            statsContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(250px, 1fr))';
        }

        // Listen for resize events to maintain responsive behavior
        const updateResponsiveLayout = () => {
            const isMobile = window.innerWidth < 768;

            // Update stats container layout
            if (isMobile) {
                statsContainer.style.gridTemplateColumns = '1fr';
            } else {
                statsContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(250px, 1fr))';
            }

            // Update typography for all existing elements
            const statLabels = container.querySelectorAll('.dashboard-stat-label');
            const statValues = container.querySelectorAll('.dashboard-stat-value');
            const transactionTitle = container.querySelector('.dashboard-transactions-title');
            const transactionList = container.querySelector('.dashboard-transactions-list');
            const transactionCategories = container.querySelectorAll('.transaction-item-category');
            const transactionDates = container.querySelectorAll('.transaction-item-date');
            const transactionValues = container.querySelectorAll('.transaction-item-value');

            statLabels.forEach(label => {
                label.style.fontSize = isMobile ? 'var(--font-size-sm)' : '0.875rem';
            });

            statValues.forEach(value => {
                value.style.fontSize = isMobile ? 'var(--font-size-2xl)' : '1.75rem';
            });

            if (transactionTitle) {
                transactionTitle.style.fontSize = isMobile ? 'var(--font-size-xl)' : 'var(--font-size-2xl)';
            }

            // Transaction list height is now calculated dynamically by calculateMaxHeight
            // No fixed height assignment needed here

            transactionCategories.forEach(cat => {
                cat.style.fontSize = isMobile ? 'var(--font-size-base)' : 'var(--font-size-sm)';
            });

            transactionDates.forEach(date => {
                date.style.fontSize = isMobile ? 'var(--font-size-sm)' : '0.75rem';
            });

            transactionValues.forEach(val => {
                val.style.fontSize = isMobile ? 'var(--font-size-lg)' : 'var(--font-size-base)';
            });
        };

        // Debounced resize handler for better performance
        let resizeTimeout;
        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(updateResponsiveLayout, 150);
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', () => {
            // Delay to allow orientation change to complete
            setTimeout(updateResponsiveLayout, 300);
        });

        const createCard = (label, value, color) => {
            const card = document.createElement('div');
            card.className = 'card dashboard-stat-card';
            card.style.textAlign = 'left';
            card.style.padding = 'var(--spacing-lg)';

            // Enhanced mobile touch target
            card.style.minHeight = 'var(--touch-target-min)';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.justifyContent = 'center';

            const lbl = document.createElement('p');
            lbl.textContent = label;
            lbl.className = 'dashboard-stat-label';
            // Mobile-optimized typography
            lbl.style.fontSize = window.innerWidth < 768 ? 'var(--font-size-sm)' : '0.875rem';
            lbl.style.marginBottom = 'var(--spacing-xs)';
            lbl.style.color = 'var(--color-text-muted)';
            lbl.style.lineHeight = 'var(--line-height-normal)';
            lbl.style.fontWeight = '500';

            const val = document.createElement('h2');
            val.textContent = `$${value.toFixed(2)}`;
            val.className = 'dashboard-stat-value';
            val.style.color = color;
            val.style.margin = 0;
            // Responsive font sizing for better mobile readability
            val.style.fontSize = window.innerWidth < 768 ? 'var(--font-size-2xl)' : '1.75rem';
            val.style.lineHeight = 'var(--line-height-tight)';
            val.style.fontWeight = '700';

            card.appendChild(lbl);
            card.appendChild(val);
            return card;
        };

        statsContainer.appendChild(createCard('Total Available', availableBalance, 'var(--color-primary-light)'));
        statsContainer.appendChild(createCard('Total Spent', totalExpense, '#ef4444'));

        content.appendChild(statsContainer);

        // 3. Action Button
        // Pass current account ID if filtered, so AddView knows which account to pre-select
        const addBtn = Button({
            text: '+ Add Transaction',
            onClick: () => {
                // If "All Accounts" is selected, let AddView use default. 
                // If specific account, pass it.
                if (currentFilter !== 'all') {
                    // We might need to update Router to pass query params, or just store in state
                    // For now, simpler to just navigate. AddView defaults to DefaultAccount.
                    // Ideally we'd pass ?accountId=xyz
                }
                Router.navigate('add-expense');
            },
            variant: 'primary'
        });
        addBtn.style.width = '100%';
        addBtn.style.marginBottom = 'var(--spacing-xl)';
        content.appendChild(addBtn);

        // 4. Recent Transactions - Mobile-optimized
        const listContainer = document.createElement('div');
        listContainer.className = 'dashboard-transactions-container';

        const listTitle = document.createElement('h3');
        listTitle.textContent = 'Recent Transactions';
        listTitle.className = 'dashboard-transactions-title';
        listTitle.style.marginBottom = 'var(--spacing-md)';
        listTitle.style.textAlign = 'left';
        // Mobile-optimized typography
        listTitle.style.fontSize = window.innerWidth < 768 ? 'var(--font-size-xl)' : 'var(--font-size-2xl)';
        listTitle.style.lineHeight = 'var(--line-height-tight)';
        listTitle.style.fontWeight = '600';

        listContainer.appendChild(listTitle);

        if (transactions.length === 0) {
            const emptyState = document.createElement('p');
            emptyState.textContent = 'No transactions yet.';
            emptyState.style.color = 'var(--color-text-muted)';
            listContainer.appendChild(emptyState);
        } else {
            const list = document.createElement('ul');
            list.className = 'dashboard-transactions-list';
            list.style.listStyle = 'none';
            list.style.padding = 0;

            // Dynamic height calculation to prevent main view scrolling
            const calculateMaxHeight = () => {
                // Get viewport height
                const viewportHeight = window.visualViewport?.height || window.innerHeight;

                // Calculate used space: header, stats, button, title, margins
                const containerRect = container.getBoundingClientRect();
                const listTitleRect = listTitle.getBoundingClientRect();

                // Space taken by elements above the list
                const usedSpace = listTitleRect.bottom - containerRect.top;

                // Mobile navigation height (if present)
                const mobileNav = document.querySelector('.mobile-nav');
                const mobileNavHeight = mobileNav ? mobileNav.offsetHeight : 0;

                // Calculate available space with some padding for comfort
                const padding = 40; // Extra padding for breathing room
                const availableHeight = viewportHeight - usedSpace - mobileNavHeight - padding;

                // Ensure reasonable min/max bounds
                const minHeight = 200; // Minimum height to show at least a few transactions
                const maxHeight = Math.max(minHeight, availableHeight);

                return `${maxHeight}px`;
            };

            // Set initial height
            list.style.maxHeight = calculateMaxHeight();
            list.style.overflowY = 'auto';
            list.style.borderTop = '1px solid var(--color-surface-hover)';

            // Enhanced mobile scrolling performance
            list.style.webkitOverflowScrolling = 'touch';
            list.style.scrollBehavior = 'smooth';
            list.style.overscrollBehavior = 'contain';

            // Optimize for mobile performance
            list.style.willChange = 'scroll-position';
            list.style.transform = 'translateZ(0)'; // Force hardware acceleration

            // Update height on resize or orientation change
            const updateListHeight = () => {
                requestAnimationFrame(() => {
                    list.style.maxHeight = calculateMaxHeight();
                });
            };

            window.addEventListener('resize', updateListHeight);
            window.addEventListener('orientationchange', () => {
                setTimeout(updateListHeight, 300); // Delay for orientation change completion
            });

            // Recalculate after content loads (delayed)
            setTimeout(updateListHeight, 100);

            transactions.forEach(t => {
                const item = document.createElement('li');
                item.className = 'transaction-item';
                item.style.display = 'flex';
                item.style.justifyContent = 'space-between';
                item.style.padding = 'var(--spacing-md)';
                item.style.borderBottom = '1px solid var(--color-surface-hover)';
                item.style.cursor = 'pointer';
                item.style.minHeight = 'var(--touch-target-min)';
                item.style.alignItems = 'center';

                // Touch feedback for transaction items
                item.addEventListener('touchstart', (e) => {
                    item.style.backgroundColor = 'var(--color-surface-hover)';
                    item.style.transform = 'scale(0.98)';
                }, { passive: true });

                item.addEventListener('touchend', () => {
                    item.style.backgroundColor = 'transparent';
                    item.style.transform = 'scale(1)';
                }, { passive: true });

                item.addEventListener('touchcancel', () => {
                    item.style.backgroundColor = 'transparent';
                    item.style.transform = 'scale(1)';
                }, { passive: true });

                item.addEventListener('click', () => {
                    Router.navigate('edit-expense', { id: t.id });
                });

                const info = document.createElement('div');
                info.className = 'transaction-item-info';
                info.style.display = 'flex';
                info.style.flexDirection = 'column';
                info.style.alignItems = 'flex-start';
                info.style.gap = window.innerWidth < 768 ? 'var(--spacing-xs)' : '2px';
                info.style.textAlign = 'left';
                info.style.flex = '1';
                info.style.minWidth = '0'; // Allow text truncation

                const cat = document.createElement('div');

                // Special Display for Transfers
                if (t.type === 'transfer') {
                    const params = StorageService.getAccounts();
                    const getAccName = (id) => params.find(a => a.id === id)?.name || 'Unknown';

                    if (currentFilter === 'all') {
                        cat.textContent = `Transfer: ${getAccName(t.accountId)} → ${getAccName(t.toAccountId)}`;
                    } else if (t.accountId === currentFilter) {
                        cat.textContent = `Transfer to ${getAccName(t.toAccountId)}`;
                    } else {
                        cat.textContent = `Transfer from ${getAccName(t.accountId)}`;
                    }
                } else {
                    cat.textContent = t.category;
                }

                cat.className = 'transaction-item-category';
                cat.style.fontWeight = '500';
                // Mobile-optimized typography
                cat.style.fontSize = window.innerWidth < 768 ? 'var(--font-size-base)' : 'var(--font-size-sm)';
                cat.style.lineHeight = 'var(--line-height-normal)';
                cat.style.color = 'var(--color-text-main)';
                cat.style.overflow = 'hidden';
                cat.style.textOverflow = 'ellipsis';
                cat.style.whiteSpace = 'nowrap';

                const date = document.createElement('div');
                date.textContent = formatDate(t.timestamp);
                date.className = 'transaction-item-date';
                // Mobile-optimized typography
                date.style.fontSize = window.innerWidth < 768 ? 'var(--font-size-sm)' : '0.75rem';
                date.style.color = 'var(--color-text-muted)';
                date.style.display = 'flex';
                date.style.gap = 'var(--spacing-sm)';
                date.style.lineHeight = 'var(--line-height-normal)';
                date.style.alignItems = 'center';

                // Show Account Name if not transfer (transfer shows context in title)
                if (t.type !== 'transfer') {
                    const accName = accounts.find(a => a.id === t.accountId)?.name || 'Unknown';
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

                if (t.type === 'income' || t.type === 'refund') {
                    isPositive = true;
                    color = '#10b981';
                } else if (t.type === 'transfer') {
                    // If viewing specific account:
                    if (currentFilter !== 'all') {
                        if (t.toAccountId === currentFilter) { // Incoming transfer
                            isPositive = true;
                            color = '#10b981';
                        } else { // Outgoing transfer
                            isPositive = false;
                            color = 'inherit'; // or red?
                        }
                    } else {
                        // In All view, transfer doesn't change net worth, maybe neutral?
                        isPositive = true; // Technically neutral, but let's just show amount
                        color = 'var(--color-text-muted)';
                    }
                }

                // Append sign
                let sign = isPositive ? '+' : '-';
                if (t.type === 'transfer' && currentFilter === 'all') sign = ''; // Neutral

                val.textContent = `${sign}$${Math.abs(t.amount).toFixed(2)}`;
                val.className = 'transaction-item-value';
                val.style.fontWeight = '600';
                val.style.color = color;
                // Mobile-optimized typography
                val.style.fontSize = window.innerWidth < 768 ? 'var(--font-size-lg)' : 'var(--font-size-base)';
                val.style.lineHeight = 'var(--line-height-tight)';
                val.style.textAlign = 'right';
                val.style.flexShrink = '0';

                item.appendChild(info);
                item.appendChild(val);
                list.appendChild(item);
            });
            listContainer.appendChild(list);
        }

        content.appendChild(listContainer);
    };

    renderDashboard();

    accountSelect.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        renderDashboard();
    });

    // Cleanup function for event listeners (called when component unmounts)
    container.cleanup = () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', updateResponsiveLayout);
    };

    return container;
};
