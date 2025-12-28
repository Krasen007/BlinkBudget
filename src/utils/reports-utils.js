/**
 * Reports Utilities
 * 
 * Utility functions for reports view including time period calculations,
 * browser support checks, and data validation.
 */

import { COLORS, SPACING } from './constants.js';

/**
 * Get current week time period
 */
export function getCurrentWeekPeriod() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
    endOfWeek.setHours(23, 59, 59, 999);
    
    return {
        type: 'weekly',
        startDate: startOfWeek,
        endDate: endOfWeek,
        label: 'This Week'
    };
}

/**
 * Get current month time period
 */
export function getCurrentMonthPeriod() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);
    
    return {
        type: 'monthly',
        startDate: startOfMonth,
        endDate: endOfMonth,
        label: 'This Month'
    };
}

/**
 * Get current quarter time period
 */
export function getCurrentQuarterPeriod() {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3);
    const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
    const endOfQuarter = new Date(now.getFullYear(), quarter * 3 + 3, 0);
    endOfQuarter.setHours(23, 59, 59, 999);
    
    return {
        type: 'quarterly',
        startDate: startOfQuarter,
        endDate: endOfQuarter,
        label: 'This Quarter'
    };
}

/**
 * Get current year time period
 */
export function getCurrentYearPeriod() {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31);
    endOfYear.setHours(23, 59, 59, 999);
    
    return {
        type: 'yearly',
        startDate: startOfYear,
        endDate: endOfYear,
        label: 'This Year'
    };
}

/**
 * Format time period for display
 */
export function formatTimePeriod(timePeriod) {
    if (!timePeriod || !timePeriod.startDate || !timePeriod.endDate) {
        throw new Error('Invalid time period object');
    }
    const startDate = timePeriod.startDate.toLocaleDateString();
    const endDate = timePeriod.endDate.toLocaleDateString();
    return `${startDate} - ${endDate}`;
}
/**
 * Check browser support for required features
 * Returns object with support status and missing/limited features
 */
export function checkBrowserSupport() {
    const requiredFeatures = {
        'ES6 Classes': () => {
            try {
                eval('class TestClass {}');
                return true;
            } catch (e) {
                return false;
            }
        },
        'Promises': () => typeof Promise !== 'undefined',
        'Fetch API': () => typeof fetch !== 'undefined',
        'Canvas': () => {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext && canvas.getContext('2d'));
        },
        'Local Storage': () => {
            try {
                localStorage.setItem('test', 'test');
                localStorage.removeItem('test');
                return true;
            } catch (e) {
                return false;
            }
        },
        'CSS Grid': () => {
            const div = document.createElement('div');
            return 'grid' in div.style;
        }
    };

    const optionalFeatures = {
        'Web Workers': () => typeof Worker !== 'undefined',
        'Intersection Observer': () => typeof IntersectionObserver !== 'undefined',
        'CSS Custom Properties': () => {
            const div = document.createElement('div');
            div.style.setProperty('--test', 'test');
            return div.style.getPropertyValue('--test') === 'test';
        },
        'Performance API': () => typeof performance !== 'undefined' && typeof performance.now === 'function'
    };

    const missingFeatures = [];
    const limitedFeatures = [];

    // Check required features
    for (const [feature, check] of Object.entries(requiredFeatures)) {
        if (!check()) {
            missingFeatures.push(feature);
        }
    }

    // Check optional features
    for (const [feature, check] of Object.entries(optionalFeatures)) {
        if (!check()) {
            limitedFeatures.push(feature);
        }
    }

    return {
        isSupported: missingFeatures.length === 0,
        hasLimitedSupport: limitedFeatures.length > 0,
        missingFeatures,
        limitedFeatures
    };
}

/**
 * Validate analytics data structure
 */
export function validateAnalyticsData(data) {
    if (!data || typeof data !== 'object') {
        throw new Error('Analytics data is not an object');
    }

    if (!Array.isArray(data.transactions)) {
        throw new Error('Analytics data missing transactions array');
    }

    if (!data.categoryBreakdown || !Array.isArray(data.categoryBreakdown.categories)) {
        throw new Error('Analytics data missing category breakdown');
    }

    if (!data.incomeVsExpenses || typeof data.incomeVsExpenses.totalIncome !== 'number') {
        throw new Error('Analytics data missing income vs expenses');
    }

    // Check for NaN values
    const numericFields = [
        data.incomeVsExpenses.totalIncome,
        data.incomeVsExpenses.totalExpenses,
        data.incomeVsExpenses.netBalance
    ];

    if (numericFields.some(field => isNaN(field))) {
        throw new Error('Analytics data contains invalid numeric values');
    }
}

/**
 * Sanitize analytics data to fix common issues
 */
export function sanitizeAnalyticsData(data) {
    // Create a deep copy to avoid modifying original
    const sanitized = JSON.parse(JSON.stringify(data));

    // Fix NaN values
    if (isNaN(sanitized.incomeVsExpenses.totalIncome)) {
        sanitized.incomeVsExpenses.totalIncome = 0;
    }
    if (isNaN(sanitized.incomeVsExpenses.totalExpenses)) {
        sanitized.incomeVsExpenses.totalExpenses = 0;
    }
    if (isNaN(sanitized.incomeVsExpenses.netBalance)) {
        sanitized.incomeVsExpenses.netBalance = sanitized.incomeVsExpenses.totalIncome - sanitized.incomeVsExpenses.totalExpenses;
    }

    // Fix category breakdown
    if (!sanitized.categoryBreakdown.categories) {
        sanitized.categoryBreakdown.categories = [];
    }

    sanitized.categoryBreakdown.categories = sanitized.categoryBreakdown.categories.filter(cat => 
        cat && typeof cat.amount === 'number' && !isNaN(cat.amount)
    );

    return sanitized;
}

/**
 * Create minimal analytics data as last resort fallback
 */
export function createMinimalAnalyticsData(transactions, timePeriod) {
    const filteredTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date || t.timestamp);
        const startDate = new Date(timePeriod.startDate);
        const endDate = new Date(timePeriod.endDate);
        return transactionDate >= startDate && transactionDate <= endDate;
    });

    let totalIncome = 0;
    let totalExpenses = 0;

    filteredTransactions.forEach(t => {
        const amount = Math.abs(t.amount || 0);
        if (t.type === 'income') {
            totalIncome += amount;
        } else {
            totalExpenses += amount;
        }
    });

    return {
        transactions: filteredTransactions,
        categoryBreakdown: {
            categories: [{
                name: 'All Expenses',
                amount: totalExpenses,
                percentage: 100,
                transactionCount: filteredTransactions.filter(t => t.type !== 'income').length
            }],
            totalAmount: totalExpenses,
            transactionCount: filteredTransactions.filter(t => t.type !== 'income').length
        },
        incomeVsExpenses: {
            totalIncome,
            totalExpenses,
            netBalance: totalIncome - totalExpenses,
            timePeriod
        },
        costOfLiving: {
            totalExpenditure: totalExpenses,
            dailySpending: totalExpenses / 30,
            timePeriod
        },
        isMinimal: true
    };
}

/**
 * Validate and clean transaction data
 */
export function validateAndCleanTransactions(transactions) {
    const cleanedTransactions = [];
    const errors = [];

    transactions.forEach((transaction, index) => {
        try {
            // Check required fields
            if (!transaction.id) {
                errors.push(`Transaction ${index}: Missing ID`);
                return;
            }

            if (typeof transaction.amount !== 'number' || isNaN(transaction.amount)) {
                errors.push(`Transaction ${transaction.id}: Invalid amount`);
                return;
            }

            if (!transaction.date && !transaction.timestamp) {
                errors.push(`Transaction ${transaction.id}: Missing date/timestamp`);
                return;
            }

            // Clean and normalize transaction
            const cleanedTransaction = {
                id: transaction.id,
                amount: Math.abs(transaction.amount), // Ensure positive amount
                type: transaction.type || 'expense', // Default to expense
                category: transaction.category || 'Uncategorized',
                description: transaction.description || '',
                date: transaction.date || transaction.timestamp,
                timestamp: transaction.timestamp || transaction.date,
                accountId: transaction.accountId || 'main'
            };

            // Validate date
            const transactionDate = new Date(cleanedTransaction.date);
            if (isNaN(transactionDate.getTime())) {
                errors.push(`Transaction ${transaction.id}: Invalid date format`);
                return;
            }

            cleanedTransactions.push(cleanedTransaction);

        } catch (error) {
            errors.push(`Transaction ${index}: ${error.message}`);
        }
    });

    // Log errors but don't fail completely unless we have no valid transactions
    if (errors.length > 0) {
        console.warn('Transaction validation errors:', errors);
    }

    if (cleanedTransactions.length === 0 && transactions.length > 0) {
        throw new Error('No valid transactions found. Please check your transaction data.');
    }

    return cleanedTransactions;
}

/**
 * Generate monthly trend data for category trends chart
 */
export function generateMonthlyTrendData(transactions, topCategories) {
    const months = [];
    const categoryData = {};
    
    // Initialize category data
    topCategories.forEach(cat => {
        categoryData[cat.name] = [];
    });

    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        months.push(monthKey);

        // Calculate spending for each category in this month
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        topCategories.forEach(category => {
            const monthlySpending = transactions
                .filter(t => {
                    const tDate = new Date(t.date || t.timestamp);
                    return tDate >= monthStart && tDate <= monthEnd && 
                           (t.category || 'Uncategorized') === category.name &&
                           t.type === 'expense';
                })
                .reduce((sum, t) => sum + (t.amount || 0), 0);
            
            categoryData[category.name].push(monthlySpending);
        });
    }

    return { months, categoryData };
}

