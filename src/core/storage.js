import { AccountService } from './account-service.js';
import { TransactionService } from './transaction-service.js';
import { SettingsService } from './settings-service.js';
import { InvestmentTracker } from './investment-tracker.js';
import { GoalPlanner } from './goal-planner.js';
import { SyncService } from './sync-service.js';
import { STORAGE_KEYS } from '../utils/constants.js';
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
  // Serialized per-key push chains to avoid concurrent write races
  _pushChains: new Map(),

  // Safely push data to cloud with retries and per-key serialization.
  // This method never throws and will emit a `sync-error` event on final failure.
  _pushToCloudSafe: function (key, data, retries = 3) {
    const attemptPush = async () => {
      let attempt = 0;
      let delay = 500; // initial backoff
      while (true) {
        try {
          await SyncService.pushToCloud(key, data);
          return;
        } catch (err) {
          attempt += 1;
          if (attempt > retries) {
            console.error(`[Storage] pushToCloud failed for ${key}:`, err);
            window.dispatchEvent(
              new CustomEvent('sync-error', {
                detail: { key, error: String(err) },
              })
            );
            return;
          }
          // exponential backoff with jitter
          const jitter = Math.floor(Math.random() * 200);
          const wait = delay + jitter;
          await new Promise(res => setTimeout(res, wait));
          delay *= 2;
        }
      }
    };

    const chain = this._pushChains.get(key) || Promise.resolve();
    const newChain = chain.then(() => attemptPush());
    // keep chain but swallow final rejection so it doesn't break subsequent chains
    this._pushChains.set(
      key,
      newChain.catch(() => {})
    );
    return newChain;
  },

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
  getInvestments: function () {
    return this._investmentTracker.getAllInvestments();
  },
  addInvestment: function (
    symbol,
    shares,
    purchasePrice,
    purchaseDate,
    metadata
  ) {
    const res = this._investmentTracker.addInvestment(
      symbol,
      shares,
      purchasePrice,
      purchaseDate,
      metadata
    );
    // Invalidate related caches
    CacheService.del('portfolioSummary');
    // Push updated investments to cloud (authoritative single-doc pattern)
    // Use safe, serialized push with retries (non-blocking)
    this._pushToCloudSafe(
      STORAGE_KEYS.INVESTMENTS,
      this._investmentTracker.getAllInvestments()
    );
    return res;
  },
  updateInvestmentValue: function (symbol, currentPrice) {
    const res = this._investmentTracker.updateInvestmentValue(
      symbol,
      currentPrice
    );
    CacheService.del('portfolioSummary');
    this._pushToCloudSafe(
      STORAGE_KEYS.INVESTMENTS,
      this._investmentTracker.getAllInvestments()
    );
    return res;
  },
  removeInvestment: function (symbol) {
    const res = this._investmentTracker.removeInvestment(symbol);
    CacheService.del('portfolioSummary');
    this._pushToCloudSafe(
      STORAGE_KEYS.INVESTMENTS,
      this._investmentTracker.getAllInvestments()
    );
    return res;
  },
  updateInvestment: function (id, updates) {
    const res = this._investmentTracker.updateInvestment(id, updates);
    CacheService.del('portfolioSummary');
    this._pushToCloudSafe(
      STORAGE_KEYS.INVESTMENTS,
      this._investmentTracker.getAllInvestments()
    );
    return res;
  },
  getInvestment: function (symbol) {
    return this._investmentTracker.getInvestment(symbol);
  },
  calculatePortfolioSummary: function () {
    const cached = CacheService.get('portfolioSummary');
    if (cached) return cached;
    const summary = this._investmentTracker.getPortfolioSummary();
    // Cache for 30 seconds
    CacheService.put('portfolioSummary', summary, 30000);
    return summary;
  },

  // --- Goals (delegated to GoalPlanner) ---
  _goalPlanner: new GoalPlanner(),
  getGoals: function () {
    return this._goalPlanner.getAllGoals();
  },
  createGoal: function (
    name,
    targetAmount,
    targetDate,
    currentSavings = 0,
    options = {}
  ) {
    const res = this._goalPlanner.createGoal(
      name,
      targetAmount,
      targetDate,
      currentSavings,
      options
    );
    CacheService.del('goalsSummary');
    this._pushToCloudSafe(STORAGE_KEYS.GOALS, this._goalPlanner.getAllGoals());
    return res;
  },
  updateGoalProgress: function (goalId, newSavings) {
    const res = this._goalPlanner.updateGoalProgress(goalId, newSavings);
    CacheService.del('goalsSummary');
    this._pushToCloudSafe(STORAGE_KEYS.GOALS, this._goalPlanner.getAllGoals());
    return res;
  },
  deleteGoal: function (goalId) {
    const res = this._goalPlanner.deleteGoal(goalId);
    CacheService.del('goalsSummary');
    this._pushToCloudSafe(STORAGE_KEYS.GOALS, this._goalPlanner.getAllGoals());
    return res;
  },
  updateGoal: function (goalId, updates) {
    const res = this._goalPlanner.updateGoal(goalId, updates);
    CacheService.del('goalsSummary');
    this._pushToCloudSafe(STORAGE_KEYS.GOALS, this._goalPlanner.getAllGoals());
    return res;
  },
  getGoalsSummary: function () {
    const cached = CacheService.get('goalsSummary');
    if (cached) return cached;
    const summary = this._goalPlanner.getGoalsSummary();
    CacheService.put('goalsSummary', summary, 30000);
    return summary;
  },
};
