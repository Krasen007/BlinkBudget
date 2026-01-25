/**
 * BudgetService
 * 
 * Handles all budget-related operations and persistence.
 */

import { STORAGE_KEYS } from '../utils/constants.js';
import { SyncService } from './sync-service.js';
import { AuthService } from './auth-service.js';
import { generateId } from '../utils/id-utils.js';
import { safeJsonParse } from '../utils/security-utils.js';

const BUDGETS_KEY = STORAGE_KEYS.BUDGETS;

export const BudgetService = {
    /**
     * Get all budgets
     * @returns {Array} List of budgets
     */
    getAll() {
        const data = localStorage.getItem(BUDGETS_KEY);
        return data ? safeJsonParse(data) : [];
    },

    /**
     * Add or update a budget
     * @param {Object} budgetData - Budget data
     * @returns {Object} Added/updated budget
     */
    save(budgetData) {
        const budgets = this.getAll();
        const index = budgets.findIndex(b => b.categoryName === budgetData.categoryName);

        let budget;
        if (index !== -1) {
            // Update existing
            budget = {
                ...budgets[index],
                ...budgetData,
                updatedAt: new Date().toISOString()
            };
            budgets[index] = budget;
        } else {
            // Add new
            budget = {
                id: generateId(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                userId: AuthService.getUserId(),
                period: 'monthly',
                ...budgetData,
            };
            budgets.push(budget);
        }

        this._persist(budgets);
        return budget;
    },

    /**
     * Delete a budget
     * @param {string} id - Budget ID
     */
    delete(id) {
        let budgets = this.getAll();
        budgets = budgets.filter(b => b.id !== id);
        this._persist(budgets);
    },

    /**
     * Get budget for a specific category
     * @param {string} categoryName - Category name
     * @returns {Object|null} Budget or null
     */
    getByCategory(categoryName) {
        const budgets = this.getAll();
        return budgets.find(b => b.categoryName === categoryName) || null;
    },

    /**
     * Private helper to persist budgets
     */
    _persist(budgets, sync = true) {
        localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
        if (sync) {
            SyncService.pushToCloud(BUDGETS_KEY, budgets);
        }
    },
};
