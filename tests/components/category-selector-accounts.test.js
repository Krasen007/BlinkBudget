// tests/components/category-selector-accounts.test.js
// The Explore Accounts section lives below Explore Tags inside the
// CategorySelector surface. It groups the period by account type and lets the
// user open the dashboard filtered to every account of that type.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CategorySelector } from '../../src/components/CategorySelector.js';

vi.mock('../../src/core/custom-category-service.js', () => ({
  CustomCategoryService: {
    getCheckboxCategories: () => [{ name: 'Work', color: '#3B82F6' }],
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

const ACCOUNTS = [
  { id: 'acc-checking', name: 'Main Checking', type: 'checking' },
  { id: 'acc-cash', name: 'Wallet', type: 'cash' },
];

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

const render = ({
  transactions = [],
  accounts = ACCOUNTS,
  onAccountTypeClick,
} = {}) =>
  CategorySelector(
    buildData(transactions),
    colorMap,
    getCategoryColors,
    vi.fn(),
    null,
    null,
    { accounts, onAccountTypeClick }
  );

describe('CategorySelector - Explore Accounts', () => {
  beforeEach(() => {
    colorMap.clear();
  });

  it('renders an Explore Accounts heading after Explore Tags', () => {
    const section = render({
      transactions: [
        {
          id: 't1',
          type: 'expense',
          category: 'Food',
          amount: 60,
          tags: ['Work'],
          accountId: 'acc-cash',
          timestamp: '2026-09-05T10:00:00.000Z',
        },
      ],
      onAccountTypeClick: vi.fn(),
    });

    const headings = [...section.querySelectorAll('h3')].map(
      h => h.textContent
    );
    expect(headings).toEqual([
      'Explore Categories',
      'Explore Tags',
      'Explore Accounts',
    ]);
  });

  it('renders one card per account type with its period total', () => {
    const section = render({
      transactions: [
        {
          id: 't1',
          type: 'expense',
          category: 'Food',
          amount: 60,
          accountId: 'acc-cash',
          timestamp: '2026-09-05T10:00:00.000Z',
        },
      ],
      onAccountTypeClick: vi.fn(),
    });

    const cards = [...section.querySelectorAll('[data-account-type]')];
    expect(cards).toHaveLength(1);
    expect(cards[0].getAttribute('data-account-type')).toBe('cash');
    expect(cards[0].textContent).toContain('Cash');
    expect(cards[0].textContent).toContain('1 transaction');
  });

  it('calls onAccountTypeClick with the selected type', () => {
    const onAccountTypeClick = vi.fn();
    const section = render({
      transactions: [
        {
          id: 't1',
          type: 'expense',
          category: 'Food',
          amount: 60,
          accountId: 'acc-checking',
          timestamp: '2026-09-05T10:00:00.000Z',
        },
      ],
      onAccountTypeClick,
    });

    section.querySelector('[data-account-type="checking"]').click();

    expect(onAccountTypeClick).toHaveBeenCalledTimes(1);
    expect(onAccountTypeClick.mock.calls[0][0]).toMatchObject({
      type: 'checking',
      name: 'Checking Account',
      isAccountType: true,
    });
  });

  it('omits the section when no accounts are supplied (legacy call)', () => {
    const section = CategorySelector(
      buildData([]),
      colorMap,
      getCategoryColors,
      vi.fn()
    );

    const headings = [...section.querySelectorAll('h3')].map(
      h => h.textContent
    );
    expect(headings).not.toContain('Explore Accounts');
    expect(section.querySelectorAll('[data-account-type]')).toHaveLength(0);
  });

  it('omits the section when there is no account activity in the period', () => {
    const section = render({
      transactions: [
        {
          id: 't1',
          type: 'expense',
          category: 'Food',
          amount: 60,
          accountId: 'acc-checking',
          timestamp: '2026-10-05T10:00:00.000Z',
        },
      ],
      onAccountTypeClick: vi.fn(),
    });

    expect(section.querySelectorAll('[data-account-type]')).toHaveLength(0);
  });

  it('does not label an income-only account type as a net refund', () => {
    const section = render({
      transactions: [
        {
          id: 't1',
          type: 'income',
          category: 'Salary',
          amount: 500,
          accountId: 'acc-cash',
          timestamp: '2026-09-05T10:00:00.000Z',
        },
      ],
      onAccountTypeClick: vi.fn(),
    });

    const card = section.querySelector('[data-account-type="cash"]');
    expect(card).not.toBeNull();
    expect(card.textContent).not.toContain('Net Refund');
    expect(card.textContent).toContain('1 transaction');
  });
});
