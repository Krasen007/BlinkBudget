/**
 * Enhanced Empty States
 *
 * Provides beautiful, engaging empty states with illustrations and CTAs
 * to guide users when they have no data
 */

import { COLORS, SPACING, FONT_SIZES } from './constants.js';

/**
 * Empty state scenarios
 */
export const EMPTY_STATE_SCENARIOS = {
  NO_TRANSACTIONS: 'no-transactions',
  NO_TRANSACTIONS_PERIOD: 'no-transactions-period',
  NO_DATA: 'no-data',
  FILTER_NO_RESULTS: 'filter-no-results',
  SYNC_NO_DATA: 'sync-no-data',
};

/**
 * Empty state icons and illustrations
 */
const EMPTY_STATE_ICONS = {
  [EMPTY_STATE_SCENARIOS.NO_TRANSACTIONS]: {
    emoji: '📊',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M3 3v18h18"/>
      <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
    </svg>`,
  },
  [EMPTY_STATE_SCENARIOS.NO_TRANSACTIONS_PERIOD]: {
    emoji: '📅',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>`,
  },
  [EMPTY_STATE_SCENARIOS.NO_DATA]: {
    emoji: '📋',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10,9 9,9 8,9"/>
    </svg>`,
  },
  [EMPTY_STATE_SCENARIOS.FILTER_NO_RESULTS]: {
    emoji: '🔍',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
    </svg>`,
  },
  [EMPTY_STATE_SCENARIOS.SYNC_NO_DATA]: {
    emoji: '☁️',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
    </svg>`,
  },
};

/**
 * Empty state content configurations
 */
const EMPTY_STATE_CONTENT = {
  [EMPTY_STATE_SCENARIOS.NO_TRANSACTIONS]: {
    title: 'No Transactions Yet',
    message:
      'Start tracking your expenses to see beautiful insights about your spending patterns.',
    primaryAction: {
      text: 'Add Your First Transaction',
      action: 'add-transaction',
    },
    secondaryActions: [
      {
        text: 'View Tutorial',
        action: 'show-tutorial',
      },
    ],
    tips: [
      'Try to log expenses within 3 clicks',
      'Use categories to organize spending',
      'Set goals to track your progress',
    ],
  },
  [EMPTY_STATE_SCENARIOS.NO_TRANSACTIONS_PERIOD]: {
    title: 'No Transactions This Period',
    message: 'There are no transactions for the selected time period.',
    primaryAction: {
      text: 'Change Time Period',
      action: 'change-period',
    },
    secondaryActions: [
      {
        text: 'Add Transaction',
        action: 'add-transaction',
      },
    ],
    tips: [
      'Try selecting a different time range',
      'Check if you have any transactions in other periods',
    ],
  },
  [EMPTY_STATE_SCENARIOS.NO_DATA]: {
    title: 'No Data Available',
    message: "There's no data to display for this view.",
    primaryAction: {
      text: 'Refresh',
      action: 'refresh',
    },
    secondaryActions: [],
    tips: ['Try refreshing the page', 'Check your internet connection'],
  },
  [EMPTY_STATE_SCENARIOS.FILTER_NO_RESULTS]: {
    title: 'No Matching Results',
    message: 'No transactions match your current filters.',
    primaryAction: {
      text: 'Clear Filters',
      action: 'clear-filters',
    },
    secondaryActions: [
      {
        text: 'Adjust Filters',
        action: 'adjust-filters',
      },
    ],
    tips: [
      'Try broadening your search criteria',
      'Check spelling in search terms',
    ],
  },
  [EMPTY_STATE_SCENARIOS.SYNC_NO_DATA]: {
    title: 'No Synced Data',
    message: "Your data hasn't been synced to the cloud yet.",
    primaryAction: {
      text: 'Sync Now',
      action: 'sync',
    },
    secondaryActions: [
      {
        text: 'Add Transaction',
        action: 'add-transaction',
      },
    ],
    tips: [
      'Sync to access your data on multiple devices',
      'Enable auto-sync for convenience',
    ],
  },
};

/**
 * Create enhanced empty state element
 * @param {string} scenario - Empty state scenario
 * @param {Object} options - Configuration options
 * @param {Function} options.onAction - Action handler callback
 * @param {boolean} options.showTips - Whether to show helpful tips
 * @param {boolean} options.compact - Compact version for small spaces
 * @returns {HTMLElement} Empty state element
 */
export function createEnhancedEmptyState(scenario, options = {}) {
  const { onAction, showTips = true, compact = false } = options;

  const content = EMPTY_STATE_CONTENT[scenario];
  const icons = EMPTY_STATE_ICONS[scenario];

  if (!content || !icons) {
    console.warn(`Unknown empty state scenario: ${scenario}`);
    return createBasicEmptyState('No data available');
  }

  const container = document.createElement('div');
  container.className = `empty-state empty-state--${scenario} ${compact ? 'empty-state--compact' : ''}`;

  // Container styles
  Object.assign(container.style, {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: compact ? SPACING.XL : SPACING.XXXL,
    minHeight: compact ? '200px' : '400px',
    color: COLORS.TEXT_MUTED,
    opacity: '0',
    transform: 'translateY(20px)',
    transition: `opacity ${300}ms ease-out, transform ${300}ms ease-out`,
  });

  // Icon container
  const iconContainer = document.createElement('div');
  iconContainer.className = 'empty-state__icon';
  Object.assign(iconContainer.style, {
    fontSize: compact ? '3rem' : '4rem',
    marginBottom: SPACING.LG,
    opacity: '0.6',
    animation: 'float 3s ease-in-out infinite',
  });
  iconContainer.textContent = icons.emoji;

  // Title
  const title = document.createElement('h3');
  title.className = 'empty-state__title';
  title.textContent = content.title;
  Object.assign(title.style, {
    margin: `0 0 ${SPACING.SM} 0`,
    fontSize: compact ? FONT_SIZES.LG : FONT_SIZES.XL,
    fontWeight: '600',
    color: COLORS.TEXT_MAIN,
  });

  // Message
  const message = document.createElement('p');
  message.className = 'empty-state__message';
  message.textContent = content.message;
  Object.assign(message.style, {
    margin: `0 0 ${SPACING.LG} 0`,
    fontSize: FONT_SIZES.MD,
    lineHeight: '1.5',
    maxWidth: '400px',
  });

  container.appendChild(iconContainer);
  container.appendChild(title);
  container.appendChild(message);

  // Primary action button
  if (content.primaryAction) {
    const primaryButton = createActionButton(content.primaryAction, 'primary');
    container.appendChild(primaryButton);
  }

  // Secondary actions
  if (content.secondaryActions && content.secondaryActions.length > 0) {
    const secondaryContainer = document.createElement('div');
    secondaryContainer.className = 'empty-state__secondary-actions';
    Object.assign(secondaryContainer.style, {
      display: 'flex',
      gap: SPACING.SM,
      marginTop: SPACING.MD,
      flexWrap: 'wrap',
      justifyContent: 'center',
    });

    content.secondaryActions.forEach(action => {
      const secondaryButton = createActionButton(action, 'secondary');
      secondaryContainer.appendChild(secondaryButton);
    });

    container.appendChild(secondaryContainer);
  }

  // Tips section
  if (showTips && content.tips && content.tips.length > 0 && !compact) {
    const tipsContainer = document.createElement('div');
    tipsContainer.className = 'empty-state__tips';

    Object.assign(tipsContainer.style, {
      marginTop: SPACING.XL,
      padding: `${SPACING.MD} ${SPACING.LG}`,
      backgroundColor: `color-mix(in srgb, ${COLORS.BACKGROUND_MUTED} 12.5%, transparent)`,
      borderRadius: '8px',
      border: `1px solid color-mix(in srgb, ${COLORS.BORDER} 12.5%, transparent)`,
    });

    const tipsTitle = document.createElement('h4');
    tipsTitle.textContent = '💡 Quick Tips';
    Object.assign(tipsTitle.style, {
      margin: `0 0 ${SPACING.SM} 0`,
      fontSize: FONT_SIZES.SM,
      fontWeight: '600',
      color: COLORS.TEXT_MAIN,
    });

    const tipsList = document.createElement('ul');
    tipsList.style.cssText = `
      margin: 0;
      padding-left: ${SPACING.MD};
      text-align: left;
    `;

    content.tips.forEach(tip => {
      const tipItem = document.createElement('li');
      tipItem.textContent = tip;
      tipItem.style.cssText = `
        margin-bottom: ${SPACING.XS};
        font-size: ${FONT_SIZES.SM};
        line-height: 1.4;
      `;
      tipsList.appendChild(tipItem);
    });

    tipsContainer.appendChild(tipsTitle);
    tipsContainer.appendChild(tipsList);
    container.appendChild(tipsContainer);
  }

  // Action button creation helper
  function createActionButton(action, type = 'primary') {
    const button = document.createElement('button');
    button.className = `empty-state__button empty-state__button--${type}`;
    button.textContent = action.text;

    const isPrimary = type === 'primary';
    Object.assign(button.style, {
      padding: `${SPACING.SM} ${SPACING.LG}`,
      fontSize: FONT_SIZES.MD,
      fontWeight: '500',
      borderRadius: '6px',
      border: isPrimary ? 'none' : `1px solid ${COLORS.BORDER}`,
      backgroundColor: isPrimary ? COLORS.PRIMARY : 'transparent',
      color: isPrimary ? 'white' : COLORS.PRIMARY,
      cursor: 'pointer',
      transition: `all ${200}ms ease`,
      textDecoration: 'none',
    });

    button.addEventListener('mouseenter', () => {
      if (isPrimary) {
        button.style.backgroundColor = COLORS.PRIMARY_DARK;
      } else {
        button.style.backgroundColor = `${COLORS.PRIMARY}10`;
      }
    });

    button.addEventListener('mouseleave', () => {
      if (isPrimary) {
        button.style.backgroundColor = COLORS.PRIMARY;
      } else {
        button.style.backgroundColor = 'transparent';
      }
    });

    button.addEventListener('click', () => {
      if (onAction) {
        onAction(action.action);
      }
    });

    return button;
  }

  // Animate in - Use CSS transitions instead of rAF
  container.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  container.style.opacity = '1';
  container.style.transform = 'translateY(0)';

  return container;
}

/**
 * Create basic empty state (fallback)
 * @param {string} message - Empty state message
 * @returns {HTMLElement} Basic empty state element
 */
function createBasicEmptyState(message) {
  const container = document.createElement('div');
  container.className = 'empty-state empty-state--basic';
  container.textContent = message;

  Object.assign(container.style, {
    padding: SPACING.XL,
    textAlign: 'center',
    color: COLORS.TEXT_MUTED,
    fontStyle: 'italic',
  });

  return container;
}

/**
 * Update empty state with new scenario
 * @param {HTMLElement} container - Container element
 * @param {string} scenario - New scenario
 * @param {Object} options - Configuration options
 */
export function updateEmptyState(container, scenario, options = {}) {
  if (!container || !(container instanceof HTMLElement)) {
    console.warn('updateEmptyState: Invalid container element');
    return;
  }
  container.innerHTML = '';
  const newEmptyState = createEnhancedEmptyState(scenario, options);
  container.appendChild(newEmptyState);
}

/**
 * Add floating animation CSS
 */
export function addEmptyStateStyles() {
  const styleId = 'empty-state-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
    
    .empty-state__button:focus {
      outline: 2px solid ${COLORS.PRIMARY};
      outline-offset: 2px;
    }
    
    @media (max-width: 768px) {
      .empty-state {
        padding: ${SPACING.LG} ${SPACING.MD} !important;
        min-height: 300px !important;
      }
      
      .empty-state__secondary-actions {
        flex-direction: column !important;
        width: 100%;
      }
      
      .empty-state__button {
        width: 100%;
      }
    }
  `;

  document.head.appendChild(style);
}

// Initialize styles when module is imported (browser only)
if (typeof document !== 'undefined') {
  addEmptyStateStyles();
}
