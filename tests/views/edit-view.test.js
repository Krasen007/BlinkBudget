import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EditView } from '../../src/views/EditView.js';
import { TransactionService } from '../../src/core/transaction-service.js';

// Mock dependency: TransactionForm to capture onSubmit callback
let capturedOnSubmit = null;
vi.mock('../../src/components/TransactionForm.js', () => ({
  TransactionForm: options => {
    capturedOnSubmit = options.onSubmit;
    return document.createElement('form');
  },
}));

// Mock dependency: DateInput
vi.mock('../../src/components/DateInput.js', () => ({
  DateInput: () => document.createElement('input'),
}));

// Mock dependency: AuthService
vi.mock('../../src/core/auth-service.js', () => ({
  AuthService: {
    getUserId: () => 'user-1',
  },
}));

// Mock dependency: Router
vi.mock('../../src/core/router.js', () => ({
  Router: {
    navigate: vi.fn(),
  },
}));

// Mock dependency: TransactionService
const mockTransactions = {};
vi.mock('../../src/core/transaction-service.js', () => ({
  TransactionService: {
    get: vi.fn(id => mockTransactions[id]),
    add: vi.fn(tx => {
      const id = tx.id || `ghost-id-${Math.random().toString(36).substr(2, 9)}`;
      const newTx = { ...tx, id };
      mockTransactions[id] = newTx;
      return newTx;
    }),
    update: vi.fn((id, updates) => {
      if (mockTransactions[id]) {
        mockTransactions[id] = { ...mockTransactions[id], ...updates };
      }
      return mockTransactions[id];
    }),
    remove: vi.fn(id => {
      delete mockTransactions[id];
    }),
  },
}));

describe('EditView - Recent Transaction Ghosting Prevention', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    // Clear mock storage
    Object.keys(mockTransactions).forEach(key => delete mockTransactions[key]);
    vi.clearAllMocks();
    capturedOnSubmit = null;
  });

  it('should not create a ghost transaction when edited less than 5 minutes after creation', () => {
    // Setup a recent transaction (created 2 minutes ago)
    const recentTx = {
      id: 'tx-recent',
      amount: 100,
      timestamp: '2026-05-26T20:00:00.000Z',
      createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      userId: 'user-1',
    };
    mockTransactions[recentTx.id] = recentTx;

    // Render EditView
    EditView({ id: recentTx.id });

    // Verify onSubmit is captured
    expect(capturedOnSubmit).toBeTruthy();

    // Submit with a different date
    capturedOnSubmit({
      timestamp: '2026-05-27T20:00:00.000Z',
      amount: 100,
    });

    // Expect TransactionService.add to NOT have been called (no ghost created)
    expect(TransactionService.add).not.toHaveBeenCalled();

    // Expect TransactionService.update to have updated the transaction with cleared metadata
    expect(TransactionService.update).toHaveBeenCalledWith(
      'tx-recent',
      expect.objectContaining({
        timestamp: '2026-05-27T20:00:00.000Z',
        originalDate: null,
        ghostId: null,
      })
    );
  });

  it('should create a ghost transaction when edited more than 5 minutes after creation', () => {
    // Setup an older transaction (created 10 minutes ago)
    const oldTx = {
      id: 'tx-old',
      amount: 100,
      timestamp: '2026-05-26T20:00:00.000Z',
      createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      userId: 'user-1',
    };
    mockTransactions[oldTx.id] = oldTx;

    // Render EditView
    EditView({ id: oldTx.id });

    // Submit with a different date
    capturedOnSubmit({
      timestamp: '2026-05-27T20:00:00.000Z',
      amount: 100,
    });

    // Expect TransactionService.add to have been called to create a ghost transaction
    expect(TransactionService.add).toHaveBeenCalled();

    // Expect transaction to point to the new ghost
    expect(TransactionService.update).toHaveBeenCalledWith(
      'tx-old',
      expect.objectContaining({
        timestamp: '2026-05-27T20:00:00.000Z',
        originalDate: '2026-05-26T20:00:00.000Z',
        ghostId: expect.any(String),
      })
    );
  });

  it('should create a ghost transaction if createdAt is missing (legacy transaction)', () => {
    // Setup a legacy transaction with no createdAt field
    const legacyTx = {
      id: 'tx-legacy',
      amount: 100,
      timestamp: '2026-05-26T20:00:00.000Z',
      userId: 'user-1',
    };
    mockTransactions[legacyTx.id] = legacyTx;

    // Render EditView
    EditView({ id: legacyTx.id });

    // Submit with a different date
    capturedOnSubmit({
      timestamp: '2026-05-27T20:00:00.000Z',
      amount: 100,
    });

    // Expect TransactionService.add to have been called to create a ghost transaction
    expect(TransactionService.add).toHaveBeenCalled();
  });

  it('should preserve reversion logic: delete existing ghost when reverting to originalDate', () => {
    // Setup a transaction that already has a ghost and is old
    const ghostId = 'ghost-4';
    const tx = {
      id: 'tx-revert',
      amount: 100,
      timestamp: '2026-05-27T20:00:00.000Z',
      createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      originalDate: '2026-05-26T20:00:00.000Z',
      ghostId: ghostId,
      userId: 'user-1',
    };
    const ghostTx = {
      id: ghostId,
      amount: 100,
      timestamp: '2026-05-26T20:00:00.000Z',
      isGhost: true,
      movedToDate: '2026-05-27T20:00:00.000Z',
    };

    mockTransactions[tx.id] = tx;
    mockTransactions[ghostId] = ghostTx;

    // Render EditView
    EditView({ id: tx.id });

    // Submit reverting back to the original date
    capturedOnSubmit({
      timestamp: '2026-05-26T20:00:00.000Z',
      amount: 100,
    });

    // Expect TransactionService.remove to be called with the ghost's ID
    expect(TransactionService.remove).toHaveBeenCalledWith(ghostId);

    // Expect transaction metadata to be cleared
    expect(TransactionService.update).toHaveBeenCalledWith(
      'tx-revert',
      expect.objectContaining({
        timestamp: '2026-05-26T20:00:00.000Z',
        originalDate: null,
        ghostId: null,
      })
    );
  });
});
