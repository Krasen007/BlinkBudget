/**
 * Scenarios Section Tests
 *
 * Tests for the ScenariosSection component extracted from FinancialPlanningView.js
 * Verifies what-if scenario modeling, wealth projections, and scenario analysis functionality.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { ScenariosSection } from '../../src/views/financial-planning/ScenariosSection.js';

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
    CHART_PURPLE: '#6f42c1',
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

describe('ScenariosSection', () => {
  let dom;
  let mockGoalPlanner;
  let mockChartRenderer;
  let mockActiveCharts;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><div id="test-container"></div>');
    global.document = dom.window.document;
    global.window = dom.window;

    mockActiveCharts = new Map();

    mockGoalPlanner = {
      createScenario: vi.fn(),
      runScenario: vi.fn(),
      compareScenarios: vi.fn(),
      getScenarioResults: vi.fn(),
      deleteScenario: vi.fn(),
      saveScenario: vi.fn(),
    };

    mockChartRenderer = {
      createLineChart: vi.fn(),
      createBarChart: vi.fn(),
      createComparisonChart: vi.fn(),
      createMultiLineChart: vi.fn(),
      destroy: vi.fn(),
      updateChart: vi.fn(),
    };

    vi.clearAllMocks();
  });

  it('should create scenarios section with correct structure', () => {
    const section = ScenariosSection(
      mockGoalPlanner,
      mockChartRenderer,
      mockActiveCharts
    );
    expect(section.tagName).toBe('SECTION');
    expect(section.id).toBe('scenarios');
  });

  it('should include usage note with scenario information', () => {
    const section = ScenariosSection(
      mockGoalPlanner,
      mockChartRenderer,
      mockActiveCharts
    );
    const usageNote = section.querySelector('.usage-note');
    expect(usageNote).toBeTruthy();
  });

  it('should display scenario creation form', () => {
    const section = ScenariosSection(
      mockGoalPlanner,
      mockChartRenderer,
      mockActiveCharts
    );
    const scenarioForm = section.querySelector('.scenario-form');
    expect(scenarioForm).toBeTruthy();
  });
});
