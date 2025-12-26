import { Button } from '../components/Button.js';
import { DashboardStatsCard } from '../components/DashboardStatsCard.js';
import { TransactionList } from '../components/TransactionList.js';
import { StorageService } from '../core/storage.js';
import { AuthService } from '../core/auth-service.js';
import { Router } from '../core/router.js';
import { COLORS, SPACING, BREAKPOINTS, DIMENSIONS, TIMING, STORAGE_KEYS } from '../utils/constants.js';
import { debounce } from '../utils/touch-utils.js';
import { getTransactionToHighlight } from '../utils/success-feedback.js';

export const DashboardView = () => {
    const container = document.createElement('div');
    container.className = 'view-dashboard';
    container.style.width = '100%';
    container.style.maxWidth = DIMENSIONS.CONTAINER_MAX_WIDTH;
    container.style.height = '100%';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.overflow = 'hidden'; // Prevent dashboard from scrolling

    // Header (Account Selector & Settings)
    const header = document.createElement('div');
    header.style.marginBottom = SPACING.MD;
    header.style.flexShrink = '0'; // Prevent header from shrinking

    // Title
    const title = document.createElement('h2');
    const updateTitle = (userObj) => {
        const u = userObj || AuthService.user;
        const uName = u ? (u.displayName || u.email) : '';
        title.textContent = `Dashboard 1.7 ${uName ? ` - ${uName}` : ''}`;
    };
    updateTitle();
    title.style.margin = '0';
    title.style.marginRight = SPACING.MD;

    // Settings Button
    const settingsBtn = document.createElement('button');
    settingsBtn.innerHTML = '⚙️';
    settingsBtn.className = 'btn btn-ghost';
    settingsBtn.style.fontSize = '1.5rem';
    settingsBtn.style.padding = SPACING.XS;
    settingsBtn.style.border = 'none';
    settingsBtn.title = 'Settings';
    settingsBtn.addEventListener('click', () => Router.navigate('settings'));

    // Group Title and Selector for easier layout
    header.innerHTML = '';
    header.style.flexDirection = 'column';
    header.style.alignItems = 'stretch';
    header.style.gap = SPACING.MD;

    const topRow = document.createElement('div');
    topRow.style.display = 'flex';
    topRow.style.justifyContent = 'space-between';
    topRow.style.alignItems = 'center';

    topRow.appendChild(title);
    topRow.appendChild(settingsBtn);

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
        width: '100%'
    });
    accountSelect.className = 'input-select';

    // Account Options Logic
    let currentFilter = localStorage.getItem(STORAGE_KEYS.DASHBOARD_FILTER) || 'all';
    const accounts = StorageService.getAccounts();

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
        const accounts = StorageService.getAccounts();
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

    // Main Content Wrapper to allow re-rendering
    const content = document.createElement('div');
    content.style.flex = '1';
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    content.style.minHeight = '0'; // Allow flex child to shrink below content size
    content.style.overflow = 'hidden'; // Prevent content from scrolling
    container.appendChild(content);

    const renderDashboard = () => {
        content.innerHTML = '';

        // Always get fresh data
        const allTransactions = StorageService.getAll();
        const currentAccounts = StorageService.getAccounts();

        // Filter Transactions
        const transactions = allTransactions.filter(t => {
            if (currentFilter === 'all') return true;
            return t.accountId === currentFilter || t.toAccountId === currentFilter;
        }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Calculate Totals (Respecting Filter)
        let totalIncome = 0;
        let totalExpense = 0;

        transactions.forEach(t => {
            if (currentFilter === 'all') {
                if (t.type === 'income') totalIncome += t.amount;
                if (t.type === 'expense') totalExpense += t.amount;
                if (t.type === 'refund') totalExpense -= t.amount;
            } else {
                const isSource = t.accountId === currentFilter;
                const isDest = t.toAccountId === currentFilter;

                if (t.type === 'income' && isSource) totalIncome += t.amount;
                if (t.type === 'expense' && isSource) totalExpense += t.amount;
                if (t.type === 'refund' && isSource) totalExpense -= t.amount;

                if (t.type === 'transfer') {
                    if (isSource) totalExpense += t.amount;
                    if (isDest) totalIncome += t.amount;
                }
            }
        });

        const availableBalance = totalIncome - totalExpense;

        // Statistics Cards Container
        const statsContainer = document.createElement('div');
        statsContainer.className = 'dashboard-stats-container';
        statsContainer.style.flexShrink = '0'; // Prevent stats from shrinking
        const isMobile = window.innerWidth < BREAKPOINTS.MOBILE;
        Object.assign(statsContainer.style, {
            display: 'grid',
            gap: SPACING.MD,
            marginBottom: SPACING.XL,
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(250px, 1fr))'
        });

        statsContainer.appendChild(DashboardStatsCard({
            label: 'Total Available',
            value: availableBalance,
            color: COLORS.PRIMARY_LIGHT
        }));
        statsContainer.appendChild(DashboardStatsCard({
            label: 'Total Spent',
            value: totalExpense,
            color: COLORS.ERROR
        }));

        content.appendChild(statsContainer);

        // Action Button
        const addBtn = Button({
            text: '+ Add Transaction',
            onClick: () => {
                const params = currentFilter !== 'all' ? { accountId: currentFilter } : {};
                Router.navigate('add-expense', params);
            },
            variant: 'primary'
        });
        addBtn.style.width = '100%';
        addBtn.style.marginBottom = SPACING.XL;
        addBtn.style.flexShrink = '0'; // Prevent button from shrinking
        content.appendChild(addBtn);

        // Recent Transactions
        const highlightTransactionId = getTransactionToHighlight();
        const transactionList = TransactionList({
            transactions,
            currentFilter,
            accounts: currentAccounts,
            highlightTransactionId
        });
        content.appendChild(transactionList);
    };

    // Responsive layout updates
    const updateResponsiveLayout = debounce(() => {
        const statsContainer = container.querySelector('.dashboard-stats-container');
        if (!statsContainer) return;
        const isMobileNow = window.innerWidth < BREAKPOINTS.MOBILE;
        statsContainer.style.gridTemplateColumns = isMobileNow ? '1fr 1fr' : 'repeat(auto-fit, minmax(250px, 1fr))';
    }, TIMING.DEBOUNCE_RESIZE);

    window.addEventListener('resize', updateResponsiveLayout);
    window.addEventListener('orientationchange', () => {
        setTimeout(updateResponsiveLayout, TIMING.DEBOUNCE_ORIENTATION);
    });

    renderDashboard();

    const handleStorageUpdate = (e) => {
        console.log(`[Dashboard] Storage updated (${e.detail.key}), re-rendering...`);
        if (e.detail.key === STORAGE_KEYS.ACCOUNTS) {
            refreshAccountOptions();
        }
        renderDashboard();
    };

    const handleAuthChange = (e) => {
        console.log(`[Dashboard] Auth state changed, updating title...`);
        updateTitle(e.detail.user);
    };

    window.addEventListener('storage-updated', handleStorageUpdate);
    window.addEventListener('auth-state-changed', handleAuthChange);

    accountSelect.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        // Use localStorage directly to avoid syncing this preference
        localStorage.setItem(STORAGE_KEYS.DASHBOARD_FILTER, currentFilter);
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
