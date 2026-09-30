/**
 * Optional expense flags (tags) on the transaction form
 */

import { CustomCategoryService } from '../../core/custom-category-service.js';
import { STORAGE_KEYS } from '../../utils/constants.js';
import { sanitizeInput } from '../security-utils.js';

const CATEGORIES_STORAGE_KEY =
  STORAGE_KEYS.CUSTOM_CATEGORIES || 'custom_categories';

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

  if (data.type !== 'expense' && data.type !== 'refund') {
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
 * @returns {{ container: HTMLElement, getSelectedTag: () => string|null, clear: () => void, setTransactionType: (type: string) => void, destroy: () => void }}
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

const buildTagOption = ({ name, color, selected, onToggle }) => {
  const option = document.createElement('label');
  option.className = 'transaction-tag-option';
  option.style.setProperty('--tag-color', color || 'var(--color-primary)');

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.className = 'transaction-tag-option__input';
  input.name = 'transaction-tag';
  input.value = name;
  input.checked = selected;

  const mark = document.createElement('span');
  mark.className = 'transaction-tag-option__mark';
  mark.style.setProperty('--tag-color', color || 'var(--color-primary)');

  const text = document.createElement('span');
  text.className = 'transaction-tag-option__label';
  text.textContent = name;

  option.addEventListener('click', e => {
    e.preventDefault();
    onToggle();
  });

  option.appendChild(input);
  option.appendChild(mark);
  option.appendChild(text);
  return option;
};

export const createTransactionTagSelector = ({ initialTag = null } = {}) => {
  let selectedTag = initialTag || null;
  // The form defaults to 'expense'; setTransactionType keeps this in sync.
  let currentType = 'expense';

  const container = document.createElement('div');
  container.className = 'transaction-tag-selector';
  container.setAttribute('role', 'group');
  container.setAttribute('aria-label', 'Transaction flags');
  container.hidden = true;

  const isTaggableType = () =>
    currentType === 'expense' || currentType === 'refund';

  const render = () => {
    container.innerHTML = '';
    const flagCategories = CustomCategoryService.getCheckboxCategories();

    // Offline fallback: if categories haven't loaded yet but a tag is already
    // selected (edit mode), synthesise a minimal placeholder option so the
    // selected value is visible and preserved on save.
    if (!flagCategories.length) {
      if (selectedTag) {
        container.hidden = false;
        container.appendChild(
          buildTagOption({
            name: selectedTag,
            color: 'var(--color-primary)',
            selected: true,
            onToggle: () => {
              selectedTag = null;
              render();
            },
          })
        );
      } else {
        container.hidden = true;
      }
      return;
    }

    container.hidden = false;

    flagCategories.forEach(category => {
      container.appendChild(
        buildTagOption({
          name: category.name,
          color: category.color,
          selected: selectedTag === category.name,
          onToggle: () => {
            if (selectedTag === category.name) {
              selectedTag = null;
            } else {
              selectedTag = category.name;
            }
            syncTagOptionStates(container, selectedTag);
          },
        })
      );
    });

    syncTagOptionStates(container, selectedTag);
  };

  const clear = () => {
    selectedTag = null;
    render();
  };

  // Live refresh: flag categories can arrive AFTER the form is open — e.g. on
  // offline cold start the userId-filtered list is empty until auth resolves,
  // or cloud sync merges categories in later. Re-render so tags become
  // selectable without the user having to reopen the transaction.
  const handleCategoriesChanged = () => {
    if (!container.isConnected) return;
    if (!isTaggableType()) return;
    render();
  };
  const handleStorageUpdated = e => {
    if (e?.detail?.key && e.detail.key !== CATEGORIES_STORAGE_KEY) return;
    handleCategoriesChanged();
  };
  window.addEventListener('categories-updated', handleCategoriesChanged);
  window.addEventListener('storage-updated', handleStorageUpdated);

  const destroy = () => {
    window.removeEventListener('categories-updated', handleCategoriesChanged);
    window.removeEventListener('storage-updated', handleStorageUpdated);
  };

  const setTransactionType = type => {
    currentType = type;
    if (!isTaggableType()) {
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
    destroy,
  };
};
