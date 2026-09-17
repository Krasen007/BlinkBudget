import { afterEach, describe, expect, it, vi } from 'vitest';
import { GeneralSection } from '../../src/components/GeneralSection.js';
import { PWAInstructionsDialog } from '../../src/components/ConfirmDialog.js';
import { showToast } from '../../src/utils/toast-notifications.js';

vi.mock('../../src/core/auth-service.js', () => ({ AuthService: {} }));
vi.mock('../../src/core/router.js', () => ({ Router: {} }));

vi.mock('../../src/core/install.js', () => ({
  InstallService: {
    isStandalone: vi.fn(() => false),
    isInstallable: vi.fn(() => false),
    subscribe: vi.fn(() => () => {}),
  },
}));

vi.mock('../../src/components/ConfirmDialog.js', () => ({
  PWAInstructionsDialog: vi.fn(),
}));

vi.mock('../../src/utils/toast-notifications.js', () => ({
  showToast: vi.fn(),
  TOAST_TYPES: { ERROR: 'error' },
}));

describe('GeneralSection install instructions failure feedback', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('reports failed dialog construction without claiming the instructions opened', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    PWAInstructionsDialog.mockImplementation(() => {
      throw new Error('module load failed');
    });

    const section = GeneralSection();
    const installButton = [...section.querySelectorAll('button')].find(
      button => button.textContent.trim() === 'Install App'
    );
    expect(installButton).toBeDefined();

    installButton.click();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(PWAInstructionsDialog).toHaveBeenCalledTimes(1);
    expect(showToast).toHaveBeenCalledWith(
      'Unable to load installation instructions. Please try again.',
      'error'
    );
    expect(console.error).toHaveBeenCalledWith(
      '[GeneralSection] Failed to load install instructions:',
      expect.any(Error)
    );
  });
});
