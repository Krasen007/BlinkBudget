/**
 * BudgetsSection Component
 *
 * Section in Financial Planning for managing category budgets.
 */

import { COLORS, SPACING, FONT_SIZES } from '../../utils/constants.js';
import { formatCurrency } from '../../utils/financial-planning-helpers.js';
import { StorageService } from '../../core/storage.js';
import { MetricsService } from '../../core/analytics/MetricsService.js';
import { getCurrentMonthPeriod } from '../../utils/reports-utils.js';
import { BudgetForm } from '../../components/BudgetForm.js';
import { BudgetProgress } from '../../components/BudgetProgress.js';
import { BudgetSummaryCard } from '../../components/BudgetSummaryCard.js';
import { BudgetPlanner } from '../../core/budget-planner.js';

/**
 * Create budgets management section
 * @param {Object} planningData - Essential data
 * @returns {HTMLElement}
 */
export const BudgetsSection = planningData => {
  const container = document.createElement('section');
  container.className = 'budgets-section';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = SPACING.LG;

  const currentPeriod = getCurrentMonthPeriod();
  const transactions = planningData.transactions || [];

  const render = () => {
    container.innerHTML = '';

    const summaryData = BudgetPlanner.getSummary(transactions);
    const summaryCard = BudgetSummaryCard(summaryData);
    container.appendChild(summaryCard);

    // Categories List
    const listSection = document.createElement('div');
    listSection.style.display = 'flex';
    listSection.style.flexDirection = 'column';
    listSection.style.gap = SPACING.MD;

    const listTitle = document.createElement('h3');
    listTitle.textContent = 'Category Budgets';
    listTitle.style.margin = '0';
    listSection.appendChild(listTitle);

    const categoryBreakdown = MetricsService.calculateCategoryBreakdown(
      transactions,
      currentPeriod
    );
    const budgets = StorageService.getBudgets();

    // Grouping: Active Budgets first, then other categories
    const categoriesWithBudgets = categoryBreakdown.categories.map(cat => {
      const budget = budgets.find(b => b.categoryName === cat.name);
      return { ...cat, budget };
    });

    categoriesWithBudgets.forEach(cat => {
      const card = document.createElement('div');
      Object.assign(card.style, {
        background: COLORS.SURFACE,
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${COLORS.BORDER}`,
        padding: SPACING.MD,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.SM,
      });

      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';

      const name = document.createElement('span');
      name.textContent = cat.name;
      name.style.fontWeight = 'bold';
      header.appendChild(name);

      const actionBtn = document.createElement('button');
      actionBtn.textContent = cat.budget ? 'Edit Budget' : 'Set Budget';
      actionBtn.className = 'btn btn-ghost';
      actionBtn.style.padding = `${SPACING.XS} ${SPACING.SM}`;
      actionBtn.style.fontSize = FONT_SIZES.SM;

      actionBtn.addEventListener('click', () => {
        // Show form instead of progress
        card.innerHTML = '';
        const form = BudgetForm({
          categoryName: cat.name,
          initialLimit: cat.budget?.amountLimit,
          onSave: limit => {
            StorageService.saveBudget({
              categoryName: cat.name,
              amountLimit: limit,
            });
            render();
          },
          onCancel: () => render(),
        });
        card.appendChild(form);
      });

      header.appendChild(actionBtn);
      card.appendChild(header);

      if (cat.budget) {
        const utilization =
          cat.budget.amountLimit > 0
            ? (cat.amount / cat.budget.amountLimit) * 100
            : 0;
        const diff = cat.budget.amountLimit - cat.amount;
        const diffText =
          diff >= 0
            ? `${formatCurrency(diff)} left`
            : `${formatCurrency(Math.abs(diff))} over`;

        const progress = BudgetProgress({
          utilization,
          isExceeded: cat.amount > cat.budget.amountLimit,
          isWarning: utilization >= 80 && utilization <= 100,
          label: 'Spending',
          secondaryLabel: `${formatCurrency(cat.amount)} / ${formatCurrency(cat.budget.amountLimit)} (${diffText})`,
        });
        card.appendChild(progress);
      } else {
        const hint = document.createElement('div');
        hint.textContent = `No budget set. Current spending: ${formatCurrency(cat.amount)}`;
        hint.style.fontSize = FONT_SIZES.SM;
        hint.style.color = COLORS.TEXT_MUTED;
        card.appendChild(hint);
      }

      listSection.appendChild(card);
    });

    container.appendChild(listSection);
  };

  render();

  return container;
};
