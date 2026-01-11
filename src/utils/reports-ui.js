/**
 * Reports UI Components
 *
 * UI component creation functions for reports view including
 * loading states, error states, empty states, and browser warnings.
 */

import { COLORS, SPACING } from './constants.js';
import { Router } from '../core/router.js';
import { dom } from './dom-factory.js';

/**
 * Create loading state component with progress indicator
 */
export function createLoadingState() {
  const progressBar = dom.div({
    className: 'progress-bar',
    style: {
      width: '0%',
      height: '100%',
      background: COLORS.PRIMARY,
      borderRadius: '2px',
      transition: 'width 0.3s ease',
    },
  });

  const progressContainer = dom.div({
    className: 'progress-container',
    style: {
      width: '200px',
      height: '4px',
      background: COLORS.BORDER,
      borderRadius: '2px',
      overflow: 'hidden',
      display: 'none',
    },
    children: [progressBar],
  });

  const progressText = dom.div({
    className: 'progress-text',
    style: {
      fontSize: '0.875rem',
      color: COLORS.TEXT_MUTED,
      marginTop: SPACING.SM,
      display: 'none',
    },
  });

  const spinner = dom.div({
    className: 'loading-spinner',
    attributes: { 'aria-hidden': 'true' },
    style: {
      width: '40px',
      height: '40px',
      border: `3px solid ${COLORS.BORDER}`,
      borderTop: `3px solid ${COLORS.PRIMARY}`,
      borderRadius: '50%',
    },
  });

  // Handle reduced motion
  if (
    !window.matchMedia ||
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    spinner.style.animation = 'spin 1s linear infinite';
  }

  const loadingText = dom.p({
    textContent: 'Loading your financial insights...',
    style: { margin: '0', fontSize: '1rem' },
    attributes: { 'aria-live': 'polite' },
  });

  const loadingEl = dom.div({
    className: 'loading-state',
    attributes: {
      role: 'status',
      'aria-live': 'polite',
      'aria-label': 'Loading financial reports',
    },
    style: {
      display: 'none',
      flex: '1',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      gap: SPACING.MD,
      color: COLORS.TEXT_MUTED,
    },
    children: [spinner, loadingText, progressContainer, progressText],
  });

  // Ensure style is added
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
  return dom.div({
    className: 'empty-state',
    attributes: {
      role: 'status',
      'aria-live': 'polite',
    },
    style: {
      display: 'none',
      flex: '1',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      gap: SPACING.LG,
      color: COLORS.TEXT_MUTED,
      textAlign: 'center',
      padding: SPACING.XL,
    },
  });
}

/**
 * Show empty state with different scenarios
 */
export function showEmptyState(
  emptyState,
  scenario,
  currentTimePeriod,
  formatTimePeriod
) {
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
  addButton.style.padding = `${SPACING.MD} ${SPACING.XL}`;
  addButton.style.background = COLORS.PRIMARY;
  addButton.style.color = 'white';
  addButton.style.border = 'none';
  addButton.style.borderRadius = 'var(--radius-md)';
  addButton.style.cursor = 'pointer';
  addButton.style.fontSize = 'var(--font-size-md)';
  addButton.style.fontWeight = '500';
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
  } else {
    icon.innerHTML = '📊';
    message.innerHTML = `
            <h3 style="margin: 0 0 ${SPACING.SM} 0; color: ${COLORS.TEXT_MAIN};">No Data Available</h3>
            <p style="margin: 0; max-width: 300px; line-height: 1.5;">
                No data to display at this time.
            </p>
        `;
    addButton.textContent = 'Back to Dashboard';
    addButton.addEventListener('click', () => Router.navigate('dashboard'));
  }
  emptyState.appendChild(icon);
  emptyState.appendChild(message);
  emptyState.appendChild(addButton);
}

/**
 * Create error state component
 */
export function createErrorState() {
  return dom.div({
    className: 'error-state',
    attributes: {
      role: 'alert',
      'aria-live': 'assertive',
    },
    style: {
      display: 'none',
      flex: '1',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      gap: SPACING.LG,
      color: COLORS.ERROR,
      textAlign: 'center',
      padding: SPACING.XL,
    },
  });
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
  const errorTitle = customMessage
    ? 'Error Loading Reports'
    : 'Unable to Load Reports';
  const errorDescription =
    customMessage ||
    'There was an error loading your financial data. Please try again.';

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
  retryButton.style.padding = `${SPACING.MD} ${SPACING.XL}`;
  retryButton.style.background = 'transparent';
  retryButton.style.color = COLORS.PRIMARY;
  retryButton.style.border = `1px solid ${COLORS.PRIMARY}`;
  retryButton.style.borderRadius = 'var(--radius-md)';
  retryButton.style.cursor = 'pointer';
  retryButton.style.fontSize = 'var(--font-size-md)';
  retryButton.style.fontWeight = '500';
  retryButton.addEventListener('click', () => {
    if (onRetry) onRetry();
  });

  // Go to dashboard button
  const dashboardButton = document.createElement('button');
  dashboardButton.textContent = 'Back to Dashboard';
  dashboardButton.className = 'btn btn-ghost';
  dashboardButton.style.padding = `${SPACING.MD} ${SPACING.XL}`;
  dashboardButton.style.background = 'transparent';
  dashboardButton.style.color = COLORS.TEXT_MUTED;
  dashboardButton.style.border = 'none';
  dashboardButton.style.borderRadius = 'var(--radius-md)';
  dashboardButton.style.cursor = 'pointer';
  dashboardButton.style.fontSize = 'var(--font-size-md)';
  dashboardButton.style.fontWeight = '500';
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

  const message = document.createElement('div');
  message.textContent =
    "Your browser doesn't support some features required for BlinkBudget to work properly.";
  message.style.color = COLORS.TEXT_MUTED;
  message.style.lineHeight = '1.6';
  message.style.marginBottom = SPACING.LG;

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  const featuresList = document.createElement('div');
  featuresList.innerHTML = `
        <strong>Missing features:</strong><br>
        ${missingFeatures.map(f => escapeHtml(f)).join(', ')}
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
 * Show browser compatibility warning to user
 */
export function showBrowserWarning(container, limitedFeatures) {
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

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
        Missing: ${limitedFeatures.map(f => escapeHtml(f)).join(', ')}
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
  const closeBtn = dom.button({
    innerHTML: '×',
    style: {
      float: 'right',
      background: 'none',
      border: 'none',
      fontSize: '1.2rem',
      cursor: 'pointer',
      color: '#92400e',
    },
  });

  const warning = dom.div({
    style: {
      background: 'rgba(251, 191, 36, 0.1)',
      border: '1px solid rgba(251, 191, 36, 0.3)',
      borderRadius: 'var(--radius-md)',
      padding: SPACING.MD,
      margin: `${SPACING.MD} 0`,
      fontSize: '0.875rem',
      color: '#92400e',
    },
    innerHTML: `
            ⏱️ <strong>Performance Notice:</strong> 
            Report loading took ${(processingTime / 1000).toFixed(1)} seconds. 
            Consider reducing the time period or clearing old data for better performance.
        `,
    children: [closeBtn],
  });

  closeBtn.addEventListener('click', () => warning.remove());

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
  const closeBtn = dom.button({
    innerHTML: '×',
    style: {
      float: 'right',
      background: 'none',
      border: 'none',
      fontSize: '1.2rem',
      cursor: 'pointer',
      color: '#dc2626',
    },
  });

  const failedChartNames = failedCharts.map(chart => chart.name).join(', ');
  const warning = dom.div({
    style: {
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      borderRadius: 'var(--radius-md)',
      padding: SPACING.MD,
      margin: `${SPACING.MD} 0`,
      fontSize: '0.875rem',
      color: '#dc2626',
    },
    innerHTML: `
            ⚠️ <strong>Chart Rendering Issues:</strong> 
            Some charts couldn't be displayed (${failedChartNames}). 
            Fallback displays are shown instead. Try refreshing the page if the issue persists.
        `,
    children: [closeBtn],
  });

  closeBtn.addEventListener('click', () => warning.remove());

  // Insert at the top of content
  const content = container.querySelector('.reports-content');
  if (content && content.firstChild) {
    content.insertBefore(warning, content.firstChild);
  } else {
    container.appendChild(warning);
  }
}
