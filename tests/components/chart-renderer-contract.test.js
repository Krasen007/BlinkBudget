import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChartRenderer } from '../../src/components/ChartRenderer.js';
import { initializeChartJS } from '../../src/core/chart-config.js';

vi.mock('../../src/core/chart-config.js', () => {
  class ChartJS {
    constructor() {
      throw new Error('Constructor exploded');
    }
  }
  return {
    initializeChartJS: vi.fn(async () => ({ ChartJS })),
    defaultChartOptions: vi.fn(() => ({ plugins: { tooltip: {} } })),
    getChartColors: vi.fn(() => ['hsl(0, 70%, 50%)']),
    createChartOptions: vi.fn(() => ({})),
    createThemedChartOptions: vi.fn(() => ({})),
  };
});

const createCanvas = () => {
  const canvas = document.createElement('canvas');
  canvas.id = `chart-under-test-${Math.random().toString(36).slice(2)}`;
  document.body.appendChild(canvas);
  return canvas;
};

describe('ChartRenderer construction failures (C05)', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it.each([['createPieChart'], ['createBarChart'], ['createLineChart']])(
    '%s rejects when the Chart.js constructor throws',
    async method => {
      const renderer = new ChartRenderer();
      await expect(
        renderer[method](createCanvas(), {
          labels: ['A'],
          datasets: [{ data: [1] }],
        })
      ).rejects.toThrow('Constructor exploded');
      expect(renderer.getActiveCharts().size).toBe(0);
    }
  );

  it('rejects when the chart library itself fails to load', async () => {
    initializeChartJS.mockRejectedValueOnce(new Error('network down'));
    const renderer = new ChartRenderer();
    await expect(
      renderer.createPieChart(createCanvas(), {
        labels: ['A'],
        datasets: [{ data: [1] }],
      })
    ).rejects.toThrow('network down');
  });
});
