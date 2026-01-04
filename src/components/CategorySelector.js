/**
 * CategorySelector Component
 * Provides a grid of category cards for selection.
 */

import { COLORS, SPACING } from '../utils/constants.js';
import { CategoryCard } from './CategoryCard.js';

/**
 * Create interactive category selector
 * @param {Object} currentData - Analytics data
 * @param {Map} categoryColorMap - Category colors
 * @param {Function} getCategoryColors - Logic for consistent colors
 * @param {Function} onCategoryClick - Selection callback
 * @returns {HTMLElement}
 */
export const CategorySelector = (
  currentData,
  categoryColorMap,
  getCategoryColors,
  onCategoryClick
) => {
  const section = document.createElement('div');
  section.className = 'category-selector-section';
  section.style.background = COLORS.SURFACE;
  section.style.borderRadius = 'var(--radius-lg)';
  section.style.border = `1px solid ${COLORS.BORDER}`;
  section.style.padding = SPACING.LG;
  section.style.marginTop = SPACING.XL;
  section.style.marginBottom = SPACING.XL;

  const title = document.createElement('h3');
  title.textContent = 'Explore Categories';
  title.style.margin = `0 0 ${SPACING.MD} 0`;
  title.style.color = COLORS.TEXT_MAIN;
  section.appendChild(title);

  const description = document.createElement('p');
  description.textContent =
    'Click on any category below to see detailed spending patterns and trends.';
  description.style.margin = `0 0 ${SPACING.LG} 0`;
  description.style.color = COLORS.TEXT_MUTED;
  section.appendChild(description);

  // Category grid
  const categoryGrid = document.createElement('div');
  categoryGrid.className = 'category-grid';
  categoryGrid.style.display = 'grid';
  categoryGrid.style.gridTemplateColumns =
    'repeat(auto-fill, minmax(200px, 1fr))';
  categoryGrid.style.gap = SPACING.MD;
  categoryGrid.style.marginTop = SPACING.MD;

  currentData.categoryBreakdown.categories.forEach((category, index) => {
    const card = CategoryCard(
      category,
      index,
      categoryColorMap,
      getCategoryColors,
      onCategoryClick
    );
    categoryGrid.appendChild(card);
  });

  section.appendChild(categoryGrid);

  // Category details section
  const categoryDetailsSection = document.createElement('div');
  categoryDetailsSection.id = 'category-details-section';
  categoryDetailsSection.style.display = 'none';
  categoryDetailsSection.style.marginTop = SPACING.XL;
  categoryDetailsSection.style.paddingTop = SPACING.XL;
  categoryDetailsSection.style.borderTop = `2px solid ${COLORS.BORDER}`;
  section.appendChild(categoryDetailsSection);

  return section;
};
