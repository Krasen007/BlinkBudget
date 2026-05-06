/**
 * ActionCard Component - Reusable Alert/Notification Card
 *
 * A flexible card component for displaying budget alerts, notifications,
 * and actionable insights with severity indicators and progress tracking.
 */

import { COLORS, SPACING } from '../../utils/constants.js';

/**
 * Create an ActionCard with customizable content and actions
 * @param {Object} options - Card configuration
 * @param {string} options.title - Card title
 * @param {string} options.description - Card description
 * @param {string} options.type - Alert type: 'alert', 'warning', 'success', 'info', 'default'
 * @param {number} [options.amount] - Optional amount to display
 * @param {number} [options.percentage] - Optional percentage for progress
 * @param {string} [options.actionText] - Action button text
 * @param {Function} [options.onAction] - Action button callback
 * @param {string} [options.icon] - Icon emoji or text
 * @param {string} [options.currency] - Currency code (default: 'EUR')
 * @returns {HTMLElement} ActionCard DOM element
 */
export const ActionCard = options => {
  const {
    title,
    description,
    type = 'default',
    amount,
    percentage,
    actionText,
    onAction,
    icon,
    currency = 'EUR',
  } = options;

  const card = document.createElement('div');
  card.className = 'action-card';

  // Color-coded severity indicators
  const typeColors = {
    alert: {
      border: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.05)',
      accent: '#ef4444',
    },
    warning: {
      border: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.05)',
      accent: '#f59e0b',
    },
    success: {
      border: '#22c55e',
      bg: 'rgba(34, 197, 94, 0.05)',
      accent: '#22c55e',
    },
    info: {
      border: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.05)',
      accent: '#3b82f6',
    },
    default: {
      border: COLORS.BORDER,
      bg: COLORS.SURFACE,
      accent: COLORS.PRIMARY,
    },
  };

  const colors = typeColors[type] || typeColors.default;

  card.style.cssText = `
    background: ${colors.bg};
    border: 1px solid ${colors.border};
    border-left: 4px solid ${colors.accent};
    border-radius: var(--radius-md);
    padding: ${SPACING.MD};
    margin-bottom: ${SPACING.SM};
    display: flex;
    align-items: flex-start;
    gap: ${SPACING.SM};
    transition: all 0.2s ease;
    position: relative;
  `;

  // Icon container
  const iconContainer = document.createElement('div');
  iconContainer.className = 'icon-container';
  iconContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: ${SPACING.XS};
    flex-shrink: 0;
  `;

  const iconEl = document.createElement('div');
  iconEl.className = 'icon';
  iconEl.style.cssText = `
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    background: ${colors.accent}20;
    color: ${colors.accent};
  `;
  iconEl.textContent = icon || '!';

  iconContainer.appendChild(iconEl);

  // Progress indicator if percentage provided
  if (percentage !== undefined) {
    const progressIndicator = document.createElement('div');
    progressIndicator.className = 'progress-indicator';
    progressIndicator.style.cssText = `
      width: 40px;
      height: 4px;
      background: rgba(0, 0, 0, 0.1);
      border-radius: 2px;
      overflow: hidden;
      position: relative;
    `;

    const progressBar = document.createElement('div');
    const progressWidth = Math.min(Math.max(percentage, 0), 100);
    progressBar.style.cssText = `
      height: 100%;
      width: ${progressWidth}%;
      background: ${colors.accent};
      transition: width 0.3s ease;
    `;
    progressIndicator.appendChild(progressBar);
    iconContainer.appendChild(progressIndicator);
  }

  // Content container
  const content = document.createElement('div');
  content.style.cssText = `
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: ${SPACING.XS};
  `;

  // Title
  const titleEl = document.createElement('div');
  titleEl.textContent = title;
  titleEl.style.cssText = `
    font-weight: 600;
    font-size: 0.875rem;
    color: ${COLORS.TEXT_MAIN};
  `;
  content.appendChild(titleEl);

  // Description
  const descriptionEl = document.createElement('div');
  descriptionEl.textContent = description;
  descriptionEl.style.cssText = `
    font-size: 0.8125rem;
    color: ${COLORS.TEXT_MUTED};
    line-height: 1.4;
  `;
  content.appendChild(descriptionEl);

  // Amount display if provided
  if (amount !== undefined) {
    const amountContainer = document.createElement('div');
    amountContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: ${SPACING.XS};
      flex-wrap: wrap;
    `;

    const amountEl = document.createElement('div');
    amountEl.textContent = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
    amountEl.style.cssText = `
      font-weight: 600;
      font-size: 0.9375rem;
      color: ${colors.accent};
    `;

    amountContainer.appendChild(amountEl);

    // Percentage badge if provided
    if (percentage !== undefined) {
      const percentBadge = document.createElement('span');
      percentBadge.textContent = `${Math.round(percentage)}%`;
      percentBadge.style.cssText = `
        background: ${colors.accent}20;
        color: ${colors.accent};
        padding: 2px 6px;
        border-radius: 12px;
        font-size: 0.6875rem;
        font-weight: 500;
      `;
      amountContainer.appendChild(percentBadge);
    }

    content.appendChild(amountContainer);
  }

  // Action button if provided
  let actionBtn = null;
  if (actionText && onAction) {
    actionBtn = document.createElement('button');
    actionBtn.textContent = actionText;
    actionBtn.style.cssText = `
      background: ${colors.accent};
      color: white;
      border: none;
      border-radius: var(--radius-sm);
      padding: ${SPACING.XS} ${SPACING.SM};
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;
      align-self: flex-start;
      margin-top: auto;
    `;

    actionBtn.addEventListener('click', onAction);
    content.appendChild(actionBtn);
  }

  // Assemble card
  card.appendChild(iconContainer);
  card.appendChild(content);

  // Hover effects
  card.addEventListener('mouseenter', () => {
    card.style.transform = 'translateY(-2px)';
    card.style.boxShadow = `0 4px 16px ${colors.accent}20`;
    if (actionBtn) {
      actionBtn.style.transform = 'scale(1.05)';
      actionBtn.style.boxShadow = `0 2px 8px ${colors.accent}40`;
    }
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'translateY(0)';
    card.style.boxShadow = 'none';
    if (actionBtn) {
      actionBtn.style.transform = 'scale(1)';
      actionBtn.style.boxShadow = 'none';
    }
  });

  return card;
};

/**
 * Create an unusual spending alert card
 * @param {Object} transaction - Unusual transaction
 * @param {number} averageAmount - Average amount for comparison
 * @param {Function} onViewTransaction - Callback for viewing transaction
 * @returns {HTMLElement} Unusual spending alert card
 */
export const UnusualSpendingCard = (
  transaction,
  averageAmount,
  onViewTransaction
) => {
  // Guard against division by zero
  let multiplier;
  if (averageAmount !== 0 && Number.isFinite(Number(averageAmount))) {
    multiplier = (transaction.amount / averageAmount).toFixed(1);
  } else {
    multiplier = '—'; // Safe fallback for zero/invalid average
  }

  return ActionCard({
    title: 'Unusual Spending Detected',
    description: `This expense is ${multiplier}x your normal ${transaction.category} spending`,
    type: 'warning',
    amount: transaction.amount,
    actionText: 'View Transaction',
    onAction: onViewTransaction,
    icon: '!',
  });
};

/**
 * Create a savings goal progress card
 * @param {Object} goal - Savings goal object
 * @param {number} currentProgress - Current amount saved
 * @param {Function} onViewGoal - Callback for viewing goal details
 * @returns {HTMLElement} Savings goal progress card
 */
export const SavingsGoalCard = (goal, currentProgress, onViewGoal) => {
  // Guard against division by zero and invalid values in percentage calculation
  let percentage = 0;
  let remaining = 0;

  const target = Number(goal.target);
  const sanitizedCurrentProgress = Number(currentProgress);

  if (
    Number.isFinite(target) &&
    target !== 0 &&
    Number.isFinite(sanitizedCurrentProgress)
  ) {
    percentage = Math.min(
      Math.max((sanitizedCurrentProgress / target) * 100, 0),
      100
    );
    remaining = target - sanitizedCurrentProgress;
  }
  // Variables already initialized to 0 for invalid/zero targets

  let type, title;
  if (percentage >= 100) {
    type = 'success';
    title = 'Goal Achieved!';
  } else if (percentage >= 75) {
    type = 'info';
    title = 'Almost There!';
  } else if (percentage >= 50) {
    type = 'default';
    title = 'Good Progress';
  } else {
    type = 'default';
    title = 'Keep Going';
  }

  return ActionCard({
    title,
    description: `${goal.name}: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(remaining)} to go`,
    type,
    amount: currentProgress,
    percentage,
    actionText: 'View Goal',
    onAction: onViewGoal,
    icon: '!',
  });
};
