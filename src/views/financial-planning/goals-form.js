import { COLORS, SPACING } from '../../utils/constants.js';
import { StorageService } from '../../core/storage.js';
import { showErrorToast } from '../../utils/toast-notifications.js';

/**
 * Create goal form controls.
 */
export function createGoalFormControls(onGoalSaved) {
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
  goalCurrent.placeholder = 'Manually reported current balance';
  goalCurrent.setAttribute('aria-label', 'Manually reported current balance');

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

    if (current < 0) {
      currentError.textContent = 'Current savings cannot be negative';
      currentError.style.display = 'block';
      valid = false;
    }

    if (!valid) return;

    try {
      StorageService.createGoal(name, target, tdate, current, {});
    } catch (err) {
      console.error('Failed to save goal', err);
      showErrorToast('Failed to save goal. Please try again.');
      return;
    }

    goalForm.style.display = 'none';
    goalName.value = '';
    goalTarget.value = '';
    goalDate.value = '';
    goalCurrent.value = '';
    nameError.style.display = 'none';
    currentError.style.display = 'none';
    dateError.style.display = 'none';

    try {
      await onGoalSaved();
    } catch (err) {
      console.error('Goal was saved but the goal view could not refresh', err);
      showErrorToast('Goal saved, but the goal list could not refresh.');
    }
  });

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
