/**
 * Date Format Section Component
 * Automatically detects date format from device locale
 */

import { SettingsService } from '../core/settings-service.js';
import { SPACING, FONT_SIZES, DATE_FORMATS } from '../utils/constants.js';

// Auto-detect date format from device locale
function detectDateFormat() {
  const locale = navigator.language || navigator.userLanguage || 'en-US';

  // Check locale format
  if (locale.startsWith('en-US')) {
    return DATE_FORMATS.US;
  } else if (
    locale.startsWith('en-GB') ||
    locale.startsWith('en-IE') ||
    locale.startsWith('en-AU') ||
    locale.startsWith('en-IN') ||
    locale.startsWith('en-NZ') ||
    locale.startsWith('en-ZA') ||
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

export const DateFormatSection = () => {
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

  // Auto-detect and save format if not already set or invalid
  let currentFormat = SettingsService.getSetting('dateFormat');
  const validFormats = [DATE_FORMATS.US, DATE_FORMATS.EU, DATE_FORMATS.ISO];

  if (!currentFormat || !validFormats.includes(currentFormat)) {
    currentFormat = detectDateFormat();
    try {
      SettingsService.saveSetting('dateFormat', currentFormat);
    } catch (error) {
      console.error('[DateFormatSection] Failed to save date format:', error);
      // Continue with detected format even if save fails
    }
  }

  // Display detected format (read-only)
  const infoRow = document.createElement('div');
  infoRow.className = 'date-format-info-row';

  const label = document.createElement('span');
  label.textContent = 'Auto-detected from device';
  label.className = 'date-format-label';

  const formatValue = document.createElement('span');
  const formatLabel =
    currentFormat === DATE_FORMATS.US
      ? 'MM/DD/YYYY'
      : currentFormat === DATE_FORMATS.EU
        ? 'DD/MM/YYYY'
        : 'YYYY-MM-DD';
  formatValue.textContent = formatLabel;
  formatValue.className = 'date-format-value';

  infoRow.appendChild(label);
  infoRow.appendChild(formatValue);
  section.appendChild(infoRow);

  // Add explanatory note
  const note = document.createElement('p');
  note.textContent =
    'Date format is automatically detected from your device settings for a seamless experience.';
  note.className = 'date-format-note';
  section.appendChild(note);

  return section;
};
