/**
 * Date Format Section Component
 * Automatically detects date format from device locale
 */

import { SettingsService } from '../core/settings-service.js';
import {
  SPACING,
  TOUCH_TARGETS,
  FONT_SIZES,
  DATE_FORMATS,
} from '../utils/constants.js';

// Auto-detect date format from device locale
function detectDateFormat() {
  const locale = navigator.language || navigator.userLanguage || 'en-US';

  // Check locale format
  if (locale.startsWith('en-US')) {
    return DATE_FORMATS.US;
  } else if (
    locale.startsWith('en-GB') ||
    locale.startsWith('en-IE') ||
    locale.startsWith('fr-') ||
    locale.startsWith('de-') ||
    locale.startsWith('es-') ||
    locale.startsWith('it-') ||
    locale.startsWith('pt-')
  ) {
    return DATE_FORMATS.EU;
  }

  // Default to ISO for most other locales
  return DATE_FORMATS.ISO;
}

export const DateFormatSection = ({ onFormatChange: _onFormatChange }) => {
  const section = document.createElement('div');
  section.className = 'card mobile-settings-card';
  section.style.marginBottom = SPACING.LG;

  const title = document.createElement('h3');
  title.textContent = 'Date Format';
  title.className = 'mobile-settings-title';
  Object.assign(title.style, {
    marginBottom: SPACING.MD,
    fontSize: FONT_SIZES.XL,
  });
  section.appendChild(title);

  // Auto-detect and save format if not already set
  let currentFormat = SettingsService.getSetting('dateFormat');
  if (!currentFormat) {
    currentFormat = detectDateFormat();
    SettingsService.saveSetting('dateFormat', currentFormat);
  }

  // Display detected format (read-only)
  const infoRow = document.createElement('div');
  infoRow.className = 'mobile-settings-option';
  Object.assign(infoRow.style, {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.LG,
    minHeight: TOUCH_TARGETS.MIN_HEIGHT,
    borderRadius: 'var(--radius-md)',
    marginBottom: SPACING.SM,
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-surface)',
  });

  const label = document.createElement('span');
  label.textContent = 'Auto-detected from device';
  Object.assign(label.style, {
    fontSize: FONT_SIZES.BASE,
    fontWeight: '500',
    color: 'var(--color-text-muted)',
  });

  const formatValue = document.createElement('span');
  const formatLabel =
    currentFormat === DATE_FORMATS.US
      ? 'MM/DD/YYYY'
      : currentFormat === DATE_FORMATS.EU
        ? 'DD/MM/YYYY'
        : 'YYYY-MM-DD';
  formatValue.textContent = formatLabel;
  Object.assign(formatValue.style, {
    fontSize: FONT_SIZES.BASE,
    fontWeight: '600',
    color: 'var(--color-text-main)',
  });

  infoRow.appendChild(label);
  infoRow.appendChild(formatValue);
  section.appendChild(infoRow);

  // Add explanatory note
  const note = document.createElement('p');
  note.textContent =
    'Date format is automatically detected from your device settings for a seamless experience.';
  Object.assign(note.style, {
    fontSize: FONT_SIZES.SM,
    color: 'var(--color-text-muted)',
    marginTop: SPACING.SM,
    marginBottom: '0',
    lineHeight: '1.4',
  });
  section.appendChild(note);

  return section;
};
