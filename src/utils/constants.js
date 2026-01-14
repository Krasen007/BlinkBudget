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

// Colors
export const CURRENCY_SYMBOL = '€';
export const COLORS = {
  // Semantic colors
  ERROR: '#ef4444',
  SUCCESS: '#10b981',
  SUCCESS_LIGHT: 'rgba(16, 185, 129, 0.1)',
  WARNING: '#f97316',
  INFO: '#06b6d4',

  // Category colors
  CATEGORY_FOOD_GROCERIES: '#10b981',
  CATEGORY_DINING_COFFEE: '#f97316',
  CATEGORY_HOUSING_BILLS: '#3b82f6',
  CATEGORY_TRANSPORTATION: '#eab308',
  CATEGORY_LEISURE_SHOPPING: '#a855f7',
  CATEGORY_PERSONAL_CARE: '#ffffff',

  // CSS variable references (for consistency)
  PRIMARY: 'var(--color-primary)',
  PRIMARY_LIGHT: 'var(--color-primary-light)',
  SURFACE: 'var(--color-surface)',
  SURFACE_HOVER: 'var(--color-surface-hover)',
  BORDER: 'var(--color-border)',
  TEXT_MAIN: 'var(--color-text-main)',
  TEXT_MUTED: 'var(--color-text-muted)',
  BACKGROUND: 'var(--color-background)',
};

// Touch targets (accessibility)
export const TOUCH_TARGETS = {
  MIN_HEIGHT: '56px',
  MIN_WIDTH: '44px',
  SPACING: '8px',
};

// Spacing values (for JavaScript usage - actual pixel values)
export const SPACING = {
  XS: '4px', // 0.25rem
  SM: '8px', // 0.5rem
  MD: '12px', // 0.75rem
  LG: '16px', // 1rem
  XL: '24px', // 1.5rem
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
};

// Z-index layers
export const Z_INDEX = {
  MODAL_OVERLAY: 1000,
  DATE_INPUT_OVERLAY: 2,
  DEFAULT: 1,
};

// Dimensions
export const DIMENSIONS = {
  DATE_INPUT_WIDTH: '140px',
  MODAL_MAX_WIDTH: '400px',
  MODAL_MAX_WIDTH_SMALL: '350px',
  CONTAINER_MAX_WIDTH: '600px',
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
  SM: 'var(--font-size-sm)',
  LG: 'var(--font-size-lg)',
  XL: 'var(--font-size-xl)',
  BUTTON_LARGE: '1.1rem',
};

// Date formats
export const DATE_FORMATS = {
  US: 'US',
  ISO: 'ISO',
  EU: 'EU',
  DEFAULT: 'US',
};

// Account types
export const ACCOUNT_TYPES = {
  CHECKING: 'checking',
  SAVINGS: 'savings',
  CREDIT_CARD: 'credit card',
  CASH: 'cash',
};

// Transaction types
export const TRANSACTION_TYPES = {
  EXPENSE: 'expense',
  INCOME: 'income',
  TRANSFER: 'transfer',
  REFUND: 'refund',
};

// Haptic feedback patterns
export const HAPTIC_PATTERNS = {
  LIGHT: [10],
  MEDIUM: [15],
  STRONG: [25],
  SUCCESS: [25, 25, 50],
  ERROR: [50, 50, 50],
  WELCOME: [5],
};

// Storage keys
export const STORAGE_KEYS = {
  TRANSACTIONS: 'blinkbudget_transactions',
  ACCOUNTS: 'blinkbudget_accounts',
  SETTINGS: 'blink_settings',
  INVESTMENTS: 'blinkbudget_investments',
  GOALS: 'blinkbudget_goals',
  DASHBOARD_FILTER: 'dashboard_filter',
  DASHBOARD_DATE_FILTER: 'dashboard_date_filter',
  DASHBOARD_CATEGORY_FILTER: 'dashboard_category_filter',
  CLICK_TRACKING: 'blinkbudget_click_tracking',
};

// Default values
export const DEFAULTS = {
  ACCOUNT_ID: 'main',
  ACCOUNT_NAME: 'Main Account',
  ACCOUNT_TYPE: ACCOUNT_TYPES.CHECKING,
  DATE_FORMAT: DATE_FORMATS.DEFAULT,
  TRANSACTION_TYPE: TRANSACTION_TYPES.EXPENSE,
};
