import { COLORS, SPACING } from '../../utils/constants.js';

/**
 * Create summary card with aggregate manually reported metrics.
 * @param {Array} goals - Array of goals
 * @returns {HTMLElement} Summary card element
 */
export function createGoalsSummaryCard(goals) {
  const card = document.createElement('div');
  card.className = 'goals-summary-card';
  card.style.cssText = `
    background: ${COLORS.SURFACE};
    border: 1px solid ${COLORS.BORDER};
    border-radius: var(--radius-md);
    padding: ${SPACING.MD};
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: ${SPACING.MD};
    margin-bottom: ${SPACING.MD};
  `;

  const totalTarget = goals.reduce(
    (sum, goal) => sum + Number(goal.targetAmount || 0),
    0
  );
  const totalReported = goals.reduce(
    (sum, goal) => sum + Number(goal.currentSavings || 0),
    0
  );
  const completedGoals = goals.filter(
    goal =>
      goal.targetAmount > 0 && goal.currentSavings / goal.targetAmount >= 1
  ).length;
  const activeGoals = goals.length - completedGoals;
  const overallProgress =
    totalTarget > 0 ? (totalReported / totalTarget) * 100 : 0;

  const metrics = [
    { label: 'Total Goals', value: goals.length },
    { label: 'Active', value: activeGoals },
    { label: 'Completed', value: completedGoals },
    {
      label: 'Total Manually Reported',
      value: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR',
      }).format(totalReported),
    },
    {
      label: 'Overall Progress',
      value: `${Math.round(overallProgress)}%`,
    },
  ];

  metrics.forEach(metric => {
    const metricDiv = document.createElement('div');
    metricDiv.style.textAlign = 'center';

    const value = document.createElement('div');
    value.textContent = metric.value;
    value.style.fontSize = '1.5rem';
    value.style.fontWeight = '600';
    value.style.color = COLORS.PRIMARY;

    const label = document.createElement('div');
    label.textContent = metric.label;
    label.style.fontSize = '0.85rem';
    label.style.color = COLORS.TEXT_MUTED;

    metricDiv.appendChild(value);
    metricDiv.appendChild(label);
    card.appendChild(metricDiv);
  });

  return card;
}
