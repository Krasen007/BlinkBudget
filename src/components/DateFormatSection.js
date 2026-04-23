/**
 * Date Format Section Component
 * Allows manual selection of date format
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

export const DateFormatSection = ({ showAutoDetect = true, allowManualChange = false } = {}) => {
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
  if (showAutoDetect) {
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
  }

  // Add manual selection option
  if (allowManualChange) {
    const manualSection = document.createElement('div');
    manualSection.style.marginTop = SPACING.MD;
    manualSection.style.paddingTop = SPACING.MD;
    manualSection.style.borderTop = '1px solid var(--border)';

    const manualLabel = document.createElement('label');
    manualLabel.textContent = 'Manually select date format:';
    manualLabel.style.display = 'block';
    manualLabel.style.marginBottom = SPACING.SM;
    manualLabel.style.fontWeight = '500';

    const select = document.createElement('select');
    select.className = 'date-format-select';
    Object.assign(select.style, {
      width: '100%',
      padding: SPACING.SM,
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--color-border)',
      background: 'var(--color-surface)',
      color: 'var(--color-text-main)',
      fontSize: FONT_SIZES.BASE,
      cursor: 'pointer',
    });

    const formats = [
      { value: DATE_FORMATS.US, label: 'MM/DD/YYYY (US)' },
      { value: DATE_FORMATS.EU, label: 'DD/MM/YYYY (European)' },
      { value: DATE_FORMATS.ISO, label: 'YYYY-MM-DD (ISO)' },
    ];

    formats.forEach(format => {
      const option = document.createElement('option');
      option.value = format.value;
      option.textContent = format.label;
      if (format.value === currentFormat) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    select.addEventListener('change', () => {
      const newFormat = select.value;
      try {
        SettingsService.saveSetting('dateFormat', newFormat);
        console.log('[DateFormatSection] Date format changed to:', newFormat);
        // Dispatch event to notify other components
        window.dispatchEvent(
          new CustomEvent('date-format-changed', { detail: { format: newFormat } })
        );
      } catch (error) {
        console.error('[DateFormatSection] Failed to save date format:', error);
      }
    });

    manualSection.appendChild(manualLabel);
    manualSection.appendChild(select);
    section.appendChild(manualSection);
  }

  return section;
};
