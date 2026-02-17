import { Button } from '../components/Button.js';
import { Router } from '../core/router.js';
import { AccountSection } from '../components/AccountSection.js';
import { DateFormatSection } from '../components/DateFormatSection.js';
import { DataManagementSection } from '../components/DataManagementSection.js';
import { GeneralSection } from '../components/GeneralSection.js';
import { BackupRestoreSection } from '../components/BackupRestoreSection.js';
import { AccountDeletionSection } from '../components/AccountDeletionSection.js';
import { SmartSuggestionsSection } from '../components/SmartSuggestionsSection.js';
import { AdvancedFilteringSection } from '../components/AdvancedFilteringSection.js';
import {
  SPACING,
  TOUCH_TARGETS,
  FONT_SIZES,
} from '../utils/constants.js';

import { COLORS } from '../utils/constants.js';
import { createButton } from '../utils/dom-factory.js';
import { createNavigationButtons } from '../utils/navigation-helper.js';

export const SettingsView = () => {
  const container = document.createElement('div');
  container.className = 'view-settings view-container';

  // Header - similar to FinancialPlanningView with back button
  const header = document.createElement('div');
  header.className = 'view-header view-sticky view-header-container';
  header.style.background = COLORS.BACKGROUND;


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

  // Date Format Section
  const dateFormatSection = DateFormatSection({
    onFormatChange: () => {
      // Re-render view to show update
      const parent = container.parentNode;
      if (parent) {
        parent.innerHTML = '';
        parent.appendChild(SettingsView());
      }
    },
  });
  content.appendChild(dateFormatSection);

  // Data Management Section
  const dataSection = DataManagementSection();
  content.appendChild(dataSection);

  // Backup & Restore Section
  const backupSection = BackupRestoreSection();
  content.appendChild(backupSection);

  // General Section
  const generalSection = GeneralSection();
  content.appendChild(generalSection);

  // Category Management Section
  const categoryManagementSection = document.createElement('div');
  categoryManagementSection.className = 'settings-section';
  categoryManagementSection.innerHTML = `
    <div class="settings-section-header">
      <h3>🏷️ Category Management</h3>
      <p>Organize and customize your transaction categories</p>
    </div>
  `;
  const manageCategoriesBtn = Button({
    text: 'Manage Categories',
    variant: 'primary',
    onClick: () => Router.navigate('category-manager'),
  });
  manageCategoriesBtn.style.width = '100%';
  categoryManagementSection.appendChild(manageCategoriesBtn);
  content.appendChild(categoryManagementSection);

  // Smart Suggestions Section
  const smartSuggestionsSection = SmartSuggestionsSection();
  content.appendChild(smartSuggestionsSection);

  // Advanced Filtering Section
  const advancedFilteringSection = AdvancedFilteringSection();
  content.appendChild(advancedFilteringSection);

  // Done Button
  const doneBtn = Button({
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

  // Account Deletion Section
  const accountDeletionSection = AccountDeletionSection();
  content.appendChild(accountDeletionSection);



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
