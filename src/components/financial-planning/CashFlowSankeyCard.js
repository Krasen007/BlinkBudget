/**
 * CashFlowSankeyCard Component
 *
 * Displays a Cash Flow Sankey diagram mapping:
 * Income sources (Inflows) → Cash Flow (Center Hub) → Expenses & Surplus (Allocations)
 *
 * Requirements:
 * - Visual continuity with BlinkBudget design tokens and Insights charts
 * - Pure SVG rendering with smooth cubic Bézier ribbons and gradient fills
 * - Interactive hover states, focus accessibility, and tooltips
 * - Synchronized month navigation with sharedMonthState
 */

import { formatCurrency } from '../../utils/financial-planning-helpers.js';
import {
  SANKEY_GRAINS,
  aggregateCashFlowData,
  computeSankeyLayout,
} from '../../utils/sankey-layout-utils.js';
import { renderSankeySvg } from '../../utils/sankey-svg-renderer.js';

/**
 * CashFlowSankeyCard Component
 * @param {Object} props
 * @param {Array} props.transactions
 * @param {Object} [props.sharedMonthState]
 * @returns {{ element: HTMLElement, render: Function, cleanup: Function }}
 */
export const CashFlowSankeyCard = ({
  transactions = [],
  sharedMonthState = null,
}) => {
  const card = document.createElement('div');
  card.className = 'card insights-card cash-flow-sankey-card';

  let currentGrain = SANKEY_GRAINS.MONTH;

  // Header
  const header = document.createElement('div');
  header.className = 'insights-card-header';

  const titleGroup = document.createElement('div');
  titleGroup.className = 'insights-card-title-group';

  const title = document.createElement('h3');
  title.className = 'insights-card-title';
  title.innerHTML =
    '<span class="trend-title-prefix">CASH FLOW </span>' +
    '<span class="trend-title-income">SANKEY</span>';

  const subtitle = document.createElement('p');
  subtitle.className = 'insights-card-subtitle';

  titleGroup.appendChild(title);
  titleGroup.appendChild(subtitle);
  header.appendChild(titleGroup);

  // Actions
  const actions = document.createElement('div');
  actions.className = 'insights-card-actions';

  const navGroup = document.createElement('div');
  navGroup.className = 'insights-nav-group';

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'insights-nav-btn';
  prevBtn.setAttribute('aria-label', 'Previous month');

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'insights-nav-btn';
  nextBtn.setAttribute('aria-label', 'Next month');

  navGroup.appendChild(prevBtn);
  navGroup.appendChild(nextBtn);

  const grainSelect = document.createElement('select');
  grainSelect.className = 'insights-select';
  grainSelect.setAttribute('aria-label', 'Cash Flow Sankey time range');

  const optMonth = document.createElement('option');
  optMonth.value = SANKEY_GRAINS.MONTH;
  optMonth.textContent = 'Month';

  const optYear = document.createElement('option');
  optYear.value = SANKEY_GRAINS.YEAR;
  optYear.textContent = 'Year';

  const optAll = document.createElement('option');
  optAll.value = SANKEY_GRAINS.ALL;
  optAll.textContent = 'All Time';

  grainSelect.appendChild(optMonth);
  grainSelect.appendChild(optYear);
  grainSelect.appendChild(optAll);

  actions.appendChild(navGroup);
  actions.appendChild(grainSelect);
  header.appendChild(actions);
  card.appendChild(header);

  // Chart Wrapper
  const chartWrapper = document.createElement('div');
  chartWrapper.className = 'sankey-chart-wrapper';

  const chartScroll = document.createElement('div');
  chartScroll.className = 'sankey-chart-scroll';

  const emptyState = document.createElement('div');
  emptyState.className = 'insights-chart-empty';

  const tooltip = document.createElement('div');
  tooltip.className = 'sankey-tooltip';
  tooltip.setAttribute('aria-hidden', 'true');

  chartWrapper.appendChild(chartScroll);
  chartWrapper.appendChild(tooltip);
  card.appendChild(chartWrapper);

  function updateNavLabels(referenceDate) {
    if (!sharedMonthState) return;
    const prevMonth = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth() - 1,
      1
    );
    const nextMonth = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth() + 1,
      1
    );
    const shortMonth = d => d.toLocaleDateString('en-US', { month: 'short' });

    prevBtn.textContent = `← ${shortMonth(prevMonth)}`;
    nextBtn.textContent = `${shortMonth(nextMonth)} →`;
    nextBtn.disabled = !(Number(sharedMonthState.offset) < 0);
  }

  function render() {
    const monthOffset =
      currentGrain === SANKEY_GRAINS.MONTH
        ? Number(sharedMonthState?.offset) || 0
        : 0;

    const flowData = aggregateCashFlowData(transactions, {
      grain: currentGrain,
      monthOffset,
    });

    if (currentGrain === SANKEY_GRAINS.MONTH) {
      navGroup.style.display = 'flex';
      updateNavLabels(flowData.referenceDate);
    } else {
      navGroup.style.display = 'none';
    }

    if (!flowData.hasData) {
      subtitle.textContent = `${flowData.periodLabel} • No cash flow data`;
      chartScroll.innerHTML = '';
      emptyState.textContent = `No income or expense data found for ${flowData.periodLabel}.`;
      if (!emptyState.isConnected) chartWrapper.appendChild(emptyState);
      return;
    }

    if (emptyState.isConnected) emptyState.remove();

    const netText =
      flowData.surplus > 0
        ? `Surplus: ${formatCurrency(flowData.surplus)}`
        : flowData.deficit > 0
          ? `Deficit: ${formatCurrency(flowData.deficit)}`
          : 'Balanced';

    subtitle.textContent = `${flowData.periodLabel} • Cash Flow: ${formatCurrency(flowData.totalFlow)} (${netText})`;

    const layout = computeSankeyLayout({
      inflows: flowData.inflows,
      outflows: flowData.outflows,
      totalFlow: flowData.totalFlow,
      width: 680,
    });

    chartScroll.innerHTML = '';

    const svg = renderSankeySvg({
      layout,
      flowData,
      onHoverRibbon: (e, r) => {
        highlightRibbon(r.id);
        showTooltip(
          e,
          `${r.sourceName} → ${r.targetName}`,
          r.amount,
          r.percent
        );
      },
      onLeaveRibbon: () => {
        clearHighlights();
        hideTooltip();
      },
      onHoverNode: (e, id, name, amount, percent) => {
        highlightNodeRibbons(id);
        showTooltip(e, name, amount, percent);
      },
      onLeaveNode: () => {
        clearHighlights();
        hideTooltip();
      },
      onMouseMove: moveTooltip,
    });

    chartScroll.appendChild(svg);
  }

  function highlightRibbon(ribbonId) {
    const paths = chartScroll.querySelectorAll('.sankey-ribbon');
    paths.forEach(p => {
      if (p.getAttribute('data-ribbon-id') === ribbonId) {
        p.classList.add('is-highlighted');
        p.classList.remove('is-dimmed');
      } else {
        p.classList.add('is-dimmed');
        p.classList.remove('is-highlighted');
      }
    });
  }

  function highlightNodeRibbons(nodeId) {
    const paths = chartScroll.querySelectorAll('.sankey-ribbon');
    paths.forEach(p => {
      const isConnected =
        nodeId === 'center-node' ||
        p.getAttribute('data-source-id') === nodeId ||
        p.getAttribute('data-target-id') === nodeId;

      if (isConnected) {
        p.classList.add('is-highlighted');
        p.classList.remove('is-dimmed');
      } else {
        p.classList.add('is-dimmed');
        p.classList.remove('is-highlighted');
      }
    });
  }

  function clearHighlights() {
    const paths = chartScroll.querySelectorAll('.sankey-ribbon');
    paths.forEach(p => p.classList.remove('is-highlighted', 'is-dimmed'));
  }

  function showTooltip(e, name, amount, percent) {
    tooltip.innerHTML = `
      <div class="sankey-tooltip-title">${name}</div>
      <div>
        <span class="sankey-tooltip-value">${formatCurrency(amount)}</span>
        <span class="sankey-tooltip-percent">(${percent.toFixed(1)}%)</span>
      </div>
    `;
    tooltip.classList.add('is-visible');
    moveTooltip(e);
  }

  function moveTooltip(e) {
    const rect = chartWrapper.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
  }

  function hideTooltip() {
    tooltip.classList.remove('is-visible');
  }

  function handlePrev() {
    if (!sharedMonthState) return;
    sharedMonthState.offset = (Number(sharedMonthState.offset) || 0) - 1;
    if (typeof sharedMonthState.onNavigate === 'function') {
      sharedMonthState.onNavigate();
    } else {
      render();
    }
  }

  function handleNext() {
    if (!sharedMonthState) return;
    if (Number(sharedMonthState.offset) >= 0) return;
    sharedMonthState.offset = (Number(sharedMonthState.offset) || 0) + 1;
    if (typeof sharedMonthState.onNavigate === 'function') {
      sharedMonthState.onNavigate();
    } else {
      render();
    }
  }

  function handleGrainChange() {
    currentGrain = grainSelect.value;
    render();
  }

  prevBtn.addEventListener('click', handlePrev);
  nextBtn.addEventListener('click', handleNext);
  grainSelect.addEventListener('change', handleGrainChange);

  render();

  function cleanup() {
    prevBtn.removeEventListener('click', handlePrev);
    nextBtn.removeEventListener('click', handleNext);
    grainSelect.removeEventListener('change', handleGrainChange);
  }

  return {
    element: card,
    render,
    cleanup,
  };
};
