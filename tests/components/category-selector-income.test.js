import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CategorySelector } from '../../src/components/CategorySelector.js';
import { NavigationState } from '../../src/core/navigation-state.js';

vi.mock('../../src/core/custom-category-service.js', () => ({
  CustomCategoryService: {
    getCheckboxCategories: () => [],
    getByType: () => [{ name: 'Salary', color: '#10B981' }],
  },
}));

const colorMap = new Map();
const getCategoryColors = (categories, map) => {
  categories.forEach(c => {
    if (!map.has(c.name)) map.set(c.name, '#3B82F6');
  });
  return categories.map(c => map.get(c.name));
};

const PERIOD = {
  startDate: new Date('2026-09-01T00:00:00.000Z'),
  endDate: new Date('2026-09-30T23:59:59.999Z'),
};

const buildData = (transactions = []) => ({
  categoryBreakdown: {
    categories: [
      { name: 'Food', amount: 60, transactionCount: 1, percentage: 100 },
    ],
  },
  transactions,
  timePeriod: PERIOD,
  insights: [],
});

describe('CategorySelector - Explore Income Groups', () => {
  beforeEach(() => {
    colorMap.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('renders Explore Income Groups heading and cards when income exists', () => {
    const onCategoryClick = vi.fn();
    const section = CategorySelector(
      buildData([
        {
          id: 'inc-1',
          type: 'income',
          category: 'Salary',
          amount: 2500,
          date: '2026-09-05T10:00:00.000Z',
        },
        {
          id: 'inc-2',
          type: 'income',
          category: 'Bonus',
          amount: 500,
          date: '2026-09-20T10:00:00.000Z',
        },
      ]),
      colorMap,
      getCategoryColors,
      onCategoryClick
    );

    const headings = Array.from(section.querySelectorAll('h3')).map(
      h => h.textContent
    );
    expect(headings).toContain('Explore Income Groups');

    const incomeGrid = section.querySelector('.income-grid');
    expect(incomeGrid).not.toBeNull();

    const cards = incomeGrid.querySelectorAll('.category-card');
    expect(cards).toHaveLength(2);

    // First card: Salary (largest amount)
    expect(cards[0].textContent).toContain('Salary');
    expect(cards[0].textContent).toContain('€2,500.00');
    expect(cards[0].textContent).toContain('83.3% of income');
    expect(cards[0].textContent).toContain('1 transaction');

    // Second card: Bonus
    expect(cards[1].textContent).toContain('Bonus');
    expect(cards[1].textContent).toContain('€500.00');
    expect(cards[1].textContent).toContain('16.7% of income');
  });

  it('omits Explore Income Groups when there is no income in the period', () => {
    const section = CategorySelector(
      buildData([
        {
          id: 'exp-1',
          type: 'expense',
          category: 'Food',
          amount: 50,
          date: '2026-09-10T10:00:00.000Z',
        },
      ]),
      colorMap,
      getCategoryColors,
      vi.fn()
    );

    const headings = Array.from(section.querySelectorAll('h3')).map(
      h => h.textContent
    );
    expect(headings).not.toContain('Explore Income Groups');
    expect(section.querySelector('.income-grid')).toBeNull();
  });

  it('clicking an income group card sets income type filter and invokes onCategoryClick', () => {
    const onCategoryClick = vi.fn();
    const saveTypeSpy = vi.spyOn(NavigationState, 'saveDashboardTypeFilter');
    const section = CategorySelector(
      buildData([
        {
          id: 'inc-1',
          type: 'income',
          category: 'Salary',
          amount: 2000,
          date: '2026-09-05T10:00:00.000Z',
        },
      ]),
      colorMap,
      getCategoryColors,
      onCategoryClick
    );

    const incomeCard = section.querySelector('.income-grid .category-card');
    expect(incomeCard).not.toBeNull();
    incomeCard.click();

    expect(onCategoryClick).toHaveBeenCalledTimes(1);
    expect(onCategoryClick).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Salary',
        amount: 2000,
        isIncome: true,
      })
    );

    // sessionStorage is a vi.fn mock in tests/setup.js (no persistence),
    // so assert the NavigationState API was called instead of restore().
    expect(saveTypeSpy).toHaveBeenCalledWith('income');
    saveTypeSpy.mockRestore();
  });
});
