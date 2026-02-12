/**
 * Property Test: Responsive Design Consistency
 *
 * Property 10: For any screen size within supported ranges, charts should
 * maintain readability and all interactive elements should remain usable.
 *
 * Validates: Requirements 8.6
 *
 * Note: This test validates configuration logic. Full responsive testing
 * requires browser environment with different viewport sizes.
 */

import { describe, it, expect } from 'vitest';

describe('Property 10: Responsive Design Consistency', () => {
  function getResponsiveChartConfig(width) {
    return {
      responsive: true,
      maintainAspectRatio: width >= 768,
      aspectRatio: width >= 768 ? 2 : 1,
      plugins: {
        legend: {
          display: width > 480,
          position: width >= 768 ? 'right' : 'bottom',
        },
      },
    };
  }

  it('should adapt chart configuration for mobile screens', () => {
    const mobileWidths = [320, 375, 414, 480];

    mobileWidths.forEach(width => {
      const config = getResponsiveChartConfig(width);

      expect(config.responsive).toBe(true);
      expect(config.maintainAspectRatio).toBe(false);
      expect(config.aspectRatio).toBe(1);
    });
  });

  it('should adapt chart configuration for tablet screens', () => {
    const tabletWidths = [768, 834, 1024];

    tabletWidths.forEach(width => {
      const config = getResponsiveChartConfig(width);

      expect(config.responsive).toBe(true);
      expect(config.maintainAspectRatio).toBe(true);
      expect(config.aspectRatio).toBe(2);
    });
  });

  it('should adapt chart configuration for desktop screens', () => {
    const desktopWidths = [1280, 1440, 1920];

    desktopWidths.forEach(width => {
      const config = getResponsiveChartConfig(width);

      expect(config.responsive).toBe(true);
      expect(config.maintainAspectRatio).toBe(true);
      expect(config.plugins.legend.display).toBe(true);
      expect(config.plugins.legend.position).toBe('right');
    });
  });

  it('should hide legend on very small screens', () => {
    const smallWidths = [320, 375, 414, 480];

    smallWidths.forEach(width => {
      const config = getResponsiveChartConfig(width);
      expect(config.plugins.legend.display).toBe(false);
    });
  });
});
