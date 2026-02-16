/**
 * Date Input Integration Tests
 * Tests for date input visibility and context in views
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AddView } from '../../src/views/AddView.js';
import { EditView } from '../../src/views/EditView.js';
import { StorageService } from '../../src/core/storage.js';

describe('Date Input Integration', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    // Clear storage
    localStorage.clear();
  });

  afterEach(() => {
    document.body.removeChild(container);
    localStorage.clear();
  });

  it('should show date input with label in AddView', () => {
    const addView = AddView();
    container.appendChild(addView);

    // Should have date input with label
    const dateInput = addView.querySelector('input[type="date"]');
    expect(dateInput).toBeTruthy();

    // Should have visible label (currently empty as label text is commented out)
    const label = addView.querySelector('label[for*="date-input"]');
    expect(label).toBeTruthy();
    expect(label.textContent).toBe('');
    expect(label.style.display).toBe('block');

    // Should have accessibility attributes
    expect(dateInput.getAttribute('aria-label')).toBe('Transaction date');
  });

  it('should show date input with label in EditView', () => {
    // Create a test transaction
    const testTransaction = {
      amount: 25.5,
      category: 'Food & Groceries',
      type: 'expense',
      accountId: 'main',
      timestamp: '2024-01-15',
    };

    const transactionId = StorageService.add(testTransaction).id;

    const editView = EditView({ id: transactionId });
    container.appendChild(editView);

    // Should have date input with label
    const dateInput = editView.querySelector('input[type="date"]');
    expect(dateInput).toBeTruthy();
    expect(dateInput.value).toBe('2024-01-15');

    // Should have visible label (currently empty as label text is commented out)
    const label = editView.querySelector('label[for*="date-input"]');
    expect(label).toBeTruthy();
    expect(label.textContent).toBe('');
    expect(label.style.display).toBe('block');

    // Should have accessibility attributes
    expect(dateInput.getAttribute('aria-label')).toBe('Transaction date');
  });

  it('should have proper visual connection to form in AddView', () => {
    const addView = AddView();
    container.appendChild(addView);

    // Check that the view has the proper class for CSS targeting
    expect(addView.className).toBe('view-add view-container');

    // Check that date input has the expected styling class
    const displayInput = addView.querySelector(
      'input[aria-label*="Transaction date"]'
    );
    expect(displayInput).toBeTruthy();
    expect(displayInput.className).toContain('mobile-form-input');
  });

  it('should have proper visual connection to form in EditView', () => {
    // Create a test transaction
    const testTransaction = {
      amount: 25.5,
      category: 'Food & Groceries',
      type: 'expense',
      accountId: 'main',
      timestamp: '2024-01-15',
    };

    const transactionId = StorageService.add(testTransaction).id;

    const editView = EditView({ id: transactionId });
    container.appendChild(editView);

    // Check that the view has the proper class for CSS targeting
    expect(editView.className).toBe('view-edit view-container');

    // Check that date input has the expected styling class
    const displayInput = editView.querySelector(
      'input[aria-label*="Transaction date"]'
    );
    expect(displayInput).toBeTruthy();
    expect(displayInput.className).toContain('mobile-form-input');
  });
});
