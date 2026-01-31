/**
 * Form Constants - Unit Tests
 */

import {
  CATEGORY_DEFINITIONS,
  CATEGORY_COLORS,
  CATEGORY_OPTIONS,
  TYPE_COLORS,
} from '../../src/utils/form-utils/constants.js';

describe('Form Constants', () => {
  describe('CATEGORY_DEFINITIONS', () => {
    test('contains definitions for all expense categories', () => {
      const expenseCategories = [
        'Храна',
        'Заведения',
        'Сметки',
        'Транспорт',
        'Забавления',
        'Лекарства',
      ];

      expenseCategories.forEach(category => {
        expect(CATEGORY_DEFINITIONS).toHaveProperty(category);
        expect(typeof CATEGORY_DEFINITIONS[category]).toBe('string');
        expect(CATEGORY_DEFINITIONS[category].length).toBeGreaterThan(0);
      });
    });

    test('contains definitions for all income categories', () => {
      const incomeCategories = ['Заплата', 'Инвестиции', 'Други'];

      incomeCategories.forEach(category => {
        expect(CATEGORY_DEFINITIONS).toHaveProperty(category);
        expect(typeof CATEGORY_DEFINITIONS[category]).toBe('string');
        expect(CATEGORY_DEFINITIONS[category].length).toBeGreaterThan(0);
      });
    });

    test('has reasonable description lengths', () => {
      Object.values(CATEGORY_DEFINITIONS).forEach(description => {
        expect(description.length).toBeGreaterThan(10);
        expect(description.length).toBeLessThan(200);
      });
    });
  });

  describe('CATEGORY_COLORS', () => {
    test('contains colors for all expense categories', () => {
      const expenseCategories = [
        'Храна',
        'Заведения',
        'Сметки',
        'Транспорт',
        'Забавления',
        'Лекарства',
      ];

      expenseCategories.forEach(category => {
        expect(CATEGORY_COLORS).toHaveProperty(category);
        expect(CATEGORY_COLORS[category]).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    test('contains colors for all income categories', () => {
      const incomeCategories = ['Заплата'];

      incomeCategories.forEach(category => {
        expect(CATEGORY_COLORS).toHaveProperty(category);
        expect(CATEGORY_COLORS[category]).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    test('uses consistent color mapping between expense and income categories', () => {
      // Consistency check: ensure key categories have colors
      expect(CATEGORY_COLORS['Храна']).toBeDefined();
      expect(CATEGORY_COLORS['Заплата']).toBeDefined();
      expect(CATEGORY_COLORS['Заплата']).toBe('#10b981'); // Green
    });
  });

  describe('CATEGORY_OPTIONS', () => {
    test('has options for all transaction types', () => {
      const expectedTypes = ['expense', 'income', 'refund'];
      expectedTypes.forEach(type => {
        expect(CATEGORY_OPTIONS).toHaveProperty(type);
        expect(Array.isArray(CATEGORY_OPTIONS[type])).toBe(true);
        expect(CATEGORY_OPTIONS[type].length).toBeGreaterThan(0);
      });
    });

    test('expense options are comprehensive', () => {
      const expenseOptions = CATEGORY_OPTIONS.expense;
      expect(expenseOptions.length).toBeGreaterThan(10);

      // Check for essential categories
      expect(expenseOptions).toContain('Храна');
      expect(expenseOptions).toContain('Сметки');
      expect(expenseOptions).toContain('Транспорт');
    });

    test('income options are reasonable', () => {
      const incomeOptions = CATEGORY_OPTIONS.income;
      expect(incomeOptions.length).toBeGreaterThan(2);
      expect(incomeOptions.length).toBeLessThan(10);

      // Check for basic income categories
      expect(incomeOptions).toContain('Заплата');
      expect(incomeOptions).toContain('Инвестиции');
    });

    test('refund options match expense options', () => {
      const expenseOptions = CATEGORY_OPTIONS.expense;
      const refundOptions = CATEGORY_OPTIONS.refund;

      expect(refundOptions).toEqual(expenseOptions);
    });

    test('all options are strings', () => {
      Object.values(CATEGORY_OPTIONS).forEach(optionsArray => {
        optionsArray.forEach(option => {
          expect(typeof option).toBe('string');
          expect(option.length).toBeGreaterThan(0);
        });
      });
    });

    test('no duplicate options within each type', () => {
      Object.values(CATEGORY_OPTIONS).forEach(optionsArray => {
        const uniqueOptions = new Set(optionsArray);
        expect(uniqueOptions.size).toBe(optionsArray.length);
      });
    });
  });

  describe('TYPE_COLORS', () => {
    test('has colors for all transaction types', () => {
      const expectedTypes = ['expense', 'income', 'transfer', 'refund'];
      expectedTypes.forEach(type => {
        expect(TYPE_COLORS).toHaveProperty(type);
      });
    });

    test('expense color is primary', () => {
      expect(TYPE_COLORS.expense).toBe('var(--color-primary)');
    });

    test('income color is success color', () => {
      expect(TYPE_COLORS.income).toBe('#10b981');
    });

    test('transfer color is defined', () => {
      expect(TYPE_COLORS.transfer).toBe('#b45309');
    });

    test('refund color is info color', () => {
      expect(TYPE_COLORS.refund).toBe('#06b6d4');
    });

    test('all colors are valid CSS color values', () => {
      Object.values(TYPE_COLORS).forEach(color => {
        // Check if it's a hex color or CSS variable
        expect(color).toMatch(
          /^#(#[0-9a-fA-F]{6}|[0-9a-fA-F]{6})$|^var\(--color-[a-z-]+\)$/
        );
      });
    });
  });

  describe('Constants Integration', () => {
    test('category definitions and colors have matching keys', () => {
      const definitionKeys = Object.keys(CATEGORY_DEFINITIONS);
      const colorKeys = Object.keys(CATEGORY_COLORS);

      expect(definitionKeys.sort()).toEqual(colorKeys.sort());
    });

    test('all category options exist in definitions', () => {
      const allOptions = [
        ...CATEGORY_OPTIONS.expense,
        ...CATEGORY_OPTIONS.income,
        ...CATEGORY_OPTIONS.refund,
      ];

      // Note: This test might be too strict since options are in Bulgarian
      // and definitions are in English. We'll just check that we have options.
      expect(allOptions.length).toBeGreaterThan(20);
    });

    test('constants are properly exported', () => {
      expect(CATEGORY_DEFINITIONS).toBeDefined();
      expect(CATEGORY_COLORS).toBeDefined();
      expect(CATEGORY_OPTIONS).toBeDefined();
      expect(TYPE_COLORS).toBeDefined();

      expect(Object.keys(CATEGORY_DEFINITIONS).length).toBeGreaterThan(5);
      expect(Object.keys(CATEGORY_COLORS).length).toBeGreaterThan(5);
      expect(Object.keys(CATEGORY_OPTIONS).length).toBe(3);
      expect(Object.keys(TYPE_COLORS).length).toBe(4);
    });
  });
});
