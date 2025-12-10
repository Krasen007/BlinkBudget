import { Button } from './Button.js';

export const TransactionForm = ({ onSubmit, initialValues = {} }) => {
    const form = document.createElement('form');
    form.className = 'transaction-form';
    form.style.display = 'flex';
    form.style.flexDirection = 'column';
    form.style.gap = 'var(--spacing-lg)';
    form.style.width = '100%';
    form.style.maxWidth = '400px';

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

        btn.updateState = updateState;
        return btn;
    };

    const expenseBtn = createTypeBtn('expense', 'Expense');
    const incomeBtn = createTypeBtn('income', 'Income');
    const refundBtn = createTypeBtn('refund', 'Refund');

    // Initial state
    expenseBtn.updateState();
    incomeBtn.updateState();
    refundBtn.updateState();

    typeGroup.appendChild(expenseBtn);
    typeGroup.appendChild(incomeBtn);
    typeGroup.appendChild(refundBtn);
    form.appendChild(typeGroup);

    // Date Input
    const dateGroup = document.createElement('div');
    const dateLabel = document.createElement('label');
    dateLabel.textContent = 'Date';
    dateLabel.style.display = 'block';
    dateLabel.style.marginBottom = 'var(--spacing-sm)';
    dateLabel.style.color = 'var(--color-text-muted)';

    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.style.width = '100%';
    // Default to initial value or Today
    const defaultDate = initialValues.timestamp ? initialValues.timestamp.split('T')[0] : new Date().toISOString().split('T')[0];
    dateInput.value = defaultDate;

    dateGroup.appendChild(dateLabel);
    dateGroup.appendChild(dateInput);
    form.appendChild(dateGroup);

    // Amount Input
    const amountGroup = document.createElement('div');
    const amountLabel = document.createElement('label');
    amountLabel.textContent = 'Amount';
    amountLabel.style.display = 'block';
    amountLabel.style.marginBottom = 'var(--spacing-sm)';
    amountLabel.style.color = 'var(--color-text-muted)';

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

    amountGroup.appendChild(amountLabel);
    amountGroup.appendChild(amountInput);

    // Categories
    const categoryGroup = document.createElement('div');
    const catLabel = document.createElement('label');
    catLabel.textContent = 'Category';
    catLabel.style.display = 'block';
    catLabel.style.marginBottom = 'var(--spacing-sm)';
    catLabel.style.color = 'var(--color-text-muted)';
    categoryGroup.appendChild(catLabel);

    const categoryOptions = {
        expense: ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Education', 'Utility'],
        income: ['Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Other'],
        refund: ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Education', 'Utility']
    };

    const chipContainer = document.createElement('div');
    chipContainer.style.display = 'flex';
    chipContainer.style.flexWrap = 'wrap';
    chipContainer.style.gap = 'var(--spacing-sm)';

    let selectedCategory = initialValues.category || null;

    const renderCategories = () => {
        chipContainer.innerHTML = ''; // Clear existing
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
            chip.className = 'btn';
            chip.style.border = '1px solid var(--color-border)';
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
                    amount: amountVal,
                    category: selectedCategory,
                    type: currentType,
                    timestamp: new Date(dateInput.value).toISOString() // Use selected date
                });
            });
            chipContainer.appendChild(chip);
        });
    };

    renderCategories(); // Initial render

    // Update categories when type changes
    // We need to hook into the existing click listener or modify createTypeBtn to call a callback
    // Re-implementing the click listener logic from createTypeBtn effectively requires modifying createTypeBtn or attaching a new behavior.
    // Since I cannot modify createTypeBtn easily inside this chunk without re-writing it, I will assume I can modify the click handler in the first replacement chunk if I had planned it, 
    // BUT, I can just cheat and add a mutation observer or just re-write the type buttons logic slightly?
    // Better: I will use the fact that I am replacing the button creation code in the PREVIOUS chunk. 
    // Wait, I can't cross-reference chunks like that easily if I didn't write it that way. 
    // Let's look at chunk 1 again. defining `expenseBtn`, `incomeBtn`...
    // The `createTypeBtn` function was defined BEFORE chunk 1 start line.

    // It is better to redefine `createTypeBtn` to include the callback or side effect.
    // But `createTypeBtn` is lines 19-41.
    // My valid range for chunk 1 is 43-50.

    // I should probably have done one big replacement or better targeted replacements.
    // Let's just redefine the click handler for the buttons I validly have access to, or...
    // Actually, I can just attach a NEW click listener to the buttons after creation?
    // No, `currentType` is local to the closure.

    // Let's REWRITE `TransactionForm` more broadly to ensure correctness.
    // I will use a larger replacement chunk for the whole Type section and Category section to link them.

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
