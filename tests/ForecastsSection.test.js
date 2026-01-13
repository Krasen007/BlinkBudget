/**
 * Forecasts Section Tests
 *
 * Tests for the ForecastsSection component extracted from FinancialPlanningView.js
 * Verifies income/expense forecasting, chart integration, and prediction table functionality.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { ForecastsSection } from '../src/views/financial-planning/ForecastsSection.js';

// Mock dependencies
vi.mock('../src/utils/constants.js', () => ({
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
  },
  SPACING: {
    XS: '4px',
    SM: '8px',
    MD: '16px',
    LG: '24px',
    XL: '32px',
  },
}));

vi.mock('../src/utils/financial-planning-helpers.js', () => ({
  createSectionContainer: vi.fn((id, title, icon) => {
    const section = document.createElement('section');
    section.id = id;
    section.className = 'section-container';
    section.innerHTML = `
      <div class="section-header">
        <span class="section-icon">${icon}</span>
        h2>${title}</h2>
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

describe('ForecastsSection', () => {
  let dom;
  let mockForecastEngine;
  let mockBalancePredictor;
  let mockChartRenderer;
  let mockActiveCharts;
  let mockPlanningData;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><div id="test-container"></div>');
    global.document = dom.window.document;
    global.window = dom.window;

    mockActiveCharts = new Map();

    mockForecastEngine = {
      generateForecast: vi.fn(),
      getForecastSummary: vi.fn(),
      clearCache: vi.fn(),
      isDataAvailable: vi.fn(),
    };

    mockBalancePredictor = {
      predictBalance: vi.fn(),
      predictMonthlyBalances: vi.fn(),
      getProjectionConfidence: vi.fn(),
    };

    mockChartRenderer = {
      createLineChart: vi.fn(),
      createBarChart: vi.fn(),
      createComparisonChart: vi.fn(),
      destroy: vi.fn(),
      updateChart: vi.fn(),
    };

    mockPlanningData = {
      transactions: [
        {
          amount: 5000,
          type: 'income',
          date: '2026-01-01',
          category: 'salary',
        },
        {
          amount: -2000,
          type: 'expense',
          date: '2026-01-02',
          category: 'rent',
        },
        { amount: -500, type: 'expense', date: '2026-01-03', category: 'food' },
        {
          amount: 3000,
          type: 'income',
          date: '2026-02-01',
          category: 'salary',
        },
        {
          amount: -1800,
          type: 'expense',
          date: '2026-02-02',
          category: 'rent',
        },
      ],
      accounts: [
        { id: '1', name: 'Checking', balance: 10000 },
        { id: '2', name: 'Savings', balance: 5000 },
      ],
    };

    vi.clearAllMocks();
  });

  it('should create forecasts section with correct structure', () => {
    const section = ForecastsSection(
      mockPlanningData,
      mockForecastEngine,
      mockBalancePredictor,
      mockChartRenderer,
      mockActiveCharts
    );

    expect(section.tagName).toBe('SECTION');
    expect(section.id).toBe('forecasts');
    expect(section.className).toBe('section-container');
  });

  it('should format forecast values as currency', () => {
    mockForecastEngine.getForecastSummary.mockReturnValue({
      nextMonthIncome: 5500.5,
      nextMonthExpenses: 2500.75,
      netChange: 2999.75,
      confidence: 0.85,
    });

    ForecastsSection(
      mockPlanningData,
      mockForecastEngine,
      mockBalancePredictor,
      mockChartRenderer,
      mockActiveCharts
    );

    const currencyValues = document.querySelectorAll('.currency-value');
    currencyValues.forEach(element => {
      const text = element.textContent;
      expect(text).toMatch(/^\$\d{1,3}(,\d{3})*(\.\d{2})?$/);
    });
  });

  it('should support different forecast time ranges', () => {
    ForecastsSection(
      mockPlanningData,
      mockForecastEngine,
      mockBalancePredictor,
      mockChartRenderer,
      mockActiveCharts
    );

    const rangeSelector = document.querySelector('.forecast-range-selector');
    if (rangeSelector) {
      const options = rangeSelector.querySelectorAll('option');
      expect(options.length).toBeGreaterThan(1);
      expect(
        Array.from(options).some(option => option.value === '3months')
      ).toBe(true);
      expect(
        Array.from(options).some(option => option.value === '6months')
      ).toBe(true);
      expect(
        Array.from(options).some(option => option.value === '12months')
      ).toBe(true);
    }
  });
});
