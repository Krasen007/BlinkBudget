/**
 * BenchmarkingSection Component
 * Feature 3.3.3 - Comparative Analytics Personal Benchmarking Display
 */

import { COLORS, SPACING } from '../utils/constants.js';

export const BenchmarkingSection = (benchmarkingData, _timePeriod) => {
  const section = document.createElement('div');
  section.className = 'benchmarking-section';
  section.style.background = COLORS.SURFACE;
  section.style.borderRadius = 'var(--radius-lg)';
  section.style.padding = SPACING.MD;
  section.style.marginTop = SPACING.MD;

  const title = document.createElement('h3');
  title.textContent = 'Personal Benchmarking';
  title.style.margin = '0 0 var(--spacing-sm) 0';
  title.style.color = COLORS.TEXT_MAIN;
  section.appendChild(title);

  const description = document.createElement('p');
  description.textContent = 'This Month vs Last Month comparison';
  description.style.color = COLORS.TEXT_MUTED;
  description.style.fontSize = 'var(--font-size-sm)';
  description.style.margin = '0 0 var(--spacing-md) 0';
  section.appendChild(description);

  // Debug log
  console.log('[BenchmarkingSection] Received data:', benchmarkingData);
  if (benchmarkingData && benchmarkingData.length > 0) {
    console.log(
      '[BenchmarkingSection] First item:',
      JSON.stringify(benchmarkingData[0], null, 2)
    );
  }

  if (
    !benchmarkingData ||
    !Array.isArray(benchmarkingData) ||
    benchmarkingData.length === 0
  ) {
    const noData = document.createElement('div');
    noData.textContent = 'Add more transactions to see personal benchmarking.';
    noData.style.color = COLORS.TEXT_MUTED;
    noData.style.fontStyle = 'italic';
    noData.style.padding = 'var(--spacing-md)';
    noData.style.textAlign = 'center';
    section.appendChild(noData);
    return section;
  }

  // Create list of benchmarking items
  const list = document.createElement('div');
  list.style.display = 'flex';
  list.style.flexDirection = 'column';
  list.style.gap = 'var(--spacing-sm)';

  benchmarkingData.slice(0, 6).forEach(item => {
    const itemDiv = document.createElement('div');
    itemDiv.style.display = 'flex';
    itemDiv.style.justifyContent = 'space-between';
    itemDiv.style.alignItems = 'center';
    itemDiv.style.padding = 'var(--spacing-sm)';
    itemDiv.style.background = COLORS.BACKGROUND;
    itemDiv.style.borderRadius = 'var(--radius-md)';

    const categorySpan = document.createElement('span');
    categorySpan.textContent = item.category || 'Unknown';
    categorySpan.style.fontWeight = '500';
    itemDiv.appendChild(categorySpan);

    const statsDiv = document.createElement('div');
    statsDiv.style.display = 'flex';
    statsDiv.style.gap = 'var(--spacing-md)';
    statsDiv.style.alignItems = 'center';

    // Current amount (handle both old and new format)
    const current = item.current || item.historicalAverage || 0;
    const currentSpan = document.createElement('span');
    const safeCurrent =
      typeof current === 'number' && isFinite(current) ? current : 0;
    currentSpan.textContent = `$${safeCurrent.toFixed(2)}`;
    currentSpan.style.color = COLORS.TEXT_MAIN;
    statsDiv.appendChild(currentSpan);

    // Change indicator - calculate from old format if needed
    let change = item.change || 0;
    // If old format (historicalAverage), calculate change
    if (item.historicalAverage && item.current && item.change === undefined) {
      change =
        ((item.current - item.historicalAverage) / item.historicalAverage) *
        100;
    }
    // If we have lastMonth (new format), calculate change
    if (item.lastMonth !== undefined && item.current !== undefined) {
      change =
        item.lastMonth > 0
          ? ((item.current - item.lastMonth) / item.lastMonth) * 100
          : 0;
    }

    change = Math.round(change * 10) / 10;

    const changeSpan = document.createElement('span');
    if (change > 0) {
      changeSpan.textContent = `↑${change.toFixed(0)}%`;
      changeSpan.style.color = COLORS.ERROR || '#ef4444';
    } else if (change < 0) {
      changeSpan.textContent = `↓${Math.abs(change).toFixed(0)}%`;
      changeSpan.style.color = '#22c55e';
    } else {
      changeSpan.textContent = '→0%';
      changeSpan.style.color = COLORS.TEXT_MUTED;
    }
    changeSpan.style.fontSize = 'var(--font-size-sm)';
    changeSpan.style.fontWeight = '600';
    statsDiv.appendChild(changeSpan);

    itemDiv.appendChild(statsDiv);
    list.appendChild(itemDiv);
  });

  section.appendChild(list);
  return section;
};

export default BenchmarkingSection;
