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
    container.style.height = '100%';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.padding = `0 ${SPACING.MD}`;
    container.style.overflow = 'hidden';

    // Initialize analytics engine and chart renderer
    const analyticsEngine = new AnalyticsEngine();
    const chartRenderer = new ChartRenderer();

    // State management
    let currentTimePeriod = NavigationState.restoreTimePeriod() || getCurrentMonthPeriod();
    let isLoading = false;
    let currentData = null;
    let activeCharts = new Map(); // Track active chart instances for cleanup
    let timePeriodSelectorComponent = null; // Reference to the time period selector

    // Header section
    const header = createHeader();
    container.appendChild(header);

    // Time period selector - using the new component
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
    content.style.flex = '1';
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    content.style.minHeight = '0';
    content.style.overflow = 'auto';
    content.style.gap = SPACING.LG;
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

        // Title with proper heading hierarchy
        const title = document.createElement('h1');
        title.textContent = 'Reports & Insights';
        title.style.margin = '0';
        title.style.color = COLORS.TEXT_MAIN;
        title.style.fontSize = window.innerWidth < BREAKPOINTS.MOBILE ? '1.5rem' : '2rem';
        title.id = 'reports-title';

        headerEl.appendChild(title);

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
        
        headerEl.appendChild(rightSide);

        return headerEl;
    }

    /**
     * Create loading state component with accessibility
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

        loadingEl.appendChild(spinner);
        loadingEl.appendChild(loadingText);

        return loadingEl;
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
     * Load and display report data with comprehensive error handling
     * Requirements: 9.1, 9.5, 1.6, 5.5
     */
    async function loadReportData() {
        if (isLoading) return;

        try {
            isLoading = true;
            showLoadingState();

            // Performance monitoring - start timer
            const startTime = Date.now();
            
            // Get transaction data from storage with error handling
            let transactions;
            try {
                transactions = StorageService.getAll();
                
                // Validate transaction data structure
                if (!Array.isArray(transactions)) {
                    throw new Error('Invalid transaction data format - expected array');
                }

                // Validate individual transactions
                transactions = validateAndCleanTransactions(transactions);
                
            } catch (storageError) {
                console.error('Storage access error:', storageError);
                throw new Error('Unable to access transaction data. Please check your browser storage settings.');
            }
            
            // Filter transactions for the selected time period
            let filteredTransactions;
            try {
                filteredTransactions = analyticsEngine.filterTransactionsByTimePeriod(
                    transactions, 
                    currentTimePeriod
                );

                // Validate filtered results
                if (!Array.isArray(filteredTransactions)) {
                    throw new Error('Transaction filtering failed');
                }

            } catch (filterError) {
                console.error('Transaction filtering error:', filterError);
                throw new Error('Unable to filter transactions for the selected time period.');
            }

            // Check if we have data after filtering
            if (filteredTransactions.length === 0) {
                // Check if we have any transactions at all
                if (transactions.length === 0) {
                    showEmptyState('no-transactions');
                } else {
                    showEmptyState('no-data-for-period');
                }
                isLoading = false;
                return;
            }

            // Calculate analytics data with individual error handling
            let analyticsData;
            try {
                const categoryBreakdown = analyticsEngine.calculateCategoryBreakdown(
                    transactions, 
                    currentTimePeriod
                );
                const incomeVsExpenses = analyticsEngine.calculateIncomeVsExpenses(
                    transactions, 
                    currentTimePeriod
                );
                const costOfLiving = analyticsEngine.calculateCostOfLiving(
                    transactions, 
                    currentTimePeriod
                );

                // Validate calculation results
                validateAnalyticsResults(categoryBreakdown, incomeVsExpenses, costOfLiving);

                analyticsData = {
                    categoryBreakdown,
                    incomeVsExpenses,
                    costOfLiving,
                    transactions: filteredTransactions
                };

            } catch (analyticsError) {
                console.error('Analytics calculation error:', analyticsError);
                
                // Try to provide partial data if possible
                try {
                    const basicData = createFallbackAnalytics(filteredTransactions);
                    analyticsData = basicData;
                    console.warn('Using fallback analytics due to calculation error');
                } catch (fallbackError) {
                    console.error('Fallback analytics failed:', fallbackError);
                    throw new Error('Unable to process your financial data. Please try again.');
                }
            }

            // Store current data for chart rendering
            currentData = analyticsData;

            // Performance check - ensure we meet the 2-second requirement (Requirement 7.5)
            const processingTime = Date.now() - startTime;
            if (processingTime > 2000) {
                console.warn(`Report loading took ${processingTime}ms, exceeding 2-second target`);
            }

            // Ensure minimum loading time for better UX (but don't exceed 2 seconds total)
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, Math.min(500 - elapsedTime, 2000 - elapsedTime));
            
            setTimeout(() => {
                renderReports();
                isLoading = false;
            }, remainingTime);

        } catch (error) {
            console.error('Error loading report data:', error);
            showErrorState(error.message || 'An unexpected error occurred while loading your reports.');
            isLoading = false;
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
            
            // Render beautiful charts with category selection
            await renderCharts(chartContainer);

            // Add Back to Dashboard button after charts
            const backButton = Button({
                text: '← Back to Dashboard',
                onClick: () => Router.navigate('dashboard'),
                variant: 'ghost'
            });
            backButton.style.width = '100%';
            backButton.style.margin = '0';
            backButton.style.marginTop = SPACING.LG;
            backButton.style.flexShrink = '0';
            content.appendChild(backButton);

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
            chartsSection.style.display = 'flex';
            chartsSection.style.flexDirection = 'column';
            chartsSection.style.gap = SPACING.XL;

            // 1. Category Breakdown Pie Chart
            const categorySection = await createCategoryBreakdownChart();
            chartsSection.appendChild(categorySection);

            // 2. Income vs Expenses Bar Chart
            const incomeExpenseSection = await createIncomeExpenseChart();
            chartsSection.appendChild(incomeExpenseSection);

            // 3. Category Trends Over Time (if enough historical data)
            const trendsSection = await createCategoryTrendsChart();
            if (trendsSection) {
                chartsSection.appendChild(trendsSection);
            }

            // 4. Interactive Category Selector
            const categorySelectorSection = createCategorySelector();
            chartsSection.appendChild(categorySelectorSection);

            chartContainer.appendChild(chartsSection);

        } catch (error) {
            console.error('Error rendering charts:', error);
            
            // Fallback to basic data display
            const fallback = document.createElement('div');
            fallback.style.padding = SPACING.LG;
            fallback.style.textAlign = 'center';
            fallback.innerHTML = `
                <h3>Unable to render charts</h3>
                <p>Showing basic financial summary instead.</p>
                <div style="margin-top: ${SPACING.MD};">
                    <strong>Total Expenses:</strong> €${currentData.incomeVsExpenses.totalExpenses.toFixed(2)}<br>
                    <strong>Total Income:</strong> €${currentData.incomeVsExpenses.totalIncome.toFixed(2)}<br>
                    <strong>Net Balance:</strong> €${currentData.incomeVsExpenses.netBalance.toFixed(2)}
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
        section.className = 'chart-section';
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
        const chartData = {
            labels: categoryData.categories.map(cat => cat.name),
            datasets: [{
                data: categoryData.categories.map(cat => cat.amount),
                backgroundColor: [],
                borderColor: '#ffffff',
                borderWidth: 2
            }]
        };

        // Create initial pie chart
        let currentChart = chartRenderer.createPieChart(canvas, chartData, {
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
        pieBtn.addEventListener('click', () => {
            if (!pieBtn.classList.contains('active')) {
                chartRenderer.destroyChart(currentChart);
                currentChart = chartRenderer.createPieChart(canvas, chartData);
                setActiveToggle(pieBtn, doughnutBtn);
            }
        });

        doughnutBtn.addEventListener('click', () => {
            if (!doughnutBtn.classList.contains('active')) {
                chartRenderer.destroyChart(currentChart);
                currentChart = chartRenderer.createDoughnutChart(canvas, chartData);
                setActiveToggle(doughnutBtn, pieBtn);
            }
        });

        // Category details panel
        const detailsPanel = document.createElement('div');
        detailsPanel.id = 'category-details-panel';
        detailsPanel.style.display = 'none';
        detailsPanel.style.padding = SPACING.MD;
        detailsPanel.style.background = 'rgba(59, 130, 246, 0.05)';
        detailsPanel.style.borderRadius = 'var(--radius-md)';
        detailsPanel.style.border = '1px solid rgba(59, 130, 246, 0.2)';
        section.appendChild(detailsPanel);

        return section;
    }

    /**
     * Create income vs expenses bar chart
     */
    async function createIncomeExpenseChart() {
        const section = document.createElement('div');
        section.className = 'chart-section';
        section.style.background = COLORS.SURFACE;
        section.style.borderRadius = 'var(--radius-lg)';
        section.style.border = `1px solid ${COLORS.BORDER}`;
        section.style.padding = SPACING.LG;

        const title = document.createElement('h3');
        title.textContent = 'Income vs Expenses';
        title.style.margin = `0 0 ${SPACING.MD} 0`;
        title.style.color = COLORS.TEXT_MAIN;
        section.appendChild(title);

        const chartDiv = document.createElement('div');
        chartDiv.style.position = 'relative';
        chartDiv.style.height = '300px';

        const canvas = document.createElement('canvas');
        canvas.id = 'income-expense-chart';
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

        chartRenderer.createBarChart(canvas, chartData, {
            responsive: true,
            maintainAspectRatio: false
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
                borderColor: getChartColors(topCategories.length)[index],
                backgroundColor: getChartColors(topCategories.length)[index].replace(')', ', 0.1)').replace('hsl', 'hsla'),
                borderWidth: 3,
                fill: false,
                tension: 0.4
            }))
        };

        chartRenderer.createLineChart(canvas, chartData, {
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
        categoryGrid.style.display = 'grid';
        categoryGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
        categoryGrid.style.gap = SPACING.MD;

        currentData.categoryBreakdown.categories.forEach((category, index) => {
            const categoryCard = createCategoryCard(category, index);
            categoryGrid.appendChild(categoryCard);
        });

        section.appendChild(categoryGrid);

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

        // Category color indicator
        const colorIndicator = document.createElement('div');
        colorIndicator.style.width = '4px';
        colorIndicator.style.height = '40px';
        colorIndicator.style.background = getChartColors(currentData.categoryBreakdown.categories.length)[index];
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
        percentage.textContent = `${category.percentage.toFixed(1)}% of expenses`;
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
     * Show detailed information for a selected category
     */
    function showCategoryDetails(categoryName, amount, percentage) {
        const detailsPanel = document.getElementById('category-details-panel');
        if (!detailsPanel) return;

        // Get transactions for this category
        const categoryTransactions = currentData.transactions.filter(t => 
            (t.category || 'Uncategorized') === categoryName && t.type === 'expense'
        );

        detailsPanel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${SPACING.MD};">
                <h4 style="margin: 0; color: ${COLORS.TEXT_MAIN};">${categoryName} Details</h4>
                <button onclick="this.parentElement.parentElement.style.display='none'" 
                        style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: ${COLORS.TEXT_MUTED};">×</button>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: ${SPACING.MD}; margin-bottom: ${SPACING.MD};">
                <div>
                    <div style="font-size: 0.875rem; color: ${COLORS.TEXT_MUTED};">Total Spent</div>
                    <div style="font-size: 1.25rem; font-weight: bold; color: ${COLORS.PRIMARY};">€${amount.toFixed(2)}</div>
                </div>
                <div>
                    <div style="font-size: 0.875rem; color: ${COLORS.TEXT_MUTED};">Percentage</div>
                    <div style="font-size: 1.25rem; font-weight: bold; color: ${COLORS.PRIMARY};">${percentage.toFixed(1)}%</div>
                </div>
                <div>
                    <div style="font-size: 0.875rem; color: ${COLORS.TEXT_MUTED};">Transactions</div>
                    <div style="font-size: 1.25rem; font-weight: bold; color: ${COLORS.PRIMARY};">${categoryTransactions.length}</div>
                </div>
                <div>
                    <div style="font-size: 0.875rem; color: ${COLORS.TEXT_MUTED};">Average</div>
                    <div style="font-size: 1.25rem; font-weight: bold; color: ${COLORS.PRIMARY};">€${(amount / categoryTransactions.length).toFixed(2)}</div>
                </div>
            </div>
            <div style="margin-top: ${SPACING.MD};">
                <div style="font-size: 0.875rem; color: ${COLORS.TEXT_MUTED}; margin-bottom: ${SPACING.SM};">Recent Transactions:</div>
                <div style="max-height: 150px; overflow-y: auto;">
                    ${categoryTransactions.slice(0, 5).map(t => `
                        <div style="display: flex; justify-content: space-between; padding: ${SPACING.XS} 0; border-bottom: 1px solid ${COLORS.BORDER};">
                            <span style="color: ${COLORS.TEXT_MAIN};">${t.description || 'No description'}</span>
                            <span style="font-weight: 600; color: ${COLORS.ERROR};">€${t.amount.toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        detailsPanel.style.display = 'block';
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

    function getChartColors(count) {
        const colors = [
            'hsl(220, 70%, 50%)',   // Blue
            'hsl(142, 71%, 45%)',   // Green
            'hsl(0, 84%, 60%)',     // Red
            'hsl(38, 92%, 50%)',    // Orange
            'hsl(271, 81%, 56%)',   // Purple
            'hsl(198, 93%, 60%)',   // Cyan
            'hsl(48, 96%, 53%)',    // Yellow
            'hsl(339, 82%, 52%)',   // Pink
        ];
        
        return colors.slice(0, count);
    }

    /**
     * Clean up chart instances to prevent memory leaks
     */
    function cleanupCharts() {
        activeCharts.forEach((chart, key) => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        activeCharts.clear();
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