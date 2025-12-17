import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TransactionForm } from '../src/components/TransactionForm.js';

// Mock StorageService
vi.mock('../src/core/storage.js', () => ({
    StorageService: {
        getAccounts: () => [
            { id: 'main', name: 'Main Account' },
            { id: 'savings', name: 'Savings' }
        ],
        getDefaultAccount: () => ({ id: 'main', name: 'Main Account' })
    }
}));

// Mock mobile utils
global.window.mobileUtils = {
    supportsHaptic: () => true,
    hapticFeedback: vi.fn(),
    isMobile: () => true,
    preventInputZoom: vi.fn(),
    scrollIntoViewAboveKeyboard: vi.fn()
};

describe('TransactionForm', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        vi.clearAllMocks();
    });

    it('should include refund type button in type toggle group', () => {
        const mockSubmit = vi.fn();
        const form = TransactionForm({ onSubmit: mockSubmit });
        document.body.appendChild(form);
        
        // Find all type toggle buttons
        const typeButtons = form.querySelectorAll('.type-toggle-btn');
        
        // Should have 4 buttons: Expense, Income, Transfer, Refund
        expect(typeButtons).toHaveLength(4);
        
        // Check button labels
        const buttonLabels = Array.from(typeButtons).map(btn => btn.textContent);
        expect(buttonLabels).toContain('Expense');
        expect(buttonLabels).toContain('Income');
        expect(buttonLabels).toContain('Transfer');
        expect(buttonLabels).toContain('Refund');
    });

    it('should show expense categories when refund type is selected', () => {
        const mockSubmit = vi.fn();
        const form = TransactionForm({ onSubmit: mockSubmit });
        document.body.appendChild(form);
        
        // Find and click the refund button
        const typeButtons = form.querySelectorAll('.type-toggle-btn');
        const refundButton = Array.from(typeButtons).find(btn => btn.textContent === 'Refund');
        
        expect(refundButton).toBeTruthy();
        
        // Click refund button
        refundButton.click();
        
        // Check that expense categories are displayed
        const categoryChips = form.querySelectorAll('.category-chip');
        const categoryLabels = Array.from(categoryChips).map(chip => chip.textContent);
        
        // Should show expense categories for refunds
        expect(categoryLabels).toContain('Groceries');
        expect(categoryLabels).toContain('Eating Out');
        expect(categoryLabels).toContain('Bills');
        expect(categoryLabels).toContain('Travel');
        expect(categoryLabels).toContain('Lifestyle');
        expect(categoryLabels).toContain('Self-care');
    });

    it('should apply refund-specific styling to refund button when active', () => {
        const mockSubmit = vi.fn();
        const form = TransactionForm({ onSubmit: mockSubmit });
        document.body.appendChild(form);
        
        // Find the refund button
        const typeButtons = form.querySelectorAll('.type-toggle-btn');
        const refundButton = Array.from(typeButtons).find(btn => btn.textContent === 'Refund');
        
        // Click refund button to make it active
        refundButton.click();
        
        // Check that it has the teal/cyan background color for refunds (browser converts hex to rgb)
        expect(refundButton.style.background).toBe('rgb(6, 182, 212)');
        expect(refundButton.style.color).toBe('white');
    });

    it('should save transaction to correct account when account is changed', () => {
        const mockSubmit = vi.fn();
        const form = TransactionForm({ onSubmit: mockSubmit });
        document.body.appendChild(form);
        
        // Find the account select dropdown
        const accountSelect = form.querySelector('select');
        expect(accountSelect).toBeTruthy();
        
        // Change account to savings
        accountSelect.value = 'savings';
        accountSelect.dispatchEvent(new Event('change'));
        
        // Fill in amount
        const amountInput = form.querySelector('input[type="number"]');
        amountInput.value = '25.50';
        
        // Select a category to trigger auto-submit
        const categoryChips = form.querySelectorAll('.category-chip');
        const groceriesCategory = Array.from(categoryChips).find(chip => chip.textContent === 'Groceries');
        expect(groceriesCategory).toBeTruthy();
        
        groceriesCategory.click();
        
        // Verify the transaction was submitted with the correct account
        expect(mockSubmit).toHaveBeenCalledWith(
            expect.objectContaining({
                accountId: 'savings',
                amount: 25.50,
                category: 'Groceries',
                type: 'expense'
            })
        );
    });

    it('should update transfer destination options when source account changes', () => {
        const mockSubmit = vi.fn();
        const form = TransactionForm({ onSubmit: mockSubmit });
        document.body.appendChild(form);
        
        // Switch to transfer type
        const typeButtons = form.querySelectorAll('.type-toggle-btn');
        const transferButton = Array.from(typeButtons).find(btn => btn.textContent === 'Transfer');
        transferButton.click();
        
        // Initially should show savings as destination (main is default source)
        let categoryChips = form.querySelectorAll('.category-chip');
        let chipLabels = Array.from(categoryChips).map(chip => chip.textContent);
        expect(chipLabels).toContain('Savings');
        expect(chipLabels).not.toContain('Main Account');
        
        // Change source account to savings
        const accountSelect = form.querySelector('select');
        accountSelect.value = 'savings';
        accountSelect.dispatchEvent(new Event('change'));
        
        // Now should show main account as destination (savings is source)
        categoryChips = form.querySelectorAll('.category-chip');
        chipLabels = Array.from(categoryChips).map(chip => chip.textContent);
        expect(chipLabels).toContain('Main Account');
        expect(chipLabels).not.toContain('Savings');
    });
});