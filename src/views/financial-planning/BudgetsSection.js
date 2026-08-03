/**
 * BudgetsSection Component
 *
 * Section in Financial Planning for managing category budgets.
 * Supports budget suggestions for users with 30+ transactions.
 */

import { COLORS, SPACING, FONT_SIZES } from '../../utils/constants.js';
import { formatCurrency } from '../../utils/financial-planning-helpers.js';
import { MetricsService } from '../../core/analytics/MetricsService.js';
import { getCurrentMonthPeriod } from '../../utils/reports-utils.js';
import { BudgetForm } from '../../components/BudgetForm.js';
import { BudgetSuggestion, BudgetSuggestionsContainer } from '../../components/BudgetSuggestion.js';
import { BudgetProgress } from '../../components/BudgetProgress.js';
import { BudgetSummaryCard } from '../../components/BudgetSummaryCard.js';
import { BudgetPlanner } from '../../core/budget-planner.js';
import { BudgetService } from '../../core/budget-service.js';
import { getProgressiveUnlockMessage } from '../../utils/enhanced-empty-states.js';

const MIN_TRANSACTIONS_FOR_SUGGESTIONS = 30;

/**
 * Create budgets management section
 * @param {Object} planningData - Essential data
 * @returns {Promise<HTMLElement>}
 */
export const BudgetsSection = async planningData => {
  const { StorageService } = await import('../../core/storage.js');
  const container = document.createElement('section');
  container.className = 'budgets-section';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = SPACING.LG;

  const currentPeriod = getCurrentMonthPeriod();

  // Handle null planningData by loading transactions directly
  let transactions = [];
  if (Array.isArray(planningData?.transactions)) {
    transactions = planningData.transactions;
  } else {
    transactions = StorageService.getAllTransactions() || [];
  }

  // Track which suggestions have been dismissed
  let dismissedCategories = new Set();
  let suggestions = [];
  let showingSuggestions = false;

  const render = async () => {
    container.innerHTML = '';

    const summaryData = BudgetPlanner.getSummary(transactions);
    const summaryCard = BudgetSummaryCard(summaryData);
    container.appendChild(summaryCard);

    // Progressive unlock message
    const unlockMsg = getProgressiveUnlockMessage(transactions.length);
    if (unlockMsg) {
      const msg = document.createElement('div');
      msg.textContent = unlockMsg;
      msg.style.cssText = `font-size:${FONT_SIZES.SM};color:${COLORS.TEXT_MUTED};padding:${SPACING.SM} 0;text-align:center;`;
      container.appendChild(msg);
    }

    // Generate suggestions if enough transactions
    if (transactions.length >= MIN_TRANSACTIONS_FOR_SUGGESTIONS) {
      suggestions = await BudgetService.suggestBudgets(transactions);
      // Filter out dismissed categories
      suggestions = suggestions.filter(s => !dismissedCategories.has(s.category));
      // Filter out categories that already have budgets
      const existingBudgets = StorageService.getBudgets();
      suggestions = suggestions.filter(s =>
        !existingBudgets.find(b => b.categoryName === s.category)
      );
    } else {
      suggestions = [];
    }

    // Render suggestions if available and not all dismissed
    if (suggestions.length > 0) {
      showingSuggestions = true;
      const suggestionsContainer = BudgetSuggestionsContainer(suggestions, {
        onAccept: async (suggestion) => {
          StorageService.saveBudget({
            categoryName: suggestion.category,
            amountLimit: suggestion.suggestedAmount,
          });
          // Remove from suggestions and re-render
          suggestions = suggestions.filter(s => s.category !== suggestion.category);
          render();
        },
        onAdjust: (suggestion, index) => {
          // Replace the suggestion card with an edit form
          const cardEl = container.querySelectorAll('.budget-suggestion')[index];
          if (cardEl) {
            const form = BudgetForm({
              categoryName: suggestion.category,
              initialLimit: suggestion.suggestedAmount,
              onSave: (limit) => {
                if (limit && limit > 0) {
                  StorageService.saveBudget({
                    categoryName: suggestion.category,
                    amountLimit: limit,
                  });
                }
                suggestions = suggestions.filter(s => s.category !== suggestion.category);
                render();
              },
              onCancel: () => render(),
            });
            cardEl.replaceWith(form);
          }
        },
        onDismiss: (suggestion) => {
          dismissedCategories.add(suggestion.category);
          suggestions = suggestions.filter(s => s.category !== suggestion.category);
          if (suggestions.length === 0) {
            showingSuggestions = false;
          }
          render();
        },
        onManual: () => {
          // Switch to manual mode by clearing dismissed and hiding suggestions
          showingSuggestions = false;
          render();
        },
      });
      container.appendChild(suggestionsContainer);
    } else {
      showingSuggestions = false;
    }

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

    // Show message if no budgets exist and no suggestions available
    if (budgets.length === 0 && suggestions.length === 0) {
      const emptyMsg = document.createElement('div');
      if (transactions.length < MIN_TRANSACTIONS_FOR_SUGGESTIONS) {
        emptyMsg.textContent = `Log ${MIN_TRANSACTIONS_FOR_SUGGESTIONS - transactions.length} more transaction${transactions.length === MIN_TRANSACTIONS_FOR_SUGGESTIONS - 1 ? '' : 's'} to get personalized budget suggestions.`;
      } else {
        emptyMsg.textContent = 'No budgets set yet. Set a budget for a category below.';
      }
      emptyMsg.style.padding = SPACING.MD;
      emptyMsg.style.textAlign = 'center';
      emptyMsg.style.color = COLORS.TEXT_MUTED;
      listSection.appendChild(emptyMsg);
    }

    const categoriesWithBudgets = categoryBreakdown.categories.map(cat => {
      const budget = budgets.find(b => b.categoryName === cat.name);
      return { ...cat, budget };
    });

    // Sort: categories with budgets first, then others
    categoriesWithBudgets.sort((a, b) => {
      if (a.budget && !b.budget) return -1;
      if (!a.budget && b.budget) return 1;
      return b.amount - a.amount; // Then by spending amount
    });

    categoriesWithBudgets.forEach(cat => {
      const card = document.createElement('div');
      card.className = 'budget-category-card';
      card.dataset.category = cat.name;
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
        card.innerHTML = '';
        const suggestedLimit =
          cat.budget?.amountLimit ?? Math.ceil(cat.amount / 10) * 10;
        const form = BudgetForm({
          categoryName: cat.name,
          initialLimit: suggestedLimit,
          onSave: limit => {
            if (limit === 0) {
              const existing = StorageService.getBudgetByCategory(cat.name);
              if (existing) StorageService.deleteBudget(existing.id);
            } else if (limit === null) {
              // no-op
            } else {
              StorageService.saveBudget({
                categoryName: cat.name,
                amountLimit: limit,
              });
            }
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
        hint.textContent = `Current spending: ${formatCurrency(cat.amount)}`;
        hint.style.fontSize = FONT_SIZES.SM;
        hint.style.color = COLORS.TEXT_MUTED;
        card.appendChild(hint);
      }

      listSection.appendChild(card);
    });

    container.appendChild(listSection);
  };

  await render();

  return container;
};
