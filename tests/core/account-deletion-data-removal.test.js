import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// AuthService is mocked so BudgetService's IDOR filter (which returns [] when
// there is no current user) can actually see the seeded budgets. Everything
// else runs for real — the defect was a wrong method name on a live module, so
// mocking the module under test would make the test unpassable for any code
// (guide trap #6).
vi.mock('../../src/core/auth-service.js', () => ({
  AuthService: {
    isAuthenticated: () => true,
    getUserId: () => 'user-1',
    getUserEmail: () => 'user@example.com',
    user: { uid: 'user-1', email: 'user@example.com' },
    logout: vi.fn(),
  },
}));

// Keeps the test offline: the write path calls SyncService.pushToCloudSafe.
vi.mock('../../src/core/sync-service.js', () => ({
  SyncService: {
    pushToCloud: vi.fn(),
    pushToCloudSafe: vi.fn(),
    pullFromCloud: vi.fn(),
  },
}));

class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  clear() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] ?? null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }

  get length() {
    return Object.keys(this.store).length;
  }

  key(index) {
    return Object.keys(this.store)[index] ?? null;
  }
}

// Recognisable sentinels: on a reverted fix the assertion output prints the
// exact data the user asked to have erased.
const SENTINEL_BUDGETS = [
  { id: 'b1', categoryName: 'Food', amountLimit: 100, userId: 'user-1' },
  { id: 'b2', categoryName: 'Transport', amountLimit: 50, userId: 'user-1' },
];

const SENTINEL_INVESTMENTS = [
  {
    id: 'i1',
    symbol: 'AAA',
    name: 'Sentinel Alpha',
    shares: 10,
    purchasePrice: 100,
    currentPrice: 110,
    purchaseDate: '2026-01-05T00:00:00.000Z',
    createdAt: '2026-01-05T00:00:00.000Z',
    updatedAt: '2026-01-05T00:00:00.000Z',
  },
  {
    id: 'i2',
    symbol: 'BBB',
    name: 'Sentinel Beta',
    shares: 5,
    purchasePrice: 200,
    currentPrice: 190,
    purchaseDate: '2026-01-06T00:00:00.000Z',
    createdAt: '2026-01-06T00:00:00.000Z',
    updatedAt: '2026-01-06T00:00:00.000Z',
  },
];

const readJson = (key, fallback) => {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : fallback;
};

describe('AccountDeletionService data removal', () => {
  const storage = new LocalStorageMock();

  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('localStorage', storage);
    storage.clear();
    localStorage.setItem(
      'blinkbudget_budgets',
      JSON.stringify(SENTINEL_BUDGETS)
    );
    localStorage.setItem(
      'blinkbudget_investments',
      JSON.stringify(SENTINEL_INVESTMENTS)
    );
    localStorage.setItem('blinkbudget_transactions', JSON.stringify([]));
    localStorage.setItem('blinkbudget_accounts', JSON.stringify([]));
    localStorage.setItem('blinkbudget_goals', JSON.stringify([]));
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const load = async () =>
    (await import('../../src/core/Account/account-deletion-service.js'))
      .accountDeletionService;

  const emptyResult = () => ({
    steps: [],
    dataDeleted: {
      transactions: 0,
      accounts: 0,
      settings: 0,
      goals: 0,
      investments: 0,
      budgets: 0,
      auditLogs: 0,
    },
    errors: [],
    warnings: [],
  });

  // Regression for #4.1: InvestmentTracker was imported as a class and its
  // instance methods called statically, so the whole investment block threw
  // and the data survived an explicit erasure request.
  it('removes investments from localStorage', async () => {
    const service = await load();
    const result = emptyResult();

    await service.stepDeleteUserData(result, {});

    expect(readJson('blinkbudget_investments', null)).toEqual([]);
    expect(result.dataDeleted.investments).toBe(2);
    expect(result.warnings).toEqual([]);
  });

  // Same root cause, different method: BudgetService exposes delete(id), not
  // deleteBudget(id).
  it('removes budgets from localStorage', async () => {
    const service = await load();
    const result = emptyResult();

    await service.stepDeleteUserData(result, {});

    expect(readJson('blinkbudget_budgets', null)).toEqual([]);
    expect(result.dataDeleted.budgets).toBe(2);
    expect(result.warnings).toEqual([]);
  });

  it('leaves no data behind after deletion and verification', async () => {
    const service = await load();
    const result = emptyResult();

    await service.stepDeleteUserData(result, {});
    await service.stepVerifyDeletion(result, {});

    expect(readJson('blinkbudget_investments', null)).toEqual([]);
    expect(readJson('blinkbudget_budgets', null)).toEqual([]);

    // The budget/investment verification branches specifically, rather than
    // allChecksPass — this suite leaves auth and settings checks unsatisfied
    // by design, so the aggregate would fail for unrelated reasons.
    const verifyStep = result.steps.find(
      step => step.name === 'Deletion Verification'
    );
    expect(verifyStep.verificationResults.investmentCheck).toBe(true);
    expect(verifyStep.verificationResults.budgetCheck).toBe(true);
  });

  // Regression for #3.1: the `InvestmentTracker.getAllInvestments ? ... : []`
  // guard was permanently false, so the confirmation screen told the user they
  // had 0 investments while holding two.
  it('reports the real investment and budget counts in the summary', async () => {
    const service = await load();

    const summary = await service.getUserDataSummary();

    expect(summary.investments).toBe(2);
    expect(summary.budgets).toBe(2);
  });

  it('reports zero once the data is actually gone', async () => {
    const service = await load();

    await service.stepDeleteUserData(emptyResult(), {});
    const summary = await service.getUserDataSummary();

    expect(summary.investments).toBe(0);
    expect(summary.budgets).toBe(0);
  });
});
