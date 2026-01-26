/**
 * BudgetForm Component
 *
 * Form for setting or editing budget limits for a category.
 */

import { COLORS, SPACING, FONT_SIZES } from '../utils/constants.js';
import { Button } from './Button.js';

/**
 * Create a budget form
 * @param {Object} props - { categoryName, initialLimit, onSave, onCancel }
 * @returns {HTMLElement}
 */
export const BudgetForm = ({
  categoryName,
  initialLimit = 0,
  onSave,
  onCancel,
}) => {
  const form = document.createElement('div');
  form.className = 'budget-form';
  Object.assign(form.style, {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACING.MD,
    padding: SPACING.MD,
    background: COLORS.BACKGROUND,
    borderRadius: 'var(--radius-md)',
    border: `1px solid ${COLORS.BORDER}`,
  });

  const title = document.createElement('h4');
  title.textContent = `Set Budget for ${categoryName}`;
  title.style.margin = '0';
  title.style.fontSize = FONT_SIZES.MD;
  form.appendChild(title);

  const inputGroup = document.createElement('div');
  inputGroup.style.display = 'flex';
  inputGroup.style.flexDirection = 'column';
  inputGroup.style.gap = SPACING.XS;

  const label = document.createElement('label');
  label.textContent = 'Monthly Limit (€)';
  label.style.fontSize = FONT_SIZES.SM;
  label.style.color = COLORS.TEXT_MUTED;
  inputGroup.appendChild(label);

  const input = document.createElement('input');
  input.type = 'number';
  input.value = initialLimit || '';
  input.placeholder = '0.00';
  input.step = '10';
  input.min = '0';
  Object.assign(input.style, {
    padding: `${SPACING.SM} ${SPACING.MD}`,
    borderRadius: 'var(--radius-sm)',
    border: `1px solid ${COLORS.BORDER}`,
    background: COLORS.SURFACE,
    color: COLORS.TEXT_MAIN,
    fontSize: FONT_SIZES.MD,
    outline: 'none',
  });
  input.focus();
  inputGroup.appendChild(input);
  form.appendChild(inputGroup);

  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.gap = SPACING.SM;
  actions.style.marginTop = SPACING.XS;

  const saveBtn = Button({
    text: 'Save Budget',
    onClick: () => {
      const raw = (input.value || '').trim();
      const parsed = parseFloat(raw);
      const limit = raw === '' ? null : (Number.isNaN(parsed) ? null : parsed);
      onSave(limit);
    },
    variant: 'primary',
  });
  saveBtn.style.flex = '1';

  const cancelBtn = Button({
    text: 'Cancel',
    onClick: onCancel,
    variant: 'ghost',
  });
  cancelBtn.style.flex = '1';

  actions.appendChild(cancelBtn);
  actions.appendChild(saveBtn);
  form.appendChild(actions);

  return form;
};
