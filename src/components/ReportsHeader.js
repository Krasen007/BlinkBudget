/**
 * ReportsHeader Component
 * Provides the header with navigation and keyboard shortcut information for the reports view.
 */

import { COLORS, SPACING, BREAKPOINTS } from '../utils/constants.js';
import { Button } from './Button.js';
import { Router } from '../core/router.js';

/**
 * Create reports header
 * @returns {HTMLElement}
 */
export const ReportsHeader = () => {
  const headerEl = document.createElement('header');
  headerEl.className = 'reports-header';
  headerEl.setAttribute('role', 'banner');
  headerEl.style.display = 'flex';
  headerEl.style.justifyContent = 'space-between';
  headerEl.style.alignItems = 'center';
  headerEl.style.marginBottom = SPACING.MD;
  headerEl.style.flexShrink = '0';
  headerEl.style.position = 'sticky';
  headerEl.style.top = '0';
  headerEl.style.background = COLORS.BACKGROUND;
  headerEl.style.zIndex = '10';
  headerEl.style.padding = `${SPACING.SM} 0`;

  const leftSide = document.createElement('div');
  leftSide.style.display = 'flex';
  leftSide.style.alignItems = 'center';
  leftSide.style.gap = SPACING.MD;

  const backButton = Button({
    text: '← Back',
    onClick: () => Router.navigate('dashboard'),
    variant: 'ghost',
  });
  backButton.style.padding = `${SPACING.XS} ${SPACING.SM}`;
  backButton.style.fontSize = '0.875rem';
  backButton.style.flexShrink = '0';
  backButton.title = 'Back to Dashboard (Esc)';

  const title = document.createElement('h1');
  title.textContent = 'Reports & Insights';
  title.style.margin = '0';
  title.style.color = COLORS.TEXT_MAIN;
  title.style.fontSize =
    window.innerWidth < BREAKPOINTS.MOBILE ? '1.25rem' : '1.5rem';
  title.id = 'reports-title';

  leftSide.appendChild(backButton);
  leftSide.appendChild(title);

  const rightSide = document.createElement('div');
  rightSide.style.display = 'flex';
  rightSide.style.alignItems = 'center';
  rightSide.style.gap = SPACING.SM;

  if (window.innerWidth >= BREAKPOINTS.MOBILE) {
    const shortcutsInfo = document.createElement('div');
    shortcutsInfo.className = 'keyboard-shortcuts-info';
    shortcutsInfo.style.fontSize = '0.75rem';
    shortcutsInfo.style.color = COLORS.TEXT_MUTED;
    shortcutsInfo.style.textAlign = 'right';
    shortcutsInfo.style.lineHeight = '1.2';
    shortcutsInfo.innerHTML = `
            <div>Press <kbd style="background: ${COLORS.SURFACE}; padding: 2px 4px; border-radius: 3px; font-size: 0.7rem;">Esc</kbd> to go back</div>
            <div>Press <kbd style="background: ${COLORS.SURFACE}; padding: 2px 4px; border-radius: 3px; font-size: 0.7rem;">Ctrl+R</kbd> to refresh</div>
        `;
    rightSide.appendChild(shortcutsInfo);
  }

  headerEl.appendChild(leftSide);
  headerEl.appendChild(rightSide);

  return headerEl;
};
