/**
 * BackupRestoreSection Component
 * UI for backup/restore operations in settings
 */

import { Button } from './Button.js';
import { ConfirmDialog } from './ConfirmDialog.js';
import { AlertDialog } from './ConfirmDialog.js';
import { SPACING, TOUCH_TARGETS, FONT_SIZES } from '../utils/constants.js';
import { BackupService } from '../core/backup-service.js';

export const BackupRestoreSection = () => {
  const section = document.createElement('div');
  section.className = 'card mobile-settings-card';
  section.style.marginBottom = SPACING.LG;

  const title = document.createElement('h3');
  title.textContent = 'Backup & Restore';
  title.className = 'mobile-settings-title';
  Object.assign(title.style, {
    marginBottom: SPACING.MD,
    fontSize: FONT_SIZES.XL,
  });
  section.appendChild(title);

  // Description
  const description = document.createElement('p');
  description.textContent =
    'Your data is automatically backed up daily. You can restore your data from the latest backup if needed.';
  Object.assign(description.style, {
    fontSize: FONT_SIZES.SM,
    color: 'var(--color-text-muted)',
    marginBottom: SPACING.MD,
    lineHeight: '1.5',
  });
  section.appendChild(description);

  // Buttons Container
  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.display = 'flex';
  buttonsContainer.style.flexDirection = 'column';
  buttonsContainer.style.gap = SPACING.SM;

  const restoreBtn = Button({
    text: 'Restore From Last Backup',
    variant: 'secondary',
    onClick: () => {
      ConfirmDialog({
        message:
          'WARNING: This will replace your current data with the last backup. Any changes made since the last backup will be LOST. Continue?',
        confirmText: 'Restore & Replace',
        title: 'Confirm Restore',
        onConfirm: async () => {
          try {
            await BackupService.restoreBackup();
            AlertDialog({
              message: `Successfully restored app state from backup.`,
            });
          } catch (error) {
            AlertDialog({ message: `Restore failed: ${error.message}` });
          }
        },
      });
    },
  });
  restoreBtn.className += ' touch-target mobile-form-button';
  Object.assign(restoreBtn.style, {
    width: '100%',
    minHeight: TOUCH_TARGETS.MIN_HEIGHT,
    padding: SPACING.MD,
    fontSize: FONT_SIZES.BASE,
  });

  buttonsContainer.appendChild(restoreBtn);
  section.appendChild(buttonsContainer);

  return section;
};
