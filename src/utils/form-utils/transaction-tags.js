/**
 * Optional expense flags (tags) on the transaction form
 */

import { CustomCategoryService } from '../../core/custom-category-service.js';
import { sanitizeInput } from '../security-utils.js';

/**
 * @param {Object} transaction
 * @returns {string|null} Single tag name if present
 */
export const getTransactionTagName = transaction => {
  if (!transaction?.tags?.length) return null;
  return transaction.tags[0] || null;
};

/**
 * Attach at most one expense tag to prepared transaction data
 * @param {Object} data - Transaction payload
 * @param {string|null} tagName - Selected flag name
 * @param {boolean} [explicitTagField=false] - When true, empty tag clears stored tags (edit save)
 * @returns {Object}
 */
export const applyExpenseTagToTransactionData = (
  data,
  tagName,
  explicitTagField = false
) => {
  const next = { ...data };

  if (data.type !== 'expense') {
    delete next.tags;
    return next;
  }

  const trimmed = tagName ? sanitizeInput(tagName.trim()) : '';
  if (trimmed) {
    next.tags = [trimmed];
  } else if (explicitTagField) {
    // Empty array signals "clear tag" on update (delete alone is ignored by merge)
    next.tags = [];
  } else {
    delete next.tags;
  }

  return next;
};

/**
 * @param {Object} [options]
 * @param {string|null} [options.initialTag] - Pre-selected tag (edit mode)
 * @returns {{ container: HTMLElement, getSelectedTag: () => string|null, clear: () => void, setTransactionType: (type: string) => void }}
 */
const syncTagOptionStates = (container, selectedTag) => {
  container.querySelectorAll('.transaction-tag-option').forEach(option => {
    const input = option.querySelector('.transaction-tag-option__input');
    const name = input?.value;
    const isSelected = selectedTag === name;
    if (input) input.checked = isSelected;
    option.classList.toggle('transaction-tag-option--selected', isSelected);
  });
};

export const createTransactionTagSelector = ({ initialTag = null } = {}) => {
  let selectedTag = initialTag || null;

  const container = document.createElement('div');
  container.className = 'transaction-tag-selector';
  container.setAttribute('role', 'group');
  container.setAttribute('aria-label', 'Transaction flags');
  container.hidden = true;

  const render = () => {
    container.innerHTML = '';
    const flagCategories = CustomCategoryService.getCheckboxCategories();

    if (!flagCategories.length) {
      container.hidden = true;
      return;
    }

    container.hidden = false;

    flagCategories.forEach(category => {
      const option = document.createElement('label');
      option.className = 'transaction-tag-option';
      option.style.setProperty(
        '--tag-color',
        category.color || 'var(--color-primary)'
      );

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.className = 'transaction-tag-option__input';
      input.name = 'transaction-tag';
      input.value = category.name;
      input.checked = selectedTag === category.name;

      const mark = document.createElement('span');
      mark.className = 'transaction-tag-option__mark';
      mark.style.setProperty(
        '--tag-color',
        category.color || 'var(--color-primary)'
      );

      const text = document.createElement('span');
      text.className = 'transaction-tag-option__label';
      text.textContent = category.name;

      option.addEventListener('click', e => {
        e.preventDefault();
        if (selectedTag === category.name) {
          selectedTag = null;
        } else {
          selectedTag = category.name;
        }
        syncTagOptionStates(container, selectedTag);
      });

      option.appendChild(input);
      option.appendChild(mark);
      option.appendChild(text);
      container.appendChild(option);
    });

    syncTagOptionStates(container, selectedTag);
  };

  const clear = () => {
    selectedTag = null;
    render();
  };

  const setTransactionType = type => {
    if (type !== 'expense') {
      selectedTag = null;
      container.hidden = true;
      return;
    }
    render();
  };

  render();

  return {
    container,
    getSelectedTag: () => selectedTag,
    clear,
    setTransactionType,
  };
};
