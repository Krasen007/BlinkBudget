/**
 * TransactionForm Component
 * Refactored to use extracted utilities - now ~180 lines (down from 724)
 */

import { StorageService } from '../core/storage.js';
import { SPACING, DIMENSIONS, TOUCH_TARGETS, FONT_SIZES, COLORS, HAPTIC_PATTERNS, TIMING } from '../utils/constants.js';
import { createSelect } from '../utils/dom-factory.js';
import { createTypeToggleGroup } from '../utils/form-utils/type-toggle.js';
import { createCategorySelector } from '../utils/form-utils/category-chips.js';
import { createAmountInput } from '../utils/form-utils/amount-input.js';
import { setupFormKeyboardHandling } from '../utils/form-utils/keyboard.js';
import { validateAmount, validateCategory, validateTransferAccount, showFieldError, showContainerError } from '../utils/form-utils/validation.js';
import { prepareTransactionData, handleFormSubmit } from '../utils/form-utils/submission.js';

export const TransactionForm = ({ onSubmit, initialValues = {}, externalDateInput = null, showCancelButton = false, onCancel = null }) => {
    // 1. Form setup
    const form = document.createElement('form');
    form.className = 'transaction-form mobile-optimized';
    form.style.display = 'flex';
    form.style.flexDirection = 'column';
    form.style.gap = window.mobileUtils?.isMobile() ? 'var(--spacing-xs)' : 'var(--spacing-sm)';
    form.style.width = '100%';
    form.style.position = 'relative';
    
    if (window.mobileUtils && window.mobileUtils.isMobile()) {
        form.style.justifyContent = 'flex-start';
    }
    
    // 2. Account Selection (Source)
    const accounts = StorageService.getAccounts();
    const defaultAccount = StorageService.getDefaultAccount();
    let currentAccountId = initialValues.accountId || defaultAccount.id;
    
    const accountGroup = document.createElement('div');
    accountGroup.style.flex = '1';
    
    const accSelect = createSelect({
        options: accounts.map(acc => ({
            value: acc.id,
            text: acc.name,
            selected: acc.id === currentAccountId
        })),
        className: 'mobile-form-select',
        style: { cursor: 'pointer' }
    });
    
    // Mobile-specific select handling
    accSelect.addEventListener('focus', () => {
        if (window.mobileUtils) {
            window.mobileUtils.preventInputZoom(accSelect);
        }
    });
    
    accountGroup.appendChild(accSelect);
    
    // 3. Type Toggle
    const typeToggle = createTypeToggleGroup({
        initialType: initialValues.type || 'expense'
    });
    
    // 4. Amount Input
    const amountState = createAmountInput({
        initialValue: initialValues.amount || '',
        externalDateInput
    });
    const amountInput = amountState.input;
    
    const amountGroup = document.createElement('div');
    amountGroup.style.flex = '1.5';
    amountGroup.style.marginBottom = '0';
    amountGroup.appendChild(amountInput);
    
    // 5. Amount and Account Row
    const amountAccountRow = document.createElement('div');
    amountAccountRow.style.display = 'flex';
    amountAccountRow.style.gap = 'var(--spacing-sm)';
    amountAccountRow.style.width = '100%';
    amountAccountRow.appendChild(amountGroup);
    amountAccountRow.appendChild(accountGroup);
    
    // 6. Category Selector
    const categorySelector = createCategorySelector({
        type: typeToggle.currentType(),
        accounts,
        currentAccountId,
        initialCategory: initialValues.category || null,
        initialToAccount: initialValues.toAccountId || null,
        amountInput,
        externalDateInput,
        onSubmit: (data) => {
            handleFormSubmit(data, onSubmit);
        }
    });
    
    // Setup type toggle change handler (after categorySelector is created)
    const originalSetType = typeToggle.setType;
    typeToggle.setType = (type) => {
        originalSetType(type);
        categorySelector.setType(type);
    };
    
    // Update button click handlers to use the wrapped setType
    Object.entries(typeToggle.buttons).forEach(([type, btn]) => {
        // Remove existing click listeners by cloning the button
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        typeToggle.buttons[type] = newBtn;
        
        // Add new click handler that uses wrapped setType
        newBtn.addEventListener('click', () => {
            typeToggle.setType(type);
            if (window.mobileUtils) {
                window.mobileUtils.hapticFeedback(HAPTIC_PATTERNS.LIGHT);
            }
        });
        
        // Re-add touch feedback
        newBtn.addEventListener('touchstart', () => {
            newBtn.style.transform = 'scale(0.96)';
            if (window.mobileUtils) {
                window.mobileUtils.hapticFeedback(HAPTIC_PATTERNS.LIGHT);
            }
        }, { passive: true });
        
        newBtn.addEventListener('touchend', () => {
            newBtn.style.transform = 'scale(1)';
        }, { passive: true });
        
        newBtn.addEventListener('touchcancel', () => {
            newBtn.style.transform = 'scale(1)';
        }, { passive: true });
    });
    
    // Setup account select change handler (after categorySelector is created)
    accSelect.addEventListener('change', (e) => {
        currentAccountId = e.target.value;
        if (window.mobileUtils) {
            window.mobileUtils.hapticFeedback(HAPTIC_PATTERNS.LIGHT);
        }
        // Always update category selector's source account for all transaction types
        categorySelector.setSourceAccount(currentAccountId);
    });
    
    // 7. Layout Assembly
    form.appendChild(amountAccountRow);
    form.appendChild(categorySelector.container);
    form.appendChild(typeToggle.container);
    
    // 7.5. Cancel Button (for Add mode)
    if (showCancelButton && onCancel) {
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn btn-secondary';
        cancelBtn.style.width = '100%';
        cancelBtn.style.marginTop = 'var(--spacing-sm)';
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
    
    // 8. OK Button for Edit Mode
    if (initialValues.id) {
        const okBtn = document.createElement('button');
        okBtn.textContent = 'OK';
        okBtn.className = 'btn btn-primary';
        okBtn.style.width = '100%';
        okBtn.style.marginTop = 'var(--spacing-sm)';
        okBtn.style.padding = 'var(--spacing-md)';
        okBtn.style.fontSize = FONT_SIZES.BUTTON_LARGE;
        okBtn.style.fontWeight = '600';
        okBtn.style.borderRadius = 'var(--radius-md)';
        
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
                const transferValidation = validateTransferAccount(categorySelector.selectedToAccount());
                if (!transferValidation.valid) {
                    showContainerError(categorySelector.chipContainer);
                    return;
                }
            } else {
                const categoryValidation = validateCategory(categorySelector.selectedCategory(), currentType);
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
                externalDateInput
            });
            
            handleFormSubmit(transactionData, onSubmit);
        });
        
        form.appendChild(okBtn);
    }
    
    // 9. Form submit prevention
    form.addEventListener('submit', (e) => e.preventDefault());
    
    // 10. Keyboard handling
    setupFormKeyboardHandling(form, [amountInput, accSelect]);
    
    // 11. Initial focus and haptic feedback
    setTimeout(() => {
        amountInput.focus();
        if (window.mobileUtils && window.mobileUtils.supportsHaptic()) {
            window.mobileUtils.hapticFeedback(HAPTIC_PATTERNS.WELCOME);
        }
    }, TIMING.INITIAL_LOAD_DELAY);
    
    return form;
};
