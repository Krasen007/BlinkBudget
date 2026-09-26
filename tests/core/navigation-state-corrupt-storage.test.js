import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

class StorageMock {
  constructor() {
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

  clear() {
    this.store = {};
  }
}

describe('NavigationState restoring from corrupt storage', () => {
  const storage = new StorageMock();

  beforeEach(() => {
    vi.stubGlobal('sessionStorage', storage);
    storage.clear();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const load = async () =>
    (await import('../../src/core/navigation-state.js')).NavigationState;

  // Regression for #2.1: safeJsonParse returns null on malformed input, so the
  // validation dereferenced null inside a try and the catch reported a bogus
  // restore bug instead of "invalid saved data".
  it.each([
    ['truncated JSON', '{"startDate":"2026-01-01'],
    ['a bare "null" literal', 'null'],
    ['a JSON array', '[]'],
  ])('returns null for %s without throwing', async (_label, stored) => {
    sessionStorage.setItem('navigation_reports_time_period', stored);
    const nav = await load();

    expect(nav.restoreTimePeriod()).toBeNull();
  });

  it('returns null for a corrupt dashboard time period', async () => {
    sessionStorage.setItem('navigation_dashboard_time_period', 'null');
    const nav = await load();

    expect(nav.restoreDashboardTimePeriod()).toBeNull();
  });

  it('logs invalid-data rather than a restore failure', async () => {
    sessionStorage.setItem('navigation_reports_time_period', '{"startDate":');
    const nav = await load();

    nav.restoreTimePeriod();

    expect(console.warn).toHaveBeenCalledWith(
      '[NavigationState] Invalid saved time period data'
    );
    // safeJsonParse reports the malformed value itself, so only the
    // NavigationState failure path is under assertion here.
    expect(console.error).not.toHaveBeenCalledWith(
      expect.stringContaining('[NavigationState]'),
      expect.anything()
    );
  });

  it('still restores a well-formed time period', async () => {
    sessionStorage.setItem(
      'navigation_reports_time_period',
      JSON.stringify({
        type: 'month',
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-01-31T00:00:00.000Z',
        label: 'January',
      })
    );
    const nav = await load();

    const restored = nav.restoreTimePeriod();
    expect(restored.type).toBe('month');
    expect(restored.label).toBe('January');
    expect(restored.startDate).toBeInstanceOf(Date);
  });
});
