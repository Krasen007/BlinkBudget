import { Button } from '../components/Button.js';
import { DashboardStatsCard } from '../components/DashboardStatsCard.js';
import { TransactionList } from '../components/TransactionList.js';
import { StorageService } from '../core/storage.js';
import { Router } from '../core/router.js';
import { COLORS, SPACING, BREAKPOINTS, DIMENSIONS, TIMING } from '../utils/constants.js';
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
    title.textContent = 'Dashboard 1.1';
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
    Object.assign(accountSelect.style, {
        padding: `${SPACING.SM} ${SPACING.MD}`,
        borderRadius: 'var(--radius-md)',
        background: COLORS.SURFACE,
        color: COLORS.TEXT_MAIN,
        border: `1px solid ${COLORS.BORDER}`,
        fontSize: '1rem',
        cursor: 'pointer',
        outline: 'none',
        minWidth: '150px',
        appearance: 'auto',
        width: '100%'
    });
    accountSelect.className = 'input-select';

    // Account Options Logic
    let currentFilter = 'all';
    const accounts = StorageService.getAccounts();

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

    leftHeader.appendChild(accountSelect);
    header.appendChild(leftHeader);
    container.appendChild(header);

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

        const allTransactions = StorageService.getAll();

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
            onClick: () => Router.navigate('add-expense'),
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
            accounts,
            highlightTransactionId
        });
        content.appendChild(transactionList);

        // Responsive layout updates
        const updateResponsiveLayout = debounce(() => {
            const isMobileNow = window.innerWidth < BREAKPOINTS.MOBILE;
            statsContainer.style.gridTemplateColumns = isMobileNow ? '1fr 1fr' : 'repeat(auto-fit, minmax(250px, 1fr))';
        }, TIMING.DEBOUNCE_RESIZE);

        window.addEventListener('resize', updateResponsiveLayout);
        window.addEventListener('orientationchange', () => {
            setTimeout(updateResponsiveLayout, TIMING.DEBOUNCE_ORIENTATION);
        });
    };

    renderDashboard();

    accountSelect.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        renderDashboard();
    });

    // Cleanup function for event listeners
    container.cleanup = () => {
        window.removeEventListener('resize', updateResponsiveLayout);
        window.removeEventListener('orientationchange', updateResponsiveLayout);
    };

    return container;
};
