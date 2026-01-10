import { Button } from '../components/Button.js';
import { Router } from '../core/router.js';
import { AccountSection } from '../components/AccountSection.js';
import { DateFormatSection } from '../components/DateFormatSection.js';
import { DataManagementSection } from '../components/DataManagementSection.js';
import { GeneralSection } from '../components/GeneralSection.js';
import { SPACING, TOUCH_TARGETS, FONT_SIZES } from '../utils/constants.js';
import { createButton } from '../utils/dom-factory.js';

export const SettingsView = () => {
  const container = document.createElement('div');
  container.className = 'view-settings view-container';

  // Header - similar to FinancialPlanningView with back button
  const header = document.createElement('div');
  header.style.marginBottom = SPACING.SM;
  header.style.flexShrink = '0';

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
  backButton.style.border = `1px solid hsl(240, 5%, 20%)`;
  backButton.style.borderRadius = 'var(--radius-md)';
  backButton.style.background = 'hsl(240, 10%, 10%)';
  backButton.style.color = 'hsl(240, 5%, 65%)';
  backButton.style.cursor = 'pointer';
  backButton.style.fontWeight = '500';
  backButton.style.transition = 'all 0.2s ease';
  backButton.title = 'Back to Dashboard';

  // Hover effects
  backButton.addEventListener('mouseenter', () => {
    backButton.style.background = 'hsl(240, 10%, 15%)';
    backButton.style.borderColor = 'hsl(250, 84%, 60%)';
  });

  backButton.addEventListener('mouseleave', () => {
    backButton.style.background = 'hsl(240, 10%, 10%)';
    backButton.style.borderColor = 'hsl(240, 5%, 20%)';
  });

  backButton.addEventListener('click', () => Router.navigate('dashboard'));

  // Title
  const title = document.createElement('h2');
  title.textContent = 'Settings';
  title.style.margin = '0';
  // title.style.fontSize = '2rem';
  // title.style.fontWeight = 'bold';
  // title.style.color = 'hsl(240, 5%, 65%)';

  leftSide.appendChild(backButton);
  leftSide.appendChild(title);

  // Save button in top right (same format as back button in AddView)
  const rightControls = document.createElement('div');
  rightControls.style.display = 'flex';
  rightControls.style.alignItems = 'center';

  const saveBtn = createButton({
    text: 'Save',
    className: 'btn btn-ghost',
    style: {
      height: TOUCH_TARGETS.MIN_HEIGHT,
      minHeight: TOUCH_TARGETS.MIN_HEIGHT,
      padding: `${SPACING.SM} ${SPACING.SM}`,
      fontSize: FONT_SIZES.MD,
      width: 'auto',
      flexShrink: '0',
    },
    onClick: () => Router.navigate('dashboard'),
  });

  rightControls.appendChild(saveBtn);

  topRow.appendChild(leftSide);
  topRow.appendChild(rightControls);
  header.appendChild(topRow);
  container.appendChild(header);

  // Account Section
  const accountSection = AccountSection();
  container.appendChild(accountSection);

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
  container.appendChild(dateFormatSection);

  // Data Management Section
  const dataSection = DataManagementSection();
  container.appendChild(dataSection);

  // General Section
  const generalSection = GeneralSection();
  container.appendChild(generalSection);

  // OK Button
  const doneBtn = Button({
    text: 'OK',
    variant: 'primary',
    onClick: () => Router.navigate('dashboard'),
  });
  doneBtn.className += ' touch-target';
  Object.assign(doneBtn.style, {
    width: '100%',
    marginTop: SPACING.SM,
    marginBottom: 0,
    padding: SPACING.SM,
    minHeight: TOUCH_TARGETS.MIN_HEIGHT,
    fontSize: FONT_SIZES.MD,
    fontWeight: '600',
  });
  container.appendChild(doneBtn);

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
