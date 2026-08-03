// tests/components/transaction-list-item-anomaly.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TransactionListItem } from '../../src/components/TransactionListItem.js';

// Mock DashboardView to break the circular import (TransactionListItem
// imports setSelectedStyle from DashboardView)
vi.mock('../../src/views/DashboardView.js', () => ({
  setSelectedStyle: vi.fn(),
}));

vi.mock('../../src/core/router.js', () => ({
  Router: {
    navigate: vi.fn(),
  },
}));

vi.mock('../../src/core/transaction-service.js', () => ({
  TransactionService: {
    split: vi.fn(),
    copy: vi.fn(),
  },
}));

vi.mock('../../src/core/custom-category-service.js', () => ({
  CustomCategoryService: {
    getCheckboxCategories: () => [],
  },
}));

vi.mock('../../src/utils/form-utils/transaction-tags.js', () => ({
  getTransactionTagName: () => null,
}));

vi.mock('../../src/utils/date-utils.js', () => ({
  formatDateForDisplay: () => '2026-01-01',
}));

describe('TransactionListItem - Anomaly vs Success highlight separation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.innerWidth = 1024;
  });

  const baseTransaction = {
    id: 'tx-1',
    amount: 15.5,
    category: 'Food & Drink',
    type: 'expense',
    accountId: 'acc-1',
    timestamp: '2026-01-01T10:00:00.000Z',
    note: 'Lunch',
  };

  it('does NOT show the ⚠️ anomaly badge for a newly saved transaction (success highlight)', () => {
    const item = TransactionListItem({
      transaction: baseTransaction,
      accounts: [{ id: 'acc-1', name: 'Main Checking' }],
      shouldHighlight: false,
      highlightSuccess: true, // recently logged transaction
    });

    // Success feedback: subtle green pulse class, no warning badge
    expect(item.classList.contains('success-highlight')).toBe(true);
    expect(item.classList.contains('success-highlight-active')).toBe(true);
    expect(item.classList.contains('transaction-item-anomaly')).toBe(false);
    expect(item.querySelector('.transaction-item-anomaly-badge')).toBeNull();
  });

  it('shows the ⚠️ anomaly badge for a genuine anomalous transaction', () => {
    const item = TransactionListItem({
      transaction: baseTransaction,
      accounts: [{ id: 'acc-1', name: 'Main Checking' }],
      shouldHighlight: true, // genuine statistical outlier
      highlightSuccess: false,
    });

    expect(item.classList.contains('transaction-item-anomaly')).toBe(true);
    const badge = item.querySelector('.transaction-item-anomaly-badge');
    expect(badge).not.toBeNull();
    expect(badge.textContent).toContain('⚠️');

    // No success highlight classes on an anomaly
    expect(item.classList.contains('success-highlight')).toBe(false);
  });

  it('shows no highlight at all when neither flag is set', () => {
    const item = TransactionListItem({
      transaction: baseTransaction,
      accounts: [{ id: 'acc-1', name: 'Main Checking' }],
      shouldHighlight: false,
      highlightSuccess: false,
    });

    expect(item.classList.contains('transaction-item-anomaly')).toBe(false);
    expect(item.classList.contains('success-highlight')).toBe(false);
    expect(item.querySelector('.transaction-item-anomaly-badge')).toBeNull();
  });
});
