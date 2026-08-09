import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DashboardView } from '../../src/views/DashboardView.js';
import { STORAGE_KEYS } from '../../src/utils/constants.js';

/**
 * Black-box tests for the Dashboard transaction-list tag (label) filter.
 *
 * The suite exercises the feature strictly through the public interface:
 *  1. Render the DashboardView into a real DOM container.
 *  2. Click the actual rendered tag badge (or active filter chip).
 *  3. Assert on visible output (rendered transaction rows + filter chip text).
 *
 * Only true external infrastructure boundaries are mocked:
 *  - AuthService  → wraps Firebase authentication
 *  - Router       → wraps window.location.hash navigation
 *  - Analytics    → performs preload caching/network-adjacent work
 * All domain services (TransactionService, AccountService,
 * CustomCategoryService, SettingsService, AnomalyService) and all UI
 * components (TransactionList, TransactionListItem, Button, StatsCard,
 * navigation helper) run as REAL code.
 */

vi.mock('../../src/core/auth-service.js', () => ({
  AuthService: {
    user: null,
    getUserId: () => 'user-1',
  },
}));

vi.mock('../../src/core/router.js', () => ({
  Router: {
    navigate: vi.fn(),
  },
}));

vi.mock('../../src/core/analytics/AnalyticsInstance.js', () => ({
  getAnalyticsEngine: () => ({
    generateSpendingInsights: () => [],
    calculateCategoryBreakdown: () => ({}),
    calculateIncomeVsExpenses: () => ({}),
    calculateCostOfLiving: () => ({}),
  }),
}));

const FLAG_CATEGORIES = [
  {
    id: 'flag-work',
    name: 'Work',
    type: 'expense',
    color: '#123456',
    showAsCheckbox: true,
    userId: 'user-1',
    sortOrder: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'flag-personal',
    name: 'Personal',
    type: 'expense',
    color: '#654321',
    showAsCheckbox: true,
    userId: 'user-1',
    sortOrder: 1,
    createdAt: '2026-01-02T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
  },
];

const TRANSACTIONS = [
  {
    id: '1',
    amount: 10,
    category: 'Food',
    type: 'expense',
    accountId: 'main',
    tags: ['Work'],
    timestamp: '2026-06-07T00:00:00.000Z',
  },
  {
    id: '2',
    amount: 20,
    category: 'Leisure',
    type: 'expense',
    accountId: 'main',
    tags: ['Personal'],
    timestamp: '2026-06-08T00:00:00.000Z',
  },
  {
    id: '3',
    amount: 30,
    category: 'Bill',
    type: 'expense',
    accountId: 'main',
    tags: [],
    timestamp: '2026-06-09T00:00:00.000Z',
  },
];

// In-memory fakes for localStorage / sessionStorage.
const createMemoryStorage = () => {
  const store = new Map();
  return {
    getItem: key => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: key => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
};

// Public-interface helpers ---------------------------------------------------

/** Extract the rendered transaction ids from the dashboard DOM. */
const getRenderedTransactionIds = container =>
  Array.from(
    container.querySelectorAll('.transaction-list-item')
  ).map(item => item.dataset.transactionId);

/** Find the rendered tag badge for a given tag name inside a transaction row. */
const findTagBadge = (container, tagName) => {
  const badges = Array.from(
    container.querySelectorAll('.transaction-item-tag')
  );
  return badges.find(
    badge =>
      badge.textContent.trim().toUpperCase() === tagName.toUpperCase()
  );
};

/**
 * Find the header filter chip (the active include/exclude indicator rendered
 * by the transaction list when a tag filter is active).
 */
const getActiveFilterChip = container => {
  const row = container.querySelector('.active-filters-row');
  return row?.querySelector('.transaction-item-tag') || null;
};

/**
 * Read the chip's label while ignoring the decorative close (×) icon that the
 * component appends next to the text — its exact rendering is cosmetic.
 */
const getActiveFilterChipText = container => {
  const chip = getActiveFilterChip(container);
  if (!chip) return null;
  return chip.textContent
    .replace(/×/g, '')
    .trim()
    .toUpperCase();
};

describe('DashboardView tag (label) filtering', () => {
  let container;

  beforeEach(() => {
    global.localStorage = createMemoryStorage();
    global.sessionStorage = createMemoryStorage();

    // Seed the data layer so real domain services read deterministic state.
    global.localStorage.setItem(
      STORAGE_KEYS.TRANSACTIONS,
      JSON.stringify(TRANSACTIONS)
    );
    global.localStorage.setItem(
      STORAGE_KEYS.CUSTOM_CATEGORIES,
      JSON.stringify(FLAG_CATEGORIES)
    );
    global.localStorage.setItem('categories_initialized_user-1', 'true');
  });

  afterEach(() => {
    container?.cleanup?.();
    container = null;
    vi.clearAllMocks();
  });

  it('cycles tag filter through none -> include -> exclude -> none via user clicks', () => {
    // 1. Initial render — no tag filter active
    container = DashboardView();
    expect(getRenderedTransactionIds(container)).toHaveLength(3);
    expect(getActiveFilterChipText(container)).toBeNull();

    // 2. First click on the "Work" tag badge → include ONLY Work-tagged rows
    const workBadge = findTagBadge(container, 'Work');
    expect(workBadge).toBeTruthy();
    workBadge.dispatchEvent(new Event('click', { bubbles: true }));

    expect(getRenderedTransactionIds(container)).toEqual(['1']);
    expect(getActiveFilterChipText(container)).toBe('INCLUDE: WORK');

    // 3. Second click → exclude Work-tagged rows (order is not contractual)
    findTagBadge(container, 'Work').dispatchEvent(
      new Event('click', { bubbles: true })
    );

    expect(new Set(getRenderedTransactionIds(container))).toEqual(
      new Set(['2', '3'])
    );
    expect(getActiveFilterChipText(container)).toBe('EXCLUDE: WORK');

    // 4. Third click on the header chip → clears the filter entirely
    const chip = getActiveFilterChip(container);
    expect(chip).toBeTruthy();
    chip.dispatchEvent(new Event('click', { bubbles: true }));

    expect(getRenderedTransactionIds(container)).toHaveLength(3);
    expect(getActiveFilterChipText(container)).toBeNull();
  });
});