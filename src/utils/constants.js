/**
 * Centralized constants for BlinkBudget
 * Eliminates magic variables throughout the codebase
 */

// Breakpoints
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1024,
};

// Global colors and Currency
export const CURRENCY_SYMBOL = '€';
export const COLORS = {
  // Semantic colors — now all CSS variable references for full theming support
  ERROR: 'var(--color-error)',
  SUCCESS: 'var(--color-success)',
  SUCCESS_LIGHT: 'var(--color-success-light)',
  WARNING: 'var(--color-warning)',
  INFO: 'var(--color-info)',
  INCOME_COLOR: 'var(--color-success)',
  // RGB component triples for Canvas/Chart.js rgba() strings. The matching
  // CSS custom properties (--color-success-rgb / --color-error-rgb) are
  // purged from production CSS (no surviving rule references them), so the
  // charts must read the values from here — see todo/ai-slop-report.md.
  SUCCESS_RGB: '0, 179, 89',
  ERROR_RGB: '240, 66, 66',

  // CSS variable references (for consistency)
  PRIMARY: 'var(--color-primary)',
  PRIMARY_LIGHT: 'var(--color-primary-light)',
  PRIMARY_DARK: 'var(--color-primary-dark)',
  SURFACE: 'var(--color-surface)',
  SURFACE_HOVER: 'var(--color-surface-hover)',
  BORDER: 'var(--color-border)',
  MUTED: 'var(--color-muted)',
  TEXT_MAIN: 'var(--color-text-main)',
  TEXT_MUTED: 'var(--color-text-muted)',
  BACKGROUND: 'var(--color-background)',
};

// Category definitions (tooltips/descriptions)
export const CATEGORY_DEFINITIONS = {
  // Expense
  Храна: 'Supermarket runs, bakery, household supplies.',
  Заведения: 'Restaurants, fast food, coffee shops, food delivery.',
  Други: "Miscellaneous expenses that don't fit elsewhere.",
  Гориво: 'Fuel for vehicles.',
  Подаръци: 'Gifts for others.',
  Автомобил: 'Car maintenance, repairs, insurance.',
  Сметки: 'Utility bills (Electricity, Water, Internet, etc.).',
  Дрехи: 'Clothing and apparel.',
  Лекарства: 'Pharmacy and medicines.',
  Забавления: 'Movies, hobbies, subscriptions, fun activities.',
  Кредит: 'Loan payments, mortgage, credit card payoff.',
  Телефон: 'Mobile phone bill and equipment.',
  Почивка: 'Vacations, travel, hotels.',
  Транспорт: 'Public transit, taxi, ride-sharing.',
  Баланс: 'Adjustments to account balance.',
  Лекар: 'Doctor visits and medical procedures.',
  Инвестиции: 'Investment contributions and income.',
  Ремонти: 'Home repairs and maintenance.',
  Данъци: 'Taxes and government fees.',
  Застраховки: 'Insurance policies (Life, Home, Health).',
  Зъболекар: 'Dentist visits.',

  // Income
  Заплата: 'Salary and primary income.',
};

// Category colors for visual feedback
export const CATEGORY_COLORS = {
  // Bold, vibrant color scheme using red, blue, green, white, orange, purple

  // Major expenses - Primary bold colors
  Други: '#f19317', // Orange (30.2% - largest)
  Храна: '#22C55E', // Vibrant green (25.0% - second largest)
  Кредит: '#3B82F6', // Bold blue (21.3% - third largest)

  // Medium expenses - Bright accent colors
  Подаръци: '#A855F7', // Purple (7.9%)
  Заведения: '#F97316', // Orange (4.8%)
  Гориво: '#EF4444', // Red (4.5%)

  // Smaller expenses - Variations of primary colors
  Дрехи: '#8B5CF6', // Deep purple (1.7%)
  Автомобил: '#DC2626', // Dark red (1.5%)
  Телефон: '#0EA5E9', // Bright blue (1.4%)
  Лекарства: '#10B981', // Emerald green (1.1%)
  Сметки: '#60A5FA', // Light blue (0.6%)

  // Additional categories - Using the same color palette
  Почивка: '#06B6D4', // Cyan blue
  Транспорт: '#FB923C', // Light orange
  Баланс: '#16A34A', // Dark green
  Лекар: '#B91C1C', // Deep red
  Инвестиции: '#84CC16', // Lime green
  Ремонти: '#F59E0B', // Amber orange
  Данъци: '#1D4ED8', // Dark blue
  Застраховки: '#C084FC', // Light purple
  Зъболекар: '#F87171', // Coral red
  Забавления: '#7C3AED', // Violet purple

  Заплата: '#10b981', // Green
};

// Category options by transaction type
export const CATEGORY_OPTIONS = {
  expense: [
    'Храна',
    'Заведения',
    'Други',
    'Гориво',
    'Подаръци',
    'Автомобил',
    'Сметки',
    'Дрехи',
    'Лекарства',
    'Забавления',
    'Кредит',
    'Телефон',
    'Почивка',
    'Транспорт',
    'Баланс',
    'Лекар',
    'Инвестиции',
    'Ремонти',
    'Данъци',
    'Застраховки',
    'Зъболекар',
  ],
  income: ['Заплата', 'Инвестиции', 'Други', 'Подаръци'],
  refund: [
    'Храна',
    'Заведения',
    'Други',
    'Гориво',
    'Подаръци',
    'Автомобил',
    'Сметки',
    'Дрехи',
    'Лекарства',
    'Забавления',
    'Кредит',
    'Телефон',
    'Почивка',
    'Транспорт',
    'Баланс',
    'Лекар',
    'Инвестиции',
    'Ремонти',
    'Данъци',
    'Застраховки',
    'Зъболекар',
  ],
};

// Type toggle button colors
export const TYPE_COLORS = {
  expense: 'var(--color-primary)',
  income: '#10b981', // SUCCESS
  transfer: '#b45309', // Dark yellow/amber
  refund: '#06b6d4', // INFO
};

// Touch targets (accessibility)
export const TOUCH_TARGETS = {
  MIN_HEIGHT: '56px',
  MIN_WIDTH: '44px',
  SPACING: '8px',
};

// Spacing values (for JavaScript usage - actual pixel values)
export const SPACING = {
  XXS: '2px', // half-step for tight component internals
  XS: '4px', // 0.25rem
  SM: '8px', // 0.5rem
  MD: '12px', // 0.75rem
  LG: '16px', // 1rem
  XL: '24px', // 1.5rem
  XXXL: '48px', // 3rem — matches --spacing-3xl
};

// Timing values (in milliseconds)
export const TIMING = {
  DEBOUNCE_RESIZE: 150,
  DEBOUNCE_ORIENTATION: 300,
  ANIMATION_FAST: 200,
  ANIMATION_NORMAL: 300,
  KEYBOARD_DELAY: 300,
  FOCUS_DELAY: 100,
  INITIAL_LOAD_DELAY: 100,
  UNDO_TOAST: 1000, // window to undo a transaction delete
  RECENT_TRANSACTION_LIMIT: 300000, // 5 * 60 * 1000 = 5 minutes in milliseconds
  // Toast auto-dismiss durations
  NOTIFICATION_SUCCESS: 3000,
  NOTIFICATION_ERROR: 5000, // errors stay longer so they can be read
  NOTIFICATION_WARNING: 4000,
  NOTIFICATION_INFO: 3000,
};

// Z-index layers
export const Z_INDEX = {
  MODAL_OVERLAY: 1000,
  PROGRESS_INDICATOR: 9999, // above all app surfaces, incl. modals
  DATE_INPUT_OVERLAY: 2,
  DEFAULT: 1,
};

// Dimensions
export const DIMENSIONS = {
  DATE_INPUT_WIDTH: '140px',
  MODAL_MAX_WIDTH: '400px',
  MODAL_MAX_WIDTH_SMALL: '350px',
  CONTAINER_MAX_WIDTH: '600px',
  CHART_HEIGHT_PIE: '300px',
  CHART_HEIGHT_LINE: '350px',
  CHART_HEIGHT_BAR: '400px',
  LEGEND_ITEM_PADDING: '6px 14px',
  LEGEND_SWATCH_SIZE: '10px',
  PLACEHOLDER_MIN_HEIGHT: '300px',
  CONTENT_MAX_WIDTH: '400px',
  PROGRESS_INDICATOR_MIN_WIDTH: '300px',
  MIN_LIST_HEIGHT: 200,
  MIN_CATEGORY_HEIGHT: 140,
  IDEAL_CATEGORY_HEIGHT: 250,
  FIXED_ELEMENTS_HEIGHT: 200,
  KEYBOARD_THRESHOLD: 100,
  SWIPE_THRESHOLD: 100,
};

// Font sizes
export const FONT_SIZES = {
  PREVENT_ZOOM: '16px', // iOS requires 16px+ to prevent zoom
  AMOUNT_INPUT: '1.5rem',
  STAT_LABEL_MOBILE: 'var(--font-size-sm)',
  STAT_LABEL_DESKTOP: '0.875rem',
  STAT_VALUE_MOBILE: 'var(--font-size-2xl)',
  STAT_VALUE_DESKTOP: '1.75rem',
  TITLE_MOBILE: 'var(--font-size-xl)',
  TITLE_DESKTOP: 'var(--font-size-2xl)',
  BASE: 'var(--font-size-base)',
  XS: 'var(--font-size-xs)',
  SM: 'var(--font-size-sm)',
  MD: 'var(--font-size-base)',
  LG: 'var(--font-size-lg)',
  XL: 'var(--font-size-xl)',
  BUTTON_LARGE: '1.1rem',
};

// Date formats
export const DATE_FORMATS = {
  US: 'US',
  ISO: 'ISO',
  EU: 'EU',
  DEFAULT: 'ISO',
};

// Account types
export const ACCOUNT_TYPES = {
  CHECKING: 'checking',
  SAVINGS: 'savings',
  CREDIT_CARD: 'credit card',
  CASH: 'cash',
  BANK: 'bank',
  INVESTMENT: 'investment',
};

// Account type labels for display
export const ACCOUNT_TYPE_LABELS = {
  checking: 'Checking Account',
  bank: 'Bank Account',
  credit: 'Credit Card',
  'credit card': 'Credit Card', // Alias for backwards compatibility
  savings: 'Savings Account',
  investment: 'Investment Account',
  cash: 'Cash',
  other: 'Other',
};

// Helper function to get account type label
export const getAccountTypeLabel = type => {
  return ACCOUNT_TYPE_LABELS[type] || 'Other';
};

// Transaction types
export const TRANSACTION_TYPES = {
  EXPENSE: 'expense',
  INCOME: 'income',
  TRANSFER: 'transfer',
  REFUND: 'refund',
};

// Storage keys
export const STORAGE_KEYS = {
  TRANSACTIONS: 'blinkbudget_transactions',
  ACCOUNTS: 'blinkbudget_accounts',
  CUSTOM_CATEGORIES: 'custom_categories',
  SETTINGS: 'blink_settings',
  INVESTMENTS: 'blinkbudget_investments',
  GOALS: 'blinkbudget_goals',
  DASHBOARD_FILTER: 'dashboard_filter',
  DASHBOARD_DATE_FILTER: 'dashboard_date_filter',
  DASHBOARD_CATEGORY_FILTER: 'dashboard_category_filter',
  DASHBOARD_TAG_FILTER: 'dashboard_tag_filter',
  DASHBOARD_MONTH_FILTER: 'dashboard_month_filter',
  CLICK_TRACKING: 'blinkbudget_click_tracking',
  BUDGETS: 'blinkbudget_budgets',
};

// Default values
export const DEFAULTS = {
  ACCOUNT_ID: 'main',
  ACCOUNT_NAME: 'Main Account',
  ACCOUNT_TYPE: ACCOUNT_TYPES.CHECKING,
  DATE_FORMAT: DATE_FORMATS.DEFAULT,
  TRANSACTION_TYPE: TRANSACTION_TYPES.EXPENSE,
};
