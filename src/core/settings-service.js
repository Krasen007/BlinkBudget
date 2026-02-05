/**
 * SettingsService
 *
 * Handles application settings and user preferences.
 */

import { STORAGE_KEYS } from '../utils/constants.js';
import { SyncService } from './sync-service.js';
import { safeJsonParse } from '../utils/security-utils.js';

const SETTINGS_KEY = STORAGE_KEYS.SETTINGS;

export const SettingsService = {
  /**
   * Get a specific setting
   * @param {string} key - Setting key
   * @returns {*} Setting value
   */
  getSetting(key) {
    const settings = safeJsonParse(localStorage.getItem(SETTINGS_KEY) || '{}');
    return settings[key];
  },

  /**
   * Save a specific setting
   * @param {string} key - Setting key
   * @param {*} value - Setting value
   */
  saveSetting(key, value) {
    const settings = safeJsonParse(localStorage.getItem(SETTINGS_KEY) || '{}');
    settings[key] = value;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    SyncService.pushToCloud(SETTINGS_KEY, settings);

    // Dispatch event for UI re-renders
    window.dispatchEvent(
      new CustomEvent('storage-updated', { detail: { key: SETTINGS_KEY } })
    );
  },

  /**
   * Get all settings
   * @returns {Object} Settings object
   */
  getAllSettings() {
    const defaults = {
      lastBackupDate: null,
      lastBackupDataAsOf: null,
    };
    const stored = safeJsonParse(localStorage.getItem(SETTINGS_KEY) || '{}');
    return { ...defaults, ...stored };
  },
};
