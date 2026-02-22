// Phase 2 changes:
/**
 * TransactionForm Component
 * Refactored to use extracted utilities - now ~180 lines (down from 724)
 */

import { AccountService } from '../core/Account/account-service.js';
import { ClickTracker } from '../core/click-tracking-service.js';
import { SettingsService } from '../core/settings-service.js';
import { FONT_SIZES, COLORS } from '../utils/constants.js';
import { createSelect } from '../utils/dom-factory.js';
import { createTypeToggleGroup } from '../utils/form-utils/type-toggle.js';
import { createCategorySelector } from '../utils/form-utils/category-chips.js';
import { createAmountInput } from '../utils/form-utils/amount-input.js';
import { setupFormKeyboardHandling } from '../utils/form-utils/keyboard.js';
import { SmartAmountInput } from './SmartAmountInput.js';
import { SmartNoteField } from './SmartNoteField.js';
import { SmartCategorySelector } from './SmartCategorySelector.js';
import { getCopyString } from '../utils/copy-strings.js';
import { initializeCategoryIconsCSS } from '../utils/category-icons.js';
import {
  validateAmount,
  validateCategory,
  validateTransferAccount,
  showFieldError,
  showContainerError,
} from '../utils/form-utils/validation.js';
import {
  prepareTransactionData,
  handleFormSubmit,
} from '../utils/form-utils/submission.js';

export const TransactionForm = ({
  onSubmit,
  initialValues = {},
  externalDateInput = null,
  showCancelButton = false,
  onCancel = null,
  onDelete = null,
}) => {
  // Check if smart suggestions are enabled
  const smartSuggestionsEnabled =
    String(SettingsService.getSetting('smartSuggestionsEnabled')) === 'true'; // Handle string/boolean coercion, default false

  // Initialize category icons CSS only if smart suggestions are enabled
  if (smartSuggestionsEnabled) {
    initializeCategoryIconsCSS();
  }

  // 1. Form setup
  const form = document.createElement('form');
  form.className = 'transaction-form mobile-optimized';
  form.style.display = 'flex';
  form.style.flexDirection = 'column';
  form.style.gap = 'var(--spacing-xs)';
  form.style.width = '100%';
  form.style.position = 'relative';

  if (window.mobileUtils && window.mobileUtils.isMobile()) {
    form.style.justifyContent = 'flex-start';
  }

  // 2. Account Selection (Source)
  const accounts = AccountService.getAccounts();
  const defaultAccount = AccountService.getDefaultAccount();
  let currentAccountId = initialValues.accountId || defaultAccount.id;

  const accountGroup = document.createElement('div');
  accountGroup.style.flex = '1';

  const accLabel = document.createElement('label');
  accLabel.textContent = 'Account';
  accLabel.setAttribute('for', 'source-account-select');
  accLabel.className = 'visually-hidden';
  accountGroup.appendChild(accLabel);

  const accSelect = createSelect({
    id: 'source-account-select',
    name: 'source_account',
    options: accounts.map(acc => ({
      value: acc.id,
      text: acc.name,
      selected: acc.id === currentAccountId,
    })),
    className: 'mobile-form-select',
    style: { cursor: 'pointer' },
  });

  // Mobile-specific select handling
  accSelect.addEventListener('focus', () => {
    if (window.mobileUtils) {
      window.mobileUtils.preventInputZoom(accSelect);
    }
  });

  // Track clicks on account selector
  accSelect.addEventListener('click', () => {
    ClickTracker.recordClick();
  });

  accSelect.addEventListener('change', e => {
    ClickTracker.recordClick();
    currentAccountId = e.target.value;
    // Always update category selector's source account for all transaction types
    categorySelector.setSourceAccount(currentAccountId);
  });

  accountGroup.appendChild(accSelect);

  // 3. Type Toggle
  const typeToggle = createTypeToggleGroup({
    initialType: initialValues.type || 'expense',
  });

  // 4. Amount Input (Smart or Classic based on setting)
  let amountInput;
  let smartAmountInput = null;
  let smartNoteField = null;

  if (smartSuggestionsEnabled) {
    // Smart Amount Input
    smartAmountInput = SmartAmountInput.create({
      onAmountChange: amount => {
        // Update category suggestions when amount changes
        if (smartCategorySelector) {
          smartCategorySelector.updateSmartMatch(amount);
        }
        // Update note suggestions when amount changes
        if (smartNoteField) {
          smartNoteField.updateContext(
            smartCategorySelector?.getSelectedCategory(),
            amount
          );
        }
      },
      onSuggestionSelect: suggestion => {
        // Apply suggestion and update other fields
        smartAmountInput.setAmount(suggestion.amount);
        if (suggestion.category && smartCategorySelector) {
          smartCategorySelector.setSelectedCategory(suggestion.category);
          smartNoteField?.updateContext(suggestion.category, suggestion.amount);
        }
        // Record selection for learning
        ClickTracker.recordClick();
      },
      initialValue: initialValues.amount?.toString() || '',
    });
    amountInput = smartAmountInput;
    amountInput.id = 'transaction-amount-input';
    // Add touch target classes
    smartAmountInput.classList.add('touch-target-primary');
  } else {
    // Classic Amount Input
    const amountState = createAmountInput({
      initialValue: initialValues.amount || '',
      externalDateInput,
    });
    amountInput = amountState.input;
    amountInput.id = 'transaction-amount-input';
  }

  const amountGroup = document.createElement('div');
  amountGroup.style.flex = '1.5';
  amountGroup.style.marginBottom = '0';

  const amountLabel = document.createElement('label');
  amountLabel.textContent = 'Amount';
  amountLabel.setAttribute('for', 'transaction-amount-input');
  amountLabel.className = 'visually-hidden';
  amountGroup.appendChild(amountLabel);

  amountGroup.appendChild(amountInput);

  // Add tutorial data attribute to amount input
  if (smartAmountInput) {
    smartAmountInput.setAttribute('data-tutorial-target', 'amount-input');
  } else {
    amountInput.setAttribute('data-tutorial-target', 'amount-input');
  }

  // 5. Amount and Account Row
  const amountAccountRow = document.createElement('div');
  amountAccountRow.style.display = 'flex';
  amountAccountRow.style.gap = 'var(--spacing-sm)';
  amountAccountRow.style.width = '100%';
  amountAccountRow.appendChild(amountGroup);
  amountAccountRow.appendChild(accountGroup);
  amountAccountRow.style.marginBottom = 'var(--spacing-xs)';

  // 6. Category Selector (Smart or Classic based on setting)
  let categorySelector;
  let smartCategorySelector = null;

  if (smartSuggestionsEnabled) {
    // Smart Category Selector
    smartCategorySelector = SmartCategorySelector.create({
      onCategorySelect: category => {
        // Update note suggestions when category changes
        if (smartNoteField) {
          const currentAmount = smartAmountInput.getAmount();
          smartNoteField.updateContext(category, currentAmount);
        }
        ClickTracker.recordClick();
      },
      onSmartMatchAccept: _smartMatch => {
        // Handle smart match acceptance
        ClickTracker.recordClick();
      },
      amount: smartAmountInput.getAmount(),
      initialCategory: initialValues.category || '',
    });

    // Keep backward compatibility with existing category selector interface
    categorySelector = {
      container: smartCategorySelector,
      setType: _type => {
        // Type changes don't affect smart suggestions for now
      },
      selectedCategory: () => smartCategorySelector.getSelectedCategory(),
      selectedToAccount: () => null, // Smart selector doesn't handle transfers
      chipContainer: smartCategorySelector,
      setSourceAccount: () => {
        // Account changes don't affect smart suggestions for now
      },
    };
    // Add touch target classes to category cards
    smartCategorySelector.classList.add('touch-target-secondary');
    // Add tutorial data attribute to category selector
    smartCategorySelector.setAttribute(
      'data-tutorial-target',
      'category-selector'
    );
  } else {
    // Classic Category Selector
    categorySelector = createCategorySelector({
      type: typeToggle.currentType(),
      accounts,
      currentAccountId,
      initialCategory: initialValues.category || null,
      initialToAccount: initialValues.toAccountId || null,
      amountInput,
      externalDateInput,
      onSubmit: data => {
        handleFormSubmit(data, onSubmit);
      },
    });
    // Add tutorial data attribute to classic category selector
    categorySelector.container.setAttribute(
      'data-tutorial-target',
      'category-selector'
    );
  }

  // Setup type toggle change handler (after categorySelector is created)
  const originalSetType = typeToggle.setType;
  typeToggle.setType = type => {
    originalSetType(type);
    categorySelector.setType(type);
    // Maintain focus on amount field when switching types
    if (amountInput) {
      amountInput.focus({ preventScroll: true });
    }
  };

  // Update button click handlers to use the wrapped setType
  Object.entries(typeToggle.buttons).forEach(([type, btn]) => {
    // Remove existing click listeners by cloning the button
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    typeToggle.buttons[type] = newBtn;

    // Add new click handler that uses wrapped setType and tracks clicks
    newBtn.addEventListener('click', () => {
      ClickTracker.recordClick();
      typeToggle.setType(type);
    });

    // Re-add touch feedback
    newBtn.addEventListener(
      'touchstart',
      () => {
        newBtn.style.transform = 'scale(0.96)';
      },
      { passive: true }
    );

    newBtn.addEventListener(
      'touchend',
      () => {
        newBtn.style.transform = 'scale(1)';
      },
      { passive: true }
    );

    newBtn.addEventListener(
      'touchcancel',
      () => {
        newBtn.style.transform = 'scale(1)';
      },
      { passive: true }
    );
  });

  // 7. Note Field (Smart or Classic based on setting)
  let noteField = null;

  if (smartSuggestionsEnabled) {
    // Smart Note Field
    smartNoteField = SmartNoteField.create({
      onNoteChange: _note => {
        // Note changes don't affect other fields for now
      },
      onSuggestionSelect: suggestion => {
        smartNoteField.setNote(suggestion.note);
        ClickTracker.recordClick();
      },
      category: smartCategorySelector.getSelectedCategory(),
      amount: smartAmountInput.getAmount(),
      initialValue: initialValues.description || '',
    });
    // Add touch target classes
    smartNoteField.classList.add('touch-target-secondary');
    noteField = smartNoteField;
  } else {
    // Classic Note Field
    noteField = document.createElement('textarea');
    noteField.className = 'form-input';
    noteField.placeholder =
      getCopyString('transaction.notes') || 'Notes (optional)';
    noteField.value = initialValues.description || '';
    noteField.style.minHeight = '80px';
    noteField.style.resize = 'vertical';
    noteField.classList.add('touch-target-secondary');
  }

  // 7. Layout Assembly
  form.appendChild(amountAccountRow);

  // Category Label
  const catLabelId = 'category-selector-label';
  const catLabel = document.createElement('label');
  catLabel.textContent = 'Category';
  catLabel.id = catLabelId;
  catLabel.className = 'visually-hidden';
  form.appendChild(catLabel);
  categorySelector.container.setAttribute('aria-labelledby', catLabelId);
  form.appendChild(categorySelector.container);

  // Type Toggle (Label handled by fieldset/legend in utility later)
  form.appendChild(typeToggle.container);

  // Add note field directly
  if (noteField) {
    form.appendChild(noteField);
  }

  // 7.5. Cancel Button (for Add mode)
  if (showCancelButton && onCancel) {
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.style.width = '100%';
    cancelBtn.style.marginTop = 'var(--spacing-xs)';
    cancelBtn.style.padding = 'var(--spacing-md)';
    cancelBtn.style.fontSize = 'var(--font-size-base)';
    cancelBtn.style.fontWeight = '500';
    cancelBtn.style.borderRadius = 'var(--radius-md)';
    cancelBtn.style.border = `1px solid ${COLORS.BORDER}`;
    cancelBtn.style.background = COLORS.SURFACE;
    cancelBtn.style.color = COLORS.TEXT_MAIN;

    cancelBtn.addEventListener('click', onCancel);

    form.appendChild(cancelBtn);
  }

  // 8. OK Button for Edit Mode (hidden on mobile)
  if (initialValues.id) {
    const isMobile = window.mobileUtils && window.mobileUtils.isMobile();

    const okBtn = document.createElement('button');
    okBtn.textContent = 'OK';
    okBtn.className = 'btn btn-primary';
    okBtn.style.width = '100%';
    okBtn.style.marginTop = 'var(--spacing-sm)';
    okBtn.style.padding = 'var(--spacing-md)';
    okBtn.style.fontSize = FONT_SIZES.BUTTON_LARGE;
    okBtn.style.fontWeight = '600';
    okBtn.style.borderRadius = 'var(--radius-md)';

    // Adjust OK button for mobile devices
    if (isMobile) {
      okBtn.style.marginTop = 'var(--spacing-xs)';
      okBtn.style.padding = 'var(--spacing-sm)';
      okBtn.style.fontSize = FONT_SIZES.BASE;
      okBtn.style.height = 'auto';
      okBtn.style.minHeight = '44px'; // Accessible touch target
    }

    okBtn.addEventListener('click', () => {
      // Validate amount
      const amountValidation = validateAmount(amountInput.value);
      if (!amountValidation.valid) {
        showFieldError(amountInput);
        return;
      }

      // Validate category/transfer account
      const currentType = typeToggle.currentType();
      if (currentType === 'transfer') {
        const transferValidation = validateTransferAccount(
          categorySelector.selectedToAccount()
        );
        if (!transferValidation.valid) {
          showContainerError(categorySelector.chipContainer);
          return;
        }
      } else {
        const categoryValidation = validateCategory(
          categorySelector.selectedCategory(),
          currentType
        );
        if (!categoryValidation.valid) {
          showContainerError(categorySelector.chipContainer);
          return;
        }
      }

      // Prepare and submit data
      const transactionData = prepareTransactionData({
        amount: amountValidation.value,
        type: currentType,
        category: categorySelector.selectedCategory(),
        accountId: currentAccountId,
        toAccountId: categorySelector.selectedToAccount(),
        externalDateInput,
        description: noteField
          ? smartNoteField
            ? smartNoteField.getNote()
            : noteField.value
          : initialValues.description || '',
      });

      handleFormSubmit(transactionData, onSubmit);
    });

    // Remove mobile-specific classes to match other buttons
    okBtn.classList.remove('mobile-btn-primary', 'touch-target-primary');

    form.appendChild(okBtn);

    // 8.5. Delete Button (for Edit mode)
    if (onDelete) {
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete Transaction';
      deleteBtn.type = 'button';
      deleteBtn.className = 'btn btn-danger';
      deleteBtn.style.width = '100%';
      deleteBtn.style.marginTop = 'var(--spacing-sm)';
      deleteBtn.style.padding = 'var(--spacing-md)';
      deleteBtn.style.fontSize = 'var(--font-size-base)';
      deleteBtn.style.fontWeight = '500';
      deleteBtn.style.borderRadius = 'var(--radius-md)';
      deleteBtn.style.backgroundColor = 'transparent';
      deleteBtn.style.color = COLORS.ERROR;
      deleteBtn.style.border = `1px solid ${COLORS.ERROR}`;
      // Remove transition animation

      if (isMobile) {
        deleteBtn.style.marginTop = '0';
        deleteBtn.style.padding = 'var(--spacing-sm)';
        deleteBtn.style.fontSize = FONT_SIZES.BASE;
        deleteBtn.style.height = 'auto';
        deleteBtn.style.minHeight = '44px'; // Compact but clickable
      }

      // Remove hover effects (animations)

      deleteBtn.addEventListener('click', onDelete);

      form.appendChild(deleteBtn);
    }
  }

  // 9. Form submit prevention
  form.addEventListener('submit', e => e.preventDefault());

  // 10. Keyboard handling
  setupFormKeyboardHandling(form, [amountInput, accSelect]);

  // 11. Initial focus strategy for mobile keyboard
  const focusInput = () => {
    amountInput.focus({ preventScroll: true });
    // Click is sometimes needed on iOS to trigger keyboard if focus() is blocked
  };

  // Try immediately
  focusInput();

  // Try after short delay (render cycle)
  setTimeout(focusInput, 150);

  // Try one more time for slower devices
  setTimeout(focusInput, 450);

  return form;
};
