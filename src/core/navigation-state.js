/**
 * Navigation State Management
 *
 * Manages navigation state persistence across views, including:
 * - User preferences during navigation
 * - Selected time period across views
 * - View-specific state preservation
 *
 * Requirements: 7.4
 */

import { safeJsonParse } from '../utils/security-utils.js';

export const NavigationState = {
  // State storage keys
  STATE_KEYS: {
    REPORTS_TIME_PERIOD: 'navigation_reports_time_period',
    REPORTS_CHART_TYPE: 'navigation_reports_chart_type',
    REPORTS_VIEW_PREFERENCES: 'navigation_reports_view_preferences',
    LAST_ACTIVE_VIEW: 'navigation_last_active_view',
    VIEW_HISTORY: 'navigation_view_history',
    DASHBOARD_CATEGORY_FILTER: 'navigation_dashboard_category_filter',
    DASHBOARD_TIME_PERIOD: 'navigation_dashboard_time_period',
  },

  /**
   * Save the current time period selection for reports
   * @param {Object} timePeriod - Time period object with startDate, endDate, type, label
   */
  saveTimePeriod(timePeriod) {
    try {
      if (!timePeriod || !timePeriod.startDate || !timePeriod.endDate) {
        console.warn('[NavigationState] Invalid timePeriod parameter');
        return;
      }

      if (
        !(timePeriod.startDate instanceof Date) ||
        !(timePeriod.endDate instanceof Date)
      ) {
        console.warn(
          '[NavigationState] startDate and endDate must be Date objects'
        );
        return;
      }

      const timePeriodData = {
        type: timePeriod.type,
        startDate: timePeriod.startDate.toISOString(),
        endDate: timePeriod.endDate.toISOString(),
        label: timePeriod.label,
        savedAt: new Date().toISOString(),
      };

      sessionStorage.setItem(
        this.STATE_KEYS.REPORTS_TIME_PERIOD,
        JSON.stringify(timePeriodData)
      );
    } catch (error) {
      console.error('[NavigationState] Failed to save time period:', error);
    }
  },
  /**
   * Restore the saved time period selection
   * @returns {Object|null} Restored time period object or null if none saved
   */
  restoreTimePeriod() {
    try {
      const savedData = sessionStorage.getItem(
        this.STATE_KEYS.REPORTS_TIME_PERIOD
      );
      if (!savedData) return null;

      const timePeriodData = safeJsonParse(savedData);

      // Validate the saved data
      if (!timePeriodData.startDate || !timePeriodData.endDate) {
        console.warn('[NavigationState] Invalid saved time period data');
        return null;
      }

      // Reconstruct the time period object
      const timePeriod = {
        type: timePeriodData.type,
        startDate: new Date(timePeriodData.startDate),
        endDate: new Date(timePeriodData.endDate),
        label: timePeriodData.label,
      };

      // Validate dates
      if (
        isNaN(timePeriod.startDate.getTime()) ||
        isNaN(timePeriod.endDate.getTime())
      ) {
        console.warn('[NavigationState] Invalid saved time period dates');
        return null;
      }

      return timePeriod;
    } catch (error) {
      console.error('[NavigationState] Failed to restore time period:', error);
      return null;
    }
  },

  /**
   * Save chart type preference for reports
   * @param {string} chartType - Chart type (pie, bar, line, etc.)
   */
  saveChartType(chartType) {
    try {
      sessionStorage.setItem(this.STATE_KEYS.REPORTS_CHART_TYPE, chartType);
    } catch (error) {
      console.error('[NavigationState] Failed to save chart type:', error);
    }
  },

  /**
   * Restore saved chart type preference
   * @returns {string|null} Saved chart type or null if none saved
   */
  restoreChartType() {
    try {
      const chartType = sessionStorage.getItem(
        this.STATE_KEYS.REPORTS_CHART_TYPE
      );
      return chartType;
    } catch (error) {
      console.error('[NavigationState] Failed to restore chart type:', error);
      return null;
    }
  },

  /**
   * Save view preferences for reports
   * @param {Object} preferences - View preferences object
   */
  saveViewPreferences(preferences) {
    try {
      if (!preferences || typeof preferences !== 'object') {
        console.warn('[NavigationState] Invalid preferences parameter');
        return;
      }

      const preferencesData = {
        ...preferences,
        savedAt: new Date().toISOString(),
      };

      sessionStorage.setItem(
        this.STATE_KEYS.REPORTS_VIEW_PREFERENCES,
        JSON.stringify(preferencesData)
      );
    } catch (error) {
      console.error(
        '[NavigationState] Failed to save view preferences:',
        error
      );
    }
  },

  /**
   * Restore saved view preferences
   * @returns {Object|null} Saved preferences or null if none saved
   */
  restoreViewPreferences() {
    try {
      const savedData = sessionStorage.getItem(
        this.STATE_KEYS.REPORTS_VIEW_PREFERENCES
      );
      if (!savedData) return null;

      const preferences = safeJsonParse(savedData);
      return preferences;
    } catch (error) {
      console.error(
        '[NavigationState] Failed to restore view preferences:',
        error
      );
      return null;
    }
  },

  /**
   * Track the last active view for navigation history
   * @param {string} viewName - Name of the current view
   */
  setLastActiveView(viewName) {
    try {
      const viewData = {
        view: viewName,
        timestamp: new Date().toISOString(),
      };

      sessionStorage.setItem(
        this.STATE_KEYS.LAST_ACTIVE_VIEW,
        JSON.stringify(viewData)
      );

      // Also update view history
      this.addToViewHistory(viewName);
    } catch (error) {
      console.error('[NavigationState] Failed to set last active view:', error);
    }
  },

  /**
   * Get the last active view
   * @returns {string|null} Last active view name or null
   */
  getLastActiveView() {
    try {
      const savedData = sessionStorage.getItem(
        this.STATE_KEYS.LAST_ACTIVE_VIEW
      );
      if (!savedData) return null;

      const viewData = safeJsonParse(savedData);
      return viewData.view;
    } catch (error) {
      console.error('[NavigationState] Failed to get last active view:', error);
      return null;
    }
  },

  /**
   * Add a view to the navigation history
   * @param {string} viewName - Name of the view to add
   */
  addToViewHistory(viewName) {
    try {
      const savedHistory = sessionStorage.getItem(this.STATE_KEYS.VIEW_HISTORY);
      let history = savedHistory ? safeJsonParse(savedHistory) : [];

      // Remove existing entry for this view to avoid duplicates
      history = history.filter(entry => entry.view !== viewName);

      // Add new entry at the beginning
      history.unshift({
        view: viewName,
        timestamp: new Date().toISOString(),
      });

      // Keep only last 10 entries
      history = history.slice(0, 10);

      sessionStorage.setItem(
        this.STATE_KEYS.VIEW_HISTORY,
        JSON.stringify(history)
      );
    } catch (error) {
      console.error('[NavigationState] Failed to add to view history:', error);
    }
  },

  /**
   * Get the navigation history
   * @returns {Array} Array of view history entries
   */
  getViewHistory() {
    try {
      const savedHistory = sessionStorage.getItem(this.STATE_KEYS.VIEW_HISTORY);
      return savedHistory ? safeJsonParse(savedHistory) : [];
    } catch (error) {
      console.error('[NavigationState] Failed to get view history:', error);
      return [];
    }
  },

  /**
   * Clear all navigation state (useful for logout or reset)
   */
  clearState() {
    try {
      Object.values(this.STATE_KEYS).forEach(key => {
        sessionStorage.removeItem(key);
      });
    } catch (error) {
      console.error(
        '[NavigationState] Failed to clear navigation state:',
        error
      );
    }
  },

  /**
   * Save dashboard filter state from Reports view
   * @param {Object} filterData - Filter data with category, timePeriod, and source
   */
  saveDashboardFilter(filterData) {
    try {
      if (!filterData || typeof filterData !== 'object') {
        console.warn('[NavigationState] Invalid filterData parameter');
        return;
      }

      // Validate that required category field exists and is valid
      if (
        !filterData.category ||
        typeof filterData.category !== 'string' ||
        filterData.category.trim() === ''
      ) {
        console.warn(
          '[NavigationState] Invalid or missing category field in filterData'
        );
        return;
      }

      const filterState = {
        ...filterData,
        savedAt: new Date().toISOString(),
      };

      sessionStorage.setItem(
        this.STATE_KEYS.DASHBOARD_CATEGORY_FILTER,
        JSON.stringify(filterState)
      );

      // Also save time period separately for easier access
      if (filterData.timePeriod) {
        this.saveDashboardTimePeriod(filterData.timePeriod);
      }
    } catch (error) {
      console.error(
        '[NavigationState] Failed to save dashboard filter:',
        error
      );
    }
  },

  /**
   * Restore dashboard filter state
   * @returns {Object|null} Saved filter data or null if none saved
   */
  restoreDashboardFilter() {
    try {
      const savedData = sessionStorage.getItem(
        this.STATE_KEYS.DASHBOARD_CATEGORY_FILTER
      );
      if (!savedData) return null;

      const filterData = safeJsonParse(savedData);

      // Validate saved data
      if (!filterData || !filterData.category) {
        console.warn('[NavigationState] Invalid saved dashboard filter data');
        return null;
      }

      return filterData;
    } catch (error) {
      console.error(
        '[NavigationState] Failed to restore dashboard filter:',
        error
      );
      return null;
    }
  },

  /**
   * Save dashboard time period context
   * @param {Object} timePeriod - Time period object
   */
  saveDashboardTimePeriod(timePeriod) {
    try {
      if (!timePeriod || !timePeriod.startDate || !timePeriod.endDate) {
        console.warn(
          '[NavigationState] Invalid timePeriod parameter for dashboard'
        );
        return;
      }

      const timePeriodData = {
        type: timePeriod.type,
        startDate:
          timePeriod.startDate instanceof Date
            ? timePeriod.startDate.toISOString()
            : timePeriod.startDate,
        endDate:
          timePeriod.endDate instanceof Date
            ? timePeriod.endDate.toISOString()
            : timePeriod.endDate,
        label: timePeriod.label,
        savedAt: new Date().toISOString(),
      };

      sessionStorage.setItem(
        this.STATE_KEYS.DASHBOARD_TIME_PERIOD,
        JSON.stringify(timePeriodData)
      );
    } catch (error) {
      console.error(
        '[NavigationState] Failed to save dashboard time period:',
        error
      );
    }
  },

  /**
   * Restore dashboard time period context
   * @returns {Object|null} Restored time period object or null if none saved
   */
  restoreDashboardTimePeriod() {
    try {
      const savedData = sessionStorage.getItem(
        this.STATE_KEYS.DASHBOARD_TIME_PERIOD
      );
      if (!savedData) return null;

      const timePeriodData = safeJsonParse(savedData);

      // Validate saved data
      if (!timePeriodData.startDate || !timePeriodData.endDate) {
        console.warn(
          '[NavigationState] Invalid saved dashboard time period data'
        );
        return null;
      }

      // Reconstruct time period object
      const timePeriod = {
        type: timePeriodData.type,
        startDate:
          timePeriodData.startDate instanceof Date
            ? timePeriodData.startDate
            : new Date(timePeriodData.startDate),
        endDate:
          timePeriodData.endDate instanceof Date
            ? timePeriodData.endDate
            : new Date(timePeriodData.endDate),
        label: timePeriodData.label,
      };

      // Validate dates
      if (
        isNaN(timePeriod.startDate.getTime()) ||
        isNaN(timePeriod.endDate.getTime())
      ) {
        console.warn(
          '[NavigationState] Invalid saved dashboard time period dates'
        );
        return null;
      }

      return timePeriod;
    } catch (error) {
      console.error(
        '[NavigationState] Failed to restore dashboard time period:',
        error
      );
      return null;
    }
  },

  /**
   * Clear dashboard filter state
   */
  clearDashboardFilter() {
    try {
      sessionStorage.removeItem(this.STATE_KEYS.DASHBOARD_CATEGORY_FILTER);
      sessionStorage.removeItem(this.STATE_KEYS.DASHBOARD_TIME_PERIOD);
    } catch (error) {
      console.error(
        '[NavigationState] Failed to clear dashboard filter:',
        error
      );
    }
  },

  /**
   * Get a summary of current navigation state (for debugging)
   * @returns {Object} Summary of current state
   */
  getStateSummary() {
    return {
      timePeriod: this.restoreTimePeriod(),
      chartType: this.restoreChartType(),
      viewPreferences: this.restoreViewPreferences(),
      lastActiveView: this.getLastActiveView(),
      viewHistory: this.getViewHistory(),
      dashboardFilter: this.restoreDashboardFilter(),
      dashboardTimePeriod: this.restoreDashboardTimePeriod(),
    };
  },

  /**
   * Initialize navigation state management
   * Sets up event listeners and initial state
   */
  init() {
    // Listen for page unload to save current state
  },
};
