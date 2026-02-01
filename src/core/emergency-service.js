import { TransactionService } from './transaction-service.js';
import { AccountService } from './account-service.js';
import { SettingsService } from './settings-service.js';
import { BudgetService } from './budget-service.js';
import { StorageService } from './storage.js';

/**
 * EmergencyService
 * Provides fail-safe data extraction and recovery utilities.
 * Specifically designed to bypass cloud-sync logic for local-first recovery.
 */
export const EmergencyService = {
  /**
   * Aggregates all local application data into a single JSON object.
   * @returns {Object} Full application state
   */
  exportFullState: () => {
    const state = {
      version: '1.17',
      exportDate: new Date().toISOString(),
      source: 'Local Emergency Recovery',
      data: {
        transactions: TransactionService.getAll(),
        accounts: AccountService.getAccounts(),
        budgets: BudgetService.getAll(),
        settings: {
          common: SettingsService.getCommonSettings
            ? SettingsService.getCommonSettings()
            : {},
          all: localStorage.getItem('blinkbudget_settings')
            ? JSON.parse(localStorage.getItem('blinkbudget_settings'))
            : {},
        },
        investments: StorageService.getInvestments
          ? StorageService.getInvestments()
          : [],
        goals: StorageService.getGoals ? StorageService.getGoals() : [],
      },
    };

    return state;
  },

  /**
   * Triggers a browser download of the emergency state.
   */
  triggerEmergencyDownload: () => {
    try {
      const state = EmergencyService.exportFullState();
      const content = JSON.stringify(state, null, 2);
      const blob = new Blob([content], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');

      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `BlinkBudget_EMERGENCY_RECOVERY_${dateStr}.json`;
      a.click();
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error('[EmergencyService] Export failed:', error);
      return { success: false, error };
    }
  },
};
