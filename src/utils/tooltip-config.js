/**
 * Tooltip Configuration - BlinkBudget Contextual Help
 * Defines tooltip content for key UI elements throughout the app
 */

export const TOOLTIP_CONFIG = {
  // Dashboard Tooltips
  dashboard: {
    'add-transaction': {
      content: 'Start here! Log expenses in just 3 clicks.',
      position: 'bottom',
      delay: 500,
    },
    'balance-card': {
      content:
        'Your total balance across all accounts. Tap an account name to filter.',
      position: 'top',
      delay: 300,
    },
    'transaction-item': {
      content: 'Tap to edit details. Swipe or click the red X to delete.',
      position: 'right',
      delay: 300,
    },
    'category-filter': {
      content: 'Click any category name to show only those transactions.',
      position: 'top',
      delay: 300,
    },
    'date-filter': {
      content: 'View transactions by date range. Great for weekly reviews!',
      position: 'top',
      delay: 300,
    },
    'quick-stats': {
      content: "Today's spending and monthly trends at a glance.",
      position: 'top',
      delay: 300,
    },
  },

  // Add Transaction Tooltips
  addTransaction: {
    'amount-input': {
      content: 'Enter the amount. BlinkBudget remembers your typical spending.',
      position: 'top',
      delay: 300,
    },
    'account-selector': {
      content: 'Choose where this money came from. Set favorites in Settings.',
      position: 'top',
      delay: 300,
    },
    'category-chips': {
      content: 'Just tap to save! No need to click a separate save button.',
      position: 'top',
      delay: 200,
    },
    'date-field': {
      content:
        'Change the date for past expenses. See ghost transactions for context.',
      position: 'top',
      delay: 300,
    },
    'transaction-type': {
      content:
        'Expense, Income, Transfer, or Refund. Each type handles balances differently.',
      position: 'top',
      delay: 300,
    },
    'note-field': {
      content: 'Add optional notes for context. Great for business expenses!',
      position: 'top',
      delay: 300,
    },
  },

  // Settings Tooltips
  settings: {
    'account-management': {
      content: 'Add and organize your financial accounts here.',
      position: 'right',
      delay: 300,
    },
    'date-format': {
      content: 'Choose your preferred date display format.',
      position: 'top',
      delay: 300,
    },
    'export-data': {
      content: 'Download your transaction data for spreadsheets or backup.',
      position: 'top',
      delay: 300,
    },
    'backup-restore': {
      content:
        'Automatic daily backups. Restore if needed (replaces current data).',
      position: 'top',
      delay: 300,
    },
    'refresh-app': {
      content: 'Refresh the app to get the latest updates and sync data.',
      position: 'top',
      delay: 300,
    },
    'install-app': {
      content: 'Install BlinkBudget as a standalone app on your device.',
      position: 'top',
      delay: 300,
    },
    logout: {
      content: 'Sign out of your account. Your data stays safe in the cloud.',
      position: 'top',
      delay: 300,
    },
  },

  // Financial Planning Tooltips
  financialPlanning: {
    'scenario-modeling': {
      content:
        'Forecast your future based on different savings and investment scenarios.',
      position: 'top',
      delay: 300,
    },
    'net-worth-chart': {
      content: 'Track your total financial picture over time.',
      position: 'top',
      delay: 300,
    },
    'add-investment': {
      content: 'Manually track investments, property values, and other assets.',
      position: 'top',
      delay: 300,
    },
    'risk-assessment': {
      content:
        'Automatic alerts for potential financial issues based on your patterns.',
      position: 'top',
      delay: 300,
    },
    'goal-planning': {
      content: 'Set and track progress toward long-term financial goals.',
      position: 'top',
      delay: 300,
    },
    'time-period-selector': {
      content: 'Switch between different time periods for analysis.',
      position: 'top',
      delay: 300,
    },
  },

  // Reports Tooltips
  reports: {
    'top-movers': {
      content: 'See your biggest spending categories and trends over time.',
      position: 'top',
      delay: 300,
    },
    'category-breakdown': {
      content: 'Detailed view of spending by category with percentages.',
      position: 'top',
      delay: 300,
    },
    'time-comparison': {
      content: 'Compare spending across different time periods.',
      position: 'top',
      delay: 300,
    },
    'export-report': {
      content: 'Download detailed reports as PDF or CSV files.',
      position: 'top',
      delay: 300,
    },
  },

  // Mobile Navigation Tooltips
  mobileNavigation: {
    'dashboard-tab': {
      content: 'Your home base. See balances and recent transactions.',
      position: 'top',
      delay: 300,
    },
    'add-tab': {
      content: 'Quick access to add new transactions.',
      position: 'top',
      delay: 300,
    },
    'reports-tab': {
      content: 'Dive deep into your spending patterns and trends.',
      position: 'top',
      delay: 300,
    },
    'planning-tab': {
      content: 'Long-term financial goals and forecasting.',
      position: 'top',
      delay: 300,
    },
    'settings-tab': {
      content: 'Manage accounts, preferences, and data.',
      position: 'top',
      delay: 300,
    },
  },

  // Transaction List Tooltips
  transactionList: {
    'filter-button': {
      content: 'Filter transactions by category, account, or date range.',
      position: 'top',
      delay: 300,
    },
    'sort-button': {
      content: 'Sort transactions by date, amount, or category.',
      position: 'top',
      delay: 300,
    },
    'search-box': {
      content: 'Search transactions by description, category, or amount.',
      position: 'top',
      delay: 300,
    },
    'bulk-actions': {
      content: 'Select multiple transactions for bulk operations.',
      position: 'top',
      delay: 300,
    },
  },

  // Smart Features Tooltips
  smartFeatures: {
    'smart-suggestions': {
      content: 'AI-powered suggestions based on your spending habits.',
      position: 'top',
      delay: 300,
    },
    'ghost-transactions': {
      content: 'See historical transactions when changing dates for context.',
      position: 'top',
      delay: 300,
    },
    'pattern-insights': {
      content: 'Discover spending patterns and get personalized insights.',
      position: 'top',
      delay: 300,
    },
    predictions: {
      content: 'Forecast future spending based on your historical patterns.',
      position: 'top',
      delay: 300,
    },
  },
};

// Tooltip behavior configuration
export const TOOLTIP_BEHAVIOR = {
  // Display settings
  showDelay: 300, // Default delay before showing tooltip
  hideDelay: 200, // Delay before hiding tooltip
  maxDisplayTime: 5000, // Maximum time to show tooltip

  // Positioning
  offset: 8, // Distance from target element
  maxWidth: 280, // Maximum tooltip width
  mobileMaxWidth: 'calc(100vw - 32px)', // Mobile maximum width

  // Animation
  animationDuration: 200, // Fade in/out duration
  easing: 'ease-in-out',

  // Mobile settings
  mobileBreakpoint: 768,
  touchDelay: 500, // Longer delay for touch devices

  // Accessibility
  enableKeyboardNavigation: true,
  enableScreenReaderSupport: true,
  announceTooltips: true,

  // User preferences
  respectReducedMotion: true,
  respectDarkMode: true,
  allowDismissal: true,

  // Storage
  seenTooltipsKey: 'blinkbudget_seen_tooltips',
  tooltipsDisabledKey: 'blinkbudget_tooltips_disabled',
};

// Tooltip priority for showing to new users
export const TOOLTIP_PRIORITY = {
  // High priority - show immediately for new users
  high: [
    'dashboard.add-transaction',
    'addTransaction.amount-input',
    'addTransaction.category-chips',
  ],

  // Medium priority - show after initial interaction
  medium: [
    'dashboard.balance-card',
    'dashboard.category-filter',
    'mobileNavigation.dashboard-tab',
  ],

  // Low priority - show as users explore
  low: [
    'settings.account-management',
    'financialPlanning.scenario-modeling',
    'reports.top-movers',
  ],
};

// Tooltip triggers - when to show specific tooltips
export const TOOLTIP_TRIGGERS = {
  // First visit triggers
  firstVisit: ['dashboard.add-transaction', 'dashboard.balance-card'],

  // Contextual triggers
  afterFirstTransaction: ['dashboard.category-filter', 'dashboard.date-filter'],

  afterThreeTransactions: [
    'reports.top-movers',
    'smartFeatures.smart-suggestions',
  ],

  afterOneWeek: ['financialPlanning.scenario-modeling', 'settings.export-data'],

  // Feature discovery triggers
  onAccountPage: [
    'settings.account-management',
    'addTransaction.account-selector',
  ],

  onPlanningPage: [
    'financialPlanning.scenario-modeling',
    'financialPlanning.goal-planning',
  ],

  onReportsPage: ['reports.top-movers', 'reports.category-breakdown'],
};

// Tooltip content templates for dynamic content
export const TOOLTIP_TEMPLATES = {
  // Account-specific tooltip
  accountBalance: (accountName, balance) =>
    `${accountName}: ${balance}. Tap to see transactions for this account only.`,

  // Category-specific tooltip
  categorySpending: (categoryName, amount, percentage) =>
    `${categoryName}: ${amount} (${percentage}% of total spending). Click to filter.`,

  // Time-specific tooltip
  timePeriod: (period, total) =>
    `Viewing ${period}. Total spending: ${total}. Click to change time period.`,

  // Smart suggestion tooltip
  smartSuggestion: (suggestion, confidence) =>
    `Suggested: ${suggestion} (${confidence}% confidence). Based on your habits.`,

  // Goal progress tooltip
  goalProgress: (goalName, progress, remaining) =>
    `${goalName}: ${progress}% complete. ${remaining} to go!`,
};
