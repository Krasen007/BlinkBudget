/**
 * Form-specific constants
 * Category definitions, colors, and options for transaction forms
 */

// Category definitions (tooltips/descriptions)
export const CATEGORY_DEFINITIONS = {
  // Expense
  'Food & Groceries':
    'Supermarket runs, bakery, household supplies bought at the grocery store.',
  'Dining & Coffee':
    'Restaurants, fast food, coffee shops, food delivery apps.',
  'Housing & Bills':
    'Rent, Mortgage, Utilities (Electricity/Water/Internet), Repairs, Taxes.',
  Transportation:
    'Car payments, gas, maintenance, public transit tickets, Uber/Lyft.',
  'Leisure & Shopping':
    'Shopping (clothes/gadgets), hobbies, movies, subscriptions (Netflix/Spotify), vacations.',
  'Personal Care':
    'Medical bills, pharmacy, gym memberships, haircuts, tuition/school fees (Education).',
  // Income
  Paycheck: 'Most reliable source',
  'Business / Freelance': 'Variable, side income',
  'Investment Income': 'Dividends, interest, profits',
  'Other / Gift': 'Everything else, like cash gifts',
};

// Category colors for visual feedback
// Category colors for visual feedback
export const CATEGORY_COLORS = {
  // Expense
  'Храна': '#10b981', // Green
  'Заведения': '#f97316', // Orange
  'Други': '#9ca3af', // Gray
  'Гориво': '#eab308', // Yellow
  'Подаръци': '#ec4899', // Pink
  'Автомобил': '#ef4444', // Red
  'Сметки': '#3b82f6', // Blue
  'Дрехи': '#a855f7', // Purple
  'Лекарства': '#14b8a6', // Teal
  'Забавления': '#6366f1', // Indigo
  'Кредит': '#64748b', // Slate
  'Телефон': '#0ea5e9', // Sky
  'Почивка': '#06b6d4', // Cyan
  'Транспорт': '#d97706', // Amber
  'Баланс': '#059669', // Emerald
  'Лекар': '#dc2626', // Red
  'Инвестиции': '#84cc16', // Lime
  'Ремонти': '#78716c', // Stone
  'Данъци': '#52525b', // Zinc
  'Застраховки': '#8b5cf6', // Violet
  'Зъболекар': '#f43f5e', // Rose

  // Income
  'Заплата': '#10b981', // Green
  // 'Инвестиции' handled above
  // 'Други' handled above
  // 'Подаръци' handled above

  // English fallbacks (keep for compatibility if needed, or remove if strictly Bulgarian)
  'Food & Groceries': '#10b981',
  'Dining & Coffee': '#f97316',
  'Housing & Bills': '#3b82f6',
  'Transportation': '#eab308',
  'Leisure & Shopping': '#a855f7',
  'Personal Care': '#ffffff',
  'Paycheck': '#10b981',
  'Business / Freelance': '#f97316',
  'Investment Income': '#3b82f6',
  'Other / Gift': '#eab308',
};

// Category options by transaction type
export const CATEGORY_OPTIONS = {
  // DO NOT REMOVE THIS COMMENT English translation: expense: ['Groceries', 'Eating Out', 'Bills', 'Travel', 'Lifestyle', 'Self-care'],
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

  // DO NOT REMOVE THIS COMMENT English translation: income: ['Work', 'Side Hustle', 'Investments', 'Extra'],
  income: ['Заплата', 'Инвестиции', 'Други', 'Подаръци'],

  // DO NOT REMOVE THIS COMMENT English translation: refund: ['Groceries', 'Eating Out', 'Bills', 'Travel', 'Lifestyle', 'Self-care'],
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

  // DO NOT REMOVE THIS COMMENT
  // Possible categories for English version:
  // Fixed/Essential: Сметки, Кредит, Данъци, Телефон
  // Daily Living: Храна, Дрехи, Транспорт
  // Health: Лекар, Лекарства
  // Auto: Автомобил, Гориво, Ремонти
  // Lifestyle & Fun: Заведения, Кино, Концерти, Почивка, Подаръци
  // Financial: Инвестиции, Баланс, Други
};

// Type toggle button colors
export const TYPE_COLORS = {
  expense: 'var(--color-primary)',
  income: '#10b981', // SUCCESS
  transfer: '#b45309', // Dark yellow/amber
  refund: '#06b6d4', // INFO
};
