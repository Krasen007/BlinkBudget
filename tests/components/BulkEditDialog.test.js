import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BulkEditDialog } from '../../src/components/BulkEditDialog.js';

const { updateMock, markHighlightMock, mockTransactions } = vi.hoisted(() => ({
  updateMock: vi.fn(),
  markHighlightMock: vi.fn(),
  mockTransactions: [
    {
      id: 'tx-1',
      amount: 10,
      category: 'Food',
      accountId: 'acc-1',
      timestamp: '2026-06-07T10:30:00.000Z',
    },
    {
      id: 'tx-2',
      amount: 20,
      category: 'Leisure',
      accountId: 'acc-1',
      timestamp: '2026-06-08T14:45:00.000Z',
    },
  ],
}));

vi.mock('../../src/components/Button.js', () => ({
  ButtonComponent: ({ text, onClick }) => {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.addEventListener('click', onClick);
    return btn;
  },
}));

vi.mock('../../src/core/Account/account-service.js', () => ({
  AccountService: {
    getAccounts: () => [{ id: 'acc-1', name: 'Main Account' }],
  },
}));

vi.mock('../../src/core/custom-category-service.js', () => ({
  CustomCategoryService: {
    getByType: () => [{ name: 'Food' }, { name: 'Leisure' }],
    getCheckboxCategories: () => [{ name: 'Work' }],
  },
}));

vi.mock('../../src/core/transaction-service.js', () => ({
  TransactionService: {
    get: id => mockTransactions.find(t => t.id === id),
    update: updateMock,
  },
}));

vi.mock('../../src/utils/success-feedback.js', () => ({
  markTransactionForHighlight: markHighlightMock,
}));

describe('BulkEditDialog', () => {
  let dialog;

  beforeEach(() => {
    dialog = null;
    updateMock.mockClear();
    markHighlightMock.mockClear();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    if (dialog && typeof dialog.close === 'function') {
      dialog.close();
      dialog = null;
    }
  });

  it('renders a date input field', () => {
    dialog = BulkEditDialog({ selectedIds: new Set(['tx-1']), onClose: vi.fn() });
    const dateInput = document.getElementById('bulk-date');
    expect(dateInput).not.toBeNull();
    expect(dateInput.type).toBe('date');
  });

  it('updates the date of all selected transactions when a new date is chosen', () => {
    dialog = BulkEditDialog({
      selectedIds: new Set(['tx-1', 'tx-2']),
      onClose: vi.fn(),
    });
    document.getElementById('bulk-date').value = '2026-07-01';
    const applyBtn = [...document.querySelectorAll('button')].find(
      b => b.textContent === 'Apply Changes'
    );
    applyBtn.click();
    expect(updateMock).toHaveBeenCalledTimes(2);
    expect(updateMock).toHaveBeenCalledWith('tx-1', {
      timestamp: '2026-07-01T10:30:00.000Z',
    });
    expect(updateMock).toHaveBeenCalledWith('tx-2', {
      timestamp: '2026-07-01T14:45:00.000Z',
    });
  });

  it('does not update timestamp when date field is left empty', () => {
    dialog = BulkEditDialog({ selectedIds: new Set(['tx-1']), onClose: vi.fn() });
    const applyBtn = [...document.querySelectorAll('button')].find(
      b => b.textContent === 'Apply Changes'
    );
    applyBtn.click();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('marks all edited transactions for green highlight animation', () => {
    dialog = BulkEditDialog({
      selectedIds: new Set(['tx-1', 'tx-2']),
      onClose: vi.fn(),
    });
    document.getElementById('bulk-date').value = '2026-07-01';
    const applyBtn = [...document.querySelectorAll('button')].find(
      b => b.textContent === 'Apply Changes'
    );
    applyBtn.click();
    expect(markHighlightMock).toHaveBeenCalledWith('tx-1,tx-2');
  });
});
