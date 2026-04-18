import { ButtonComponent } from '../components/Button.js';
import { Router } from '../core/router.js';
import { AccountSection } from '../components/AccountSection.js';
import { DateFormatSection } from '../components/DateFormatSection.js';
import { DataManagementSection } from '../components/DataManagementSection.js';
import { GeneralSection } from '../components/GeneralSection.js';
import { BackupRestoreSection } from '../components/BackupRestoreSection.js';
import { AccountDeletionSection } from '../components/AccountDeletionSection.js';
import { escapeHtml } from '../utils/security-utils.js';
/* Disabled until further notice */
//import { SmartSuggestionsSection } from '../components/SmartSuggestionsSection.js';
/* Disabled until further notice */
//import { AdvancedFilteringSection } from '../components/AdvancedFilteringSection.js';
import { SecuritySection } from '../components/SecuritySection.js';
import { FeedbackLink } from '../components/FeedbackLink.js';
import { SPACING, TOUCH_TARGETS, FONT_SIZES } from '../utils/constants.js';

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

  // Date Format Section
  const dateFormatSection = DateFormatSection();
  content.appendChild(dateFormatSection);

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
      advancedToggleIcon.classList.add('advanced-toggle__icon--expanded');
    } else {
      advancedSettingsSection.classList.remove(
        'advanced-settings-section--visible'
      );
      advancedToggleIcon.classList.remove('advanced-toggle__icon--expanded');
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

  // Backup & Restore Section
  const backupSection = BackupRestoreSection();
  advancedSettingsSection.appendChild(backupSection);

  /* Disabled until further notice */
  // // Smart Suggestions Section
  // const smartSuggestionsSection = SmartSuggestionsSection();
  // content.appendChild(smartSuggestionsSection);
  /* Disabled until further notice */
  // // Advanced Filtering Section
  // const advancedFilteringSection = AdvancedFilteringSection();
  // content.appendChild(advancedFilteringSection);

  // Security & Privacy Section
  const securitySection = SecuritySection();
  advancedSettingsSection.appendChild(securitySection);

  // Account Deletion Section
  const accountDeletionSection = AccountDeletionSection();
  advancedSettingsSection.appendChild(accountDeletionSection);

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
