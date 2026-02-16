import { vi, describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { GoalsSection } from '../../src/views/financial-planning/GoalsSection.js';
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
  safeParseDate: vi.fn(date =>
    date ? new Date(date).toISOString().slice(0, 10) : ''
  ),
}));

// Mock StorageService at the top level
vi.mock('../../src/core/storage.js', () => ({
  StorageService: {
    getGoals: vi.fn(() => []),
    createGoal: vi.fn(),
    updateGoal: vi.fn(),
    deleteGoal: vi.fn(),
    getGoalsSummary: vi.fn(() => ({ totalGoalProgress: 0, goalsCount: 0 })),
  },
}));

describe('GoalsSection', () => {
  let dom;
  let mockChartRenderer;
  let mockActiveCharts;
  let mockStorageService;

  beforeEach(async () => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost',
      pretendToBeVisual: true,
    });
    global.window = dom.window;
    global.document = dom.window.document;
    global.HTMLElement = dom.window.HTMLElement;
    global.HTMLCanvasElement = dom.window.HTMLCanvasElement;
    global.CustomEvent = dom.window.CustomEvent;
    global.navigator = dom.window.navigator;

    // Fixed: Use Object.defineProperty for crypto if needed,
    // but for simplifying tests we might just skip it if not used.

    mockActiveCharts = new Map();

    mockChartRenderer = {
      createPieChart: vi.fn(),
      createBarChart: vi.fn(),
      createLineChart: vi.fn(),
      destroy: vi.fn(),
      updateChart: vi.fn(),
    };

    mockStorageService = StorageService;

    vi.clearAllMocks();
  });

  it('should create goals section with correct structure', async () => {
    mockStorageService.getGoals.mockReturnValue([]);

    const section = await GoalsSection(mockChartRenderer, mockActiveCharts);

    expect(section.tagName).toBe('SECTION');
    expect(section.id).toBe('goals');
  });

  it('should display placeholder when no goals exist', async () => {
    mockStorageService.getGoals.mockReturnValue([]);

    const section = await GoalsSection(mockChartRenderer, mockActiveCharts);

    const placeholder = section.querySelector('.placeholder');
    expect(placeholder).toBeTruthy();
  });
});
