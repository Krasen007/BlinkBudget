/**
 * CategorySelector Component
 * Provides a grid of category cards for selection with frequency analysis.
 */

import { COLORS, SPACING, CATEGORY_COLORS } from '../utils/constants.js';
import { CategoryCard } from './CategoryCard.js';
import { AccountTypeCard } from './AccountTypeCard.js';
import { CustomCategoryService } from '../core/custom-category-service.js';
import { buildAccountTypeBreakdown } from '../utils/account-breakdown-utils.js';
import { NavigationState } from '../core/navigation-state.js';

/**
 * Create interactive category selector
 * @param {Object} currentData - Analytics data
 * @param {Map} categoryColorMap - Category colors
 * @param {Function} getCategoryColors - Logic for consistent colors
 * @param {Function} onCategoryClick - Selection callback
 * @param {Object} frequencyData - Optional frequency analysis data
 * @param {Object} budgetStatus - Optional budget status information
 * @param {Object} options - Optional account and income exploration
 * @param {Array} options.accounts - Accounts list (enables Explore Accounts)
 * @param {Function} options.onAccountTypeClick - Account type selection callback
 * @param {Function} options.onIncomeGroupClick - Income group selection callback
 * @returns {HTMLElement}
 */
export const CategorySelector = (
  currentData,
  categoryColorMap,
  getCategoryColors,
  onCategoryClick,
  frequencyData = null,
  budgetStatus = null,
  options = {}
) => {
  const {
    accounts = [],
    onAccountTypeClick = null,
    onIncomeGroupClick = null,
  } = options;

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

  // Show all categories including zero/negative net (refund-only or fully
  // refunded). Filtering those out hides refund transactions from Explore
  // Categories. CategoryCard already renders net-credit cards distinctly.
  const visibleCategories = [...currentData.categoryBreakdown.categories].sort(
    (a, b) => b.amount - a.amount
  );

  if (visibleCategories.length === 0) {
    const emptyState = document.createElement('div');
    emptyState.textContent = 'No categories available for this period.';
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

  const visibleTags = Object.values(tagBreakdown).map(tag => {
    return {
      ...tag,
      percentage:
        totalExpensesForPeriod > 0
          ? (Math.max(0, tag.amount) / totalExpensesForPeriod) * 100
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

  // --- Explore Accounts ---
  // One card per account type (Cash, Checking Account, ...) so the period can
  // be sliced by wallet type. Clicking a card opens the dashboard filtered to
  // every transaction of that account type.
  if (accounts.length > 0 && typeof onAccountTypeClick === 'function') {
    const accountBreakdown = buildAccountTypeBreakdown({
      transactions: currentData.transactions,
      timePeriod: currentData.timePeriod,
      accounts,
    });

    if (accountBreakdown.length > 0) {
      const accountDivider = document.createElement('hr');
      accountDivider.style.border = 'none';
      accountDivider.style.borderTop = `1px solid ${COLORS.BORDER}`;
      accountDivider.style.margin = `${SPACING.LG} 0`;
      section.appendChild(accountDivider);

      const accountTitle = document.createElement('h3');
      accountTitle.textContent = 'Explore Accounts';
      accountTitle.style.margin = `0 0 ${SPACING.XS} 0`;
      accountTitle.style.color = COLORS.TEXT_MAIN;
      section.appendChild(accountTitle);

      const accountDescription = document.createElement('p');
      accountDescription.textContent =
        'Analyze spending by account type. Click on any account type to view all of its transactions.';
      accountDescription.style.margin = `0 0 ${SPACING.XS} 0`;
      accountDescription.style.color = COLORS.TEXT_MUTED;
      section.appendChild(accountDescription);

      const accountGrid = document.createElement('div');
      accountGrid.className = 'category-grid account-grid';
      accountGrid.style.display = 'grid';
      accountGrid.style.gridTemplateColumns =
        'repeat(auto-fill, minmax(250px, 1fr))';
      accountGrid.style.gap = SPACING.MD;
      accountGrid.style.marginTop = SPACING.MD;

      accountBreakdown.forEach(accountType => {
        accountGrid.appendChild(
          AccountTypeCard(accountType, onAccountTypeClick)
        );
      });

      section.appendChild(accountGrid);
    }
  }

  // --- Explore Income Groups ---
  // One card per income category/group for the selected period.
  // Clicking an income group opens the dashboard filtered to that income category.
  const incomeTransactions = periodTransactions.filter(
    t => t.type === 'income'
  );

  const incomeBreakdown = new Map();
  let totalIncomeForPeriod = 0;

  incomeTransactions.forEach(t => {
    const categoryName = t.category || 'Other';
    const amount = Math.abs(t.amount || 0);
    totalIncomeForPeriod += amount;

    let group = incomeBreakdown.get(categoryName);
    if (!group) {
      group = {
        name: categoryName,
        amount: 0,
        transactionCount: 0,
        isIncome: true,
      };
      incomeBreakdown.set(categoryName, group);
    }
    group.amount += amount;
    group.transactionCount += 1;
  });

  const visibleIncomeGroups = [...incomeBreakdown.values()]
    .map(group => ({
      ...group,
      percentage:
        totalIncomeForPeriod > 0
          ? (group.amount / totalIncomeForPeriod) * 100
          : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  if (visibleIncomeGroups.length > 0) {
    const incomeDivider = document.createElement('hr');
    incomeDivider.style.border = 'none';
    incomeDivider.style.borderTop = `1px solid ${COLORS.BORDER}`;
    incomeDivider.style.margin = `${SPACING.LG} 0`;
    section.appendChild(incomeDivider);

    const incomeTitle = document.createElement('h3');
    incomeTitle.textContent = 'Explore Income Groups';
    incomeTitle.style.margin = `0 0 ${SPACING.XS} 0`;
    incomeTitle.style.color = COLORS.TEXT_MAIN;
    section.appendChild(incomeTitle);

    const incomeDescription = document.createElement('p');
    incomeDescription.textContent =
      'Analyze income by category. Click on any income group to view its transactions.';
    incomeDescription.style.margin = `0 0 ${SPACING.XS} 0`;
    incomeDescription.style.color = COLORS.TEXT_MUTED;
    section.appendChild(incomeDescription);

    const incomeGrid = document.createElement('div');
    incomeGrid.className = 'category-grid income-grid';
    incomeGrid.style.display = 'grid';
    incomeGrid.style.gridTemplateColumns =
      'repeat(auto-fill, minmax(250px, 1fr))';
    incomeGrid.style.gap = SPACING.MD;
    incomeGrid.style.marginTop = SPACING.MD;

    const customIncomeCats =
      typeof CustomCategoryService.getByType === 'function'
        ? CustomCategoryService.getByType('income')
        : [];
    const customIncomeColorMap = new Map(
      customIncomeCats.map(cat => [cat.name, cat.color])
    );

    const incomeColorMap = new Map();
    visibleIncomeGroups.forEach(group => {
      // Prefer Category Management colors so edits match expense cards/charts
      const customColor = customIncomeColorMap.get(group.name);
      const predefinedColor = Object.prototype.hasOwnProperty.call(
        CATEGORY_COLORS,
        group.name
      )
        ? CATEGORY_COLORS[group.name]
        : null;
      const color = customColor || predefinedColor || COLORS.INCOME_COLOR;
      incomeColorMap.set(group.name, color);
    });

    const handleIncomeClick =
      typeof onIncomeGroupClick === 'function'
        ? onIncomeGroupClick
        : item => {
            const categoryName = item.name || 'Other';
            NavigationState.saveDashboardTypeFilter('income');
            onCategoryClick({ ...item, name: categoryName });
          };

    visibleIncomeGroups.forEach((group, index) => {
      const card = CategoryCard(
        group,
        index,
        incomeColorMap,
        handleIncomeClick,
        null,
        [],
        null
      );
      incomeGrid.appendChild(card);
    });

    section.appendChild(incomeGrid);
  }

  return section;
};
