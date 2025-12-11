import { Button } from './Button.js';
import { StorageService } from '../core/storage.js';

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
    accSelect.style.padding = 'var(--spacing-sm) var(--spacing-md)';
    accSelect.style.borderRadius = 'var(--radius-md)';
    accSelect.style.background = 'var(--color-surface)';
    accSelect.style.color = 'var(--color-text-main)';
    accSelect.style.border = '1px solid var(--color-border)';
    accSelect.style.fontSize = '1rem';
    accSelect.style.cursor = 'pointer';
    accSelect.style.outline = 'none';
    accSelect.style.appearance = 'auto';
    accSelect.className = 'input-select';

    accounts.forEach(acc => {
        const opt = document.createElement('option');
        opt.value = acc.id;
        opt.textContent = acc.name;
        if (acc.id === currentAccountId) opt.selected = true;
        accSelect.appendChild(opt);
    });

    accSelect.addEventListener('change', (e) => {
        currentAccountId = e.target.value;
    });

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
        btn.className = 'btn';
        btn.style.flex = '1';
        btn.style.border = '1px solid var(--color-border)';

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

        // Hover effect for uniformity
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
    // Default to initial value or Today
    const defaultDate = initialValues.timestamp ? initialValues.timestamp.split('T')[0] : new Date().toISOString().split('T')[0];
    dateInput.value = defaultDate;

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
                chip.className = 'btn';
                chip.style.border = '1px solid var(--color-border)';
                chip.style.transition = 'all 0.2s ease';

                chip.addEventListener('click', () => {
                    // Validate Amount
                    const amountVal = parseFloat(amountInput.value);
                    if (isNaN(amountVal) || amountVal === 0) {
                        amountInput.focus();
                        amountInput.style.borderColor = '#ef4444';
                        return;
                    }

                    selectedToAccount = acc.id;

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
                chip.className = 'btn';
                chip.style.border = '1px solid var(--color-border)';
                chip.style.transition = 'all 0.2s ease'; // Smooth transition

                const catColor = categoryColors[cat] || 'var(--color-primary)';

                // Hover effects
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

    // Focus amount on load
    setTimeout(() => amountInput.focus(), 100);

    return form;
};
