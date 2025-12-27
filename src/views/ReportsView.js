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
import { StorageService } from '../core/storage.js';
import { Router } from '../core/router.js';
import { COLORS, SPACING, BREAKPOINTS, DIMENSIONS, TIMING } from '../utils/constants.js';
import { debounce } from '../utils/touch-utils.js';

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
    let currentTimePeriod = getCurrentMonthPeriod();
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

    // Main content area
    const content = document.createElement('div');
    content.className = 'reports-content';
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
     * Requirements: 1.2, 2.5
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
        const headerEl = document.createElement('div');
        headerEl.className = 'reports-header';
        headerEl.style.display = 'flex';
        headerEl.style.justifyContent = 'space-between';
        headerEl.style.alignItems = 'center';
        headerEl.style.marginBottom = SPACING.MD;
        headerEl.style.flexShrink = '0';

        // Title
        const title = document.createElement('h1');
        title.textContent = 'Reports & Insights';
        title.style.margin = '0';
        title.style.color = COLORS.TEXT_MAIN;
        title.style.fontSize = window.innerWidth < BREAKPOINTS.MOBILE ? '1.5rem' : '2rem';

        // Back button (for mobile)
        const backButton = document.createElement('button');
        backButton.innerHTML = '← Dashboard';
        backButton.className = 'btn btn-ghost';
        backButton.style.padding = `${SPACING.SM} ${SPACING.MD}`;
        backButton.style.border = 'none';
        backButton.style.background = 'transparent';
        backButton.style.color = COLORS.TEXT_MUTED;
        backButton.style.cursor = 'pointer';
        backButton.style.borderRadius = 'var(--radius-md)';
        backButton.addEventListener('click', () => Router.navigate('dashboard'));

        // Show back button only on mobile
        if (window.innerWidth < BREAKPOINTS.MOBILE) {
            headerEl.appendChild(backButton);
        }
        headerEl.appendChild(title);

        return headerEl;
    }

    /**
     * Create loading state component
     */
    function createLoadingState() {
        const loadingEl = document.createElement('div');
        loadingEl.className = 'loading-state';
        loadingEl.style.display = 'none';
        loadingEl.style.flex = '1';
        loadingEl.style.justifyContent = 'center';
        loadingEl.style.alignItems = 'center';
        loadingEl.style.flexDirection = 'column';
        loadingEl.style.gap = SPACING.MD;
        loadingEl.style.color = COLORS.TEXT_MUTED;

        // Loading spinner
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.style.width = '40px';
        spinner.style.height = '40px';
        spinner.style.border = `3px solid ${COLORS.BORDER}`;
        spinner.style.borderTop = `3px solid ${COLORS.PRIMARY}`;
        spinner.style.borderRadius = '50%';
        spinner.style.animation = 'spin 1s linear infinite';

        // Add CSS animation for spinner
        if (!document.querySelector('#loading-spinner-styles')) {
            const style = document.createElement('style');
            style.id = 'loading-spinner-styles';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }

        const loadingText = document.createElement('p');
        loadingText.textContent = 'Loading your financial insights...';
        loadingText.style.margin = '0';
        loadingText.style.fontSize = '1rem';

        loadingEl.appendChild(spinner);
        loadingEl.appendChild(loadingText);

        return loadingEl;
    }

    /**
     * Create empty state component with different scenarios
     */
    function createEmptyState() {
        const emptyEl = document.createElement('div');
        emptyEl.className = 'empty-state';
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
     * Create error state component with custom messages
     */
    function createErrorState() {
        const errorEl = document.createElement('div');
        errorEl.className = 'error-state';
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
     * Create chart container for displaying visualizations
     */
    function createChartContainer() {
        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-container';
        chartContainer.style.display = 'flex';
        chartContainer.style.flexDirection = 'column';
        chartContainer.style.gap = SPACING.LG;
        chartContainer.style.padding = SPACING.MD;
        chartContainer.style.background = COLORS.SURFACE;
        chartContainer.style.borderRadius = 'var(--radius-lg)';
        chartContainer.style.border = `1px solid ${COLORS.BORDER}`;

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
    function renderReports() {
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
            
            placeholder.innerHTML = dataInfo;
            chartContainer.appendChild(placeholder);

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
     * Handle responsive layout updates
     */
    const updateResponsiveLayout = debounce(() => {
        const isMobile = window.innerWidth < BREAKPOINTS.MOBILE;
        
        // Update header title size
        const title = header.querySelector('h1');
        if (title) {
            title.style.fontSize = isMobile ? '1.5rem' : '2rem';
        }

        // The TimePeriodSelector component handles its own responsive updates
        // No need to manually update button sizes here

        // Update back button visibility
        const backButton = header.querySelector('.btn-ghost');
        if (backButton) {
            backButton.style.display = isMobile ? 'block' : 'none';
        }
    }, TIMING.DEBOUNCE_RESIZE);

    // Event listeners
    window.addEventListener('resize', updateResponsiveLayout);
    window.addEventListener('orientationchange', () => {
        setTimeout(updateResponsiveLayout, TIMING.DEBOUNCE_ORIENTATION);
    });

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

    window.addEventListener('storage-updated', handleStorageUpdate);
    window.addEventListener('auth-state-changed', handleAuthChange);

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

    // Cleanup function
    container.cleanup = () => {
        window.removeEventListener('resize', updateResponsiveLayout);
        window.removeEventListener('orientationchange', updateResponsiveLayout);
        window.removeEventListener('storage-updated', handleStorageUpdate);
        window.removeEventListener('auth-state-changed', handleAuthChange);
        
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