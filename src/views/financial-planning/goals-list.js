import { createEnhancedEmptyState } from '../../utils/enhanced-empty-states.js';
import { COLORS, SPACING } from '../../utils/constants.js';
import { createGoalProgressChart } from '../../utils/financial-planning-charts.js';
import { safeParseDate } from '../../utils/financial-planning-helpers.js';
import { refreshChart } from '../../utils/chart-refresh-helper.js';
import { formatDateForDisplay } from '../../utils/date-utils.js';
import { StorageService } from '../../core/storage.js';
import { showErrorToast } from '../../utils/toast-notifications.js';
import { openConfirmDialog } from '../../utils/confirm-dialog-loader.js';
import { createGoalsSummaryCard } from './goals-summary.js';

/**
 * Create the goals list and its CRUD handlers.
 */
export function createGoalsList(
  chartRenderer,
  activeCharts,
  section,
  updateGoalInsights
) {
  const goalsList = document.createElement('div');
  goalsList.className = 'goal-list';
  goalsList.style.marginTop = SPACING.MD;

  async function refreshGoalsList() {
    goalsList.innerHTML = '';
    let items;
    try {
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
          warningBadge.style.color = 'white';
          warningBadge.style.fontSize = '0.7rem';
          warningBadge.style.padding = `${SPACING.XXS} ${SPACING.XS}`;
          warningBadge.style.borderRadius = 'var(--radius-sm)';
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
        const fundingNote = document.createElement('div');
        fundingNote.className = 'goal-funding-note';
        fundingNote.textContent =
          'Manual balance; not linked to account balances or transactions.';
        fundingNote.style.fontSize = '0.75rem';
        fundingNote.style.color = COLORS.TEXT_MUTED;
        left.appendChild(fundingNote);

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

        const progressContainer = document.createElement('div');
        progressContainer.style.width = '100%';
        progressContainer.style.marginTop = SPACING.XS;

        const progHeader = document.createElement('div');
        progHeader.style.display = 'flex';
        progHeader.style.justifyContent = 'space-between';
        progHeader.style.fontSize = '0.8rem';
        progHeader.style.marginBottom = SPACING.XS;

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
        progBg.style.height = SPACING.SM;
        progBg.style.background = 'var(--color-border)';
        progBg.style.borderRadius = 'var(--radius-sm)';
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

        editBtn.addEventListener('click', () => {
          if (li._editing) return;
          li._editing = true;
          left.style.display = 'none';
          actions.style.display = 'none';

          const form = document.createElement('div');
          form.style.display = 'flex';
          form.style.gap = SPACING.SM;
          form.style.flexWrap = 'wrap';
          form.style.width = '100%';

          const createField = (labelText, input, sizeStyle) => {
            const wrapper = document.createElement('label');
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.gap = SPACING.XS;
            wrapper.style.fontSize = '0.75rem';
            wrapper.style.color = COLORS.TEXT_MUTED;
            wrapper.style.whiteSpace = 'nowrap';
            Object.assign(wrapper.style, sizeStyle);

            const label = document.createElement('span');
            label.textContent = labelText;
            input.style.flex = '1';
            input.style.minWidth = '0';
            wrapper.appendChild(label);
            wrapper.appendChild(input);
            return wrapper;
          };

          const nameFld = document.createElement('input');
          nameFld.id = `edit-goal-name-${goal.id}`;
          nameFld.name = 'goalName';
          nameFld.value = goal.name;
          nameFld.setAttribute('aria-label', 'Goal name');

          const targetFld = document.createElement('input');
          targetFld.type = 'number';
          targetFld.id = `edit-goal-target-${goal.id}`;
          targetFld.name = 'goalTarget';
          targetFld.value = goal.targetAmount;
          targetFld.setAttribute('aria-label', 'Target amount');

          const dateFld = document.createElement('input');
          dateFld.type = 'date';
          dateFld.id = `edit-goal-date-${goal.id}`;
          dateFld.name = 'goalDate';
          dateFld.setAttribute('aria-label', 'Target date');
          dateFld.value = safeParseDate(goal.targetDate);

          const currentFld = document.createElement('input');
          currentFld.type = 'number';
          currentFld.id = `edit-goal-current-${goal.id}`;
          currentFld.name = 'goalCurrent';
          currentFld.value = goal.currentSavings;
          currentFld.setAttribute(
            'aria-label',
            'Manually reported current balance'
          );

          const saveBtn = document.createElement('button');
          saveBtn.textContent = 'Save';
          saveBtn.className = 'btn btn-primary';

          const cancelBtn = document.createElement('button');
          cancelBtn.textContent = 'Cancel';
          cancelBtn.className = 'btn btn-ghost';

          form.appendChild(
            createField('Name', nameFld, {
              flex: '1 1 160px',
              minWidth: '160px',
            })
          );
          form.appendChild(
            createField('Target', targetFld, {
              flex: '0 0 130px',
              minWidth: '120px',
            })
          );
          form.appendChild(
            createField('Date', dateFld, {
              flex: '0 0 170px',
              minWidth: '150px',
            })
          );
          form.appendChild(
            createField('Manual balance', currentFld, {
              flex: '0 0 130px',
              minWidth: '120px',
            })
          );
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

              StorageService.updateGoal(goal.id, updates);
              const updatedGoals = StorageService.getGoals();
              await refreshChart({
                createChartFn: createGoalProgressChart,
                chartRenderer,
                data: updatedGoals,
                section,
                chartType: 'goal-progress',
                activeCharts,
              });

              const currentSummary = section.querySelector(
                '.goals-summary-card'
              );
              if (currentSummary) {
                currentSummary.replaceWith(
                  createGoalsSummaryCard(updatedGoals)
                );
              }
              updateGoalInsights(updatedGoals);
              cleanupEdit();
              refreshGoalsList();
            } catch (err) {
              console.error('Failed to update goal', err);
              showErrorToast('Failed to update goal. Please try again.');
            }
          });
        });

        delBtn.addEventListener('click', () => {
          openConfirmDialog({
            title: 'Delete Goal',
            message: `Are you sure you want to delete the goal "${goal.name}"? This action cannot be undone.`,
            confirmText: 'Delete',
            variant: 'danger',
            onConfirm: async () => {
              try {
                await StorageService.deleteGoal(goal.id);
                const updatedGoals = (await StorageService.getGoals()) || [];
                const existingChart = section.querySelector(
                  '[data-chart-type="goal-progress"]'
                );
                if (updatedGoals.length > 0) {
                  if (existingChart) {
                    await refreshChart({
                      createChartFn: createGoalProgressChart,
                      chartRenderer,
                      data: updatedGoals,
                      section,
                      chartType: 'goal-progress',
                      activeCharts,
                    });
                  } else {
                    const { section: newChartSection, chart } =
                      await createGoalProgressChart(
                        chartRenderer,
                        updatedGoals
                      );
                    newChartSection.classList.add('goals-progress-chart');
                    const summary = section.querySelector(
                      '.goals-summary-card'
                    );
                    if (summary) {
                      section.insertBefore(newChartSection, summary);
                    } else {
                      section.appendChild(newChartSection);
                    }
                    activeCharts.set('goal-progress', chart);
                  }
                } else if (existingChart) {
                  const existingChartInstance =
                    activeCharts.get('goal-progress');
                  if (existingChartInstance) existingChartInstance.destroy();
                  existingChart.remove();
                  activeCharts.delete('goal-progress');
                }

                const currentSummary = section.querySelector(
                  '.goals-summary-card'
                );
                if (currentSummary) {
                  currentSummary.replaceWith(
                    createGoalsSummaryCard(updatedGoals)
                  );
                }
                updateGoalInsights(updatedGoals);
                await refreshGoalsList();
              } catch (err) {
                console.error('Failed to delete goal', err);
                showErrorToast('Failed to delete goal. Please try again.');
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

  return { goalsList, refreshGoalsList };
}
