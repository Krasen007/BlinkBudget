import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettingsService } from '../../src/core/settings-service.js';
import { DashboardView } from '../../src/views/DashboardView.js';

// Mock dependencies for DashboardView
let createPresetsCalled = false;
vi.mock('../../src/components/QuickAmountPresets.js', () => ({
  createQuickAmountPresets: vi.fn(() => {
    createPresetsCalled = true;
    return {
      container: document.createElement('div'),
      destroy: vi.fn(),
    };
  }),
}));

vi.mock('../../src/components/Button.js', () => ({
  ButtonComponent: () => document.createElement('button'),
}));
vi.mock('../../src/components/DashboardStatsCard.js', () => ({
  DashboardStatsCard: () => document.createElement('div'),
}));
vi.mock('../../src/components/TransactionList.js', () => ({
  TransactionList: () => document.createElement('div'),
}));
vi.mock('../../src/core/Account/account-service.js', () => ({
  AccountService: {
    getAccounts: () => [],
    getDefaultAccount: () => ({ id: 'main', name: 'Main Account' }),
  },
}));
vi.mock('../../src/core/transaction-service.js', () => ({
  TransactionService: {
    getAll: () => [],
  },
}));
vi.mock('../../src/core/custom-category-service.js', () => ({
  CustomCategoryService: {
    getCheckboxCategories: () => [],
  },
}));
vi.mock('../../src/core/auth-service.js', () => ({
  AuthService: {
    user: null,
    getUserId: () => 'user-1',
  },
}));
vi.mock('../../src/core/router.js', () => ({
  Router: {
    navigate: vi.fn(),
  },
}));
vi.mock('../../src/core/navigation-state.js', () => ({
  NavigationState: {
    restoreDashboardFilter: () => null,
    restoreDashboardTypeFilter: () => null,
    clearDashboardFilter: vi.fn(),
    clearDashboardTypeFilter: vi.fn(),
  },
}));
vi.mock('../../src/utils/success-feedback.js', () => ({
  getTransactionToHighlight: () => [],
}));
vi.mock('../../src/utils/navigation-helper.js', () => ({
  createNavigationButtons: () => document.createElement('div'),
}));
vi.mock('../../src/core/analytics/AnalyticsInstance.js', () => ({
  getAnalyticsEngine: () => ({
    generateSpendingInsights: () => [],
    calculateCategoryBreakdown: () => ({}),
    calculateIncomeVsExpenses: () => ({}),
    calculateCostOfLiving: () => ({}),
  }),
}));

// Mock window events check
vi.stubGlobal('dispatchEvent', vi.fn());

describe('SettingsService and Dashboard Presets Visibility', () => {
  let mockLocalStorage;

  beforeEach(() => {
    const store = {};
    mockLocalStorage = {
      getItem: vi.fn(key => store[key] || null),
      setItem: vi.fn((key, value) => {
        store[key] = String(value);
      }),
      removeItem: vi.fn(key => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      }),
    };
    global.localStorage = mockLocalStorage;
    createPresetsCalled = false;
    vi.clearAllMocks();
  });

  describe('SettingsService Defaults', () => {
    it('should default showQuickPresets to false', () => {
      const showQuickPresets = SettingsService.getSetting('showQuickPresets');
      expect(showQuickPresets).toBe(false);
    });

    it('should save and load showQuickPresets correctly', () => {
      SettingsService.saveSetting('showQuickPresets', true);
      expect(SettingsService.getSetting('showQuickPresets')).toBe(true);

      SettingsService.saveSetting('showQuickPresets', false);
      expect(SettingsService.getSetting('showQuickPresets')).toBe(false);
    });
  });

  describe('DashboardView Conditionally Renders Presets', () => {
    it('should NOT call createQuickAmountPresets when showQuickPresets is false', () => {
      SettingsService.saveSetting('showQuickPresets', false);

      DashboardView();

      expect(createPresetsCalled).toBe(false);
    });

    it('should call createQuickAmountPresets when showQuickPresets is true', () => {
      SettingsService.saveSetting('showQuickPresets', true);

      DashboardView();

      expect(createPresetsCalled).toBe(true);
    });
  });
});
