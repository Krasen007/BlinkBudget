import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DashboardView } from '../../src/views/DashboardView.js';
import { TransactionService } from '../../src/core/transaction-service.js';
import { AuthService } from '../../src/core/auth-service.js';
import {
  EMPTY_STATE_SCENARIOS,
  createEnhancedEmptyState,
} from '../../src/utils/enhanced-empty-states.js';

vi.mock('../../src/components/QuickAmountPresets.js', () => ({
  createQuickAmountPresets: vi.fn(() => ({
    container: document.createElement('div'),
    destroy: vi.fn(),
  })),
}));

vi.mock('../../src/components/Button.js', () => ({
  ButtonComponent: () => document.createElement('button'),
}));

vi.mock('../../src/components/DashboardStatsCard.js', () => ({
  DashboardStatsCard: () => document.createElement('div'),
}));

describe('DashboardView First-Run Greeting and Empty State', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('renders "Welcome to BlinkBudget!" for first-run users without displayName', () => {
    vi.spyOn(TransactionService, 'getAll').mockReturnValue([]);
    AuthService.user = null;

    const el = DashboardView();
    const title = el.querySelector('.view-title');

    expect(title.textContent).toMatch(/^Welcome to BlinkBudget!/);
    if (el.cleanup) el.cleanup();
  });

  it('renders "Welcome to BlinkBudget, [name]!" for first-run users with displayName', () => {
    vi.spyOn(TransactionService, 'getAll').mockReturnValue([]);
    AuthService.user = { displayName: 'Alex' };

    const el = DashboardView();
    const title = el.querySelector('.view-title');

    expect(title.textContent).toMatch(/^Welcome to BlinkBudget, Alex!/);
    if (el.cleanup) el.cleanup();
  });

  it('renders "Hi, [name]!" for returning users with transactions and displayName', () => {
    vi.spyOn(TransactionService, 'getAll').mockReturnValue([
      {
        id: 'tx-1',
        amount: 10,
        category: 'Food',
        type: 'expense',
        timestamp: '2026-08-01T12:00:00.000Z',
      },
    ]);
    AuthService.user = { displayName: 'Alex' };

    const el = DashboardView();
    const title = el.querySelector('.view-title');

    expect(title.textContent).toMatch(/^Hi, Alex!/);
    if (el.cleanup) el.cleanup();
  });

  it('renders "Welcome back!" for returning users with transactions and no displayName', () => {
    vi.spyOn(TransactionService, 'getAll').mockReturnValue([
      {
        id: 'tx-1',
        amount: 10,
        category: 'Food',
        type: 'expense',
        timestamp: '2026-08-01T12:00:00.000Z',
      },
    ]);
    AuthService.user = null;

    const el = DashboardView();
    const title = el.querySelector('.view-title');

    expect(title.textContent).toMatch(/^Welcome back!/);
    if (el.cleanup) el.cleanup();
  });

  it('updates title when auth state changes', () => {
    vi.spyOn(TransactionService, 'getAll').mockReturnValue([]);
    AuthService.user = null;

    const el = DashboardView();
    const title = el.querySelector('.view-title');
    expect(title.textContent).toMatch(/^Welcome to BlinkBudget!/);

    window.dispatchEvent(
      new CustomEvent('auth-state-changed', {
        detail: { user: { displayName: 'Jordan' } },
      })
    );

    expect(title.textContent).toMatch(/^Welcome to BlinkBudget, Jordan!/);
    if (el.cleanup) el.cleanup();
  });

  it('creates NO_TRANSACTIONS empty state with updated icon and text', () => {
    const emptyState = createEnhancedEmptyState(
      EMPTY_STATE_SCENARIOS.NO_TRANSACTIONS
    );
    const icon = emptyState.querySelector('.empty-state__icon');
    const heading = emptyState.querySelector('.empty-state__title');
    const msg = emptyState.querySelector('.empty-state__message');

    expect(icon.textContent).toBe('💰');
    expect(heading.textContent).toBe('Start Tracking Your Spending');
    expect(msg.textContent).toBe(
      'Add your first transaction to see your money story unfold. It only takes 3 clicks.'
    );
  });
});
