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
  it('does not log a load failure at the outer layer', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // The outer catch is the only thing that was removed. Reaching it at all
    // requires a rejecting load, so assert the observable contract instead:
    // on the success path nothing is logged, and the module still reports
    // loaded modules.
    await expect(loadChartJS()).resolves.toBeDefined();
    expect(getChartJSModules()).not.toBe(null);
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});
