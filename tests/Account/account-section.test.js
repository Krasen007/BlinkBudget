// tests/components/account-section.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ACCOUNT_TYPE_LABELS,
  getAccountTypeLabel,
} from '../../src/utils/constants.js';

// Mock AccountService
vi.mock('../../src/core/Account/account-service.js', () => ({
  AccountService: {
    getAccounts: vi.fn(() => []),
    saveAccount: vi.fn(),
    deleteAccount: vi.fn(),
  },
}));

// Mock generateId
vi.mock('../../src/utils/id-utils.js', () => ({
  generateId: vi.fn(() => 'test-id-123'),
}));

// Mock sanitizeInput
vi.mock('../../src/utils/security-utils.js', () => ({
  sanitizeInput: vi.fn(input => input),
}));

describe('Account Type Labels', () => {
  // Expected account types that should be available in the dropdown
  const expectedAccountTypes = [
    { value: 'checking', label: 'Checking Account' },
    { value: 'bank', label: 'Bank Account' },
    { value: 'credit', label: 'Credit Card' },
    { value: 'savings', label: 'Savings Account' },
    { value: 'investment', label: 'Investment Account' },
    { value: 'cash', label: 'Cash' },
    { value: 'other', label: 'Other' },
  ];

  describe('ACCOUNT_TYPE_LABELS constant', () => {
    it('should have all expected account type labels', () => {
      expectedAccountTypes.forEach(({ value, label }) => {
        expect(ACCOUNT_TYPE_LABELS[value]).toBe(label);
      });
    });

    it('should not have missing labels for any dropdown option', () => {
      // This test ensures all dropdown options have corresponding labels
      const dropdownValues = expectedAccountTypes.map(t => t.value);
      dropdownValues.forEach(value => {
        expect(ACCOUNT_TYPE_LABELS).toHaveProperty(value);
      });
    });

    it('should have checking as the first option', () => {
      const keys = Object.keys(ACCOUNT_TYPE_LABELS);
      expect(keys[0]).toBe('checking');
      expect(ACCOUNT_TYPE_LABELS.checking).toBe('Checking Account');
    });
  });

  describe('getAccountTypeLabel function', () => {
    it('should return "Checking Account" for "checking"', () => {
      expect(getAccountTypeLabel('checking')).toBe('Checking Account');
    });

    it('should return "Bank Account" for "bank"', () => {
      expect(getAccountTypeLabel('bank')).toBe('Bank Account');
    });

    it('should return "Credit Card" for "credit"', () => {
      expect(getAccountTypeLabel('credit')).toBe('Credit Card');
    });

    it('should return "Savings Account" for "savings"', () => {
      expect(getAccountTypeLabel('savings')).toBe('Savings Account');
    });

    it('should return "Investment Account" for "investment"', () => {
      expect(getAccountTypeLabel('investment')).toBe('Investment Account');
    });

    it('should return "Cash" for "cash"', () => {
      expect(getAccountTypeLabel('cash')).toBe('Cash');
    });

    it('should return "Other" for "other"', () => {
      expect(getAccountTypeLabel('other')).toBe('Other');
    });

    it('should return "Other" for unknown type', () => {
      expect(getAccountTypeLabel('unknown')).toBe('Other');
    });

    it('should return "Other" for undefined type', () => {
      expect(getAccountTypeLabel(undefined)).toBe('Other');
    });

    it('should return "Other" for null type', () => {
      expect(getAccountTypeLabel(null)).toBe('Other');
    });

    it('should return "Other" for empty string type', () => {
      expect(getAccountTypeLabel('')).toBe('Other');
    });
  });

  describe('Label consistency with dropdown', () => {
    it('dropdown labels should match ACCOUNT_TYPE_LABELS values', () => {
      // This ensures the dropdown options in AccountSection match the labels
      expectedAccountTypes.forEach(({ value, label }) => {
        const actualLabel = getAccountTypeLabel(value);
        expect(actualLabel).toBe(label);
      });
    });

    it('should not display raw database values in labels', () => {
      // Verify that labels are user-friendly, not raw values
      const rawValues = [
        'checking',
        'bank',
        'credit',
        'savings',
        'investment',
        'cash',
        'other',
      ];

      rawValues.forEach(rawValue => {
        const label = getAccountTypeLabel(rawValue);
        // Label should NOT equal the raw value (unless it's "Cash" which happens to match)
        if (rawValue !== 'cash') {
          expect(label).not.toBe(rawValue);
        }
        // Labels should be properly formatted with spaces/title case
        expect(label).toMatch(/^[A-Z]/); // Should start with capital letter
      });
    });
  });
});

describe('AccountSection Component Display', () => {
  beforeEach(() => {
    // Setup jsdom
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders accounts and displays friendly account type labels (not raw types)', async () => {
    const accountModule = await import('../../src/core/Account/account-service.js');
    accountModule.AccountService.getAccounts.mockReturnValue([
      { id: 'a1', name: 'Main Checking', type: 'checking', balance: 100 },
      { id: 'a2', name: 'My Savings', type: 'savings', balance: 200 },
    ]);

    const { AccountSection } =
      await import('../../src/components/AccountSection.js');
    document.body.appendChild(AccountSection());

    // Friendly labels should be present
    expect(document.body.textContent).toContain('Checking Account');
    expect(document.body.textContent).toContain('Savings Account');

    // Ensure the type shown next to the account name is the friendly label
    const nameEl = Array.from(document.querySelectorAll('div')).find(
      d => d.textContent === 'Main Checking'
    );
    expect(nameEl).toBeTruthy();
    const typeEl = nameEl.parentElement.querySelector('div:nth-child(2)');
    expect(typeEl.textContent).toBe('Checking Account');
  });

  it('shows "Other" when account.type is missing', async () => {
    const accountModule = await import('../../src/core/Account/account-service.js');
    accountModule.AccountService.getAccounts.mockReturnValue([
      { id: 'a3', name: 'Mystery Account', balance: 0 },
    ]);

    const { AccountSection } =
      await import('../../src/components/AccountSection.js');
    document.body.appendChild(AccountSection());

    expect(document.body.textContent).toContain('Mystery Account');
    expect(document.body.textContent).toContain('Other');
  });
});