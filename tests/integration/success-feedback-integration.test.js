import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TransactionListItem } from '../../src/components/TransactionListItem.js';
import {
  markTransactionForHighlight,
  getTransactionToHighlight,
} from '../../src/utils/success-feedback.js';

// Mock mobile utils
global.window.mobileUtils = {
  supportsHaptic: () => true,
  hapticFeedback: vi.fn(),
};

describe('Success Feedback Integration', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('should highlight newly added transaction in dashboard', async () => {
    const mockTransaction = {
      id: 'test-transaction-123',
      amount: 25.5,
      category: 'Food & Groceries',
      type: 'expense',
      accountId: 'main',
      timestamp: new Date().toISOString(),
    };

    const mockAccounts = [{ id: 'main', name: 'Main Account' }];

    // Simulate marking transaction for highlight (what happens in AddView)
    markTransactionForHighlight(mockTransaction.id);

    // Simulate dashboard rendering (what happens in DashboardView)
    const highlightTransactionId = getTransactionToHighlight();

    // Create transaction list item with highlight flag
    const transactionItem = TransactionListItem({
      transaction: mockTransaction,
      currentFilter: 'all',
      accounts: mockAccounts,
      shouldHighlight:
        highlightTransactionId &&
        highlightTransactionId.includes(mockTransaction.id),
    });

    document.body.appendChild(transactionItem);

    // Verify the transaction item was created
    expect(transactionItem).toBeTruthy();
    expect(
      transactionItem.querySelector('.transaction-item-category').textContent
    ).toBe('Food & Groceries');
    expect(
      transactionItem.querySelector('.transaction-item-value').textContent
    ).toBe('-€25.50');

    // Wait for highlight animation to be applied
    await new Promise(resolve => setTimeout(resolve, 150));

    // Verify highlight was applied (classes should be set)
    expect(transactionItem.classList.contains('success-highlight')).toBe(true);
    expect(transactionItem.classList.contains('success-highlight-active')).toBe(
      true
    );
  });

  it('should not highlight transaction when no highlight ID is set', () => {
    const mockTransaction = {
      id: 'test-transaction-456',
      amount: 15.75,
      category: 'Coffee',
      type: 'expense',
      accountId: 'main',
      timestamp: new Date().toISOString(),
    };

    const mockAccounts = [{ id: 'main', name: 'Main Account' }];

    // Create transaction list item without highlight flag
    const transactionItem = TransactionListItem({
      transaction: mockTransaction,
      currentFilter: 'all',
      accounts: mockAccounts,
      shouldHighlight: false,
    });

    document.body.appendChild(transactionItem);

    // Verify no highlight styles are applied
    expect(transactionItem.classList.contains('success-highlight-active')).toBe(
      false
    );
  });

  it('should handle transfer transactions with highlighting', async () => {
    const mockTransferTransaction = {
      id: 'transfer-123',
      amount: 100.0,
      category: 'Transfer',
      type: 'transfer',
      accountId: 'main',
      toAccountId: 'savings',
      timestamp: new Date().toISOString(),
    };

    const mockAccounts = [
      { id: 'main', name: 'Main Account' },
      { id: 'savings', name: 'Savings Account' },
    ];

    // Mark for highlighting
    markTransactionForHighlight(mockTransferTransaction.id);
    const highlightTransactionId = getTransactionToHighlight();

    const transactionItem = TransactionListItem({
      transaction: mockTransferTransaction,
      currentFilter: 'all',
      accounts: mockAccounts,
      shouldHighlight:
        highlightTransactionId &&
        highlightTransactionId.includes(mockTransferTransaction.id),
    });

    document.body.appendChild(transactionItem);

    // Verify transfer display
    expect(
      transactionItem.querySelector('.transaction-item-category').textContent
    ).toBe('Transfer: Main Account → Savings Account');

    // Wait for highlight animation
    await new Promise(resolve => setTimeout(resolve, 150));

    // Verify highlight was applied
    expect(transactionItem.classList.contains('success-highlight-active')).toBe(
      true
    );
  });
});
