import { afterEach, describe, expect, it, vi } from 'vitest';
import { DateFormatSection } from '../../src/components/DateFormatSection.js';
import { SettingsService } from '../../src/core/settings-service.js';
import { showErrorToast } from '../../src/utils/toast-notifications.js';

vi.mock('../../src/core/settings-service.js', () => ({
  SettingsService: {
    getSetting: vi.fn(() => 'US'),
    saveSetting: vi.fn(),
  },
}));

vi.mock('../../src/utils/toast-notifications.js', () => ({
  showErrorToast: vi.fn(),
}));

describe('DateFormatSection save feedback', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('reverts to the last saved format and reports a failed save without notifying consumers', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const dispatch = vi.spyOn(window, 'dispatchEvent');
    const section = DateFormatSection({ allowManualChange: true });
    const select = section.querySelector('select');
    const failure = new Error('Storage unavailable');

    select.value = 'EU';
    select.dispatchEvent(new Event('change'));
    expect(SettingsService.saveSetting).toHaveBeenCalledWith(
      'dateFormat',
      'EU'
    );
    expect(select.value).toBe('EU');
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'date-format-changed',
        detail: { format: 'EU' },
      })
    );
    dispatch.mockClear();

    SettingsService.saveSetting.mockImplementationOnce(() => {
      throw failure;
    });
    select.value = 'ISO';
    select.dispatchEvent(new Event('change'));

    expect.soft(select.value).toBe('EU');
    expect
      .soft(showErrorToast)
      .toHaveBeenCalledWith('Failed to save date format. Please try again.');
    expect(dispatch).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      '[DateFormatSection] Failed to save date format:',
      failure
    );
  });
});
