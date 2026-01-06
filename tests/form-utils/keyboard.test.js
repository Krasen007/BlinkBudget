/**
 * Keyboard Handling - Unit Tests
 */

import { setupFormKeyboardHandling } from '../../src/utils/form-utils/keyboard.js';

// Mock mobileUtils for consistent testing
global.window = {
  mobileUtils: {
    isMobile: () => true,
    scrollIntoViewAboveKeyboard: vi.fn(),
  },
  innerHeight: 800,
  visualViewport: {
    height: 600,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

// Mock document for DOM operations
global.document = {
  body: {
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
    },
  },
  activeElement: null,
};

describe('Keyboard Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Reset document body classList mocks
    document.body.classList.add.mockClear();
    document.body.classList.remove.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('setupFormKeyboardHandling', () => {
    test('returns no-op cleanup function for desktop', () => {
      // Temporarily set to desktop
      window.mobileUtils.isMobile = () => false;

      const form = { style: {} };
      const inputs = [];

      const cleanup = setupFormKeyboardHandling(form, inputs);

      expect(typeof cleanup).toBe('function');
      expect(cleanup()).toBeUndefined(); // No-op returns undefined

      // Restore mobile
      window.mobileUtils.isMobile = () => true;
    });

    test('sets up focus handlers for inputs on mobile', () => {
      const form = { style: {} };
      const input1 = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      const input2 = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      const inputs = [input1, input2];

      setupFormKeyboardHandling(form, inputs);

      expect(input1.addEventListener).toHaveBeenCalledWith(
        'focus',
        expect.any(Function)
      );
      expect(input1.addEventListener).toHaveBeenCalledWith(
        'blur',
        expect.any(Function)
      );
      expect(input2.addEventListener).toHaveBeenCalledWith(
        'focus',
        expect.any(Function)
      );
      expect(input2.addEventListener).toHaveBeenCalledWith(
        'blur',
        expect.any(Function)
      );
    });

    test('sets up visual viewport handler when available', () => {
      const form = { style: {} };
      const inputs = [];

      setupFormKeyboardHandling(form, inputs);

      expect(window.visualViewport.addEventListener).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      );
    });

    test('returns cleanup function', () => {
      const form = { style: {} };
      const inputs = [];

      const cleanup = setupFormKeyboardHandling(form, inputs);

      expect(typeof cleanup).toBe('function');
    });
  });

  describe('input focus handling', () => {
    test('adds keyboard-visible class on input focus', () => {
      const form = { style: {} };
      const input = { addEventListener: vi.fn(), removeEventListener: vi.fn() };

      setupFormKeyboardHandling(form, [input]);

      const focusHandler = input.addEventListener.mock.calls.find(
        ([event]) => event === 'focus'
      )[1];

      focusHandler();

      expect(document.body.classList.add).toHaveBeenCalledWith(
        'keyboard-visible'
      );
    });

    test('sets form padding bottom on input focus', () => {
      const form = { style: {} };
      const input = { addEventListener: vi.fn(), removeEventListener: vi.fn() };

      setupFormKeyboardHandling(form, [input]);

      const focusHandler = input.addEventListener.mock.calls.find(
        ([event]) => event === 'focus'
      )[1];

      focusHandler();

      expect(form.style.paddingBottom).toBe('20vh');
    });

    test('calls scrollIntoViewAboveKeyboard with delay on focus', () => {
      vi.useFakeTimers();
      const form = { style: {} };
      const input = { addEventListener: vi.fn(), removeEventListener: vi.fn() };

      setupFormKeyboardHandling(form, [input]);

      const focusHandler = input.addEventListener.mock.calls.find(
        ([event]) => event === 'focus'
      )[1];

      focusHandler();

      expect(
        window.mobileUtils.scrollIntoViewAboveKeyboard
      ).not.toHaveBeenCalled();

      vi.advanceTimersByTime(300); // TIMING.KEYBOARD_DELAY

      expect(
        window.mobileUtils.scrollIntoViewAboveKeyboard
      ).toHaveBeenCalledWith(input, 80);

      vi.useRealTimers();
    });
  });

  describe('input blur handling', () => {
    test('removes keyboard-visible class when no inputs have focus', () => {
      const form = { style: {} };
      const input1 = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      const input2 = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      const inputs = [input1, input2];

      setupFormKeyboardHandling(form, inputs);

      const blurHandler = input1.addEventListener.mock.calls.find(
        ([event]) => event === 'blur'
      )[1];

      // Simulate blur with no active focus
      document.activeElement = null;
      blurHandler();

      vi.advanceTimersByTime(100); // TIMING.FOCUS_DELAY

      expect(document.body.classList.remove).toHaveBeenCalledWith(
        'keyboard-visible'
      );
      expect(form.style.paddingBottom).toBe('0');
    });

    test('keeps keyboard-visible class when another input has focus', () => {
      const form = { style: {} };
      const input1 = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      const input2 = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      const inputs = [input1, input2];

      setupFormKeyboardHandling(form, inputs);

      const blurHandler = input1.addEventListener.mock.calls.find(
        ([event]) => event === 'blur'
      )[1];

      // Simulate blur but input2 still has focus
      document.activeElement = input2;
      blurHandler();

      vi.advanceTimersByTime(100);

      expect(document.body.classList.remove).not.toHaveBeenCalled();
      expect(form.style.paddingBottom).not.toBe('0');
    });
  });

  describe('visual viewport handling', () => {
    test('adds keyboard-visible class when keyboard is shown', () => {
      // Simulate keyboard appearing (viewport height reduced)
      window.visualViewport.height = 400; // Keyboard taking 400px

      const form = { style: {} };
      const inputs = [];

      setupFormKeyboardHandling(form, inputs);

      const viewportHandler =
        window.visualViewport.addEventListener.mock.calls.find(
          ([event]) => event === 'resize'
        )[1];

      viewportHandler();

      expect(document.body.classList.add).toHaveBeenCalledWith(
        'keyboard-visible'
      );
      expect(form.style.paddingBottom).toBe('420px'); // keyboardHeight + 20
    });

    test('removes keyboard-visible class when keyboard is hidden', () => {
      // Simulate keyboard hidden (viewport height restored)
      window.visualViewport.height = 800;

      const form = { style: {} };
      const inputs = [];

      setupFormKeyboardHandling(form, inputs);

      const viewportHandler =
        window.visualViewport.addEventListener.mock.calls.find(
          ([event]) => event === 'resize'
        )[1];

      viewportHandler();

      expect(document.body.classList.remove).toHaveBeenCalledWith(
        'keyboard-visible'
      );
      expect(form.style.paddingBottom).toBe('0');
    });

    test('handles missing visualViewport gracefully', () => {
      const originalViewport = window.visualViewport;
      delete window.visualViewport;

      const form = { style: {} };
      const inputs = [];

      expect(() => setupFormKeyboardHandling(form, inputs)).not.toThrow();

      // Restore
      window.visualViewport = originalViewport;
    });
  });

  describe('cleanup function', () => {
    test('removes all event listeners', () => {
      const form = { style: {} };
      const input1 = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      const input2 = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
      const inputs = [input1, input2];

      const cleanup = setupFormKeyboardHandling(form, inputs);

      cleanup();

      expect(input1.removeEventListener).toHaveBeenCalledWith(
        'focus',
        expect.any(Function)
      );
      expect(input1.removeEventListener).toHaveBeenCalledWith(
        'blur',
        expect.any(Function)
      );
      expect(input2.removeEventListener).toHaveBeenCalledWith(
        'focus',
        expect.any(Function)
      );
      expect(input2.removeEventListener).toHaveBeenCalledWith(
        'blur',
        expect.any(Function)
      );
    });

    test('removes visual viewport listener', () => {
      const form = { style: {} };
      const inputs = [];

      const cleanup = setupFormKeyboardHandling(form, inputs);

      cleanup();

      expect(window.visualViewport.removeEventListener).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      );
    });

    test('removes keyboard-visible class and resets form padding', () => {
      const form = { style: { paddingBottom: '20vh' } };
      const inputs = [];

      const cleanup = setupFormKeyboardHandling(form, inputs);

      cleanup();

      expect(document.body.classList.remove).toHaveBeenCalledWith(
        'keyboard-visible'
      );
      expect(form.style.paddingBottom).toBe('0');
    });
  });

  describe('edge cases', () => {
    test('handles empty inputs array', () => {
      const form = { style: {} };
      const inputs = [];

      expect(() => setupFormKeyboardHandling(form, inputs)).not.toThrow();
    });

    test('handles missing mobileUtils methods gracefully', () => {
      const originalMobileUtils = window.mobileUtils;
      window.mobileUtils = { isMobile: () => true }; // Missing scrollIntoViewAboveKeyboard

      const form = { style: {} };
      const input = { addEventListener: vi.fn(), removeEventListener: vi.fn() };

      setupFormKeyboardHandling(form, [input]);

      const focusHandler = input.addEventListener.mock.calls.find(
        ([event]) => event === 'focus'
      )[1];

      expect(() => focusHandler()).not.toThrow();

      // Restore
      window.mobileUtils = originalMobileUtils;
    });

    test('handles missing window.visualViewport gracefully', () => {
      const originalViewport = window.visualViewport;
      delete window.visualViewport;

      const form = { style: {} };
      const inputs = [];

      const cleanup = setupFormKeyboardHandling(form, inputs);

      expect(() => cleanup()).not.toThrow();

      // Restore
      window.visualViewport = originalViewport;
    });
  });
});
