// Phase 3 (#6.1): getSavingsGoals/saveSavingsGoal/deleteSavingsGoal were `async`
// over an `await import()` of a module whose methods are synchronous. They are
// now synchronous, so these assert both the value and the absence of a promise.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../../src/core/storage.js', () => ({
  StorageService: {
    getGoals: vi.fn(() => [{ id: 'g1', name: 'Emergency Fund' }]),
    addGoal: vi.fn(goal => ({ ...goal, id: 'new-goal' })),
    deleteGoal: vi.fn(id => ({ deleted: id })),
  },
}));

describe('SavingsGoalsService storage wrappers', () => {
  let SavingsGoalsService;
  let StorageService;

  beforeEach(async () => {
    vi.resetModules();
    SavingsGoalsService = (
      await import('../../src/core/savings-goals-service.js')
    ).SavingsGoalsService;
    StorageService = (await import('../../src/core/storage.js')).StorageService;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns goals synchronously rather than a promise', () => {
    const result = SavingsGoalsService.getSavingsGoals();
    expect(result).toEqual([{ id: 'g1', name: 'Emergency Fund' }]);
    expect(result).not.toBeInstanceOf(Promise);
    expect(StorageService.getGoals).toHaveBeenCalled();
  });

  it('falls back to an empty array when the bridge returns nothing', () => {
    StorageService.getGoals.mockReturnValueOnce(undefined);
    expect(SavingsGoalsService.getSavingsGoals()).toEqual([]);
  });

  it('saves a goal synchronously', () => {
    const goal = { name: 'Vacation', targetAmount: 2000 };
    const result = SavingsGoalsService.saveSavingsGoal(goal);

    expect(result).toEqual({ ...goal, id: 'new-goal' });
    expect(result).not.toBeInstanceOf(Promise);
    expect(StorageService.addGoal).toHaveBeenCalledWith(goal);
  });

  it('deletes a goal synchronously', () => {
    const result = SavingsGoalsService.deleteSavingsGoal('g1');

    expect(result).toEqual({ deleted: 'g1' });
    expect(result).not.toBeInstanceOf(Promise);
    expect(StorageService.deleteGoal).toHaveBeenCalledWith('g1');
  });

  // A caller that still awaits a now-sync method must keep working, so this
  // guards the GoalsSection-style call pattern from breaking.
  it('remains awaitable by existing async callers', async () => {
    await expect(
      Promise.resolve(SavingsGoalsService.getSavingsGoals())
    ).resolves.toEqual([{ id: 'g1', name: 'Emergency Fund' }]);
  });

  it('uses the manually maintained balance and excludes unlinked transactions', () => {
    const progress = SavingsGoalsService.calculateSingleGoalProgress(
      { id: 'g1', targetAmount: 100, currentSavings: 25 },
      [{ goalId: 'g1', amount: 40, timestamp: new Date().toISOString() }]
    );

    expect(progress.currentAmount).toBe(25);
    expect(progress.percentage).toBe(25);
    expect(progress.contributingTransactions).toBe(0);
    expect(progress.monthlySavingRate).toBeNull();
    expect(progress.fundingModel).toBe('manual');
    expect(progress.fundingNote).toContain(
      'not linked to account balances or transactions'
    );
  });

  it('does not infer emergency-fund progress from transaction categories', async () => {
    StorageService.getGoals.mockReturnValueOnce([]);
    const recommendations = await SavingsGoalsService.getGoalRecommendations([
      {
        type: 'expense',
        category: 'Savings',
        amount: 100,
        timestamp: new Date().toISOString(),
      },
    ]);
    const emergencyFund = recommendations.find(
      recommendation => recommendation.type === 'emergency_fund'
    );

    expect(emergencyFund.current).toBe(0);
    expect(emergencyFund.target).toBe(600);
    expect(emergencyFund.description).toContain('manually tracked goal');
  });
});
