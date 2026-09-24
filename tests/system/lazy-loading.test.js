/**
 * Lazy Loading Tests
 *
 * Tests for Chart.js lazy loading functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
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
});
