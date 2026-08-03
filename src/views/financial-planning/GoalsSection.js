/**
 * Goals Section - Long-term Planning
 *
 * Extracted from FinancialPlanningView.js for better maintainability.
 * Displays financial goals with CRUD operations and progress tracking.
 *
 * Responsibilities:
 * - Goal progress chart integration
 * - Goal creation and management
 * - Goal editing and deletion
 * - Progress tracking display
 */

import {
  createEnhancedEmptyState,
  getProgressiveUnlockMessage,
} from '../../utils/enhanced-empty-states.js';
import { COLORS, SPACING, FONT_SIZES } from '../../utils/constants.js';
import { createGoalProgressChart } from '../../utils/financial-planning-charts.js';
import {
  createSectionContainer,
  createPlaceholder,
  createUsageNote,
  safeParseDate,
} from '../../utils/financial-planning-helpers.js';
import { refreshChart } from '../../utils/chart-refresh-helper.js';
import { formatDateForDisplay } from '../../utils/date-utils.js';
import { ForecastEngine } from '../../core/forecast-engine.js';
import { SavingsGoalsService } from '../../core/savings-goals-service.js';

/**
 * Create a goal connection section showing forecast vs goal progress
 */
function createGoalConnectionSection(goals, forecasts, currentBalance) {
  // Filter to active goals with targets
  const activeGoals = goals.filter(g => g.targetAmount > 0 && !g.progress?.isCompleted);
  if (activeGoals.length === 0) return null;

  const container = document.createElement('div');
  container.className = 'goal-connection-section';
  container.style.background = COLORS.SURFACE;
  container.style.border = `1px solid ${COLORS.BORDER}`;
  container.style.borderRadius = 'var(--radius-lg)';
  container.style.padding = SPACING.LG;
  container.style.marginBottom = SPACING.LG;

  const title = document.createElement('h3');
  title.textContent = 'Goal Progress';
  title.style.margin = '0';
  title.style.marginBottom = SPACING.MD;
  title.style.fontSize = '1.125rem';
  title.style.fontWeight = '600';
  title.style.color = COLORS.TEXT_MAIN;
  container.appendChild(title);

  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))';
  grid.style.gap = SPACING.MD;

  activeGoals.forEach(goal => {
    // Calculate projected balance at goal target date
    const goalDate = new Date(goal.targetDate);
    const projectedBalanceAtGoal = forecasts.reduce((balance, forecast) => {
      if (forecast.period <= goalDate) {
        return balance + forecast.predictedAmount - (forecasts.find(f => f.period === forecast.period)?.predictedAmount || 0);
      }
      return balance;
    }, currentBalance);

    // Use goalComparison from the first forecast if available
    const firstForecast = forecasts[0];
    const goalComparison = firstForecast?.goalComparison;

    let statusHtml = '';
    let statusColor = COLORS.TEXT_MUTED;

    if (goalComparison && goalComparison.goalId === goal.id) {
      const { status, statusMessage, shortfall } = goalComparison;
      const goalProjectedBalance = projectedBalanceAtGoal; // Use calculated value
      statusColor = status === 'on_track' ? COLORS.SUCCESS : status === 'at_risk' ? COLORS.WARNING : COLORS.ERROR;

      if (status === 'on_track') {
        statusHtml = `
          <div style="color: ${COLORS.SUCCESS}; font-weight: 600;">✓ On Track</div>
          <div style="font-size: 0.875rem; margin-top: 4px;">${statusMessage}</div>
          <div style="font-size: 0.75rem; color: ${COLORS.TEXT_MUTED}; margin-top: 8px;">
            Projected: €${goalProjectedBalance.toFixed(0)} / Target: €${goal.targetAmount}
          </div>
        `;
      } else if (status === 'at_risk') {
        statusHtml = `
          <div style="color: ${COLORS.WARNING}; font-weight: 600;">⚠️ Needs Attention</div>
          <div style="font-size: 0.875rem; margin-top: 4px;">${statusMessage}</div>
          <div style="font-size: 0.75rem; color: ${COLORS.TEXT_MUTED}; margin-top: 8px;">
            Shortfall: €${shortfall.toFixed(0)} by ${goalDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </div>
        `;
      } else {
        statusHtml = `
          <div style="color: ${COLORS.ERROR}; font-weight: 600;">⚠️ Off Track</div>
          <div style="font-size: 0.875rem; margin-top: 4px;">${statusMessage}</div>
          <div style="font-size: 0.75rem; color: ${COLORS.TEXT_MUTED}; margin-top: 8px;">
            Shortfall: €${shortfall.toFixed(0)}
          </div>
        `;
      }
    } else {
      // Fallback calculation
      const remaining = goal.targetAmount - goal.progress?.currentAmount;
      const monthsToGoal = goal.progress?.estimatedMonthsToComplete;

      if (monthsToGoal && monthsToGoal <= 12) {
        statusHtml = `
          <div style="color: ${COLORS.WARNING}; font-weight: 600;">Track Progress</div>
          <div style="font-size: 0.875rem; margin-top: 4px;">€${remaining.toFixed(0)} remaining</div>
          <div style="font-size: 0.75rem; color: ${COLORS.TEXT_MUTED}; margin-top: 8px;">
            ${monthsToGoal} months at current rate
          </div>
        `;
      } else {
        statusHtml = `
          <div style="color: ${COLORS.TEXT_MUTED}; font-weight: 600;">📍 ${goal.progress?.percentage?.toFixed(0) || 0}% Complete</div>
          <div style="font-size: 0.875rem; margin-top: 4px;">€${goal.progress?.currentAmount?.toFixed(0) || 0} saved</div>
        `;
      }
    }

    const goalCard = document.createElement('div');
    goalCard.className = 'goal-connection-card';
    goalCard.style.background = 'var(--color-surface-alt)';
    goalCard.style.borderRadius = 'var(--radius-md)';
    goalCard.style.padding = SPACING.MD;
    goalCard.style.borderLeft = `4px solid ${statusColor}`;

    goalCard.innerHTML = `
      <div style="font-weight: 600; margin-bottom: ${SPACING.SM};">${goal.name}</div>
      <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: ${SPACING.SM};">
        Target: €${goal.targetAmount.toLocaleString()} by ${goalDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </div>
      ${statusHtml}
    `;

    grid.appendChild(goalCard);
  });

  container.appendChild(grid);
  return container;
}

/**
 * Create goal form controls
 */
function createGoalFormControls(chartRenderer, activeCharts, section) {
  const goalControls = document.createElement('div');
  goalControls.style.display = 'flex';
  goalControls.style.gap = SPACING.SM;
  goalControls.style.alignItems = 'center';
  goalControls.style.flexWrap = 'wrap';
  goalControls.style.marginTop = SPACING.MD;

  const addGoalBtn = document.createElement('button');
  addGoalBtn.textContent = 'Add Goal';
  addGoalBtn.className = 'btn btn-primary add-goal-btn';

  const goalForm = document.createElement('div');
  goalForm.className = 'goal-form';
  goalForm.style.display = 'none';
  goalForm.style.gap = SPACING.SM;
  goalForm.style.marginTop = SPACING.SM;

  const goalName = document.createElement('input');
  goalName.id = 'goal-name';
  goalName.name = 'goalName';
  goalName.placeholder = 'Goal name';
  goalName.setAttribute('aria-label', 'Goal name');

  const goalTarget = document.createElement('input');
  goalTarget.id = 'goal-target';
  goalTarget.name = 'goalTarget';
  goalTarget.type = 'number';
  goalTarget.placeholder = 'Target amount';
  goalTarget.setAttribute('aria-label', 'Target amount');

  const goalDate = document.createElement('input');
  goalDate.id = 'goal-date';
  goalDate.name = 'goalDate';
  goalDate.type = 'date';
  goalDate.setAttribute('aria-label', 'Target date');

  const goalCurrent = document.createElement('input');
  goalCurrent.id = 'goal-current';
  goalCurrent.name = 'goalCurrent';
  goalCurrent.type = 'number';
  goalCurrent.placeholder = 'Current savings';
  goalCurrent.setAttribute('aria-label', 'Current savings');

  const saveGoalBtn = document.createElement('button');
  saveGoalBtn.textContent = 'Save Goal';
  saveGoalBtn.className = 'btn btn-primary btn-save';

  const cancelGoalBtn = document.createElement('button');
  cancelGoalBtn.textContent = 'Cancel';
  cancelGoalBtn.className = 'btn btn-ghost btn-cancel';
  cancelGoalBtn.addEventListener('click', () => {
    goalForm.style.display = 'none';
    goalName.value = '';
    goalTarget.value = '';
    goalDate.value = '';
    goalCurrent.value = '';
    nameError.style.display = 'none';
    dateError.style.display = 'none';
    currentError.style.display = 'none';
  });

  const nameError = document.createElement('div');
  nameError.className = 'error';
  nameError.setAttribute('name', 'name');
  nameError.style.color = COLORS.ERROR;
  nameError.style.fontSize = '0.8rem';
  nameError.style.display = 'none';

  const currentError = document.createElement('div');
  currentError.className = 'error';
  currentError.setAttribute('name', 'current');
  currentError.style.color = COLORS.ERROR;
  currentError.style.fontSize = '0.8rem';
  currentError.style.display = 'none';

  const dateError = document.createElement('div');
  dateError.className = 'error';
  dateError.setAttribute('name', 'deadline');
  dateError.style.color = COLORS.ERROR;
  dateError.style.fontSize = '0.8rem';
  dateError.style.display = 'none';

  goalForm.appendChild(goalName);
  goalForm.appendChild(nameError);
  goalForm.appendChild(goalTarget);
  goalForm.appendChild(goalDate);
  goalForm.appendChild(dateError);
  goalForm.appendChild(goalCurrent);
  goalForm.appendChild(currentError);
  goalForm.appendChild(saveGoalBtn);
  goalForm.appendChild(cancelGoalBtn);

  addGoalBtn.addEventListener('click', () => {
    goalForm.style.display =
      goalForm.style.display === 'none' ? 'flex' : 'none';
    goalForm.style.flexWrap = 'wrap';
  });

  saveGoalBtn.addEventListener('click', async () => {
    const name = goalName.value.trim();
    const target = Number(goalTarget.value) || 0;
    const tdate = goalDate.value ? new Date(goalDate.value) : null;
    const current = Number(goalCurrent.value) || 0;

    // Basic validation with improved messages
    let valid = true;
    nameError.style.display = 'none';
    currentError.style.display = 'none';
    dateError.style.display = 'none';

    if (!name) {
      nameError.textContent =
        'Goal name is required (e.g., "Emergency Fund", "Vacation")';
      nameError.style.display = 'block';
      valid = false;
    }
    if (!(target > 0)) {
      currentError.textContent = 'Target amount must be greater than 0';
      currentError.style.display = 'block';
      valid = false;
    }
    if (!tdate || isNaN(tdate.getTime())) {
      dateError.textContent = 'Please choose a valid target date';
      dateError.style.display = 'block';
      valid = false;
    } else if (tdate < new Date(new Date().setHours(0, 0, 0, 0))) {
      dateError.textContent = 'Target date must be in the future';
      dateError.style.display = 'block';
      valid = false;
    }

    // Validate current savings
    if (current < 0) {
      currentError.textContent = 'Current savings cannot be negative';
      currentError.style.display = 'block';
      valid = false;
    }

    if (!valid) return;

    try {
      // Import StorageService dynamically
      const { StorageService } = await import('../../core/storage.js');
      StorageService.createGoal(name, target, tdate, current, {});

      // Refresh goals chart using helper
      const updatedGoals = StorageService.getGoals();
      await refreshChart({
        createChartFn: createGoalProgressChart,
        chartRenderer,
        data: updatedGoals,
        section,
        chartType: 'goal-progress',
        activeCharts,
      });

      goalForm.style.display = 'none';
      goalName.value = '';
      goalTarget.value = '';
      goalDate.value = '';
      goalCurrent.value = '';

      // Clear any lingering errors
      nameError.style.display = 'none';
      currentError.style.display = 'none';
      dateError.style.display = 'none';
    } catch (err) {
      console.error('Failed to save goal', err);
    }
  });

  // Real-time validation on blur
  goalName.addEventListener('blur', () => {
    if (!goalName.value.trim()) {
      nameError.textContent =
        'Goal name is required (e.g., "Emergency Fund", "Vacation")';
      nameError.style.display = 'block';
    } else {
      nameError.style.display = 'none';
    }
  });

  goalTarget.addEventListener('blur', () => {
    const target = Number(goalTarget.value) || 0;
    if (!(target > 0)) {
      currentError.textContent = 'Target amount must be greater than 0';
      currentError.style.display = 'block';
    } else {
      currentError.style.display = 'none';
      dateError.style.display = 'block';
    }
  });

  goalCurrent.addEventListener('blur', () => {
    const current = Number(goalCurrent.value) || 0;
    if (current < 0) {
      currentError.textContent = 'Current savings cannot be negative';
      currentError.style.display = 'block';
    }
  });

  goalControls.appendChild(addGoalBtn);
  goalControls.appendChild(goalForm);

  return goalControls;
}

/**
 * Create goals list with CRUD operations
 */
function createGoalsList(chartRenderer, activeCharts, section) {
  const goalsList = document.createElement('div');
  goalsList.className = 'goal-list';
  goalsList.style.marginTop = SPACING.MD;

  async function refreshGoalsList() {
    // Security: Clearing list content, no user input involved
    goalsList.innerHTML = '';
    let items;
    try {
      // Import StorageService dynamically
      const { StorageService } = await import('../../core/storage.js');
      items = StorageService.getGoals() || [];

      if (!items.length) {
        const empty = createEnhancedEmptyState('no-data', {
          showTips: false,
        });
        goalsList.appendChild(empty);
        return;
      }

      const ul = document.createElement('ul');
      ul.style.listStyle = 'none';
      ul.style.padding = '0';
      ul.style.margin = '0';
      ul.style.display = 'grid';
      ul.style.gap = SPACING.SM;

      items.forEach(goal => {
        const progress =
          goal.targetAmount > 0
            ? (goal.currentSavings / goal.targetAmount) * 100
            : 0;
        const isCompleted = progress >= 100;
        const targetDate = new Date(goal.targetDate);
        const isOverdue = !isCompleted && targetDate < new Date();

        const li = document.createElement('li');
        li.className = `goal-item ${isCompleted ? 'completed' : 'in-progress'} ${isOverdue ? 'overdue' : ''}`;
        li.style.display = 'flex';
        li.style.flexDirection = 'column';
        li.style.gap = SPACING.SM;
        li.style.padding = SPACING.MD;
        li.style.background = COLORS.SURFACE;
        li.style.borderRadius = 'var(--radius-md)';
        li.style.border = `1px solid ${COLORS.BORDER}`;

        const topRow = document.createElement('div');
        topRow.style.display = 'flex';
        topRow.style.justifyContent = 'space-between';
        topRow.style.alignItems = 'center';

        const left = document.createElement('div');
        left.style.display = 'flex';
        left.style.flexDirection = 'column';

        const titleContainer = document.createElement('div');
        titleContainer.style.display = 'flex';
        titleContainer.style.alignItems = 'center';
        titleContainer.style.gap = SPACING.SM;

        const title = document.createElement('div');
        title.className = 'goal-name';
        title.textContent = goal.name;
        title.style.fontWeight = '600';
        titleContainer.appendChild(title);

        if (isOverdue) {
          const warningBadge = document.createElement('span');
          warningBadge.className = 'warning-badge';
          warningBadge.textContent = 'Overdue';
          warningBadge.style.background = COLORS.ERROR;
          warningBadge.style.color = '#fff';
          warningBadge.style.fontSize = '0.7rem';
          warningBadge.style.padding = '2px 6px';
          warningBadge.style.borderRadius = '4px';
          titleContainer.appendChild(warningBadge);
        }

        const meta = document.createElement('div');
        meta.className = 'goal-meta';
        meta.style.fontSize = '0.9rem';
        meta.style.color = COLORS.TEXT_MUTED;

        const currentFormatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'EUR',
        }).format(goal.currentSavings);
        const targetFormatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'EUR',
        }).format(goal.targetAmount);

        // Security: Use safe DOM manipulation instead of innerHTML to prevent XSS
        meta.textContent = '';
        const currentSpan = document.createElement('span');
        currentSpan.className = 'currency-value';
        currentSpan.textContent = currentFormatted;
        meta.appendChild(currentSpan);
        meta.appendChild(document.createTextNode(' of '));
        const targetSpan = document.createElement('span');
        targetSpan.className = 'currency-value';
        targetSpan.textContent = targetFormatted;
        meta.appendChild(targetSpan);
        meta.appendChild(
          document.createTextNode(` by ${formatDateForDisplay(targetDate)}`)
        );

        left.appendChild(titleContainer);
        left.appendChild(meta);

        // Calculate time remaining
        const diffTime = targetDate - new Date();
        const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
        if (!isCompleted && diffMonths > 0) {
          const timeRem = document.createElement('div');
          timeRem.className = 'time-remaining';
          timeRem.style.fontSize = '0.8rem';
          timeRem.style.color = COLORS.PRIMARY;
          timeRem.textContent = `${diffMonths} months remaining`;
          left.appendChild(timeRem);

          const needed = (goal.targetAmount - goal.currentSavings) / diffMonths;
          const monthlyNeeded = document.createElement('div');
          monthlyNeeded.className = 'monthly-savings-needed';
          monthlyNeeded.style.fontSize = '0.8rem';
          monthlyNeeded.style.fontWeight = '500';
          // Security: Use safe DOM manipulation instead of innerHTML
          monthlyNeeded.textContent = 'Need ';
          const neededSpan = document.createElement('span');
          neededSpan.className = 'currency-value';
          neededSpan.textContent = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'EUR',
          }).format(needed);
          monthlyNeeded.appendChild(neededSpan);
          monthlyNeeded.appendChild(document.createTextNode(' / month'));
          left.appendChild(monthlyNeeded);
        }

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = SPACING.SM;

        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit';
        editBtn.className = 'btn btn-ghost edit-goal';

        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.className = 'btn btn-ghost delete-goal';

        actions.appendChild(editBtn);
        actions.appendChild(delBtn);

        topRow.appendChild(left);
        topRow.appendChild(actions);

        li.appendChild(topRow);

        // Progress bar and percentage
        const progressContainer = document.createElement('div');
        progressContainer.style.width = '100%';
        progressContainer.style.marginTop = SPACING.XS;

        const progHeader = document.createElement('div');
        progHeader.style.display = 'flex';
        progHeader.style.justifyContent = 'space-between';
        progHeader.style.fontSize = '0.8rem';
        progHeader.style.marginBottom = '4px';

        const progLabel = document.createElement('span');
        progLabel.textContent = 'Progress';
        const progPct = document.createElement('span');
        progPct.className = 'progress-percentage';
        progPct.textContent = `${Math.min(100, progress).toFixed(1)}%`;

        progHeader.appendChild(progLabel);
        progHeader.appendChild(progPct);
        progressContainer.appendChild(progHeader);

        const progBg = document.createElement('div');
        progBg.className = 'progress-bar-bg';
        progBg.style.height = '8px';
        progBg.style.background = '#eee';
        progBg.style.borderRadius = '4px';
        progBg.style.overflow = 'hidden';

        const progFill = document.createElement('div');
        progFill.className = 'progress-bar';
        progFill.style.height = '100%';
        progFill.style.width = `${Math.min(100, progress)}%`;
        progFill.style.background = isCompleted
          ? COLORS.SUCCESS
          : isOverdue
            ? COLORS.ERROR
            : COLORS.PRIMARY;

        progBg.appendChild(progFill);
        progressContainer.appendChild(progBg);
        li.appendChild(progressContainer);

        ul.appendChild(li);
        // Edit handler
        editBtn.addEventListener('click', () => {
          if (li._editing) return;
          li._editing = true;

          // Hide view mode elements
          left.style.display = 'none';
          actions.style.display = 'none';

          const form = document.createElement('div');
          form.style.display = 'flex';
          form.style.gap = SPACING.SM;
          form.style.flexWrap = 'wrap';
          form.style.width = '100%';

          const nameFld = document.createElement('input');
          nameFld.value = goal.name;
          nameFld.style.minWidth = '160px';
          nameFld.style.flex = '1 1 160px';

          const targetFld = document.createElement('input');
          targetFld.type = 'number';
          targetFld.value = goal.targetAmount;
          targetFld.style.flex = '0 0 120px';
          targetFld.style.minWidth = '100px';

          const dateFld = document.createElement('input');
          dateFld.type = 'date';
          dateFld.style.flex = '0 0 160px';
          dateFld.style.minWidth = '140px';
          // Use helper to safely parse targetDate
          dateFld.value = safeParseDate(goal.targetDate);

          const currentFld = document.createElement('input');
          currentFld.type = 'number';
          currentFld.value = goal.currentSavings;
          currentFld.style.flex = '0 0 120px';
          currentFld.style.minWidth = '100px';

          const saveBtn = document.createElement('button');
          saveBtn.textContent = 'Save';
          saveBtn.className = 'btn btn-primary';

          const cancelBtn = document.createElement('button');
          cancelBtn.textContent = 'Cancel';
          cancelBtn.className = 'btn btn-ghost';

          form.appendChild(nameFld);
          form.appendChild(targetFld);
          form.appendChild(dateFld);
          form.appendChild(currentFld);
          form.appendChild(saveBtn);
          form.appendChild(cancelBtn);

          li.appendChild(form);

          const cleanupEdit = () => {
            li._editing = false;
            form.remove();
            left.style.display = 'flex';
            actions.style.display = 'flex';
          };

          cancelBtn.addEventListener('click', cleanupEdit);

          saveBtn.addEventListener('click', async () => {
            try {
              const updates = {
                name: nameFld.value.trim(),
                targetAmount: Number(targetFld.value) || 0,
                targetDate: dateFld.value
                  ? new Date(dateFld.value)
                  : new Date(goal.targetDate),
                currentSavings: Number(currentFld.value) || 0,
              };

              // Import StorageService dynamically
              const { StorageService } = await import('../../core/storage.js');
              StorageService.updateGoal(goal.id, updates);

              // Refresh chart using helper
              const updatedGoals = StorageService.getGoals();
              await refreshChart({
                createChartFn: createGoalProgressChart,
                chartRenderer,
                data: updatedGoals,
                section,
                chartType: 'goal-progress',
                activeCharts,
              });

              cleanupEdit();
              refreshGoalsList();
            } catch (err) {
              console.error('Failed to update goal', err);
            }
          });
        });

        // Delete handler
        delBtn.addEventListener('click', async () => {
          // Import ConfirmDialog dynamically
          const { ConfirmDialog } =
            await import('../../components/ConfirmDialog.js');

          ConfirmDialog({
            title: 'Delete Goal',
            message: `Are you sure you want to delete the goal "${goal.name}"? This action cannot be undone.`,
            confirmText: 'Delete',
            variant: 'danger',
            onConfirm: async () => {
              try {
                // Import StorageService dynamically
                const { StorageService } =
                  await import('../../core/storage.js');
                await StorageService.deleteGoal(goal.id);

                // Refresh chart using helper
                const updatedGoals = await StorageService.getGoals();
                await refreshChart({
                  createChartFn: createGoalProgressChart,
                  chartRenderer,
                  data: updatedGoals,
                  section,
                  chartType: 'goal-progress',
                  activeCharts,
                });

                // Refresh the list
                await refreshGoalsList();
              } catch (err) {
                // Show error notification to user and log once
                const errorDiv = document.createElement('div');
                errorDiv.style.cssText = `
                  position: fixed;
                  top: 20px;
                  right: 20px;
                  background: #ef4444;
                  color: white;
                  padding: var(--spacing-sm);
                  border-radius: var(--radius-sm);
                  z-index: 10000;
                  font-size: var(--font-size-sm);
                  max-width: 300px;
                `;
                console.error('Failed to delete goal:', err);
                errorDiv.textContent =
                  'Failed to delete goal. Please try again.';
                document.body.appendChild(errorDiv);
                setTimeout(() => errorDiv.remove(), 5000);
              }
            },
          });
        });
      });

      goalsList.appendChild(ul);
    } catch (err) {
      console.warn('Error loading goals for list:', err);
      const error = createEnhancedEmptyState('error', {
        onAction: () => location.reload(),
      });
      goalsList.appendChild(error);
    }
  }

  // Return both the element and a way to populate it
  return { goalsList, refreshGoalsList };
}

/**
 * Create summary card with aggregate metrics
 * @param {Array} goals - Array of goal objects
 * @returns {HTMLElement} Summary card element
 */
function createGoalsSummaryCard(goals) {
  const card = document.createElement('div');
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
    (sum, g) => sum + Number(g.targetAmount || 0),
    0
  );
  const totalSaved = goals.reduce(
    (sum, g) => sum + Number(g.currentSavings || 0),
    0
  );
  const completedGoals = goals.filter(g => {
    const progress =
      g.targetAmount > 0 ? (g.currentSavings / g.targetAmount) * 100 : 0;
    return progress >= 100;
  }).length;
  const activeGoals = goals.length - completedGoals;
  const overallProgress =
    totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  const metrics = [
    { label: 'Total Goals', value: goals.length },
    { label: 'Active', value: activeGoals },
    { label: 'Completed', value: completedGoals },
    {
      label: 'Total Saved',
      value: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR',
      }).format(totalSaved),
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

/**
 * Goals Section Component
 * @param {Object} chartRenderer - Chart renderer service instance
 * @param {Map} activeCharts - Map to track active chart instances
 * @param {Object} planningData - Financial planning data including transactions
 * @param {Object} forecastEngine - Forecast engine service instance
 * @returns {HTMLElement} DOM element containing goals section content
 */
export const GoalsSection = async (
  chartRenderer,
  activeCharts,
  planningData,
  forecastEngine
) => {
  const section = createSectionContainer('goals', 'Financial Goals', '🎯');
  section.className += ' goals-section';

  section.appendChild(
    createUsageNote(
      'Create and track goals (target amount, date, current savings). The planner calculates required monthly savings and progress.'
    )
  );

  // Progressive unlock message — connects advanced features to the core logging habit
  try {
    const { StorageService: SS } = await import('../../core/storage.js');
    const txCount = (SS.getAllTransactions() || []).length;
    const unlockMsg = getProgressiveUnlockMessage(txCount);
    if (unlockMsg) {
      const msg = document.createElement('div');
      msg.textContent = unlockMsg;
      msg.style.cssText = `font-size:${FONT_SIZES.SM};color:${COLORS.TEXT_MUTED};padding:${SPACING.SM} 0;text-align:center;`;
      section.appendChild(msg);
    }
  } catch {
    // Non-critical — silently fail
  }

  // Load goals from StorageService (Firebase handles offline automatically)
  let goalsFromStorage;
  try {
    // Import StorageService dynamically
    const { StorageService } = await import('../../core/storage.js');
    goalsFromStorage = StorageService.getGoals() || [];
  } catch (err) {
    console.warn('Error fetching goals from StorageService:', err);
    goalsFromStorage = [];
  }

  // Compute a projected goal suggestion from income vs expenses
  let projectedGoal = null;
  try {
    const { StorageService: SS } = await import('../../core/storage.js');
    const allTx = SS.getAllTransactions() || [];
    const income = allTx.filter(t => t.type === 'income' && !t.isGhost);
    const expenses = allTx.filter(
      t => (t.type === 'expense' || t.type === 'refund') && !t.isGhost
    );
    const totalIncome = income.reduce((s, t) => s + Math.abs(t.amount || 0), 0);
    const totalExpenses = expenses.reduce(
      (s, t) => s + Math.abs(t.amount || 0),
      0
    );
    const monthlySavings = Math.max(
      0,
      (totalIncome - totalExpenses) /
        Math.max(
          1,
          new Set(
            allTx
              .filter(t => !t.isGhost)
              .map(t => {
                const d = new Date(t.timestamp);
                return `${d.getFullYear()}-${d.getMonth()}`;
              })
          ).size
        )
    );
    const projectedAmount = Math.round(monthlySavings * 12);
    if (projectedAmount > 0) {
      projectedGoal = {
        title: 'Projected Savings Goal',
        description: `At your current rate, you could save ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(projectedAmount)} in 12 months.`,
        targetAmount: projectedAmount,
        monthlySavings: Math.round(monthlySavings),
      };
    }
  } catch (e) {
    console.warn('Failed to compute goal projection:', e);
  }

  const sampleGoals = projectedGoal
    ? [
        {
          id: 'projected',
          name: projectedGoal.title,
          targetAmount: projectedGoal.targetAmount,
          currentSavings: 0,
          targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      ]
    : [
        {
          id: '1',
          name: 'Emergency Fund',
          targetAmount: 10000,
          currentSavings: 7500,
          targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
        {
          id: '2',
          name: 'House Down Payment',
          targetAmount: 50000,
          currentSavings: 15000,
          targetDate: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000),
        },
        {
          id: '3',
          name: 'Vacation Fund',
          targetAmount: 5000,
          currentSavings: 2000,
          targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        },
      ];

  const hasRealGoals =
    Array.isArray(goalsFromStorage) && goalsFromStorage.length > 0;
  const goalsToRender = hasRealGoals ? goalsFromStorage : sampleGoals;

  // Create goal progress chart
  try {
    const { section: chartSection, chart } = await createGoalProgressChart(
      chartRenderer,
      goalsToRender,
      hasRealGoals ? {} : { title: 'Sample Goals (Demo)' }
    );
    chartSection.classList.add('goals-progress-chart'); // Add class for tests
    if (!hasRealGoals) {
      chartSection.style.opacity = '0.9';
    }
    section.appendChild(chartSection);
    activeCharts.set('goal-progress', chart);
  } catch (error) {
    console.error('Error creating goal progress chart:', error);
  }

  // Add goal connection section (forecast vs goal progress) if we have real goals and transaction data
  if (hasRealGoals && planningData && planningData.transactions && planningData.transactions.length > 0) {
    try {
      // Load active goals with progress data
      const activeGoals = await SavingsGoalsService.calculateGoalProgress(
        planningData.transactions || []
      );

      // Generate forecasts - pass first active goal for comparison (if any)
      const firstActiveGoal = activeGoals.find(g => g.targetAmount > 0 && !g.progress?.isCompleted);
      const goalOptions = firstActiveGoal
        ? {
            goalId: firstActiveGoal.id,
            goalTarget: {
              id: firstActiveGoal.id,
              name: firstActiveGoal.name,
              targetAmount: firstActiveGoal.targetAmount,
              targetDate: firstActiveGoal.targetDate,
            },
          }
        : {};

      const forecastEngineInstance = forecastEngine || new ForecastEngine();
      const incomeForecasts = forecastEngineInstance.generateIncomeForecasts(
        planningData.transactions,
        6,
        goalOptions
      );

      // Calculate current balance
      const currentBalance = planningData.transactions.reduce((balance, t) => {
        if (t.isGhost) return balance;
        return balance + (t.type === 'income' ? t.amount : -t.amount);
      }, 0);

      // Add goal connection section if goals exist
      if (activeGoals.length > 0) {
        const goalSection = createGoalConnectionSection(
          activeGoals,
          incomeForecasts,
          currentBalance
        );
        if (goalSection) {
          section.appendChild(goalSection);
        }
      }
    } catch (error) {
      console.warn('Could not load goal progress for goals section:', error);
    }
  }

  // Add summary card with aggregate metrics
  const summaryCard = createGoalsSummaryCard(goalsToRender);
  section.appendChild(summaryCard);

  // Add goal form controls
  const goalControls = createGoalFormControls(
    chartRenderer,
    activeCharts,
    section
  );
  section.appendChild(goalControls);

  // Add goals list
  const { goalsList, refreshGoalsList } = createGoalsList(
    chartRenderer,
    activeCharts,
    section
  );
  section.appendChild(goalsList);

  // Add insights
  const insights = document.createElement('div');
  insights.className = 'goal-insights';
  insights.style.marginTop = SPACING.MD;
  insights.style.padding = SPACING.MD;
  insights.style.background = COLORS.SURFACE;
  insights.style.borderRadius = 'var(--radius-md)';
  insights.style.border = `1px solid ${COLORS.BORDER}`;

  const behindSchedule = goalsToRender.filter(g => {
    const progress =
      g.targetAmount > 0 ? (g.currentSavings / g.targetAmount) * 100 : 0;
    const targetDate = new Date(g.targetDate);
    return (
      progress < 20 &&
      targetDate < new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
    );
  });

  // Build Goal Insights section using DOM creation (avoiding innerHTML)
  const h4 = document.createElement('h4');
  h4.textContent = 'Goal Insights';
  h4.style.marginTop = '0';

  const p = document.createElement('p');
  p.style.fontSize = '0.9rem';

  const strong = document.createElement('strong');
  strong.textContent = 'Recommendation:';

  if (behindSchedule.length > 0) {
    p.style.color = COLORS.ERROR;
    const recommendationText = document.createTextNode(
      ` You have ${behindSchedule.length.toString()} goals that may need more aggressive savings to stay on track.`
    );
    p.appendChild(strong);
    p.appendChild(recommendationText);
  } else {
    p.style.color = COLORS.SUCCESS;
    const recommendationText = document.createTextNode(
      ' Your goals look well-paced. Keep up the consistent saving!'
    );
    p.appendChild(strong);
    p.appendChild(recommendationText);
  }

  insights.appendChild(h4);
  insights.appendChild(p);
  section.appendChild(insights);

  // Add goal recommendations based on spending patterns
  try {
    const { StorageService } = await import('../../core/storage.js');
    const transactions = StorageService.getAllTransactions() || [];
    const recommendations =
      await SavingsGoalsService.getGoalRecommendations(transactions);

    if (recommendations.length > 0) {
      const recommendationsSection = document.createElement('div');
      recommendationsSection.className = 'goal-recommendations';
      recommendationsSection.style.marginTop = SPACING.MD;
      recommendationsSection.style.padding = SPACING.MD;
      recommendationsSection.style.background = COLORS.SURFACE;
      recommendationsSection.style.borderRadius = 'var(--radius-md)';
      recommendationsSection.style.border = `1px solid ${COLORS.BORDER}`;

      const recTitle = document.createElement('h4');
      recTitle.textContent = 'Recommended Goals';
      recTitle.style.marginTop = '0';
      recTitle.style.marginBottom = SPACING.SM;
      recommendationsSection.appendChild(recTitle);

      recommendations.slice(0, 3).forEach(rec => {
        const recCard = document.createElement('div');
        recCard.style.cssText = `
          background: ${COLORS.SURFACE};
          border: 1px solid ${COLORS.BORDER};
          border-radius: var(--radius-sm);
          padding: ${SPACING.SM};
          margin-bottom: ${SPACING.SM};
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: ${SPACING.SM};
        `;

        const content = document.createElement('div');
        content.style.flex = '1';

        const recTitleText = document.createElement('div');
        recTitleText.textContent = rec.title;
        recTitleText.style.fontWeight = '600';
        recTitleText.style.color = COLORS.TEXT_MAIN;
        content.appendChild(recTitleText);

        const recDesc = document.createElement('div');
        recDesc.textContent = rec.description;
        recDesc.style.fontSize = '0.85rem';
        recDesc.style.color = COLORS.TEXT_MUTED;
        recDesc.style.marginTop = '2px';
        content.appendChild(recDesc);

        const createBtn = document.createElement('button');
        createBtn.textContent = 'Create Goal';
        createBtn.className = 'btn btn-primary';
        createBtn.style.padding = `${SPACING.XS} ${SPACING.SM}`;
        createBtn.style.fontSize = '0.85rem';

        createBtn.addEventListener('click', async () => {
          try {
            const targetDate = new Date();
            targetDate.setFullYear(targetDate.getFullYear() + 1); // Default 1 year

            const { StorageService: SS } =
              await import('../../core/storage.js');
            SS.createGoal(rec.title, rec.target || 1000, targetDate, 0, {
              category: rec.category || 'General',
            });

            // Refresh the section
            const updatedGoals = SS.getGoals();
            await refreshChart({
              createChartFn: createGoalProgressChart,
              chartRenderer,
              data: updatedGoals,
              section,
              chartType: 'goal-progress',
              activeCharts,
            });
            await refreshGoalsList();

            // Update summary card
            const currentSummary =
              section.querySelector('.goals-summary-card') || summaryCard;
            const newSummaryCard = createGoalsSummaryCard(updatedGoals);
            if (currentSummary && currentSummary.parentNode) {
              currentSummary.parentNode.replaceChild(
                newSummaryCard,
                currentSummary
              );
            } else {
              section.replaceChild(newSummaryCard, currentSummary);
            }
          } catch (err) {
            console.error('Failed to create goal from recommendation:', err);
          }
        });

        recCard.appendChild(content);
        recCard.appendChild(createBtn);
        recommendationsSection.appendChild(recCard);
      });

      section.appendChild(recommendationsSection);
    }
  } catch (error) {
    console.warn('Failed to load goal recommendations:', error);
  }

  // Initial population of the list
  await refreshGoalsList();

  // Add placeholder only when goals are not managed yet
  if (!hasRealGoals) {
    const placeholder = createPlaceholder(
      'No Goals Yet',
      'Log more transactions to see what goals are realistic for you.',
      '🎯'
    );
    section.appendChild(placeholder);
  }

  return section;
};

// ...
