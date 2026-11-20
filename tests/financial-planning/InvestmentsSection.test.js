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

  it('should display a compact empty state when no investments exist', async () => {
    StorageService.getInvestments.mockReturnValue([]);
    StorageService.getHoldingsGrouped.mockReturnValue([]);
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

    const emptyState = section.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
    expect(section.querySelector('.placeholder')).toBeNull();
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
            notes: 'First buy',
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
    expect(section.textContent).toContain('Bitcoin');
    expect(section.textContent).toContain('3 purchases');
    expect(section.textContent).toContain('€58500.00'); // average cost
    expect(section.textContent).toContain('€175500.00'); // current value

    // Individual purchases remain visible underneath
    expect(section.textContent).toContain('€55000.00');
    expect(section.textContent).toContain('€54500.00');
    expect(section.textContent).toContain('€66000.00');
    expect(section.querySelectorAll('.investment-lot').length).toBe(3);
    expect(section.querySelector('.investment-lot-notes')?.textContent).toBe(
      'First buy'
    );
  });

  it('does not repeat the holding name when it matches the symbol', async () => {
    StorageService.getHoldingsGrouped.mockReturnValue([
      {
        symbol: 'TEST',
        name: 'TEST',
        totalShares: 10,
        totalInvested: 2,
        averageCost: 0.2,
        currentPrice: 5000,
        currentValue: 50000,
        totalGainLoss: 49998,
        totalGainLossPercentage: 2499900,
        lots: [
          {
            id: 'lot-1',
            symbol: 'TEST',
            name: 'TEST',
            purchaseDate: new Date('2026-11-20'),
            shares: 10,
            purchasePrice: 0.2,
            currentPrice: 5000,
            lotValue: 50000,
            lotGainLoss: 49998,
            notes: 'Broker fee waived',
          },
        ],
      },
    ]);

    const section = await InvestmentsSection(
      mockChartRenderer,
      mockActiveCharts
    );

    expect(section.querySelector('.investment-holding-name')).toBeNull();
    expect(section.querySelector('.investment-lot-notes')?.textContent).toBe(
      'Broker fee waived'
    );
    // Symbol still shown once in the summary
    const summary = section.querySelector('.investment-summary');
    expect(summary?.textContent.match(/TEST/g)?.length).toBe(1);
  });

  it('does not show name or current price fields, and shows holding-level add and delete buttons', async () => {
    StorageService.getHoldingsGrouped.mockReturnValue([
      {
        symbol: 'TEST',
        name: 'TEST',
        totalShares: 10.12345678,
        totalInvested: 2,
        averageCost: 0.2,
        currentPrice: 0.2,
        currentValue: 2,
        totalGainLoss: 0,
        totalGainLossPercentage: 0,
        lots: [
          {
            id: 'lot-1',
            symbol: 'TEST',
            name: 'TEST',
            purchaseDate: new Date('2026-11-20'),
            shares: 10.12345678,
            purchasePrice: 0.2,
            currentPrice: 0.2,
            lotValue: 2,
            lotGainLoss: 0,
          },
        ],
      },
    ]);

    const section = await InvestmentsSection(
      mockChartRenderer,
      mockActiveCharts
    );

    const addBtn = section.querySelector('.add-investment-btn');
    addBtn.click();

    // Name and Current Price fields removed
    expect(section.querySelector('#inv-name')).toBeNull();
    expect(section.querySelector('#inv-current')).toBeNull();

    // Gain/Loss elements removed
    expect(section.querySelector('.total-gain-loss')).toBeNull();

    // Holding-level buttons
    const addHolding = section.querySelector('.investment-add-lot');
    expect(addHolding).toBeTruthy();
    expect(addHolding.textContent).toBe('Add');

    const deleteHolding = section.querySelector('.investment-delete-holding');
    expect(deleteHolding).toBeTruthy();
    expect(deleteHolding.textContent).toBe('Delete');

    // Shares display shows all decimal places without rounding
    expect(section.textContent).toContain('10.12345678');

    // Clicking holding-level Add button pre-fills the symbol in the add form
    addHolding.click();
    const symbolInput = section.querySelector('#inv-symbol');
    expect(symbolInput.value).toBe('TEST');
  });

  it('displays the stored digits for high-precision lot quantities', async () => {
    const shares = Number('0.12345678901234567');
    StorageService.getHoldingsGrouped.mockReturnValue([
      {
        symbol: 'ETH',
        name: 'ETH',
        totalShares: shares,
        totalInvested: 1,
        averageCost: 1,
        currentPrice: 1,
        currentValue: 1,
        totalGainLoss: 0,
        totalGainLossPercentage: 0,
        lots: [
          {
            id: 'lot-1',
            symbol: 'ETH',
            purchaseDate: new Date('2024-01-10T00:00:00.000Z'),
            shares,
            purchasePrice: 1,
            currentPrice: 1,
          },
        ],
      },
    ]);

    const section = await InvestmentsSection(
      mockChartRenderer,
      mockActiveCharts
    );
    const formattedShares = shares.toLocaleString('en-US', {
      maximumFractionDigits: 20,
      useGrouping: false,
    });

    expect(section.textContent).toContain(formattedShares);
  });

  it('opens the add form with today as the default date and does not hide on a second Add click', async () => {
    StorageService.getHoldingsGrouped.mockReturnValue([]);

    const section = await InvestmentsSection(
      mockChartRenderer,
      mockActiveCharts
    );

    const addBtn = section.querySelector('.add-investment-btn');
    const form = section.querySelector('.investment-form');
    const dateInput = section.querySelector('#inv-date');

    expect(addBtn).toBeTruthy();
    expect(form.style.display).toBe('none');

    const saveBtn = section.querySelector('.btn-save');
    const cancelBtn = section.querySelector('.btn-cancel-investment');
    const actionRow = section.querySelector('.investment-form-actions');

    expect(saveBtn.style.display).toBe('none');
    expect(cancelBtn.style.display).toBe('none');
    expect(addBtn.style.display).not.toBe('none');

    addBtn.click();
    expect(form.style.display).toBe('flex');
    expect(addBtn.style.display).toBe('none');
    expect(saveBtn.style.display).not.toBe('none');
    expect(cancelBtn.style.display).not.toBe('none');
    expect(actionRow.contains(saveBtn)).toBe(true);
    expect(actionRow.contains(cancelBtn)).toBe(true);

    const today = new Date();
    const expected = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    expect(dateInput.value).toBe(expected);

    // Second click must not close the form (that looked like a successful save)
    addBtn.click();
    expect(form.style.display).toBe('flex');

    cancelBtn.click();
    expect(form.style.display).toBe('none');
    expect(addBtn.style.display).not.toBe('none');
    expect(saveBtn.style.display).toBe('none');
    expect(cancelBtn.style.display).toBe('none');
  });

  it('preserves the selected calendar date when adding an investment', async () => {
    StorageService.getHoldingsGrouped.mockReturnValue([]);

    const section = await InvestmentsSection(
      mockChartRenderer,
      mockActiveCharts
    );

    section.querySelector('.add-investment-btn').click();
    section.querySelector('#inv-symbol').value = 'ETH';
    section.querySelector('#inv-shares').value = '1';
    section.querySelector('#inv-price').value = '3000';
    const dateInput = section.querySelector('#inv-date');
    dateInput.value = '2024-01-10';
    section
      .querySelectorAll('.investment-form input')
      .forEach(input => input.dispatchEvent(new dom.window.Event('input')));

    section.querySelector('.btn-save').click();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(StorageService.addInvestment).toHaveBeenCalledWith(
      'ETH',
      1,
      3000,
      new Date('2024-01-10T00:00:00.000Z'),
      expect.any(Object)
    );
  });

  it('keeps an existing UTC-midnight lot date unchanged when editing', async () => {
    const purchaseDate = new Date('2024-01-10T00:00:00.000Z');
    StorageService.getHoldingsGrouped.mockReturnValue([
      {
        symbol: 'ETH',
        name: 'ETH',
        totalShares: 1,
        totalInvested: 3000,
        averageCost: 3000,
        currentPrice: 3000,
        currentValue: 3000,
        totalGainLoss: 0,
        totalGainLossPercentage: 0,
        lots: [
          {
            id: 'lot-1',
            symbol: 'ETH',
            purchaseDate,
            shares: 1,
            purchasePrice: 3000,
            currentPrice: 3000,
          },
        ],
      },
    ]);

    const section = await InvestmentsSection(
      mockChartRenderer,
      mockActiveCharts
    );

    expect(section.querySelector('.investment-lot').textContent).toContain(
      purchaseDate.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      })
    );
    section.querySelector('.investment-lot .investment-lot-btn').click();
    const dateInput = section.querySelector(
      '.investment-edit-form input[type="date"]'
    );
    expect(dateInput.value).toBe('2024-01-10');

    section.querySelector('.investment-edit-form button').click();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(StorageService.updateInvestment).toHaveBeenCalledWith(
      'lot-1',
      expect.objectContaining({ purchaseDate })
    );
  });
});
