import { afterEach, expect, it, vi } from 'vitest';
import { GeneralSection } from '../../src/components/GeneralSection.js';
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
vi.mock('../../src/utils/toast-notifications.js', () => ({
  showToast: vi.fn(),
  TOAST_TYPES: { ERROR: 'error' },
}));

// The module factory fails during the dynamic import, before any dialog exists.
vi.mock('../../src/components/ConfirmDialog.js', () => {
  throw new Error('Instructions chunk unavailable');
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

it('reports a rejected instructions import and leaves installation available', async () => {
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  const section = GeneralSection();
  const button = [...section.querySelectorAll('button')].find(
    element => element.textContent === 'Install App'
  );

  try {
    button.click();
    await vi.dynamicImportSettled();

    expect(showToast).toHaveBeenCalledExactlyOnceWith(
      'Unable to load installation instructions. Please try again.',
      'error'
    );
    expect(log).toHaveBeenCalledWith(
      '[GeneralSection] Failed to load install instructions:',
      expect.any(Error)
    );
    expect(button.disabled).toBe(false);
    expect(button.textContent).toBe('Install App');
    expect(section.querySelector('[role="dialog"]')).toBeNull();
  } finally {
    section.cleanup();
  }
});
