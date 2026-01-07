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

    // Should have a label (currently empty as label text is commented out)
    const label = dateInput.querySelector('label');
    expect(label).toBeTruthy();
    expect(label.textContent).toBe('');
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

    const realInput = dateInput.querySelector('input[type="date"]');
    const label = dateInput.querySelector('label');

    // Date input should have accessibility attributes
    expect(realInput.getAttribute('aria-label')).toBe('Transaction date');
    expect(realInput.id).toBeTruthy();

    // Label should be connected to date input
    expect(label.getAttribute('for')).toBe(realInput.id);
  });

  it('should respond to click interaction', () => {
    const dateInput = DateInput();
    container.appendChild(dateInput);

    const realInput = dateInput.querySelector('input[type="date"]');

    // Test that click event is handled (logs are added for debugging)
    // The input should not be readonly
    expect(realInput.readOnly).toBe(false);
    expect(realInput.disabled).toBe(false);

    // Test click - should not throw errors
    expect(() => {
      realInput.dispatchEvent(new Event('click'));
    }).not.toThrow();
  });

  it('should have proper CSS classes for styling', () => {
    const dateInput = DateInput();
    container.appendChild(dateInput);

    const realInput = dateInput.querySelector('input[type="date"]');

    // Should have the expected CSS classes
    expect(realInput.className).toContain('mobile-form-input');
    expect(realInput.className).toContain('date-input-field');
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
    const onChange = value => {
      changedValue = value;
    };

    const dateInput = DateInput({ onChange });
    container.appendChild(dateInput);

    const realInput = dateInput.querySelector('input[type="date"]');
    realInput.value = '2024-01-15';
    realInput.dispatchEvent(new Event('change'));

    expect(changedValue).toBe('2024-01-15');
  });
});
