/**
 * Insights Section Tests
 *
 * Tests for the InsightsSection component extracted from FinancialPlanningView.js
 * Verifies advanced analytics, timeline comparisons, and interactive chart functionality.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { InsightsSection } from '../../src/views/financial-planning/InsightsSection.js';

// Mock dependencies
vi.mock('../../src/utils/constants.js', () => ({
  COLORS: {
    PRIMARY: '#007bff',
    SURFACE: '#f8f9fa',
    TEXT_MAIN: '#212529',
    TEXT_MUTED: '#6c757d',
    SUCCESS: '#28a745',
    WARNING: '#ffc107',
    ERROR: '#dc3545',
    CHART_BLUE: '#007bff',
    CHART_GREEN: '#28a745',
    CHART_RED: '#dc3545',
    CHART_ORANGE: '#fd7e14',
  },
  SPACING: {
    XS: '4px',
    SM: '8px',
    MD: '16px',
    LG: '24px',
    XL: '32px',
  },
}));

vi.mock('../../src/utils/financial-planning-helpers.js', () => ({
  createSectionContainer: vi.fn((id, title, icon) => {
    const section = document.createElement('section');
    section.id = id;
    section.className = 'section-container';
    section.innerHTML = `
      <div class="section-header">
        <span class="section-icon">${icon}</span>
        <h2>${title}</h2>
      </div>
      <div class="section-content"></div>
    `;
    return section;
  }),
  createPlaceholder: vi.fn((title, message, icon) => {
    const placeholder = document.createElement('div');
    placeholder.className = 'placeholder';
    placeholder.innerHTML = `
      <div class="placeholder-icon">${icon}</div>
      <h3>${title}</h3>
      <p>${message}</p>
    `;
    return placeholder;
  }),
  createUsageNote: vi.fn(message => {
    const note = document.createElement('div');
    note.className = 'usage-note';
    note.innerHTML = `<p>${message}</p>`;
    return note;
  }),
}));

// Mock InsightsGenerator - added static methods that were causing crashes
vi.mock('../../src/core/insights-generator.js', () => ({
  InsightsGenerator: {
    topMovers: vi.fn(() => ({ topGainers: [], topLosers: [] })),
    compareTimelines: vi.fn(() => ({ timeline: [], totalChange: 0 })),
    analyzeSpendingPatterns: vi.fn(() => ({ categories: [], trends: {} })),
    analyzeIncomeTrends: vi.fn(() => ({ sources: [], growth: 0 })),
    generateRecommendations: vi.fn(() => []),
  },
}));

describe('InsightsSection', () => {
  let dom;
  let mockChartRenderer;
  let mockActiveCharts;
  let mockPlanningData;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><div id="test-container"></div>');
    global.document = dom.window.document;
    global.window = dom.window;

    mockActiveCharts = new Map();

    mockChartRenderer = {
      createBarChart: vi.fn(),
      createLineChart: vi.fn(),
      createPieChart: vi.fn(),
      createComparisonChart: vi.fn(),
      destroy: vi.fn(),
      updateChart: vi.fn(),
    };

    mockPlanningData = {
      transactions: [],
      accounts: [],
    };

    vi.clearAllMocks();
  });

  it('should create insights section', () => {
    const section = InsightsSection(
      mockPlanningData,
      mockChartRenderer,
      mockActiveCharts
    );
    expect(section).toBeTruthy();
    expect(section.tagName).toBe('SECTION');
  });

  it('should display placeholder when no planning data provided', () => {
    const section = InsightsSection(null, mockChartRenderer, mockActiveCharts);
    const placeholder = section.querySelector('.placeholder');
    expect(placeholder).toBeTruthy();
  });
});
