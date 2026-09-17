import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TimePeriodSelector } from '../../src/components/TimePeriodSelector.js';

const findTab = (container, key) =>
  container.querySelector(`button[data-period="${key}"]`);
const findArrow = (button, direction) =>
  button.querySelector(`.arrow-${direction}`);

describe('TimePeriodSelector period navigation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-15T12:00:00.000Z'));
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it.each([
    ['lastMonth', 'monthOffset', -1, 'July 2026', 'August 2026'],
    ['quarter', 'quarterOffset', 0, 'Q2 2026', 'Q3 2026'],
    ['year', 'yearOffset', 0, '2025', '2026'],
  ])(
    'navigates %s via arrows, updating state, label, and offset',
    (key, offsetKey, initialOffset, backLabel, forwardLabel) => {
      const onChange = vi.fn();
      const container = TimePeriodSelector({ onChange });
      const button = findTab(container, key);

      findArrow(button, 'left').click();
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0].label).toBe(backLabel);
      expect(onChange.mock.calls[0][1]).toEqual({ isNavigation: true });
      expect(button.querySelector('.tab-label').textContent).toBe(backLabel);
      expect(button.dataset[offsetKey]).toBe((initialOffset - 1).toString());

      findArrow(button, 'right').click();
      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChange.mock.calls[1][0].label).toBe(forwardLabel);
      expect(button.querySelector('.tab-label').textContent).toBe(forwardLabel);
      expect(container.getCurrentPeriod().label).toBe(forwardLabel);
    }
  );

  it.each([
    ['lastMonth', 'month', 'This Month'],
    ['quarter', 'quarter', 'This Month'],
    ['year', 'year', 'This Month'],
  ])(
    'keeps %s navigation errors visible and clears them after recovery',
    (key, unit, label) => {
      const log = vi.spyOn(console, 'error').mockImplementation(() => {});
      const failure = new Error('parent failed');
      const onChange = vi.fn().mockImplementationOnce(() => {
        throw failure;
      });
      const container = TimePeriodSelector({ onChange });
      document.body.append(container);
      const button = findTab(container, key);

      findArrow(button, 'left').click();
      vi.advanceTimersByTime(300);

      const message = container.querySelector('.navigation-message');
      expect(message.textContent).toBe(`Error navigating to ${unit}`);
      expect(message.getAttribute('role')).toBe('alert');
      expect(message.style.display).toBe('block');
      expect(message.parentElement).toBe(container);
      expect(
        container.querySelector('.custom-range-selector').style.display
      ).toBe('none');
      expect(button.classList.contains('active')).toBe(false);
      expect(findTab(container, 'month').classList.contains('active')).toBe(true);
      expect(container.getCurrentPeriod().label).toBe(label);
      expect(log).toHaveBeenCalledWith(`Error navigating to ${unit}:`, failure);

      findArrow(button, 'right').click();
      expect(onChange).toHaveBeenCalledTimes(2);
      expect(message.style.display).toBe('none');
      expect(message.textContent).toBe('');
    }
  );
});
