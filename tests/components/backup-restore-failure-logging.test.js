import { afterEach, expect, it, vi } from 'vitest';
import { BackupRestoreSection } from '../../src/components/BackupRestoreSection.js';
import { BackupService } from '../../src/core/backup-service.js';
import {
  ConfirmDialog,
  AlertDialog,
} from '../../src/components/ConfirmDialog.js';

vi.mock('../../src/core/backup-service.js', () => ({
  BackupService: { restoreBackup: vi.fn() },
}));
vi.mock('../../src/core/settings-service.js', () => ({
  SettingsService: { getSetting: vi.fn(() => null) },
}));
vi.mock('../../src/utils/toast-notifications.js', () => ({
  showErrorToast: vi.fn(),
}));
// Unlike backup-restore-section.test.js, the dialog chunk here loads fine --
// this suite is about what happens *after* the user confirms.
vi.mock('../../src/components/ConfirmDialog.js', () => ({
  ConfirmDialog: vi.fn(),
  AlertDialog: vi.fn(),
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

const openRestoreConfirmation = async () => {
  const section = BackupRestoreSection();
  const restoreButton = [...section.querySelectorAll('button')].find(
    element => element.textContent === 'Restore From Last Backup'
  );
  restoreButton.click();
  await vi.dynamicImportSettled();
  expect(ConfirmDialog).toHaveBeenCalledTimes(1);
  return section;
};

it('logs the restore failure while still showing the user an alert', async () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  const error = new Error('firestore unavailable');
  BackupService.restoreBackup.mockRejectedValue(error);
  const section = await openRestoreConfirmation();

  await ConfirmDialog.mock.calls[0][0].onConfirm();

  // The diagnostic the todo asked for.
  expect(log).toHaveBeenCalledWith('Restore from backup failed:', error);
  // ...and the pre-existing user feedback is preserved, not replaced.
  expect(AlertDialog).toHaveBeenCalledExactlyOnceWith({
    message: 'Restore failed: firestore unavailable',
  });
  section.cleanup();
});

it('does not log a failure when the restore succeeds', async () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  BackupService.restoreBackup.mockResolvedValue({
    transactions: 1,
    accounts: 1,
    goals: 0,
    investments: 0,
  });
  const section = await openRestoreConfirmation();

  await ConfirmDialog.mock.calls[0][0].onConfirm();

  expect(log).not.toHaveBeenCalled();
  expect(AlertDialog).toHaveBeenCalledExactlyOnceWith({
    message: 'Successfully restored app state from backup.',
  });
  section.cleanup();
});
