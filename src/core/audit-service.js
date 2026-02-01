/**
 * Audit logging service for sensitive operations
 * Tracks important security-related events for monitoring and compliance
 */
export class AuditService {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000; // Keep only last 1000 logs in memory
    this.logKey = 'blinkbudget_audit_logs';
    this.init();
  }

  /**
   * Initialize audit service and load existing logs
   */
  init() {
    try {
      const storedLogs = localStorage.getItem(this.logKey);
      if (storedLogs) {
        this.logs = JSON.parse(storedLogs);
        // Trim if we have too many logs
        if (this.logs.length > this.maxLogs) {
          this.logs = this.logs.slice(-this.maxLogs);
        }
      }
    } catch (error) {
      console.warn('Failed to load audit logs:', error);
      this.logs = [];
    }
  }

  /**
   * Log a sensitive operation
   * @param {string} action - The action performed
   * @param {Object} details - Additional details about the action
   * @param {string} userId - User ID if available
   * @param {string} severity - 'low', 'medium', 'high', 'critical'
   */
  log(action, details = {}, userId = null, severity = 'medium') {
    const logEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      action,
      details: this.sanitizeDetails(details),
      userId: userId || 'anonymous',
      severity,
      userAgent: navigator.userAgent,
      ip: this.getClientIP(),
      sessionId: this.getSessionId(),
    };

    this.logs.push(logEntry);

    // Trim logs if necessary
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Persist to localStorage
    this.persistLogs();

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log(`[AUDIT: ${severity.toUpperCase()}] ${action}`, logEntry);
    }

    // Send to remote logging service in production (if configured)
    if (import.meta.env.PROD && this.shouldSendToRemote(severity)) {
      this.sendToRemote(logEntry);
    }

    return logEntry.id;
  }

  /**
   * Generate a unique log ID
   */
  generateLogId() {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sanitize details to remove sensitive information
   * @param {Object} details - Raw details
   * @returns {Object} Sanitized details
   */
  sanitizeDetails(details) {
    const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'key'];
    const sanitized = { ...details };

    for (const key of sensitiveKeys) {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Get client IP (approximate)
   */
  getClientIP() {
    // In a real implementation, this would come from a server
    // For now, we'll use a placeholder
    return 'client_ip_unavailable';
  }

  /**
   * Get or create session ID
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('audit_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('audit_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Determine if log should be sent to remote service
   * @param {string} severity - Log severity
   * @returns {boolean}
   */
  shouldSendToRemote(severity) {
    return ['high', 'critical'].includes(severity);
  }

  /**
   * Send log to remote service (placeholder)
   * @param {Object} logEntry - Log entry to send
   */
  async sendToRemote(logEntry) {
    // In a real implementation, this would send to your logging service
    // For now, we'll just log it to console
    console.log('[REMOTE AUDIT]', logEntry);
  }

  /**
   * Persist logs to localStorage
   */
  persistLogs() {
    try {
      localStorage.setItem(this.logKey, JSON.stringify(this.logs));
    } catch (error) {
      console.warn('Failed to persist audit logs:', error);
      // If localStorage is full, remove oldest logs
      if (error.name === 'QuotaExceededError') {
        this.logs = this.logs.slice(-Math.floor(this.maxLogs / 2));
        try {
          localStorage.setItem(this.logKey, JSON.stringify(this.logs));
        } catch (retryError) {
          console.error(
            'Failed to persist audit logs even after cleanup:',
            retryError
          );
        }
      }
    }
  }

  /**
   * Get logs with optional filtering
   * @param {Object} filters - Filter options
   * @returns {Array} Filtered logs
   */
  getLogs(filters = {}) {
    let filteredLogs = [...this.logs];

    if (filters.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
    }

    if (filters.action) {
      filteredLogs = filteredLogs.filter(log => log.action === filters.action);
    }

    if (filters.severity) {
      filteredLogs = filteredLogs.filter(
        log => log.severity === filters.severity
      );
    }

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filteredLogs = filteredLogs.filter(
        log => new Date(log.timestamp) >= startDate
      );
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      filteredLogs = filteredLogs.filter(
        log => new Date(log.timestamp) <= endDate
      );
    }

    // Sort by timestamp (newest first)
    return filteredLogs.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
  }

  /**
   * Export logs for analysis
   * @param {Object} filters - Filter options
   * @returns {string} JSON string of logs
   */
  exportLogs(filters = {}) {
    const logs = this.getLogs(filters);
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
    localStorage.removeItem(this.logKey);
  }

  /**
   * Get audit statistics
   * @returns {Object} Audit statistics
   */
  getStatistics() {
    const stats = {
      totalLogs: this.logs.length,
      bySeverity: {},
      byAction: {},
      byUser: {},
      recentActivity: this.logs.slice(-10).reverse(),
    };

    for (const log of this.logs) {
      // Count by severity
      stats.bySeverity[log.severity] =
        (stats.bySeverity[log.severity] || 0) + 1;

      // Count by action
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;

      // Count by user
      stats.byUser[log.userId] = (stats.byUser[log.userId] || 0) + 1;
    }

    return stats;
  }
}

// Singleton instance
export const auditService = new AuditService();

// Convenience methods for common audit events
export const auditEvents = {
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILURE: 'login_failure',
  LOGOUT: 'logout',
  SIGNUP_SUCCESS: 'signup_success',
  SIGNUP_FAILURE: 'signup_failure',
  PASSWORD_RESET_REQUEST: 'password_reset_request',
  PASSWORD_RESET_SUCCESS: 'password_reset_success',
  DATA_EXPORT: 'data_export',
  DATA_IMPORT: 'data_import',
  DATA_DELETE: 'data_delete',
  SETTINGS_CHANGE: 'settings_change',
  SECURITY_VIOLATION: 'security_violation',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  CONFIGURATION_CHANGE: 'configuration_change',
  DATA_RECOVERY: 'data_recovery',
  DATA_INTEGRITY_CHECK: 'data_integrity_check',
};
