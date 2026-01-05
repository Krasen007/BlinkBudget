import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SyncService } from '../src/core/sync-service.js';

describe('SyncService.mergeArraysById', () => {
  beforeEach(() => {
    // clear any storage
    localStorage.clear();
  });

  it('prefers cloud item when cloud has newer timestamp', () => {
    const local = [{ id: '1', val: 1, updatedAt: '2020-01-01T00:00:00.000Z' }];
    const cloud = [{ id: '1', val: 2, updatedAt: new Date().toISOString() }];

    const merged = SyncService.mergeArraysById(local, cloud, { key: 'test' });
    expect(merged).toHaveLength(1);
    expect(merged[0].val).toBe(2);
  });

  it('emits sync-conflict when timestamps are nearly equal and payloads differ', () => {
    return new Promise((resolve, reject) => {
      const now = new Date();
      const t1 = new Date(now.getTime() - 200).toISOString();
      const t2 = new Date(now.getTime() - 100).toISOString();

      const local = [{ id: '2', val: 1, updatedAt: t1 }];
      const cloud = [{ id: '2', val: 99, updatedAt: t2 }];

      const handler = (e) => {
        try {
          expect(e.detail).toBeDefined();
          expect(e.detail.key).toBe('test');
          expect(e.detail.id).toBe('2');
          window.removeEventListener('sync-conflict', handler);
          resolve();
        } catch (err) {
          reject(err);
        }
      };

      window.addEventListener('sync-conflict', handler);
      SyncService.mergeArraysById(local, cloud, { key: 'test' });
    });
  });
});

describe('SyncService.handleConflictResolution', () => {
  beforeEach(() => localStorage.clear());

  it('keeps cloud item when resolution=cloud', async () => {
    const key = 'blinkbudget_investments';
    const localArray = [{ id: 'a', val: 1, updatedAt: '2020-01-01T00:00:00.000Z' }];
    localStorage.setItem(key, JSON.stringify(localArray));

    const cloudItem = { id: 'a', val: 42, updatedAt: new Date().toISOString() };

    await SyncService.handleConflictResolution({ resolution: 'cloud', conflict: { key, id: 'a', cloudItem } });

    const nowLocal = JSON.parse(localStorage.getItem(key));
    expect(nowLocal[0].val).toBe(42);
  });
});
