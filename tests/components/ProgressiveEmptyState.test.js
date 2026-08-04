// tests/components/ProgressiveEmptyState.test.js
import { describe, it, expect, vi } from 'vitest';
import { ProgressiveEmptyState } from '../../src/components/ProgressiveEmptyState.js';
import { getProgressiveUnlockMessage } from '../../src/utils/enhanced-empty-states.js';

describe('ProgressiveEmptyState Component', () => {
  it('should return null when transaction count meets or exceeds threshold', () => {
    const el = ProgressiveEmptyState({
      section: 'budgets',
      transactionCount: 30,
      minTransactions: 30,
    });
    expect(el).toBeNull();
  });

  it('should render progressive unlock card when below threshold', () => {
    const el = ProgressiveEmptyState({
      section: 'budgets',
      transactionCount: 10,
      minTransactions: 30,
    });

    expect(el).not.toBeNull();
    expect(el.tagName).toBe('DIV');
    expect(el.className).toContain('progressive-empty-state');
    expect(el.textContent).toContain('10 / 30 transactions');
    expect(el.textContent).toContain('Log 20 more transactions');
  });

  it('should handle zero transactions correctly', () => {
    const el = ProgressiveEmptyState({
      section: 'forecasts',
      transactionCount: 0,
      minTransactions: 90,
    });

    expect(el).not.toBeNull();
    expect(el.textContent).toContain('0 / 90 transactions');
    expect(el.textContent).toContain('Log 90 transactions');
  });

  it('should call onAction when CTA button is clicked', () => {
    const onAction = vi.fn();
    const el = ProgressiveEmptyState({
      section: 'goals',
      transactionCount: 5,
      minTransactions: 30,
      onAction,
    });

    const button = el.querySelector('button');
    expect(button).not.toBeNull();
    button.click();
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});

describe('getProgressiveUnlockMessage Utility', () => {
  it('should return null when transaction count meets threshold', () => {
    expect(getProgressiveUnlockMessage('budgets', 30)).toBeNull();
    expect(getProgressiveUnlockMessage('forecasts', 90)).toBeNull();
  });

  it('should return unlock message when below threshold', () => {
    const msg = getProgressiveUnlockMessage('budgets', 10);
    expect(msg).toContain('Log 20 more transactions');
  });

  it('should preserve backward compatibility for single parameter calls', () => {
    expect(getProgressiveUnlockMessage(10)).toContain('Log 20 more transactions');
    expect(getProgressiveUnlockMessage(30)).toBeNull();
  });
});
