/**
 * Privacy Service - Data Minimization and Privacy Controls
 *
 * Implements GDPR data minimization principles and privacy controls
 */

import { auditService, auditEvents } from './audit-service.js';

export const PrivacyService = {
  // Privacy settings key
  PRIVACY_SETTINGS_KEY: 'blinkbudget_privacy_settings',

  // Default privacy settings
  defaultSettings: {
    dataRetention: {
      transactions: 365, // days
      auditLogs: 90, // days
      analytics: 30, // days
    },
    consent: {
      analytics: false,
      marketing: false,
      crashReporting: true,
      featureUsage: false,
    },
    dataMinimization: {
      excludeOptionalMetadata: true,
      anonymizeAnalytics: true,
      limitDataCollection: true,
    },
    privacyMode: 'standard', // 'standard', 'enhanced', 'minimal'
  },

  /**
   * Initialize privacy service
   */
  init() {
    this.ensurePrivacySettings();
    this.setupDataRetentionCleanup();
  },

  /**
   * Get current privacy settings
   */
  getPrivacySettings() {
    try {
      const settings = localStorage.getItem(this.PRIVACY_SETTINGS_KEY);
      return settings
        ? { ...this.defaultSettings, ...JSON.parse(settings) }
        : { ...this.defaultSettings };
    } catch (error) {
      console.warn('Failed to load privacy settings:', error);
      return { ...this.defaultSettings };
    }
  },

  /**
   * Update privacy settings
   */
  updatePrivacySettings(newSettings) {
    try {
      const currentSettings = this.getPrivacySettings();
      const updatedSettings = { ...currentSettings, ...newSettings };

      localStorage.setItem(
        this.PRIVACY_SETTINGS_KEY,
        JSON.stringify(updatedSettings)
      );

      // Audit privacy setting changes
      auditService.log(
        auditEvents.SETTINGS_CHANGE,
        {
          settingType: 'privacy',
          changes: Object.keys(newSettings),
          newSettings: updatedSettings,
        },
        null,
        'medium'
      );

      return updatedSettings;
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
      throw error;
    }
  },

  /**
   * Ensure privacy settings exist
   */
  ensurePrivacySettings() {
    try {
      const existing = localStorage.getItem(this.PRIVACY_SETTINGS_KEY);
      if (!existing) {
        localStorage.setItem(
          this.PRIVACY_SETTINGS_KEY,
          JSON.stringify(this.defaultSettings)
        );
      }
    } catch (error) {
      console.warn('Failed to ensure privacy settings:', error);
    }
  },

  /**
   * Get consent for a specific purpose
   */
  getConsent(purpose) {
    const settings = this.getPrivacySettings();
    return settings.consent[purpose] || false;
  },

  /**
   * Update consent for a specific purpose
   */
  updateConsent(purpose, granted) {
    const settings = this.getPrivacySettings();
    settings.consent[purpose] = granted;
    return this.updatePrivacySettings(settings);
  },

  /**
   * Check if data minimization is enabled
   */
  isDataMinimizationEnabled() {
    const settings = this.getPrivacySettings();
    return settings.dataMinimization.limitDataCollection;
  },

  /**
   * Sanitize data for storage (remove unnecessary fields)
   */
  sanitizeDataForStorage(data, dataType) {
    if (!this.isDataMinimizationEnabled()) {
      return data;
    }

    const settings = this.getPrivacySettings();
    const sanitized = { ...data };

    switch (dataType) {
      case 'transaction':
        // Remove optional metadata if enabled
        if (settings.dataMinimization.excludeOptionalMetadata) {
          if (sanitized.timestamp) {
            // Keep hour precision for ordering, remove minutes/seconds
            const d = new Date(sanitized.timestamp);
            d.setMinutes(0, 0, 0);
            sanitized.timestamp = d.toISOString();
          }
          sanitized.timestamp = new Date(sanitized.timestamp)
            .toISOString()
            .split('T')[0];
        }
        break;

      case 'audit':
        // Anonymize analytics data if enabled
        if (settings.dataMinimization.anonymizeAnalytics) {
          delete sanitized.userAgent;
          delete sanitized.ip;
          sanitized.userId = sanitized.userId
            ? `hashed_${this.hashUserId(sanitized.userId)}`
            : 'anonymous';
        }
        break;
    }

    return sanitized;
  },

  /**
   * Hash user ID for anonymization
   */
  hashUserId(userId) {
    // Simple hash for demo - in production, use proper cryptographic hashing
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  },

  /**
   * Setup automatic data retention cleanup
   */
  setupDataRetentionCleanup() {
    // Run cleanup daily
    const lastCleanup = localStorage.getItem('blinkbudget_last_cleanup');
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    if (!lastCleanup || now - parseInt(lastCleanup) > oneDay) {
      this.performDataRetentionCleanup();
      localStorage.setItem('blinkbudget_last_cleanup', now.toString());
    }
  },

  /**
   * Perform data retention cleanup
   */
  performDataRetentionCleanup() {
    const settings = this.getPrivacySettings();
    const cutoffDate = new Date();

    try {
      // Clean old transactions
      cutoffDate.setDate(
        cutoffDate.getDate() - settings.dataRetention.transactions
      );
      this.cleanupOldData('blinkbudget_transactions', cutoffDate);

      // Clean old audit logs
      cutoffDate.setDate(
        cutoffDate.getDate() - settings.dataRetention.auditLogs
      );
      this.cleanupOldData('blinkbudget_audit_logs', cutoffDate);

      // Clean old analytics data
      cutoffDate.setDate(
        cutoffDate.getDate() - settings.dataRetention.analytics
      );
      this.cleanupOldData('blinkbudget_analytics', cutoffDate);

      auditService.log(
        auditEvents.DATA_DELETE,
        {
          operation: 'retention_cleanup',
          timestamp: new Date().toISOString(),
        },
        null,
        'low'
      );
    } catch (error) {
      console.error('Data retention cleanup failed:', error);
      auditService.log(
        auditEvents.DATA_INTEGRITY_CHECK,
        {
          operation: 'retention_cleanup_failed',
          error: error.message,
        },
        null,
        'medium'
      );
    }
  },

  /**
   * Cleanup old data from localStorage
   */
  cleanupOldData(storageKey, cutoffDate) {
    try {
      const data = localStorage.getItem(storageKey);
      if (!data) return;

      const parsed = JSON.parse(data);
      let cleaned;

      if (Array.isArray(parsed)) {
        cleaned = parsed.filter(item => {
          const itemDate = new Date(
            item.timestamp || item.createdAt || item.date
          );
          return itemDate >= cutoffDate;
        });
      } else {
        // Handle object data
        cleaned = parsed;
      }

      if (JSON.stringify(cleaned) !== data) {
        localStorage.setItem(storageKey, JSON.stringify(cleaned));
      }
    } catch (error) {
      console.warn(`Failed to cleanup ${storageKey}:`, error);
    }
  },

  /**
   * Get privacy dashboard data
   */
  getPrivacyDashboard() {
    const settings = this.getPrivacySettings();

    return {
      settings,
      dataSummary: this.getDataSummary(),
      retentionStatus: this.getRetentionStatus(),
      consentStatus: settings.consent,
      lastCleanup: localStorage.getItem('blinkbudget_last_cleanup'),
    };
  },

  /**
   * Get data summary for privacy dashboard
   */
  getDataSummary() {
    const summary = {
      transactions: 0,
      auditLogs: 0,
      settings: 0,
      totalSize: 0,
    };

    try {
      // Count transactions
      const transactions = localStorage.getItem('blinkbudget_transactions');
      if (transactions) {
        const parsed = JSON.parse(transactions);
        summary.transactions = Array.isArray(parsed) ? parsed.length : 1;
        summary.totalSize += transactions.length;
      }

      // Count audit logs
      const auditLogs = localStorage.getItem('blinkbudget_audit_logs');
      if (auditLogs) {
        const parsed = JSON.parse(auditLogs);
        summary.auditLogs = Array.isArray(parsed) ? parsed.length : 1;
        summary.totalSize += auditLogs.length;
      }

      // Count settings
      const settingsKeys = Object.keys(localStorage).filter(
        key => key.includes('setting') || key.includes('config')
      );
      summary.settings = settingsKeys.length;
    } catch (error) {
      console.warn('Failed to generate data summary:', error);
    }

    return summary;
  },

  /**
   * Get retention status
   */
  getRetentionStatus() {
    const settings = this.getPrivacySettings();
    const lastCleanup = localStorage.getItem('blinkbudget_last_cleanup');

    return {
      enabled: true,
      lastCleanup: lastCleanup
        ? new Date(parseInt(lastCleanup)).toISOString()
        : null,
      retentionPeriods: settings.dataRetention,
      nextCleanup: lastCleanup
        ? new Date(parseInt(lastCleanup) + 24 * 60 * 60 * 1000).toISOString()
        : new Date().toISOString(),
    };
  },

  /**
   * Export user data (GDPR right to data portability)
   */
  exportUserData() {
    const exportData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {},
    };

    try {
      // Export all user data
      const storageKeys = Object.keys(localStorage).filter(
        key => key.startsWith('blinkbudget_') && !key.includes('auth')
      );

      for (const key of storageKeys) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            exportData.data[key] = JSON.parse(data);
          } catch {
            exportData.data[key] = data;
          }
        }
      }

      auditService.log(
        auditEvents.DATA_EXPORT,
        {
          dataType: 'user_data_export',
          keyCount: storageKeys.length,
          timestamp: new Date().toISOString(),
        },
        null,
        'medium'
      );

      return exportData;
    } catch (error) {
      console.error('Failed to export user data:', error);
      throw error;
    }
  },
};
