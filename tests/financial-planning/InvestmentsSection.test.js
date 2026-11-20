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
  formatCurrency: vi.fn(value =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(value)
  ),
}));

// Mock StorageService
vi.mock('../../src/core/storage.js', () => ({
  StorageService: {
    getAll: vi.fn(() => []),
    getInvestments: vi.fn(() => []),
    getHoldingsGrouped: vi.fn(() => []),
    addInvestment: vi.fn(),
    updateInvestment: vi.fn(),
    removeInvestment: vi.fn(),
    removeInvestmentById: vi.fn(),
    calculatePortfolioSummary: vi.fn(() => ({
      totalValue: 0,
      investmentCount: 0,
      gainsLosses: {
        totalCurrentValue: 0,
        totalPurchaseValue: 0,
        totalGainLoss: 0,
        totalGainLossPercentage: 0,
        individualGains: [],
      },
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
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup globals to prevent test pollution
    if (dom && dom.window) {
      dom.window.close();
    }
    delete global.window;
    delete global.document;
    delete global.HTMLElement;
    delete global.HTMLCanvasElement;

    // Reset mock objects
    dom = null;
    mockActiveCharts = null;
    mockChartRenderer = null;

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
      investmentCount: 0,
      gainsLosses: {
        totalCurrentValue: 0,
        totalPurchaseValue: 0,
        totalGainLoss: 0,
        totalGainLossPercentage: 0,
        individualGains: [],
      },
    });

    const section = await InvestmentsSection(
      mockChartRenderer,
      mockActiveCharts
    );

    const placeholder = section.querySelector('.placeholder');
    expect(placeholder).toBeTruthy();
  });

  it('groups investments by symbol and shows average cost with individual purchases', async () => {
    StorageService.getHoldingsGrouped.mockReturnValue([
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        totalShares: 3,
        totalInvested: 175500,
        averageCost: 58500,
        currentPrice: 58500,
        currentValue: 175500,
        totalGainLoss: 0,
        totalGainLossPercentage: 0,
        lots: [
          {
            id: 'lot-1',
            symbol: 'BTC',
            name: 'Bitcoin',
            purchaseDate: new Date('2024-01-10'),
            shares: 1,
            purchasePrice: 55000,
            currentPrice: 55000,
            lotValue: 55000,
            lotGainLoss: 0,
          },
          {
            id: 'lot-2',
            symbol: 'BTC',
            name: 'Bitcoin',
            purchaseDate: new Date('2024-02-10'),
            shares: 1,
            purchasePrice: 54500,
            currentPrice: 54500,
            lotValue: 54500,
            lotGainLoss: 0,
          },
          {
            id: 'lot-3',
            symbol: 'BTC',
            name: 'Bitcoin',
            purchaseDate: new Date('2024-03-10'),
            shares: 1,
            purchasePrice: 66000,
            currentPrice: 66000,
            lotValue: 66000,
            lotGainLoss: 0,
          },
        ],
      },
    ]);

    const section = await InvestmentsSection(
      mockChartRenderer,
      mockActiveCharts
    );

    // Holding summary shows the average cost across the DCA purchases
    expect(section.textContent).toContain('BTC');
    expect(section.textContent).toContain('3 purchases');
    expect(section.textContent).toContain('€58500.00'); // average cost
    expect(section.textContent).toContain('€175500.00'); // current value

    // Individual purchases remain visible underneath
    expect(section.textContent).toContain('€55000.00');
    expect(section.textContent).toContain('€54500.00');
    expect(section.textContent).toContain('€66000.00');
    expect(section.querySelectorAll('.investment-lot').length).toBe(3);
  });
});
