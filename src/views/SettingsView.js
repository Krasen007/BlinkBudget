import { ButtonComponent } from '../components/Button.js';
import { ToastNotification } from '../components/ToastNotification.js';
import { Router } from '../core/router.js';
import { AccountSection } from '../components/AccountSection.js';
import { DataManagementSection } from '../components/DataManagementSection.js';
import { GeneralSection } from '../components/GeneralSection.js';
import { BackupRestoreSection } from '../components/BackupRestoreSection.js';
import { AccountDeletionSection } from '../components/AccountDeletionSection.js';
import { escapeHtml } from '../utils/security-utils.js';
import { SecuritySection } from '../components/SecuritySection.js';
import { FeedbackLink } from '../components/FeedbackLink.js';
import { SPACING, TOUCH_TARGETS, FONT_SIZES } from '../utils/constants.js';
import { DateFormatSection } from '../components/DateFormatSection.js';
import {
  CURRENT_VERSION,
  GITHUB_RELEASES_URL,
  checkForUpdatesWithFeedback,
} from '../pwa.js';
import { createButton } from '../utils/dom-factory.js';
import { createNavigationButtons } from '../utils/navigation-helper.js';

export const SettingsView = () => {
  const container = document.createElement('div');
  container.className = 'view-settings view-container';

  // Header - similar to FinancialPlanningView with back button
  const header = document.createElement('div');
  header.className = 'view-header view-sticky view-header-container';

  const topRow = document.createElement('div');
  topRow.className = 'view-header-row';

  // Left side with back button and title
  const leftSide = document.createElement('div');
  leftSide.style.display = 'flex';
  leftSide.style.alignItems = 'center';
  leftSide.style.gap = SPACING.MD;

  // Back button
  const backButton = document.createElement('button');
  backButton.innerHTML = '← Back';
  backButton.className = 'view-back-btn';
  backButton.title = 'Back to Dashboard';

  backButton.addEventListener('click', () => Router.navigate('dashboard'));

  // Title
  const title = document.createElement('h2');
  title.textContent = 'Settings';
  title.className = 'view-title';

  leftSide.appendChild(backButton);
  leftSide.appendChild(title);

  // Right side: navigation buttons
  const rightControls = createNavigationButtons('settings');

  // Add Save button to the left of navigation buttons
  const saveBtn = createButton({
    text: 'Save',
    className: 'btn btn-ghost',
    style: {
      padding: `${SPACING.SM} ${SPACING.SM}`,
      fontSize: FONT_SIZES.MD,
      width: 'auto',
      flexShrink: '0',
    },
    onClick: () => Router.navigate('dashboard'),
  });

  // Insert Save button at the beginning of rightControls
  rightControls.insertBefore(saveBtn, rightControls.firstChild);

  topRow.appendChild(leftSide);
  topRow.appendChild(rightControls);
  header.appendChild(topRow);
  container.appendChild(header);

  // Main content area - scrollable
  const content = document.createElement('div');
  content.className = 'view-content';
  content.id = 'settings-content';
  container.appendChild(content);

  // Account Section
  const accountSection = AccountSection();
  content.appendChild(accountSection);

  // Category Management Section
  const categoryManagementSection = document.createElement('div');
  categoryManagementSection.className = 'settings-section';
  // Security: Static strings, escaped for safety
  categoryManagementSection.innerHTML = `
    <div class="settings-section-header">
      <h3>${escapeHtml('🏷️ Category Management')}</h3>
      <p>${escapeHtml('Organize and customize your transaction categories')}</p>
    </div>
  `;
  const manageCategoriesBtn = ButtonComponent({
    text: 'Manage Categories',
    variant: 'primary',
    onClick: () => Router.navigate('category-manager'),
  });
  manageCategoriesBtn.style.width = '100%';
  categoryManagementSection.appendChild(manageCategoriesBtn);
  content.appendChild(categoryManagementSection);

  // General Section
  const generalSection = GeneralSection();
  content.appendChild(generalSection);

  // Advanced Settings Toggle
  const advancedToggleContainer = document.createElement('div');
  advancedToggleContainer.className = 'advanced-toggle';
  advancedToggleContainer.tabIndex = '0';
  advancedToggleContainer.role = 'button';
  advancedToggleContainer.setAttribute('aria-expanded', 'false');

  const advancedToggleLabel = document.createElement('span');
  advancedToggleLabel.textContent = '⚙️ Advanced Settings';
  advancedToggleLabel.className = 'advanced-toggle__label';

  const advancedToggleIcon = document.createElement('span');
  advancedToggleIcon.textContent = '▶';
  advancedToggleIcon.className = 'advanced-toggle__icon';

  let advancedSettingsVisible = false;
  const advancedSettingsSection = document.createElement('div');
  advancedSettingsSection.className = 'advanced-settings-section';

  const toggleAdvancedSettings = () => {
    advancedSettingsVisible = !advancedSettingsVisible;
    if (advancedSettingsVisible) {
      advancedSettingsSection.classList.add(
        'advanced-settings-section--visible'
      );
      advancedSettingsSection.classList.remove(
        'advanced-settings-section--closing'
      );
      advancedToggleIcon.classList.add('advanced-toggle__icon--expanded');
    } else {
      // Add closing animation class
      advancedSettingsSection.classList.add(
        'advanced-settings-section--closing'
      );
      advancedSettingsSection.classList.remove(
        'advanced-settings-section--visible'
      );
      advancedToggleIcon.classList.remove('advanced-toggle__icon--expanded');

      // Wait for animation to complete, then hide
      setTimeout(() => {
        advancedSettingsSection.classList.remove(
          'advanced-settings-section--closing'
        );
      }, 300);
    }
    advancedToggleContainer.setAttribute(
      'aria-expanded',
      advancedSettingsVisible
    );
  };

  advancedToggleContainer.appendChild(advancedToggleLabel);
  advancedToggleContainer.appendChild(advancedToggleIcon);
  content.appendChild(advancedToggleContainer);
  content.appendChild(advancedSettingsSection);

  advancedToggleContainer.addEventListener('click', toggleAdvancedSettings);
  advancedToggleContainer.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleAdvancedSettings();
    }
  });

  // Advanced Settings Sections (hidden by default)
  // Data Management Section
  const dataSection = DataManagementSection();
  advancedSettingsSection.appendChild(dataSection);

  // Date Format Section (with manual selection)
  const dateFormatSection = DateFormatSection({
    showAutoDetect: true,
    allowManualChange: true,
  });
  advancedSettingsSection.appendChild(dateFormatSection);

  // Backup & Restore Section
  const backupSection = BackupRestoreSection();
  advancedSettingsSection.appendChild(backupSection);
  // content.appendChild(advancedFilteringSection);

  // Security & Privacy Section
  const securitySection = SecuritySection();
  advancedSettingsSection.appendChild(securitySection);

  // Account Deletion Section
  const accountDeletionSection = AccountDeletionSection();
  advancedSettingsSection.appendChild(accountDeletionSection);

  // App Updates Section (under advanced settings)
  const updatesSection = document.createElement('div');
  updatesSection.className = 'settings-section';
  updatesSection.innerHTML = `
    <div class="settings-section-header">
      <h3>${escapeHtml('🔄 App Updates')}</h3>
    </div>
  `;

  const versionInfo = document.createElement('div');
  versionInfo.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: ${SPACING.XS} 0;
    border-bottom: 1px solid var(--color-border, #333);
    margin-bottom: ${SPACING.MD};
  `;
  versionInfo.innerHTML = `
    <span style="color: var(--color-text-muted, #888);">Current Version</span>
    <span style="font-weight: 600; color: var(--color-primary, #00d084);">v${escapeHtml(CURRENT_VERSION)}</span>
  `;
  updatesSection.appendChild(versionInfo);

  const checkUpdatesBtn = ButtonComponent({
    text: 'Check for Updates',
    variant: 'secondary',
    onClick: async () => {
      console.log('[PWA Update] Manual check triggered');

      // Show checking toast
      ToastNotification({
        message: 'Checking for updates...',
        variant: 'info',
        duration: 2000,
      });

      try {
        const updateFound = await checkForUpdatesWithFeedback();
        
        if (updateFound) {
          // Update dialog will be shown by pwa.js onNeedRefresh
          console.log('[PWA Update] Update found - dialog should appear');
        } else {
          ToastNotification({
            message: 'You have the latest version!',
            variant: 'success',
            duration: 3000,
          });
          console.log('[PWA Update] No updates available');
        }
      } catch (error) {
        console.error('[PWA Update] Manual check failed:', error);
        ToastNotification({
          message: 'Update check failed. Check your connection.',
          variant: 'error',
          duration: 3000,
        });
        return; // Stop execution to prevent success message from appearing
      }
    },
  });
  checkUpdatesBtn.style.width = '100%';
  updatesSection.appendChild(checkUpdatesBtn);

  const releaseNotesLink = document.createElement('a');
  releaseNotesLink.href = GITHUB_RELEASES_URL;
  releaseNotesLink.target = '_blank';
  releaseNotesLink.rel = 'noopener noreferrer';
  releaseNotesLink.setAttribute(
    'aria-label',
    'View Release Notes (opens in new tab)'
  );
  releaseNotesLink.textContent = '📋 View Release Notes';
  releaseNotesLink.style.cssText = `
    display: block;
    text-align: center;
    margin-top: 12px;
    color: var(--color-primary, #00d084);
    text-decoration: none;
    font-size: 0.9rem;
  `;
  updatesSection.appendChild(releaseNotesLink);

  advancedSettingsSection.appendChild(updatesSection);

  // Feedback Link Section (keep visible)
  const feedbackSection = FeedbackLink();
  content.appendChild(feedbackSection);

  const handleStorageUpdate = e => {
    console.log(
      `[Settings] Storage updated (${e.detail.key}), re-rendering...`
    );
    const parent = container.parentNode;
    if (parent) {
      parent.innerHTML = '';
      parent.appendChild(SettingsView());
    }
  };

  // Done Button
  const doneBtn = ButtonComponent({
    text: 'Done',
    variant: 'primary',
    onClick: () => Router.navigate('dashboard'),
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  });
  doneBtn.className += ' touch-target';
  Object.assign(doneBtn.style, {
    width: '100%',
    marginTop: 0,
    marginBottom: SPACING.LG,
    padding: SPACING.SM,
    minHeight: TOUCH_TARGETS.MIN_HEIGHT,
    fontWeight: '600',
  });
  content.appendChild(doneBtn);

  const handleBackupOperation = e => {
    const { operation, status, count, error } = e.detail;

    if (status === 'starting') {
      console.log(`${operation} starting...`);
    } else if (status === 'completed') {
      console.log(`${operation} completed${count ? ` (${count} items)` : ''}`);
    } else if (status === 'failed') {
      console.error(`${operation} failed:`, error);
    }
  };

  window.addEventListener('backup-operation', handleBackupOperation);

  const handleKeyDown = e => {
    if (e.key === 'Escape') {
      e.preventDefault();
      Router.navigate('dashboard');
    }
  };

  window.addEventListener('storage-updated', handleStorageUpdate);
  window.addEventListener('keydown', handleKeyDown);

  container.cleanup = () => {
    window.removeEventListener('storage-updated', handleStorageUpdate);
    window.removeEventListener('backup-operation', handleBackupOperation);
    window.removeEventListener('keydown', handleKeyDown);
    if (dataSection && typeof dataSection.cleanup === 'function') {
      dataSection.cleanup();
    }
    if (generalSection && typeof generalSection.cleanup === 'function') {
      generalSection.cleanup();
    }
  };

  return container;
};
