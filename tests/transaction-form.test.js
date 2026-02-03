import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TransactionForm } from '../src/components/TransactionForm.js';

// Mock AccountService
vi.mock('../src/core/account-service.js', () => ({
  AccountService: {
    getAccounts: () => [
      { id: 'main', name: 'Main Account' },
      { id: 'savings', name: 'Savings' },
    ],
    getDefaultAccount: () => ({ id: 'main', name: 'Main Account' }),
  },
}));

// Mock mobile utils
global.window.mobileUtils = {
  supportsHaptic: () => true,
  hapticFeedback: vi.fn(),
  isMobile: () => true,
  preventInputZoom: vi.fn(),
  scrollIntoViewAboveKeyboard: vi.fn(),
};

describe('TransactionForm', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('should include refund type button in type toggle group', () => {
    const mockSubmit = vi.fn();
    const form = TransactionForm({ onSubmit: mockSubmit });
    document.body.appendChild(form);

    // Find all type toggle buttons
    const typeButtons = form.querySelectorAll('.type-toggle-btn');

    // Should have 4 buttons: Expense, Income, Transfer, Refund
    expect(typeButtons).toHaveLength(4);

    // Check button labels
    const buttonLabels = Array.from(typeButtons).map(btn => btn.textContent);
    expect(buttonLabels).toContain('Expense');
    expect(buttonLabels).toContain('Income');
    expect(buttonLabels).toContain('Transfer');
    expect(buttonLabels).toContain('Refund');
  });



  it('should apply refund-specific styling to refund button when active', () => {
    const mockSubmit = vi.fn();
    const form = TransactionForm({ onSubmit: mockSubmit });
    document.body.appendChild(form);

    // Find the refund button
    const typeButtons = form.querySelectorAll('.type-toggle-btn');
    const refundButton = Array.from(typeButtons).find(
      btn => btn.textContent === 'Refund'
    );

    // Click refund button to make it active
    refundButton.click();

    // Check that it has the teal/cyan background color for refunds (browser converts hex to rgb)
    expect(refundButton.style.background).toBe('rgb(6, 182, 212)');
    expect(refundButton.style.color).toBe('white');
  });





  it('should show OK button on mobile when editing an existing transaction', () => {
    const mockSubmit = vi.fn();
    const initialValues = {
      id: '123',
      amount: 50,
      type: 'expense',
      category: 'Food',
      accountId: 'main',
      timestamp: Date.now(),
    };

    const form = TransactionForm({
      onSubmit: mockSubmit,
      initialValues,
    });
    document.body.appendChild(form);

    // Find OK button
    const buttons = form.querySelectorAll('button');
    const okButton = Array.from(buttons).find(btn => btn.textContent === 'OK');

    expect(okButton).toBeTruthy();
    expect(okButton.style.display).not.toBe('none');
  });
});
