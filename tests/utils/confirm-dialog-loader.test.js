import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/components/ConfirmDialog.js', async () => {
  throw new Error('dialog chunk unavailable');
});

vi.mock('../../src/utils/toast-notifications.js', () => ({
  showErrorToast: vi.fn(),
}));

import { openConfirmDialog } from '../../src/utils/confirm-dialog-loader.js';
import { showErrorToast } from '../../src/utils/toast-notifications.js';

describe('openConfirmDialog', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('reports lazy-load failures and never invokes the destructive action', async () => {
    const onConfirm = vi.fn();
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const opened = await openConfirmDialog({ onConfirm });

    expect(opened).toBe(false);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(showErrorToast).toHaveBeenCalledWith(
      'Unable to open confirmation. No data was changed. Please try again.'
    );
    expect(consoleError).toHaveBeenCalledWith(
      'Failed to open confirmation dialog:',
      expect.any(Error)
    );
  });
});
