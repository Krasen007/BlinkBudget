/**
 * Lazy Loading Tests
 *
 * Tests for Chart.js lazy loading functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  loadChartJS,
  getChartJSModules,
  resetChartLoader,
  preloadChartJS,
} from '../../src/core/chart-loader.js';

describe('Chart.js Lazy Loading', () => {
  beforeEach(() => {
    resetChartLoader();
  });

  afterEach(() => {
    resetChartLoader();
  });

  it('should load Chart.js dynamically', async () => {
    expect(getChartJSModules()).toBe(null);

    await loadChartJS();

    expect(getChartJSModules()).not.toBe(null);
  });

  it('should preload Chart.js modules', async () => {
    await preloadChartJS();

    expect(getChartJSModules()).not.toBe(null);
  });

  it('should handle multiple load calls', async () => {
    await loadChartJS();
    expect(getChartJSModules()).not.toBe(null);

    // Should not throw error on second call
    await loadChartJS();
    expect(getChartJSModules()).not.toBe(null);
  });

  it('should reset loader state', async () => {
    await loadChartJS();
    expect(getChartJSModules()).not.toBe(null);

    resetChartLoader();

    expect(getChartJSModules()).toBe(null);
  });

  // Phase 3 (#2.2): loadChartJS() used to log the failure and then re-throw,
  // while loadChartJSModules() had already logged it with timing — one failure,
  // two console entries, the outer one naming a cause two frames down.
  // Re-throwing is correct; the duplicate log was the defect.
  it('rejects when Chart.js import fails and logs the failure once', async () => {
    const originalImport = vi.importActual;
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.resetModules();
    vi.doMock('chart.js', () => {
      throw new Error('simulated Chart.js import failure');
    });

    try {
      const { loadChartJS: loadChartJSWithFailure } =
        await import('../../src/core/chart-loader.js');

      await expect(loadChartJSWithFailure()).rejects.toThrow(
        'Failed to load Chart.js'
      );
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy.mock.calls[0][0]).toContain(
        '[ChartLoader] Chart.js loading failed'
      );
    } finally {
      vi.doUnmock('chart.js');
      vi.importActual = originalImport;
      errorSpy.mockRestore();
      resetChartLoader();
    }
  });
});
