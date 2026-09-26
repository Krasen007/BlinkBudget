import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// tests/setup.js replaces localStorage with bare vi.fn() spies, so a
// set-then-get assertion can never pass. Install a real store locally rather
// than changing the shared double's baseline for every other suite.
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

  key(index) {
    return Object.keys(this.store)[index] ?? null;
  }
}

const PRESETS_KEY = 'amount_presets';

describe('AmountPresetService with a corrupt stored payload', () => {
  const storage = new LocalStorageMock();

  const load = async () =>
    (await import('../../src/core/amount-preset-service.js'))
      .AmountPresetService;

  beforeEach(async () => {
    vi.stubGlobal('localStorage', storage);
    // Reset through the service itself, against whatever storage is active.
    // A fresh mock object per test does not isolate this suite — the service
    // re-reads the global and sees the previous test's data.
    const service = await load();
    service.resetPresets();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // Regression for #7.1: this was the only core service using raw JSON.parse,
  // and a stored "null" made presetsData null, so recordAmount threw while
  // dereferencing presetsData.amounts (reached from analytics-engine.js).
  it.each([
    ['a bare "null" literal', 'null'],
    ['truncated JSON', '{"amounts":{'],
    ['a JSON array', '[]'],
    ['a bare number', '42'],
    ['an object with no amounts map', '{"presets":[5]}'],
    ['a non-object amounts value', '{"amounts":7,"presets":[]}'],
  ])('degrades to empty presets for %s', async (_label, stored) => {
    localStorage.setItem(PRESETS_KEY, stored);
    const service = await load();

    // The user symptom: TypeError reading 'amounts' of null.
    expect(() => service.recordAmount(12.5)).not.toThrow();
    // The recovered value starts from zero, then records normally.
    expect(service.getAmountCount(12.5)).toBe(1);
    expect(service.getPresets()).toEqual([12.5]);
  });

  it('keeps recording amounts after recovering from a corrupt value', async () => {
    localStorage.setItem(PRESETS_KEY, 'null');
    const service = await load();

    service.recordAmount(12.5);
    service.recordAmount(12.5);
    service.recordAmount(3);

    expect(service.getAmountCount(12.5)).toBe(2);
    expect(service.getAmountCount(3)).toBe(1);
    // Both amounts are top presets; the cap is 4, not 1.
    expect(service.getPresets()).toEqual([12.5, 3]);
  });

  it('preserves a well-formed payload', async () => {
    localStorage.setItem(
      PRESETS_KEY,
      JSON.stringify({ amounts: { 10: 3, 20: 1 }, presets: [10, 20] })
    );
    const service = await load();

    expect(service.getPresets()).toEqual([10, 20]);
    expect(service.getAmountCount(10)).toBe(3);
    expect(service.getFrequencyData()).toEqual({ 10: 3, 20: 1 });
  });

  it('caps presets at four entries and counts down for ties', async () => {
    const service = await load();
    [5, 4, 3, 2, 1].forEach((amount, i) => {
      for (let n = 0; n <= i; n++) service.recordAmount(amount);
    });

    expect(service.getPresets()).toEqual([1, 2, 3, 4]);
  });

  // Guards the factory above: a shared "empty" constant would carry one test's
  // counts into the next, because recordAmount mutates `amounts` in place.
  it('does not leak recorded amounts into a later reset', async () => {
    const service = await load();

    service.recordAmount(12.5);
    service.resetPresets();

    expect(service.getAmountCount(12.5)).toBe(0);
    expect(service.getPresets()).toEqual([]);
    expect(service.getFrequencyData()).toEqual({});
  });
});
