/**
 * General Settings Section Component
 * Handles Refresh, Install PWA, and Logout actions
 */

import { Button } from './Button.js';
import { Router } from '../core/router.js';
import { AuthService } from '../core/auth-service.js';
import { InstallService } from '../core/install.js';
import { SPACING, TOUCH_TARGETS, FONT_SIZES } from '../utils/constants.js';

export const GeneralSection = () => {
  const section = document.createElement('div');
  section.className = 'card mobile-settings-card';
  section.style.marginBottom = SPACING.LG;

  const title = document.createElement('h3');
  title.textContent = 'General';
  title.className = 'mobile-settings-title';
  Object.assign(title.style, {
    marginBottom: SPACING.MD,
    fontSize: FONT_SIZES.XL,
  });
  section.appendChild(title);

  // Refresh App Button
  const refreshBtn = Button({
    text: 'Refresh App',
    variant: 'ghost',
    onClick: () => {
      window.location.hash = '#dashboard';
      window.location.reload();
    },
  });
  refreshBtn.className += ' touch-target';
  Object.assign(refreshBtn.style, {
    width: '100%',
    marginTop: SPACING.SM,
    minHeight: TOUCH_TARGETS.MIN_HEIGHT,
    padding: SPACING.SM,
    fontSize: FONT_SIZES.MD,
    fontWeight: '500',
    color: 'var(--color-primary-light)',
  });
  section.appendChild(refreshBtn);

  // Install App Button (Conditional)
  const installBtn = Button({
    text: 'Install App',
    variant: 'primary',
    onClick: async () => {
      if (InstallService.isInstallable()) {
        const installed = await InstallService.promptInstall();
        if (installed) {
          installBtn.style.display = 'none';
        }
      } else {
        // Show manual instructions
        import('./ConfirmDialog.js').then(({ PWAInstructionsDialog }) => {
          PWAInstructionsDialog();
        });
      }
    },
  });

  const updateInstallBtnVisibility = () => {
    const isStandalone = InstallService.isStandalone();
    const isMobile = window.mobileUtils?.isMobile();
    const isInstallable = InstallService.isInstallable();

    if (isStandalone) {
      installBtn.style.display = 'none';
    } else if (isInstallable || isMobile) {
      installBtn.style.display = 'block';
    } else {
      installBtn.style.display = 'none';
    }
  };

  installBtn.className += ' touch-target';
  Object.assign(installBtn.style, {
    width: '100%',
    marginTop: SPACING.SM,
    minHeight: TOUCH_TARGETS.MIN_HEIGHT,
    padding: SPACING.SM,
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  });

  updateInstallBtnVisibility();

  // Subscribe to installable changes
  const unsubscribeInstall = InstallService.subscribe(() => {
    updateInstallBtnVisibility();
  });

  section.appendChild(installBtn);

  // Logout Button
  const logoutBtn = Button({
    text: 'Logout',
    variant: 'ghost',
    onClick: () => {
      import('./ConfirmDialog.js').then(({ ConfirmDialog }) => {
        ConfirmDialog({
          title: 'Logout',
          message: 'Are you sure you want to logout? Cloud sync will stop.',
          confirmText: 'Logout',
          variant: 'danger',
          onConfirm: async () => {
            await AuthService.logout();
            Router.navigate('login');
          },
        });
      });
    },
  });
  logoutBtn.className += ' touch-target';
  Object.assign(logoutBtn.style, {
    width: '100%',
    marginTop: SPACING.SM,
    minHeight: TOUCH_TARGETS.MIN_HEIGHT,
    padding: SPACING.SM,
    fontSize: FONT_SIZES.MD,
    fontWeight: '500',
    color: 'var(--color-error)',
  });
  section.appendChild(logoutBtn);

  // Store cleanup
  section.cleanup = () => {
    unsubscribeInstall();
  };

  return section;
};
