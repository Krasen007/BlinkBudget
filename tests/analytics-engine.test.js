/**
 * Analytics Engine Tests
 * Tests core functionality of the AnalyticsEngine class
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AnalyticsEngine } from '../src/core/analytics-engine.js';
import { TRANSACTION_TYPES } from '../src/utils/constants.js';

describe('AnalyticsEngine', () => {
    let analyticsEngine;
    let sampleTransactions;

    beforeEach(() => {
        analyticsEngine = new AnalyticsEngine();
        
        // Sample transaction data for testing
        sampleTransactions = [
            {
                id: '1',
                amount: 50.00,
                category: 'Food & Groceries',
                type: TRANSACTION_TYPES.EXPENSE,
                date: '2024-01-15',
                accountId: 'main'
            },
            {
                id: '2',
                amount: 1000.00,
                category: 'Paycheck',
                type: TRANSACTION_TYPES.INCOME,
                date: '2024-01-15',
                accountId: 'main'
            },
            {
                id: '3',
                amount: 25.00,
                category: 'Dining & Coffee',
                type: TRANSACTION_TYPES.EXPENSE,
                date: '2024-01-16',
                accountId: 'main'
            },
            {
                id: '4',
                amount: 10.00,
                category: 'Food & Groceries',
                type: TRANSACTION_TYPES.REFUND,
                date: '2024-01-17',
                accountId: 'main'
            }
        ];
    });

    describe('filterTransactionsByTimePeriod', () => {
        it('should filter transactions within date range', () => {
            const timePeriod = {
                startDate: '2024-01-15',
                endDate: '2024-01-16'
            };

            const filtered = analyticsEngine.filterTransactionsByTimePeriod(sampleTransactions, timePeriod);
            
            expect(filtered).toHaveLength(3);
            expect(filtered.map(t => t.id)).toEqual(['1', '2', '3']);
        });

        it('should return all transactions when no time period specified', () => {
            const filtered = analyticsEngine.filterTransactionsByTimePeriod(sampleTransactions, null);
            expect(filtered).toEqual(sampleTransactions);
        });

        it('should handle empty transaction array', () => {
            const timePeriod = {
                startDate: '2024-01-15',
                endDate: '2024-01-16'
            };

            const filtered = analyticsEngine.filterTransactionsByTimePeriod([], timePeriod);
            expect(filtered).toEqual([]);
        });
    });

    describe('calculateCategoryBreakdown', () => {
        it('should calculate category totals and percentages correctly', () => {
            const timePeriod = {
                startDate: '2024-01-15',
                endDate: '2024-01-17'
            };

            const breakdown = analyticsEngine.calculateCategoryBreakdown(sampleTransactions, timePeriod);
            
            expect(breakdown.totalAmount).toBe(75.00); // 50 + 25 (expenses only)
            expect(breakdown.categories).toHaveLength(2);
            
            const foodCategory = breakdown.categories.find(c => c.name === 'Food & Groceries');
            expect(foodCategory.amount).toBe(50.00);
            expect(foodCategory.percentage).toBeCloseTo(66.67, 1);
            
            const diningCategory = breakdown.categories.find(c => c.name === 'Dining & Coffee');
            expect(diningCategory.amount).toBe(25.00);
            expect(diningCategory.percentage).toBeCloseTo(33.33, 1);
        });

        it('should sort categories by amount (highest first)', () => {
            const timePeriod = {
                startDate: '2024-01-15',
                endDate: '2024-01-17'
            };

            const breakdown = analyticsEngine.calculateCategoryBreakdown(sampleTransactions, timePeriod);
            
            expect(breakdown.categories[0].name).toBe('Food & Groceries');
            expect(breakdown.categories[0].amount).toBe(50.00);
            expect(breakdown.categories[1].name).toBe('Dining & Coffee');
            expect(breakdown.categories[1].amount).toBe(25.00);
        });
    });

    describe('calculateIncomeVsExpenses', () => {
        it('should calculate income and expenses correctly', () => {
            const timePeriod = {
                startDate: '2024-01-15',
                endDate: '2024-01-17'
            };

            const summary = analyticsEngine.calculateIncomeVsExpenses(sampleTransactions, timePeriod);
            
            expect(summary.totalIncome).toBe(1000.00);
            expect(summary.totalExpenses).toBe(65.00); // 50 + 25 - 10 (refund reduces expenses)
            expect(summary.netBalance).toBe(935.00);
            expect(summary.incomeCount).toBe(1);
            expect(summary.expenseCount).toBe(3); // 2 expenses + 1 refund
        });

        it('should handle refunds correctly by reducing expenses', () => {
            const refundOnlyTransactions = [
                {
                    id: '1',
                    amount: 20.00,
                    category: 'Food & Groceries',
                    type: TRANSACTION_TYPES.REFUND,
                    date: '2024-01-15',
                    accountId: 'main'
                }
            ];

            const timePeriod = {
                startDate: '2024-01-15',
                endDate: '2024-01-15'
            };

            const summary = analyticsEngine.calculateIncomeVsExpenses(refundOnlyTransactions, timePeriod);
            
            expect(summary.totalExpenses).toBe(0); // Refund with no prior expenses should result in 0, not negative
            expect(summary.totalIncome).toBe(0);
            expect(summary.netBalance).toBe(0);
        });
    });

    describe('calculateCostOfLiving', () => {
        it('should calculate daily and monthly spending averages', () => {
            const timePeriod = {
                startDate: '2024-01-15',
                endDate: '2024-01-17' // 3 days
            };

            const costOfLiving = analyticsEngine.calculateCostOfLiving(sampleTransactions, timePeriod);
            
            expect(costOfLiving.durationDays).toBe(3);
            expect(costOfLiving.dailySpending).toBeCloseTo(21.67, 1); // 65 / 3
            expect(costOfLiving.monthlySpending).toBeCloseTo(650, 0); // 21.67 * 30
            expect(costOfLiving.topSpendingCategory.name).toBe('Food & Groceries');
        });
    });

    describe('caching system', () => {
        it('should cache calculation results', () => {
            const timePeriod = {
                startDate: '2024-01-15',
                endDate: '2024-01-17'
            };

            // First call should miss cache
            const result1 = analyticsEngine.calculateCategoryBreakdown(sampleTransactions, timePeriod);
            const stats1 = analyticsEngine.getCacheStats();
            expect(stats1.misses).toBe(1);
            expect(stats1.hits).toBe(0);

            // Second call should hit cache
            const result2 = analyticsEngine.calculateCategoryBreakdown(sampleTransactions, timePeriod);
            const stats2 = analyticsEngine.getCacheStats();
            expect(stats2.hits).toBe(1);
            expect(stats2.misses).toBe(1);

            // Results should be identical
            expect(result1).toEqual(result2);
        });

        it('should invalidate cache on data updates', () => {
            const timePeriod = {
                startDate: '2024-01-15',
                endDate: '2024-01-17'
            };

            // Cache a result
            analyticsEngine.calculateCategoryBreakdown(sampleTransactions, timePeriod);
            expect(analyticsEngine.getCacheStats().size).toBe(1);

            // Invalidate cache
            analyticsEngine.invalidateCacheOnDataUpdate();
            
            // Next call should miss cache
            analyticsEngine.calculateCategoryBreakdown(sampleTransactions, timePeriod);
            const stats = analyticsEngine.getCacheStats();
            expect(stats.invalidations).toBe(1);
        });

        it('should clear all cache', () => {
            const timePeriod = {
                startDate: '2024-01-15',
                endDate: '2024-01-17'
            };

            // Cache some results
            analyticsEngine.calculateCategoryBreakdown(sampleTransactions, timePeriod);
            analyticsEngine.calculateIncomeVsExpenses(sampleTransactions, timePeriod);
            expect(analyticsEngine.getCacheStats().size).toBe(2);

            // Clear cache
            analyticsEngine.clearCache();
            expect(analyticsEngine.getCacheStats().size).toBe(0);
        });
    });

    describe('generateSpendingInsights', () => {
        it('should generate basic insights for current period', () => {
            const timePeriod = {
                startDate: '2024-01-15',
                endDate: '2024-01-17'
            };

            const insights = analyticsEngine.generateSpendingInsights(sampleTransactions, timePeriod);
            
            expect(insights).toBeInstanceOf(Array);
            expect(insights.length).toBeGreaterThan(0);
            
            // Should have positive balance insight
            const balanceInsight = insights.find(i => i.id === 'positive_balance');
            expect(balanceInsight).toBeDefined();
            expect(balanceInsight.type).toBe('positive');
            
            // Should have top category insight
            const categoryInsight = insights.find(i => i.id === 'top_category');
            expect(categoryInsight).toBeDefined();
            expect(categoryInsight.category).toBe('Food & Groceries');
        });
    });
});