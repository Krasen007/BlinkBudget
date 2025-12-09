import { Button } from './Button.js';

export const TransactionForm = ({ onSubmit }) => {
    const form = document.createElement('form');
    form.className = 'transaction-form';
    form.style.display = 'flex';
    form.style.flexDirection = 'column';
    form.style.gap = 'var(--spacing-lg)';
    form.style.width = '100%';
    form.style.maxWidth = '400px';

    // Type Toggle
    let currentType = 'expense';
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

    typeGroup.appendChild(expenseBtn);
    typeGroup.appendChild(refundBtn);
    form.appendChild(typeGroup);

    // Amount Input
    const amountGroup = document.createElement('div');
    const amountLabel = document.createElement('label');
    amountLabel.textContent = 'Amount';
    amountLabel.style.display = 'block';
    amountLabel.style.marginBottom = 'var(--spacing-sm)';
    amountLabel.style.color = 'var(--color-text-muted)';

    const amountInput = document.createElement('input');
    amountInput.type = 'number';
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

    let selectedCategory = null;

    categories.forEach(cat => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.textContent = cat;
        chip.className = 'btn';
        chip.style.border = '1px solid var(--color-border)';
        chip.style.background = 'transparent';
        chip.style.color = 'var(--color-text-muted)';

        chip.addEventListener('click', () => {
            // Deselect all
            Array.from(chipContainer.children).forEach(c => {
                c.style.background = 'transparent';
                c.style.color = 'var(--color-text-muted)';
                c.style.borderColor = 'var(--color-border)';
            });
            // Select this
            chip.style.background = 'var(--color-primary-light)'; // Using light as distinct selection
            chip.style.color = 'var(--color-background)';
            chip.style.borderColor = 'var(--color-primary)';
            selectedCategory = cat;
        });
        chipContainer.appendChild(chip);
    });
    categoryGroup.appendChild(chipContainer);

    // Submit
    const submitBtn = Button({
        text: 'Save Expense',
        type: 'submit',
        variant: 'primary',
        className: 'mt-xl'
    });
    submitBtn.style.marginTop = 'var(--spacing-xl)';
    submitBtn.style.width = '100%';

    form.appendChild(amountGroup);
    form.appendChild(categoryGroup);
    form.appendChild(submitBtn);

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!selectedCategory) {
            alert('Please select a category');
            return;
        }
        onSubmit({
            amount: parseFloat(amountInput.value),
            category: selectedCategory,
            type: currentType
        });
    });

    // Focus amount on load
    setTimeout(() => amountInput.focus(), 100);

    return form;
};
