/**
 * AdvancedFilterPanel Component
 * Provides comprehensive filtering options for transactions including date ranges,
 * multi-category selection, amount ranges, and text search.
 */

import { FilteringService } from '../core/analytics/FilteringService.js';
import { Button } from './Button.js';
import { CustomCategoryService } from '../core/custom-category-service.js';

export const AdvancedFilterPanel = ({
  onFiltersChange,
  initialFilters = {},
}) => {
  // Safe notification wrapper
  const notifyFiltersChange = filters => {
    if (typeof onFiltersChange === 'function') {
      onFiltersChange(filters);
    }
  };
  // Panel container
  const panel = document.createElement('div');
  panel.className = 'advanced-filter-panel';
  panel.style.cssText = `
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-lg);
  `;

  // Current filters state
  let currentFilters = {
    categories: [],
    types: [],
    categoryFilterType: 'include',
    searchText: '',
    caseSensitive: false,
    ...initialFilters,
  };

  // Ensure arrays exist for includes() calls
  if (!Array.isArray(currentFilters.categories)) currentFilters.categories = [];
  if (!Array.isArray(currentFilters.types)) currentFilters.types = [];

  // Header
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md);
  `;

  const title = document.createElement('h3');
  title.textContent = 'Advanced Filters';
  title.style.cssText = `
    margin: 0;
    color: var(--color-text-main);
    font-size: var(--font-size-lg);
    font-weight: 600;
  `;

  const clearButton = Button({
    text: 'Clear All',
    variant: 'ghost',
    onClick: () => {
      currentFilters = FilteringService.clearFilters();
      updateFormValues();
      notifyFiltersChange(currentFilters);
    },
  });
  clearButton.style.fontSize = 'var(--font-size-sm)';

  header.appendChild(title);
  header.appendChild(clearButton);
  panel.appendChild(header);

  // Date Range Section
  const dateSection = createFilterSection('Date Range');

  const dateRow = document.createElement('div');
  dateRow.style.cssText = `
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-sm);
  `;

  const startDateInput = document.createElement('input');
  startDateInput.type = 'date';
  startDateInput.className = 'input-text';
  startDateInput.style.cssText = `
    padding: var(--spacing-sm);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-background);
    color: var(--color-text-main);
    font-size: var(--font-size-sm);
  `;

  const endDateInput = document.createElement('input');
  endDateInput.type = 'date';
  endDateInput.className = 'input-text';
  endDateInput.style.cssText = startDateInput.style.cssText;

  dateRow.appendChild(startDateInput);
  dateRow.appendChild(endDateInput);
  dateSection.appendChild(dateRow);

  // Categories Section
  const categoriesSection = createFilterSection('Categories');

  const categoryFilterType = document.createElement('select');
  categoryFilterType.className = 'input-select';
  categoryFilterType.style.cssText = `
    width: 100%;
    padding: var(--spacing-sm);
    margin-bottom: var(--spacing-sm);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-background);
    color: var(--color-text-main);
    font-size: var(--font-size-sm);
  `;
  categoryFilterType.innerHTML = `
    <option value="include">Include selected categories</option>
    <option value="exclude">Exclude selected categories</option>
  `;

  const categoriesContainer = document.createElement('div');
  categoriesContainer.style.cssText = `
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: var(--spacing-xs);
    max-height: 200px;
    overflow-y: auto;
    padding: var(--spacing-sm);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-background);
  `;

  // Get all available category names
  const uniqueCategories = CustomCategoryService.getAllCategoryNames('all');

  uniqueCategories.forEach(category => {
    const checkboxWrapper = document.createElement('label');
    checkboxWrapper.style.cssText = `
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      padding: var(--spacing-xs);
      cursor: pointer;
      border-radius: var(--radius-sm);
      transition: background-color var(--transition-fast);
    `;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = category;
    checkbox.style.cssText = `
      margin: 0;
      accent-color: var(--color-primary);
    `;

    const label = document.createElement('span');
    label.textContent = category;
    label.style.cssText = `
      font-size: var(--font-size-xs);
      color: var(--color-text-main);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `;

    checkboxWrapper.appendChild(checkbox);
    checkboxWrapper.appendChild(label);
    categoriesContainer.appendChild(checkboxWrapper);

    // Hover effect
    checkboxWrapper.addEventListener('mouseenter', () => {
      checkboxWrapper.style.backgroundColor = 'var(--color-surface-hover)';
    });
    checkboxWrapper.addEventListener('mouseleave', () => {
      checkboxWrapper.style.backgroundColor = 'transparent';
    });
  });

  categoriesSection.appendChild(categoryFilterType);
  categoriesSection.appendChild(categoriesContainer);

  // Amount Range Section
  const amountSection = createFilterSection('Amount Range');

  const amountRow = document.createElement('div');
  amountRow.style.cssText = `
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-sm);
  `;

  const minAmountInput = document.createElement('input');
  minAmountInput.type = 'number';
  minAmountInput.placeholder = 'Min amount';
  minAmountInput.className = 'input-text';
  minAmountInput.style.cssText = `
    padding: var(--spacing-sm);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-background);
    color: var(--color-text-main);
    font-size: var(--font-size-sm);
  `;

  const maxAmountInput = document.createElement('input');
  maxAmountInput.type = 'number';
  maxAmountInput.placeholder = 'Max amount';
  maxAmountInput.className = 'input-text';
  maxAmountInput.style.cssText = minAmountInput.style.cssText;

  amountRow.appendChild(minAmountInput);
  amountRow.appendChild(maxAmountInput);
  amountSection.appendChild(amountRow);

  // Transaction Types Section
  const typesSection = createFilterSection('Transaction Types');

  const typesContainer = document.createElement('div');
  typesContainer.style.cssText = `
    display: flex;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
  `;

  const transactionTypes = ['expense', 'income', 'transfer'];
  transactionTypes.forEach(type => {
    const checkboxWrapper = document.createElement('label');
    checkboxWrapper.style.cssText = `
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      padding: var(--spacing-xs) var(--spacing-sm);
      cursor: pointer;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-background);
      transition: all var(--transition-fast);
    `;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = type;
    checkbox.style.cssText = `
      margin: 0;
      accent-color: var(--color-primary);
    `;

    const label = document.createElement('span');
    label.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    label.style.cssText = `
      font-size: var(--font-size-sm);
      color: var(--color-text-main);
    `;

    checkboxWrapper.appendChild(checkbox);
    checkboxWrapper.appendChild(label);
    typesContainer.appendChild(checkboxWrapper);

    // Hover and active effects
    checkboxWrapper.addEventListener('mouseenter', () => {
      checkboxWrapper.style.backgroundColor = 'var(--color-surface-hover)';
    });
    checkboxWrapper.addEventListener('mouseleave', () => {
      if (checkbox.checked) {
        checkboxWrapper.style.backgroundColor = 'var(--color-primary)';
        checkboxWrapper.style.borderColor = 'var(--color-primary)';
        label.style.color = 'white';
      } else {
        checkboxWrapper.style.backgroundColor = 'transparent'; // Original unselected state
        checkboxWrapper.style.borderColor = 'var(--color-border)'; // Original border
        label.style.color = 'var(--color-text-main)'; // Original text color
      }
    });
    checkbox.addEventListener('change', () => {
      checkboxWrapper.style.backgroundColor = checkbox.checked
        ? 'var(--color-primary)'
        : 'var(--color-background)';
      checkboxWrapper.style.borderColor = checkbox.checked
        ? 'var(--color-primary)'
        : 'var(--color-border)';
      label.style.color = checkbox.checked ? 'white' : 'var(--color-text-main)';
    });
  });

  typesSection.appendChild(typesContainer);

  // Search Section
  const searchSection = createFilterSection('Search');

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Search in description, notes, or category...';
  searchInput.className = 'input-text';
  searchInput.style.cssText = `
    width: 100%;
    padding: var(--spacing-sm);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-background);
    color: var(--color-text-main);
    font-size: var(--font-size-base);
  `;

  const searchOptions = document.createElement('div');
  searchOptions.style.cssText = `
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin-top: var(--spacing-xs);
  `;

  const caseSensitiveCheckbox = document.createElement('label');
  caseSensitiveCheckbox.style.cssText = `
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    cursor: pointer;
  `;

  const caseSensitiveInput = document.createElement('input');
  caseSensitiveInput.type = 'checkbox';
  caseSensitiveInput.style.cssText = `
    margin: 0;
    accent-color: var(--color-primary);
  `;

  const caseSensitiveLabel = document.createElement('span');
  caseSensitiveLabel.textContent = 'Case sensitive';

  caseSensitiveCheckbox.appendChild(caseSensitiveInput);
  caseSensitiveCheckbox.appendChild(caseSensitiveLabel);
  searchOptions.appendChild(caseSensitiveCheckbox);

  searchSection.appendChild(searchInput);
  searchSection.appendChild(searchOptions);

  // Apply Filters Button
  const applyButton = Button({
    text: 'Apply Filters',
    variant: 'primary',
    onClick: () => {
      updateFiltersFromForm();
      notifyFiltersChange(currentFilters);
    },
  });
  applyButton.style.cssText = `
    width: 100%;
    margin-top: var(--spacing-md);
    padding: var(--spacing-md);
    font-weight: 600;
  `;

  // Assemble panel
  panel.appendChild(dateSection);
  panel.appendChild(categoriesSection);
  panel.appendChild(amountSection);
  panel.appendChild(typesSection);
  panel.appendChild(searchSection);
  panel.appendChild(applyButton);

  // Helper function to create filter sections
  function createFilterSection(title) {
    const section = document.createElement('div');
    section.style.cssText = `
      margin-bottom: var(--spacing-md);
    `;

    const sectionTitle = document.createElement('h4');
    sectionTitle.textContent = title;
    sectionTitle.style.cssText = `
      margin: 0 0 var(--spacing-sm) 0;
      color: var(--color-text-main);
      font-size: var(--font-size-base);
      font-weight: 500;
    `;

    section.appendChild(sectionTitle);
    return section;
  }

  // Update filters from form values
  function updateFiltersFromForm() {
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    if (startDate || endDate) {
      currentFilters.dateRange = {
        startDate: startDate || new Date(0).toISOString().split('T')[0],
        endDate: endDate || new Date().toISOString().split('T')[0],
      };
    } else {
      currentFilters.dateRange = null;
    }

    // Categories
    const selectedCategories = Array.from(
      categoriesContainer.querySelectorAll('input[type="checkbox"]:checked')
    ).map(cb => cb.value);
    currentFilters.categories = selectedCategories;
    currentFilters.categoryFilterType = categoryFilterType.value;

    // Amount range
    const minVal = parseFloat(minAmountInput.value);
    const maxVal = parseFloat(maxAmountInput.value);

    // Explicitly check for valid numbers, allowing 0
    const minAmount =
      minAmountInput.value !== '' && !Number.isNaN(minVal) ? minVal : undefined;
    const maxAmount =
      maxAmountInput.value !== '' && !Number.isNaN(maxVal) ? maxVal : undefined;

    if (minAmount !== undefined || maxAmount !== undefined) {
      currentFilters.amountRange = { min: minAmount, max: maxAmount };
    } else {
      currentFilters.amountRange = null;
    }

    // Transaction types
    const selectedTypes = Array.from(
      typesContainer.querySelectorAll('input[type="checkbox"]:checked')
    ).map(cb => cb.value);
    currentFilters.types = selectedTypes;

    // Search
    const searchText = searchInput.value.trim();
    currentFilters.searchText = searchText;
    currentFilters.caseSensitive = caseSensitiveInput.checked;
  }

  // Update form values from filters
  function updateFormValues() {
    // Date range
    if (currentFilters.dateRange) {
      startDateInput.value = currentFilters.dateRange.startDate || '';
      endDateInput.value = currentFilters.dateRange.endDate || '';
    } else {
      startDateInput.value = '';
      endDateInput.value = '';
    }

    // Categories
    categoryFilterType.value = currentFilters.categoryFilterType || 'include';
    categoriesContainer
      .querySelectorAll('input[type="checkbox"]')
      .forEach(cb => {
        cb.checked = currentFilters.categories.includes(cb.value);
      });

    // Amount range
    if (currentFilters.amountRange) {
      minAmountInput.value = currentFilters.amountRange.min || '';
      maxAmountInput.value = currentFilters.amountRange.max || '';
    } else {
      minAmountInput.value = '';
      maxAmountInput.value = '';
    }

    // Transaction types
    typesContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.checked = currentFilters.types.includes(cb.value);
      // Trigger change event to update styling
      cb.dispatchEvent(new Event('change'));
    });

    // Search
    searchInput.value = currentFilters.searchText || '';
    caseSensitiveInput.checked = currentFilters.caseSensitive || false;
  }

  // Initialize form values
  updateFormValues();

  // Add real-time filter updates (optional)
  let debounceTimer;
  function addRealtimeListeners() {
    const inputs = [
      startDateInput,
      endDateInput,
      minAmountInput,
      maxAmountInput,
      searchInput,
    ];

    inputs.forEach(input => {
      input.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          updateFiltersFromForm();
          onFiltersChange(currentFilters);
        }, 500);
      });
    });

    categoryFilterType.addEventListener('change', () => {
      updateFiltersFromForm();
      notifyFiltersChange(currentFilters);
    });

    // Checkbox listeners for categories
    categoriesContainer
      .querySelectorAll('input[type="checkbox"]')
      .forEach(cb => {
        cb.addEventListener('change', () => {
          updateFiltersFromForm();
          notifyFiltersChange(currentFilters);
        });
      });

    // Checkbox listeners for transaction types
    typesContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        updateFiltersFromForm();
        notifyFiltersChange(currentFilters);
      });
    });

    caseSensitiveInput.addEventListener('change', () => {
      updateFiltersFromForm();
      notifyFiltersChange(currentFilters);
    });
  }

  // Enable real-time updates
  addRealtimeListeners();

  return panel;
};
