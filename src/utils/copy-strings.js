/**
 * Centralized copy strings for micro-copy and UI text
 * Part of Feature 3.5.1: Anti-Deterrent Design Elements
 */

export const COPY_STRINGS = {
  transaction: {
    takesOnlyThreeSeconds: 'Takes only 3 seconds',
    savedAutomatically: 'Saved automatically',
    noAccountNeeded: 'No account needed',
    transactionSaved: 'Transaction saved!',
    quickAmounts: 'Quick amounts',
    tapToUse: 'tap to use',
    quickAmount: 'Quick amount',
    advancedOptions: 'Advanced Options',
    notes: 'Notes (optional)',
  },
  reports: {
    dataStaysOnDevice: 'Your data stays on this device',
    updatedInRealTime: 'Updated in real-time',
    noDataYet: 'No transactions yet',
    addFirstTransaction: 'Add your first transaction to see insights',
  },
  settings: {
    dataIsEncrypted: 'Your data is encrypted',
    yourPrivacyMatters: 'Your privacy matters',
    dataStoredLocally: 'All data is stored locally on your device',
    exportComplete: 'Export complete',
    importComplete: 'Import complete',
    backupCreated: 'Backup created successfully',
  },
  general: {
    loading: 'Loading...',
    saving: 'Saving...',
    success: 'Success!',
    somethingWentWrong: 'Something went wrong. Please try again.',
    areYouSure: 'Are you sure?',
    nothingHereYet: 'Nothing here yet',
    getStarted: 'Get started by adding a transaction',
  },
  accessibility: {
    expandSection: 'Expand section',
    collapseSection: 'Collapse section',
    toggleAdvancedOptions: 'Toggle advanced options',
    quickAmount: 'Quick amount',
  },
};

export function getCopyString(path, params = {}) {
  const keys = path.split('.');
  let value = COPY_STRINGS;
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      console.warn(`Copy string not found: ${path}`);
      return path;
    }
  }
  if (typeof value === 'string' && Object.keys(params).length > 0) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey] !== undefined ? params[paramKey] : match;
    });
  }

  // Enforce returning only strings
  if (typeof value !== 'string') {
    console.warn(
      `Copy string resolved to non-string type ${typeof value} for path: ${path}`
    );
    return path;
  }

  return value;
}

export function getCopySection(section) {
  if (COPY_STRINGS[section]) {
    return COPY_STRINGS[section];
  }
  console.warn(`Copy section not found: ${section}`);
  return {};
}

export default COPY_STRINGS;
