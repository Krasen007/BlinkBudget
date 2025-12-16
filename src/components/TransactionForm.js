import { StorageService } from '../core/storage.js';

export const TransactionForm = ({ onSubmit, initialValues = {}, externalDateInput = null }) => {
    const form = document.createElement('form');
    form.className = 'transaction-form mobile-optimized';
    form.style.display = 'flex';
    form.style.flexDirection = 'column';
    // Tighter spacing on mobile to fit with keyboard
    form.style.gap = window.mobileUtils?.isMobile() ? 'var(--spacing-xs)' : 'var(--spacing-sm)';
    form.style.width = '100%';
    form.style.position = 'relative';

    // Mobile-first layout optimization - removed fixed height to prevent empty space
    if (window.mobileUtils && window.mobileUtils.isMobile()) {
        form.style.justifyContent = 'flex-start'; // Start from top, let content flow naturally
    }

    // Account Selection (Source)
    const accounts = StorageService.getAccounts();
    const defaultAccount = StorageService.getDefaultAccount();

    // Allow passing in accountId if needed (e.g. from filter), otherwise default
    let currentAccountId = initialValues.accountId || defaultAccount.id;

    // Account group will be styled when added to row
    const accountGroup = document.createElement('div');
    accountGroup.style.flex = '1'; // 40% of space

    const accSelect = document.createElement('select');
    accSelect.className = 'mobile-form-select';
    accSelect.style.width = '100%';
    accSelect.style.cursor = 'pointer';

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
    accSelect.addEventListener('focus', () => {
        if (window.mobileUtils) {
            window.mobileUtils.preventInputZoom(accSelect);
        }
    });

    accountGroup.appendChild(accSelect);
    // Elements created but appended at valid order at the bottom
    // accountGroup, typeGroup, dateGroup, amountGroup


    // Type Toggle
    let currentType = initialValues.type || 'expense';
    const typeGroup = document.createElement('div');
    typeGroup.style.display = 'flex';
    typeGroup.style.gap = 'var(--spacing-md)';
    typeGroup.style.marginBottom = 'var(--spacing-xs)';

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
            let activeColor;
            switch (type) {
                case 'expense':
                    activeColor = 'var(--color-primary)';
                    break;
                case 'income':
                    activeColor = '#10b981';
                    break;
                case 'refund':
                    activeColor = '#06b6d4'; // Teal/cyan for refunds
                    break;
                default:
                    activeColor = '#10b981';
            }
            btn.style.background = isActive ? activeColor : 'transparent';
            btn.style.border = isActive ? '1px solid transparent' : '1px solid var(--color-border)';
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
                btn.style.border = '1px solid var(--color-text-muted)';
                btn.style.backgroundColor = 'var(--color-surface-hover)';
            }
        });

        btn.addEventListener('mouseleave', () => {
            if (currentType !== type) {
                btn.style.border = '1px solid var(--color-border)';
                btn.style.backgroundColor = 'transparent';
            }
        });

        btn.updateState = updateState;
        return btn;
    };

    const expenseBtn = createTypeBtn('expense', 'Expense');
    const incomeBtn = createTypeBtn('income', 'Income');
    const transferBtn = createTypeBtn('transfer', 'Transfer');
    const refundBtn = createTypeBtn('refund', 'Refund'); // New refund type

    // Initial state
    expenseBtn.updateState();
    incomeBtn.updateState();
    transferBtn.updateState();
    refundBtn.updateState();

    typeGroup.appendChild(expenseBtn);
    typeGroup.appendChild(incomeBtn);
    typeGroup.appendChild(transferBtn);
    typeGroup.appendChild(refundBtn);
    // typeGroup ready (appended at bottom)
    // Date input removed - using externalDateInput from AddView.js (top of page)

    // Amount and Account Row - Side by Side
    const amountAccountRow = document.createElement('div');
    amountAccountRow.style.display = 'flex';
    amountAccountRow.style.gap = 'var(--spacing-sm)';
    amountAccountRow.style.width = '100%';

    // Amount Input (60% width)
    const amountGroup = document.createElement('div');
    amountGroup.style.flex = '1.5'; // 60% of space
    amountGroup.style.marginBottom = '0'; // Remove bottom margin

    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.value = initialValues.amount || '';
    amountInput.step = '0.01';
    amountInput.required = true;
    amountInput.placeholder = '0.00';
    amountInput.className = 'mobile-form-input';
    amountInput.style.width = '100%';
    amountInput.style.fontSize = '1.5rem'; // Larger font for amount input

    // Mobile-specific optimizations
    amountInput.inputMode = 'decimal'; // Show numeric keypad on mobile
    amountInput.pattern = '[0-9]*\\.?[0-9]*'; // Numeric pattern for better mobile keyboard

    // Keyboard-aware viewport adjustments
    amountInput.addEventListener('focus', () => {
        // Prevent zoom on input focus
        if (window.mobileUtils) {
            window.mobileUtils.preventInputZoom(amountInput);

            // Scroll input into view above keyboard with delay for keyboard animation
            setTimeout(() => {
                window.mobileUtils.scrollIntoViewAboveKeyboard(amountInput, 60);
            }, 300);
        }
    });

    amountGroup.appendChild(amountInput);

    // Add both to row
    amountAccountRow.appendChild(amountGroup);
    amountAccountRow.appendChild(accountGroup);

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
    chipContainer.className = 'category-chip-container';
    chipContainer.style.display = 'grid';
    chipContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(140px, 1fr))';
    chipContainer.style.gap = 'var(--spacing-sm)';
    chipContainer.style.padding = 'var(--spacing-sm)';
    chipContainer.style.borderRadius = 'var(--radius-md)';
    chipContainer.style.background = 'var(--color-surface)';
    chipContainer.style.border = '1px solid var(--color-border)';

    // Show all categories without scrolling, but contain them properly
    // Don't set overflow:visible as it causes overlap
    chipContainer.style.overflow = 'hidden'; // Contain the grid
    chipContainer.style.marginBottom = 'var(--spacing-md)'; // Add space before type toggle

    // Keyboard-aware: scrollable when keyboard open, show all when closed
    chipContainer.style.overflowY = 'auto';
    chipContainer.style.overflowX = 'hidden';
    chipContainer.style.webkitOverflowScrolling = 'touch';

    // Calculate max-height based on keyboard state
    const calculateCategoryHeight = () => {
        if (!window.mobileUtils?.isMobile()) {
            return 'none'; // Desktop - no restriction
        }

        const viewportHeight = window.visualViewport?.height || window.innerHeight;

        // Space used: amount+account row (60px) + type toggle (60px) + margins (~80px)
        const fixedElementsHeight = 200;
        const availableHeight = viewportHeight - fixedElementsHeight;

        // Allow enough height to show all 6 categories (2 rows x 56px + gaps)
        const minHeight = 140; // Minimum for scrolling
        const idealHeight = 250; // Enough for 2 full rows

        return `${Math.max(minHeight, Math.min(idealHeight, availableHeight))}px`;
    };

    chipContainer.style.maxHeight = calculateCategoryHeight();

    // Update on keyboard open/close
    if (window.visualViewport) {
        const updateHeight = () => {
            chipContainer.style.maxHeight = calculateCategoryHeight();
        };
        window.visualViewport.addEventListener('resize', updateHeight);
        form._cleanupCategoryHeight = () => {
            window.visualViewport.removeEventListener('resize', updateHeight);
        };
    }

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
                    chip.style.border = isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)';
                };

                chip.type = 'button';
                chip.textContent = acc.name;
                chip.className = 'btn category-chip';
                chip.style.border = '1px solid var(--color-border)';
                chip.style.transition = 'all 0.2s ease';
                chip.style.borderRadius = 'var(--radius-lg)';

                // Enhanced touch-friendly sizing for transfer chips
                chip.style.minHeight = '56px'; // Larger than minimum for better thumb navigation
                chip.style.padding = 'var(--spacing-lg) var(--spacing-xl)';
                chip.style.margin = '0'; // Remove margin since grid handles spacing
                chip.style.fontSize = 'var(--font-size-base)';
                chip.style.fontWeight = '500';
                chip.style.display = 'flex';
                chip.style.alignItems = 'center';
                chip.style.justifyContent = 'center';
                chip.style.textAlign = 'center';
                chip.style.whiteSpace = 'nowrap';
                chip.style.overflow = 'hidden';
                chip.style.textOverflow = 'ellipsis';

                // Enhanced touch feedback for transfer chips - optimized for thumb navigation
                chip.addEventListener('touchstart', (e) => {
                    chip.style.boxShadow = '0 4px 20px var(--color-primary)60';
                    chip.style.border = '1px solid var(--color-primary)';
                    // Enhanced haptic feedback for form interactions
                    if (window.mobileUtils) {
                        window.mobileUtils.hapticFeedback([15]); // Light haptic for touch start
                    }
                }, { passive: true });

                chip.addEventListener('touchend', () => {
                    if (selectedToAccount !== acc.id) {
                        chip.style.boxShadow = 'none';
                        chip.style.border = '1px solid var(--color-border)';
                    }
                }, { passive: true });

                chip.addEventListener('touchcancel', () => {
                    if (selectedToAccount !== acc.id) {
                        chip.style.boxShadow = 'none';
                        chip.style.border = '1px solid var(--color-border)';
                    }
                }, { passive: true });

                updateChipState();
                chipContainer.appendChild(chip);

                chip.addEventListener('click', () => {
                    // Validate Amount
                    const amountVal = parseFloat(amountInput.value);
                    if (isNaN(amountVal) || amountVal === 0) {
                        amountInput.focus();
                        amountInput.style.border = '1px solid #ef4444';

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
                    chip.style.border = isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)';
                };

                chip.type = 'button';
                chip.textContent = cat;
                // Add hover text if definition exists
                if (categoryDefinitions[cat]) {
                    chip.title = categoryDefinitions[cat];
                }
                chip.className = 'btn category-chip';
                chip.style.border = '1px solid var(--color-border)';
                chip.style.transition = 'all 0.2s ease';
                chip.style.borderRadius = 'var(--radius-lg)';

                // Enhanced touch-friendly sizing for category chips - optimized for thumb navigation
                chip.style.minHeight = '56px'; // Larger than minimum for better thumb reach
                chip.style.padding = 'var(--spacing-lg) var(--spacing-xl)';
                chip.style.margin = '0'; // Remove margin since grid handles spacing
                chip.style.fontSize = 'var(--font-size-base)';
                chip.style.fontWeight = '500';
                chip.style.display = 'flex';
                chip.style.alignItems = 'center';
                chip.style.justifyContent = 'center';
                chip.style.textAlign = 'center';
                chip.style.whiteSpace = 'nowrap';
                chip.style.overflow = 'hidden';
                chip.style.textOverflow = 'ellipsis';

                const catColor = categoryColors[cat] || 'var(--color-primary)';

                // Enhanced touch feedback for category chips - optimized for thumb navigation
                chip.addEventListener('touchstart', (e) => {
                    chip.style.boxShadow = `0 4px 20px ${catColor} 60`;
                    chip.style.border = `1px solid ${catColor} `;
                    // Enhanced haptic feedback for form interactions
                    if (window.mobileUtils) {
                        window.mobileUtils.hapticFeedback([15]); // Light haptic for touch start
                    }
                }, { passive: true });

                chip.addEventListener('touchend', () => {
                    if (selectedCategory !== cat) {
                        chip.style.boxShadow = 'none';
                        chip.style.border = '1px solid var(--color-border)';
                    }
                }, { passive: true });

                chip.addEventListener('touchcancel', () => {
                    if (selectedCategory !== cat) {
                        chip.style.boxShadow = 'none';
                        chip.style.border = '1px solid var(--color-border)';
                    }
                }, { passive: true });

                // Hover effects for desktop
                chip.addEventListener('mouseenter', () => {
                    if (selectedCategory !== cat) {
                        chip.style.border = `1px solid ${catColor} `;
                        chip.style.color = catColor;
                        chip.style.boxShadow = `0 0 8px ${catColor} 40`; // Subtle glow
                    }
                });

                chip.addEventListener('mouseleave', () => {
                    if (selectedCategory !== cat) {
                        chip.style.border = '1px solid var(--color-border)';
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
                        amountInput.style.border = '1px solid #ef4444'; // Red border for error
                        setTimeout(() => amountInput.style.border = '1px solid var(--color-border)', 2000);

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
                        c.style.border = '1px solid var(--color-border)';
                    });

                    selectedCategory = cat;
                    updateChipState();

                    // Success haptic feedback for form completion
                    try {
                        if (window.mobileUtils) {
                            window.mobileUtils.hapticFeedback([25, 25, 50]); // Success pattern
                        }
                    } catch (e) {
                        console.error('Haptic feedback failed:', e);
                    }

                    // Auto-submit
                    try {
                        // Use external date input from AddView.js
                        const dateSource = externalDateInput || document.createElement('input');
                        dateSource.value = dateSource.value || new Date().toISOString().split('T')[0];

                        onSubmit({
                            amount: Math.abs(amountVal),
                            category: selectedCategory,
                            type: currentType,
                            accountId: currentAccountId, // Pass selected account
                            timestamp: new Date(dateSource.value).toISOString() // Use selected date
                        });
                    } catch (e) {
                        console.error('Submit failed:', e);
                        alert('Error submitting transaction: ' + e.message);
                    }
                });
                chipContainer.appendChild(chip);
            });
        }
    };

    renderCategories(); // Initial render

    // Update categories when type changes
    [expenseBtn, incomeBtn, transferBtn, refundBtn].forEach(btn => {
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

    // --- REORDERED LAYOUT (Amount+Account Row -> Categories -> Type) ---
    // Amount and Account are side-by-side to save vertical space

    // 1. Amount + Account Row
    form.appendChild(amountAccountRow);

    // 3. Categories (Main selection area)
    form.appendChild(categoryGroup);

    // 4. Type (Last - often inferred from category selection)
    form.appendChild(typeGroup);

    // --- OK Button for Edit Mode ---
    // User requested "OK" button when editing.
    // We infer Edit mode if initialValues.id exists (it's an existing transaction)
    if (initialValues.id) {
        const okBtn = document.createElement('button');
        okBtn.textContent = 'OK';
        okBtn.className = 'btn btn-primary';
        okBtn.style.width = '100%';
        okBtn.style.marginTop = 'var(--spacing-sm)';
        okBtn.style.padding = 'var(--spacing-md)';
        okBtn.style.fontSize = '1.1rem';
        okBtn.style.fontWeight = '600';
        okBtn.style.borderRadius = 'var(--radius-md)';

        okBtn.addEventListener('click', () => {
            // Validate Amount
            const amountVal = parseFloat(amountInput.value);
            if (isNaN(amountVal) || amountVal === 0) {
                amountInput.focus();
                amountInput.style.border = '1px solid #ef4444';
                if (window.mobileUtils) window.mobileUtils.hapticFeedback([50, 50, 50]);
                return;
            }

            // Validate Category (Must be selected)
            if (!selectedCategory && currentType !== 'transfer') {
                // Highlight category container
                chipContainer.style.border = '1px solid #ef4444';
                setTimeout(() => chipContainer.style.border = '1px solid var(--color-border)', 2000);
                if (window.mobileUtils) window.mobileUtils.hapticFeedback([50, 50, 50]);
                return;
            }

            if (currentType === 'transfer' && !selectedToAccount) {
                // Highlight category container
                chipContainer.style.border = '1px solid #ef4444';
                setTimeout(() => chipContainer.style.border = '1px solid var(--color-border)', 2000);
                if (window.mobileUtils) window.mobileUtils.hapticFeedback([50, 50, 50]);
                return;
            }

            // Submit - use external date input
            try {
                const dateSource = externalDateInput || document.createElement('input');
                dateSource.value = dateSource.value || new Date().toISOString().split('T')[0];

                onSubmit({
                    amount: Math.abs(amountVal),
                    category: selectedCategory || 'Transfer',
                    type: currentType,
                    accountId: currentAccountId,
                    toAccountId: selectedToAccount,
                    timestamp: new Date(dateSource.value).toISOString()
                });
            } catch (e) {
                console.error('Submit failed:', e);
                alert('Error updating transaction: ' + e.message);
            }
        });

        form.appendChild(okBtn);
    }

    // --- End Reorder ---

    // No submit handler needed on form itself, but keep preventDefault just in case
    form.addEventListener('submit', (e) => e.preventDefault());

    // Keyboard-aware viewport adjustments for the entire form
    const setupKeyboardHandling = () => {
        if (!window.mobileUtils || !window.mobileUtils.isMobile()) return;

        const formInputs = [amountInput, accSelect];

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
                    form.style.paddingBottom = `${keyboardHeight + 20} px`;
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
