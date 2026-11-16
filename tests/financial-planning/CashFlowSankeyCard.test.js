/**
 * CashFlowSankeyCard Component Tests
 */

import { describe, expect, it } from 'vitest';
import { CashFlowSankeyCard } from '../../src/components/financial-planning/CashFlowSankeyCard.js';

describe('CashFlowSankeyCard', () => {
  const now = new Date();
  const buildTransactions = () => [
    {
      id: 'tx-1',
      amount: 4000,
      category: 'Salary',
      type: 'income',
      timestamp: new Date(now.getFullYear(), now.getMonth(), 2).toISOString(),
    },
    {
      id: 'tx-2',
      amount: 1200,
      category: 'Housing',
      type: 'expense',
      timestamp: new Date(now.getFullYear(), now.getMonth(), 5).toISOString(),
    },
    {
      id: 'tx-3',
      amount: 400,
      category: 'Groceries',
      type: 'expense',
      timestamp: new Date(now.getFullYear(), now.getMonth(), 8).toISOString(),
    },
    {
      id: 'tx-4',
      amount: 300,
      category: 'Other',
      type: 'expense',
      timestamp: new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        15
      ).toISOString(),
    },
  ];

  it('renders the card header, title, and initial SVG diagram', () => {
    const { element, cleanup } = CashFlowSankeyCard({
      transactions: buildTransactions(),
    });

    expect(element.querySelector('.cash-flow-sankey-card')).toBeNull(); // card itself has this class
    expect(element.classList.contains('cash-flow-sankey-card')).toBe(true);

    const title = element.querySelector('.insights-card-title');
    expect(title.textContent).toContain('CASH FLOW SANKEY');

    const subtitle = element.querySelector('.insights-card-subtitle');
    expect(subtitle.textContent).toContain('Cash Flow');
    expect(subtitle.textContent).toContain('Surplus');

    const svg = element.querySelector('svg.sankey-svg');
    expect(svg).not.toBeNull();

    const ribbons = element.querySelectorAll('.sankey-ribbon');
    expect(ribbons.length).toBeGreaterThan(0);

    const nodes = element.querySelectorAll('.sankey-node');
    expect(nodes.length).toBeGreaterThan(0);

    cleanup();
  });

  it('renders empty state when there are no transactions for the period', () => {
    const { element, cleanup } = CashFlowSankeyCard({
      transactions: [],
    });

    const empty = element.querySelector('.insights-chart-empty');
    expect(empty).not.toBeNull();
    expect(empty.textContent).toContain('No income or expense data found');

    cleanup();
  });

  it('renders tooltip category names as text and exposes keyboard node details', () => {
    const category = '<img src=x onerror=alert(1)>';
    const { element, cleanup } = CashFlowSankeyCard({
      transactions: [
        {
          amount: 100,
          category: 'Salary',
          type: 'income',
          timestamp: new Date(
            now.getFullYear(),
            now.getMonth(),
            2
          ).toISOString(),
        },
        {
          amount: 25,
          category,
          type: 'expense',
          timestamp: new Date(
            now.getFullYear(),
            now.getMonth(),
            3
          ).toISOString(),
        },
      ],
    });

    const node = [...element.querySelectorAll('.sankey-node')].find(candidate =>
      candidate.getAttribute('aria-label')?.startsWith(category)
    );
    expect(node.getAttribute('tabindex')).toBe('0');
    expect(node.getAttribute('aria-label')).toContain('% of cash flow');

    node.dispatchEvent(new Event('focus'));

    const tooltip = element.querySelector('.sankey-tooltip');
    expect(tooltip.classList.contains('is-visible')).toBe(true);
    expect(tooltip.querySelector('.sankey-tooltip-title').textContent).toBe(
      category
    );
    expect(tooltip.querySelector('img')).toBeNull();

    node.dispatchEvent(new Event('blur'));
    expect(tooltip.classList.contains('is-visible')).toBe(false);
    cleanup();
  });

  it('synchronizes with sharedMonthState navigation', () => {
    const sharedMonthState = {
      offset: 0,
      onNavigate: null,
    };

    const { element, render, cleanup } = CashFlowSankeyCard({
      transactions: buildTransactions(),
      sharedMonthState,
    });

    const prevBtn = element.querySelector('.insights-nav-btn');
    expect(prevBtn).not.toBeNull();

    prevBtn.click();
    expect(sharedMonthState.offset).toBe(-1);

    // After moving to previous month (where tx-4 was recorded)
    render();
    const subtitle = element.querySelector('.insights-card-subtitle');
    expect(subtitle.textContent).toContain('Deficit');

    cleanup();
  });

  it('changes time grain to all time and updates the view', () => {
    const { element, cleanup } = CashFlowSankeyCard({
      transactions: buildTransactions(),
    });

    const select = element.querySelector('.insights-select');
    expect(select.value).toBe('month');

    select.value = 'all';
    select.dispatchEvent(new Event('change'));

    const subtitle = element.querySelector('.insights-card-subtitle');
    expect(subtitle.textContent).toContain('All Time');

    cleanup();
  });
});
