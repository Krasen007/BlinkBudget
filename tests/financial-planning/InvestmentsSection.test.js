import { vi, describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { InvestmentsSection } from '../../src/views/financial-planning/InvestmentsSection.js';
import { StorageService } from '../../src/core/storage.js';

// Mock specific helpers
vi.mock('../../src/utils/financial-planning-helpers.js', () => ({
  createSectionContainer: vi.fn((id, title, icon) => {
    const section = document.createElement('section');
    section.id = id;
    section.className = 'section-container';
    const header = document.createElement('h2');
    header.textContent = `${icon} ${title}`;
    section.appendChild(header);
    return section;
  }),
  createPlaceholder: vi.fn((title, description, icon) => {
    const placeholder = document.createElement('div');
    placeholder.className = 'placeholder';
    placeholder.innerHTML = `<h3>${title}</h3><p>${description}</p><span>${icon}</span>`;
    return placeholder;
  }),
  createUsageNote: vi.fn(message => {
    const note = document.createElement('div');
    note.className = 'usage-note';
    note.innerHTML = `<p>${message}</p>`;
    return note;
  }),
}));

// Mock StorageService
vi.mock('../../src/core/storage.js', () => ({
  StorageService: {
    getInvestments: vi.fn(() => []),
    addInvestment: vi.fn(),
    updateInvestment: vi.fn(),
    removeInvestment: vi.fn(),
    calculatePortfolioSummary: vi.fn(() => ({
      totalValue: 0,
      assetAllocation: {},
    })),
    calculateGoalsSummary: vi.fn(() => ({
      totalGoalProgress: 0,
      goalsCount: 0,
    })),
  },
}));

describe('InvestmentsSection', () => {
  let dom;
  let mockChartRenderer;
  let mockActiveCharts;

  beforeEach(async () => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost',
      pretendToBeVisual: true,
    });
    global.window = dom.window;
    global.document = dom.window.document;
    global.HTMLElement = dom.window.HTMLElement;
    global.HTMLCanvasElement = dom.window.HTMLCanvasElement;

    mockActiveCharts = new Map();

    mockChartRenderer = {
      createPieChart: vi.fn(),
      createBarChart: vi.fn(),
      createLineChart: vi.fn(),
      destroy: vi.fn(),
      updateChart: vi.fn(),
    };

    vi.clearAllMocks();
  });

  it('should create investments section', async () => {
    StorageService.getInvestments.mockReturnValue([]);
    const section = await InvestmentsSection(
      mockChartRenderer,
      mockActiveCharts
    );
    expect(section.tagName).toBe('SECTION');
    expect(section.id).toBe('investments');
  });

  it('should display placeholder when no investments exist', async () => {
    StorageService.getInvestments.mockReturnValue([]);
    StorageService.calculatePortfolioSummary.mockReturnValue({
      totalValue: 0,
      assetAllocation: {},
    });

    const section = await InvestmentsSection(
      mockChartRenderer,
      mockActiveCharts
    );

    const placeholder = section.querySelector('.placeholder');
    expect(placeholder).toBeTruthy();
  });
});
