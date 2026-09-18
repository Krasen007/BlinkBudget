import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../src/core/budget-service.js', () => ({
  BudgetService: { getAll: vi.fn() },
}));

vi.mock('../../src/core/budget-planner.js', () => ({
  BudgetPlanner: { getBudgetsStatus: vi.fn() },
}));

vi.mock('../../src/core/transaction-service.js', () => ({
  TransactionService: { getAll: vi.fn(() => []) },
}));

vi.mock('../../src/core/Account/account-service.js', () => ({
  AccountService: { getAccounts: vi.fn(() => []) },
}));

vi.mock('../../src/core/settings-service.js', () => ({
  SettingsService: { getAllSettings: vi.fn(() => ({})) },
}));

import { InsightsGenerator } from '../../src/core/insights-generator.js';
import { BudgetService } from '../../src/core/budget-service.js';
import { BudgetPlanner } from '../../src/core/budget-planner.js';
import { BackupService } from '../../src/core/backup-service.js';

const currentPeriod = {
  startDate: new Date('2026-02-01T00:00:00.000Z'),
  endDate: new Date('2026-02-28T23:59:59.999Z'),
};

// BackupService pulls DOM globals at export time in jsdom; stub the
// download chain once (Blob must be a real constructor for `new Blob`).
const stubDownloads = () => {
  global.URL.createObjectURL = vi.fn(() => 'mock-url');
  global.URL.revokeObjectURL = vi.fn();
  global.Blob = class {
    constructor(content, options = {}) {
      this.content = content;
      this.type = options?.type;
    }
  };
  const link = { href: '', download: '', click: vi.fn() };
  vi.spyOn(document, 'createElement').mockReturnValue(link);
  vi.spyOn(document.body, 'appendChild').mockImplementation(() => link);
  vi.spyOn(document.body, 'removeChild').mockImplementation(() => link);
};

describe('Phase A2/A3: logged fallbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('A2: budget-insight failure warns but keeps other insights', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    BudgetPlanner.getBudgetsStatus.mockImplementation(() => {
      throw new Error('budgets exploded');
    });

    const insights = InsightsGenerator.generateSpendingInsights(
      [
        {
          id: 't1',
          amount: 100,
          category: 'Food',
          type: 'expense',
          timestamp: '2026-02-10T10:00:00.000Z',
          date: '2026-02-10',
        },
      ],
      currentPeriod
    );

    expect(Array.isArray(insights)).toBe(true);
    expect(warn).toHaveBeenCalledWith(
      '[InsightsGenerator] Budget insights failed:',
      expect.any(Error)
    );
  });

  it('A3: budgets-fetch failure exports partial with a warning', async () => {
    stubDownloads();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    BudgetService.getAll.mockImplementation(() => {
      throw new Error('budgets store on fire');
    });

    const result = await BackupService.createEmergencyExport();

    expect(result.success).toBe(true);
    expect(result.partial).toBe(true);
    expect(result.warnings).toContain('budgets');
    expect(warn).toHaveBeenCalledWith(
      '[Backup] budgets unavailable for export:',
      expect.any(Error)
    );
  });

  it('A3: healthy export is not partial', async () => {
    stubDownloads();
    BudgetService.getAll.mockReturnValue([]);

    const result = await BackupService.createEmergencyExport();

    expect(result.success).toBe(true);
    expect(result.partial).toBe(false);
    expect(result.warnings).toEqual([]);
  });
});
