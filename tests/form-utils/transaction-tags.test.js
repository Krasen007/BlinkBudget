import { describe, it, expect } from 'vitest';
import {
  applyExpenseTagToTransactionData,
  getTransactionTagName,
} from '../../src/utils/form-utils/transaction-tags.js';

describe('transaction-tags', () => {
  it('getTransactionTagName returns first tag only', () => {
    expect(getTransactionTagName({ tags: ['Work'] })).toBe('Work');
    expect(getTransactionTagName({ tags: [] })).toBeNull();
    expect(getTransactionTagName({})).toBeNull();
  });

  it('applyExpenseTagToTransactionData adds one tag for expenses', () => {
    const result = applyExpenseTagToTransactionData(
      { type: 'expense', amount: 10, category: 'Food' },
      'Work'
    );
    expect(result.tags).toEqual(['Work']);
  });

  it('applyExpenseTagToTransactionData clears tags when unset on edit save', () => {
    const result = applyExpenseTagToTransactionData(
      { type: 'expense', amount: 10, category: 'Food', tags: ['Work'] },
      null,
      true
    );
    expect(result.tags).toEqual([]);
  });

  it('applyExpenseTagToTransactionData omits tags on new expense', () => {
    const result = applyExpenseTagToTransactionData(
      { type: 'expense', amount: 10, category: 'Food' },
      null
    );
    expect(result.tags).toBeUndefined();
  });

  it('applyExpenseTagToTransactionData clears tags for non-expense', () => {
    const result = applyExpenseTagToTransactionData(
      { type: 'income', amount: 10, category: 'Salary', tags: ['Work'] },
      'Work'
    );
    expect(result.tags).toBeUndefined();
  });
});
