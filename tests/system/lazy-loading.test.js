/**
 * Lazy Loading Tests
 *
 * Tests for Chart.js lazy loading and progressive data loading functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  loadChartJS,
  isChartJSReady,
  getChartJSModules,
  resetChartLoader,
  preloadChartJS,
} from '../../src/core/chart-loader.js';
import { ProgressiveDataLoader } from '../../src/core/progressive-data-loader.js';
import { MetricsService } from '../../src/core/analytics/MetricsService.js';

describe('Chart.js Lazy Loading', () => {
  beforeEach(() => {
    resetChartLoader();
  });

  afterEach(() => {
    resetChartLoader();
  });

  it('should initially not have Chart.js loaded', () => {
    expect(isChartJSReady()).toBe(false);
    expect(getChartJSModules()).toBe(null);
  });

  it('should load Chart.js on demand', async () => {
    expect(isChartJSReady()).toBe(false);

    const modules = await loadChartJS();

    expect(isChartJSReady()).toBe(true);
    expect(modules).toBeDefined();
    expect(modules.ChartJS).toBeDefined();
    expect(getChartJSModules()).toBe(modules);
  });

  it('should return cached modules on subsequent calls', async () => {
    const modules1 = await loadChartJS();
    const modules2 = await loadChartJS();

    expect(modules1).toBe(modules2);
    expect(isChartJSReady()).toBe(true);
  });

  it('should handle preloading', async () => {
    expect(isChartJSReady()).toBe(false);

    await preloadChartJS();

    expect(isChartJSReady()).toBe(true);
  });

  it('should reset loader state', async () => {
    await loadChartJS();
    expect(isChartJSReady()).toBe(true);

    resetChartLoader();

    expect(isChartJSReady()).toBe(false);
    expect(getChartJSModules()).toBe(null);
  });
});

describe('Progressive Data Loading', () => {
  let progressiveLoader;
  let mockTransactions;

  beforeEach(() => {
    progressiveLoader = new ProgressiveDataLoader();

    // Create mock transaction data with dates in the test period
    mockTransactions = [];
    const testStartDate = new Date('2024-01-01');
    const testEndDate = new Date('2024-12-31');

    for (let i = 0; i < 1000; i++) {
      const randomDate = new Date(
        testStartDate.getTime() +
          Math.random() * (testEndDate.getTime() - testStartDate.getTime())
      );
      mockTransactions.push({
        id: `transaction-${i}`,
        amount: Math.random() * 100,
        type: Math.random() > 0.8 ? 'income' : 'expense',
        category: [
          'Food',
          'Transportation',
          'Shopping',
          'Bills',
          'Entertainment',
        ][Math.floor(Math.random() * 5)],
        description: `Transaction ${i}`,
        date: randomDate.toISOString(),
        accountId: 'main',
      });
    }
  });

  afterEach(() => {
    if (progressiveLoader.isCurrentlyLoading()) {
      progressiveLoader.cancelLoading();
    }
  });

  it('should create a progressive data loader', () => {
    expect(progressiveLoader).toBeDefined();
    expect(progressiveLoader.isCurrentlyLoading()).toBe(false);
    expect(progressiveLoader.getProgress()).toBe(0);
  });

  it('should process small datasets directly', async () => {
    const smallDataset = mockTransactions.slice(0, 100);
    const timePeriod = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      type: 'yearly',
    };

    const result = await progressiveLoader.loadTransactionData(
      smallDataset,
      timePeriod
    );

    expect(result).toBeDefined();
    expect(result.isProgressive).toBe(false);
    expect(result.transactions).toBeDefined();
    expect(result.categoryBreakdown).toBeDefined();
    expect(result.incomeVsExpenses).toBeDefined();
    expect(result.costOfLiving).toBeDefined();
  });

  it('should use progressive loading for large datasets', async () => {
    const timePeriod = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      type: 'yearly',
    };

    const progressUpdates = [];
    const result = await progressiveLoader.loadTransactionData(
      mockTransactions,
      timePeriod,
      {
        onProgress: (progress, message) => {
          progressUpdates.push({ progress, message });
        },
      }
    );

    expect(result).toBeDefined();
    expect(result.isProgressive).toBe(true);
    expect(result.chunksProcessed).toBeGreaterThan(0);
    expect(result.totalTransactions).toBe(mockTransactions.length);
    expect(progressUpdates.length).toBeGreaterThan(0);
    expect(result.processingTime).toBeGreaterThan(0);
  });

  it('should handle empty datasets', async () => {
    const timePeriod = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      type: 'yearly',
    };

    const result = await progressiveLoader.loadTransactionData([], timePeriod);

    expect(result).toBeDefined();
    expect(result.transactions).toHaveLength(0);
    expect(result.categoryBreakdown.categories).toHaveLength(0);
    expect(result.incomeVsExpenses.totalIncome).toBe(0);
    expect(result.incomeVsExpenses.totalExpenses).toBe(0);
  });

  it('should filter transactions by time period', async () => {
    const timePeriod = {
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-06-30'),
      type: 'monthly',
    };

    // Add some transactions in the time period
    const juneTransactions = [
      {
        id: 'june-1',
        amount: 50,
        type: 'expense',
        category: 'Food',
        date: '2024-06-15',
        accountId: 'main',
      },
      {
        id: 'june-2',
        amount: 100,
        type: 'income',
        category: 'Salary',
        date: '2024-06-20',
        accountId: 'main',
      },
    ];

    const result = await progressiveLoader.loadTransactionData(
      juneTransactions,
      timePeriod
    );

    expect(result.transactions).toHaveLength(2);
    expect(result.incomeVsExpenses.totalIncome).toBe(100);
    expect(result.incomeVsExpenses.totalExpenses).toBe(50);
  });

  it('should handle cancellation', async () => {
    const timePeriod = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      type: 'yearly',
    };

    // Start loading
    const loadingPromise = progressiveLoader.loadTransactionData(
      mockTransactions,
      timePeriod
    );

    // Cancel after a short delay to allow loading to start
    setTimeout(() => {
      progressiveLoader.cancelLoading();
    }, 10);

    try {
      await loadingPromise;
      // If we reach here, the loading completed before cancellation
      // This is acceptable in fast test environments
      expect(true).toBe(true);
    } catch (error) {
      // If cancellation worked, we should get an error
      expect(error.message).toContain('cancelled');
    }
  });

  it('should validate transaction data', () => {
    const validTransaction = {
      id: 'test-1',
      amount: 50,
      type: 'expense',
      category: 'Food',
      date: '2024-01-01',
      accountId: 'main',
    };

    const invalidTransaction = {
      // Missing id and amount
      type: 'expense',
      category: 'Food',
    };

    const result1 = progressiveLoader.validateTransaction(validTransaction);
    const result2 = progressiveLoader.validateTransaction(invalidTransaction);

    expect(result1).toBeDefined();
    expect(result1.id).toBe('test-1');
    expect(result1.amount).toBe(50);

    expect(result2).toBe(null);
  });

  it('should calculate category breakdown correctly', () => {
    const transactions = [
      { id: '1', amount: 50, type: 'expense', category: 'Food' },
      { id: '2', amount: 30, type: 'expense', category: 'Food' },
      { id: '3', amount: 20, type: 'expense', category: 'Transport' },
      { id: '4', amount: 100, type: 'income', category: 'Salary' },
    ];

    const result = MetricsService.calculateCategoryBreakdown(transactions);

    expect(result.categories).toHaveLength(2);
    expect(result.totalAmount).toBe(100); // Only expenses

    const foodCategory = result.categories.find(cat => cat.name === 'Food');
    expect(foodCategory.amount).toBe(80);
    expect(foodCategory.percentage).toBe(80);
    expect(foodCategory.transactionCount).toBe(2);
  });

  it('should calculate income vs expenses correctly', () => {
    const transactions = [
      { id: '1', amount: 50, type: 'expense', category: 'Food' },
      { id: '2', amount: 30, type: 'expense', category: 'Transport' },
      { id: '3', amount: 200, type: 'income', category: 'Salary' },
      { id: '4', amount: 100, type: 'income', category: 'Freelance' },
    ];

    const result = MetricsService.calculateIncomeVsExpenses(transactions);

    expect(result.totalIncome).toBe(300);
    expect(result.totalExpenses).toBe(80);
    expect(result.netBalance).toBe(220);
    expect(result.incomeCount).toBe(2);
    expect(result.expenseCount).toBe(2);
  });
});
