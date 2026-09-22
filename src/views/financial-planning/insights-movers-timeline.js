/**
 * Top Movers legacy section
 * Extracted from InsightsSection.js to maintain file size constraints (<500 lines)
 */

import { InsightsGenerator } from '../../core/insights-generator.js';
import { showChartFallback } from '../../components/ChartRenderer.js';

/**
 * Create top movers analysis
 */
export function createTopMoversSection(
  planningData,
  chartRenderer,
  activeCharts,
  sharedMonthState
) {
  const topContainer = document.createElement('div');
  topContainer.className = 'card insights-card insights-top-movers';

  function getMonthData(offset) {
    const now = new Date();
    const targetDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const currentMonth = targetDate.getMonth();
    const currentYear = targetDate.getFullYear();
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 1);

    const monthTransactions = planningData.transactions.filter(t => {
      if (t.isGhost) return false;
      const ts = new Date(t.timestamp);
      return ts >= startOfMonth && ts < endOfMonth;
    });

    return {
      transactions: monthTransactions,
      startOfMonth,
      endOfMonth,
      displayMonth: targetDate,
    };
  }

  function renderTopMovers() {
    const monthOffset = sharedMonthState.offset;
    const monthData = getMonthData(monthOffset);
    const topMovers = InsightsGenerator.topMovers(monthData.transactions, 6);

    const existingList = topContainer.querySelector('.top-movers-list');
    const existingChart = topContainer.querySelector('.top-movers-chart');
    if (existingList) existingList.remove();
    if (existingChart) {
      chartRenderer.destroyChart('insights-top-movers');
      existingChart.remove();
    }

    const monthName = monthData.displayMonth.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
    topTitle.textContent = `Top Movers - ${monthName}`;

    const prevBtn = topContainer.querySelector('.top-movers-prev-btn');
    const nextBtn = topContainer.querySelector('.top-movers-next-btn');
    if (prevBtn && nextBtn) {
      const prevMonth = new Date(
        monthData.displayMonth.getFullYear(),
        monthData.displayMonth.getMonth() - 1,
        1
      );
      const nextMonth = new Date(
        monthData.displayMonth.getFullYear(),
        monthData.displayMonth.getMonth() + 1,
        1
      );
      const prevMonthName = prevMonth.toLocaleDateString('en-US', {
        month: 'short',
      });
      const nextMonthName = nextMonth.toLocaleDateString('en-US', {
        month: 'short',
      });
      prevBtn.textContent = `← ${prevMonthName}`;
      nextBtn.textContent = `${nextMonthName} →`;
    }

    const topChartDiv = document.createElement('div');
    topChartDiv.className =
      'top-movers-chart insights-chart-area insights-chart-area--compact';
    const topCanvas = document.createElement('canvas');
    topCanvas.id = 'insights-top-movers-chart';
    topChartDiv.appendChild(topCanvas);
    topContainer.appendChild(topChartDiv);

    const topLabels = topMovers.map(t => t.category);
    const topData = topMovers.map(t => Math.abs(t.total));

    chartRenderer
      .createBarChart(topCanvas, {
        labels: topLabels,
        datasets: [{ label: 'Amount', data: topData }],
      })
      .then(chart => {
        if (chart) {
          activeCharts.set('insights-top-movers', chart);
        } else {
          showChartFallback(
            topChartDiv,
            'Unable to display the top movers chart. Please try refreshing this section.'
          );
        }
      })
      .catch(error => {
        console.error(
          '[InsightsSection] Failed to create top movers chart:',
          error
        );
        showChartFallback(
          topChartDiv,
          'Unable to display the top movers chart. Please try refreshing this section.'
        );
      });
  }

  const topHeader = document.createElement('div');
  topHeader.className = 'insights-card-header';

  const topTitleWrapper = document.createElement('div');
  topTitleWrapper.className = 'insights-card-title-group';

  const topTitle = document.createElement('h3');
  topTitle.className = 'insights-card-title';
  topTitle.textContent = 'Top Movers';

  const topSubtitle = document.createElement('p');
  topSubtitle.className = 'insights-card-subtitle';
  topSubtitle.textContent = 'Categories with the highest spending this month';

  topTitleWrapper.appendChild(topTitle);
  topTitleWrapper.appendChild(topSubtitle);
  topHeader.appendChild(topTitleWrapper);

  const navButton = document.createElement('div');
  navButton.className = 'insights-nav-group';

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'top-movers-prev-btn insights-nav-btn';
  prevBtn.textContent = '← Previous';
  prevBtn.setAttribute('aria-label', 'Show the previous month');

  prevBtn.addEventListener('click', () => {
    sharedMonthState.offset--;
    if (sharedMonthState.onNavigate) sharedMonthState.onNavigate();
  });

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'top-movers-next-btn insights-nav-btn';
  nextBtn.textContent = 'Next →';
  nextBtn.setAttribute('aria-label', 'Show the next month');

  nextBtn.addEventListener('click', () => {
    if (sharedMonthState.offset < 0) {
      sharedMonthState.offset++;
      if (sharedMonthState.onNavigate) sharedMonthState.onNavigate();
    }
  });

  navButton.appendChild(prevBtn);
  navButton.appendChild(nextBtn);
  topHeader.appendChild(navButton);
  topContainer.appendChild(topHeader);

  renderTopMovers();

  return { topContainer, renderTopMovers };
}
