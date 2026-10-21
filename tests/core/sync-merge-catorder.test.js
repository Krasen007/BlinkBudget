import { describe, it, expect, beforeEach, vi } from 'vitest';
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

describe('sync merge category order', () => {
  beforeEach(() => {
    global.localStorage = new LocalStorageMock();
    global.window = global.window || {};
    if (!window.dispatchEvent) window.dispatchEvent = vi.fn();
  });

  it('updates order from cloud', () => {
    const local = [
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
    const cloud = [
      {
        id: 'b',
        name: 'B',
        type: 'expense',
        sortOrder: 0,
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
      {
        id: 'a',
        name: 'A',
        type: 'expense',
        sortOrder: 1,
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
    ];
    localStorage.setItem(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify(local));
    SyncService.mergeLocalWithCloud(STORAGE_KEYS.CUSTOM_CATEGORIES, cloud);
    const merged = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.CUSTOM_CATEGORIES)
    );
    console.log('MERGED', JSON.stringify(merged));
    const sorted = [...merged].sort((x, y) => x.sortOrder - y.sortOrder);
    expect(sorted.map(c => c.id)).toEqual(['b', 'a']);
  });

  it('keeps cloud reorder when a local edit has a newer timestamp', () => {
    // Device A reordered to [b, a] and pushed it to the cloud. Device B has a
    // newer local timestamp on 'a' (e.g. a rename) but a stale sortOrder.
    // Per-item Last-Write-Wins would let local 'a' win with sortOrder 0,
    // producing duplicate sortOrder values and scrambling the order on read.
    const local = [
      {
        id: 'a',
        name: 'A (renamed)',
        type: 'expense',
        sortOrder: 0,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-03T00:00:00.000Z',
      },
      {
        id: 'b',
        name: 'B',
        type: 'expense',
        sortOrder: 1,
        createdAt: '2026-01-02T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];
    const cloud = [
      {
        id: 'b',
        name: 'B',
        type: 'expense',
        sortOrder: 0,
        createdAt: '2026-01-02T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
      {
        id: 'a',
        name: 'A',
        type: 'expense',
        sortOrder: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
    ];
    localStorage.setItem(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify(local));
    SyncService.mergeLocalWithCloud(STORAGE_KEYS.CUSTOM_CATEGORIES, cloud);
    const merged = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.CUSTOM_CATEGORIES)
    );
    // Cloud's reorder [b, a] must be reflected with clean, unique sortOrder.
    expect(merged.map(c => c.id)).toEqual(['b', 'a']);
    expect(merged.map(c => c.sortOrder)).toEqual([0, 1]);
    expect(new Set(merged.map(c => c.sortOrder)).size).toBe(merged.length);
  });
});
