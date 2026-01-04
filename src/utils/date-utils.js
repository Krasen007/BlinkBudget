/**
 * Date formatting utilities
 * Centralizes date formatting logic to eliminate duplication
 */

import { SettingsService } from '../core/settings-service.js';
import { DATE_FORMATS } from './constants.js';

/**
 * Format an ISO date string according to user's preferred format
 * @param {string} isoDate - ISO date string (YYYY-MM-DD)
 * @param {string} format - Optional format override (US, ISO, EU)
 * @returns {string} Formatted date string
 */
export const formatDate = (isoDate, format = null) => {
  if (!isoDate) return '';

  const [year, month, day] = isoDate.split('-');
  const dateFormat =
    format || SettingsService.getSetting('dateFormat') || DATE_FORMATS.DEFAULT;

  switch (dateFormat) {
    case DATE_FORMATS.ISO:
      return `${year}-${month}-${day}`;
    case DATE_FORMATS.EU:
      return `${day}/${month}/${year}`;
    case DATE_FORMATS.US:
    default:
      return `${month}/${day}/${year}`;
  }
};

/**
 * Format a Date object or ISO string for display in transaction lists
 * @param {string|Date} dateInput - ISO date string or Date object
 * @param {string} format - Optional format override
 * @returns {string} Formatted date string
 */
export const formatDateForDisplay = (dateInput, format = null) => {
  if (!dateInput) return '';

  let date;
  if (typeof dateInput === 'string') {
    date = new Date(dateInput);
  } else {
    date = dateInput;
  }

  const dateFormat =
    format || SettingsService.getSetting('dateFormat') || DATE_FORMATS.DEFAULT;

  if (dateFormat === DATE_FORMATS.ISO) {
    return date.toISOString().split('T')[0];
  }
  if (dateFormat === DATE_FORMATS.EU) {
    return date.toLocaleDateString('en-GB');
  }
  return date.toLocaleDateString('en-US');
};

/**
 * Get today's date as ISO string (YYYY-MM-DD)
 * @returns {string} Today's date in ISO format
 */
export const getTodayISO = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Get first day of current month as ISO string
 * @returns {string} First day of month in ISO format
 */
export const getFirstDayOfMonthISO = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  return firstDay.toISOString().split('T')[0];
};

/**
 * Convert Date object to ISO string (YYYY-MM-DD)
 * @param {Date} date - Date object
 * @returns {string} ISO date string
 */
export const dateToISO = date => {
  if (!date) return '';
  return date.toISOString().split('T')[0];
};
