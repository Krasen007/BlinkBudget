/**
 * Form-specific constants
 * Category definitions, colors, and options for transaction forms
 */

// Category definitions (tooltips/descriptions)
export const CATEGORY_DEFINITIONS = {
    // Expense
    'Food & Groceries': 'Supermarket runs, bakery, household supplies bought at the grocery store.',
    'Dining & Coffee': 'Restaurants, fast food, coffee shops, food delivery apps.',
    'Housing & Bills': 'Rent, Mortgage, Utilities (Electricity/Water/Internet), Repairs, Taxes.',
    'Transportation': 'Car payments, gas, maintenance, public transit tickets, Uber/Lyft.',
    'Leisure & Shopping': 'Shopping (clothes/gadgets), hobbies, movies, subscriptions (Netflix/Spotify), vacations.',
    'Personal Care': 'Medical bills, pharmacy, gym memberships, haircuts, tuition/school fees (Education).',
    // Income
    'Paycheck': 'Most reliable source',
    'Business / Freelance': 'Variable, side income',
    'Investment Income': 'Dividends, interest, profits',
    'Other / Gift': 'Everything else, like cash gifts'
};

// Category colors for visual feedback
export const CATEGORY_COLORS = {
    // Expense
    'Food & Groceries': '#10b981', // Green
    'Dining & Coffee': '#f97316', // Orange
    'Housing & Bills': '#3b82f6', // Blue
    'Transportation': '#eab308', // Yellow
    'Leisure & Shopping': '#a855f7', // Purple
    'Personal Care': '#ffffff',    // White
    // Income
    'Paycheck': '#10b981', // Green
    'Business / Freelance': '#f97316', // Orange
    'Investment Income': '#3b82f6', // Blue
    'Other / Gift': '#eab308' // Yellow
};

// Category options by transaction type
export const CATEGORY_OPTIONS = {
    expense: ['Food & Groceries', 'Dining & Coffee', 'Housing & Bills', 'Transportation', 'Leisure & Shopping', 'Personal Care'],
    income: ['Paycheck', 'Business / Freelance', 'Investment Income', 'Other / Gift'],
    refund: ['Food & Groceries', 'Dining & Coffee', 'Housing & Bills', 'Transportation', 'Leisure & Shopping', 'Personal Care']
};

// Type toggle button colors
export const TYPE_COLORS = {
    expense: 'var(--color-primary)',
    income: '#10b981', // SUCCESS
    transfer: '#10b981', // SUCCESS (default)
    refund: '#06b6d4'  // INFO
};

