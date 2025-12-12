import { Button } from './Button.js';
import { StorageService } from '../core/storage.js';
import { MobileUtils } from '../core/mobile.js';

export const TransactionForm = ({ onSubmit, initialValues = {} }) => {
    const form = document.createElement('form');
    form.className = 'transaction-form';
    form.style.display = 'flex';
    form.style.flexDirection = 'column';
    form.style.gap = 'var(--spacing-lg)';
    form.style.width = '100%';

    // Account Selection (Source)
    const accounts = StorageService.getAccounts();
    const defaultAccount = StorageService.getDefaultAccount();

    // Allow passing in accountId if needed (e.g. from filter), otherwise default
    let currentAccountId = initialValues.accountId || defaultAccount.id;

    const accountGroup = document.createElement('div');
    accountGroup.style.marginBottom = 'var(--spacing-md)';

    const accSelect = document.createElement('select');
    accSelect.style.width = '100%';
    accSelect.style.padding = 'var(--spacing-md) var(--spacing-md)';
    accSelect.style.borderRadius = 'var(--radius-md)';
    accSelect.style.background = 'var(--color-surface)';
    accSelect.style.color = 'var(--color-text-main)';
    accSelect.style.border = '1px solid var(--color-border)';
    accSelect.style.fontSize = 'max(16px, var(--font-size-base))'; // Prevent zoom on iOS
    accSelect.style.cursor = 'pointer';
    accSelect.style.outline = 'none';
    accSelect.style.appearance = 'auto';
    accSelect.style.minHeight = 'var(--touch-target-min)'; // Touch-friendly height
    accSelect.className = 'input-select touch-target';

    accounts.forEach(acc => {
        const opt = document.createElement('option');
        opt.value = acc.id;
        opt.textContent = acc.name;
        if (acc.id === currentAccountId) opt.selected = true;
        accSelect.appendChild(opt);
    });

    accSelect.addEventListener('change', (e) => {
        currentAccountId = e.target.value;
        
        // Haptic feedback for account selection
        if (window.mobileUtils) {
            window.mobileUtils.hapticFeedback([10]); // Light haptic for selection
        }
    });
    
    // Mobile-specific select handling
    const handleSelectFocus = () => {
        if (window.mobileUtils) {
            window.mobileUtils.preventInputZoom(accSelect);
        }
        accSelect.style.borderColor = 'var(--color-primary)';
    };
    
    const handleSelectBlur = () => {
        accSelect.style.borderColor = 'var(--color-border)';
    };
    
    accSelect.addEventListener('focus', handleSelectFocus);
    accSelect.addEventListener('blur', handleSelectBlur);

    accountGroup.appendChild(accSelect);
    form.appendChild(accountGroup);

    // Type Toggle
    let currentType = initialValues.type || 'expense';
    const typeGroup = document.createElement('div');
    typeGroup.style.display = 'flex';
    typeGroup.style.gap = 'var(--spacing-md)';
    typeGroup.style.marginBottom = 'var(--spacing-md)';

    const createTypeBtn = (type, label) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = label;
        btn.className = 'btn type-toggle-btn';
        btn.style.flex = '1';
        btn.style.border = '1px solid var(--color-border)';
        
        // Touch-friendly sizing
        btn.style.minHeight = 'var(--touch-target-min)';
        btn.style.margin = 'calc(var(--touch-spacing-min) / 2)';

        const updateState = () => {
            const isActive = currentType === type;
            btn.style.background = isActive ? (type === 'expense' ? 'var(--color-primary)' : '#10b981') : 'transparent';
            btn.style.borderColor = isActive ? 'transparent' : 'var(--color-border)';
            btn.style.color = isActive ? 'white' : 'var(--color-text-muted)';
        };

        btn.addEventListener('click', () => {
            currentType = type;
            Array.from(typeGroup.children).forEach(b => b.updateState());
        });

        // Enhanced touch feedback
        btn.addEventListener('touchstart', (e) => {
            btn.style.transform = 'scale(0.96)';
            // Enhanced haptic feedback for form interactions
            if (window.mobileUtils) {
                window.mobileUtils.hapticFeedback([10]); // Light haptic for type toggle
            }
        }, { passive: true });

        btn.addEventListener('touchend', () => {
            btn.style.transform = 'scale(1)';
        }, { passive: true });

        btn.addEventListener('touchcancel', () => {
            btn.style.transform = 'scale(1)';
        }, { passive: true });

        // Hover effect for uniformity (desktop)
        btn.addEventListener('mouseenter', () => {
            if (currentType !== type) {
                btn.style.borderColor = 'var(--color-text-muted)';
                btn.style.backgroundColor = 'var(--color-surface-hover)';
            }
        });

        btn.addEventListener('mouseleave', () => {
            if (currentType !== type) {
                btn.style.borderColor = 'var(--color-border)';
                btn.style.backgroundColor = 'transparent';
            }
        });

        btn.updateState = updateState;
        return btn;
    };

    const expenseBtn = createTypeBtn('expense', 'Expense');
    const incomeBtn = createTypeBtn('income', 'Income');
    const transferBtn = createTypeBtn('transfer', 'Transfer'); // New Type

    // Initial state
    expenseBtn.updateState();
    incomeBtn.updateState();
    transferBtn.updateState();

    typeGroup.appendChild(expenseBtn);
    typeGroup.appendChild(incomeBtn);
    typeGroup.appendChild(transferBtn);
    form.appendChild(typeGroup);

    // Date Input
    const dateGroup = document.createElement('div');

    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.style.width = '100%';
    dateInput.style.padding = 'var(--spacing-md)';
    dateInput.style.borderRadius = 'var(--radius-md)';
    dateInput.style.border = '1px solid var(--color-border)';
    dateInput.style.background = 'var(--color-surface)';
    dateInput.style.color = 'var(--color-text-main)';
    dateInput.style.fontSize = 'max(16px, var(--font-size-base))'; // Prevent zoom on iOS
    dateInput.style.minHeight = 'var(--touch-target-min)'; // Touch-friendly height
    
    // Default to initial value or Today
    const defaultDate = initialValues.timestamp ? initialValues.timestamp.split('T')[0] : new Date().toISOString().split('T')[0];
    dateInput.value = defaultDate;
    
    // Mobile-specific date input handling
    const handleDateFocus = () => {
        if (window.mobileUtils) {
            window.mobileUtils.preventInputZoom(dateInput);
        }
        dateInput.style.borderColor = 'var(--color-primary)';
    };
    
    const handleDateBlur = () => {
        dateInput.style.borderColor = 'var(--color-border)';
    };
    
    dateInput.addEventListener('focus', handleDateFocus);
    dateInput.addEventListener('blur', handleDateBlur);

    dateGroup.appendChild(dateInput);
    form.appendChild(dateGroup);

    // Amount Input
    const amountGroup = document.createElement('div');

    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.value = initialValues.amount || '';
    amountInput.step = '0.01';
    amountInput.required = true;
    amountInput.placeholder = '0.00';
    amountInput.style.width = '100%';
    amountInput.style.padding = 'var(--spacing-md)';
    amountInput.style.fontSize = '2rem';
    amountInput.style.borderRadius = 'var(--radius-md)';
    amountInput.style.border = '1px solid var(--color-border)';
    amountInput.style.background = 'var(--color-surface)';
    amountInput.style.color = 'var(--color-text-main)';
    
    // Mobile-specific optimizations
    amountInput.inputMode = 'decimal'; // Show numeric keypad on mobile
    amountInput.pattern = '[0-9]*\\.?[0-9]*'; // Numeric pattern for better mobile keyboard
    amountInput.style.fontSize = 'max(16px, 2rem)'; // Prevent zoom on iOS
    amountInput.style.minHeight = 'var(--touch-target-min)'; // Touch-friendly height
    
    // Keyboard-aware viewport adjustments
    const handleAmountFocus = () => {
        // Prevent zoom on input focus
        if (window.mobileUtils) {
            window.mobileUtils.preventInputZoom(amountInput);
            
            // Scroll input into view above keyboard with delay for keyboard animation
            setTimeout(() => {
                window.mobileUtils.scrollIntoViewAboveKeyboard(amountInput, 60);
            }, 300);
        }
        
        // Visual feedback
        amountInput.style.borderColor = 'var(--color-primary)';
        amountInput.style.boxShadow = '0 0 0 3px hsla(var(--primary-hue), var(--primary-sat), var(--primary-light), 0.1)';
    };
    
    const handleAmountBlur = () => {
        amountInput.style.borderColor = 'var(--color-border)';
        amountInput.style.boxShadow = 'none';
    };
    
    amountInput.addEventListener('focus', handleAmountFocus);
    amountInput.addEventListener('blur', handleAmountBlur);

    amountGroup.appendChild(amountInput);

    // Categories / Destination Account
    const categoryGroup = document.createElement('div');

    const categoryDefinitions = {
        // Expense
        'Food & Groceries': 'Supermarket runs, bakery, household supplies bought at the grocery store.',
        'Dining & Coffee': 'Restaurants, fast food, coffee shops, food delivery apps.',
        'Housing & Bills': 'Rent, Mortgage, Utilities (Electricity/Water/Internet), Repairs, Taxes.',
        'Transportation': 'Car payments, gas, maintenance, public transit tickets, Uber/Lyft.',
        'Leisure & Shopping': 'Shopping (clothes/gadgets), hobbies, movies, subscriptions (Netflix/Spotify), vacations.',
        'Personal Care': 'Medical bills, pharmacy, gym memberships, haircuts, tuition/school fees (Education).',
        // Income
        'Paycheck': 'Most reliable source',
        'Business / Freelance': 'Variable, side income',
        'Investment Income': 'Dividends, interest, profits',
        'Other / Gift': 'Everything else, like cash gifts'
    };

    const categoryColors = {
        // Expense
        'Food & Groceries': '#10b981', // Green
        'Dining & Coffee': '#f97316', // Orange
        'Housing & Bills': '#3b82f6', // Blue
        'Transportation': '#eab308', // Yellow
        'Leisure & Shopping': '#a855f7', // Purple
        'Personal Care': '#ffffff',    // White
        // Income
        'Paycheck': '#10b981', // Green
        'Business / Freelance': '#f97316', // Orange
        'Investment Income': '#3b82f6', // Blue
        'Other / Gift': '#eab308' // Yellow
    };

    const categoryOptions = {
        expense: ['Food & Groceries', 'Dining & Coffee', 'Housing & Bills', 'Transportation', 'Leisure & Shopping', 'Personal Care'],
        income: ['Paycheck', 'Business / Freelance', 'Investment Income', 'Other / Gift'],
        refund: ['Food & Groceries', 'Dining & Coffee', 'Housing & Bills', 'Transportation', 'Leisure & Shopping', 'Personal Care']
    };

    const chipContainer = document.createElement('div');
    chipContainer.style.display = 'flex';
    chipContainer.style.flexWrap = 'wrap';
    chipContainer.style.gap = 'var(--spacing-sm)';

    let selectedCategory = initialValues.category || null; // Or toAccountId for transfers
    let selectedToAccount = initialValues.toAccountId || null;

    const renderCategories = () => {
        chipContainer.innerHTML = ''; // Clear existing

        if (currentType === 'transfer') {
            // Render Accounts as destinations (exclude current source)
            const targets = accounts.filter(a => a.id !== currentAccountId);

            if (targets.length === 0) {
                const msg = document.createElement('p');
                msg.textContent = 'No other accounts to transfer to.';
                msg.style.color = 'var(--color-text-muted)';
                msg.style.fontSize = '0.875rem';
                chipContainer.appendChild(msg);
                return;
            }

            targets.forEach(acc => {
                const chip = document.createElement('button');
                const updateChipState = () => {
                    const isSelected = selectedToAccount === acc.id;
                    chip.style.background = isSelected ? 'var(--color-primary-light)' : 'transparent';
                    chip.style.color = isSelected ? 'var(--color-background)' : 'var(--color-text-muted)';
                    chip.style.borderColor = isSelected ? 'var(--color-primary)' : 'var(--color-border)';
                };

                chip.type = 'button';
                chip.textContent = acc.name;
                chip.className = 'btn category-chip';
                chip.style.border = '1px solid var(--color-border)';
                chip.style.transition = 'all 0.2s ease';
                
                // Touch-friendly sizing for transfer chips
                chip.style.minHeight = 'var(--touch-target-min)';
                chip.style.padding = 'var(--spacing-md) var(--spacing-lg)';
                chip.style.margin = 'var(--spacing-xs)';

                // Enhanced touch feedback for transfer chips
                chip.addEventListener('touchstart', (e) => {
                    chip.style.transform = 'scale(0.95)';
                    chip.style.boxShadow = '0 0 12px var(--color-primary)60';
                    // Enhanced haptic feedback for form interactions
                    if (window.mobileUtils) {
                        window.mobileUtils.hapticFeedback([15]); // Light haptic for touch start
                    }
                }, { passive: true });

                chip.addEventListener('touchend', () => {
                    chip.style.transform = 'scale(1)';
                    if (selectedToAccount !== acc.id) {
                        chip.style.boxShadow = 'none';
                    }
                }, { passive: true });

                chip.addEventListener('touchcancel', () => {
                    chip.style.transform = 'scale(1)';
                    if (selectedToAccount !== acc.id) {
                        chip.style.boxShadow = 'none';
                    }
                }, { passive: true });

                updateChipState();
                chipContainer.appendChild(chip);

                chip.addEventListener('click', () => {
                    // Validate Amount
                    const amountVal = parseFloat(amountInput.value);
                    if (isNaN(amountVal) || amountVal === 0) {
                        amountInput.focus();
                        amountInput.style.borderColor = '#ef4444';
                        
                        // Error haptic feedback
                        if (window.mobileUtils) {
                            window.mobileUtils.hapticFeedback([50, 50, 50]); // Error pattern
                        }
                        return;
                    }

                    selectedToAccount = acc.id;

                    // Success haptic feedback for transfer completion
                    if (window.mobileUtils) {
                        window.mobileUtils.hapticFeedback([25, 25, 50]); // Success pattern
                    }

                    // Auto-submit for Transfer
                    onSubmit({
                        amount: Math.abs(amountVal),
                        category: 'Transfer', // Fixed category for transfers
                        type: 'transfer',
                        accountId: currentAccountId,
                        toAccountId: selectedToAccount,
                        timestamp: new Date(dateInput.value).toISOString()
                    });
                });

                updateChipState();
                chipContainer.appendChild(chip);
            });

        } else {
            // Standard Categories
            const currentCats = categoryOptions[currentType] || categoryOptions.expense;

            currentCats.forEach(cat => {
                const chip = document.createElement('button');
                const updateChipState = () => {
                    const isSelected = selectedCategory === cat;
                    chip.style.background = isSelected ? 'var(--color-primary-light)' : 'transparent';
                    chip.style.color = isSelected ? 'var(--color-background)' : 'var(--color-text-muted)';
                    chip.style.borderColor = isSelected ? 'var(--color-primary)' : 'var(--color-border)';
                };

                chip.type = 'button';
                chip.textContent = cat;
                // Add hover text if definition exists
                if (categoryDefinitions[cat]) {
                    chip.title = categoryDefinitions[cat];
                }
                chip.className = 'btn category-chip';
                chip.style.border = '1px solid var(--color-border)';
                chip.style.transition = 'all 0.2s ease'; // Smooth transition
                
                // Touch-friendly sizing for category chips
                chip.style.minHeight = 'var(--touch-target-min)';
                chip.style.padding = 'var(--spacing-md) var(--spacing-lg)';
                chip.style.margin = 'var(--spacing-xs)';

                const catColor = categoryColors[cat] || 'var(--color-primary)';

                // Enhanced touch feedback for category chips
                chip.addEventListener('touchstart', (e) => {
                    chip.style.transform = 'scale(0.95)';
                    chip.style.boxShadow = `0 0 12px ${catColor}60`;
                    // Enhanced haptic feedback for form interactions
                    if (window.mobileUtils) {
                        window.mobileUtils.hapticFeedback([15]); // Light haptic for touch start
                    }
                }, { passive: true });

                chip.addEventListener('touchend', () => {
                    chip.style.transform = 'scale(1)';
                    if (selectedCategory !== cat) {
                        chip.style.boxShadow = 'none';
                    }
                }, { passive: true });

                chip.addEventListener('touchcancel', () => {
                    chip.style.transform = 'scale(1)';
                    if (selectedCategory !== cat) {
                        chip.style.boxShadow = 'none';
                    }
                }, { passive: true });

                // Hover effects for desktop
                chip.addEventListener('mouseenter', () => {
                    if (selectedCategory !== cat) {
                        chip.style.borderColor = catColor;
                        chip.style.color = catColor;
                        chip.style.boxShadow = `0 0 8px ${catColor}40`; // Subtle glow
                    }
                });

                chip.addEventListener('mouseleave', () => {
                    if (selectedCategory !== cat) {
                        chip.style.borderColor = 'var(--color-border)';
                        chip.style.color = 'var(--color-text-muted)';
                        chip.style.boxShadow = 'none';
                    }
                });

                updateChipState(); // Initial Render

                chip.addEventListener('click', () => {
                    // Validate Amount first
                    const amountVal = parseFloat(amountInput.value);
                    if (isNaN(amountVal) || amountVal === 0) {
                        amountInput.focus();
                        amountInput.style.borderColor = '#ef4444'; // Red border for error
                        setTimeout(() => amountInput.style.borderColor = 'var(--color-border)', 2000);
                        
                        // Error haptic feedback
                        if (window.mobileUtils) {
                            window.mobileUtils.hapticFeedback([50, 50, 50]); // Error pattern
                        }
                        return;
                    }

                    // Visual feedback
                    Array.from(chipContainer.children).forEach(c => {
                        c.style.background = 'transparent';
                        c.style.color = 'var(--color-text-muted)';
                        c.style.borderColor = 'var(--color-border)';
                    });

                    selectedCategory = cat;
                    updateChipState();

                    // Success haptic feedback for form completion
                    if (window.mobileUtils) {
                        window.mobileUtils.hapticFeedback([25, 25, 50]); // Success pattern
                    }

                    // Auto-submit
                    onSubmit({
                        amount: Math.abs(amountVal),
                        category: selectedCategory,
                        type: currentType,
                        accountId: currentAccountId, // Pass selected account
                        timestamp: new Date(dateInput.value).toISOString() // Use selected date
                    });
                });
                chipContainer.appendChild(chip);
            });
        }
    };

    renderCategories(); // Initial render

    // Update categories when type changes
    [expenseBtn, incomeBtn, transferBtn].forEach(btn => {
        btn.addEventListener('click', () => {
            selectedCategory = null;
            selectedToAccount = null;
            renderCategories();
        });
    });

    // Re-render if account changes (to filter out source from destination list for transfers)
    accSelect.addEventListener('change', () => {
        if (currentType === 'transfer') renderCategories();
    });

    categoryGroup.appendChild(chipContainer);

    // Remove separate submit button as per "Auto-save" requirement
    // form.appendChild(submitBtn); 

    form.appendChild(amountGroup);
    form.appendChild(categoryGroup);
    // form.appendChild(submitBtn);

    // No submit handler needed on form itself, but keep preventDefault just in case
    form.addEventListener('submit', (e) => e.preventDefault());

    // Keyboard-aware viewport adjustments for the entire form
    const setupKeyboardHandling = () => {
        if (!window.mobileUtils || !window.mobileUtils.isMobile()) return;
        
        const formInputs = [amountInput, dateInput, accSelect];
        
        formInputs.forEach(input => {
            input.addEventListener('focus', () => {
                // Add class to body for keyboard-aware styling
                document.body.classList.add('keyboard-visible');
                
                // Adjust form positioning for keyboard
                form.style.paddingBottom = '20vh'; // Extra space for keyboard
                
                // Scroll the focused input into view with delay for keyboard animation
                setTimeout(() => {
                    if (window.mobileUtils) {
                        window.mobileUtils.scrollIntoViewAboveKeyboard(input, 80);
                    }
                }, 300);
            });
            
            input.addEventListener('blur', () => {
                // Check if any input still has focus before removing keyboard class
                setTimeout(() => {
                    const hasActiveFocus = formInputs.some(inp => document.activeElement === inp);
                    if (!hasActiveFocus) {
                        document.body.classList.remove('keyboard-visible');
                        form.style.paddingBottom = '0';
                    }
                }, 100);
            });
        });
        
        // Handle visual viewport changes (keyboard show/hide)
        if (window.visualViewport) {
            const handleViewportChange = () => {
                const keyboardHeight = window.innerHeight - window.visualViewport.height;
                
                if (keyboardHeight > 100) { // Keyboard is visible
                    document.body.classList.add('keyboard-visible');
                    form.style.paddingBottom = `${keyboardHeight + 20}px`;
                } else { // Keyboard is hidden
                    document.body.classList.remove('keyboard-visible');
                    form.style.paddingBottom = '0';
                }
            };
            
            window.visualViewport.addEventListener('resize', handleViewportChange);
            
            // Cleanup function (would be called when component is destroyed)
            form._cleanupKeyboardHandling = () => {
                window.visualViewport.removeEventListener('resize', handleViewportChange);
            };
        }
    };
    
    // Initialize keyboard handling
    setupKeyboardHandling();

    // Focus amount on load with delay to ensure mobile utils are ready
    setTimeout(() => {
        amountInput.focus();
        
        // Initial haptic feedback to indicate form is ready
        if (window.mobileUtils && window.mobileUtils.supportsHaptic()) {
            window.mobileUtils.hapticFeedback([5]); // Very light welcome haptic
        }
    }, 100);

    return form;
};
