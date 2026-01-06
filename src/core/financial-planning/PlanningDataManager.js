import { TransactionService } from '../transaction-service.js';
import { AccountService } from '../account-service.js';
import { StorageService } from '../storage.js';
import { STORAGE_KEYS } from '../../utils/constants.js';

/**
 * PlanningDataManager - Manages loading and caching of financial planning data
 */
export class PlanningDataManager {
  constructor() {
    this.data = null;
    this.isLoading = false;
    this.lastUpdated = null;
    this.listeners = new Set();
  }

  /**
   * Subscribe to data updates
   * @param {Function} callback - Callback function to call when data updates
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of data changes
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.data);
      } catch (error) {
        console.error('Error notifying planning data listener:', error);
      }
    });
  }

  /**
   * Load planning data from various services
   * @returns {Promise<Object>} Planning data object
   */
  async loadData() {
    if (this.isLoading) return this.data;

    try {
      this.isLoading = true;

      // Get transaction and account data
      const transactions = TransactionService.getAll();
      const accounts = AccountService.getAccounts();

      // Load investment data and goals (prefer local cache first)
      const investmentsKey = STORAGE_KEYS.INVESTMENTS;
      const goalsKey = STORAGE_KEYS.GOALS;

      const investmentsCacheRaw = localStorage.getItem(investmentsKey);
      if (investmentsCacheRaw)
        console.log(`[Sync] ${investmentsKey} loaded from cache`);
      const goalsCacheRaw = localStorage.getItem(goalsKey);
      if (goalsCacheRaw) console.log(`[Sync] ${goalsKey} loaded from cache`);

      const investments = StorageService.getInvestments
        ? StorageService.getInvestments()
        : [];
      const goals = StorageService.getGoals ? StorageService.getGoals() : [];

      const timestamp = new Date();

      this.data = {
        transactions,
        accounts,
        investments,
        goals,
        lastUpdated: timestamp,
      };

      this.lastUpdated = timestamp;
      this.notifyListeners();
      this.notifyListeners();

      return this.data;
    } catch (error) {
      console.error('Error loading planning data:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Get current planning data (may be stale)
   * @returns {Object|null} Current planning data or null if not loaded
   */
  getData() {
    return this.data;
  }

  /**
   * Check if data needs refresh
   * @param {number} maxAge - Maximum age in milliseconds (default: 5 minutes)
   * @returns {boolean} True if data should be refreshed
   */
  needsRefresh(maxAge = 5 * 60 * 1000) {
    if (!this.lastUpdated) return true;
    return Date.now() - this.lastUpdated.getTime() > maxAge;
  }

  /**
   * Force refresh of planning data
   * @returns {Promise<Object>} Fresh planning data
   */
  async refresh() {
    this.data = null;
    this.lastUpdated = null;
    return this.loadData();
  }

  /**
   * Clear cached data
   */
  clear() {
    this.data = null;
    this.lastUpdated = null;
    this.notifyListeners();
  }
}

// Singleton instance
export const planningDataManager = new PlanningDataManager();
