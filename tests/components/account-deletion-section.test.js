import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountDeletionSection } from '../../src/components/AccountDeletionSection.js';
import { accountDeletionService } from '../../src/core/Account/account-deletion-service.js';
import { MobileAlert } from '../../src/components/MobileModal.js';
import { AuthService } from '../../src/core/auth-service.js';

vi.mock('../../src/core/Account/account-deletion-service.js', () => ({
  accountDeletionService: {
    getUserDataSummary: vi.fn(),
    initiateAccountDeletion: vi.fn(),
  },
}));
vi.mock('../../src/components/MobileModal.js', () => ({
  MobileAlert: vi.fn(),
}));
vi.mock('../../src/core/auth-service.js', () => ({
  AuthService: { logout: vi.fn() },
}));

describe('AccountDeletionSection failure handling', () => {
  let button;
  let log;
  let location;

  beforeEach(async () => {
    vi.resetAllMocks();
    log = vi.spyOn(console, 'error').mockImplementation(() => {});
    location = { href: '/settings', hash: '#settings' };
    vi.stubGlobal('window', { location });
    accountDeletionService.getUserDataSummary.mockResolvedValue({
      transactions: 12,
      accounts: 2,
      goals: 0,
      investments: 0,
      budgets: 0,
      settings: 1,
      totalStorageSize: 1024,
    });
    MobileAlert.mockResolvedValue(true);
    AuthService.logout.mockResolvedValue();
    const section = AccountDeletionSection();
    button = section.querySelector('button');
    button.click();
    await vi.dynamicImportSettled();
    expect(button.textContent).toBe('⚠️ Confirm Deletion');
    expect(
      accountDeletionService.initiateAccountDeletion
    ).not.toHaveBeenCalled();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // Invoke the installed final-confirmation handler directly to isolate its
  // result contract from ButtonComponent's separate summary-loading listener.
  const confirmDeletion = () => button.onclick();

  it('stops on cancellation without deleting or logging out', async () => {
    MobileAlert.mockResolvedValueOnce(false);
    await confirmDeletion();
    expect(MobileAlert).toHaveBeenCalledWith(
      expect.objectContaining({ showCancel: true, cancelButtonText: 'Cancel' })
    );
    expect(
      accountDeletionService.initiateAccountDeletion
    ).not.toHaveBeenCalled();
    expect(AuthService.logout).not.toHaveBeenCalled();
    expect(button.disabled).toBe(false);
    expect(location.href).toBe('/settings');
  });

  it('reports returned failures without manufacturing an exception', async () => {
    accountDeletionService.initiateAccountDeletion.mockResolvedValue({
      success: false,
      errors: ['Export failed', 'Verification failed'],
    });
    await confirmDeletion();
    expect(log).toHaveBeenCalledExactlyOnceWith(
      'Account deletion failed:',
      'Deletion failed: Export failed, Verification failed'
    );
    expect(MobileAlert).toHaveBeenLastCalledWith({
      title: '❌ Deletion Failed',
      message:
        'Account deletion failed: Deletion failed: Export failed, Verification failed',
      buttonText: 'OK',
    });
    expect(button.textContent).toBe('🗑️ Delete My Account');
    expect(button.disabled).toBe(false);
    expect(
      accountDeletionService.initiateAccountDeletion
    ).toHaveBeenCalledTimes(1);
    expect(AuthService.logout).not.toHaveBeenCalled();
    expect(location.href).toBe('/settings');
  });

  it('reports genuine exceptions and resets the button', async () => {
    const error = new Error('Service unavailable');
    accountDeletionService.initiateAccountDeletion.mockRejectedValue(error);
    await confirmDeletion();
    expect(log).toHaveBeenCalledExactlyOnceWith(
      'Account deletion failed:',
      error
    );
    expect(MobileAlert).toHaveBeenLastCalledWith({
      title: '❌ Deletion Failed',
      message: 'Account deletion failed: Service unavailable',
      buttonText: 'OK',
    });
    expect(button.disabled).toBe(false);
    expect(button.textContent).toBe('🗑️ Delete My Account');
    expect(location.href).toBe('/settings');
  });

  it('preserves the reauthentication branch rather than treating it as ordinary failure', async () => {
    accountDeletionService.initiateAccountDeletion.mockResolvedValue({
      success: false,
      requiresReauth: true,
      errors: ['Recent login required'],
    });
    await confirmDeletion();
    expect(MobileAlert).toHaveBeenLastCalledWith(
      expect.objectContaining({
        title: '🔒 Security Check',
        buttonText: 'Log Out Now',
      })
    );
    expect(AuthService.logout).toHaveBeenCalledTimes(1);
    expect(location.hash).toBe('#login');
    expect(log).not.toHaveBeenCalled();
    expect(
      accountDeletionService.initiateAccountDeletion
    ).toHaveBeenCalledTimes(1);
  });

  it('keeps success feedback and the landing-page redirect', async () => {
    accountDeletionService.initiateAccountDeletion.mockResolvedValue({
      success: true,
      dataDeleted: { transactions: 12 },
    });
    await confirmDeletion();
    expect(MobileAlert).toHaveBeenLastCalledWith(
      expect.objectContaining({ title: '✅ Account Deleted' })
    );
    expect(location.href).toBe('/');
    expect(log).not.toHaveBeenCalled();
  });

  it('never deletes if final confirmation rejects', async () => {
    MobileAlert.mockRejectedValueOnce(new Error('Confirmation unavailable'));
    await confirmDeletion();
    expect(
      accountDeletionService.initiateAccountDeletion
    ).not.toHaveBeenCalled();
    expect(button.disabled).toBe(false);
    expect(MobileAlert).toHaveBeenLastCalledWith(
      expect.objectContaining({ title: '❌ Deletion Failed' })
    );
  });
});
