import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QuickAmountPresets } from '../../src/components/QuickAmountPresets.js';
import { AmountPresetService } from '../../src/core/amount-preset-service.js';

describe('QuickAmountPresets Component', () => {
  let mockLocalStorage;

  beforeEach(() => {
    mockLocalStorage = {
      getItem: vi
        .fn()
        .mockReturnValue(
          JSON.stringify({ amounts: {}, presets: [5, 10, 20, 50] })
        ),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    global.localStorage = mockLocalStorage;
    AmountPresetService.resetPresets();
  });

  describe('Rendering', () => {
    it('should render preset buttons', () => {
      const container = QuickAmountPresets({ onPresetSelect: () => {} });
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have accessible role group', () => {
      const container = QuickAmountPresets({ onPresetSelect: () => {} });
      expect(container.getAttribute('role')).toBe('group');
    });

    it('should have aria-label', () => {
      const container = QuickAmountPresets({ onPresetSelect: () => {} });
      expect(container.getAttribute('aria-label')).toBeTruthy();
    });
  });

  describe('Interaction', () => {
    it('should call onPresetSelect when button clicked', () => {
      const onSelect = vi.fn();
      const container = QuickAmountPresets({ onPresetSelect: onSelect });
      const button = container.querySelector('button');
      button.click();
      expect(onSelect).toHaveBeenCalled();
    });

    it('should be keyboard accessible', () => {
      const onSelect = vi.fn();
      const container = QuickAmountPresets({ onPresetSelect: onSelect });
      const button = container.querySelector('button');
      button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
      expect(onSelect).toHaveBeenCalled();
    });

    it('should handle space key', () => {
      const onSelect = vi.fn();
      const container = QuickAmountPresets({ onPresetSelect: onSelect });
      const button = container.querySelector('button');
      button.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
      expect(onSelect).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have tabindex on buttons', () => {
      const container = QuickAmountPresets({ onPresetSelect: () => {} });
      const button = container.querySelector('button');
      expect(button.getAttribute('tabindex')).toBe('0');
    });

    it('should have aria-label on buttons', () => {
      const container = QuickAmountPresets({ onPresetSelect: () => {} });
      const button = container.querySelector('button');
      expect(button.getAttribute('aria-label')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should render default presets when none stored', () => {
      mockLocalStorage.getItem = vi.fn().mockReturnValue(null);
      AmountPresetService.resetPresets();
      const container = QuickAmountPresets({ onPresetSelect: () => {} });
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBe(4);
    });
  });
});
