import { COLORS, SPACING } from '../../utils/constants.js';

/**
 * DataTable Component - Reusable data table with grid layout
 * @param {Object} props - Table properties
 * @param {string} props.title - Table title
 * @param {Array<string>} props.headers - Column headers
 * @param {Array<Array>} props.rows - Table rows (array of cell values)
 * @param {Array<string>} [props.headerStyles] - Optional styles for headers
 * @param {Array<Array<string>>} [props.cellStyles] - Optional styles for cells
 * @returns {HTMLElement} The data table element
 */
export const DataTable = ({
  title,
  headers,
  rows,
  headerStyles = [],
  cellStyles = [],
}) => {
  const container = document.createElement('div');
  container.className = 'forecast-table-container';
  container.style.background = COLORS.SURFACE;
  container.style.border = `1px solid ${COLORS.BORDER}`;
  container.style.borderRadius = 'var(--radius-lg)';
  container.style.padding = SPACING.LG;

  if (title) {
    const titleElement = document.createElement('h3');
    titleElement.textContent = title;
    titleElement.style.margin = '0';
    titleElement.style.marginBottom = SPACING.MD;
    titleElement.style.fontSize = '1.125rem';
    titleElement.style.fontWeight = '600';
    titleElement.style.color = COLORS.TEXT_MAIN;
    container.appendChild(titleElement);
  }

  const table = document.createElement('div');
  table.className = 'forecast-table';
  table.style.display = 'grid';
  table.style.gridTemplateColumns = `repeat(${headers.length}, ${headers.length === 5 ? '1fr auto auto auto auto' : '1fr'})`;
  table.style.gap = `${SPACING.SM} ${SPACING.MD}`;
  table.style.fontSize = '0.875rem';

  // Header row
  headers.forEach((header, index) => {
    const headerCell = document.createElement('div');
    headerCell.textContent = header;
    headerCell.style.fontWeight = '600';
    headerCell.style.color = COLORS.TEXT_MUTED;
    headerCell.style.paddingBottom = SPACING.SM;
    headerCell.style.borderBottom = `1px solid ${COLORS.BORDER}`;

    // Apply custom header styles if provided
    if (headerStyles[index]) {
      Object.assign(headerCell.style, headerStyles[index]);
    }

    table.appendChild(headerCell);
  });

  // Data rows
  rows.forEach((row, rowIndex) => {
    row.forEach((cell, cellIndex) => {
      const cellElement = document.createElement('div');
      cellElement.textContent = cell;
      cellElement.style.paddingTop = SPACING.SM;

      // Apply custom cell styles if provided
      if (cellStyles[rowIndex] && cellStyles[rowIndex][cellIndex]) {
        Object.assign(cellElement.style, cellStyles[rowIndex][cellIndex]);
      }

      table.appendChild(cellElement);
    });
  });

  container.appendChild(table);

  return container;
};
