import { Button } from '../components/Button.js';
import { Router } from '../core/router.js';
import { AccountSection } from '../components/AccountSection.js';
import { DateFormatSection } from '../components/DateFormatSection.js';
import { DataManagementSection } from '../components/DataManagementSection.js';
import { GeneralSection } from '../components/GeneralSection.js';
import { BackupRestoreSection } from '../components/BackupRestoreSection.js';
import { AccountDeletionSection } from '../components/AccountDeletionSection.js';
import {
  SPACING,
  TOUCH_TARGETS,
  FONT_SIZES,
  BREAKPOINTS,
} from '../utils/constants.js';
import { COLORS } from '../utils/constants.js';
import { createButton } from '../utils/dom-factory.js';
import { createNavigationButtons } from '../utils/navigation-helper.js';

export const SettingsView = () => {
  const container = document.createElement('div');
  container.className = 'view-settings view-container';

  // Header - similar to FinancialPlanningView with back button
  const header = document.createElement('div');
  header.style.marginBottom = SPACING.SM;
  header.style.flexShrink = '0';
  header.style.position = 'sticky'; // Sticky positioning
  header.style.top = '0'; // Stick to top
  header.style.width = '100%';
  header.style.background = COLORS.BACKGROUND; // Ensure background covers content
  header.style.zIndex = '10'; // Above content
  header.style.padding = `${SPACING.SM} 0`; // Vertical padding, horizontal handled by container

  const topRow = document.createElement('div');
  topRow.style.display = 'flex';
  topRow.style.justifyContent = 'space-between';
  topRow.style.alignItems = 'center';

  // Left side with back button and title
  const leftSide = document.createElement('div');
  leftSide.style.display = 'flex';
  leftSide.style.alignItems = 'center';
  leftSide.style.gap = SPACING.MD;

  // Back button
  const backButton = document.createElement('button');
  backButton.innerHTML = '← Back';
  backButton.className = 'btn btn-ghost settings-back-btn';
  backButton.style.fontSize = '1rem';
  backButton.style.padding = `${SPACING.SM} ${SPACING.MD}`;
  backButton.style.border = `1px solid ${COLORS.BORDER}`;
  backButton.style.borderRadius = 'var(--radius-md)';
  backButton.style.background = COLORS.SURFACE;
  backButton.style.color = COLORS.TEXT_MAIN;
  backButton.style.cursor = 'pointer';
  backButton.style.fontWeight = '500';
  backButton.style.transition = 'all 0.2s ease';
  backButton.title = 'Back to Dashboard';

  // Hover effects
  backButton.addEventListener('mouseenter', () => {
    backButton.style.background = COLORS.SURFACE_HOVER;
    backButton.style.borderColor = COLORS.PRIMARY;
  });

  backButton.addEventListener('mouseleave', () => {
    backButton.style.background = COLORS.SURFACE;
    backButton.style.borderColor = COLORS.BORDER;
  });

  backButton.addEventListener('click', () => Router.navigate('dashboard'));

  // Title
  const title = document.createElement('h2');
  title.textContent = 'Settings';
  title.style.margin = '0';
  title.style.fontSize =
    window.innerWidth < BREAKPOINTS.MOBILE ? '1.25rem' : 'h2';
  title.style.fontWeight = 'bold';
  title.style.color = COLORS.TEXT_MAIN;

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

  // Main content wrapper
  const contentWrapper = document.createElement('div');

  container.appendChild(contentWrapper);

  // Account Section
  const accountSection = AccountSection();
  contentWrapper.appendChild(accountSection);

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
  contentWrapper.appendChild(dateFormatSection);

  // Data Management Section
  const dataSection = DataManagementSection();
  contentWrapper.appendChild(dataSection);

  // Backup & Restore Section
  const backupSection = BackupRestoreSection();
  contentWrapper.appendChild(backupSection);

  // General Section
  const generalSection = GeneralSection();
  contentWrapper.appendChild(generalSection);

  /// Privacy system disabled for now, to be implemented backend later 
  // import { createPrivacyControls, initializePrivacyControls } from '../components/PrivacyControls.js';
  // // Privacy Controls Section
  // const privacySection = createPrivacyControls();
  // contentWrapper.appendChild(privacySection);

  // // Initialize privacy controls functionality
  // initializePrivacyControls(privacySection);

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
    marginTop: SPACING.SM,
    marginBottom: 0,
    padding: SPACING.SM,
    minHeight: TOUCH_TARGETS.MIN_HEIGHT,
    fontWeight: '600',
  });
  contentWrapper.appendChild(doneBtn);

  // Account Deletion Section
  const deletionSection = AccountDeletionSection();
  contentWrapper.appendChild(deletionSection);

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
