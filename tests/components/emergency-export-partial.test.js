import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { DataManagementSection } from '../../src/components/DataManagementSection.js';
import { BackupService } from '../../src/core/backup-service.js';
import { MobileAlert } from '../../src/components/MobileModal.js';

vi.mock('../../src/core/backup-service.js', () => ({
  BackupService: { createEmergencyExport: vi.fn() },
}));
vi.mock('../../src/components/MobileModal.js', () => ({
  MobileAlert: vi.fn(),
}));
vi.mock('../../src/core/transaction-service.js', () => ({
  TransactionService: { getAll: vi.fn(() => []) },
}));
vi.mock('../../src/components/DateInput.js', () => ({
  DateInput: () => document.createElement('input'),
}));
vi.mock('../../src/core/data-integrity-service.js', () => ({
  dataIntegrityService: { performIntegrityCheck: vi.fn() },
}));

const button = (root, text) =>
  [...root.querySelectorAll('button')].find(el => el.textContent === text);

const exportOnce = async section => {
  button(section, '⚠️ Emergency JSON Export').click();
  await vi.dynamicImportSettled();
};

describe('emergency export reports partial results honestly', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('names the sections it could not include', async () => {
    BackupService.createEmergencyExport.mockResolvedValue({
      success: true,
      size: 2048,
      partial: true,
      warnings: ['budgets'],
    });
    const section = DataManagementSection();
    document.body.append(section);

    await exportOnce(section);

    expect(MobileAlert).toHaveBeenCalledTimes(1);
    const { title, message } = MobileAlert.mock.calls[0][0];
    expect(title).toContain('Partially Complete');
    expect(message).toContain('Partial export');
    expect(message).toContain('budgets');
    // Still a success: the file exists and the core data is in it. Showing an
    // error here would train users to distrust a perfectly good backup.
    expect(title).not.toContain('Failed');
    expect(message).toContain('2.0KB');
  });

  it('stays a plain success when nothing was dropped', async () => {
    BackupService.createEmergencyExport.mockResolvedValue({
      success: true,
      size: 2048,
      partial: false,
      warnings: [],
    });
    const section = DataManagementSection();
    document.body.append(section);

    await exportOnce(section);

    const { title, message } = MobileAlert.mock.calls[0][0];
    expect(title).toBe('Export Successful');
    expect(message).not.toContain('Partial');
  });

  it('survives an older result object with no warnings field', async () => {
    BackupService.createEmergencyExport.mockResolvedValue({
      success: true,
      size: 1024,
    });
    const section = DataManagementSection();
    document.body.append(section);

    await exportOnce(section);

    const { title, message } = MobileAlert.mock.calls[0][0];
    expect(title).toBe('Export Successful');
    expect(message).toContain('1.0KB');
  });

  it('leaves the failure path untouched', async () => {
    BackupService.createEmergencyExport.mockResolvedValue({
      success: false,
      error: 'disk full',
    });
    const section = DataManagementSection();
    document.body.append(section);

    await exportOnce(section);

    const { title, message } = MobileAlert.mock.calls[0][0];
    expect(title).toBe('Export Failed');
    expect(message).toContain('disk full');
  });
});
