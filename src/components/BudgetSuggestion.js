/**
 * BudgetSuggestion Component
 *
 * Displays a suggested budget with Accept | Adjust | Dismiss actions.
 * Part of the progressive unlock system — shows suggestions when user has 30+ transactions.
 */

import { COLORS, SPACING, FONT_SIZES } from '../utils/constants.js';
import { ButtonComponent } from './Button.js';
import { getColorForCategory } from '../utils/reports-charts.js';
import { formatCurrency } from '../utils/financial-planning-helpers.js';

/**
 * Create a budget suggestion card
 * @param {Object} suggestion - { category, suggestedAmount, basedOnTransactions, averageMonthly }
 * @param {Object} handlers - { onAccept, onAdjust, onDismiss }
 * @returns {HTMLElement}
 */
export const BudgetSuggestion = (suggestion, handlers) => {
  const { category, suggestedAmount, basedOnTransactions, averageMonthly } =
    suggestion;
  const { onAccept, onAdjust, onDismiss } = handlers;

  const card = document.createElement('div');
  card.className = 'budget-suggestion';
  Object.assign(card.style, {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACING.SM,
    padding: SPACING.MD,
    background: COLORS.BACKGROUND,
    borderRadius: 'var(--radius-md)',
    border: `1px solid ${COLORS.BORDER}`,
    borderLeft: `4px solid ${getColorForCategory(category)}`,
  });

  // Header with category name
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';

  const categoryLabel = document.createElement('span');
  categoryLabel.textContent = category;
  categoryLabel.style.fontWeight = '600';
  categoryLabel.style.fontSize = FONT_SIZES.MD;
  header.appendChild(categoryLabel);

  const dismissBtn = document.createElement('button');
  dismissBtn.textContent = '×';
  dismissBtn.setAttribute('aria-label', 'Dismiss suggestion');
  Object.assign(dismissBtn.style, {
    background: 'transparent',
    border: 'none',
    fontSize: '1.2rem',
    cursor: 'pointer',
    color: COLORS.TEXT_MUTED,
    padding: '0 4px',
  });
  dismissBtn.addEventListener('click', onDismiss);
  dismissBtn.addEventListener('mouseenter', () => {
    dismissBtn.style.color = COLORS.TEXT_MAIN;
  });
  dismissBtn.addEventListener('mouseleave', () => {
    dismissBtn.style.color = COLORS.TEXT_MUTED;
  });
  header.appendChild(dismissBtn);
  card.appendChild(header);

  // Suggested amount
  const amountDisplay = document.createElement('div');
  amountDisplay.style.fontSize = FONT_SIZES.XL;
  amountDisplay.style.fontWeight = '700';
  amountDisplay.style.color = COLORS.TEXT_MAIN;
  amountDisplay.textContent = formatCurrency(suggestedAmount);
  card.appendChild(amountDisplay);

  // Context: based on spending
  const context = document.createElement('div');
  context.style.fontSize = FONT_SIZES.SM;
  context.style.color = COLORS.TEXT_MUTED;
  context.textContent = `Based on ${basedOnTransactions} transactions averaging ${formatCurrency(averageMonthly)}/month`;
  card.appendChild(context);

  // Action buttons
  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.gap = SPACING.SM;
  actions.style.marginTop = SPACING.XS;

  const adjustBtn = ButtonComponent({
    text: 'Adjust',
    onClick: onAdjust,
    variant: 'ghost',
  });
  adjustBtn.style.flex = '1';

  const acceptBtn = ButtonComponent({
    text: 'Accept',
    onClick: onAccept,
    variant: 'primary',
  });
  acceptBtn.style.flex = '2';
  // Use category color for primary action
  acceptBtn.style.backgroundColor = getColorForCategory(category);
  acceptBtn.style.borderColor = getColorForCategory(category);

  actions.appendChild(adjustBtn);
  actions.appendChild(acceptBtn);
  card.appendChild(actions);

  return card;
};

/**
 * Create a container for budget suggestions
 * @param {Array} suggestions - Array of suggestion objects
 * @param {Object} handlers - { onAccept, onAdjust, onDismiss }
 * @returns {HTMLElement}
 */
export const BudgetSuggestionsContainer = (suggestions, handlers) => {
  const container = document.createElement('div');
  container.className = 'budget-suggestions-container';
  Object.assign(container.style, {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACING.MD,
    marginBottom: SPACING.LG,
  });

  // Header
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.gap = SPACING.SM;

  const icon = document.createElement('span');
  icon.textContent = '💡';
  header.appendChild(icon);

  const title = document.createElement('h3');
  title.textContent = 'Suggested Budgets';
  title.style.margin = '0';
  title.style.fontSize = FONT_SIZES.MD;
  header.appendChild(title);

  container.appendChild(header);

  // Add all suggestion cards
  suggestions.forEach((suggestion, index) => {
    const card = BudgetSuggestion(suggestion, {
      onAccept: () => handlers.onAccept(suggestion, index),
      onAdjust: () => handlers.onAdjust(suggestion, index),
      onDismiss: () => handlers.onDismiss(suggestion, index),
    });
    container.appendChild(card);
  });

  // Add "Create manually" link at bottom
  const manualLink = document.createElement('button');
  manualLink.textContent = 'Or set a custom budget';
  manualLink.className = 'btn-link';
  Object.assign(manualLink.style, {
    background: 'transparent',
    border: 'none',
    color: COLORS.TEXT_MUTED,
    cursor: 'pointer',
    fontSize: FONT_SIZES.SM,
    textDecoration: 'underline',
    padding: '0',
    alignSelf: 'center',
  });
  manualLink.addEventListener('click', handlers.onManual);
  container.appendChild(manualLink);

  return container;
};
