/**
 * Sankey Layout Utilities
 *
 * Data aggregation and geometric layout functions for the Cash Flow Sankey diagram.
 */

import { getColorForCategory } from './reports-charts.js';
import { INSIGHTS_CHART_COLORS } from '../components/financial-planning/insights-chart-theme.js';

export const SANKEY_GRAINS = {
  MONTH: 'month',
  YEAR: 'year',
  ALL: 'all',
};

/**
 * Distribute available height among slices with a guaranteed minimum height.
 * @param {number[]} amounts
 * @param {number} totalH
 * @param {number} minH
 * @returns {number[]}
 */
export function allocateHeights(amounts = [], totalH = 0, minH = 2.5) {
  const total = amounts.reduce((sum, a) => sum + (Number(a) || 0), 0);
  if (total <= 0 || totalH <= 0 || amounts.length === 0) {
    return amounts.map(() => 0);
  }

  let heights = amounts.map(a => ((Number(a) || 0) / total) * totalH);
  const n = amounts.length;

  if (n * minH <= totalH) {
    const under = heights.map(h => h < minH);
    const countUnder = under.filter(Boolean).length;
    if (countUnder > 0) {
      let deficit = 0;
      heights = heights.map((h, i) => {
        if (under[i]) {
          deficit += minH - h;
          return minH;
        }
        return h;
      });
      const overSum = heights.reduce((s, h, i) => s + (under[i] ? 0 : h), 0);
      if (overSum > 0) {
        heights = heights.map((h, i) => {
          if (under[i]) return h;
          return Math.max(minH, h - (h / overSum) * deficit);
        });
      }
    }
  }

  return heights;
}

/**
 * Generate SVG path data for a horizontal S-curve Sankey ribbon.
 * @param {number} x0
 * @param {number} y0Top
 * @param {number} y0Bot
 * @param {number} x1
 * @param {number} y1Top
 * @param {number} y1Bot
 * @returns {string}
 */
export function createRibbonPath(x0, y0Top, y0Bot, x1, y1Top, y1Bot) {
  const dx = x1 - x0;
  const xi = x0 + dx * 0.5;
  const xj = x1 - dx * 0.5;
  return (
    `M ${x0.toFixed(1)} ${y0Top.toFixed(1)} ` +
    `C ${xi.toFixed(1)} ${y0Top.toFixed(1)}, ${xj.toFixed(1)} ${y1Top.toFixed(1)}, ${x1.toFixed(1)} ${y1Top.toFixed(1)} ` +
    `L ${x1.toFixed(1)} ${y1Bot.toFixed(1)} ` +
    `C ${xj.toFixed(1)} ${y1Bot.toFixed(1)}, ${xi.toFixed(1)} ${y0Bot.toFixed(1)}, ${x0.toFixed(1)} ${y0Bot.toFixed(1)} ` +
    `Z`
  );
}

/**
 * Filter and aggregate transactions into Sankey Inflows and Outflows.
 * @param {Array} transactions
 * @param {Object} options
 * @returns {Object}
 */
export function aggregateCashFlowData(transactions = [], options = {}) {
  const grain = options.grain || SANKEY_GRAINS.MONTH;
  const monthOffset = Number(options.monthOffset) || 0;
  const now = new Date();

  const referenceDate = new Date(
    now.getFullYear(),
    now.getMonth() + monthOffset,
    1
  );

  let start = null;
  let end = null;
  let periodLabel = 'All Time';

  if (grain === SANKEY_GRAINS.MONTH) {
    const yr = referenceDate.getFullYear();
    const mo = referenceDate.getMonth();
    start = new Date(yr, mo, 1);
    end = new Date(yr, mo + 1, 1);
    periodLabel = referenceDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  } else if (grain === SANKEY_GRAINS.YEAR) {
    const yr = referenceDate.getFullYear();
    start = new Date(yr, 0, 1);
    end = new Date(yr + 1, 0, 1);
    periodLabel = String(yr);
  }

  const incomeMap = new Map();
  const expenseMap = new Map();

  transactions.forEach(t => {
    if (!t || t.isGhost || t.type === 'transfer') return;
    const ts = new Date(t.date || t.timestamp);
    if (isNaN(ts.getTime())) return;
    if (start && ts < start) return;
    if (end && ts >= end) return;

    const rawCategory = (t.category || '').trim();
    const cat = rawCategory || 'Uncategorized';
    const amt = typeof t.amount === 'number' ? t.amount : Number(t.amount) || 0;

    if (t.type === 'income') {
      incomeMap.set(cat, (incomeMap.get(cat) || 0) + amt);
    } else if (t.type === 'expense') {
      expenseMap.set(cat, (expenseMap.get(cat) || 0) + amt);
    } else if (t.type === 'refund') {
      expenseMap.set(cat, (expenseMap.get(cat) || 0) - amt);
    }
  });

  for (const [cat, amt] of expenseMap.entries()) {
    if (amt <= 0) expenseMap.delete(cat);
  }

  const rawIncomes = Array.from(incomeMap.entries())
    .map(([name, amount]) => ({
      name,
      amount,
      color:
        name === 'Uncategorized'
          ? 'hsl(240, 5%, 45%)'
          : getColorForCategory(name),
    }))
    .filter(i => i.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  let rawExpenses = Array.from(expenseMap.entries())
    .map(([name, amount]) => ({
      name,
      amount,
      color:
        name === 'Uncategorized'
          ? 'hsl(240, 5%, 45%)'
          : getColorForCategory(name),
    }))
    .filter(e => e.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  if (rawExpenses.length > 10) {
    const top9 = rawExpenses.slice(0, 9);
    const otherSum = rawExpenses
      .slice(9)
      .reduce((sum, item) => sum + item.amount, 0);
    top9.push({
      name: 'Other',
      amount: otherSum,
      color: 'hsl(240, 5%, 55%)',
    });
    rawExpenses = top9;
  }

  const totalIncome = rawIncomes.reduce((s, i) => s + i.amount, 0);
  const totalExpense = rawExpenses.reduce((s, e) => s + e.amount, 0);
  const surplus = Math.max(0, totalIncome - totalExpense);
  const deficit = Math.max(0, totalExpense - totalIncome);
  const totalFlow = Math.max(totalIncome, totalExpense);

  const inflows = [...rawIncomes];
  if (deficit > 0) {
    inflows.push({
      name: 'Deficit',
      amount: deficit,
      isDeficit: true,
      color: INSIGHTS_CHART_COLORS.expense,
    });
  }

  const outflows = [...rawExpenses];
  if (surplus > 0) {
    outflows.push({
      name: 'Surplus',
      amount: surplus,
      isSurplus: true,
      color: INSIGHTS_CHART_COLORS.income,
    });
  }

  return {
    hasData: totalFlow > 0,
    totalIncome,
    totalExpense,
    surplus,
    deficit,
    totalFlow,
    inflows,
    outflows,
    periodLabel,
    referenceDate,
  };
}

/**
 * Compute geometric layout for Sankey diagram.
 * Guarantees that the right side flow scale exactly matches the left side,
 * with conserved flow thickness throughout and dynamic height expansion.
 * @param {Object} data
 * @returns {Object}
 */
export function computeSankeyLayout({
  inflows = [],
  outflows = [],
  totalFlow = 0,
  width = 680,
  minHeight = 480,
}) {
  const padTop = 32;
  const padBot = 32;
  const padX = 18;

  // Single unified flow scale height (conserved across left, center, and right)
  const centerH = 280;
  const centerW = 12;
  const centerX = Math.round(width * 0.44);

  // Flow thickness for each inflow and outflow (sum of each equals centerH)
  const inCenterHeights = allocateHeights(
    inflows.map(i => i.amount),
    centerH,
    2.5
  );
  const outCenterHeights = allocateHeights(
    outflows.map(o => o.amount),
    centerH,
    2.5
  );

  const minLabelSpacing = 26;
  const minBarGap = 8;
  const k = outflows.length;
  const rightRelY = [0];

  for (let j = 0; j < k - 1; j++) {
    const hj = outCenterHeights[j];
    const hjNext = outCenterHeights[j + 1];
    const step = Math.max(
      hj + minBarGap,
      minLabelSpacing + hj / 2 - hjNext / 2
    );
    rightRelY.push(rightRelY[j] + step);
  }
  const rightStackH = k > 0 ? rightRelY[k - 1] + outCenterHeights[k - 1] : 0;

  const m = inflows.length;
  const leftRelY = [0];

  for (let i = 0; i < m - 1; i++) {
    const hi = inCenterHeights[i];
    const hiNext = inCenterHeights[i + 1];
    const step = Math.max(hi + 12, minLabelSpacing + hi / 2 - hiNext / 2);
    leftRelY.push(leftRelY[i] + step);
  }
  const leftStackH = m > 0 ? leftRelY[m - 1] + inCenterHeights[m - 1] : 0;

  // Overall chart height expands to fit right and left stacks comfortably
  const maxContentH = Math.max(leftStackH, rightStackH, centerH);
  const height = Math.max(minHeight, Math.round(maxContentH + padTop + padBot));
  const usableH = height - padTop - padBot;

  const centerBarY = padTop + (usableH - centerH) / 2;
  const leftStartY = padTop + (usableH - leftStackH) / 2;
  const rightStartY = padTop + (usableH - rightStackH) / 2;

  const centerBar = {
    x: centerX,
    y: centerBarY,
    width: centerW,
    height: centerH,
    color: INSIGHTS_CHART_COLORS.income,
    name: 'Cash Flow',
    amount: totalFlow,
  };

  const leftW = 10;
  const leftX = padX;
  let currInCenterY = centerBarY;
  const leftNodes = [];
  const inRibbons = [];

  inflows.forEach((inflow, i) => {
    const barH = inCenterHeights[i];
    const yTop = leftStartY + leftRelY[i];
    const yBot = yTop + barH;
    const cTop = currInCenterY;
    const cBot = currInCenterY + barH;
    const percent = totalFlow > 0 ? (inflow.amount / totalFlow) * 100 : 0;

    leftNodes.push({
      ...inflow,
      id: `in-node-${i}`,
      x: leftX,
      y: yTop,
      width: leftW,
      height: barH,
      centerY: yTop + barH / 2,
      percent,
    });

    inRibbons.push({
      id: `in-ribbon-${i}`,
      type: 'inflow',
      sourceId: `in-node-${i}`,
      targetId: 'center-node',
      sourceName: inflow.name,
      targetName: 'Cash Flow',
      amount: inflow.amount,
      percent,
      color: inflow.color,
      sourceColor: inflow.color,
      targetColor: centerBar.color,
      pathData: createRibbonPath(
        leftX + leftW,
        yTop,
        yBot,
        centerX,
        cTop,
        cBot
      ),
    });

    currInCenterY += barH;
  });

  const rightW = 10;
  const rightX = width - padX - rightW;
  let currOutCenterY = centerBarY;
  const rightNodes = [];
  const outRibbons = [];

  outflows.forEach((outflow, j) => {
    const barH = outCenterHeights[j];
    const yTop = rightStartY + rightRelY[j];
    const yBot = yTop + barH;
    const cTop = currOutCenterY;
    const cBot = currOutCenterY + barH;
    const percent = totalFlow > 0 ? (outflow.amount / totalFlow) * 100 : 0;

    rightNodes.push({
      ...outflow,
      id: `out-node-${j}`,
      x: rightX,
      y: yTop,
      width: rightW,
      height: barH,
      centerY: yTop + barH / 2,
      percent,
    });

    outRibbons.push({
      id: `out-ribbon-${j}`,
      type: 'outflow',
      sourceId: 'center-node',
      targetId: `out-node-${j}`,
      sourceName: 'Cash Flow',
      targetName: outflow.name,
      amount: outflow.amount,
      percent,
      color: outflow.color,
      sourceColor: centerBar.color,
      targetColor: outflow.color,
      pathData: createRibbonPath(
        centerX + centerW,
        cTop,
        cBot,
        rightX,
        yTop,
        yBot
      ),
    });

    currOutCenterY += barH;
  });

  return {
    width,
    height,
    centerBar,
    leftNodes,
    rightNodes,
    inRibbons,
    outRibbons,
  };
}
