/**
 * Insights Section - Advanced Analytics
 *
 * Displays financial insights:
 * - Trend Diverging Bar Chart (Income vs Expense with Net line)
 * - Timeline YoY cumulative spending comparison
 * - Top Movers
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
      'Insights highlight spending trends, category breakdowns, and timeline comparisons. Use these charts to discover patterns and optimize your budget.'
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

  // 4. Net Balance Over Time chart
  createNetBalanceChart().then(netBalanceChart => {
    section.appendChild(netBalanceChart);
  });

  // Set up synchronized navigation for month-based sections
  sharedMonthState.onNavigate = () => {
    renderTopMovers();
    timelineYoYCard.render();
    if (inflationTrendsComponent.render) {
      inflationTrendsComponent.render();
    }
  };

  // Cleanup handler
  const cleanup = () => {
    sharedMonthState.onNavigate = null;
    if (trendCard.cleanup) trendCard.cleanup();
    if (timelineYoYCard.cleanup) timelineYoYCard.cleanup();
    if (inflationTrendsComponent.cleanup) {
      inflationTrendsComponent.cleanup();
    }
  };

  return { element: section, cleanup };
};
