/**
 * Overview Section Tests
 *
 * Tests for the OverviewSection component extracted from FinancialPlanningView.js
 * Verifies financial health summary display, stats cards, and risk assessment functionality.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { OverviewSection } from '../src/views/financial-planning/OverviewSection.js';

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
  },
  SPACING: {
    XS: '4px',
    SM: '8px',
    MD: '16px',
    LG: '24px',
    XL: '32px',
  },
}));

vi.mock('../src/components/financial-planning/StatsCard.js', () => ({
  StatsCard: vi.fn((title, value, subtitle, color) => {
    const card = document.createElement('div');
    card.className = 'stats-card';
    card.innerHTML = `
      <h3>${title}</h3>
      <div class="value" style="color: ${color}">${value}</div>
      <div class="subtitle">${subtitle}</div>
    `;
    return card;
  }),
}));

vi.mock('../src/components/financial-planning/EmergencyFundCard.js', () => ({
  EmergencyFundCard: vi.fn(assessment => {
    const card = document.createElement('div');
    card.className = 'emergency-fund-card';
    card.innerHTML = `
      <h4>Emergency Fund</h4>
      <div class="assessment">${assessment.status}</div>
      <div class="recommendation">${assessment.recommendation}</div>
    `;
    return card;
  }),
}));

vi.mock('../src/utils/financial-planning-helpers.js', () => ({
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

describe('OverviewSection', () => {
  let dom;
  let mockRiskAssessor;
  let mockPlanningData;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><div id="test-container"></div>');
    global.document = dom.window.document;
    global.window = dom.window;

    mockRiskAssessor = {
      assessEmergencyFundAdequacy: vi.fn(),
      calculateOverallRiskScore: vi.fn(),
      generateRiskRecommendations: vi.fn(),
    };

    mockPlanningData = {
      transactions: [
        { amount: 5000, type: 'income', timestamp: '2026-01-01T00:00:00Z' },
        { amount: -2000, type: 'expense', timestamp: '2026-01-02T00:00:00Z' },
        { amount: -1500, type: 'expense', timestamp: '2026-01-03T00:00:00Z' },
      ],
      accounts: [
        { id: '1', name: 'Checking', balance: 10000 },
        { id: '2', name: 'Savings', balance: 5000 },
      ],
      investments: [],
      goals: [],
    };

    vi.clearAllMocks();
  });

  it('should create overview section with correct structure', () => {
    const section = OverviewSection(mockPlanningData, mockRiskAssessor);
    expect(section.tagName).toBe('SECTION');
    expect(section.id).toBe('overview');
  });

  it('should display placeholder when no planning data provided', () => {
    const section = OverviewSection(null, mockRiskAssessor);
    const placeholder = section.querySelector('.placeholder');
    expect(placeholder).toBeTruthy();
  });

  it('should include usage note with helpful information', () => {
    const section = OverviewSection(mockPlanningData, mockRiskAssessor);
    const usageNote = section.querySelector('.usage-note');
    expect(usageNote).toBeTruthy();
  });

  it('should include emergency fund assessment', () => {
    mockRiskAssessor.assessEmergencyFundAdequacy.mockReturnValue({
      riskLevel: 'moderate',
      message: 'Emergency fund needs improvement',
      status: 'inadequate',
      monthsCovered: 2.5,
      recommendedMonths: 6,
    });
    mockRiskAssessor.calculateOverallRiskScore.mockReturnValue({
      level: 'moderate',
      message: 'Moderate financial risk',
    });

    const section = OverviewSection(mockPlanningData, mockRiskAssessor);
    const emergencyFundCard = section.querySelector('.emergency-fund-card');
    expect(emergencyFundCard).toBeTruthy();
  });

  it('should handle empty transactions gracefully', () => {
    const emptyData = { ...mockPlanningData, transactions: [] };
    const section = OverviewSection(emptyData, mockRiskAssessor);
    expect(section.tagName).toBe('SECTION');
  });

  it('should format currency values correctly', () => {
    const section = OverviewSection(mockPlanningData, mockRiskAssessor);
    const statsCards = section.querySelectorAll('.stats-card');
    statsCards.forEach(card => {
      const text = card.textContent;
      if (text.includes('€')) {
        expect(text).toMatch(/€\d{1,3}(,\d{3})*(\.\d{2})?/);
      }
    });
  });
});
