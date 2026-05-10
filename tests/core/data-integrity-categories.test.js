/**
 * Data Integrity Service - Category Protection Tests
 *
 * Ensures that the data integrity service does not mutate or add unexpected
 * properties to category data structures.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { dataIntegrityService } from '../../src/core/data-integrity-service.js';

// Create a real localStorage implementation for these tests
class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  clear() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }

  get length() {
    return Object.keys(this.store).length;
  }

  key(index) {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
}

describe('DataIntegrityService - Category Protection', () => {
  let realLocalStorage;

  beforeEach(() => {
    // Replace mocked localStorage with a real implementation
    realLocalStorage = new LocalStorageMock();
    global.localStorage = realLocalStorage;

    // Mock console methods to reduce noise
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console
    vi.restoreAllMocks();
  });

  it('should not validate custom_categories setting', async () => {
    // Setup: Add custom categories to localStorage
    const customCategories = [
      {
        id: 'cat-1',
        name: 'Test Category',
        type: 'expense',
        color: '#ff0000',
        isCustom: true,
      },
    ];

    localStorage.setItem(
      'blinkbudget_setting_custom_categories',
      JSON.stringify(customCategories)
    );

    // Verify data was stored
    const beforeCheck = localStorage.getItem(
      'blinkbudget_setting_custom_categories'
    );
    expect(beforeCheck).toBeTruthy();

    // Store original data for comparison
    const originalData = JSON.stringify(customCategories);

    // Run integrity check
    const result = await dataIntegrityService.performIntegrityCheck();

    // Debug: Check what's in localStorage after the check
    const afterCheck = localStorage.getItem(
      'blinkbudget_setting_custom_categories'
    );

    // Verify: custom_categories should not be in the validated settings
    const settingsCheck = result.checks.find(
      c => c.name === 'Settings Integrity'
    );
    expect(settingsCheck).toBeDefined();

    // Verify: No issues related to custom_categories
    const categoryIssues = result.issues.filter(
      i => i.id && i.id.includes('custom_categories')
    );
    expect(categoryIssues).toHaveLength(0);

    // Verify: Categories data is unchanged in localStorage
    expect(afterCheck).toBeTruthy();
    expect(afterCheck).toBe(originalData);

    const storedCategories = JSON.parse(afterCheck);
    expect(storedCategories).toEqual(customCategories);
    expect(storedCategories[0]).not.toHaveProperty('label');
  });

  it('should not validate category_usage setting', async () => {
    // Setup: Add category usage to localStorage
    const categoryUsage = {
      categories: {
        'Test Category': {
          transactionCount: 5,
          totalAmount: 100,
          firstUsed: '2026-01-01',
          lastUsed: '2026-05-01',
        },
      },
      lastUpdated: '2026-05-01',
    };

    localStorage.setItem(
      'blinkbudget_setting_category_usage',
      JSON.stringify(categoryUsage)
    );

    // Store original data for comparison
    const originalData = JSON.stringify(categoryUsage);

    // Run integrity check
    const result = await dataIntegrityService.performIntegrityCheck();

    // Verify: category_usage should not be in the validated settings
    const settingsCheck = result.checks.find(
      c => c.name === 'Settings Integrity'
    );
    expect(settingsCheck).toBeDefined();

    // Verify: No issues related to category_usage
    const usageIssues = result.issues.filter(
      i => i.id && i.id.includes('category_usage')
    );
    expect(usageIssues).toHaveLength(0);

    // Verify: Category usage data is unchanged in localStorage
    const storedData = localStorage.getItem(
      'blinkbudget_setting_category_usage'
    );
    expect(storedData).toBe(originalData);

    const storedUsage = JSON.parse(storedData);
    expect(storedUsage).toEqual(categoryUsage);
  });

  it('should not add label property to category objects', async () => {
    // Setup: Add various category-related data
    const customCategories = [
      {
        id: 'cat-1',
        name: 'Food',
        type: 'expense',
        color: '#22C55E',
      },
      {
        id: 'cat-2',
        name: 'Transport',
        type: 'expense',
        color: '#3B82F6',
      },
    ];

    localStorage.setItem(
      'blinkbudget_setting_custom_categories',
      JSON.stringify(customCategories)
    );

    // Store original data for comparison
    const originalData = JSON.stringify(customCategories);

    // Run integrity check
    await dataIntegrityService.performIntegrityCheck();

    // Verify: Data in localStorage is unchanged
    const storedData = localStorage.getItem(
      'blinkbudget_setting_custom_categories'
    );
    expect(storedData).toBe(originalData);

    // Verify: No label property was added
    const storedCategories = JSON.parse(storedData);

    storedCategories.forEach(category => {
      expect(category).not.toHaveProperty('label');
      expect(Object.keys(category)).toEqual(['id', 'name', 'type', 'color']);
    });
  });

  it('should validate non-category settings normally', async () => {
    // Setup: Add a regular setting
    localStorage.setItem('blinkbudget_setting_theme', JSON.stringify('dark'));

    // Run integrity check
    const result = await dataIntegrityService.performIntegrityCheck();

    // Verify: Settings check ran successfully
    const settingsCheck = result.checks.find(
      c => c.name === 'Settings Integrity'
    );
    expect(settingsCheck).toBeDefined();
    expect(settingsCheck.status).toBe('passed');
  });

  it('should handle categoriesCore setting without mutation', async () => {
    // Setup: Add categoriesCore setting (if it exists)
    const categoriesCore = {
      expense: ['Food', 'Transport', 'Entertainment'],
      income: ['Salary', 'Investments'],
    };

    localStorage.setItem(
      'blinkbudget_setting_categoriesCore',
      JSON.stringify(categoriesCore)
    );

    // Store original data for comparison
    const originalData = JSON.stringify(categoriesCore);

    // Run integrity check
    await dataIntegrityService.performIntegrityCheck();

    // Verify: categoriesCore is unchanged in localStorage
    const storedData = localStorage.getItem(
      'blinkbudget_setting_categoriesCore'
    );
    expect(storedData).toBe(originalData);

    const storedCore = JSON.parse(storedData);
    expect(storedCore).toEqual(categoriesCore);
  });

  it('should not process category-related keys in getAllSettings', () => {
    // Setup: Add category-related settings
    localStorage.setItem(
      'blinkbudget_setting_custom_categories',
      JSON.stringify([{ id: '1', name: 'Test' }])
    );
    localStorage.setItem(
      'blinkbudget_setting_category_usage',
      JSON.stringify({ categories: {} })
    );
    localStorage.setItem('blinkbudget_setting_theme', JSON.stringify('dark'));

    // Get all settings
    const settings = dataIntegrityService.getAllSettings();

    // Verify: Category settings are excluded
    expect(settings).not.toHaveProperty('custom_categories');
    expect(settings).not.toHaveProperty('category_usage');

    // Verify: Non-category settings are included
    expect(settings).toHaveProperty('theme');
    expect(settings.theme).toBe('dark');
  });

  it('should skip validation for category-related setting keys', () => {
    // Test validateSetting method directly
    const categoryKeys = [
      'custom_categories',
      'category_usage',
      'categories',
      'categoriesCore',
    ];

    categoryKeys.forEach(key => {
      const issues = dataIntegrityService.validateSetting(key, {
        some: 'data',
      });
      expect(issues).toHaveLength(0);
    });
  });

  it('should validate non-category settings for issues', () => {
    // Test validateSetting method with invalid data
    const issues = dataIntegrityService.validateSetting('theme', undefined);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues).toContain('Setting value is undefined');
  });
});
