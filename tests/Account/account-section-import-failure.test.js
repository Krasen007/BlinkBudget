import { afterEach, expect, it, vi } from 'vitest';
import { AccountSection } from '../../src/components/AccountSection.js';
import { AccountService } from '../../src/core/Account/account-service.js';
import { showErrorToast } from '../../src/utils/toast-notifications.js';

vi.mock('../../src/core/Account/account-service.js', () => ({
  AccountService: {
    getAccounts: vi.fn(() => [
      { id: 'a1', name: 'Checking', type: 'checking', balance: 10 },
    ]),
    saveAccount: vi.fn(),
    deleteAccount: vi.fn(),
  },
}));
vi.mock('../../src/utils/toast-notifications.js', () => ({
  showErrorToast: vi.fn(),
}));

// The module factory fails during the dynamic import, before any dialog exists.
vi.mock('../../src/components/ConfirmDialog.js', () => {
  throw new Error('Dialog chunk unavailable');
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

it('reports a rejected deletion-confirmation import and changes no data', async () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  const section = AccountSection();
  const deleteButton = [...section.querySelectorAll('button')].find(
    element => element.textContent === 'Delete'
  );
  expect(deleteButton).toBeDefined();

  deleteButton.click();
  await vi.dynamicImportSettled();

  expect(showErrorToast).toHaveBeenCalledExactlyOnceWith(
    'Unable to open the deletion confirmation dialog. Operation cancelled; no data was changed.'
  );
  expect(log).toHaveBeenCalledWith(
    'Error loading ConfirmDialog:',
    expect.any(Error)
  );
  expect(AccountService.deleteAccount).not.toHaveBeenCalled();
});
