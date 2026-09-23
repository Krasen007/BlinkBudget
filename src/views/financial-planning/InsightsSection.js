/**
 * Insights Section - Advanced Analytics
 *
 * Displays financial insights:
 * - Key Takeaways (top textual insights for the selected month)
 * - Trend Diverging Bar Chart (Income vs Expense with Net line)
 * - Timeline YoY cumulative spending comparison
 * - Top Movers (biggest month-over-month spending changes)
 * - Personal Inflation Trends
 * - Net Balance Over Time
 */

import {
  createSectionContainer,
  createPlaceholder,
  createUsageNote,
} from '../../utils/financial-planning-helpers.js';
import { InflationTrends } from '../../components/InflationTrends.js';
import { createNetBalanceChart } from '../../components/NetBalanceChart.js';
import { ProgressiveEmptyState } from '../../components/ProgressiveEmptyState.js';
import { TrendBarChartCard } from '../../components/financial-planning/TrendBarChartCard.js';
import { TimelineYoYCard } from '../../components/financial-planning/TimelineYoYCard.js';
import { createTopMoversSection } from './insights-movers-timeline.js';
import { createTakeawaysSection } from './insights-takeaways.js';

/**
 * Insights Section Component
 * @param {Object} planningData - Financial planning data including transactions
 * @param {Object} chartRenderer - Chart renderer service instance
 * @param {Map} activeCharts - Map to track active chart instances
 * @returns {{ element: HTMLElement, cleanup: Function }} DOM element and cleanup handler
 */
export const InsightsSection = (planningData, chartRenderer, activeCharts) => {
  // Shared month state for synchronized navigation
  const sharedMonthState = {
    offset: 0,
    onNavigate: null,
  };

  const section = createSectionContainer(
    'insights',
    'Financial Insights',
    '💡'
  );
  section.className += ' insights-section';

  section.appendChild(
    createUsageNote(
      'Key takeaways, spending trends, month-over-month movers, personal inflation, and net balance — everything you need to spot patterns and plan the month ahead.'
    )
  );

  const txCount = (planningData?.transactions || []).length;
  const unlockCard = ProgressiveEmptyState({
    section: 'insights',
    transactionCount: txCount,
    minTransactions: 30,
  });
  if (unlockCard) {
    section.appendChild(unlockCard);
  }

  if (
    !planningData ||
    !planningData.transactions ||
    planningData.transactions.length === 0
  ) {
    const placeholder = createPlaceholder(
      'Advanced Insights Coming Soon',
      'Discover spending patterns, top movers analysis, and timeline comparisons.',
      '💡'
    );
    section.appendChild(placeholder);
    return { element: section, cleanup: () => {} };
  }

  const transactions = planningData.transactions;

  // Guards the async NetBalanceChart append against section teardown
  let isSectionActive = true;
  let netBalanceEntry = null;

  // 0. Key Takeaways — top textual insights for the selected month
  const takeaways = createTakeawaysSection(planningData, sharedMonthState);
  section.appendChild(takeaways.element);

  // 1. Main Visual Charts Grid (Trend, Timeline YoY)
  const chartsGrid = document.createElement('div');
  chartsGrid.className = 'insights-charts-grid';

  const trendCard = TrendBarChartCard({
    transactions,
    chartRenderer,
  });
  chartsGrid.appendChild(trendCard.element);

  const timelineYoYCard = TimelineYoYCard({
    transactions,
    chartRenderer,
    sharedMonthState,
  });
  chartsGrid.appendChild(timelineYoYCard.element);

  section.appendChild(chartsGrid);

  // 2. Top Movers (detailed month drill-down)
  const { topContainer, renderTopMovers } = createTopMoversSection(
    planningData,
    chartRenderer,
    activeCharts,
    sharedMonthState
  );
  section.appendChild(topContainer);

  // 3. Personal Inflation Trends
  const inflationTrendsComponent = InflationTrends(
    planningData,
    chartRenderer,
    activeCharts,
    sharedMonthState
  );
  section.appendChild(inflationTrendsComponent.element);

  // 4. Net Balance Over Time chart (async — appended when ready, never after teardown)
  createNetBalanceChart(transactions, chartRenderer).then(entry => {
    if (!isSectionActive) {
      entry.cleanup();
      return;
    }
    netBalanceEntry = entry;
    section.appendChild(entry.element);
  });

  // Set up synchronized navigation for month-based sections
  sharedMonthState.onNavigate = () => {
    takeaways.render();
    renderTopMovers();
    timelineYoYCard.render();
    if (inflationTrendsComponent.render) {
      inflationTrendsComponent.render();
    }
  };

  // Cleanup handler
  const cleanup = () => {
    isSectionActive = false;
    sharedMonthState.onNavigate = null;
    if (netBalanceEntry) {
      netBalanceEntry.cleanup();
      netBalanceEntry = null;
    }
    if (trendCard.cleanup) trendCard.cleanup();
    if (timelineYoYCard.cleanup) timelineYoYCard.cleanup();
    if (inflationTrendsComponent.cleanup) {
      inflationTrendsComponent.cleanup();
    }
  };

  return { element: section, cleanup };
};
