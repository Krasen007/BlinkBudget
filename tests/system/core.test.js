// tests/system/core.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageService } from '../../src/core/storage';
import { Router } from '../../src/core/router';

describe('StorageService', () => {
  beforeEach(() => {
    StorageService.clear();
  });

  it('should start empty', () => {
    expect(StorageService.getAll()).toEqual([]);
  });

  it('should add a transaction', () => {
    const item = { amount: 10, category: 'Food' };
    const saved = StorageService.add(item);

    expect(saved.id).toBeDefined();
    expect(saved.timestamp).toBeDefined();
    expect(saved.amount).toBe(10);

    const all = StorageService.getAll();
    expect(all.length).toBe(1);
    expect(all[0]).toEqual(saved);
  });

  it('should add a refund transaction', () => {
    const item = { amount: 20, category: 'Income', type: 'refund' };
    const saved = StorageService.add(item);
    expect(saved.type).toBe('refund');

    const all = StorageService.getAll();
    expect(all[0].type).toBe('refund');
  });

  it('should update a transaction', () => {
    const item = { amount: 10, category: 'Food' };
    const saved = StorageService.add(item);

    const updated = StorageService.update(saved.id, { amount: 50 });
    expect(updated.amount).toBe(50);

    const fresh = StorageService.get(saved.id);
    expect(fresh.amount).toBe(50);
  });

  it('should remove a transaction', () => {
    const item = { amount: 10, category: 'Food' };
    const saved = StorageService.add(item);

    StorageService.remove(saved.id);
    const fresh = StorageService.get(saved.id);
    expect(fresh).toBeUndefined();
  });
});

describe('Router', () => {
  it('should register and handle routes', () => {
    const handler = vi.fn();
    Router.on('test', handler);

    // Simulate navigation
    window.location.hash = 'test';
    Router.handleRoute();

    expect(handler).toHaveBeenCalled();
  });
});
