/**
 * Category breakdown tooltip percentages.
 *
 * Disabling a category through the chart legend redraws the chart without
 * that slice, but the tooltip must not stay stuck on the original
 * percentage: it should show both the original percentage (all categories)
 * and the recalculated percentage (visible categories only).
 */
import { describe, it, expect, vi } from 'vitest';
import { createCategoryBreakdownChart } from '../../src/utils/reports-charts.js';

const CATEGORIES = [
  { name: 'Food & Drink', amount: 50 },
  { name: 'Rent', amount: 150 },
];

/**
 * Minimal Chart.js stand-in with the same visibility semantics as the real
 * library: toggleDataVisibility() hides a slice without touching .data.
 */
function createFakeChart(data) {
  const hiddenIndices = new Set();
  return {
    data,
    hiddenIndices,
    getDataVisibility: index => !hiddenIndices.has(index),
    toggleDataVisibility: index => {
      if (hiddenIndices.has(index)) {
        hiddenIndices.delete(index);
      } else {
        hiddenIndices.add(index);
      }
    },
    update: vi.fn(),
    destroy: vi.fn(),
  };
}

async function buildFixture() {
  let capturedOptions = null;

  const chartRenderer = {
    createDoughnutChart: vi.fn(async (_canvas, data, options) => {
      capturedOptions = options;
      return createFakeChart(data);
    }),
  };

  const currentData = {
    categoryBreakdown: {
      categories: CATEGORIES.map(category => ({ ...category })),
    },
    incomeVsExpenses: { totalIncome: 1000, totalExpenses: 200 },
    transactions: [],
    timePeriod: {
      startDate: new Date('2026-06-01T00:00:00.000Z'),
      endDate: new Date('2026-06-30T23:59:59.999Z'),
    },
  };

  const { section, chart } = await createCategoryBreakdownChart(
    chartRenderer,
    currentData,
    new Map(),
    () => ['#3B82F6', '#EF4444'],
    vi.fn()
  );

  return {
    section,
    chart,
    tooltipConfig: capturedOptions.plugins.tooltip,
    detailsContainer: section.querySelector('.chart-mobile-details'),
  };
}

function createHoverContext(chart, dataIndex = 0) {
  return {
    chart,
    tooltip: {
      opacity: 1,
      body: [{ lines: ['Food & Drink'] }],
      dataPoints: [{ datasetIndex: 0, dataIndex }],
    },
  };
}

describe('category breakdown tooltip percentages', () => {
  it('shows only the original percentage when no categories are disabled', async () => {
    const { tooltipConfig, detailsContainer, chart } = await buildFixture();

    // Hover "Food & Drink" (dataIndex 1 — legend sorted by amount desc)
    tooltipConfig.external(createHoverContext(chart, 1));

    // 50 of 200 total → 25.0%
    expect(detailsContainer.textContent).toContain('25.0%');
    expect(detailsContainer.textContent).not.toContain('→');
    expect(detailsContainer.textContent).not.toContain('100.0%');
  });

  it('shows original and recalculated percentages when a category is disabled', async () => {
    const { section, tooltipConfig, detailsContainer, chart } =
      await buildFixture();

    // Disable "Rent" through the legend — the same path as a user click.
    // Categories are sorted by amount desc, so Rent is legend item 0.
    const legendItems = section.querySelectorAll('.legend-item');
    expect(legendItems).toHaveLength(2);
    legendItems[0].click();

    expect(chart.update).toHaveBeenCalled();

    // Hover "Food & Drink" (dataIndex 1)
    tooltipConfig.external(createHoverContext(chart, 1));

    const text = detailsContainer.textContent;
    // Original share of all categories: 50 / 200 → 25.0%
    expect(text).toContain('25.0%');
    // Visible-only share after Rent is hidden: 50 / 50 → 100.0%
    expect(text).toContain('100.0%');
    expect(text).toContain('→');

    // Both values are annotated (original + visible)
    const annotatedSpans = detailsContainer.querySelectorAll('span[title]');
    expect(annotatedSpans).toHaveLength(2);
  });

  it('re-enabling a category restores the single original percentage', async () => {
    const { section, tooltipConfig, detailsContainer, chart } =
      await buildFixture();

    const legendItems = section.querySelectorAll('.legend-item');
    legendItems[0].click(); // disable Rent
    legendItems[0].click(); // re-enable Rent

    tooltipConfig.external(createHoverContext(chart, 1));

    expect(detailsContainer.textContent).toContain('25.0%');
    expect(detailsContainer.textContent).not.toContain('→');
  });

  it('labels both percentages in the tooltip callback when categories are disabled', async () => {
    const { section, tooltipConfig, chart } = await buildFixture();

    // Disable "Rent" (legend item 0), then label the visible "Food & Drink"
    section.querySelectorAll('.legend-item')[0].click();

    const line = tooltipConfig.callbacks.label({
      chart,
      label: 'Food & Drink',
      parsed: 50,
      datasetIndex: 0,
      dataIndex: 1,
    });

    expect(line).toBe('Food & Drink: €50.00 (25.0% → 100.0%)');
  });

  it('labels only the original percentage in the callback when nothing is disabled', async () => {
    const { tooltipConfig, chart } = await buildFixture();

    const line = tooltipConfig.callbacks.label({
      chart,
      label: 'Food & Drink',
      parsed: 50,
      datasetIndex: 0,
      dataIndex: 1,
    });

    expect(line).toBe('Food & Drink: €50.00 (25.0%)');
  });
});
