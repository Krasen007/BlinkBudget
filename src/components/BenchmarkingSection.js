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

  if (benchmarkingData && benchmarkingData.length > 0) {
    // Create table header
    const headerDiv = document.createElement('div');
    headerDiv.style.display = 'grid';
    headerDiv.style.gridTemplateColumns = '2fr 1fr 1fr 1fr';
    headerDiv.style.gap = 'var(--spacing-sm)';
    headerDiv.style.padding = 'var(--spacing-sm)';
    headerDiv.style.background = COLORS.SURFACE_BORDER || 'rgba(156, 163, 175, 0.1)';
    headerDiv.style.borderRadius = 'var(--radius-sm)';
    headerDiv.style.marginBottom = 'var(--spacing-xs)';
    headerDiv.style.fontWeight = '600';
    headerDiv.style.fontSize = 'var(--font-size-sm)';
    headerDiv.style.color = COLORS.TEXT_MUTED;

    const headers = ['Category', 'This Month', 'Last Month', 'Change'];
    headers.forEach(headerText => {
      const header = document.createElement('div');
      header.textContent = headerText;
      header.style.textAlign = headerText === 'Category' ? 'left' : 'right';
      headerDiv.appendChild(header);
    });
    section.appendChild(headerDiv);

    // Create table rows
    const list = document.createElement('div');
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = 'var(--spacing-xs)';

    benchmarkingData.slice(0, 6).forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.style.display = 'grid';
      itemDiv.style.gridTemplateColumns = '2fr 1fr 1fr 1fr';
      itemDiv.style.gap = 'var(--spacing-sm)';
      itemDiv.style.alignItems = 'center';
      itemDiv.style.padding = 'var(--spacing-sm)';
      itemDiv.style.background = COLORS.BACKGROUND;
      itemDiv.style.borderRadius = 'var(--radius-md)';

      // Category column
      const categorySpan = document.createElement('div');
      categorySpan.textContent = item.category || 'Unknown';
      categorySpan.style.fontWeight = '500';
      categorySpan.style.textAlign = 'left';
      itemDiv.appendChild(categorySpan);

      // Current amount column
      const current = item.current || 0;
      const currentSpan = document.createElement('div');
      const safeCurrent =
        typeof current === 'number' && isFinite(current) ? current : 0;
      currentSpan.textContent = `$${safeCurrent.toFixed(2)}`;
      currentSpan.style.color = COLORS.TEXT_MAIN;
      currentSpan.style.textAlign = 'right';
      currentSpan.style.fontFamily = 'monospace';
      itemDiv.appendChild(currentSpan);

      // Last month amount column
      const lastMonth = item.lastMonth || 0;
      const lastMonthSpan = document.createElement('div');
      const safeLastMonth =
        typeof lastMonth === 'number' && isFinite(lastMonth) ? lastMonth : 0;
      lastMonthSpan.textContent = `$${safeLastMonth.toFixed(2)}`;
      lastMonthSpan.style.color = COLORS.TEXT_MUTED;
      lastMonthSpan.style.fontSize = 'var(--font-size-sm)';
      lastMonthSpan.style.textAlign = 'right';
      lastMonthSpan.style.fontFamily = 'monospace';
      itemDiv.appendChild(lastMonthSpan);

      // Change percentage column (use pre-calculated from service)
      let change = item.change || 0;
      change = Math.round(change * 10) / 10;

      const changeSpan = document.createElement('div');
      if (change > 0) {
        changeSpan.textContent = `↑${change.toFixed(1)}%`;
        changeSpan.style.color = COLORS.ERROR || '#ef4444';
      } else if (change < 0) {
        changeSpan.textContent = `↓${Math.abs(change).toFixed(1)}%`;
        changeSpan.style.color = '#22c55e';
      } else {
        changeSpan.textContent = '→0%';
        changeSpan.style.color = COLORS.TEXT_MUTED;
      }
      changeSpan.style.fontSize = 'var(--font-size-sm)';
      changeSpan.style.fontWeight = '600';
      changeSpan.style.textAlign = 'right';
      changeSpan.style.fontFamily = 'monospace';
      itemDiv.appendChild(changeSpan);

      list.appendChild(itemDiv);
    });

    section.appendChild(list);
  }

  return section;
};
