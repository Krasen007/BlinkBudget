/**
 * CategorySelector Component
 * Provides a grid of category cards for selection with frequency analysis.
 */

import { COLORS, SPACING } from '../utils/constants.js';
import { CategoryCard } from './CategoryCard.js';
import { CustomCategoryService } from '../core/custom-category-service.js';

/**
 * Create interactive category selector
 * @param {Object} currentData - Analytics data
 * @param {Map} categoryColorMap - Category colors
 * @param {Function} getCategoryColors - Logic for consistent colors
 * @param {Function} onCategoryClick - Selection callback
 * @param {Object} frequencyData - Optional frequency analysis data
 * @param {Object} budgetStatus - Optional budget status information
 * @returns {HTMLElement}
 */
export const CategorySelector = (
  currentData,
  categoryColorMap,
  getCategoryColors,
  onCategoryClick,
  frequencyData = null,
  budgetStatus = null
) => {
  const section = document.createElement('div');
  section.className = 'category-selector-section';
  section.style.background = COLORS.SURFACE;
  section.style.borderRadius = 'var(--radius-lg)';
  section.style.padding = SPACING.MD;
  section.style.marginTop = SPACING.XS;
  section.style.marginBottom = SPACING.XS;

  const title = document.createElement('h3');
  title.textContent = 'Explore Categories';
  title.style.margin = `0 0 ${SPACING.XS} 0`;
  title.style.color = COLORS.TEXT_MAIN;
  section.appendChild(title);

  const description = document.createElement('p');
  description.textContent =
    'Click on any category below to see detailed spending patterns and visit frequency.';
  description.style.margin = `0 0 ${SPACING.XS} 0`;
  description.style.color = COLORS.TEXT_MUTED;
  section.appendChild(description);

  // Category grid
  const categoryGrid = document.createElement('div');
  categoryGrid.className = 'category-grid';
  categoryGrid.style.display = 'grid';
  categoryGrid.style.gridTemplateColumns =
    'repeat(auto-fill, minmax(250px, 1fr))';
  categoryGrid.style.gap = SPACING.MD;
  categoryGrid.style.marginTop = SPACING.MD;

  // Only show categories with positive net amount — zero (expense = refund)
  // or negative (refund-only) categories clutter the view.
  const visibleCategories = [...currentData.categoryBreakdown.categories]
    .filter(category => category.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  if (visibleCategories.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.textContent =
      'No positive-net categories available for this period.';
    emptyState.style.color = COLORS.TEXT_MUTED;
    emptyState.style.fontStyle = 'italic';
    emptyState.style.padding = `${SPACING.SM} 0`;
    categoryGrid.appendChild(emptyState);
  } else {
    visibleCategories.forEach((category, index) => {
      const card = CategoryCard(
        category,
        index,
        categoryColorMap,
        onCategoryClick,
        frequencyData,
        currentData.insights,
        budgetStatus // Pass budget status to CategoryCard
      );
      categoryGrid.appendChild(card);
    });
  }

  section.appendChild(categoryGrid);

  // --- Explore Tags ---
  // 1. Get transactions for the current period
  const startDate = new Date(currentData.timePeriod.startDate);
  const endDate = new Date(currentData.timePeriod.endDate);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  const periodTransactions = (currentData.transactions || []).filter(t => {
    if (t.isGhost) return false;
    const tDate = new Date(t.date || t.timestamp);
    return tDate >= startDate && tDate <= endDate;
  });

  // Calculate total expenses for the period to calculate tag percentages
  let totalExpensesForPeriod = 0;
  periodTransactions.forEach(t => {
    if (t.type === 'expense') {
      totalExpensesForPeriod += t.amount;
    } else if (t.type === 'refund') {
      totalExpensesForPeriod -= t.amount;
    }
  });

  // 2. Identify all checkbox categories (valid tags/labels) to get custom colors
  const checkboxCats = CustomCategoryService.getCheckboxCategories();
  const checkboxColorMap = new Map(
    checkboxCats.map(cat => [cat.name, cat.color])
  );

  // 3. Aggregate tagged transactions
  const tagBreakdown = {};
  periodTransactions.forEach(t => {
    if (t.tags && Array.isArray(t.tags)) {
      t.tags.forEach(tag => {
        if (!tag) return;
        if (!tagBreakdown[tag]) {
          tagBreakdown[tag] = {
            name: tag,
            amount: 0,
            transactionCount: 0,
            isTag: true, // Mark it as tag for click handler
          };
        }
        if (t.type === 'expense') {
          tagBreakdown[tag].amount += t.amount;
        } else if (t.type === 'refund') {
          tagBreakdown[tag].amount -= t.amount;
        }
        tagBreakdown[tag].transactionCount += 1;
      });
    }
  });

  const visibleTags = Object.values(tagBreakdown)
    .filter(tag => tag.amount > 0)
    .map(tag => {
      return {
        ...tag,
        percentage:
          totalExpensesForPeriod > 0
            ? (tag.amount / totalExpensesForPeriod) * 100
            : 0,
      };
    });
  if (visibleTags.length > 0) {
    // Add tag section divider/title
    const divider = document.createElement('hr');
    divider.style.border = 'none';
    divider.style.borderTop = `1px solid ${COLORS.BORDER}`;
    divider.style.margin = `${SPACING.LG} 0`;
    section.appendChild(divider);

    const tagTitle = document.createElement('h3');
    tagTitle.textContent = 'Explore Tags';
    tagTitle.style.margin = `0 0 ${SPACING.XS} 0`;
    tagTitle.style.color = COLORS.TEXT_MAIN;
    section.appendChild(tagTitle);

    const tagDescription = document.createElement('p');
    tagDescription.textContent =
      'Analyze expenses by tag labels. Click on any tag to view its transactions.';
    tagDescription.style.margin = `0 0 ${SPACING.XS} 0`;
    tagDescription.style.color = COLORS.TEXT_MUTED;
    section.appendChild(tagDescription);

    const tagGrid = document.createElement('div');
    tagGrid.className = 'category-grid'; // Use same class for layout consistency
    tagGrid.style.display = 'grid';
    tagGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
    tagGrid.style.gap = SPACING.MD;
    tagGrid.style.marginTop = SPACING.MD;

    // Create a color map specifically for tags
    const tagColorMap = new Map();
    visibleTags.forEach(tag => {
      const customColor = checkboxColorMap.get(tag.name);
      tagColorMap.set(tag.name, customColor || COLORS.PRIMARY);
    });

    visibleTags.forEach((tag, index) => {
      const card = CategoryCard(
        tag,
        index,
        tagColorMap,
        onCategoryClick, // Will handle correctly because tag has isTag: true
        null, // No frequency data
        [], // No insights
        null // No budget status
      );
      tagGrid.appendChild(card);
    });

    section.appendChild(tagGrid);
  }

  return section;
};
