import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountSection } from '../../src/components/AccountSection.js';
import { AccountService } from '../../src/core/Account/account-service.js';

vi.mock('../../src/core/Account/account-service.js', () => ({
  AccountService: {
    getAccounts: vi.fn(),
    saveAccount: vi.fn(),
    deleteAccount: vi.fn(),
  },
}));

const account = { id: 'a1', name: 'Checking', type: 'checking', balance: 125 };
const findButton = (container, text) =>
  [...container.querySelectorAll('button')].find(el => el.textContent === text);

describe('AccountSection rendering failures', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    AccountService.getAccounts.mockReturnValue([account]);
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('shows a visible error and retries loading without writing accounts', () => {
    AccountService.getAccounts.mockImplementationOnce(() => {
      throw new Error('Read failed');
    });
    const section = AccountSection();
    document.body.append(section);

    expect(section.querySelector('[role="alert"]')?.textContent).toContain(
      'Unable to display accounts'
    );
    expect(section.textContent).not.toContain('No accounts yet');
    findButton(section, 'Retry').click();

    expect(section.querySelector('[role="alert"]')).toBeNull();
    expect(section.textContent).toContain('Checking');
    expect(AccountService.getAccounts).toHaveBeenCalledTimes(2);
    expect(AccountService.saveAccount).not.toHaveBeenCalled();
  });

  it('discards partial rendering and allows retry', () => {
    const brokenAccount = {
      get name() {
        throw new Error('Invalid account display');
      },
    };
    AccountService.getAccounts.mockReturnValueOnce([account, brokenAccount]);
    const section = AccountSection();

    expect(section.querySelector('[role="alert"]')).not.toBeNull();
    expect(findButton(section, 'Edit')).toBeUndefined();
    findButton(section, 'Retry').click();
    expect(findButton(section, 'Edit')).toBeDefined();
  });

  it('does not misreport or repeat a successful save when refreshing the list fails', () => {
    const section = AccountSection();
    document.body.append(section);
    findButton(section, 'Edit').click();
    vi.runOnlyPendingTimers();
    const dialog = document.querySelector('[role="dialog"]');
    dialog.querySelector('input').value = 'Renamed';
    AccountService.getAccounts.mockImplementationOnce(() => {
      throw new Error('Refresh failed');
    });

    findButton(dialog, 'Save Changes').click();

    expect(AccountService.saveAccount).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(section.querySelector('[role="alert"]')?.textContent).toContain(
      'Unable to display accounts'
    );
    expect(document.body.textContent).not.toContain('Failed to update account');
    findButton(section, 'Retry').click();
    expect(AccountService.saveAccount).toHaveBeenCalledTimes(1);
    expect(section.querySelector('[role="alert"]')).toBeNull();
  });
});
