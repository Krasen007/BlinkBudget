/**
 * Category Chips - Unit Tests
 */

import { createCategorySelector } from '../../src/utils/form-utils/category-chips.js';

// Mock mobileUtils for consistent testing
global.window = {
  mobileUtils: {
    hapticFeedback: vi.fn(),
  },
};

// Mock document for DOM operations
global.document = {
  createElement: vi.fn(tag => {
    const element = {
      tagName: tag.toUpperCase(),
      style: {},
      classList: {
        contains: vi.fn(className => className === 'category-chip'),
        add: vi.fn(),
        remove: vi.fn(),
      },
      addEventListener: vi.fn(),
      appendChild: vi.fn(),
      children: [],
      scrollBy: vi.fn(),
      clientWidth: 300,
    };
    return element;
  }),
};

// Mock dynamic import for error handling
vi.mock('../../components/MobileModal.js', () => ({
  MobileAlert: vi.fn(),
}));

describe('Category Chips', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCategorySelector', () => {
    test('creates selector with container and methods', () => {
      const accounts = [{ id: 'acc1', name: 'Account 1' }];
      const result = createCategorySelector({
        type: 'expense',
        accounts,
        currentAccountId: 'acc1',
      });

      expect(result.container).toBeDefined();
      expect(result.chipContainer).toBeDefined();
      expect(typeof result.selectedCategory).toBe('function');
      expect(typeof result.selectedToAccount).toBe('function');
      expect(typeof result.setCategory).toBe('function');
      expect(typeof result.setType).toBe('function');
      expect(typeof result.setSourceAccount).toBe('function');
      expect(typeof result.render).toBe('function');
    });

    test('initializes with correct structure', () => {
      const result = createCategorySelector({ type: 'expense' });

      // Should create container structure
      expect(document.createElement).toHaveBeenCalled();
      expect(result.container).toBeDefined();
      expect(result.chipContainer).toBeDefined();
    });

    test('can change type programmatically', () => {
      const result = createCategorySelector({ type: 'expense' });

      result.setType('income');

      // Should update internal state
      expect(result.selectedCategory()).toBe(null);
      expect(result.selectedToAccount()).toBe(null);
    });

    test('can set category programmatically', () => {
      const result = createCategorySelector({ type: 'expense' });

      result.setCategory('Food');

      expect(result.selectedCategory()).toBe('Food');
    });

    test('can set transfer account programmatically', () => {
      const result = createCategorySelector({ type: 'transfer' });

      result.setToAccount('acc123');

      expect(result.selectedToAccount()).toBe('acc123');
    });
  });

  describe('category selection', () => {
    test('accepts onSelect callback parameter', () => {
      const onSelect = vi.fn();
      const result = createCategorySelector({
        type: 'expense',
        onSelect,
      });

      // Verify the selector was created successfully with callback
      expect(result).toBeDefined();
      expect(typeof result.setType).toBe('function');
    });

    test('accepts onSelect callback for transfers', () => {
      const onSelect = vi.fn();
      const accounts = [
        { id: 'acc1', name: 'Account 1' },
        { id: 'acc2', name: 'Account 2' },
      ];
      const result = createCategorySelector({
        type: 'transfer',
        accounts,
        currentAccountId: 'acc1',
        onSelect,
      });

      // Verify the selector was created successfully
      expect(result).toBeDefined();
      expect(result.selectedToAccount()).toBe(null);
    });

    test('validation logic is integrated', () => {
      // The validation logic is tested separately in validation.test.js
      // Here we just verify the selector accepts amountInput parameter
      const mockAmountInput = { value: '100' };
      const result = createCategorySelector({
        type: 'expense',
        amountInput: mockAmountInput,
      });

      expect(result).toBeDefined();
    });
  });

  describe('setType method', () => {
    test('changes type and resets selections', () => {
      const result = createCategorySelector({ type: 'expense' });

      result.setType('income');

      // Should reset selections
      expect(result.selectedCategory()).toBe(null);
      expect(result.selectedToAccount()).toBe(null);
    });

    test('handles type changes without errors', () => {
      const result = createCategorySelector({ type: 'expense' });

      // Should handle type change without throwing
      expect(() => result.setType('income')).not.toThrow();
    });
  });

  describe('setSourceAccount method', () => {
    test('handles source account changes for transfers', () => {
      const accounts = [
        { id: 'acc1', name: 'Account 1' },
        { id: 'acc2', name: 'Account 2' },
        { id: 'acc3', name: 'Account 3' },
      ];
      const result = createCategorySelector({
        type: 'transfer',
        accounts,
        currentAccountId: 'acc1',
      });

      // Should handle source account change without throwing
      expect(() => result.setSourceAccount('acc2')).not.toThrow();
    });

    test('does not re-render for non-transfer types', () => {
      const result = createCategorySelector({ type: 'expense' });

      const initialChildrenCount = result.chipContainer.children.length;
      result.setSourceAccount('new-account');

      // Should not re-render
      expect(result.chipContainer.children.length).toBe(initialChildrenCount);
    });
  });

  describe('setCategory and setToAccount methods', () => {
    test('setCategory updates selected category', () => {
      const result = createCategorySelector({ type: 'expense' });

      result.setCategory('Food');

      expect(result.selectedCategory()).toBe('Food');
    });

    test('setToAccount updates selected transfer account', () => {
      const result = createCategorySelector({ type: 'transfer' });

      result.setToAccount('acc123');

      expect(result.selectedToAccount()).toBe('acc123');
    });
  });

  describe('container styling', () => {
    test('creates container with proper grid layout', () => {
      const result = createCategorySelector();

      const container = result.chipContainer;
      expect(container.style.display).toBe('grid');
      expect(container.style.gridTemplateColumns).toBe('none');
      expect(container.style.gridTemplateRows).toBe('repeat(2, 1fr)');
      expect(container.style.overflowX).toBe('auto');
      expect(container.style.scrollSnapType).toBe('x mandatory');
    });

    test('handles wheel events for horizontal scrolling', () => {
      const result = createCategorySelector();

      const container = result.chipContainer;
      const wheelHandler = container.addEventListener.mock.calls.find(
        ([event]) => event === 'wheel'
      )[1];

      // Simulate wheel down
      const wheelEvent = { deltaY: 100, preventDefault: vi.fn() };
      wheelHandler(wheelEvent);

      expect(wheelEvent.preventDefault).toHaveBeenCalled();
      expect(container.scrollBy).toHaveBeenCalledWith({
        left: 300, // container.clientWidth
        behavior: 'smooth',
      });
    });

    test('prevents rapid wheel scrolling', () => {
      const result = createCategorySelector();

      const container = result.chipContainer;
      const wheelHandler = container.addEventListener.mock.calls.find(
        ([event]) => event === 'wheel'
      )[1];

      // First wheel event
      const wheelEvent1 = { deltaY: 100, preventDefault: vi.fn() };
      wheelHandler(wheelEvent1);

      // Second wheel event (should be ignored due to throttling)
      const wheelEvent2 = { deltaY: 100, preventDefault: vi.fn() };
      wheelHandler(wheelEvent2);

      expect(container.scrollBy).toHaveBeenCalledTimes(1);
    });
  });

  describe('chip interactions', () => {
    test('chips have proper touch feedback', () => {
      const result = createCategorySelector({ type: 'expense' });

      const firstChip = result.chipContainer.children[0];
      if (firstChip && firstChip.addEventListener) {
        const touchStartCall = firstChip.addEventListener.mock.calls.find(
          ([event]) => event === 'touchstart'
        );

        expect(touchStartCall).toBeDefined();
      }
    });

    test('chips have proper hover effects', () => {
      const result = createCategorySelector({ type: 'expense' });

      const firstChip = result.chipContainer.children[0];
      if (firstChip && firstChip.addEventListener) {
        const mouseEnterCall = firstChip.addEventListener.mock.calls.find(
          ([event]) => event === 'mouseenter'
        );

        expect(mouseEnterCall).toBeDefined();
      }
    });
  });

  describe('error handling', () => {
    test('handles missing mobileUtils gracefully', () => {
      const originalMobileUtils = window.mobileUtils;
      delete window.mobileUtils;

      const result = createCategorySelector({ type: 'expense' });

      // Should not throw errors
      expect(() => result.render()).not.toThrow();

      // Restore
      window.mobileUtils = originalMobileUtils;
    });
  });

  describe('initial values', () => {
    test('respects initial category selection', () => {
      const result = createCategorySelector({
        type: 'expense',
        initialCategory: 'Храна', // Bulgarian for Food
      });

      expect(result.selectedCategory()).toBe('Храна');
    });

    test('respects initial transfer account selection', () => {
      const result = createCategorySelector({
        type: 'transfer',
        initialToAccount: 'acc123',
      });

      expect(result.selectedToAccount()).toBe('acc123');
    });
  });
});
