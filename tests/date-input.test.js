/**
 * Date Input Component Tests
 * Tests for enhanced date input visibility and context
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DateInput } from '../src/components/DateInput.js';

describe('DateInput Component', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    it('should create date input with label by default', () => {
        const dateInput = DateInput();
        container.appendChild(dateInput);

        // Should have a label
        const label = dateInput.querySelector('label');
        expect(label).toBeTruthy();
        expect(label.textContent).toBe('Date');
        expect(label.style.display).toBe('block');
    });

    it('should hide label when showLabel is false', () => {
        const dateInput = DateInput({ showLabel: false });
        container.appendChild(dateInput);

        const label = dateInput.querySelector('label');
        expect(label).toBeTruthy();
        expect(label.style.display).toBe('none');
    });

    it('should have proper accessibility attributes', () => {
        const dateInput = DateInput();
        container.appendChild(dateInput);

        const displayInput = dateInput.querySelector('input[type="text"]');
        const realInput = dateInput.querySelector('input[type="date"]');
        const label = dateInput.querySelector('label');

        // Display input should have accessibility attributes
        expect(displayInput.getAttribute('aria-label')).toBe('Transaction date - click to change');
        expect(displayInput.getAttribute('role')).toBe('button');
        expect(displayInput.getAttribute('tabindex')).toBe('0');
        expect(displayInput.title).toBe('Click to change transaction date');

        // Label should be connected to real input
        expect(label.getAttribute('for')).toBe(realInput.id);
        expect(realInput.id).toBeTruthy();
    });

    it('should respond to keyboard interaction', () => {
        const dateInput = DateInput();
        container.appendChild(dateInput);

        const displayInput = dateInput.querySelector('input[type="text"]');
        const realInput = dateInput.querySelector('input[type="date"]');

        // Mock the click method
        let clicked = false;
        realInput.click = () => { clicked = true; };

        // Test Enter key
        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
        displayInput.dispatchEvent(enterEvent);
        expect(clicked).toBe(true);

        // Reset and test Space key
        clicked = false;
        const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
        displayInput.dispatchEvent(spaceEvent);
        expect(clicked).toBe(true);
    });

    it('should provide visual feedback on hover and focus', () => {
        const dateInput = DateInput();
        container.appendChild(dateInput);

        const displayInput = dateInput.querySelector('input[type="text"]');
        
        // Initial state
        const initialBorderColor = displayInput.style.borderColor;
        const initialTransform = displayInput.style.transform;

        // Test hover
        displayInput.dispatchEvent(new Event('mouseenter'));
        expect(displayInput.style.borderColor).not.toBe(initialBorderColor);
        expect(displayInput.style.transform).toBe('scale(1.02)');

        // Test mouse leave
        displayInput.dispatchEvent(new Event('mouseleave'));
        expect(displayInput.style.transform).toBe('scale(1)');

        // Test focus
        displayInput.dispatchEvent(new Event('focus'));
        expect(displayInput.style.transform).toBe('scale(1.02)');

        // Test blur
        displayInput.dispatchEvent(new Event('blur'));
        expect(displayInput.style.transform).toBe('scale(1)');
    });

    it('should initialize with provided value', () => {
        const testDate = '2024-01-15';
        const dateInput = DateInput({ value: testDate });
        container.appendChild(dateInput);

        const realInput = dateInput.querySelector('input[type="date"]');
        expect(realInput.value).toBe(testDate);
    });

    it('should call onChange when date changes', () => {
        let changedValue = null;
        const onChange = (value) => { changedValue = value; };
        
        const dateInput = DateInput({ onChange });
        container.appendChild(dateInput);

        const realInput = dateInput.querySelector('input[type="date"]');
        realInput.value = '2024-01-15';
        realInput.dispatchEvent(new Event('change'));

        expect(changedValue).toBe('2024-01-15');
    });
});