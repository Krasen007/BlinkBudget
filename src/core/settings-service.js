/**
 * SettingsService
 *
 * Handles application settings and user preferences.
 */

import { STORAGE_KEYS } from '../utils/constants.js';
import { SyncService } from './sync-service.js';

const SETTINGS_KEY = STORAGE_KEYS.SETTINGS;

export const SettingsService = {
  /**
   * Get a specific setting
   * @param {string} key - Setting key
   * @returns {*} Setting value
   */
  getSetting(key) {
    const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    return settings[key];
  },

  /**
   * Save a specific setting
   * @param {string} key - Setting key
   * @param {*} value - Setting value
   */
  saveSetting(key, value) {
    const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    settings[key] = value;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    SyncService.pushToCloud(SETTINGS_KEY, settings);
  },

  /**
   * Get all settings
   * @returns {Object} Settings object
   */
  getAllSettings() {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  },
};
