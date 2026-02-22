import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AmountPresetService } from '../../src/core/amount-preset-service.js';

describe('AmountPresetService', () => {
  let mockLocalStorage;

  beforeEach(() => {
    mockLocalStorage = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    global.localStorage = mockLocalStorage;
    AmountPresetService.resetPresets();
  });

  describe('getPresets', () => {
    it('should return empty array when no presets exist', () => {
      const presets = AmountPresetService.getPresets();
      expect(presets).toEqual([]);
    });
  });

  describe('recordAmount', () => {
    it('should record amount and update presets', () => {
      AmountPresetService.recordAmount(25.0);
      AmountPresetService.recordAmount(25.0);
      AmountPresetService.recordAmount(50.0);
      const presets = AmountPresetService.getPresets();
      expect(presets).toContain(25);
      expect(presets).toContain(50);
    });
    it('should ignore invalid amounts', () => {
      AmountPresetService.recordAmount(0);
      AmountPresetService.recordAmount(-10);
      AmountPresetService.recordAmount(null);
      const presets = AmountPresetService.getPresets();
      expect(presets).toEqual([]);
    });
    it('should normalize decimal amounts', () => {
      AmountPresetService.recordAmount(10.999);
      const count = AmountPresetService.getAmountCount(11);
      expect(count).toBe(1);
    });
  });

  describe('getPresets', () => {
    it('should return top 4 amounts by frequency', () => {
      AmountPresetService.recordAmount(10);
      AmountPresetService.recordAmount(10);
      AmountPresetService.recordAmount(10);
      AmountPresetService.recordAmount(20);
      AmountPresetService.recordAmount(20);
      AmountPresetService.recordAmount(30);
      AmountPresetService.recordAmount(40);
      AmountPresetService.recordAmount(50);
      AmountPresetService.recordAmount(60);
      const presets = AmountPresetService.getPresets();
      expect(presets).toHaveLength(4);
      expect(presets[0]).toBe(10);
    });
    it('should break ties by amount ascending', () => {
      AmountPresetService.recordAmount(10);
      AmountPresetService.recordAmount(20);
      const presets = AmountPresetService.getPresets();
      expect(presets[0]).toBe(10);
    });
  });

  describe('resetPresets', () => {
    it('should clear all presets', () => {
      AmountPresetService.recordAmount(25);
      AmountPresetService.resetPresets();
      const presets = AmountPresetService.getPresets();
      expect(presets).toEqual([]);
    });
  });

  describe('getFrequencyData', () => {
    it('should return frequency map of amounts', () => {
      AmountPresetService.recordAmount(25);
      AmountPresetService.recordAmount(25);
      AmountPresetService.recordAmount(50);
      const freq = AmountPresetService.getFrequencyData();
      expect(freq[25]).toBe(2);
      expect(freq[50]).toBe(1);
    });
  });

  describe('getAmountCount', () => {
    it('should return count for specific amount', () => {
      AmountPresetService.recordAmount(25.0);
      AmountPresetService.recordAmount(25.0);
      const count = AmountPresetService.getAmountCount(25);
      expect(count).toBe(2);
    });
    it('should return 0 for unknown amount', () => {
      const count = AmountPresetService.getAmountCount(100);
      expect(count).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle localStorage unavailable', () => {
      global.localStorage = undefined;
      expect(() => AmountPresetService.getPresets()).not.toThrow();
    });
  });
});
