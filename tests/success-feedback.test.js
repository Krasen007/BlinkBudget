import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    highlightTransactionSuccess,
    markTransactionForHighlight,
    getTransactionToHighlight
} from '../src/utils/success-feedback.js';

// Mock mobile utils
global.window.mobileUtils = {
    supportsHaptic: () => true,
    hapticFeedback: vi.fn()
};

describe('Success Feedback', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        vi.clearAllMocks();
        // Clear session storage
        sessionStorage.clear();
    });



    it('should highlight transaction element with subtle success animation', () => {
        const element = document.createElement('div');
        element.style.backgroundColor = 'white';
        document.body.appendChild(element);

        highlightTransactionSuccess(element, 100);

        // Should have subtle success background color
        expect(element.style.backgroundColor).toBe('rgba(16, 185, 129, 0.1)');
        expect(element.style.transition).toBe('background-color 0.3s ease');
    });

    it('should handle null element gracefully in highlight function', () => {
        expect(() => {
            highlightTransactionSuccess(null);
        }).not.toThrow();
    });

    it('should store and retrieve transaction ID for highlighting', () => {
        const testId = 'test-transaction-123';

        markTransactionForHighlight(testId);
        const retrievedIds = getTransactionToHighlight();

        // Now returns an array
        expect(retrievedIds).toEqual([testId]);

        // Wait for delayed clear (500ms)
        // For the test, we check immediately - second retrieval should still have the value briefly
        const secondRetrieval = getTransactionToHighlight();
        // During the 500ms window, it should still return the value
        expect(secondRetrieval).toEqual([testId]);
    });

    it('should trigger subtle haptic feedback when highlighting', () => {
        const element = document.createElement('div');
        document.body.appendChild(element);

        highlightTransactionSuccess(element);

        expect(window.mobileUtils.hapticFeedback).toHaveBeenCalledWith([10]); // LIGHT haptic pattern
    });

    it('should handle missing haptic feedback gracefully', () => {
        // Temporarily disable haptic support
        window.mobileUtils.supportsHaptic = () => false;

        const element = document.createElement('div');
        document.body.appendChild(element);

        expect(() => {
            highlightTransactionSuccess(element);
        }).not.toThrow();

        // Restore haptic support
        window.mobileUtils.supportsHaptic = () => true;
    });
});