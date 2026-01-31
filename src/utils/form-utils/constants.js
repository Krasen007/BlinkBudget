/**
 * Form-specific constants
 * Category definitions, colors, and options for transaction forms
 */

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
  Други: '#f19317ff', // White/Light gray (30.2% - largest)
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
