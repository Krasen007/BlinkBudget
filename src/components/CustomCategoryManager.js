/**
 * CustomCategoryManager Component
 * Provides UI for managing custom categories including create, edit, delete,
 * and organize functionality with accessibility features.
 */

import { CustomCategoryService } from '../core/custom-category-service.js';
import { Button } from './Button.js';
import { ConfirmDialog } from './ConfirmDialog.js';
import { Router } from '../core/router.js';

export const CustomCategoryManager = ({
  onCategoryChange,
  initialType = 'expense',
}) => {
  // Main container
  const container = document.createElement('div');
  container.className = 'custom-category-manager';
  container.style.cssText = `
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    width: 100%;
    max-width: var(--container-max-width);
    padding: 0 var(--spacing-sm);
    height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y;
  `;

  // Current state
  let currentType = initialType;
  let categories = [];

  // Header
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);
  `;

  // Left side: Back + Title
  const leftSide = document.createElement('div');
  leftSide.style.display = 'flex';
  leftSide.style.alignItems = 'center';
  leftSide.style.gap = 'var(--spacing-md)';

  const backButton = Button({
    text: '←',
    variant: 'ghost',
    onClick: () => Router.navigate('settings'),
  });
  backButton.style.padding = 'var(--spacing-xs) var(--spacing-sm)';
  leftSide.appendChild(backButton);

  const title = document.createElement('h2');
  title.textContent = 'Categories';
  title.style.cssText = `
    margin: 0;
    color: var(--color-text-main);
    font-size: var(--font-size-xl);
    font-weight: 600;
  `;
  leftSide.appendChild(title);

  const addButton = Button({
    text: 'Add',
    variant: 'primary',
    onClick: () => showCategoryForm(),
  });
  addButton.setAttribute('aria-label', 'Add new category');
  addButton.style.padding = 'var(--spacing-xs) var(--spacing-md)';

  header.appendChild(leftSide);
  header.appendChild(addButton);
  container.appendChild(header);

  // Type selector
  const typeSelector = document.createElement('div');
  typeSelector.setAttribute('role', 'tablist');
  typeSelector.style.cssText = `
    display: flex;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-lg);
    padding: var(--spacing-xs);
    background: var(--color-background);
    border-radius: var(--radius-md);
  `;

  const expenseButton = createTypeButton('Expense', 'expense', 'expense-button');
  const incomeButton = createTypeButton('Income', 'income', 'income-button');

  typeSelector.appendChild(expenseButton);
  typeSelector.appendChild(incomeButton);
  container.appendChild(typeSelector);

  // Categories list
  const categoriesList = document.createElement('div');
  categoriesList.className = 'categories-list';
  categoriesList.id = 'categories-panel';
  categoriesList.setAttribute('role', 'tabpanel');
  categoriesList.setAttribute('aria-labelledby', 'expense-button income-button');
  categoriesList.style.cssText = `
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: var(--spacing-md);
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-sm);
    padding-bottom: var(--spacing-lg);
    align-content: start;
  `;

  container.appendChild(categoriesList);

  // Helper functions
  function createTypeButton(text, type, id) {
    const button = document.createElement('button');
    button.textContent = text;
    button.id = id;
    button.className = 'type-button';
    button.setAttribute('role', 'tab');
    button.setAttribute(
      'aria-selected',
      type === currentType ? 'true' : 'false'
    );
    button.setAttribute('aria-controls', 'categories-panel');
    button.style.cssText = `
      padding: var(--spacing-sm) var(--spacing-md);
      border: none;
      border-radius: var(--radius-sm);
      background: ${type === currentType ? 'var(--color-primary)' : 'transparent'};
      color: ${type === currentType ? 'white' : 'var(--color-text-muted)'};
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition-fast);
      flex: 1;
    `;

    button.addEventListener('click', () => {
      currentType = type;
      updateTypeButtons();
      renderCategories();
    });

    button.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        button.click();
      }
    });

    return button;
  }

  function updateTypeButtons() {
    const buttons = typeSelector.querySelectorAll('.type-button');
    buttons.forEach((button, index) => {
      const type = index === 0 ? 'expense' : 'income';
      const isSelected = type === currentType;

      button.style.background = isSelected
        ? 'var(--color-primary)'
        : 'transparent';
      button.style.color = isSelected ? 'white' : 'var(--color-text-muted)';
      button.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });
  }

  function createCategoryCard(category) {
    const card = document.createElement('div');
    card.className = 'category-card';
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'article');
    card.setAttribute(
      'aria-label',
      `${category.name} category, ${category.type}`
    );
    card.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
      padding: var(--spacing-md);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-background);
      transition: all var(--transition-fast);
      position: relative;
      min-height: 160px;
      justify-content: space-between;
      align-items: flex-start; /* Override center alignment from CSS */
      text-align: left; /* Override center text alignment from CSS */
    `;

    // Info section (top)
    const infoArea = document.createElement('div');
    infoArea.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
      width: 100%;
    `;

    // Header within card (color + name)
    const cardHeader = document.createElement('div');
    cardHeader.style.cssText = `
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-xs);
    `;

    // Category color indicator
    const colorIndicator = document.createElement('div');
    colorIndicator.style.cssText = `
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: ${category.color || '#6b7280'};
      flex-shrink: 0;
    `;

    const name = document.createElement('div');
    name.textContent = category.name;
    name.style.cssText = `
      font-weight: 600;
      color: var(--color-text-main);
      font-size: var(--font-size-base);
    `;

    cardHeader.appendChild(colorIndicator);
    cardHeader.appendChild(name);
    infoArea.appendChild(cardHeader);

    const meta = document.createElement('div');
    meta.style.cssText = `
      font-size: var(--font-size-xs);
      color: var(--color-text-muted);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    `;

    const type = document.createElement('span');
    type.textContent = category.type;
    type.style.cssText = `
      text-transform: capitalize;
      opacity: 0.8;
    `;
    meta.appendChild(type);

    if (category.description) {
      const description = document.createElement('div');
      description.textContent = category.description;
      description.style.cssText = `
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      `;
      meta.appendChild(description);
    }
    infoArea.appendChild(meta);
    card.appendChild(infoArea);

    // Actions (bottom)
    const actions = document.createElement('div');
    actions.style.cssText = `
      display: flex;
      gap: var(--spacing-xs);
      margin-top: var(--spacing-sm);
      width: 100%;
    `;

    // Only show actions for custom categories
    if (!category.isSystem) {
      const editButton = createActionButton('Edit', () =>
        showCategoryForm(category)
      );
      const deleteButton = createActionButton('Delete', () =>
        confirmDeleteCategory(category)
      );

      actions.appendChild(editButton);
      actions.appendChild(deleteButton);
    } else {
      // Optional: Add a visual indicator or placeholder for system categories
      const systemLabel = document.createElement('div');
      systemLabel.textContent = 'System Category (Read-only)';
      systemLabel.style.cssText = `
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
        font-style: italic;
        padding: var(--spacing-xs) 0;
      `;
      actions.appendChild(systemLabel);
    }
    card.appendChild(actions);

    // Keyboard navigation
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!category.isSystem) {
          showCategoryForm(category);
        }
      }
    });

    // Hover effects
    card.addEventListener('mouseenter', () => {
      card.style.backgroundColor = 'var(--color-surface-hover)';
      card.style.transform = 'translateY(-1px)';
    });

    card.addEventListener('mouseleave', () => {
      card.style.backgroundColor = 'var(--color-background)';
      card.style.transform = 'translateY(0)';
    });

    return card;
  }

  function createActionButton(text, onClick) {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = 'action-button';
    button.setAttribute('aria-label', `${text} category`);
    button.style.cssText = `
      padding: var(--spacing-xs) var(--spacing-sm);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      background: var(--color-surface);
      color: var(--color-text-main);
      font-size: var(--font-size-xs);
      cursor: pointer;
      transition: all var(--transition-fast);
      flex: 1;
      height: 30px;
    `;

    button.addEventListener('click', onClick);

    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = 'var(--color-surface-hover)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = 'var(--color-surface)';
    });

    return button;
  }

  function showCategoryForm(category = null) {
    const isEdit = !!category;

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    `;

    // Create form modal
    const modal = document.createElement('div');
    modal.className = 'category-form-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'category-form-title');
    modal.style.cssText = `
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--spacing-lg);
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
    `;

    // Form title
    const title = document.createElement('h3');
    title.id = 'category-form-title';
    title.textContent = isEdit ? 'Edit Category' : 'Add New Category';
    title.style.cssText = `
      margin: 0 0 var(--spacing-lg) 0;
      color: var(--color-text-main);
      font-size: var(--font-size-lg);
      font-weight: 600;
    `;

    // Form fields
    const form = document.createElement('form');
    form.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
    `;

    // Name field
    const nameGroup = createFormField(
      'Name',
      'text',
      category?.name || '',
      'category-name',
      true
    );

    // Type field
    const typeGroup = document.createElement('div');
    typeGroup.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    `;

    const typeLabel = document.createElement('label');
    typeLabel.textContent = 'Type';
    typeLabel.setAttribute('for', 'category-type');
    typeLabel.style.cssText = `
      font-weight: 500;
      color: var(--color-text-main);
    `;

    const typeSelect = document.createElement('select');
    typeSelect.id = 'category-type';
    typeSelect.className = 'input-select';
    typeSelect.style.cssText = `
      padding: var(--spacing-sm);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-background);
      color: var(--color-text-main);
      font-size: var(--font-size-base);
    `;

    typeSelect.innerHTML = `
      <option value="expense" ${category?.type === 'expense' ? 'selected' : ''}>Expense</option>
      <option value="income" ${category?.type === 'income' ? 'selected' : ''}>Income</option>
    `;

    typeGroup.appendChild(typeLabel);
    typeGroup.appendChild(typeSelect);

    // Color field
    const colorGroup = createFormField(
      'Color',
      'color',
      category?.color || CustomCategoryService.generateDefaultColor(),
      'category-color'
    );

    // Description field
    const descriptionGroup = createFormField(
      'Description',
      'textarea',
      category?.description || '',
      'category-description',
      false,
      3
    );

    // Form buttons
    const buttonGroup = document.createElement('div');
    buttonGroup.style.cssText = `
      display: flex;
      gap: var(--spacing-sm);
      justify-content: flex-end;
      margin-top: var(--spacing-md);
    `;

    const cancelButton = Button({
      text: 'Cancel',
      variant: 'ghost',
      onClick: () => closeModal(),
    });

    const saveButton = Button({
      text: isEdit ? 'Update' : 'Create',
      variant: 'primary',
      onClick: e => {
        e.preventDefault();
        saveCategory();
      },
    });

    buttonGroup.appendChild(cancelButton);
    buttonGroup.appendChild(saveButton);

    // Assemble form
    form.appendChild(nameGroup.field);
    form.appendChild(typeGroup);
    form.appendChild(colorGroup.field);
    form.appendChild(descriptionGroup.field);
    form.appendChild(buttonGroup);

    // Assemble modal
    modal.appendChild(title);
    modal.appendChild(form);

    // Add to overlay
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Focus management
    const nameInput = nameGroup.field.querySelector('input');
    nameInput.focus();

    // Helper to close modal and clean up listeners
    const closeModal = () => {
      overlay.remove();
      document.removeEventListener('keydown', handleEscape);
    };

    // Close on overlay click
    overlay.addEventListener('click', e => {
      if (e.target === overlay) {
        closeModal();
      }
    });

    // Close on Escape
    const handleEscape = e => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Save function
    function saveCategory() {
      const formData = {
        name: nameInput.value.trim(),
        type: typeSelect.value,
        color: colorGroup.field.querySelector('input').value,
        description: descriptionGroup.field
          .querySelector('textarea')
          .value.trim(),
      };

      const validation = CustomCategoryService.validate(formData);
      if (!validation.valid) {
        console.error('Validation errors:', validation.errors);
        // Show validation error in a user-friendly way
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
          background: #ef4444;
          color: white;
          padding: var(--spacing-sm);
          border-radius: var(--radius-sm);
          margin-bottom: var(--spacing-sm);
          font-size: var(--font-size-sm);
        `;
        errorDiv.textContent = validation.errors.join(', ');
        form.insertBefore(errorDiv, form.firstChild);
        setTimeout(() => errorDiv.remove(), 5000);
        return;
      }

      try {
        if (isEdit) {
          CustomCategoryService.update(category.id, formData);
        } else {
          CustomCategoryService.add(formData);
        }

        closeModal();
        renderCategories();
        onCategoryChange && onCategoryChange();
      } catch (error) {
        console.error('Error saving category:', error);
        // Show error in a user-friendly way
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
          background: #ef4444;
          color: white;
          padding: var(--spacing-sm);
          border-radius: var(--radius-sm);
          margin-bottom: var(--spacing-sm);
          font-size: var(--font-size-sm);
        `;
        errorDiv.textContent = error.message || 'Failed to save category';
        form.insertBefore(errorDiv, form.firstChild);
        setTimeout(() => errorDiv.remove(), 5000);
      }
    }
  }

  function createFormField(label, type, value, id, required = false, rows = 1) {
    const group = document.createElement('div');
    group.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    `;

    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    labelElement.setAttribute('for', id);
    labelElement.style.cssText = `
      font-weight: 500;
      color: var(--color-text-main);
    `;

    const input = document.createElement(
      type === 'textarea' ? 'textarea' : 'input'
    );
    input.id = id;
    input.className = `input-${type}`;
    input.required = required;
    input.setAttribute('aria-label', label);
    input.style.cssText = `
      padding: var(--spacing-sm);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-background);
      color: var(--color-text-main);
      font-size: var(--font-size-base);
    `;

    if (type === 'textarea') {
      input.rows = rows;
    } else {
      input.type = type;
    }

    input.value = value;

    group.appendChild(labelElement);
    group.appendChild(input);

    return { field: group, input };
  }

  function confirmDeleteCategory(category) {
    ConfirmDialog({
      title: 'Delete Category',
      message: `Are you sure you want to delete "${category.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: () => {
        try {
          CustomCategoryService.remove(category.id, true);
          renderCategories();
          onCategoryChange && onCategoryChange();
        } catch (error) {
          console.error('Error deleting category:', error);
          // Show error in a user-friendly way
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
          errorDiv.textContent = error.message || 'Failed to delete category';
          document.body.appendChild(errorDiv);
          setTimeout(() => errorDiv.remove(), 5000);
        }
      },
    });
  }

  function renderCategories() {
    categories = CustomCategoryService.getByType(currentType);

    categoriesList.innerHTML = '';

    if (categories.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.style.cssText = `
        text-align: center;
        padding: var(--spacing-2xl);
        color: var(--color-text-muted);
      `;
      emptyState.innerHTML = `
        <div style="font-size: var(--font-size-lg); margin-bottom: var(--spacing-sm);">No categories found</div>
        <div>Create your first custom category to get started</div>
      `;
      categoriesList.appendChild(emptyState);
      return;
    }

    categories.forEach(category => {
      const card = createCategoryCard(category);
      categoriesList.appendChild(card);
    });
  }

  // Initial render
  renderCategories();

  return container;
};
