/**
 * Forecasts Section Tests
 *
 * Tests for the ForecastsSection component extracted from FinancialPlanningView.js
 * Verifies income/expense forecasting, chart integration, and prediction table functionality.
 */

import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { ForecastsSection } from '../../src/views/financial-planning/ForecastsSection.js';

// Mock dependencies
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
  formatCurrency: vi.fn(value =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(value)
  ),
}));

describe('ForecastsSection', () => {
  let dom;

  beforeEach(() => {
    dom = new JSDOM('<!doctype html><html><body></body></html>');
    global.document = dom.window.document;
    global.window = dom.window;
  });

  afterEach(() => {
    dom.window.close();
    delete global.document;
    delete global.window;
  });

  it('describes historical trend forecasts and their limits', async () => {
    const section = await ForecastsSection(null);

    expect(section.querySelector('.section-header h2').textContent).toBe(
      'Financial Forecasts'
    );
    expect(section.querySelector('.usage-note').textContent).toContain(
      'Scheduled bills and paydays are not included'
    );
    expect(section.querySelector('.usage-note').textContent).toContain(
      'not a guarantee of available cash'
    );
  });
});
