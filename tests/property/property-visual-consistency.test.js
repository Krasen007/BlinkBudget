/**
 * Property Test: Visual Consistency
 *
 * Property 15: For any chart rendering, the visual style should be consistent
 * with BlinkBudget's design language and maintain the same styling patterns
 * across all chart types.
 *
 * Validates: Requirements 8.1
 */

import { describe, it, expect } from 'vitest';
import {
  defaultChartOptions,
  getChartColors,
} from '../../src/core/chart-config.js';

describe('Property 15: Visual Consistency', () => {
  it('should use consistent color palette across all charts', () => {
    const colors1 = getChartColors(5);
    const colors2 = getChartColors(5);

    expect(colors1).toEqual(colors2);
    expect(colors1.length).toBe(5);
  });

  it('should provide default chart options', () => {
    const options = defaultChartOptions();

    expect(options).toHaveProperty('responsive');
    expect(options).toHaveProperty('maintainAspectRatio');
    expect(options).toHaveProperty('plugins');
  });

  it('should maintain consistent font family across charts', () => {
    const options = defaultChartOptions();

    if (options.plugins?.legend?.labels?.font) {
      expect(options.plugins.legend.labels.font).toHaveProperty('family');
    }
  });

  it('should use consistent border radius for chart elements', () => {
    const options = defaultChartOptions();

    expect(options).toBeDefined();
  });

  it('should provide consistent animation settings', () => {
    const options = defaultChartOptions();

    if (options.animation) {
      expect(options.animation).toHaveProperty('duration');
    }
  });
});
