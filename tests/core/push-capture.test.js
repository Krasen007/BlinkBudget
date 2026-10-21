import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CustomCategoryService } from '../../src/core/custom-category-service.js';
import { SyncService } from '../../src/core/sync-service.js';
import { STORAGE_KEYS } from '../../src/utils/constants.js';

class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  clear() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] ?? null;
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
  key(i) {
    return Object.keys(this.store)[i] ?? null;
  }
}

describe('push capture', () => {
  beforeEach(() => {
    global.localStorage = new LocalStorageMock();
    global.window = global.window || {};
    if (!window.dispatchEvent) window.dispatchEvent = vi.fn();
  });
  it('captures sortOrder in pushed data', () => {
    const spy = vi
      .spyOn(SyncService, 'pushToCloudSafe')
      .mockImplementation(() => {});
    const cats = [
      {
        id: 'a',
        name: 'A',
        type: 'expense',
        sortOrder: 0,
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'b',
        name: 'B',
        type: 'expense',
        sortOrder: 1,
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];
    localStorage.setItem(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify(cats));
    CustomCategoryService.reorder(['b', 'a']);
    const pushed = spy.mock.calls[0][1];
    console.log('PUSHED', JSON.stringify(pushed));
    expect(pushed.map(c => c.id)).toEqual(['b', 'a']);
    expect(pushed[0].sortOrder).toBe(0);
    expect(pushed[1].sortOrder).toBe(1);
    spy.mockRestore();
  });
});
