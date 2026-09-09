// tests/components/category-selector.test.js
// Regression tests for the refund visibility fix: refund-only / fully-refunded
// categories (net <= 0) must still render in Explore Categories, and refund
// tags must still render in Explore Tags. Previously a `.amount > 0` filter
// silently hid them.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CategorySelector } from '../../src/components/CategorySelector.js';

vi.mock('../../src/core/custom-category-service.js', () => ({
  CustomCategoryService: {
    getCheckboxCategories: () => [
      { name: 'Work', color: '#3B82F6' },
    ],
  },
}));

const colorMap = new Map();
const getCategoryColors = (categories, map) => {
  categories.forEach(c => {
    if (!map.has(c.name)) map.set(c.name, '#3B82F6');
  });
  return categories.map(c => map.get(c.name));
};

const buildData = (categories, transactions, timePeriod) => ({
  categoryBreakdown: { categories },
  transactions,
  timePeriod,
  insights: [],
});

const period = {
  startDate: new Date('2026-09-01T00:00:00.000Z'),
  endDate: new Date('2026-09-30T23:59:59.999Z'),
};

const cardsIn = section =>
  [...section.querySelectorAll('.category-grid .category-card')].map(
    card => card.getAttribute('data-category')
  );

describe('CategorySelector - refund visibility (Explore Categories)', () => {
  let onCategoryClick;

  beforeEach(() => {
    vi.clearAllMocks();
    colorMap.clear();
    onCategoryClick = vi.fn();
  });

  it('renders a refund-only (negative net) category card', () => {
    const section = CategorySelector(
      buildData(
        [
          { name: 'Food', amount: 100, transactionCount: 2, percentage: 100 },
          { name: 'Electronics', amount: -50, transactionCount: 0, percentage: 0 },
        ],
        [
          {
            id: 'e1',
            type: 'expense',
            category: 'Food',
            amount: 100,
            timestamp: '2026-09-05T10:00:00.000Z',
          },
          {
            id: 'r1',
            type: 'refund',
            category: 'Electronics',
            amount: 50,
            timestamp: '2026-09-06T10:00:00.000Z',
          },
        ],
        period
      ),
      colorMap,
      getCategoryColors,
      onCategoryClick
    );

    const cards = cardsIn(section);
    expect(cards).toContain('Food');
    expect(cards).toContain('Electronics');

    const refundCard = section.querySelector('[data-category="Electronics"]');
    expect(refundCard.textContent).toContain('Net Refund');
  });

  it('renders a fully-refunded (zero net) category card', () => {
    const section = CategorySelector(
      buildData(
        [{ name: 'Clothes', amount: 0, transactionCount: 1, percentage: 0 }],
        [
          {
            id: 'e1',
            type: 'expense',
            category: 'Clothes',
            amount: 40,
            timestamp: '2026-09-05T10:00:00.000Z',
          },
          {
            id: 'r1',
            type: 'refund',
            category: 'Clothes',
            amount: 40,
            timestamp: '2026-09-06T10:00:00.000Z',
          },
        ],
        period
      ),
      colorMap,
      getCategoryColors,
      onCategoryClick
    );

    expect(cardsIn(section)).toContain('Clothes');
    expect(
      section.querySelector('[data-category="Clothes"]').textContent
    ).toContain('Net Refund');
  });

  it('invokes onCategoryClick for a refund category card', () => {
    const section = CategorySelector(
      buildData(
        [{ name: 'Electronics', amount: -50, transactionCount: 0, percentage: 0 }],
        [
          {
            id: 'r1',
            type: 'refund',
            category: 'Electronics',
            amount: 50,
            timestamp: '2026-09-06T10:00:00.000Z',
          },
        ],
        period
      ),
      colorMap,
      getCategoryColors,
      onCategoryClick
    );

    section.querySelector('[data-category="Electronics"]').click();
    expect(onCategoryClick).toHaveBeenCalledTimes(1);
    expect(onCategoryClick.mock.calls[0][0].name).toBe('Electronics');
  });

  it('renders refund-only tags in Explore Tags', () => {
    const section = CategorySelector(
      buildData(
        [{ name: 'Food', amount: 60, transactionCount: 1, percentage: 100 }],
        [
          {
            id: 'e1',
            type: 'expense',
            category: 'Food',
            amount: 60,
            tags: ['Work'],
            timestamp: '2026-09-05T10:00:00.000Z',
          },
          {
            id: 'r1',
            type: 'refund',
            category: 'Food',
            amount: 60,
            tags: ['Gadget'],
            timestamp: '2026-09-06T10:00:00.000Z',
          },
        ],
        period
      ),
      colorMap,
      getCategoryColors,
      onCategoryClick
    );

    const tagHeaders = [...section.querySelectorAll('h3')].map(h => h.textContent);
    expect(tagHeaders).toContain('Explore Tags');

    const cards = cardsIn(section);
    expect(cards).toContain('Work');
    expect(cards).toContain('Gadget');
  });

  it('shows empty state only when there are no categories at all', () => {
    const section = CategorySelector(
      buildData([], [], period),
      colorMap,
      getCategoryColors,
      onCategoryClick
    );

    expect(cardsIn(section)).toHaveLength(0);
    expect(section.textContent).toContain(
      'No categories available for this period.'
    );
  });
});
