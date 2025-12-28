/**
 * Reports UI Components
 * 
 * UI component creation functions for reports view including
 * loading states, error states, empty states, and browser warnings.
 */

import { COLORS, SPACING, BREAKPOINTS } from './constants.js';
import { Router } from '../core/router.js';

/**
 * Create loading state component with progress indicator
 */
export function createLoadingState() {
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
 */
export function updateLoadingProgress(loadingState, progress, message) {
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
 * Create empty state component with different scenarios
 */
export function createEmptyState() {
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
 * Show empty state with different scenarios
 */
export function showEmptyState(emptyState, scenario, currentTimePeriod, formatTimePeriod) {
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
}

/**
 * Create error state component
 */
export function createErrorState() {
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
 * Show error state with custom message
 */
export function showErrorState(errorState, customMessage, onRetry) {
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
    retryButton.addEventListener('click', () => {
        if (onRetry) onRetry();
    });

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
}

/**
 * Show unsupported browser error
 */
export function showUnsupportedBrowserError(container, missingFeatures) {
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
export function showBrowserWarning(container, limitedFeatures) {
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
 * Show performance warning to user
 */
export function showPerformanceWarning(container, processingTime) {
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
 * Show warning when some charts fail to render
 */
export function showChartRenderingWarning(container, failedCharts) {
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

