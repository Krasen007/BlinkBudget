/**
 * BudgetPlanner
 * 
 * Calculates budget utilization and health based on actual spending.
 */

import { MetricsService } from './analytics/MetricsService.js';
import { BudgetService } from './budget-service.js';
import { getCurrentMonthPeriod } from '../utils/reports-utils.js';

export class BudgetPlanner {
    /**
     * Get utilization for all budgets
     * @param {Array} transactions - List of transactions
     * @returns {Array} List of budget status objects
     */
    static getBudgetsStatus(transactions) {
        const budgets = BudgetService.getAll();
        const currentPeriod = getCurrentMonthPeriod();
        const categoryBreakdown = MetricsService.calculateCategoryBreakdown(transactions, currentPeriod);

        return budgets.map(budget => {
            const actual = categoryBreakdown.categories.find(c => c.name === budget.categoryName)?.amount || 0;
            const remaining = Math.max(0, budget.amountLimit - actual);
            const utilization = budget.amountLimit > 0 ? (actual / budget.amountLimit) * 100 : 0;

            return {
                ...budget,
                actual,
                remaining,
                utilization,
                isExceeded: actual > budget.amountLimit,
                isWarning: utilization >= 80 && utilization <= 100
            };
        });
    }

    /**
     * Get overall budget health summary
     * @param {Array} transactions - List of transactions
     * @returns {Object} Summary object
     */
    static getSummary(transactions) {
        const status = this.getBudgetsStatus(transactions);
        const totalLimit = status.reduce((sum, b) => sum + b.amountLimit, 0);
        const totalActual = status.reduce((sum, b) => sum + b.actual, 0);
        const exceededCount = status.filter(b => b.isExceeded).length;
        const warningCount = status.filter(b => b.isWarning).length;

        const totalOverspent = status.reduce((sum, b) => {
            return b.isExceeded ? sum + (b.actual - b.amountLimit) : sum;
        }, 0);

        const totalAvailable = status.reduce((sum, b) => {
            return !b.isExceeded ? sum + (b.amountLimit - b.actual) : sum;
        }, 0);

        return {
            totalBudgets: status.length,
            onTrackCount: status.length - exceededCount - warningCount,
            warningCount,
            exceededCount,
            totalLimit,
            totalActual,
            totalOverspent,
            totalAvailable,
            overallUtilization: totalLimit > 0 ? (totalActual / totalLimit) * 100 : 0
        };
    }
}
