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
    const refundBtn = createTypeBtn('refund', 'Refund');

    // Initial state
    expenseBtn.updateState();
    refundBtn.updateState();

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

    const categories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills'];
    const chipContainer = document.createElement('div');
    chipContainer.style.display = 'flex';
    chipContainer.style.flexWrap = 'wrap';
    chipContainer.style.gap = 'var(--spacing-sm)';

    let selectedCategory = initialValues.category || null;

    categories.forEach(cat => {
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
