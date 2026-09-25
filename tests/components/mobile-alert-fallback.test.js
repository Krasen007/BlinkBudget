// The MobileModal chunk itself fails to load — exactly how this happens offline
// or right after a deploy evicts the cached chunk. Before this was guarded, the
// import sat *inside* the catch block, so it threw while handling the original
// error: the user saw nothing and the rejection escaped unhandled.
vi.mock('../../src/components/MobileModal.js', () => {
  throw new Error('Failed to fetch dynamically imported module');
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { accountDeletionService } from '../../src/core/Account/account-deletion-service.js';
import { AccountDeletionSection } from '../../src/components/AccountDeletionSection.js';
import { AuthService } from '../../src/core/auth-service.js';
import { loadMobileAlert } from '../../src/utils/mobile-alert.js';

vi.mock('../../src/core/Account/account-deletion-service.js', () => ({
  accountDeletionService: {
    getUserDataSummary: vi.fn(),
    initiateAccountDeletion: vi.fn(),
  },
}));
vi.mock('../../src/core/auth-service.js', () => ({
  AuthService: { logout: vi.fn() },
}));

describe('error reporting survives a failed MobileModal import', () => {
  let alertSpy;
  let log;

  beforeEach(() => {
    vi.resetAllMocks();
    log = vi.spyOn(console, 'error').mockImplementation(() => {});
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('falls back to window.alert instead of returning the real dialog', async () => {
    const MobileAlert = await loadMobileAlert();

    expect(alertSpy).not.toHaveBeenCalled();
    MobileAlert({ title: 'Export Failed', message: 'An unexpected error' });

    // Title and message are both preserved — the degraded path should not lose
    // the context that tells the user which operation failed.
    expect(alertSpy).toHaveBeenCalledWith(
      'Export Failed\n\nAn unexpected error'
    );
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('MobileModal unavailable'),
      expect.anything()
    );
  });

  it('reports the original failure and never treats the dialog failure as consent', async () => {
    // Vitest wraps errors thrown from a vi.mock factory and preserves the
    // original on `cause`, so unwrap before asserting on identity.
    const errorText = error =>
      [error?.message, error?.cause?.message].filter(Boolean).join(' | ');

    accountDeletionService.getUserDataSummary.mockResolvedValue({
      transactions: 12,
      accounts: 2,
      goals: 0,
      investments: 0,
      budgets: 0,
      settings: 1,
      totalStorageSize: 1024,
    });

    const section = AccountDeletionSection();
    document.body.append(section);
    const button = section.querySelector('button');

    // First click loads the data summary; it installs the confirm handler.
    button.click();
    await vi.dynamicImportSettled();
    expect(button.textContent).toBe('⚠️ Confirm Deletion');

    // Must resolve, not reject: the import failure happens inside the try.
    await expect(button.onclick()).resolves.toBeUndefined();

    // The original failure is still reported, not replaced by the dialog error.
    const reported = log.mock.calls.find(
      ([message]) => message === 'Account deletion failed:'
    );
    expect(reported).toBeDefined();
    expect(errorText(reported[1])).toContain(
      'Failed to fetch dynamically imported module'
    );
    // ...and the user is told, rather than left staring at a dead button.
    expect(alertSpy).toHaveBeenCalledWith(
      expect.stringContaining('Account deletion failed:')
    );
    expect(button.disabled).toBe(false);

    // The critical safety property: a dialog that could not load must never be
    // interpreted as the user confirming an irreversible deletion.
    expect(
      accountDeletionService.initiateAccountDeletion
    ).not.toHaveBeenCalled();
    expect(AuthService.logout).not.toHaveBeenCalled();
  });
});
