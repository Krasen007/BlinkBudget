/**
 * Sankey Layout Utils Tests
 */

import { describe, expect, it } from 'vitest';
import {
  allocateHeights,
  createRibbonPath,
  aggregateCashFlowData,
  computeSankeyLayout,
  SANKEY_GRAINS,
} from '../../src/utils/sankey-layout-utils.js';

describe('sankey-layout-utils', () => {
  describe('allocateHeights', () => {
    it('returns zeroes when total is 0 or empty', () => {
      expect(allocateHeights([], 100)).toEqual([]);
      expect(allocateHeights([0, 0], 100)).toEqual([0, 0]);
      expect(allocateHeights([10, 20], 0)).toEqual([0, 0]);
    });

    it('allocates strictly proportional heights when all exceed minH', () => {
      const heights = allocateHeights([50, 50], 100, 2);
      expect(heights).toEqual([50, 50]);
    });

    it('enforces minH on small slices while preserving total height', () => {
      const heights = allocateHeights([99, 1], 100, 5);
      expect(heights[1]).toBe(5);
      expect(heights[0]).toBe(95);
      expect(heights[0] + heights[1]).toBe(100);
    });
  });

  describe('createRibbonPath', () => {
    it('creates an SVG cubic bezier closed path', () => {
      const path = createRibbonPath(20, 10, 40, 100, 15, 45);
      expect(path).toContain('M 20.0 10.0');
      expect(path).toContain('L 100.0 45.0');
      expect(path).toContain('Z');
    });
  });

  describe('aggregateCashFlowData', () => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 5);

    it('aggregates income and expenses with surplus when income > expense', () => {
      const txs = [
        {
          amount: 5000,
          type: 'income',
          category: 'Salary',
          timestamp: thisMonth.toISOString(),
        },
        {
          amount: 1500,
          type: 'expense',
          category: 'Housing',
          timestamp: thisMonth.toISOString(),
        },
        {
          amount: 500,
          type: 'expense',
          category: 'Groceries',
          timestamp: thisMonth.toISOString(),
        },
      ];

      const res = aggregateCashFlowData(txs, { grain: SANKEY_GRAINS.MONTH });
      expect(res.hasData).toBe(true);
      expect(res.totalIncome).toBe(5000);
      expect(res.totalExpense).toBe(2000);
      expect(res.surplus).toBe(3000);
      expect(res.deficit).toBe(0);
      expect(res.totalFlow).toBe(5000);

      const surplusOut = res.outflows.find(o => o.name === 'Surplus');
      expect(surplusOut).toBeDefined();
      expect(surplusOut.amount).toBe(3000);
    });

    it('aggregates with deficit when expense > income', () => {
      const txs = [
        {
          amount: 2000,
          type: 'income',
          category: 'Freelance',
          timestamp: thisMonth.toISOString(),
        },
        {
          amount: 3000,
          type: 'expense',
          category: 'Rent',
          timestamp: thisMonth.toISOString(),
        },
      ];

      const res = aggregateCashFlowData(txs, { grain: SANKEY_GRAINS.MONTH });
      expect(res.hasData).toBe(true);
      expect(res.totalIncome).toBe(2000);
      expect(res.totalExpense).toBe(3000);
      expect(res.deficit).toBe(1000);
      expect(res.surplus).toBe(0);
      expect(res.totalFlow).toBe(3000);

      const deficitIn = res.inflows.find(i => i.name === 'Deficit');
      expect(deficitIn).toBeDefined();
      expect(deficitIn.amount).toBe(1000);
    });

    it('deducts refunds from corresponding category', () => {
      const txs = [
        {
          amount: 200,
          type: 'expense',
          category: 'Shopping',
          timestamp: thisMonth.toISOString(),
        },
        {
          amount: 50,
          type: 'refund',
          category: 'Shopping',
          timestamp: thisMonth.toISOString(),
        },
        {
          amount: 1000,
          type: 'income',
          category: 'Salary',
          timestamp: thisMonth.toISOString(),
        },
      ];

      const res = aggregateCashFlowData(txs, { grain: SANKEY_GRAINS.MONTH });
      const shopping = res.outflows.find(o => o.name === 'Shopping');
      expect(shopping.amount).toBe(150);
    });

    it('groups long tail of expenses into Other when more than 10', () => {
      const txs = [
        {
          amount: 10000,
          type: 'income',
          category: 'Salary',
          timestamp: thisMonth.toISOString(),
        },
      ];
      for (let i = 1; i <= 15; i++) {
        txs.push({
          amount: 100 + i,
          type: 'expense',
          category: `Cat ${i}`,
          timestamp: thisMonth.toISOString(),
        });
      }

      const res = aggregateCashFlowData(txs, { grain: SANKEY_GRAINS.MONTH });
      const other = res.outflows.find(o => o.name === 'Other');
      expect(other).toBeDefined();
      expect(res.outflows.filter(o => !o.isSurplus).length).toBe(10);
    });

    it('returns hasData: false when no transactions in period', () => {
      const res = aggregateCashFlowData([], { grain: SANKEY_GRAINS.MONTH });
      expect(res.hasData).toBe(false);
      expect(res.totalFlow).toBe(0);
    });
  });

  describe('computeSankeyLayout', () => {
    it('computes nodes, bars and ribbons with matching connections', () => {
      const inflows = [
        { name: 'Salary', amount: 5000, color: 'hsl(150, 100%, 35%)' },
      ];
      const outflows = [
        { name: 'Housing', amount: 2000, color: 'hsl(0, 85%, 60%)' },
        { name: 'Surplus', amount: 3000, color: 'hsl(150, 100%, 35%)' },
      ];

      const layout = computeSankeyLayout({
        inflows,
        outflows,
        totalFlow: 5000,
        width: 680,
      });

      expect(layout.leftNodes.length).toBe(1);
      expect(layout.rightNodes.length).toBe(2);
      expect(layout.centerBar).toBeDefined();
      expect(layout.centerBar.name).toBe('Cash Flow');
      expect(layout.centerBar.amount).toBe(5000);
      expect(layout.inRibbons.length).toBe(1);
      expect(layout.outRibbons.length).toBe(2);

      // Total flow thickness on the left matches right and center
      const leftTotalH = layout.leftNodes.reduce((s, n) => s + n.height, 0);
      const rightTotalH = layout.rightNodes.reduce((s, n) => s + n.height, 0);
      expect(Math.round(leftTotalH)).toBe(Math.round(layout.centerBar.height));
      expect(Math.round(rightTotalH)).toBe(Math.round(layout.centerBar.height));
    });

    it('ensures label centers on the right maintain minimum spacing to avoid collision', () => {
      const inflows = [
        { name: 'Salary', amount: 10000, color: 'hsl(150, 100%, 35%)' },
      ];
      const outflows = [
        { name: 'Rent', amount: 3000, color: 'hsl(0, 85%, 60%)' },
        { name: 'Food', amount: 200, color: 'hsl(30, 85%, 60%)' },
        { name: 'Bus', amount: 50, color: 'hsl(210, 85%, 60%)' },
        { name: 'Coffee', amount: 30, color: 'hsl(280, 85%, 60%)' },
        { name: 'Surplus', amount: 6720, color: 'hsl(150, 100%, 35%)' },
      ];

      const layout = computeSankeyLayout({
        inflows,
        outflows,
        totalFlow: 10000,
        width: 680,
      });

      for (let j = 0; j < layout.rightNodes.length - 1; j++) {
        const curr = layout.rightNodes[j];
        const next = layout.rightNodes[j + 1];
        expect(next.centerY - curr.centerY).toBeGreaterThanOrEqual(24);
      }
    });
  });
});
