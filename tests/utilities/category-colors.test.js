/**
 * getColorForCategory must prefer colors saved in Category Management so
 * Reports charts/cards update when the user edits a category color.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../../src/core/auth-service.js', () => ({
  AuthService: {
    getUserId: () => 'user-1',
  },
}));

vi.mock('../../src/core/sync-service.js', () => ({
  SyncService: {
    queueSync: vi.fn(),
    pushToCloudSafe: vi.fn(),
  },
}));

vi.mock('../../src/core/transaction-service.js', () => ({
  TransactionService: {
    getAll: () => [],
  },
}));

import {
  getColorForCategory,
  getCategoryColors,
} from '../../src/utils/reports-charts.js';
import { STORAGE_KEYS } from '../../src/utils/constants.js';

// tests/setup.js replaces localStorage with no-op vi.fn() mocks, so seeds
// would be silently discarded and CustomCategoryService.getAll() would run
// its system-category migration on an empty store. Install a working
// in-memory implementation (same pattern as
// tests/core/data-integrity-categories.test.js).
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

describe('getColorForCategory / getCategoryColors', () => {
  beforeEach(() => {
    global.localStorage = new LocalStorageMock();
    // Skip migration so getAll reads exactly what we seed
    localStorage.setItem('categories_initialized_user-1', '1');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('uses the color saved in Category Management over predefined defaults', () => {
    localStorage.setItem(
      STORAGE_KEYS.CUSTOM_CATEGORIES,
      JSON.stringify([
        {
          id: 'cat-1',
          name: 'Храна',
          type: 'expense',
          color: '#FF00AA',
          userId: 'user-1',
          sortOrder: 0,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ])
    );

    expect(getColorForCategory('Храна')).toBe('#FF00AA');
  });

  it('refreshes a stale categoryColorMap entry after a color edit', () => {
    const key = STORAGE_KEYS.CUSTOM_CATEGORIES;
    localStorage.setItem(
      key,
      JSON.stringify([
        {
          id: 'cat-1',
          name: 'Храна',
          type: 'expense',
          color: '#111111',
          userId: 'user-1',
          sortOrder: 0,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ])
    );

    const map = new Map();
    expect(getCategoryColors([{ name: 'Храна' }], map)).toEqual(['#111111']);

    localStorage.setItem(
      key,
      JSON.stringify([
        {
          id: 'cat-1',
          name: 'Храна',
          type: 'expense',
          color: '#ABCDEF',
          userId: 'user-1',
          sortOrder: 0,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        },
      ])
    );

    expect(getCategoryColors([{ name: 'Храна' }], map)).toEqual(['#ABCDEF']);
  });
});
