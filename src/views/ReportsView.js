/**
 * Reports View - Beautiful Reports & Insights
 * 
 * Main view component for displaying financial analytics and insights.
 * Provides interactive charts, time period selection, and actionable insights.
 * 
 * Requirements: 7.5, 1.6, 5.5
 */

import { AnalyticsEngine } from '../core/analytics-engine.js';
import { ChartRenderer } from '../components/ChartRenderer.js';
import { ProgressiveDataLoader } from '../core/progressive-data-loader.js';
import { preloadChartJS } from '../core/chart-loader.js';
import { TimePeriodSelector } from '../components/TimePeriodSelector.js';
import { Button } from '../components/Button.js';
import { StorageService } from '../core/storage.js';
import { Router } from '../core/router.js';
import { NavigationState } from '../core/navigation-state.js';
import { COLORS, SPACING, BREAKPOINTS, DIMENSIONS, TIMING } from '../utils/constants.js';
import { debounce } from '../utils/touch-utils.js';
import { getChartColors } from '../core/chart-config.js';

export const ReportsView = () => {
    const container = document.createElement('div');
    container.className = 'view-reports';
    container.style.width = '100%';
    container.style.maxWidth = DIMENSIONS.CONTAINER_MAX_WIDTH;
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.padding = `0 ${SPACING.MD}`;
    // Remove height and overflow styles - let CSS handle it

    // Global error boundary for the entire reports view
    let hasGlobalError = false;
    const handleGlobalError = (error, context = 'Unknown') => {
        console.error(`[ReportsView] Global error in ${context}:`, error);
        hasGlobalError = true;
        
        // Show user-friendly error message
        showErrorState(`Something went wrong while ${context.toLowerCase()}. Please try refreshing the page.`);
        
        // Track error for debugging
        if (typeof window.gtag === 'function') {
            window.gtag('event', 'exception', {
                description: `ReportsView: ${context} - ${error.message}`,
                fatal: false
            });
        }
    };

    // Set up global error handlers
    const originalOnError = window.onerror;
    const originalOnUnhandledRejection = window.onunhandledrejection;
    
    window.onerror = (message, source, lineno, colno, error) => {
        if (source && source.includes('ReportsView')) {
            handleGlobalError(error || new Error(message), 'JavaScript execution');
            return true; // Prevent default browser error handling
        }
        return originalOnError ? originalOnError(message, source, lineno, colno, error) : false;
    };
    
    window.onunhandledrejection = (event) => {
        if (event.reason && event.reason.stack && event.reason.stack.includes('ReportsView')) {
            handleGlobalError(event.reason, 'Promise rejection');
            event.preventDefault(); // Prevent default browser error handling
        } else if (originalOnUnhandledRejection) {
            originalOnUnhandledRejection(event);
        }
    };

    // Initialize analytics engine, chart renderer, and progressive data loader
    const analyticsEngine = new AnalyticsEngine();
    const chartRenderer = new ChartRenderer();
    const progressiveLoader = new ProgressiveDataLoader();

    // Browser compatibility checks and graceful degradation
    const browserSupport = checkBrowserSupport();
    if (!browserSupport.isSupported) {
        showUnsupportedBrowserError(browserSupport.missingFeatures);
        return container;
    }

    // Warn about limited functionality on older browsers
    if (browserSupport.hasLimitedSupport) {
        showBrowserWarning(browserSupport.limitedFeatures);
    }

    /**
     * Show unsupported browser error
     */
    function showUnsupportedBrowserError(missingFeatures) {
        const errorContainer = document.createElement('div');
        errorContainer.style.display = 'flex';
        errorContainer.style.flexDirection = 'column';
        errorContainer.style.alignItems = 'center';
        errorContainer.style.justifyContent = 'center';
        errorContainer.style.height = '100vh';
        errorContainer.style.padding = SPACING.XL;
        errorContainer.style.textAlign = 'center';
        errorContainer.style.background = COLORS.SURFACE;

        const icon = document.createElement('div');
        icon.innerHTML = '🌐';
        icon.style.fontSize = '4rem';
        icon.style.marginBottom = SPACING.LG;

        const title = document.createElement('h2');
        title.textContent = 'Browser Not Supported';
        title.style.color = COLORS.ERROR;
        title.style.marginBottom = SPACING.MD;

        const message = document.createElement('p');
        message.innerHTML = `
            Your browser doesn't support some features required for BlinkBudget Reports.<br>
            Please update your browser or try a different one.
        `;
        message.style.color = COLORS.TEXT_MUTED;
        message.style.lineHeight = '1.6';
        message.style.marginBottom = SPACING.LG;

        const featuresList = document.createElement('div');
        featuresList.innerHTML = `
            <strong>Missing features:</strong><br>
            ${missingFeatures.join(', ')}
        `;
        featuresList.style.fontSize = '0.875rem';
        featuresList.style.color = COLORS.TEXT_MUTED;
        featuresList.style.marginBottom = SPACING.LG;

        const recommendedBrowsers = document.createElement('div');
        recommendedBrowsers.innerHTML = `
            <strong>Recommended browsers:</strong><br>
            Chrome 70+, Firefox 65+, Safari 12+, Edge 79+
        `;
        recommendedBrowsers.style.fontSize = '0.875rem';
        recommendedBrowsers.style.color = COLORS.TEXT_MUTED;

        errorContainer.appendChild(icon);
        errorContainer.appendChild(title);
        errorContainer.appendChild(message);
        errorContainer.appendChild(featuresList);
        errorContainer.appendChild(recommendedBrowsers);

        container.appendChild(errorContainer);
    }

    /**
     * Show browser warning for limited functionality
     */
    function showBrowserWarning(limitedFeatures) {
        const warning = document.createElement('div');
        warning.style.background = 'rgba(251, 191, 36, 0.1)';
        warning.style.border = '1px solid rgba(251, 191, 36, 0.3)';
        warning.style.borderRadius = 'var(--radius-md)';
        warning.style.padding = SPACING.MD;
        warning.style.margin = `${SPACING.MD} 0`;
        warning.style.fontSize = '0.875rem';
        warning.style.color = '#92400e';

        warning.innerHTML = `
            ⚠️ <strong>Limited Browser Support:</strong> 
            Some advanced features may not work properly. 
            Missing: ${limitedFeatures.join(', ')}
        `;

        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.float = 'right';
        closeBtn.style.background = 'none';
        closeBtn.style.border = 'none';
        closeBtn.style.fontSize = '1.2rem';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.color = '#92400e';
        closeBtn.addEventListener('click', () => warning.remove());

        warning.appendChild(closeBtn);
        container.appendChild(warning);
    }

    /**
     * Create minimal analytics data as last resort fallback
     */
    function createMinimalAnalyticsData(transactions, timePeriod) {
        const filteredTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date || t.timestamp);
            const startDate = new Date(timePeriod.startDate);
            const endDate = new Date(timePeriod.endDate);
            return transactionDate >= startDate && transactionDate <= endDate;
        });

        let totalIncome = 0;
        let totalExpenses = 0;

        filteredTransactions.forEach(t => {
            const amount = Math.abs(t.amount || 0);
            if (t.type === 'income') {
                totalIncome += amount;
            } else {
                totalExpenses += amount;
            }
        });

        return {
            transactions: filteredTransactions,
            categoryBreakdown: {
                categories: [{
                    name: 'All Expenses',
                    amount: totalExpenses,
                    percentage: 100,
                    transactionCount: filteredTransactions.filter(t => t.type !== 'income').length
                }],
                totalAmount: totalExpenses,
                transactionCount: filteredTransactions.filter(t => t.type !== 'income').length
            },
            incomeVsExpenses: {
                totalIncome,
                totalExpenses,
                netBalance: totalIncome - totalExpenses,
                timePeriod
            },
            costOfLiving: {
                totalExpenditure: totalExpenses,
                dailySpending: totalExpenses / 30,
                timePeriod
            },
            isMinimal: true
        };
    }

    /**
     * Validate analytics data structure
     */
    function validateAnalyticsData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Analytics data is not an object');
        }

        if (!Array.isArray(data.transactions)) {
            throw new Error('Analytics data missing transactions array');
        }

        if (!data.categoryBreakdown || !Array.isArray(data.categoryBreakdown.categories)) {
            throw new Error('Analytics data missing category breakdown');
        }

        if (!data.incomeVsExpenses || typeof data.incomeVsExpenses.totalIncome !== 'number') {
            throw new Error('Analytics data missing income vs expenses');
        }

        // Check for NaN values
        const numericFields = [
            data.incomeVsExpenses.totalIncome,
            data.incomeVsExpenses.totalExpenses,
            data.incomeVsExpenses.netBalance
        ];

        if (numericFields.some(field => isNaN(field))) {
            throw new Error('Analytics data contains invalid numeric values');
        }
    }

    /**
     * Sanitize analytics data to fix common issues
     */
    function sanitizeAnalyticsData(data) {
        // Create a deep copy to avoid modifying original
        const sanitized = JSON.parse(JSON.stringify(data));

        // Fix NaN values
        if (isNaN(sanitized.incomeVsExpenses.totalIncome)) {
            sanitized.incomeVsExpenses.totalIncome = 0;
        }
        if (isNaN(sanitized.incomeVsExpenses.totalExpenses)) {
            sanitized.incomeVsExpenses.totalExpenses = 0;
        }
        if (isNaN(sanitized.incomeVsExpenses.netBalance)) {
            sanitized.incomeVsExpenses.netBalance = sanitized.incomeVsExpenses.totalIncome - sanitized.incomeVsExpenses.totalExpenses;
        }

        // Fix category breakdown
        if (!sanitized.categoryBreakdown.categories) {
            sanitized.categoryBreakdown.categories = [];
        }

        sanitized.categoryBreakdown.categories = sanitized.categoryBreakdown.categories.filter(cat => 
            cat && typeof cat.amount === 'number' && !isNaN(cat.amount)
        );

        return sanitized;
    }

    /**
     * Show performance warning to user
     */
    function showPerformanceWarning(processingTime) {
        const warning = document.createElement('div');
        warning.style.background = 'rgba(251, 191, 36, 0.1)';
        warning.style.border = '1px solid rgba(251, 191, 36, 0.3)';
        warning.style.borderRadius = 'var(--radius-md)';
        warning.style.padding = SPACING.MD;
        warning.style.margin = `${SPACING.MD} 0`;
        warning.style.fontSize = '0.875rem';
        warning.style.color = '#92400e';

        warning.innerHTML = `
            ⏱️ <strong>Performance Notice:</strong> 
            Report loading took ${(processingTime / 1000).toFixed(1)} seconds. 
            Consider reducing the time period or clearing old data for better performance.
        `;

        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.float = 'right';
        closeBtn.style.background = 'none';
        closeBtn.style.border = 'none';
        closeBtn.style.fontSize = '1.2rem';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.color = '#92400e';
        closeBtn.addEventListener('click', () => warning.remove());

        warning.appendChild(closeBtn);
        
        // Insert after header
        const header = container.querySelector('.reports-header');
        if (header && header.nextSibling) {
            container.insertBefore(warning, header.nextSibling);
        } else {
            container.appendChild(warning);
        }

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (warning.parentNode) {
                warning.remove();
            }
        }, 10000);
    }

    /**
     * Create fallback category display when chart rendering fails
     */
    function createFallbackCategoryDisplay() {
        const section = document.createElement('div');
        section.className = 'fallback-category-section';
        section.style.background = COLORS.SURFACE;
        section.style.borderRadius = 'var(--radius-lg)';
        section.style.border = `1px solid ${COLORS.BORDER}`;
        section.style.padding = SPACING.LG;

        const title = document.createElement('h3');
        title.textContent = 'Spending by Category';
        title.style.margin = `0 0 ${SPACING.MD} 0`;
        title.style.color = COLORS.TEXT_MAIN;
        section.appendChild(title);

        const warning = document.createElement('div');
        warning.textContent = '⚠️ Chart view unavailable - showing table format';
        warning.style.fontSize = '0.875rem';
        warning.style.color = COLORS.TEXT_MUTED;
        warning.style.marginBottom = SPACING.MD;
        section.appendChild(warning);

        // Create table
        const table = document.createElement('div');
        table.style.display = 'grid';
        table.style.gridTemplateColumns = '1fr auto auto';
        table.style.gap = SPACING.SM;
        table.style.alignItems = 'center';

        // Header
        const headers = ['Category', 'Amount', 'Percentage'];
        headers.forEach(header => {
            const headerEl = document.createElement('div');
            headerEl.textContent = header;
            headerEl.style.fontWeight = 'bold';
            headerEl.style.color = COLORS.TEXT_MAIN;
            headerEl.style.padding = SPACING.SM;
            headerEl.style.borderBottom = `1px solid ${COLORS.BORDER}`;
            table.appendChild(headerEl);
        });

        // Data rows
        currentData.categoryBreakdown.categories.forEach(category => {
            const nameEl = document.createElement('div');
            nameEl.textContent = category.name;
            nameEl.style.padding = SPACING.SM;
            nameEl.style.color = COLORS.TEXT_MAIN;

            const amountEl = document.createElement('div');
            amountEl.textContent = `€${category.amount.toFixed(2)}`;
            amountEl.style.padding = SPACING.SM;
            amountEl.style.color = COLORS.TEXT_MAIN;
            amountEl.style.textAlign = 'right';

            const percentageEl = document.createElement('div');
            percentageEl.textContent = `${category.percentage.toFixed(1)}%`;
            percentageEl.style.padding = SPACING.SM;
            percentageEl.style.color = COLORS.TEXT_MUTED;
            percentageEl.style.textAlign = 'right';

            table.appendChild(nameEl);
            table.appendChild(amountEl);
            table.appendChild(percentageEl);
        });

        section.appendChild(table);
        return section;
    }

    /**
     * Create fallback income/expense display when chart rendering fails
     */
    function createFallbackIncomeExpenseDisplay() {
        const section = document.createElement('div');
        section.className = 'fallback-income-expense-section';
        section.style.background = COLORS.SURFACE;
        section.style.borderRadius = 'var(--radius-lg)';
        section.style.border = `1px solid ${COLORS.BORDER}`;
        section.style.padding = SPACING.LG;

        const title = document.createElement('h3');
        title.textContent = 'Income vs Expenses';
        title.style.margin = `0 0 ${SPACING.MD} 0`;
        title.style.color = COLORS.TEXT_MAIN;
        section.appendChild(title);

        const warning = document.createElement('div');
        warning.textContent = '⚠️ Chart view unavailable - showing summary format';
        warning.style.fontSize = '0.875rem';
        warning.style.color = COLORS.TEXT_MUTED;
        warning.style.marginBottom = SPACING.MD;
        section.appendChild(warning);

        const summaryGrid = document.createElement('div');
        summaryGrid.style.display = 'grid';
        summaryGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(150px, 1fr))';
        summaryGrid.style.gap = SPACING.MD;

        const incomeCard = document.createElement('div');
        incomeCard.style.padding = SPACING.MD;
        incomeCard.style.background = 'rgba(34, 197, 94, 0.1)';
        incomeCard.style.borderRadius = 'var(--radius-md)';
        incomeCard.style.textAlign = 'center';
        incomeCard.innerHTML = `
            <div style="font-size: 0.875rem; color: ${COLORS.TEXT_MUTED}; margin-bottom: ${SPACING.XS};">Total Income</div>
            <div style="font-size: 1.5rem; font-weight: bold; color: ${COLORS.SUCCESS};">€${currentData.incomeVsExpenses.totalIncome.toFixed(2)}</div>
        `;

        const expenseCard = document.createElement('div');
        expenseCard.style.padding = SPACING.MD;
        expenseCard.style.background = 'rgba(239, 68, 68, 0.1)';
        expenseCard.style.borderRadius = 'var(--radius-md)';
        expenseCard.style.textAlign = 'center';
        expenseCard.innerHTML = `
            <div style="font-size: 0.875rem; color: ${COLORS.TEXT_MUTED}; margin-bottom: ${SPACING.XS};">Total Expenses</div>
            <div style="font-size: 1.5rem; font-weight: bold; color: ${COLORS.ERROR};">€${currentData.incomeVsExpenses.totalExpenses.toFixed(2)}</div>
        `;

        const balanceCard = document.createElement('div');
        const isPositive = currentData.incomeVsExpenses.netBalance >= 0;
        balanceCard.style.padding = SPACING.MD;
        balanceCard.style.background = isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
        balanceCard.style.borderRadius = 'var(--radius-md)';
        balanceCard.style.textAlign = 'center';
        balanceCard.innerHTML = `
            <div style="font-size: 0.875rem; color: ${COLORS.TEXT_MUTED}; margin-bottom: ${SPACING.XS};">Net Balance</div>
            <div style="font-size: 1.5rem; font-weight: bold; color: ${isPositive ? COLORS.SUCCESS : COLORS.ERROR};">€${currentData.incomeVsExpenses.netBalance.toFixed(2)}</div>
        `;

        summaryGrid.appendChild(incomeCard);
        summaryGrid.appendChild(expenseCard);
        summaryGrid.appendChild(balanceCard);
        section.appendChild(summaryGrid);

        return section;
    }

    /**
     * Show warning when some charts fail to render
     */
    function showChartRenderingWarning(failedCharts) {
        const warning = document.createElement('div');
        warning.style.background = 'rgba(239, 68, 68, 0.1)';
        warning.style.border = '1px solid rgba(239, 68, 68, 0.3)';
        warning.style.borderRadius = 'var(--radius-md)';
        warning.style.padding = SPACING.MD;
        warning.style.margin = `${SPACING.MD} 0`;
        warning.style.fontSize = '0.875rem';
        warning.style.color = '#dc2626';

        const failedChartNames = failedCharts.map(chart => chart.name).join(', ');
        warning.innerHTML = `
            ⚠️ <strong>Chart Rendering Issues:</strong> 
            Some charts couldn't be displayed (${failedChartNames}). 
            Fallback displays are shown instead. Try refreshing the page if the issue persists.
        `;

        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.float = 'right';
        closeBtn.style.background = 'none';
        closeBtn.style.border = 'none';
        closeBtn.style.fontSize = '1.2rem';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.color = '#dc2626';
        closeBtn.addEventListener('click', () => warning.remove());

        warning.appendChild(closeBtn);
        
        // Insert at the top of content
        const content = container.querySelector('.reports-content');
        if (content && content.firstChild) {
            content.insertBefore(warning, content.firstChild);
        } else {
            container.appendChild(warning);
        }
    }

    // Preload Chart.js in background for better UX
    preloadChartJS().catch(error => {
        console.warn('[ReportsView] Chart.js preloading failed:', error);
    });

    // State management
    let currentTimePeriod = NavigationState.restoreTimePeriod() || getCurrentMonthPeriod();
    let isLoading = false;
    let currentData = null;
    let activeCharts = new Map(); // Track active chart instances for cleanup
    let timePeriodSelectorComponent = null; // Reference to the time period selector
    let loadingProgress = 0; // Track progressive loading progress
    let categoryColorMap = new Map(); // Store consistent colors for categories

    // Header section
    const header = createHeader();
    container.appendChild(header);

    // Add floating back button for mobile (additional safety measure)
    const floatingBackButton = document.createElement('button');
    floatingBackButton.innerHTML = '←';
    floatingBackButton.className = 'floating-back-btn';
    floatingBackButton.title = 'Back to Dashboard';
    floatingBackButton.style.position = 'fixed';
    floatingBackButton.style.bottom = window.innerWidth < BREAKPOINTS.MOBILE ? '80px' : '20px'; // Above mobile nav if present
    floatingBackButton.style.left = '20px';
    floatingBackButton.style.width = '48px';
    floatingBackButton.style.height = '48px';
    floatingBackButton.style.borderRadius = '50%';
    floatingBackButton.style.background = COLORS.PRIMARY;
    floatingBackButton.style.color = 'white';
    floatingBackButton.style.border = 'none';
    floatingBackButton.style.fontSize = '1.5rem';
    floatingBackButton.style.cursor = 'pointer';
    floatingBackButton.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    floatingBackButton.style.zIndex = '1000';
    floatingBackButton.style.display = 'none'; // Hidden by default
    floatingBackButton.style.transition = 'all 0.3s ease';
    
    floatingBackButton.addEventListener('click', () => Router.navigate('dashboard'));
    
    // Show floating button when scrolled down
    let isFloatingButtonVisible = false;
    const toggleFloatingButton = () => {
        const shouldShow = window.scrollY > 100; // Show after scrolling 100px
        
        if (shouldShow && !isFloatingButtonVisible) {
            floatingBackButton.style.display = 'flex';
            floatingBackButton.style.alignItems = 'center';
            floatingBackButton.style.justifyContent = 'center';
            setTimeout(() => {
                floatingBackButton.style.opacity = '1';
                floatingBackButton.style.transform = 'scale(1)';
            }, 10);
            isFloatingButtonVisible = true;
        } else if (!shouldShow && isFloatingButtonVisible) {
            floatingBackButton.style.opacity = '0';
            floatingBackButton.style.transform = 'scale(0.8)';
            setTimeout(() => {
                floatingBackButton.style.display = 'none';
            }, 300);
            isFloatingButtonVisible = false;
        }
    };
    
    // Initial setup for floating button
    floatingBackButton.style.opacity = '0';
    floatingBackButton.style.transform = 'scale(0.8)';
    
    window.addEventListener('scroll', toggleFloatingButton, { passive: true });
    container.appendChild(floatingBackButton);
    timePeriodSelectorComponent = TimePeriodSelector({
        initialPeriod: currentTimePeriod,
        onChange: handleTimePeriodChange,
        showCustomRange: true,
        className: 'reports-time-selector'
    });
    container.appendChild(timePeriodSelectorComponent);

    // Main content area with proper semantic structure
    const content = document.createElement('main');
    content.className = 'reports-content';
    content.id = 'reports-main-content';
    content.setAttribute('role', 'main');
    content.setAttribute('aria-labelledby', 'reports-title');
    content.style.gap = SPACING.LG;
    // Remove flex and overflow styles - let CSS handle it
    container.appendChild(content);

    // Loading state
    const loadingState = createLoadingState();
    
    // Empty state
    const emptyState = createEmptyState();

    // Error state
    const errorState = createErrorState();

    /**
     * Handle time period changes from the TimePeriodSelector component
     * Requirements: 1.2, 2.5, 7.4
     */
    function handleTimePeriodChange(newTimePeriod) {
        console.log('[ReportsView] Time period changed:', newTimePeriod);
        
        // Validate the new time period
        if (!newTimePeriod || !newTimePeriod.startDate || !newTimePeriod.endDate) {
            console.error('Invalid time period provided:', newTimePeriod);
            return;
        }

        // Update current time period
        const previousPeriod = currentTimePeriod;
        currentTimePeriod = newTimePeriod;

        // Save time period to navigation state for persistence across views
        NavigationState.saveTimePeriod(newTimePeriod);

        // Invalidate relevant cache entries since time period changed
        analyticsEngine.invalidateCache('categoryBreakdown');
        analyticsEngine.invalidateCache('incomeVsExpenses');
        analyticsEngine.invalidateCache('costOfLiving');

        // Reload data with new time period
        loadReportData();

        // Log the change for debugging/analytics
        console.log(`[ReportsView] Time period updated from ${previousPeriod.label || 'Unknown'} to ${newTimePeriod.label || 'Unknown'}`);
    }

    /**
     * Create header with title and navigation
     */
    function createHeader() {
        const headerEl = document.createElement('header');
        headerEl.className = 'reports-header';
        headerEl.setAttribute('role', 'banner');
        headerEl.style.display = 'flex';
        headerEl.style.justifyContent = 'space-between';
        headerEl.style.alignItems = 'center';
        headerEl.style.marginBottom = SPACING.MD;
        headerEl.style.flexShrink = '0';
        headerEl.style.position = 'sticky';
        headerEl.style.top = '0';
        headerEl.style.background = COLORS.BACKGROUND;
        headerEl.style.zIndex = '10';
        headerEl.style.padding = `${SPACING.SM} 0`;

        // Left side - Back button
        const leftSide = document.createElement('div');
        leftSide.style.display = 'flex';
        leftSide.style.alignItems = 'center';
        leftSide.style.gap = SPACING.MD;

        const backButton = Button({
            text: '← Back',
            onClick: () => Router.navigate('dashboard'),
            variant: 'ghost'
        });
        backButton.style.padding = `${SPACING.XS} ${SPACING.SM}`;
        backButton.style.fontSize = '0.875rem';
        backButton.style.flexShrink = '0';
        backButton.title = 'Back to Dashboard (Esc)';

        // Title with proper heading hierarchy
        const title = document.createElement('h1');
        title.textContent = 'Reports & Insights';
        title.style.margin = '0';
        title.style.color = COLORS.TEXT_MAIN;
        title.style.fontSize = window.innerWidth < BREAKPOINTS.MOBILE ? '1.25rem' : '1.5rem';
        title.id = 'reports-title';

        leftSide.appendChild(backButton);
        leftSide.appendChild(title);

        // Right side - keyboard shortcuts info (only show on desktop)
        const rightSide = document.createElement('div');
        rightSide.style.display = 'flex';
        rightSide.style.alignItems = 'center';
        rightSide.style.gap = SPACING.SM;
        
        if (window.innerWidth >= BREAKPOINTS.MOBILE) {
            const shortcutsInfo = document.createElement('div');
            shortcutsInfo.className = 'keyboard-shortcuts-info';
            shortcutsInfo.style.fontSize = '0.75rem';
            shortcutsInfo.style.color = COLORS.TEXT_MUTED;
            shortcutsInfo.style.textAlign = 'right';
            shortcutsInfo.style.lineHeight = '1.2';
            shortcutsInfo.innerHTML = `
                <div>Press <kbd style="background: ${COLORS.SURFACE}; padding: 2px 4px; border-radius: 3px; font-size: 0.7rem;">Esc</kbd> to go back</div>
                <div>Press <kbd style="background: ${COLORS.SURFACE}; padding: 2px 4px; border-radius: 3px; font-size: 0.7rem;">Ctrl+R</kbd> to refresh</div>
            `;
            rightSide.appendChild(shortcutsInfo);
        }
        
        headerEl.appendChild(leftSide);
        headerEl.appendChild(rightSide);

        return headerEl;
    }

    /**
     * Create loading state component with progress indicator
     */
    function createLoadingState() {
        const loadingEl = document.createElement('div');
        loadingEl.className = 'loading-state';
        loadingEl.setAttribute('role', 'status');
        loadingEl.setAttribute('aria-live', 'polite');
        loadingEl.setAttribute('aria-label', 'Loading financial reports');
        loadingEl.style.display = 'none';
        loadingEl.style.flex = '1';
        loadingEl.style.justifyContent = 'center';
        loadingEl.style.alignItems = 'center';
        loadingEl.style.flexDirection = 'column';
        loadingEl.style.gap = SPACING.MD;
        loadingEl.style.color = COLORS.TEXT_MUTED;

        // Loading spinner with accessibility
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.setAttribute('aria-hidden', 'true');
        spinner.style.width = '40px';
        spinner.style.height = '40px';
        spinner.style.border = `3px solid ${COLORS.BORDER}`;
        spinner.style.borderTop = `3px solid ${COLORS.PRIMARY}`;
        spinner.style.borderRadius = '50%';
        
        // Only animate if user doesn't prefer reduced motion
        if (!window.matchMedia || !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            spinner.style.animation = 'spin 1s linear infinite';
        }

        // Add CSS animation for spinner
        if (!document.querySelector('#loading-spinner-styles')) {
            const style = document.createElement('style');
            style.id = 'loading-spinner-styles';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @media (prefers-reduced-motion: reduce) {
                    .loading-spinner {
                        animation: none !important;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        const loadingText = document.createElement('p');
        loadingText.textContent = 'Loading your financial insights...';
        loadingText.style.margin = '0';
        loadingText.style.fontSize = '1rem';
        loadingText.setAttribute('aria-live', 'polite');

        // Progress bar for large datasets
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container';
        progressContainer.style.width = '200px';
        progressContainer.style.height = '4px';
        progressContainer.style.background = COLORS.BORDER;
        progressContainer.style.borderRadius = '2px';
        progressContainer.style.overflow = 'hidden';
        progressContainer.style.display = 'none'; // Hidden by default

        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.style.width = '0%';
        progressBar.style.height = '100%';
        progressBar.style.background = COLORS.PRIMARY;
        progressBar.style.borderRadius = '2px';
        progressBar.style.transition = 'width 0.3s ease';

        progressContainer.appendChild(progressBar);

        // Progress text
        const progressText = document.createElement('div');
        progressText.className = 'progress-text';
        progressText.style.fontSize = '0.875rem';
        progressText.style.color = COLORS.TEXT_MUTED;
        progressText.style.marginTop = SPACING.SM;
        progressText.style.display = 'none'; // Hidden by default

        loadingEl.appendChild(spinner);
        loadingEl.appendChild(loadingText);
        loadingEl.appendChild(progressContainer);
        loadingEl.appendChild(progressText);

        return loadingEl;
    }

    /**
     * Update loading progress for large datasets
     * @param {number} progress - Progress percentage (0-100)
     * @param {string} message - Progress message
     */
    function updateLoadingProgress(progress, message) {
        const progressContainer = loadingState.querySelector('.progress-container');
        const progressBar = loadingState.querySelector('.progress-bar');
        const progressText = loadingState.querySelector('.progress-text');
        const loadingText = loadingState.querySelector('p');

        if (progress > 0 && progress < 100) {
            // Show progress bar for progressive loading
            progressContainer.style.display = 'block';
            progressText.style.display = 'block';
            
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${progress}% - ${message}`;
            loadingText.textContent = 'Processing your financial data...';
        } else if (progress >= 100) {
            // Hide progress bar when complete
            progressContainer.style.display = 'none';
            progressText.style.display = 'none';
            loadingText.textContent = 'Preparing your reports...';
        }
    }

    /**
     * Create empty state component with different scenarios and accessibility
     */
    function createEmptyState() {
        const emptyEl = document.createElement('div');
        emptyEl.className = 'empty-state';
        emptyEl.setAttribute('role', 'status');
        emptyEl.setAttribute('aria-live', 'polite');
        emptyEl.style.display = 'none';
        emptyEl.style.flex = '1';
        emptyEl.style.justifyContent = 'center';
        emptyEl.style.alignItems = 'center';
        emptyEl.style.flexDirection = 'column';
        emptyEl.style.gap = SPACING.LG;
        emptyEl.style.color = COLORS.TEXT_MUTED;
        emptyEl.style.textAlign = 'center';
        emptyEl.style.padding = SPACING.XL;

        return emptyEl;
    }

    /**
     * Create error state component with custom messages and accessibility
     */
    function createErrorState() {
        const errorEl = document.createElement('div');
        errorEl.className = 'error-state';
        errorEl.setAttribute('role', 'alert');
        errorEl.setAttribute('aria-live', 'assertive');
        errorEl.style.display = 'none';
        errorEl.style.flex = '1';
        errorEl.style.justifyContent = 'center';
        errorEl.style.alignItems = 'center';
        errorEl.style.flexDirection = 'column';
        errorEl.style.gap = SPACING.LG;
        errorEl.style.color = COLORS.ERROR;
        errorEl.style.textAlign = 'center';
        errorEl.style.padding = SPACING.XL;

        return errorEl;
    }

    /**
     * Create chart container for displaying visualizations with accessibility
     */
    function createChartContainer() {
        const chartContainer = document.createElement('section');
        chartContainer.className = 'chart-container';
        chartContainer.setAttribute('role', 'region');
        chartContainer.setAttribute('aria-labelledby', 'chart-section-title');
        chartContainer.style.display = 'flex';
        chartContainer.style.flexDirection = 'column';
        chartContainer.style.gap = SPACING.LG;
        chartContainer.style.padding = SPACING.MD;
        chartContainer.style.background = COLORS.SURFACE;
        chartContainer.style.borderRadius = 'var(--radius-lg)';
        chartContainer.style.border = `1px solid ${COLORS.BORDER}`;

        // Add section title for screen readers
        const sectionTitle = document.createElement('h2');
        sectionTitle.id = 'chart-section-title';
        sectionTitle.className = 'sr-only';
        sectionTitle.textContent = 'Financial Charts and Visualizations';
        chartContainer.appendChild(sectionTitle);

        // Chart will be populated by loadReportData
        return chartContainer;
    }

    /**
     * Load and display report data with progressive loading for large datasets
     * Requirements: 9.1, 9.5, 1.6, 5.5, 9.2
     */
    async function loadReportData() {
        if (isLoading) return;

        try {
            isLoading = true;
            loadingProgress = 0;
            showLoadingState();

            // Performance monitoring - start timer
            const startTime = Date.now();
            
            // Get transaction data from storage with comprehensive error handling
            let transactions;
            try {
                transactions = StorageService.getAll();
                
                // Validate transaction data structure
                if (!Array.isArray(transactions)) {
                    throw new Error('Invalid transaction data format - expected array');
                }

                console.log(`[ReportsView] Loading ${transactions.length} transactions`);
                
            } catch (storageError) {
                console.error('Storage access error:', storageError);
                
                // Try to recover from storage errors
                try {
                    // Clear potentially corrupted data and try again
                    console.warn('[ReportsView] Attempting storage recovery...');
                    localStorage.removeItem('blinkbudget_transactions');
                    transactions = [];
                } catch (recoveryError) {
                    console.error('Storage recovery failed:', recoveryError);
                    throw new Error('Unable to access transaction data. Please check your browser storage settings and try refreshing the page.');
                }
            }

            // Use progressive data loader for large datasets with enhanced error handling
            let analyticsData;
            try {
                analyticsData = await progressiveLoader.loadTransactionData(
                    transactions, 
                    currentTimePeriod,
                    {
                        onProgress: (progress, message) => {
                            loadingProgress = progress;
                            updateLoadingProgress(progress, message);
                        },
                        onChunkProcessed: (current, total, chunkSize) => {
                            console.log(`[ReportsView] Processed chunk ${current}/${total} (${chunkSize} transactions)`);
                        },
                        prioritizeCategories: true,
                        enableCaching: true
                    }
                );

                console.log(`[ReportsView] Data processing completed in ${analyticsData.processingTime?.toFixed(2) || 0}ms`);
                
            } catch (analyticsError) {
                console.error('Progressive data loading error:', analyticsError);
                
                // Enhanced fallback with multiple recovery strategies
                console.warn('[ReportsView] Attempting fallback strategies...');
                
                try {
                    // Strategy 1: Direct processing without progressive loading
                    analyticsData = progressiveLoader.processDataDirectly(transactions, currentTimePeriod);
                    console.log('[ReportsView] Fallback to direct processing successful');
                } catch (directProcessingError) {
                    console.error('Direct processing fallback failed:', directProcessingError);
                    
                    try {
                        // Strategy 2: Basic processing with minimal features
                        analyticsData = createMinimalAnalyticsData(transactions, currentTimePeriod);
                        console.log('[ReportsView] Fallback to minimal processing successful');
                    } catch (minimalProcessingError) {
                        console.error('Minimal processing fallback failed:', minimalProcessingError);
                        throw new Error('Unable to process your financial data. This might be due to corrupted data or a browser compatibility issue.');
                    }
                }
            }

            // Enhanced data validation
            try {
                validateAnalyticsData(analyticsData);
            } catch (validationError) {
                console.error('Analytics data validation failed:', validationError);
                
                // Try to fix common data issues
                analyticsData = sanitizeAnalyticsData(analyticsData);
                
                // Validate again after sanitization
                try {
                    validateAnalyticsData(analyticsData);
                } catch (secondValidationError) {
                    console.error('Analytics data validation failed after sanitization:', secondValidationError);
                    throw new Error('The processed financial data appears to be invalid. Please try refreshing the page or contact support if the issue persists.');
                }
            }

            // Check if we have data after processing
            if (!analyticsData.transactions || analyticsData.transactions.length === 0) {
                // Check if we have any transactions at all
                if (transactions.length === 0) {
                    showEmptyState('no-transactions');
                } else {
                    showEmptyState('no-data-for-period');
                }
                isLoading = false;
                return;
            }

            // Store current data for chart rendering
            currentData = analyticsData;

            // Generate insights using Analytics Engine for enhanced analysis
            try {
                if (currentData.transactions && currentData.transactions.length > 0) {
                    // Generate insights for the current period
                    const insights = analyticsEngine.generateSpendingInsights(
                        transactions, // Use all transactions for historical comparison
                        currentTimePeriod
                    );
                    currentData.insights = insights;

                    // Generate predictive analytics if enough historical data
                    const predictions = analyticsEngine.predictFutureSpending(transactions, 3);
                    if (predictions.hasEnoughData) {
                        currentData.predictions = predictions;
                    }

                    console.log(`[ReportsView] Generated ${insights.length} insights and predictions`);
                }
            } catch (insightsError) {
                console.warn('[ReportsView] Failed to generate insights:', insightsError);
                // Continue without insights - not critical for basic functionality
            }

            // Performance check - ensure we meet the 2-second requirement (Requirement 7.5)
            const processingTime = Date.now() - startTime;
            if (processingTime > 2000) {
                console.warn(`Report loading took ${processingTime}ms, exceeding 2-second target`);
                
                // Show performance warning to user
                showPerformanceWarning(processingTime);
            } else {
                console.log(`[ReportsView] Report loading completed in ${processingTime}ms`);
            }

            // Ensure minimum loading time for better UX (but don't exceed 2 seconds total)
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, Math.min(500 - elapsedTime, 2000 - elapsedTime));
            
            setTimeout(() => {
                renderReports();
                isLoading = false;
                loadingProgress = 100;
            }, remainingTime);

        } catch (error) {
            console.error('Error loading report data:', error);
            
            // Enhanced error categorization and user feedback
            let userMessage = 'An unexpected error occurred while loading your reports.';
            let actionable = true;
            
            if (error.message.includes('storage')) {
                userMessage = 'There was a problem accessing your stored data. Please check your browser settings and try again.';
            } else if (error.message.includes('browser')) {
                userMessage = 'Your browser may not support all features required for reports. Please try updating your browser.';
            } else if (error.message.includes('network')) {
                userMessage = 'Network connection issues detected. Please check your internet connection and try again.';
            } else if (error.message.includes('memory')) {
                userMessage = 'Your device may be running low on memory. Please close other tabs and try again.';
                actionable = false;
            }
            
            showErrorState(userMessage);
            isLoading = false;
            loadingProgress = 0;
            
            // Track error for debugging
            if (typeof window.gtag === 'function') {
                window.gtag('event', 'exception', {
                    description: `ReportsView loadReportData: ${error.message}`,
                    fatal: false
                });
            }
        }
    }

    /**
     * Validate and clean transaction data
     * Requirements: 9.1, 9.5
     */
    function validateAndCleanTransactions(transactions) {
        const cleanedTransactions = [];
        const errors = [];

        transactions.forEach((transaction, index) => {
            try {
                // Check required fields
                if (!transaction.id) {
                    errors.push(`Transaction ${index}: Missing ID`);
                    return;
                }

                if (typeof transaction.amount !== 'number' || isNaN(transaction.amount)) {
                    errors.push(`Transaction ${transaction.id}: Invalid amount`);
                    return;
                }

                if (!transaction.date && !transaction.timestamp) {
                    errors.push(`Transaction ${transaction.id}: Missing date/timestamp`);
                    return;
                }

                // Clean and normalize transaction
                const cleanedTransaction = {
                    id: transaction.id,
                    amount: Math.abs(transaction.amount), // Ensure positive amount
                    type: transaction.type || 'expense', // Default to expense
                    category: transaction.category || 'Uncategorized',
                    description: transaction.description || '',
                    date: transaction.date || transaction.timestamp,
                    timestamp: transaction.timestamp || transaction.date,
                    accountId: transaction.accountId || 'main'
                };

                // Validate date
                const transactionDate = new Date(cleanedTransaction.date);
                if (isNaN(transactionDate.getTime())) {
                    errors.push(`Transaction ${transaction.id}: Invalid date format`);
                    return;
                }

                cleanedTransactions.push(cleanedTransaction);

            } catch (error) {
                errors.push(`Transaction ${index}: ${error.message}`);
            }
        });

        // Log errors but don't fail completely unless we have no valid transactions
        if (errors.length > 0) {
            console.warn('Transaction validation errors:', errors);
        }

        if (cleanedTransactions.length === 0 && transactions.length > 0) {
            throw new Error('No valid transactions found. Please check your transaction data.');
        }

        return cleanedTransactions;
    }

    /**
     * Validate analytics calculation results
     */
    function validateAnalyticsResults(categoryBreakdown, incomeVsExpenses, costOfLiving) {
        // Validate category breakdown
        if (!categoryBreakdown || !Array.isArray(categoryBreakdown.categories)) {
            throw new Error('Invalid category breakdown results');
        }

        // Validate income vs expenses
        if (!incomeVsExpenses || typeof incomeVsExpenses.totalIncome !== 'number' || 
            typeof incomeVsExpenses.totalExpenses !== 'number') {
            throw new Error('Invalid income vs expenses calculation');
        }

        // Validate cost of living
        if (!costOfLiving || typeof costOfLiving.totalExpenditure !== 'number') {
            throw new Error('Invalid cost of living calculation');
        }

        // Check for NaN values
        const numericFields = [
            incomeVsExpenses.totalIncome,
            incomeVsExpenses.totalExpenses,
            incomeVsExpenses.netBalance,
            costOfLiving.totalExpenditure,
            costOfLiving.dailySpending
        ];

        if (numericFields.some(field => isNaN(field))) {
            throw new Error('Analytics calculations contain invalid numeric values');
        }
    }

    /**
     * Create fallback analytics when main calculations fail
     */
    function createFallbackAnalytics(transactions) {
        const totalExpenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            categoryBreakdown: {
                categories: [{
                    name: 'All Expenses',
                    amount: totalExpenses,
                    percentage: 100,
                    transactionCount: transactions.filter(t => t.type === 'expense').length
                }],
                totalAmount: totalExpenses,
                timePeriod: currentTimePeriod
            },
            incomeVsExpenses: {
                totalIncome,
                totalExpenses,
                netBalance: totalIncome - totalExpenses,
                timePeriod: currentTimePeriod
            },
            costOfLiving: {
                totalExpenditure: totalExpenses,
                dailySpending: totalExpenses / 30, // Rough estimate
                timePeriod: currentTimePeriod
            },
            transactions,
            isFallback: true
        };
    }

    /**
     * Render the complete reports interface with enhanced error handling
     */
    async function renderReports() {
        try {
            // Clear existing content
            content.innerHTML = '';
            
            // Clean up existing charts
            cleanupCharts();

            if (!currentData) {
                showErrorState('No data available to display reports.');
                return;
            }

            // Validate current data before rendering
            if (!currentData.transactions || currentData.transactions.length === 0) {
                showEmptyState('no-data-for-period');
                return;
            }

            // Initialize consistent category colors
            if (currentData.categoryBreakdown && currentData.categoryBreakdown.categories) {
                getCategoryColors(currentData.categoryBreakdown.categories);
            }

            // Create chart container
            const chartContainer = createChartContainer();
            content.appendChild(chartContainer);

            // Add data summary for debugging/monitoring
            if (currentData.isFallback) {
                const fallbackWarning = document.createElement('div');
                fallbackWarning.style.padding = SPACING.SM;
                fallbackWarning.style.background = 'rgba(251, 191, 36, 0.1)';
                fallbackWarning.style.border = '1px solid rgba(251, 191, 36, 0.3)';
                fallbackWarning.style.borderRadius = 'var(--radius-md)';
                fallbackWarning.style.color = '#92400e';
                fallbackWarning.style.fontSize = '0.875rem';
                fallbackWarning.style.marginBottom = SPACING.MD;
                fallbackWarning.innerHTML = `
                    ⚠️ Using simplified calculations due to data processing issues. 
                    Some advanced insights may not be available.
                `;
                chartContainer.appendChild(fallbackWarning);
            }

            // Add charts and insights here (placeholder for now)
            const placeholder = document.createElement('div');
            placeholder.style.padding = SPACING.XL;
            placeholder.style.textAlign = 'center';
            placeholder.style.color = COLORS.TEXT_MUTED;
            
            // Show data summary
            const dataInfo = `
                <h3 style="margin: 0 0 ${SPACING.MD} 0;">Charts and Insights Coming Soon</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: ${SPACING.MD}; margin: ${SPACING.LG} 0;">
                    <div style="padding: ${SPACING.MD}; background: ${COLORS.SURFACE}; border-radius: var(--radius-md); border: 1px solid ${COLORS.BORDER};">
                        <div style="font-size: 1.5rem; font-weight: bold; color: ${COLORS.PRIMARY};">${currentData.transactions.length}</div>
                        <div style="font-size: 0.875rem; color: ${COLORS.TEXT_MUTED};">Transactions</div>
                    </div>
                    <div style="padding: ${SPACING.MD}; background: ${COLORS.SURFACE}; border-radius: var(--radius-md); border: 1px solid ${COLORS.BORDER};">
                        <div style="font-size: 1.5rem; font-weight: bold; color: ${COLORS.SUCCESS};">€${currentData.incomeVsExpenses.totalIncome.toFixed(2)}</div>
                        <div style="font-size: 0.875rem; color: ${COLORS.TEXT_MUTED};">Total Income</div>
                    </div>
                    <div style="padding: ${SPACING.MD}; background: ${COLORS.SURFACE}; border-radius: var(--radius-md); border: 1px solid ${COLORS.BORDER};">
                        <div style="font-size: 1.5rem; font-weight: bold; color: ${COLORS.ERROR};">€${currentData.incomeVsExpenses.totalExpenses.toFixed(2)}</div>
                        <div style="font-size: 0.875rem; color: ${COLORS.TEXT_MUTED};">Total Expenses</div>
                    </div>
                    <div style="padding: ${SPACING.MD}; background: ${COLORS.SURFACE}; border-radius: var(--radius-md); border: 1px solid ${COLORS.BORDER};">
                        <div style="font-size: 1.5rem; font-weight: bold; color: ${currentData.incomeVsExpenses.netBalance >= 0 ? COLORS.SUCCESS : COLORS.ERROR};">€${currentData.incomeVsExpenses.netBalance.toFixed(2)}</div>
                        <div style="font-size: 0.875rem; color: ${COLORS.TEXT_MUTED};">Net Balance</div>
                    </div>
                </div>
                <p style="margin: ${SPACING.MD} 0 0 0; font-size: 0.875rem;">
                    Period: ${formatTimePeriod(currentTimePeriod)}
                </p>
            `;
            
            // Render beautiful charts with category selection (includes income-expense section)
            await renderCharts(chartContainer);

            // Show the content
            showContentState();

        } catch (error) {
            console.error('Error rendering reports:', error);
            showErrorState('Unable to display reports. Please try refreshing the page.');
        }
    }

    /**
     * Show loading state
     */
    function showLoadingState() {
        content.style.display = 'none';
        if (content.contains(emptyState)) content.removeChild(emptyState);
        if (content.contains(errorState)) content.removeChild(errorState);
        if (!container.contains(loadingState)) {
            container.appendChild(loadingState);
        }
        loadingState.style.display = 'flex';
    }

    /**
     * Show empty state with different scenarios
     * Requirements: 1.6, 5.5
     */
    function showEmptyState(scenario = 'no-transactions') {
        content.style.display = 'none';
        if (container.contains(loadingState)) {
            container.removeChild(loadingState);
        }
        if (content.contains(errorState)) content.removeChild(errorState);
        
        // Clear and rebuild empty state content
        emptyState.innerHTML = '';

        // Empty state icon
        const icon = document.createElement('div');
        icon.style.fontSize = '4rem';
        icon.style.opacity = '0.5';

        // Empty state message
        const message = document.createElement('div');
        
        // Add transaction button
        const addButton = document.createElement('button');
        addButton.className = 'btn btn-primary';
        addButton.style.padding = `${SPACING.MD} ${SPACING.LG}`;
        addButton.style.background = COLORS.PRIMARY;
        addButton.style.color = 'white';
        addButton.style.border = 'none';
        addButton.style.borderRadius = 'var(--radius-md)';
        addButton.style.cursor = 'pointer';
        addButton.style.fontSize = '1rem';
        addButton.style.marginTop = SPACING.MD;

        if (scenario === 'no-transactions') {
            icon.innerHTML = '📊';
            message.innerHTML = `
                <h3 style="margin: 0 0 ${SPACING.SM} 0; color: ${COLORS.TEXT_MAIN};">No Transactions Yet</h3>
                <p style="margin: 0; max-width: 300px; line-height: 1.5;">
                    Start tracking your expenses to see beautiful insights about your spending patterns.
                </p>
            `;
            addButton.textContent = '+ Add Your First Transaction';
            addButton.addEventListener('click', () => Router.navigate('add-expense'));
        } else if (scenario === 'no-data-for-period') {
            icon.innerHTML = '📅';
            message.innerHTML = `
                <h3 style="margin: 0 0 ${SPACING.SM} 0; color: ${COLORS.TEXT_MAIN};">No Data for This Period</h3>
                <p style="margin: 0; max-width: 300px; line-height: 1.5;">
                    No transactions found for ${formatTimePeriod(currentTimePeriod)}. 
                    Try selecting a different time period or add some transactions.
                </p>
            `;
            addButton.textContent = '+ Add Transaction';
            addButton.addEventListener('click', () => Router.navigate('add-expense'));
        }

        emptyState.appendChild(icon);
        emptyState.appendChild(message);
        emptyState.appendChild(addButton);

        if (!container.contains(emptyState)) {
            container.appendChild(emptyState);
        }
        emptyState.style.display = 'flex';
    }

    /**
     * Show error state with custom message
     * Requirements: 9.5
     */
    function showErrorState(customMessage = null) {
        content.style.display = 'none';
        if (container.contains(loadingState)) {
            container.removeChild(loadingState);
        }
        if (content.contains(emptyState)) content.removeChild(emptyState);
        
        // Clear and rebuild error state content
        errorState.innerHTML = '';

        // Error icon
        const icon = document.createElement('div');
        icon.innerHTML = '⚠️';
        icon.style.fontSize = '3rem';

        // Error message
        const message = document.createElement('div');
        const errorTitle = customMessage ? 'Error Loading Reports' : 'Unable to Load Reports';
        const errorDescription = customMessage || 'There was an error loading your financial data. Please try again.';
        
        message.innerHTML = `
            <h3 style="margin: 0 0 ${SPACING.SM} 0; color: ${COLORS.ERROR};">${errorTitle}</h3>
            <p style="margin: 0; max-width: 400px; line-height: 1.5; color: ${COLORS.TEXT_MUTED};">
                ${errorDescription}
            </p>
        `;

        // Action buttons container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = SPACING.MD;
        buttonContainer.style.marginTop = SPACING.MD;
        buttonContainer.style.flexWrap = 'wrap';
        buttonContainer.style.justifyContent = 'center';

        // Retry button
        const retryButton = document.createElement('button');
        retryButton.textContent = 'Try Again';
        retryButton.className = 'btn btn-outline';
        retryButton.style.padding = `${SPACING.MD} ${SPACING.LG}`;
        retryButton.style.background = 'transparent';
        retryButton.style.color = COLORS.PRIMARY;
        retryButton.style.border = `1px solid ${COLORS.PRIMARY}`;
        retryButton.style.borderRadius = 'var(--radius-md)';
        retryButton.style.cursor = 'pointer';
        retryButton.style.fontSize = '1rem';
        retryButton.addEventListener('click', () => loadReportData());

        // Go to dashboard button
        const dashboardButton = document.createElement('button');
        dashboardButton.textContent = 'Back to Dashboard';
        dashboardButton.className = 'btn btn-ghost';
        dashboardButton.style.padding = `${SPACING.MD} ${SPACING.LG}`;
        dashboardButton.style.background = 'transparent';
        dashboardButton.style.color = COLORS.TEXT_MUTED;
        dashboardButton.style.border = 'none';
        dashboardButton.style.borderRadius = 'var(--radius-md)';
        dashboardButton.style.cursor = 'pointer';
        dashboardButton.style.fontSize = '1rem';
        dashboardButton.addEventListener('click', () => Router.navigate('dashboard'));

        buttonContainer.appendChild(retryButton);
        buttonContainer.appendChild(dashboardButton);

        errorState.appendChild(icon);
        errorState.appendChild(message);
        errorState.appendChild(buttonContainer);

        if (!container.contains(errorState)) {
            container.appendChild(errorState);
        }
        errorState.style.display = 'flex';
    }

    /**
     * Show content state
     */
    function showContentState() {
        if (container.contains(loadingState)) {
            container.removeChild(loadingState);
        }
        if (container.contains(emptyState)) {
            container.removeChild(emptyState);
        }
        if (container.contains(errorState)) {
            container.removeChild(errorState);
        }
        content.style.display = 'flex';
    }

    /**
     * Render beautiful charts with category selection and trends
     */
    async function renderCharts(chartContainer) {
        try {
            // Create chart sections
            const chartsSection = document.createElement('div');
            chartsSection.className = 'charts-section';
            chartsSection.style.display = 'flex';
            chartsSection.style.flexDirection = 'column';
            chartsSection.style.gap = SPACING.XL;
            chartsSection.style.position = 'relative'; // Ensure proper positioning context

            // Track successful chart renders for fallback handling
            const chartRenderResults = [];

            // 1. Category Breakdown Pie Chart
            try {
                const categorySection = await createCategoryBreakdownChart();
                // Add visual separation at the bottom
                categorySection.style.borderBottom = `2px solid ${COLORS.BORDER}`;
                categorySection.style.paddingBottom = `calc(${SPACING.LG} * 1.5)`;
                categorySection.style.marginBottom = `calc(${SPACING.XL} * 1.5)`;
                chartsSection.appendChild(categorySection);
                chartRenderResults.push({ name: 'Category Breakdown', success: true });
            } catch (categoryError) {
                console.error('Failed to render category breakdown chart:', categoryError);
                chartRenderResults.push({ name: 'Category Breakdown', success: false, error: categoryError });
                
                // Add fallback category display
                const fallbackSection = createFallbackCategoryDisplay();
                chartsSection.appendChild(fallbackSection);
            }

            // 2. Interactive Category Selector - Position after category breakdown
            try {
                const categorySelectorSection = createCategorySelector();
                // Position it right after the category breakdown
                categorySelectorSection.style.marginTop = `calc(${SPACING.XL} * 2)`;
                categorySelectorSection.style.clear = 'both';
                categorySelectorSection.style.position = 'relative';
                categorySelectorSection.style.zIndex = '2';
                chartsSection.appendChild(categorySelectorSection);
                chartRenderResults.push({ name: 'Category Selector', success: true });
            } catch (selectorError) {
                console.error('Failed to render category selector:', selectorError);
                chartRenderResults.push({ name: 'Category Selector', success: false, error: selectorError });
                // Category selector is optional, continue without it
            }

            // 3. Income vs Expenses Chart - Position after category selector
            try {
                const incomeExpenseContainer = document.createElement('div');
                incomeExpenseContainer.className = 'income-expense-container';
                incomeExpenseContainer.style.marginTop = SPACING.XL + ' !important'; // Reduced spacing
                incomeExpenseContainer.style.marginBottom = SPACING.LG + ' !important'; // Minimal spacing
                incomeExpenseContainer.style.position = 'relative';
                incomeExpenseContainer.style.zIndex = '1';
                incomeExpenseContainer.style.clear = 'both';
                
                const incomeExpenseSection = await createIncomeExpenseChart();
                incomeExpenseContainer.appendChild(incomeExpenseSection);
                chartsSection.appendChild(incomeExpenseContainer);
                chartRenderResults.push({ name: 'Income vs Expenses', success: true });
            } catch (incomeExpenseError) {
                console.error('Failed to render income vs expense chart:', incomeExpenseError);
                chartRenderResults.push({ name: 'Income vs Expenses', success: false, error: incomeExpenseError });
                
                // Add fallback income/expense display
                const incomeExpenseContainer = document.createElement('div');
                incomeExpenseContainer.className = 'income-expense-container';
                incomeExpenseContainer.style.marginTop = SPACING.XL + ' !important'; // Reduced spacing
                incomeExpenseContainer.style.marginBottom = SPACING.LG + ' !important'; // Minimal spacing
                incomeExpenseContainer.style.position = 'relative';
                incomeExpenseContainer.style.zIndex = '1';
                incomeExpenseContainer.style.clear = 'both';
                
                const fallbackSection = createFallbackIncomeExpenseDisplay();
                incomeExpenseContainer.appendChild(fallbackSection);
                chartsSection.appendChild(incomeExpenseContainer);
            }

            // 4. Category Trends Over Time (if enough historical data)
            try {
                const trendsSection = await createCategoryTrendsChart();
                if (trendsSection) {
                    chartsSection.appendChild(trendsSection);
                    chartRenderResults.push({ name: 'Category Trends', success: true });
                }
            } catch (trendsError) {
                console.error('Failed to render category trends chart:', trendsError);
                chartRenderResults.push({ name: 'Category Trends', success: false, error: trendsError });
                // Trends chart is optional, so no fallback needed
            }

            // 5. Financial Insights Section (if insights are available)
            if (currentData.insights && currentData.insights.length > 0) {
                try {
                    const insightsSection = createInsightsSection();
                    insightsSection.style.marginTop = SPACING.LG + ' !important'; // Minimal spacing
                    chartsSection.appendChild(insightsSection);
                    chartRenderResults.push({ name: 'Financial Insights', success: true });
                } catch (insightsError) {
                    console.error('Failed to render insights section:', insightsError);
                    chartRenderResults.push({ name: 'Financial Insights', success: false, error: insightsError });
                    // Insights are optional, continue without them
                }
            }

            // Add the charts section to the chart container (only category-related content)
            chartContainer.appendChild(chartsSection);

            // Show warning if some charts failed to render
            const failedCharts = chartRenderResults.filter(result => !result.success);
            if (failedCharts.length > 0) {
                showChartRenderingWarning(failedCharts);
            }

        } catch (error) {
            console.error('Error rendering charts:', error);
            
            // Complete fallback to basic data display
            const fallback = document.createElement('div');
            fallback.style.padding = SPACING.LG;
            fallback.style.textAlign = 'center';
            fallback.style.background = COLORS.SURFACE;
            fallback.style.borderRadius = 'var(--radius-lg)';
            fallback.style.border = `1px solid ${COLORS.BORDER}`;
            
            fallback.innerHTML = `
                <div style="margin-bottom: ${SPACING.LG};">
                    <h3 style="color: ${COLORS.ERROR}; margin-bottom: ${SPACING.MD};">⚠️ Chart Rendering Failed</h3>
                    <p style="color: ${COLORS.TEXT_MUTED}; margin-bottom: ${SPACING.LG};">
                        Unable to render interactive charts. Showing basic financial summary instead.
                    </p>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: ${SPACING.MD};">
                    <div style="padding: ${SPACING.MD}; background: ${COLORS.BACKGROUND}; border-radius: var(--radius-md);">
                        <div style="font-size: 0.875rem; color: ${COLORS.TEXT_MUTED}; margin-bottom: ${SPACING.XS};">Total Expenses</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: ${COLORS.ERROR};">€${currentData.incomeVsExpenses.totalExpenses.toFixed(2)}</div>
                    </div>
                    <div style="padding: ${SPACING.MD}; background: ${COLORS.BACKGROUND}; border-radius: var(--radius-md);">
                        <div style="font-size: 0.875rem; color: ${COLORS.TEXT_MUTED}; margin-bottom: ${SPACING.XS};">Total Income</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: ${COLORS.SUCCESS};">€${currentData.incomeVsExpenses.totalIncome.toFixed(2)}</div>
                    </div>
                    <div style="padding: ${SPACING.MD}; background: ${COLORS.BACKGROUND}; border-radius: var(--radius-md);">
                        <div style="font-size: 0.875rem; color: ${COLORS.TEXT_MUTED}; margin-bottom: ${SPACING.XS};">Net Balance</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: ${currentData.incomeVsExpenses.netBalance >= 0 ? COLORS.SUCCESS : COLORS.ERROR};">€${currentData.incomeVsExpenses.netBalance.toFixed(2)}</div>
                    </div>
                    <div style="padding: ${SPACING.MD}; background: ${COLORS.BACKGROUND}; border-radius: var(--radius-md);">
                        <div style="font-size: 0.875rem; color: ${COLORS.TEXT_MUTED}; margin-bottom: ${SPACING.XS};">Transactions</div>
                        <div style="font-size: 1.5rem; font-weight: bold; color: ${COLORS.PRIMARY};">${currentData.transactions.length}</div>
                    </div>
                </div>
                <div style="margin-top: ${SPACING.LG};">
                    <button onclick="location.reload()" style="padding: ${SPACING.MD} ${SPACING.LG}; background: ${COLORS.PRIMARY}; color: white; border: none; border-radius: var(--radius-md); cursor: pointer;">
                        Refresh Page
                    </button>
                </div>
            `;
            chartContainer.appendChild(fallback);
        }
    }

    /**
     * Create interactive category breakdown pie chart
     */
    async function createCategoryBreakdownChart() {
        const section = document.createElement('div');
        section.className = 'chart-section category-breakdown-section';
        section.setAttribute('data-chart-type', 'category-breakdown');
        section.style.background = COLORS.SURFACE;
        section.style.borderRadius = 'var(--radius-lg)';
        section.style.border = `1px solid ${COLORS.BORDER}`;
        section.style.padding = SPACING.LG;

        // Section header
        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = SPACING.MD;

        const title = document.createElement('h3');
        title.textContent = 'Spending by Category';
        title.style.margin = '0';
        title.style.color = COLORS.TEXT_MAIN;

        // Chart type toggle
        const chartTypeToggle = document.createElement('div');
        chartTypeToggle.style.display = 'flex';
        chartTypeToggle.style.gap = SPACING.XS;

        const pieBtn = createToggleButton('Pie', true);
        const doughnutBtn = createToggleButton('Doughnut', false);

        chartTypeToggle.appendChild(pieBtn);
        chartTypeToggle.appendChild(doughnutBtn);

        header.appendChild(title);
        header.appendChild(chartTypeToggle);
        section.appendChild(header);

        // Chart container
        const chartDiv = document.createElement('div');
        chartDiv.style.position = 'relative';
        chartDiv.style.height = '400px';
        chartDiv.style.marginBottom = SPACING.MD;

        const canvas = document.createElement('canvas');
        canvas.id = 'category-breakdown-chart';
        canvas.style.maxHeight = '100%';
        chartDiv.appendChild(canvas);

        section.appendChild(chartDiv);

        // Prepare chart data
        const categoryData = currentData.categoryBreakdown;
        
        // Get consistent colors for all categories
        const categoryColors = getCategoryColors(categoryData.categories);
        
        const chartData = {
            labels: categoryData.categories.map(cat => cat.name),
            datasets: [{
                data: categoryData.categories.map(cat => cat.amount),
                backgroundColor: categoryColors,
                borderColor: '#ffffff',
                borderWidth: 2
            }]
        };

        // Create initial pie chart
        let currentChart = await chartRenderer.createPieChart(canvas, chartData, {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: window.innerWidth < 768 ? 'bottom' : 'right'
                }
            }
        });

        // Add click handler for category selection
        canvas.addEventListener('chartSegmentClick', (event) => {
            const clickData = event.detail;
            showCategoryDetails(clickData.label, clickData.value, clickData.percentage);
        });

        // Toggle between pie and doughnut
        pieBtn.addEventListener('click', async () => {
            if (!pieBtn.classList.contains('active')) {
                chartRenderer.destroyChart(currentChart);
                currentChart = await chartRenderer.createPieChart(canvas, chartData);
                setActiveToggle(pieBtn, doughnutBtn);
            }
        });

        doughnutBtn.addEventListener('click', async () => {
            if (!doughnutBtn.classList.contains('active')) {
                chartRenderer.destroyChart(currentChart);
                currentChart = await chartRenderer.createDoughnutChart(canvas, chartData);
                setActiveToggle(doughnutBtn, pieBtn);
            }
        });

        // Category details are now shown inline below the category selector section
        // No popup needed - see showCategoryDetails function

        return section;
    }

    /**
     * Create income vs expenses bar chart
     */
    async function createIncomeExpenseChart() {
        const section = document.createElement('div');
        section.className = 'chart-section income-expense-section';
        section.setAttribute('data-chart-type', 'income-expense');
        section.style.background = COLORS.SURFACE;
        section.style.borderRadius = 'var(--radius-lg)';
        section.style.border = `1px solid ${COLORS.BORDER}`;
        section.style.padding = SPACING.LG;
        section.style.marginBottom = '0 !important'; // No bottom margin
        section.style.paddingBottom = `calc(${SPACING.MD}) !important`; // Minimal padding for tooltips only
        section.style.position = 'relative'; // Ensure proper positioning
        section.style.zIndex = '2'; // Ensure it's above category selector
        // Force block behavior and proper containment
        section.style.display = 'block';
        section.style.width = '100%';
        section.style.boxSizing = 'border-box';
        section.style.contain = 'layout';
        section.style.overflow = 'visible'; // Allow tooltips but ensure they don't overlap

        const title = document.createElement('h3');
        title.textContent = 'Income vs Expenses';
        title.style.margin = `0 0 ${SPACING.MD} 0`;
        title.style.color = COLORS.TEXT_MAIN;
        section.appendChild(title);

        // Chart container - properly sized to accommodate chart without clipping
        const chartDiv = document.createElement('div');
        chartDiv.style.position = 'relative';
        chartDiv.style.width = '100%';
        chartDiv.style.height = '400px'; // Fixed height - no min-height to prevent expansion
        chartDiv.style.marginBottom = '0'; // No margin
        chartDiv.style.padding = SPACING.SM;
        chartDiv.style.paddingBottom = `calc(${SPACING.SM} + 20px)`; // Small padding for tooltips only
        chartDiv.style.boxSizing = 'border-box';
        chartDiv.style.overflow = 'visible'; // Allow tooltips to show

        const canvas = document.createElement('canvas');
        canvas.id = 'income-expense-chart';
        canvas.style.width = '100%';
        canvas.style.height = '400px'; // Fixed height for the chart
        canvas.style.maxWidth = '100%';
        canvas.style.display = 'block';
        chartDiv.appendChild(canvas);
        section.appendChild(chartDiv);

        // Prepare chart data
        const incomeExpenseData = currentData.incomeVsExpenses;
        const chartData = {
            labels: ['Income', 'Expenses', 'Net Balance'],
            datasets: [{
                label: 'Amount (€)',
                data: [
                    incomeExpenseData.totalIncome,
                    incomeExpenseData.totalExpenses,
                    Math.abs(incomeExpenseData.netBalance)
                ],
                backgroundColor: [
                    'rgba(34, 197, 94, 0.8)',   // Green for income
                    'rgba(239, 68, 68, 0.8)',   // Red for expenses
                    incomeExpenseData.netBalance >= 0 
                        ? 'rgba(34, 197, 94, 0.6)'   // Green for positive balance
                        : 'rgba(239, 68, 68, 0.6)'   // Red for negative balance
                ],
                borderColor: [
                    'rgba(34, 197, 94, 1)',
                    'rgba(239, 68, 68, 1)',
                    incomeExpenseData.netBalance >= 0 
                        ? 'rgba(34, 197, 94, 1)'
                        : 'rgba(239, 68, 68, 1)'
                ],
                borderWidth: 1
            }]
        };

        await chartRenderer.createBarChart(canvas, chartData, {
            responsive: true,
            maintainAspectRatio: false,
            title: undefined, // Don't add "Comparison Chart" title - we already have "Income vs Expenses"
            plugins: {
                tooltip: {
                    position: 'nearest',
                    // Use auto positioning to let Chart.js choose best position
                    yAlign: 'auto',
                    // Add extra padding to prevent overlap
                    padding: 20,
                    // Ensure tooltips don't extend beyond viewport
                    caretSize: 8,
                    caretPadding: 10
                }
            }
        });

        return section;
    }

    /**
     * Create category trends over time chart
     */
    async function createCategoryTrendsChart() {
        // Get historical data for trends
        const allTransactions = StorageService.getAll();
        
        // Check if we have enough historical data (at least 3 months)
        const oldestTransaction = allTransactions.reduce((oldest, transaction) => {
            const transactionDate = new Date(transaction.date || transaction.timestamp);
            return transactionDate < oldest ? transactionDate : oldest;
        }, new Date());

        const monthsOfData = Math.floor((new Date() - oldestTransaction) / (1000 * 60 * 60 * 24 * 30));
        
        if (monthsOfData < 3) {
            return null; // Not enough data for trends
        }

        const section = document.createElement('div');
        section.className = 'chart-section';
        section.style.background = COLORS.SURFACE;
        section.style.borderRadius = 'var(--radius-lg)';
        section.style.border = `1px solid ${COLORS.BORDER}`;
        section.style.padding = SPACING.LG;

        const title = document.createElement('h3');
        title.textContent = 'Category Trends Over Time';
        title.style.margin = `0 0 ${SPACING.MD} 0`;
        title.style.color = COLORS.TEXT_MAIN;
        section.appendChild(title);

        const chartDiv = document.createElement('div');
        chartDiv.style.position = 'relative';
        chartDiv.style.height = '350px';

        const canvas = document.createElement('canvas');
        canvas.id = 'category-trends-chart';
        chartDiv.appendChild(canvas);
        section.appendChild(chartDiv);

        // Generate monthly data for top 3 categories
        const topCategories = currentData.categoryBreakdown.categories.slice(0, 3);
        const monthlyData = generateMonthlyTrendData(allTransactions, topCategories);

        const chartData = {
            labels: monthlyData.months,
            datasets: topCategories.map((category, index) => ({
                label: category.name,
                data: monthlyData.categoryData[category.name] || [],
                borderColor: categoryColorMap.get(category.name) || getChartColors(topCategories.length)[index],
                backgroundColor: (categoryColorMap.get(category.name) || getChartColors(topCategories.length)[index]).replace(')', ', 0.1)').replace('hsl', 'hsla'),
                borderWidth: 3,
                fill: false,
                tension: 0.4
            }))
        };

        await chartRenderer.createLineChart(canvas, chartData, {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                }
            }
        });

        return section;
    }

    /**
     * Create interactive category selector
     */
    function createCategorySelector() {
        const section = document.createElement('div');
        section.className = 'category-selector-section';
        section.style.background = COLORS.SURFACE;
        section.style.borderRadius = 'var(--radius-lg)';
        section.style.border = `1px solid ${COLORS.BORDER}`;
        section.style.padding = SPACING.LG;
        section.style.marginTop = SPACING.XL;
        section.style.marginBottom = SPACING.XL;

        const title = document.createElement('h3');
        title.textContent = 'Explore Categories';
        title.style.margin = `0 0 ${SPACING.MD} 0`;
        title.style.color = COLORS.TEXT_MAIN;
        section.appendChild(title);

        const description = document.createElement('p');
        description.textContent = 'Click on any category below to see detailed spending patterns and trends.';
        description.style.margin = `0 0 ${SPACING.LG} 0`;
        description.style.color = COLORS.TEXT_MUTED;
        section.appendChild(description);

        // Category grid
        const categoryGrid = document.createElement('div');
        categoryGrid.className = 'category-grid';
        categoryGrid.style.display = 'grid';
        categoryGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
        categoryGrid.style.gap = SPACING.MD;
        categoryGrid.style.marginTop = SPACING.MD;

        currentData.categoryBreakdown.categories.forEach((category, index) => {
            const categoryCard = createCategoryCard(category, index);
            categoryGrid.appendChild(categoryCard);
        });

        section.appendChild(categoryGrid);

        // Category details section - appears below category grid when a category is clicked
        const categoryDetailsSection = document.createElement('div');
        categoryDetailsSection.id = 'category-details-section';
        categoryDetailsSection.style.display = 'none';
        categoryDetailsSection.style.marginTop = SPACING.XL;
        categoryDetailsSection.style.paddingTop = SPACING.XL;
        categoryDetailsSection.style.borderTop = `2px solid ${COLORS.BORDER}`;
        section.appendChild(categoryDetailsSection);

        return section;
    }

    /**
     * Create individual category card
     */
    function createCategoryCard(category, index) {
        const card = document.createElement('button');
        card.className = 'category-card';
        card.style.background = COLORS.SURFACE;
        card.style.border = `2px solid ${COLORS.BORDER}`;
        card.style.borderRadius = 'var(--radius-md)';
        card.style.padding = SPACING.MD;
        card.style.cursor = 'pointer';
        card.style.transition = 'all 0.2s ease';
        card.style.textAlign = 'left';
        card.style.width = '100%';

        // Set the category color as a CSS custom property for the ::before pseudo-element
        const categoryColor = categoryColorMap.get(category.name) || getChartColors(1)[0];
        card.style.setProperty('--category-color', categoryColor);

        // Hover effects
        card.addEventListener('mouseenter', () => {
            card.style.borderColor = COLORS.PRIMARY;
            card.style.transform = 'translateY(-2px)';
            card.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.borderColor = COLORS.BORDER;
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = 'none';
        });

        // Category color indicator - use the same color as in charts
        const colorIndicator = document.createElement('div');
        colorIndicator.style.width = '4px';
        colorIndicator.style.height = '40px';
        colorIndicator.style.background = categoryColor;
        colorIndicator.style.borderRadius = '2px';
        colorIndicator.style.marginBottom = SPACING.SM;

        // Category name
        const name = document.createElement('div');
        name.textContent = category.name;
        name.style.fontWeight = '600';
        name.style.color = COLORS.TEXT_MAIN;
        name.style.marginBottom = SPACING.XS;

        // Category amount
        const amount = document.createElement('div');
        amount.textContent = `€${category.amount.toFixed(2)}`;
        amount.style.fontSize = '1.25rem';
        amount.style.fontWeight = 'bold';
        amount.style.color = COLORS.PRIMARY;
        amount.style.marginBottom = SPACING.XS;

        // Category percentage
        const percentage = document.createElement('div');
        percentage.textContent = `${typeof category.percentage === 'string' ? category.percentage : category.percentage.toFixed(1)}% of expenses`;
        percentage.style.fontSize = '0.875rem';
        percentage.style.color = COLORS.TEXT_MUTED;

        // Transaction count
        const transactionCount = document.createElement('div');
        transactionCount.textContent = `${category.transactionCount} transaction${category.transactionCount !== 1 ? 's' : ''}`;
        transactionCount.style.fontSize = '0.75rem';
        transactionCount.style.color = COLORS.TEXT_MUTED;
        transactionCount.style.marginTop = SPACING.XS;

        card.appendChild(colorIndicator);
        card.appendChild(name);
        card.appendChild(amount);
        card.appendChild(percentage);
        card.appendChild(transactionCount);

        // Click handler to show category details
        card.addEventListener('click', () => {
            showCategoryDetails(category.name, category.amount, category.percentage);
        });

        return card;
    }

    /**
     * Show detailed information for a selected category (inline below category selector)
     */
    function showCategoryDetails(categoryName, amount, percentage) {
        const detailsSection = document.getElementById('category-details-section');
        if (!detailsSection) return;

        // Get transactions for this category
        const categoryTransactions = currentData.transactions.filter(t => 
            (t.category || 'Uncategorized') === categoryName && t.type === 'expense'
        );

        const averageAmount = categoryTransactions.length > 0 ? (amount / categoryTransactions.length) : 0;

        detailsSection.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${SPACING.MD};">
                <h4 style="margin: 0; color: ${COLORS.TEXT_MAIN};">${categoryName} Details</h4>
                <button id="close-category-details" 
                        style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: ${COLORS.TEXT_MUTED}; padding: ${SPACING.XS};">×</button>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: ${SPACING.MD}; margin-bottom: ${SPACING.MD};">
                <div>
                    <div style="font-size: 0.875rem; color: ${COLORS.TEXT_MUTED};">Total Spent</div>
                    <div style="font-size: 1.25rem; font-weight: bold; color: ${COLORS.PRIMARY};">€${amount.toFixed(2)}</div>
                </div>
                <div>
                    <div style="font-size: 0.875rem; color: ${COLORS.TEXT_MUTED};">Percentage</div>
                    <div style="font-size: 1.25rem; font-weight: bold; color: ${COLORS.PRIMARY};">${typeof percentage === 'string' ? percentage : percentage.toFixed(1)}%</div>
                </div>
                <div>
                    <div style="font-size: 0.875rem; color: ${COLORS.TEXT_MUTED};">Transactions</div>
                    <div style="font-size: 1.25rem; font-weight: bold; color: ${COLORS.PRIMARY};">${categoryTransactions.length}</div>
                </div>
                <div>
                    <div style="font-size: 0.875rem; color: ${COLORS.TEXT_MUTED};">Average</div>
                    <div style="font-size: 1.25rem; font-weight: bold; color: ${COLORS.PRIMARY};">€${averageAmount.toFixed(2)}</div>
                </div>
            </div>
            <div style="margin-top: ${SPACING.MD};">
                <div style="font-size: 0.875rem; color: ${COLORS.TEXT_MUTED}; margin-bottom: ${SPACING.SM};">Recent Transactions:</div>
                <div style="max-height: 200px; overflow-y: auto;">
                    ${categoryTransactions.length > 0 ? categoryTransactions.slice(0, 10).map(t => `
                        <div style="display: flex; justify-content: space-between; padding: ${SPACING.XS} 0; border-bottom: 1px solid ${COLORS.BORDER};">
                            <span style="color: ${COLORS.TEXT_MAIN};">${t.description || 'No description'}</span>
                            <span style="font-weight: 600; color: ${COLORS.ERROR};">€${Math.abs(t.amount).toFixed(2)}</span>
                        </div>
                    `).join('') : '<div style="color: ' + COLORS.TEXT_MUTED + ';">No transactions found</div>'}
                </div>
            </div>
        `;

        // Show the details section
        detailsSection.style.display = 'block';

        // Add close button handler
        const closeBtn = detailsSection.querySelector('#close-category-details');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                detailsSection.style.display = 'none';
            });
        }

        // Scroll to details section smoothly
        detailsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Create insights section displaying AI-generated financial insights
     */
    function createInsightsSection() {
        const section = document.createElement('div');
        section.className = 'insights-section';
        section.style.background = COLORS.SURFACE;
        section.style.borderRadius = 'var(--radius-lg)';
        section.style.border = `1px solid ${COLORS.BORDER}`;
        section.style.padding = SPACING.LG;

        const title = document.createElement('h3');
        title.textContent = 'Financial Insights';
        title.style.margin = `0 0 ${SPACING.MD} 0`;
        title.style.color = COLORS.TEXT_MAIN;
        section.appendChild(title);

        const description = document.createElement('p');
        description.textContent = 'AI-powered insights based on your spending patterns and trends.';
        description.style.margin = `0 0 ${SPACING.LG} 0`;
        description.style.color = COLORS.TEXT_MUTED;
        section.appendChild(description);

        // Insights grid
        const insightsGrid = document.createElement('div');
        insightsGrid.style.display = 'flex';
        insightsGrid.style.flexDirection = 'column';
        insightsGrid.style.gap = SPACING.MD;

        // Display top insights (limit to 5 for better UX)
        if (currentData.insights && Array.isArray(currentData.insights) && currentData.insights.length > 0) {
            const topInsights = currentData.insights.slice(0, 5);
            topInsights.forEach((insight, index) => {
                const insightCard = createInsightCard(insight, index);
                insightsGrid.appendChild(insightCard);
            });
        } else {
            const noInsights = document.createElement('div');
            noInsights.style.padding = SPACING.MD;
            noInsights.style.textAlign = 'center';
            noInsights.style.color = COLORS.TEXT_MUTED;
            noInsights.textContent = 'No insights available yet. Add more transactions to see personalized insights.';
            insightsGrid.appendChild(noInsights);
        }

        section.appendChild(insightsGrid);

        // Show predictions if available
        if (currentData.predictions && currentData.predictions.hasEnoughData) {
            const predictionsSection = createPredictionsSection();
            section.appendChild(predictionsSection);
        }

        return section;
    }

    /**
     * Create individual insight card
     */
    function createInsightCard(insight, index) {
        const card = document.createElement('div');
        card.className = 'insight-card';
        card.style.background = getInsightBackgroundColor(insight.type);
        card.style.border = `1px solid ${getInsightBorderColor(insight.type)}`;
        card.style.borderRadius = 'var(--radius-md)';
        card.style.padding = SPACING.MD;
        card.style.position = 'relative';

        // Insight icon
        const icon = document.createElement('div');
        icon.style.fontSize = '1.5rem';
        icon.style.marginBottom = SPACING.SM;
        icon.textContent = getInsightIcon(insight.type);

        // Insight message
        const message = document.createElement('div');
        message.textContent = insight.message;
        message.style.color = COLORS.TEXT_MAIN;
        message.style.lineHeight = '1.5';
        message.style.marginBottom = insight.recommendation ? SPACING.SM : '0';

        card.appendChild(icon);
        card.appendChild(message);

        // Add recommendation if available
        if (insight.recommendation) {
            const recommendation = document.createElement('div');
            recommendation.textContent = `💡 ${insight.recommendation}`;
            recommendation.style.fontSize = '0.875rem';
            recommendation.style.color = COLORS.TEXT_MUTED;
            recommendation.style.fontStyle = 'italic';
            recommendation.style.marginTop = SPACING.SM;
            recommendation.style.paddingTop = SPACING.SM;
            recommendation.style.borderTop = `1px solid ${COLORS.BORDER}`;
            card.appendChild(recommendation);
        }

        // Severity indicator
        if (insight.severity === 'high') {
            const severityIndicator = document.createElement('div');
            severityIndicator.style.position = 'absolute';
            severityIndicator.style.top = SPACING.SM;
            severityIndicator.style.right = SPACING.SM;
            severityIndicator.style.width = '8px';
            severityIndicator.style.height = '8px';
            severityIndicator.style.borderRadius = '50%';
            severityIndicator.style.background = COLORS.ERROR;
            card.appendChild(severityIndicator);
        }

        return card;
    }

    /**
     * Create predictions section
     */
    function createPredictionsSection() {
        const section = document.createElement('div');
        section.style.marginTop = SPACING.LG;
        section.style.paddingTop = SPACING.LG;
        section.style.borderTop = `1px solid ${COLORS.BORDER}`;

        const title = document.createElement('h4');
        title.textContent = 'Spending Predictions';
        title.style.margin = `0 0 ${SPACING.MD} 0`;
        title.style.color = COLORS.TEXT_MAIN;
        section.appendChild(title);

        const predictionsGrid = document.createElement('div');
        predictionsGrid.style.display = 'grid';
        predictionsGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(150px, 1fr))';
        predictionsGrid.style.gap = SPACING.MD;

        // Show next 3 months predictions
        currentData.predictions.predictions.forEach(prediction => {
            const predictionCard = document.createElement('div');
            predictionCard.style.background = 'rgba(59, 130, 246, 0.05)';
            predictionCard.style.border = '1px solid rgba(59, 130, 246, 0.2)';
            predictionCard.style.borderRadius = 'var(--radius-md)';
            predictionCard.style.padding = SPACING.MD;
            predictionCard.style.textAlign = 'center';

            const monthName = document.createElement('div');
            monthName.textContent = prediction.monthName;
            monthName.style.fontSize = '0.875rem';
            monthName.style.color = COLORS.TEXT_MUTED;
            monthName.style.marginBottom = SPACING.XS;

            const amount = document.createElement('div');
            amount.textContent = `€${prediction.predictedAmount.toFixed(0)}`;
            amount.style.fontSize = '1.25rem';
            amount.style.fontWeight = 'bold';
            amount.style.color = COLORS.PRIMARY;

            const confidence = document.createElement('div');
            confidence.textContent = `${prediction.confidence} confidence`;
            confidence.style.fontSize = '0.75rem';
            confidence.style.color = COLORS.TEXT_MUTED;
            confidence.style.marginTop = SPACING.XS;

            predictionCard.appendChild(monthName);
            predictionCard.appendChild(amount);
            predictionCard.appendChild(confidence);

            predictionsGrid.appendChild(predictionCard);
        });

        section.appendChild(predictionsGrid);
        return section;
    }

    /**
     * Helper functions for insights
     */
    function getInsightIcon(type) {
        const icons = {
            'positive': '✅',
            'warning': '⚠️',
            'pattern': '📈',
            'anomaly': '🔍',
            'increase': '📈',
            'decrease': '📉'
        };
        return icons[type] || '💡';
    }

    function getInsightBackgroundColor(type) {
        const colors = {
            'positive': 'rgba(34, 197, 94, 0.05)',
            'warning': 'rgba(251, 191, 36, 0.05)',
            'pattern': 'rgba(59, 130, 246, 0.05)',
            'anomaly': 'rgba(239, 68, 68, 0.05)',
            'increase': 'rgba(251, 191, 36, 0.05)',
            'decrease': 'rgba(34, 197, 94, 0.05)'
        };
        return colors[type] || 'rgba(156, 163, 175, 0.05)';
    }

    function getInsightBorderColor(type) {
        const colors = {
            'positive': 'rgba(34, 197, 94, 0.2)',
            'warning': 'rgba(251, 191, 36, 0.2)',
            'pattern': 'rgba(59, 130, 246, 0.2)',
            'anomaly': 'rgba(239, 68, 68, 0.2)',
            'increase': 'rgba(251, 191, 36, 0.2)',
            'decrease': 'rgba(34, 197, 94, 0.2)'
        };
        return colors[type] || 'rgba(156, 163, 175, 0.2)';
    }

    /**
     * Helper functions for chart creation
     */
    function createToggleButton(text, active = false) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.padding = `${SPACING.XS} ${SPACING.SM}`;
        button.style.border = `1px solid ${COLORS.BORDER}`;
        button.style.borderRadius = 'var(--radius-sm)';
        button.style.background = active ? COLORS.PRIMARY : 'transparent';
        button.style.color = active ? 'white' : COLORS.TEXT_MAIN;
        button.style.cursor = 'pointer';
        button.style.fontSize = '0.875rem';
        button.style.transition = 'all 0.2s ease';
        
        if (active) {
            button.classList.add('active');
        }

        return button;
    }

    function setActiveToggle(activeBtn, inactiveBtn) {
        activeBtn.style.background = COLORS.PRIMARY;
        activeBtn.style.color = 'white';
        activeBtn.classList.add('active');
        
        inactiveBtn.style.background = 'transparent';
        inactiveBtn.style.color = COLORS.TEXT_MAIN;
        inactiveBtn.classList.remove('active');
    }

    function generateMonthlyTrendData(transactions, topCategories) {
        const months = [];
        const categoryData = {};
        
        // Initialize category data
        topCategories.forEach(cat => {
            categoryData[cat.name] = [];
        });

        // Generate last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            months.push(monthKey);

            // Calculate spending for each category in this month
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            topCategories.forEach(category => {
                const monthlySpending = transactions
                    .filter(t => {
                        const tDate = new Date(t.date || t.timestamp);
                        return tDate >= monthStart && tDate <= monthEnd && 
                               (t.category || 'Uncategorized') === category.name &&
                               t.type === 'expense';
                    })
                    .reduce((sum, t) => sum + (t.amount || 0), 0);
                
                categoryData[category.name].push(monthlySpending);
            });
        }

        return { months, categoryData };
    }

    /**
     * Get consistent colors for categories across all charts and UI elements
     * @param {Array} categories - Array of category objects
     * @returns {Array} Array of colors matching the categories
     */
    function getCategoryColors(categories) {
        // Generate colors for all categories if not already mapped
        if (categoryColorMap.size === 0 || categoryColorMap.size < categories.length) {
            // Get more colors than needed to ensure good distribution and avoid overlaps
            const totalColors = Math.max(categories.length, 12);
            const colors = getChartColors(totalColors);
            
            categories.forEach((category, index) => {
                if (!categoryColorMap.has(category.name)) {
                    // Use modulo to cycle through colors if we have more categories than colors
                    const colorIndex = index % colors.length;
                    categoryColorMap.set(category.name, colors[colorIndex]);
                }
            });
        }
        
        // Return colors in the same order as categories
        return categories.map(category => categoryColorMap.get(category.name));
    }

    /**
     * Clean up chart instances and progressive loader to prevent memory leaks
     */
    function cleanupCharts() {
        activeCharts.forEach((chart, key) => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        activeCharts.clear();

        // Cancel any ongoing progressive loading
        if (progressiveLoader.isCurrentlyLoading()) {
            progressiveLoader.cancelLoading();
        }
    }

    /**
     * Handle responsive layout updates with comprehensive optimizations
     */
    const updateResponsiveLayout = debounce(() => {
        const isMobile = window.innerWidth < BREAKPOINTS.MOBILE;
        const isTablet = window.innerWidth >= BREAKPOINTS.MOBILE && window.innerWidth < 1024;
        const isDesktop = window.innerWidth >= 1024;
        const isLandscape = window.innerHeight < window.innerWidth;
        const isShortLandscape = isLandscape && window.innerHeight < 500;
        
        // Update header title size
        const title = header.querySelector('h1');
        if (title) {
            if (isMobile) {
                title.style.fontSize = isShortLandscape ? '1.125rem' : '1.5rem';
            } else if (isTablet) {
                title.style.fontSize = '1.75rem';
            } else {
                title.style.fontSize = '2rem';
            }
        }

        // Update container padding based on screen size
        if (isMobile) {
            container.style.padding = isShortLandscape ? 
                `${SPACING.XS} ${SPACING.SM}` : 
                `${SPACING.SM} ${SPACING.SM}`;
        } else if (isTablet) {
            container.style.padding = `${SPACING.MD} ${SPACING.LG}`;
        } else {
            container.style.padding = `${SPACING.LG} ${SPACING.XL}`;
        }

        // Update content gap
        if (content) {
            content.style.gap = isMobile ? SPACING.MD : SPACING.LG;
        }

        // Apply mobile optimizations to active charts
        activeCharts.forEach((chart) => {
            if (chart && typeof chart.resize === 'function') {
                // Resize chart to fit new container
                chart.resize();
                
                // Apply mobile-specific optimizations
                chartRenderer.applyMobileOptimizations(chart);
            }
        });

        // Update visual viewport height for mobile keyboard handling
        if (isMobile) {
            updateVisualViewportHeight();
        }

        // The TimePeriodSelector component handles its own responsive updates
        // No need to manually update button sizes here

        console.log(`[ReportsView] Layout updated for ${isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'} view`);
    }, TIMING.DEBOUNCE_RESIZE);

    /**
     * Update visual viewport height for mobile keyboard handling
     */
    function updateVisualViewportHeight() {
        if (window.visualViewport) {
            const vh = window.visualViewport.height * 0.01;
            document.documentElement.style.setProperty('--visual-viewport-height', `${window.visualViewport.height}px`);
        } else {
            // Fallback for browsers without visualViewport support
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--visual-viewport-height', `${window.innerHeight}px`);
        }
    }

    /**
     * Handle orientation changes with optimizations
     */
    const handleOrientationChange = debounce(() => {
        // Wait for orientation change to complete
        setTimeout(() => {
            updateResponsiveLayout();
            
            // Force chart resize after orientation change
            activeCharts.forEach((chart) => {
                if (chart && typeof chart.resize === 'function') {
                    chart.resize();
                }
            });
        }, 100);
    }, TIMING.DEBOUNCE_ORIENTATION);

    // Event listeners for responsive behavior
    window.addEventListener('resize', updateResponsiveLayout);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Visual viewport API support for mobile keyboards
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', updateVisualViewportHeight);
    }

    // Initial responsive setup
    updateResponsiveLayout();
    updateVisualViewportHeight();

    // Listen for storage updates to refresh data
    const handleStorageUpdate = (e) => {
        console.log(`[ReportsView] Storage updated (${e.detail.key}), refreshing data...`);
        if (e.detail.key === 'blinkbudget_transactions' || e.detail.key === 'blinkbudget_accounts') {
            // Invalidate analytics cache when transactions or accounts change
            analyticsEngine.invalidateCacheOnDataUpdate();
            
            // Debounce multiple rapid updates
            clearTimeout(container._refreshTimeout);
            container._refreshTimeout = setTimeout(() => {
                loadReportData();
            }, 300);
        }
    };

    // Listen for auth changes that might affect data access
    const handleAuthChange = (e) => {
        console.log(`[ReportsView] Auth state changed, refreshing data...`);
        // Clear cache and reload data when user changes
        analyticsEngine.clearCache();
        loadReportData();
    };

    // Listen for navigation state changes from other tabs/windows
    const handleNavigationStateChange = (e) => {
        console.log(`[ReportsView] Navigation state changed:`, e.detail);
        
        // If time period was updated in another tab, sync it
        if (e.detail.key === NavigationState.STATE_KEYS.REPORTS_TIME_PERIOD) {
            const restoredTimePeriod = NavigationState.restoreTimePeriod();
            if (restoredTimePeriod && restoredTimePeriod !== currentTimePeriod) {
                console.log('[ReportsView] Syncing time period from another tab');
                currentTimePeriod = restoredTimePeriod;
                
                // Update the time period selector component
                if (timePeriodSelectorComponent && timePeriodSelectorComponent.updatePeriod) {
                    timePeriodSelectorComponent.updatePeriod(restoredTimePeriod);
                }
                
                // Reload data with synced time period
                loadReportData();
            }
        }
    };

    // Handle keyboard shortcuts
    const handleKeyboardShortcuts = (e) => {
        // Escape key or Ctrl+B to go back to dashboard
        if (e.key === 'Escape' || (e.ctrlKey && e.key === 'b')) {
            e.preventDefault();
            Router.navigate('dashboard');
        }
        
        // Ctrl+R to refresh data
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            refreshData();
        }
    };

    window.addEventListener('storage-updated', handleStorageUpdate);
    window.addEventListener('auth-state-changed', handleAuthChange);
    window.addEventListener('navigation-state-changed', handleNavigationStateChange);
    window.addEventListener('keydown', handleKeyboardShortcuts);

    /**
     * Manual refresh function for user-initiated refreshes
     */
    function refreshData() {
        analyticsEngine.clearCache();
        loadReportData();
    }

    /**
     * Check data integrity and provide user feedback
     */
    function checkDataIntegrity() {
        try {
            const transactions = StorageService.getAll();
            const accounts = StorageService.getAccounts();
            
            // Check for orphaned transactions (transactions without valid accounts)
            const accountIds = new Set(accounts.map(acc => acc.id));
            const orphanedTransactions = transactions.filter(t => 
                t.accountId && !accountIds.has(t.accountId)
            );

            if (orphanedTransactions.length > 0) {
                console.warn(`Found ${orphanedTransactions.length} transactions with invalid account references`);
                // Could show a warning to the user here
            }

            return {
                transactionCount: transactions.length,
                accountCount: accounts.length,
                orphanedCount: orphanedTransactions.length,
                isHealthy: orphanedTransactions.length === 0
            };

        } catch (error) {
            console.error('Data integrity check failed:', error);
            return {
                transactionCount: 0,
                accountCount: 0,
                orphanedCount: 0,
                isHealthy: false,
                error: error.message
            };
        }
    }

    // Cleanup function with enhanced cleanup
    container.cleanup = () => {
        window.removeEventListener('resize', updateResponsiveLayout);
        window.removeEventListener('orientationchange', handleOrientationChange);
        window.removeEventListener('storage-updated', handleStorageUpdate);
        window.removeEventListener('auth-state-changed', handleAuthChange);
        window.removeEventListener('navigation-state-changed', handleNavigationStateChange);
        window.removeEventListener('keydown', handleKeyboardShortcuts);
        
        // Clean up visual viewport listener
        if (window.visualViewport) {
            window.visualViewport.removeEventListener('resize', updateVisualViewportHeight);
        }
        
        // Clear any pending refresh timeouts
        if (container._refreshTimeout) {
            clearTimeout(container._refreshTimeout);
        }
        
        // Clean up TimePeriodSelector component
        if (timePeriodSelectorComponent && timePeriodSelectorComponent.cleanup) {
            timePeriodSelectorComponent.cleanup();
        }
        
        // Clean up charts and analytics cache
        cleanupCharts();
        analyticsEngine.clearCache();
        
        // Reset visual viewport height
        document.documentElement.style.removeProperty('--visual-viewport-height');
    };

    // Expose useful methods for external access
    container.refreshData = refreshData;
    container.checkDataIntegrity = checkDataIntegrity;
    container.getCurrentData = () => currentData;
    container.getCurrentTimePeriod = () => currentTimePeriod;

    // Initial data load
    loadReportData();

    // Cleanup function for global error handlers
    container.cleanup = () => {
        // Restore original error handlers
        window.onerror = originalOnError;
        window.onunhandledrejection = originalOnUnhandledRejection;
        
        // Remove scroll event listener
        window.removeEventListener('scroll', toggleFloatingButton);
        
        // Clean up charts
        cleanupCharts();
        
        // Cancel any ongoing progressive loading
        if (progressiveLoader.isCurrentlyLoading()) {
            progressiveLoader.cancelLoading();
        }
        
        console.log('[ReportsView] Cleanup completed');
    };

    return container;
};

/**
 * Helper functions for time period calculations
 */

function getCurrentWeekPeriod() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
    endOfWeek.setHours(23, 59, 59, 999);
    
    return {
        type: 'weekly',
        startDate: startOfWeek,
        endDate: endOfWeek,
        label: 'This Week'
    };
}

function getCurrentMonthPeriod() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);
    
    return {
        type: 'monthly',
        startDate: startOfMonth,
        endDate: endOfMonth,
        label: 'This Month'
    };
}

/**
 * Check browser support for required features
 * Requirements: 9.5 - Graceful degradation for unsupported browsers
 */
function checkBrowserSupport() {
    const requiredFeatures = {
        'ES6 Classes': () => {
            try {
                eval('class TestClass {}');
                return true;
            } catch (e) {
                return false;
            }
        },
        'Promises': () => typeof Promise !== 'undefined',
        'Fetch API': () => typeof fetch !== 'undefined',
        'Canvas': () => {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext && canvas.getContext('2d'));
        },
        'Local Storage': () => {
            try {
                localStorage.setItem('test', 'test');
                localStorage.removeItem('test');
                return true;
            } catch (e) {
                return false;
            }
        },
        'CSS Grid': () => {
            const div = document.createElement('div');
            return 'grid' in div.style;
        }
    };

    const optionalFeatures = {
        'Web Workers': () => typeof Worker !== 'undefined',
        'Intersection Observer': () => typeof IntersectionObserver !== 'undefined',
        'CSS Custom Properties': () => {
            const div = document.createElement('div');
            div.style.setProperty('--test', 'test');
            return div.style.getPropertyValue('--test') === 'test';
        },
        'Performance API': () => typeof performance !== 'undefined' && typeof performance.now === 'function'
    };

    const missingFeatures = [];
    const limitedFeatures = [];

    // Check required features
    for (const [feature, check] of Object.entries(requiredFeatures)) {
        if (!check()) {
            missingFeatures.push(feature);
        }
    }

    // Check optional features
    for (const [feature, check] of Object.entries(optionalFeatures)) {
        if (!check()) {
            limitedFeatures.push(feature);
        }
    }

    return {
        isSupported: missingFeatures.length === 0,
        hasLimitedSupport: limitedFeatures.length > 0,
        missingFeatures,
        limitedFeatures
    };
}

function getCurrentQuarterPeriod() {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3);
    const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
    const endOfQuarter = new Date(now.getFullYear(), quarter * 3 + 3, 0);
    endOfQuarter.setHours(23, 59, 59, 999);
    
    return {
        type: 'quarterly',
        startDate: startOfQuarter,
        endDate: endOfQuarter,
        label: 'This Quarter'
    };
}

function getCurrentYearPeriod() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31);
    endOfYear.setHours(23, 59, 59, 999);
    
    return {
        type: 'yearly',
        startDate: startOfYear,
        endDate: endOfYear,
        label: 'This Year'
    };
}

function formatTimePeriod(timePeriod) {
    const startDate = timePeriod.startDate.toLocaleDateString();
    const endDate = timePeriod.endDate.toLocaleDateString();
    return `${startDate} - ${endDate}`;
}