/**
 * BackupRestoreSection Component
 * UI for backup/restore operations in settings
 */

import { ButtonComponent } from './Button.js';
import { SPACING, TOUCH_TARGETS, FONT_SIZES } from '../utils/constants.js';
import { BackupService } from '../core/backup-service.js';
import { SettingsService } from '../core/settings-service.js';

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

  // Backup Metadata Section
  const metadataContainer = document.createElement('div');
  metadataContainer.className = 'backup-metadata';
  Object.assign(metadataContainer.style, {
    backgroundColor: 'var(--color-surface)',
    padding: SPACING.MD,
    borderRadius: '8px',
    marginBottom: SPACING.MD,
    border: '1px solid var(--color-border)',
  });

  const metadataTitle = document.createElement('h4');
  metadataTitle.textContent = 'Backup Information';
  Object.assign(metadataTitle.style, {
    fontSize: FONT_SIZES.BASE,
    fontWeight: '600',
    marginBottom: SPACING.SM,
    color: 'var(--color-text)',
  });
  metadataContainer.appendChild(metadataTitle);

  const updateBackupMetadata = () => {
    const lastBackupDate = SettingsService.getSetting('lastBackupDate');
    const lastBackupDataAsOf = SettingsService.getSetting('lastBackupDataAsOf');

    metadataContainer.innerHTML = '';
    metadataContainer.appendChild(metadataTitle);

    if (lastBackupDate) {
      const backupDateEl = document.createElement('div');
      backupDateEl.style.fontSize = FONT_SIZES.SM;
      backupDateEl.style.color = 'var(--color-text-muted)';
      backupDateEl.style.marginBottom = SPACING.XS;

      const backupDate = new Date(lastBackupDate);

      // Validate date before displaying
      if (isNaN(backupDate.getTime())) {
        backupDateEl.textContent = 'Last backup: unknown';
      } else {
        backupDateEl.textContent = `Last backup: ${backupDate.toLocaleDateString()} ${backupDate.toLocaleTimeString()}`;
      }

      metadataContainer.appendChild(backupDateEl);

      if (lastBackupDataAsOf) {
        const dataAsOfEl = document.createElement('div');
        dataAsOfEl.style.fontSize = FONT_SIZES.SM;
        dataAsOfEl.style.color = 'var(--color-text-muted)';
        dataAsOfEl.style.marginBottom = SPACING.XS;

        const dataAsOfDate = new Date(lastBackupDataAsOf);

        // Validate dataAsOf date before displaying
        if (isNaN(dataAsOfDate.getTime())) {
          dataAsOfEl.textContent = 'Data as of: unknown';
        } else {
          dataAsOfEl.textContent = `Data as of: ${dataAsOfDate.toLocaleDateString()}`;
        }
        metadataContainer.appendChild(dataAsOfEl);
      }
    } else {
      const noBackupEl = document.createElement('div');
      noBackupEl.style.fontSize = FONT_SIZES.SM;
      noBackupEl.style.color = 'var(--color-text-muted)';
      noBackupEl.textContent = 'No backups created yet';
      metadataContainer.appendChild(noBackupEl);
    }
  };

  updateBackupMetadata();

  // Create AbortController for cleanup
  const abortController = new AbortController();

  // Listen for backup events to update metadata
  window.addEventListener('backup-operation', updateBackupMetadata, {
    signal: abortController.signal,
  });

  section.appendChild(metadataContainer);

  // Buttons Container
  const buttonsContainer = document.createElement('div');
  buttonsContainer.style.display = 'flex';
  buttonsContainer.style.flexDirection = 'column';
  buttonsContainer.style.gap = SPACING.SM;

  const restoreBtn = ButtonComponent({
    text: 'Restore From Last Backup',
    variant: 'secondary',
    onClick: () => {
      import('./ConfirmDialog.js')
        .then(({ ConfirmDialog, AlertDialog }) => {
          ConfirmDialog({
            message:
              'WARNING: This will replace your current data with the last backup. Any changes made since the last backup will be LOST. Continue?',
            confirmText: 'Restore & Replace',
            cancelText: 'Cancel',
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
        })
        .catch(error => {
          console.error('Error loading ConfirmDialog:', error);
        });
    },
  });
  restoreBtn.classList.add('touch-target', 'mobile-form-button');
  Object.assign(restoreBtn.style, {
    width: '100%',
    minHeight: TOUCH_TARGETS.MIN_HEIGHT,
    padding: SPACING.MD,
    fontSize: FONT_SIZES.BASE,
  });

  buttonsContainer.appendChild(restoreBtn);
  section.appendChild(buttonsContainer);

  // Add cleanup method
  section.cleanup = () => {
    abortController.abort();
  };

  return section;
};
