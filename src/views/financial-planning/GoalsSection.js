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
import { createSectionContainer, createPlaceholder, createUsageNote, safeParseDate } from '../../utils/financial-planning-helpers.js';
import { refreshChart } from '../../utils/chart-refresh-helper.js';
import { StorageService } from '../../core/storage.js';

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
    addGoalBtn.className = 'btn btn-primary';

    const goalForm = document.createElement('div');
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
    saveGoalBtn.className = 'btn btn-primary';

    goalForm.appendChild(goalName);
    goalForm.appendChild(goalTarget);
    goalForm.appendChild(goalDate);
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

        // Basic validation
        let valid = true;
        if (!name) {
            console.error('Goal name is required.');
            valid = false;
        }
        if (!(target > 0)) {
            console.error('Target amount must be greater than 0.');
            valid = false;
        }
        if (!tdate || isNaN(tdate.getTime())) {
            console.error('Please choose a valid target date.');
            valid = false;
        }
        if (!valid) return;

        try {
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
        } catch (err) {
            console.error('Failed to save goal', err);
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
    goalsList.className = 'goals-list';
    goalsList.style.marginTop = SPACING.MD;

    function refreshGoalsList() {
        goalsList.innerHTML = '';
        let items = [];
        try {
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
                const li = document.createElement('li');
                li.style.display = 'flex';
                li.style.justifyContent = 'space-between';
                li.style.alignItems = 'center';

                const left = document.createElement('div');
                left.style.display = 'flex';
                left.style.flexDirection = 'column';

                const title = document.createElement('div');
                title.textContent = `${goal.name}`;
                title.style.fontWeight = '600';

                const meta = document.createElement('div');
                meta.style.fontSize = '0.9rem';
                meta.style.color = COLORS.TEXT_MUTED;
                meta.textContent = `${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(goal.currentSavings)} of ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(goal.targetAmount)} by ${new Date(goal.targetDate).toLocaleDateString()}`;

                left.appendChild(title);
                left.appendChild(meta);

                const actions = document.createElement('div');
                actions.style.display = 'flex';
                actions.style.gap = SPACING.SM;

                const editBtn = document.createElement('button');
                editBtn.textContent = 'Edit';
                editBtn.className = 'btn btn-ghost';

                const delBtn = document.createElement('button');
                delBtn.textContent = 'Delete';
                delBtn.className = 'btn btn-ghost';

                actions.appendChild(editBtn);
                actions.appendChild(delBtn);

                li.appendChild(left);
                li.appendChild(actions);

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

    // Initial population
    refreshGoalsList();

    return goalsList;
}

/**
 * Goals Section Component
 * @param {Object} chartRenderer - Chart renderer service instance
 * @param {Map} activeCharts - Map to track active chart instances
 * @returns {HTMLElement} DOM element containing goals section content
 */
export const GoalsSection = (chartRenderer, activeCharts) => {
    const section = createSectionContainer('goals', 'Financial Goals', '🎯');
    section.className += ' goals-section';

    section.appendChild(
        createUsageNote(
            'Create and track goals (target amount, date, current savings). The planner calculates required monthly savings and progress. Use scenarios to model different savings rates.'
        )
    );

    // Try to load goals from StorageService; fallback to sample goals
    let goalsFromStorage = [];
    try {
        goalsFromStorage = StorageService.getGoals() || [];
    } catch (err) {
        console.warn('Error fetching goals from StorageService:', err);
        goalsFromStorage = [];
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
    createGoalProgressChart(chartRenderer, goalsToRender)
        .then(({ section: chartSection, chart }) => {
            section.appendChild(chartSection);
            activeCharts.set('goal-progress', chart);
        })
        .catch(error => {
            console.error('Error creating goal progress chart:', error);
        });

    // Add goal form controls
    const goalControls = createGoalFormControls(chartRenderer, activeCharts, section);
    section.appendChild(goalControls);

    // Add goals list
    const goalsList = createGoalsList(chartRenderer, activeCharts, section);
    section.appendChild(goalsList);

    // Add placeholder only when goals are not managed yet
    if (!hasRealGoals) {
        const placeholder = createPlaceholder(
            'Goal Planner Coming Soon',
            'Full goal planning with custom targets, automatic progress tracking, and wealth projections is coming soon.',
            '\ud83c\udfaf'
        );
        section.appendChild(placeholder);
    }

    return section;
};

// ...
