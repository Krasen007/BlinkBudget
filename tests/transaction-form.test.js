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

describe('TransactionForm Refund Support', () => {
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
        expect(categoryLabels).toContain('Food & Groceries');
        expect(categoryLabels).toContain('Dining & Coffee');
        expect(categoryLabels).toContain('Housing & Bills');
        expect(categoryLabels).toContain('Transportation');
        expect(categoryLabels).toContain('Leisure & Shopping');
        expect(categoryLabels).toContain('Personal Care');
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
});