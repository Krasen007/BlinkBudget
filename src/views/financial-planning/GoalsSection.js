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

import { COLORS, SPACING } from '../../utils/constants.js';
import { createGoalProgressChart } from '../../utils/financial-planning-charts.js';
import {
  createSectionContainer,
  createPlaceholder,
  createUsageNote,
  safeParseDate,
} from '../../utils/financial-planning-helpers.js';
import { refreshChart } from '../../utils/chart-refresh-helper.js';
import { formatDateForDisplay } from '../../utils/date-utils.js';
import { offlineDataManager } from '../../core/offline-data-manager.js';

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
  goalForm.appendChild(goalName);
  goalForm.appendChild(nameError);
  goalForm.appendChild(goalTarget);
  goalForm.appendChild(currentError);
  goalForm.appendChild(dateError);
  goalForm.appendChild(goalCurrent);
  goalForm.appendChild(saveGoalBtn);

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

      // Cache the operation for offline sync
      if (!offlineDataManager.isOnline) {
        offlineDataManager.addToSyncQueue({
          type: 'saveGoal',
          data: {
            name,
            targetAmount: target,
            targetDate: tdate,
            currentSavings: current,
            options: {},
          },
        });
      }

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

      // Cache updated goals for offline access
      offlineDataManager.cachePlanningData('goals', {
        data: updatedGoals,
        timestamp: Date.now(),
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
    goalsList.innerHTML = '';
    let items = [];
    try {
      // Import StorageService dynamically
      const { StorageService } = await import('../../core/storage.js');
      items = StorageService.getGoals() || [];

      if (!items.length) {
        const empty = document.createElement('div');
        empty.textContent = 'No goals yet.';
        empty.style.color = COLORS.TEXT_MUTED;
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

        goalsList.appendChild(ul);
      });
    } catch (err) {
      console.warn('Error loading goals for list:', err);
      const empty = document.createElement('div');
      empty.textContent = 'Error loading goals.';
      empty.style.color = COLORS.ERROR;
      goalsList.appendChild(empty);
    }
  }

  // Return both the element and a way to populate it
  return { goalsList, refreshGoalsList };
}

/**
 * Goals Section Component
 * @param {Object} chartRenderer - Chart renderer service instance
 * @param {Map} activeCharts - Map to track active chart instances
 * @returns {HTMLElement} DOM element containing goals section content
 */
export const GoalsSection = async (chartRenderer, activeCharts) => {
  const section = createSectionContainer('goals', 'Financial Goals', '🎯');
  section.className += ' goals-section';

  section.appendChild(
    createUsageNote(
      'Create and track goals (target amount, date, current savings). The planner calculates required monthly savings and progress. Use scenarios to model different savings rates.'
    )
  );

  const isOffline = !offlineDataManager.isOnline;

  // Add offline indicators if needed
  if (isOffline) {
    section.appendChild(
      createPlaceholder(
        'Offline Mode',
        'Goal management is limited when offline. Changes will sync when you reconnect.',
        '📡'
      )
    );
  }

  // Try to load goals from cache first, then StorageService
  let goalsFromStorage = [];
  const cachedGoals = offlineDataManager.getCachedPlanningData('goals');

  if (isOffline && cachedGoals && cachedGoals.data) {
    // Use cache only when offline
    console.log('[GoalsSection] Using cached goals data');
    goalsFromStorage = cachedGoals.data;
  } else {
    try {
      // Import StorageService dynamically
      const { StorageService } = await import('../../core/storage.js');
      goalsFromStorage = StorageService.getGoals() || [];

      // Cache goals for offline access
      offlineDataManager.cachePlanningData('goals', {
        data: goalsFromStorage,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.warn('Error fetching goals from StorageService:', err);
      // Fallback to cache if StorageService fails
      goalsFromStorage = cachedGoals?.data || [];
    }
  }

  const sampleGoals = [
    {
      id: '1',
      name: 'Emergency Fund',
      targetAmount: 10000,
      currentSavings: 7500,
      targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    },
    {
      id: '2',
      name: 'House Down Payment',
      targetAmount: 50000,
      currentSavings: 15000,
      targetDate: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000), // 3 years from now
    },
    {
      id: '3',
      name: 'Vacation Fund',
      targetAmount: 5000,
      currentSavings: 2000,
      targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
    },
  ];

  const hasRealGoals =
    Array.isArray(goalsFromStorage) && goalsFromStorage.length > 0;
  const goalsToRender = hasRealGoals ? goalsFromStorage : sampleGoals;

  // Create goal progress chart
  try {
    const { section: chartSection, chart } = await createGoalProgressChart(
      chartRenderer,
      goalsToRender
    );
    chartSection.classList.add('goals-progress-chart'); // Add class for tests
    section.appendChild(chartSection);
    activeCharts.set('goal-progress', chart);
  } catch (error) {
    console.error('Error creating goal progress chart:', error);
  }

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

  if (behindSchedule.length > 0) {
    insights.innerHTML = `
      <h4 style="margin-top:0">Goal Insights</h4>
      <p style="font-size:0.9rem; color: ${COLORS.ERROR}"><strong>Recommendation:</strong> You have ${behindSchedule.length} goals that may need more aggressive savings to stay on track.</p>
    `;
  } else {
    insights.innerHTML = `
      <h4 style="margin-top:0">Goal Insights</h4>
      <p style="font-size:0.9rem; color: ${COLORS.SUCCESS}"><strong>Recommendation:</strong> Your goals look well-paced. Keep up the consistent saving!</p>
    `;
  }
  section.appendChild(insights);

  // Initial population of the list
  await refreshGoalsList();

  // Add placeholder only when goals are not managed yet
  if (!hasRealGoals) {
    const placeholder = createPlaceholder(
      'No Goals Yet',
      'Start planning your financial future by creating your first goal.',
      '🎯'
    );
    section.appendChild(placeholder);
  }

  return section;
};

// ...
