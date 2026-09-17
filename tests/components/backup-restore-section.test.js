import { afterEach, expect, it, vi } from 'vitest';
import { BackupRestoreSection } from '../../src/components/BackupRestoreSection.js';
import { BackupService } from '../../src/core/backup-service.js';
import { showErrorToast } from '../../src/utils/toast-notifications.js';

vi.mock('../../src/core/backup-service.js', () => ({
  BackupService: { restoreBackup: vi.fn() },
}));
vi.mock('../../src/core/settings-service.js', () => ({
  SettingsService: { getSetting: vi.fn(() => null) },
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

it('reports a rejected restore-confirmation import and changes no data', async () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  const section = BackupRestoreSection();
  const restoreButton = [...section.querySelectorAll('button')].find(
    element => element.textContent === 'Restore From Last Backup'
  );
  expect(restoreButton).toBeDefined();

  restoreButton.click();
  await vi.dynamicImportSettled();

  expect(showErrorToast).toHaveBeenCalledExactlyOnceWith(
    'Unable to open the restore confirmation dialog. Operation cancelled; no data was changed.'
  );
  expect(log).toHaveBeenCalledWith(
    'Error loading ConfirmDialog:',
    expect.any(Error)
  );
  expect(BackupService.restoreBackup).not.toHaveBeenCalled();
  section.cleanup();
});
