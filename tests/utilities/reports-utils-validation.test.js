import { describe, expect, it } from 'vitest';

import {
  validateAnalyticsData,
  sanitizeAnalyticsData,
} from '../../src/utils/reports-utils.js';

/**
 * Contract tests for the validate/sanitize pair (#10.1 in
 * todo/ai-slop-report.md).
 *
 * `validateAnalyticsData` used to signal every failure mode with a `throw`,
 * which forced its caller into a try nested in a catch nested in a try. It now
 * reports, so these assert the result shape directly.
 */

const validPayload = () => ({
  transactions: [{ id: 'tx-1', amount: 10 }],
  categoryBreakdown: { categories: [{ name: 'Food', amount: 10 }] },
  incomeVsExpenses: { totalIncome: 100, totalExpenses: 40, netBalance: 60 },
});

describe('validateAnalyticsData', () => {
  it('reports valid for a well-formed payload', () => {
    const result = validateAnalyticsData(validPayload());

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('reports rather than throwing for a non-object', () => {
    for (const bad of [null, undefined, 'nope', 42]) {
      const result = validateAnalyticsData(bad);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Analytics data is not an object');
    }
  });

  it('reports every problem, not just the first', () => {
    const result = validateAnalyticsData({});

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      'Analytics data missing transactions array',
      'Analytics data missing category breakdown',
      'Analytics data missing income vs expenses',
    ]);
  });

  it('flags NaN totals without reading through a missing block', () => {
    const nan = validateAnalyticsData({
      ...validPayload(),
      incomeVsExpenses: { totalIncome: NaN, totalExpenses: 0, netBalance: 0 },
    });
    expect(nan.errors).toContain(
      'Analytics data contains invalid numeric values'
    );

    // No incomeVsExpenses at all — the old version dereferenced it here and
    // threw a TypeError instead of reporting.
    const missing = validateAnalyticsData({
      transactions: [],
      categoryBreakdown: { categories: [] },
    });
    expect(missing.errors).toEqual([
      'Analytics data missing income vs expenses',
    ]);
  });
});

describe('sanitizeAnalyticsData', () => {
  it('produces a payload that passes validation, from a totally empty object', () => {
    const sanitized = sanitizeAnalyticsData({});

    expect(validateAnalyticsData(sanitized).valid).toBe(true);
    expect(sanitized.transactions).toEqual([]);
    expect(sanitized.categoryBreakdown.categories).toEqual([]);
    expect(sanitized.incomeVsExpenses).toEqual({
      totalIncome: 0,
      totalExpenses: 0,
      netBalance: 0,
    });
  });

  it('repairs a payload missing the blocks it used to dereference blindly', () => {
    // The old implementation threw a TypeError on `sanitized.incomeVsExpenses
    // .totalIncome` for exactly this input, defeating the recovery path.
    expect(() => sanitizeAnalyticsData({ transactions: [] })).not.toThrow();
    expect(() => sanitizeAnalyticsData(null)).not.toThrow();
  });

  it('recomputes a NaN net balance from the repaired totals', () => {
    const sanitized = sanitizeAnalyticsData({
      ...validPayload(),
      incomeVsExpenses: {
        totalIncome: 100,
        totalExpenses: 40,
        netBalance: NaN,
      },
    });

    expect(sanitized.incomeVsExpenses.netBalance).toBe(60);
    expect(validateAnalyticsData(sanitized).valid).toBe(true);
  });

  it('drops category entries that are not numeric amounts', () => {
    const sanitized = sanitizeAnalyticsData({
      ...validPayload(),
      categoryBreakdown: {
        categories: [
          { name: 'Food', amount: 10 },
          { name: 'Bad', amount: 'ten' },
          { name: 'NaN', amount: NaN },
          null,
        ],
      },
    });

    expect(sanitized.categoryBreakdown.categories).toEqual([
      { name: 'Food', amount: 10 },
    ]);
  });

  it('does not mutate its input', () => {
    const input = validPayload();
    sanitizeAnalyticsData(input);

    expect(input.incomeVsExpenses.netBalance).toBe(60);
  });
});
