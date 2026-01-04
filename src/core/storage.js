import { AccountService } from './account-service.js';
import { TransactionService } from './transaction-service.js';
import { SettingsService } from './settings-service.js';
import { InvestmentTracker } from './investment-tracker.js';
import { GoalPlanner } from './goal-planner.js';
import { CacheService } from './cache-service.js';
import { generateId } from '../utils/id-utils.js';

/**
 * StorageService (Bridge)
 *
 * This service now acts as a backward-compatible bridge to specialized domain services.
 * Existing code can continue to use StorageService while being progressively refactored.
 */
export const StorageService = {
  // Utility
  generateId: () => generateId(),

  // --- Accounts (delegated to AccountService) ---
  getAccounts: () => AccountService.getAccounts(),
  saveAccount: account => AccountService.saveAccount(account),
  deleteAccount: id => AccountService.deleteAccount(id),
  getDefaultAccount: () => AccountService.getDefaultAccount(),
  isAccountDuplicate: (name, type, excludeId) =>
    AccountService.isAccountDuplicate(name, type, excludeId),

  // --- Transactions (delegated to TransactionService) ---
  getAll: () => TransactionService.getAll(),
  add: transaction => TransactionService.add(transaction),
  get: id => TransactionService.get(id),
  update: (id, updates) => TransactionService.update(id, updates),
  remove: id => TransactionService.remove(id),
  clear: () => TransactionService.clear(),

  // --- Settings (delegated to SettingsService) ---
  getSetting: key => SettingsService.getSetting(key),
  saveSetting: (key, value) => SettingsService.saveSetting(key, value),
  
  // --- Investments (delegated to InvestmentTracker) ---
  _investmentTracker: new InvestmentTracker(),
  getInvestments: function() { return this._investmentTracker.getAllInvestments(); },
  addInvestment: function(symbol, shares, purchasePrice, purchaseDate, metadata) {
    const res = this._investmentTracker.addInvestment(symbol, shares, purchasePrice, purchaseDate, metadata);
    // Invalidate related caches
    CacheService.del('portfolioSummary');
    return res;
  },
  updateInvestmentValue: function(symbol, currentPrice) {
    const res = this._investmentTracker.updateInvestmentValue(symbol, currentPrice);
    CacheService.del('portfolioSummary');
    return res;
  },
  removeInvestment: function(symbol) {
    const res = this._investmentTracker.removeInvestment(symbol);
    CacheService.del('portfolioSummary');
    return res;
  },
  updateInvestment: function(id, updates) {
    const res = this._investmentTracker.updateInvestment(id, updates);
    CacheService.del('portfolioSummary');
    return res;
  },
  getInvestment: function(symbol) { return this._investmentTracker.getInvestment(symbol); },
  calculatePortfolioSummary: function() {
    const cached = CacheService.get('portfolioSummary');
    if (cached) return cached;
    const summary = this._investmentTracker.getPortfolioSummary();
    // Cache for 30 seconds
    CacheService.put('portfolioSummary', summary, 30000);
    return summary;
  },

  // --- Goals (delegated to GoalPlanner) ---
  _goalPlanner: new GoalPlanner(),
  getGoals: function() { return this._goalPlanner.getAllGoals(); },
  createGoal: function(name, targetAmount, targetDate, currentSavings = 0, options = {}) {
    const res = this._goalPlanner.createGoal(name, targetAmount, targetDate, currentSavings, options);
    CacheService.del('goalsSummary');
    return res;
  },
  updateGoalProgress: function(goalId, newSavings) {
    const res = this._goalPlanner.updateGoalProgress(goalId, newSavings);
    CacheService.del('goalsSummary');
    return res;
  },
  deleteGoal: function(goalId) {
    const res = this._goalPlanner.deleteGoal(goalId);
    CacheService.del('goalsSummary');
    return res;
  },
  updateGoal: function(goalId, updates) {
    const res = this._goalPlanner.updateGoal(goalId, updates);
    CacheService.del('goalsSummary');
    return res;
  },
  getGoalsSummary: function() {
    const cached = CacheService.get('goalsSummary');
    if (cached) return cached;
    const summary = this._goalPlanner.getGoalsSummary();
    CacheService.put('goalsSummary', summary, 30000);
    return summary;
  },
};
