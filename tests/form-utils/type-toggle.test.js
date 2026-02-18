/**
 * Type Toggle Group - Unit Tests
 */

import { createTypeToggleGroup } from '../../src/utils/form-utils/type-toggle.js';

// Mock mobileUtils for consistent testing
global.window = {
  mobileUtils: {
    hapticFeedback: vi.fn(),
  },
  innerWidth: 800,
  addEventListener: vi.fn(),
};

// Mock document for DOM operations
global.document = {
  createElement: vi.fn(tag => {
    const element = {
      tagName: tag.toUpperCase(),
      style: {},
      addEventListener: vi.fn(),
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
      },
      appendChild: vi.fn(),
    };
    return element;
  }),
};

describe('Type Toggle Group', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window dimensions
    window.innerWidth = 800;
  });

  describe('createTypeToggleGroup', () => {
    test('creates container with correct structure', () => {
      const result = createTypeToggleGroup();

      expect(document.createElement).toHaveBeenCalledWith('fieldset');
      expect(document.createElement).toHaveBeenCalledWith('legend');
      expect(result.container).toBeDefined();
      expect(result.container.style.display).toBe('grid');
      expect(result.container.style.gap).toBe('var(--spacing-sm)');
    });

    test('sets responsive grid layout for desktop', () => {
      window.innerWidth = 800;
      const result = createTypeToggleGroup();

      expect(result.container.style.gridTemplateColumns).toBe('repeat(4, 1fr)');
    });

    test('sets responsive grid layout for mobile', () => {
      window.innerWidth = 300;
      const result = createTypeToggleGroup();

      expect(result.container.style.gridTemplateColumns).toBe('repeat(2, 1fr)');
    });

    test('returns correct API methods', () => {
      const result = createTypeToggleGroup();

      expect(typeof result.currentType).toBe('function');
      expect(typeof result.setType).toBe('function');
      expect(result.buttons).toBeDefined();
      expect(typeof result.buttons).toBe('object');
    });

    test('creates all four transaction type buttons', () => {
      const result = createTypeToggleGroup();

      expect(result.buttons.expense).toBeDefined();
      expect(result.buttons.income).toBeDefined();
      expect(result.buttons.transfer).toBeDefined();
      expect(result.buttons.refund).toBeDefined();
    });
  });

  describe('initial state', () => {
    test('defaults to expense type', () => {
      const result = createTypeToggleGroup();

      expect(result.currentType()).toBe('expense');
    });

    test('accepts custom initial type', () => {
      const result = createTypeToggleGroup({ initialType: 'income' });

      expect(result.currentType()).toBe('income');
    });

    test('sets expense button as active by default', () => {
      const result = createTypeToggleGroup();

      expect(result.buttons.expense.style.background).toBe(
        'var(--color-primary)'
      );
      expect(result.buttons.expense.style.border).toBe('1px solid transparent');
      expect(result.buttons.expense.style.color).toBe('white');
    });

    test('sets other buttons as inactive by default', () => {
      const result = createTypeToggleGroup();

      expect(result.buttons.income.style.background).toBe('transparent');
      expect(result.buttons.income.style.border).toBe(
        '1px solid var(--color-border)'
      );
      expect(result.buttons.income.style.color).toBe('var(--color-text-muted)');
    });
  });

  describe('setType method', () => {
    test('changes current type correctly', () => {
      const result = createTypeToggleGroup();

      result.setType('income');

      expect(result.currentType()).toBe('income');
    });

    test('updates button states when type changes', () => {
      const result = createTypeToggleGroup();

      result.setType('income');

      // Income button should be active
      expect(result.buttons.income.style.background).toBe('#10b981');
      expect(result.buttons.income.style.border).toBe('1px solid transparent');
      expect(result.buttons.income.style.color).toBe('white');

      // Expense button should be inactive
      expect(result.buttons.expense.style.background).toBe('transparent');
      expect(result.buttons.expense.style.border).toBe(
        '1px solid var(--color-border)'
      );
      expect(result.buttons.expense.style.color).toBe(
        'var(--color-text-muted)'
      );
    });

    test('calls onTypeChange callback when provided', () => {
      const onTypeChange = vi.fn();
      const result = createTypeToggleGroup({ onTypeChange });

      result.setType('transfer');

      expect(onTypeChange).toHaveBeenCalledWith('transfer');
    });

    test('handles all transaction types', () => {
      const result = createTypeToggleGroup();

      const types = ['expense', 'income', 'transfer', 'refund'];
      types.forEach(type => {
        result.setType(type);
        expect(result.currentType()).toBe(type);
      });
    });
  });

  describe('button interactions', () => {
    test('button click changes type', () => {
      const result = createTypeToggleGroup();

      // Simulate clicking income button
      const incomeButton = result.buttons.income;
      const clickHandler = incomeButton.addEventListener.mock.calls.find(
        ([event]) => event === 'click'
      )[1];

      clickHandler();

      expect(result.currentType()).toBe('income');
    });

    test('button click calls onTypeChange callback', () => {
      const onTypeChange = vi.fn();
      const result = createTypeToggleGroup({ onTypeChange });

      const transferButton = result.buttons.transfer;
      const clickHandler = transferButton.addEventListener.mock.calls.find(
        ([event]) => event === 'click'
      )[1];

      clickHandler();

      expect(onTypeChange).toHaveBeenCalledWith('transfer');
    });
  });

  describe('touch feedback', () => {
    test('adds touchstart and touchend listeners to buttons', () => {
      const result = createTypeToggleGroup();

      const button = result.buttons.expense;

      const touchStartCall = button.addEventListener.mock.calls.find(
        ([event]) => event === 'touchstart'
      );
      const touchEndCall = button.addEventListener.mock.calls.find(
        ([event]) => event === 'touchend'
      );
      const touchCancelCall = button.addEventListener.mock.calls.find(
        ([event]) => event === 'touchcancel'
      );

      expect(touchStartCall).toBeDefined();
      expect(touchEndCall).toBeDefined();
      expect(touchCancelCall).toBeDefined();
    });

    test('touchstart scales button down', () => {
      const result = createTypeToggleGroup();

      const button = result.buttons.expense;
      const touchStartHandler = button.addEventListener.mock.calls.find(
        ([event]) => event === 'touchstart'
      )[1];

      touchStartHandler();

      expect(button.style.transform).toBe('scale(0.96)');
    });

    test('touchend scales button back to normal', () => {
      const result = createTypeToggleGroup();

      const button = result.buttons.expense;
      const touchEndHandler = button.addEventListener.mock.calls.find(
        ([event]) => event === 'touchend'
      )[1];

      touchEndHandler();

      expect(button.style.transform).toBe('scale(1)');
    });

    test('touchcancel resets button transform', () => {
      const result = createTypeToggleGroup();

      const button = result.buttons.expense;
      const touchCancelHandler = button.addEventListener.mock.calls.find(
        ([event]) => event === 'touchcancel'
      )[1];

      touchCancelHandler();

      expect(button.style.transform).toBe('scale(1)');
    });
  });

  describe('hover effects', () => {
    test('adds hover listeners for desktop', () => {
      const result = createTypeToggleGroup();

      const button = result.buttons.expense;

      const mouseEnterCall = button.addEventListener.mock.calls.find(
        ([event]) => event === 'mouseenter'
      );
      const mouseLeaveCall = button.addEventListener.mock.calls.find(
        ([event]) => event === 'mouseleave'
      );

      expect(mouseEnterCall).toBeDefined();
      expect(mouseLeaveCall).toBeDefined();
    });

    test('mouseenter changes border for inactive buttons', () => {
      const result = createTypeToggleGroup();

      const button = result.buttons.income; // Inactive button
      const mouseEnterHandler = button.addEventListener.mock.calls.find(
        ([event]) => event === 'mouseenter'
      )[1];

      mouseEnterHandler();

      expect(button.style.border).toBe('1px solid var(--color-text-muted)');
      expect(button.style.backgroundColor).toBe('var(--color-surface-hover)');
    });

    test('mouseleave resets inactive button styles', () => {
      const result = createTypeToggleGroup();

      const button = result.buttons.income; // Inactive button
      const mouseLeaveHandler = button.addEventListener.mock.calls.find(
        ([event]) => event === 'mouseleave'
      )[1];

      mouseLeaveHandler();

      expect(button.style.border).toBe('1px solid var(--color-border)');
      expect(button.style.backgroundColor).toBe('transparent');
    });

    test('hover effects are ignored for active buttons', () => {
      const result = createTypeToggleGroup();

      const button = result.buttons.expense; // Active button
      const mouseEnterHandler = button.addEventListener.mock.calls.find(
        ([event]) => event === 'mouseenter'
      )[1];

      mouseEnterHandler();

      // Active button should not change on hover
      expect(button.style.border).toBe('1px solid transparent');
      expect(button.style.background).toBe('var(--color-primary)');
    });
  });

  describe('responsive behavior', () => {
    test('adds resize listener for responsive layout', () => {
      createTypeToggleGroup();

      expect(window.addEventListener).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      );
    });

    test('updates grid layout on resize', () => {
      const result = createTypeToggleGroup();

      // Simulate resize to mobile
      window.innerWidth = 300;
      const resizeHandler = window.addEventListener.mock.calls.find(
        ([event]) => event === 'resize'
      )[1];

      resizeHandler();

      expect(result.container.style.gridTemplateColumns).toBe('repeat(2, 1fr)');
    });
  });

  describe('button styling', () => {
    test('sets correct base styles for inactive buttons', () => {
      const result = createTypeToggleGroup();

      const button = result.buttons.income; // Check inactive button

      expect(button.type).toBe('button');
      expect(button.className).toBe('btn type-toggle-btn');
      expect(button.style.flex).toBe('1');
      expect(button.style.border).toBe('1px solid var(--color-border)');
      expect(button.style.transition).toBe('all 0.2s ease');
      expect(button.style.borderRadius).toBe('var(--radius-lg)');
    });

    test('sets compact sizing for mobile layout', () => {
      const result = createTypeToggleGroup();

      const button = result.buttons.expense;

      expect(button.style.minHeight).toBe('56px');
      expect(button.style.padding).toBe('var(--spacing-sm) var(--spacing-md)');
      expect(button.style.fontSize).toBe('0.9rem');
      expect(button.style.fontWeight).toBe('500');
    });

    test('sets correct text content for each button', () => {
      const result = createTypeToggleGroup();

      expect(result.buttons.expense.textContent).toBe('Expense');
      expect(result.buttons.income.textContent).toBe('Income');
      expect(result.buttons.transfer.textContent).toBe('Transfer');
      expect(result.buttons.refund.textContent).toBe('Refund');
    });
  });

  describe('callback handling', () => {
    test('handles missing onTypeChange callback gracefully', () => {
      const result = createTypeToggleGroup(); // No callback provided

      expect(() => result.setType('income')).not.toThrow();
      expect(result.currentType()).toBe('income');
    });

    test('calls onTypeChange with correct parameters', () => {
      const onTypeChange = vi.fn();
      const result = createTypeToggleGroup({ onTypeChange });

      result.setType('transfer');

      expect(onTypeChange).toHaveBeenCalledTimes(1);
      expect(onTypeChange).toHaveBeenCalledWith('transfer');
    });
  });
});
